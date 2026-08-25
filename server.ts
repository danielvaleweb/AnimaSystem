import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs, getDoc, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import fs from "fs";
import cors from "cors";
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

// Initialize Firebase using the config
const firebaseConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf8"));
const appFirebase = initializeApp(firebaseConfig);
const db = getFirestore(appFirebase, firebaseConfig.firestoreDatabaseId);

// Helper to build robust Asaas API URLs with proper base and query parameters
function getAsaasApiUrl(endpoint: string, queryParams?: Record<string, string | number | boolean | undefined>): string {
  let raw = (process.env.ASAAS_BASE_URL || "https://api-sandbox.asaas.com/v3").trim();
  // Strip single/double quotes and backticks
  raw = raw.replace(/^[`'"]+|[`'"]+$/g, "").trim();

  // If empty or invalid, fallback to official sandbox API
  if (!raw || (!raw.startsWith("http://") && !raw.startsWith("https://"))) {
    if (raw.includes("asaas.com")) {
      raw = `https://${raw}`;
    } else {
      raw = "https://api-sandbox.asaas.com/v3";
    }
  }

  // Remove trailing slashes
  raw = raw.replace(/\/+$/, "");

  // Guarantee /v3 is at the end of the base URL
  if (!raw.endsWith("/v3")) {
    if (!raw.includes("/v3")) {
      raw = `${raw}/v3`;
    }
  }

  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = new URL(`${raw}${cleanEndpoint}`);

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }

  return url.toString();
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Helper to normalize domains
  function cleanDomain(d: string): string {
    return d.toLowerCase()
      .replace(/^https?:\/\//i, '')
      .replace(/^www\./i, '')
      .replace(/\/.*$/, '')
      .trim();
  }

  // API Route to check client status by ID, domain or host
  app.get("/api/client-status", async (req, res) => {
    try {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");

      const { domain, id, client, host } = req.query;
      const targetId = (id || client) as string | undefined;
      const targetDomain = (domain || host) as string | undefined;

      const clientsRef = collection(db, "clients");
      let clientData: any = null;
      let clientDocId: string = "";

      // 1. Try to find by Firestore Document ID directly (getDoc)
      if (targetId && typeof targetId === "string" && targetId.trim() !== "") {
        const cleanId = targetId.trim();
        try {
          const directSnap = await getDoc(doc(db, "clients", cleanId));
          if (directSnap.exists()) {
            clientDocId = directSnap.id;
            clientData = directSnap.data();
          }
        } catch (e) {
          console.warn("Direct getDoc failed for id:", cleanId, e);
        }
      }

      // 2. If not found by direct getDoc, search across all clients by ID or domain / website
      if (!clientData) {
        try {
          const allClientsSnap = await getDocs(clientsRef);
          const normalizedTargetDomain = targetDomain ? cleanDomain(targetDomain) : '';
          const cleanTargetId = targetId ? targetId.trim().toLowerCase() : '';
          
          for (const docSnap of allClientsSnap.docs) {
            const d = docSnap.data();
            const curDocId = docSnap.id.toLowerCase();
            const curInternalId = d.id ? String(d.id).toLowerCase() : '';
            const docDomain = d.domain ? cleanDomain(d.domain) : '';
            const docWebsite = d.website ? cleanDomain(d.website) : '';
            
            // Match ID
            if (cleanTargetId && (curDocId === cleanTargetId || curInternalId === cleanTargetId)) {
              clientData = d;
              clientDocId = docSnap.id;
              break;
            }

            // Match Domain / Host
            if (normalizedTargetDomain && (
              (docDomain && (docDomain === normalizedTargetDomain || normalizedTargetDomain.includes(docDomain) || docDomain.includes(normalizedTargetDomain))) ||
              (docWebsite && (docWebsite === normalizedTargetDomain || normalizedTargetDomain.includes(docWebsite) || docWebsite.includes(normalizedTargetDomain)))
            )) {
              clientData = d;
              clientDocId = docSnap.id;
              break;
            }
          }
        } catch (errSearch) {
          console.error("Error searching all clients:", errSearch);
        }
      }

      if (!clientData) {
        return res.status(404).json({ 
          error: "Cliente não encontrado.", 
          suspended: false,
          active: true 
        });
      }

      const isSuspendedManual = clientData.status === 'suspended' || 
                                clientData.status === 'ended' || 
                                clientData.status === 'suspenso' || 
                                clientData.status === 'blocked' || 
                                clientData.suspended === true || 
                                clientData.isSuspended === true;

      // Calculate next renewal date
      let renewalDate: Date;
      if (clientData.nextRenewalDate && /^\d{4}-\d{2}-\d{2}/.test(clientData.nextRenewalDate)) {
        const [y, m, d] = clientData.nextRenewalDate.split('-').map(Number);
        renewalDate = new Date(y, m - 1, d);
      } else {
        const now = new Date();
        const dueDay = Number(clientData.dueDate) || 10;
        renewalDate = new Date(now.getFullYear(), now.getMonth(), dueDay);
        if (now.getDate() > dueDay + 7) {
          renewalDate.setMonth(renewalDate.getMonth() + 1);
        }
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const checkDate = new Date(renewalDate);
      checkDate.setHours(0, 0, 0, 0);
      const diffMs = checkDate.getTime() - today.getTime();
      const daysUntilRenewal = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      // Overdue & Tolerance logic:
      // If overdue (daysUntilRenewal < 0), tolerance is 7 days.
      // On the 8th day after due date (daysUntilRenewal <= -8), the site is automatically suspended.
      const isOverdue = daysUntilRenewal < 0;
      const overdueDays = isOverdue ? Math.abs(daysUntilRenewal) : 0;
      const toleranceRemaining = Math.max(0, 8 - overdueDays);
      const isAutoSuspended = daysUntilRenewal <= -8;
      const isSuspended = isSuspendedManual || isAutoSuspended;

      // Banner warning shows when 7 days before due date up to 7 days overdue (tolerance period)
      const showRenewalWarning = !isSuspended && (daysUntilRenewal <= 7 && daysUntilRenewal >= -7);
      const renewalDateFormatted = `${String(renewalDate.getDate()).padStart(2, '0')}/${String(renewalDate.getMonth() + 1).padStart(2, '0')}/${renewalDate.getFullYear()}`;

      const rawPlan = (clientData.plan || 'profissional').toLowerCase();
      const planSlug = rawPlan.includes('starter') ? 'starter' : rawPlan.includes('enterprise') ? 'enterprise' : 'pro';

      return res.json({
        id: clientDocId,
        clientName: clientData.name || "Cliente AnimaSystem",
        domain: clientData.domain || targetDomain || "",
        status: isSuspended ? "suspended" : (clientData.status || "active"),
        plan: clientData.plan || "Profissional",
        planSlug: planSlug,
        monthlyValue: clientData.monthlyValue || 149,
        suspended: isSuspended,
        isAutoSuspended: isAutoSuspended,
        isOverdue: isOverdue,
        overdueDays: overdueDays,
        toleranceRemaining: toleranceRemaining,
        showRenewalWarning: showRenewalWarning,
        daysUntilRenewal: daysUntilRenewal,
        nextRenewalDate: clientData.nextRenewalDate || `${renewalDate.getFullYear()}-${String(renewalDate.getMonth() + 1).padStart(2, '0')}-${String(renewalDate.getDate()).padStart(2, '0')}`,
        nextRenewalDateFormatted: renewalDateFormatted,
        phone: clientData.phone || clientData.companyPhone || "5524981000306",
        supportPhone: "5524981000306",
        message: isSuspended 
          ? (isAutoSuspended ? "Site suspenso automaticamente por atraso superior a 7 dias." : "Site suspenso por pendência contratual.") 
          : (showRenewalWarning ? (isOverdue ? `Seu plano venceu há ${overdueDays} dias. Evite suspensão do serviço!` : "Aviso de renovação de hospedagem ativo.") : "Site ativo e regular.")
      });

    } catch (error: any) {
      console.error("Erro em /api/client-status:", error);
      return res.status(500).json({ error: error.message, suspended: false });
    }
  });

  // Guard Script Serving Endpoint (/api/guard.js)
  app.get("/api/guard.js", (req, res) => {
    res.setHeader("Content-Type", "application/javascript; charset=utf-8");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");

    const script = `
(function() {
  // AnimaSystem Guard v2.1 - Client Protection & License Enforcer
  var currentScript = document.currentScript;
  if (!currentScript) {
    var scripts = document.getElementsByTagName('script');
    for (var i = scripts.length - 1; i >= 0; i--) {
      var s = scripts[i];
      var src = s.src || s.getAttribute('src') || '';
      if (src && src.indexOf('/api/guard.js') !== -1) {
        currentScript = s;
        break;
      }
    }
  }

  var scriptSrc = currentScript ? (currentScript.src || currentScript.getAttribute('src') || '') : '';
  var scriptUrl = null;
  try {
    scriptUrl = new URL(scriptSrc, window.location.href);
  } catch (e) {
    try {
      scriptUrl = new URL(scriptSrc);
    } catch(e2) {
      scriptUrl = new URL(window.location.href);
    }
  }

  var clientId = (typeof window.__ANIMASYSTEM_CLIENT_ID__ !== 'undefined' ? window.__ANIMASYSTEM_CLIENT_ID__ : '') ||
                 (typeof window.ANIMASYSTEM_CLIENT_ID !== 'undefined' ? window.ANIMASYSTEM_CLIENT_ID : '') ||
                 (currentScript && currentScript.dataset && currentScript.dataset.client ? currentScript.dataset.client : '') ||
                 (currentScript && currentScript.getAttribute && currentScript.getAttribute('data-client') ? currentScript.getAttribute('data-client') : '') ||
                 ((scriptUrl && scriptUrl.searchParams) ? (scriptUrl.searchParams.get('client') || scriptUrl.searchParams.get('id') || '') : '');

  var customDomain = (scriptUrl && scriptUrl.searchParams) ? (scriptUrl.searchParams.get('domain') || window.location.hostname) : window.location.hostname;
  var apiBase = (scriptUrl && scriptUrl.origin && scriptUrl.origin !== 'null' && scriptUrl.origin.indexOf('http') === 0) 
    ? scriptUrl.origin 
    : 'https://anima-system.vercel.app';

  function renderSuspensionScreen(data) {
    if (document.getElementById('animasystem-guard-lock')) return;

    var targetParent = document.body || document.documentElement;
    if (!targetParent) {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() { renderSuspensionScreen(data); });
      }
      return;
    }

    // Apply global lock styles
    if (!document.getElementById('animasystem-guard-styles')) {
      var style = document.createElement('style');
      style.id = 'animasystem-guard-styles';
      style.innerHTML = \`
        html, body {
          overflow: hidden !important;
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
          height: 100% !important;
          background: #000000 !important;
        }
        #animasystem-guard-lock {
          position: fixed !important;
          inset: 0 !important;
          top: 0 !important;
          left: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          background: #050505 !important;
          z-index: 2147483647 !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          justify-content: center !important;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
          color: #ffffff !important;
          padding: 24px !important;
          box-sizing: border-box !important;
          text-align: center !important;
          user-select: none !important;
          -webkit-font-smoothing: antialiased !important;
          overflow: hidden !important;
        }
        .as-glow-1 {
          position: absolute !important;
          top: -10% !important;
          left: -10% !important;
          width: 800px !important;
          height: 800px !important;
          background: radial-gradient(circle, rgba(215, 254, 3, 0.05) 0%, rgba(34, 197, 94, 0.02) 50%, transparent 75%) !important;
          border-radius: 50% !important;
          filter: blur(90px) !important;
          pointer-events: none !important;
          animation: asOrbMove1 4.5s ease-in-out infinite alternate !important;
        }
        .as-glow-2 {
          position: absolute !important;
          bottom: -15% !important;
          right: -10% !important;
          width: 850px !important;
          height: 850px !important;
          background: radial-gradient(circle, rgba(215, 254, 3, 0.05) 0%, rgba(34, 197, 94, 0.02) 45%, transparent 75%) !important;
          border-radius: 50% !important;
          filter: blur(100px) !important;
          pointer-events: none !important;
          animation: asOrbMove2 5s ease-in-out infinite alternate !important;
        }
        @keyframes asOrbMove1 {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(140px, -90px) scale(1.25); }
          100% { transform: translate(-90px, 120px) scale(0.9); }
        }
        @keyframes asOrbMove2 {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-130px, 100px) scale(1.3); }
          100% { transform: translate(100px, -80px) scale(0.88); }
        }
        .as-card {
          position: relative !important;
          z-index: 10 !important;
          max-width: 520px !important;
          width: 100% !important;
          background: transparent !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          gap: 18px !important;
          animation: asFadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards !important;
        }
        @keyframes asFadeIn {
          from { opacity: 0; transform: scale(0.96) translateY(12px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .as-logo-container {
          display: inline-flex !important;
          align-items: center !important;
          gap: 8px !important;
          padding: 8px 18px !important;
          background: rgba(255, 255, 255, 0.06) !important;
          border-radius: 9999px !important;
          border: 1px solid rgba(255, 255, 255, 0.12) !important;
          backdrop-filter: blur(12px) !important;
          margin-bottom: 4px !important;
        }
        .as-lightning-badge {
          width: 24px !important;
          height: 24px !important;
          background: #D7FE03 !important;
          border-radius: 50% !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          box-shadow: 0 0 12px rgba(215, 254, 3, 0.5) !important;
        }
        .as-gears-cluster {
          width: 106px !important;
          height: 100px !important;
          position: relative !important;
          color: #D7FE03 !important;
          filter: drop-shadow(0 0 22px rgba(215, 254, 3, 0.6)) !important;
          margin: 6px 0 !important;
        }
        .as-gear-1 {
          width: 62px !important;
          height: 62px !important;
          position: absolute !important;
          top: 0 !important;
          left: 6px !important;
          transform-origin: center center !important;
        }
        .as-gear-2 {
          width: 45px !important;
          height: 45px !important;
          position: absolute !important;
          bottom: 6px !important;
          right: 4px !important;
          transform-origin: center center !important;
        }
        .as-gear-3 {
          width: 37px !important;
          height: 37px !important;
          position: absolute !important;
          bottom: 0 !important;
          left: 18px !important;
          transform-origin: center center !important;
        }
        .as-gear-spin-cw {
          animation: asSpinCw 9s linear infinite !important;
        }
        .as-gear-spin-ccw {
          animation: asSpinCcw 6.75s linear infinite !important;
        }
        .as-gear-spin-cw-fast {
          animation: asSpinCw 5.4s linear infinite !important;
        }
        @keyframes asSpinCw {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes asSpinCcw {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
        .as-title {
          font-size: 28px !important;
          font-weight: 700 !important;
          letter-spacing: -0.03em !important;
          color: #ffffff !important;
          margin: 0 !important;
          line-height: 1.2 !important;
        }
        .as-subtitle {
          font-size: 14px !important;
          color: #a1a1aa !important;
          line-height: 1.5 !important;
          max-width: 440px !important;
          margin: 0 auto !important;
        }
        .as-btn {
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 8px !important;
          background: #D7FE03 !important;
          color: #000000 !important;
          font-weight: 700 !important;
          font-size: 14px !important;
          padding: 13px 32px !important;
          border-radius: 9999px !important;
          text-decoration: none !important;
          border: none !important;
          cursor: pointer !important;
          transition: all 0.25s ease !important;
          margin-top: 4px !important;
          box-shadow: 0 4px 20px rgba(215, 254, 3, 0.35), 0 0 35px rgba(215, 254, 3, 0.2) !important;
        }
        .as-btn:hover {
          background: #e5ff33 !important;
          transform: translateY(-2px) scale(1.02) !important;
          box-shadow: 0 6px 28px rgba(215, 254, 3, 0.55), 0 0 45px rgba(215, 254, 3, 0.4) !important;
        }
        .as-footer {
          margin-top: 20px !important;
          font-size: 11px !important;
          color: #71717a !important;
          letter-spacing: 0.05em !important;
          text-transform: uppercase !important;
        }
      \`;
      (document.head || document.documentElement).appendChild(style);
    }

    var container = document.createElement('div');
    container.id = 'animasystem-guard-lock';
    
    var clientName = data && data.clientName ? data.clientName : '';
    var rawPhone = (data && data.phone ? data.phone : '5524981000306').replace(/\\D/g, '');
    var encodedMsg = encodeURIComponent('Olá! Gostaria de falar com o suporte sobre meu site em manutenção.');
    var whatsappUrl = 'https://wa.me/' + (rawPhone || '5524981000306') + '?text=' + encodedMsg;

    container.innerHTML = \`
      <!-- Animated Green Glows -->
      <div class="as-glow-1"></div>
      <div class="as-glow-2"></div>

      <div class="as-card">
        <!-- Logo AnimaSystem com Raio -->
        <div class="as-logo-container">
          <div class="as-lightning-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            </svg>
          </div>
          <span style="font-size: 14px; font-weight: 600; letter-spacing: -0.01em; color: #ffffff;">
            <span style="color: #a1a1aa; font-weight: 400;">Anima</span>System
          </span>
        </div>

        <!-- Ícone de 3 Engrenagens Conectadas em Verde Neon #D7FE03 -->
        <div class="as-gears-cluster">
          <svg class="as-gear-1 as-gear-spin-cw" viewBox="0 0 100 100">
            <path fill="currentColor" fill-rule="evenodd" d="M 86.00 50.00 A 36 36 0 0 1 85.87 53.01 L 97.41 57.51 A 48 48 0 0 1 94.81 67.20 L 82.57 65.33 A 36 36 0 0 1 81.18 68.00 A 36 36 0 0 1 79.56 70.55 L 87.30 80.21 A 48 48 0 0 1 80.21 87.30 L 70.55 79.56 A 36 36 0 0 1 68.00 81.18 A 36 36 0 0 1 65.33 82.57 L 67.20 94.81 A 48 48 0 0 1 57.51 97.41 L 53.01 85.87 A 36 36 0 0 1 50.00 86.00 A 36 36 0 0 1 46.99 85.87 L 42.49 97.41 A 48 48 0 0 1 32.80 94.81 L 34.67 82.57 A 36 36 0 0 1 32.00 81.18 A 36 36 0 0 1 29.45 79.56 L 19.79 87.30 A 48 48 0 0 1 12.70 80.21 L 20.44 70.55 A 36 36 0 0 1 18.82 68.00 A 36 36 0 0 1 17.43 65.33 L 5.19 67.20 A 48 48 0 0 1 2.59 57.51 L 14.13 53.01 A 36 36 0 0 1 14.00 50.00 A 36 36 0 0 1 14.13 46.99 L 2.59 42.49 A 48 48 0 0 1 5.19 32.80 L 17.43 34.67 A 36 36 0 0 1 18.82 32.00 A 36 36 0 0 1 20.44 29.45 L 12.70 19.79 A 48 48 0 0 1 19.79 12.70 L 29.45 20.44 A 36 36 0 0 1 32.00 18.82 A 36 36 0 0 1 34.67 17.43 L 32.80 5.19 A 48 48 0 0 1 42.49 2.59 L 46.99 14.13 A 36 36 0 0 1 50.00 14.00 A 36 36 0 0 1 53.01 14.13 L 57.51 2.59 A 48 48 0 0 1 67.20 5.19 L 65.33 17.43 A 36 36 0 0 1 68.00 18.82 A 36 36 0 0 1 70.55 20.44 L 80.21 12.70 A 48 48 0 0 1 87.30 19.79 L 79.56 29.45 A 36 36 0 0 1 81.18 32.00 A 36 36 0 0 1 82.57 34.67 L 94.81 32.80 A 48 48 0 0 1 97.41 42.49 L 85.87 46.99 A 36 36 0 0 1 86.00 50.00 Z M 50 29 A 21 21 0 1 0 50 71 A 21 21 0 1 0 50 29 Z" />
          </svg>
          <svg class="as-gear-2 as-gear-spin-ccw" viewBox="0 0 100 100">
            <path fill="currentColor" fill-rule="evenodd" d="M 84.00 50.00 A 34 34 0 0 1 83.83 53.41 L 97.15 58.99 A 48 48 0 0 1 93.43 70.44 L 79.37 67.12 A 34 34 0 0 1 77.51 69.98 A 34 34 0 0 1 75.36 72.64 L 82.86 84.99 A 48 48 0 0 1 73.12 92.06 L 63.70 81.12 A 34 34 0 0 1 60.51 82.34 A 34 34 0 0 1 57.21 83.23 L 56.02 97.62 A 48 48 0 0 1 43.98 97.62 L 42.79 83.23 A 34 34 0 0 1 39.49 82.34 A 34 34 0 0 1 36.30 81.12 L 26.88 92.06 A 48 48 0 0 1 17.14 84.99 L 24.64 72.64 A 34 34 0 0 1 22.49 69.98 A 34 34 0 0 1 20.63 67.12 L 6.57 70.44 A 48 48 0 0 1 2.85 58.99 L 16.17 53.41 A 34 34 0 0 1 16.00 50.00 A 34 34 0 0 1 16.17 46.59 L 2.85 41.01 A 48 48 0 0 1 6.57 29.56 L 20.63 32.88 A 34 34 0 0 1 22.49 30.02 A 34 34 0 0 1 24.64 27.36 L 17.14 15.01 A 48 48 0 0 1 26.88 7.94 L 36.30 18.88 A 34 34 0 0 1 39.49 17.66 A 34 34 0 0 1 42.79 16.77 L 43.98 2.38 A 48 48 0 0 1 56.02 2.38 L 57.21 16.77 A 34 34 0 0 1 60.51 17.66 A 34 34 0 0 1 63.70 18.88 L 73.12 7.94 A 48 48 0 0 1 82.86 15.01 L 75.36 27.36 A 34 34 0 0 1 77.51 30.02 A 34 34 0 0 1 79.37 32.88 L 93.43 29.56 A 48 48 0 0 1 97.15 41.01 L 83.83 46.59 A 34 34 0 0 1 84.00 50.00 Z M 50 31 A 19 19 0 1 0 50 69 A 19 19 0 1 0 50 31 Z" />
          </svg>
          <svg class="as-gear-3 as-gear-spin-cw-fast" viewBox="0 0 100 100">
            <path fill="currentColor" fill-rule="evenodd" d="M 82.00 50.00 A 32 32 0 0 1 81.75 54.01 L 96.67 61.21 A 48 48 0 0 1 90.93 75.08 L 75.28 69.61 A 32 32 0 0 1 72.63 72.63 A 32 32 0 0 1 69.61 75.28 L 75.08 90.93 A 48 48 0 0 1 61.21 96.67 L 54.01 81.75 A 32 32 0 0 1 50.00 82.00 A 32 32 0 0 1 45.99 81.75 L 38.79 96.67 A 48 48 0 0 1 24.92 90.93 L 30.39 75.28 A 32 32 0 0 1 27.37 72.63 A 32 32 0 0 1 24.72 69.61 L 9.07 75.08 A 48 48 0 0 1 3.33 61.21 L 18.25 54.01 A 32 32 0 0 1 18.00 50.00 A 32 32 0 0 1 18.25 45.99 L 3.33 38.79 A 48 48 0 0 1 9.07 24.92 L 24.72 30.39 A 32 32 0 0 1 27.37 27.37 A 32 32 0 0 1 30.39 24.72 L 24.92 9.07 A 48 48 0 0 1 38.79 3.33 L 45.99 18.25 A 32 32 0 0 1 50.00 18.00 A 32 32 0 0 1 54.01 18.25 L 61.21 3.33 A 48 48 0 0 1 75.08 9.07 L 69.61 24.72 A 32 32 0 0 1 72.63 27.37 A 32 32 0 0 1 75.28 30.39 L 90.93 24.92 A 48 48 0 0 1 96.67 38.79 L 81.75 45.99 A 32 32 0 0 1 82.00 50.00 Z M 50 33 A 17 17 0 1 0 50 67 A 17 17 0 1 0 50 33 Z" />
          </svg>
        </div>

        <!-- Título em Branco -->
        <h1 class="as-title">Site em Manutenção</h1>

        <!-- Mensagem técnica elegante -->
        <p class="as-subtitle">
          Este site encontra-se temporariamente em manutenção preventiva para atualização de recursos e estabilidade dos serviços.
        </p>

        <!-- Botão Suporte WhatsApp em #D7FE03 -->
        <a href="\` + whatsappUrl + \`" target="_blank" rel="noopener noreferrer" class="as-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
          </svg>
          <span>Falar com o Suporte</span>
        </a>

        <!-- Rodapé Discreto -->
        <div class="as-footer">
          AnimaSystem • Sistemas personalizados para seu negócio!
        </div>
      </div>
    \`;

    targetParent.appendChild(container);
    document.title = "Site em Manutenção - AnimaSystem";

    // MutationObserver to protect against inspect-element removal
    try {
      var observer = new MutationObserver(function() {
        if (!document.getElementById('animasystem-guard-lock')) {
          var p = document.body || document.documentElement;
          if (p) p.appendChild(container);
        }
      });
      observer.observe(document.body || document.documentElement, { childList: true, subtree: true });
    } catch(e) {}
  }

  function renderRenewalBanner(data) {
    var path = window.location.pathname.toLowerCase();
    var isAdmin = path.indexOf('/admin') !== -1 || path.indexOf('/wp-admin') !== -1 || path.indexOf('/painel') !== -1 || path.indexOf('/dashboard') !== -1 || path.indexOf('/login') !== -1;
    if (!isAdmin) return;

    if (document.getElementById('animasystem-renewal-banner')) return;

    var bannerStyle = document.createElement('style');
    bannerStyle.id = 'animasystem-renewal-styles';
    bannerStyle.innerHTML = \`
      #animasystem-renewal-banner {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        width: 100% !important;
        z-index: 2147483640 !important;
        background: linear-gradient(90deg, #dc2626 0%, #b91c1c 100%) !important;
        color: #ffffff !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
        box-shadow: 0 4px 16px rgba(220, 38, 38, 0.45), 0 1px 3px rgba(0,0,0,0.2) !important;
        border-bottom: 1px solid rgba(255, 255, 255, 0.25) !important;
        box-sizing: border-box !important;
        padding: 9px 16px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        gap: 12px !important;
        animation: asBannerSlideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards !important;
      }
      @keyframes asBannerSlideDown {
        from { transform: translateY(-100%); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      .as-renew-content {
        display: flex !important;
        align-items: center !important;
        gap: 10px !important;
        flex: 1 !important;
        min-width: 0 !important;
      }
      .as-renew-icon {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        width: 26px !important;
        height: 26px !important;
        background: rgba(255, 255, 255, 0.2) !important;
        border-radius: 50% !important;
        flex-shrink: 0 !important;
      }
      .as-renew-text {
        font-size: 13px !important;
        font-weight: 500 !important;
        color: #ffffff !important;
        line-height: 1.35 !important;
        text-shadow: 0 1px 2px rgba(0,0,0,0.2) !important;
      }
      .as-renew-text strong {
        font-weight: 800 !important;
        color: #ffffff !important;
      }
      .as-renew-btn {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 6px !important;
        background: #ffffff !important;
        color: #dc2626 !important;
        font-weight: 800 !important;
        font-size: 12.5px !important;
        text-transform: uppercase !important;
        letter-spacing: 0.04em !important;
        padding: 7px 18px !important;
        border-radius: 9999px !important;
        text-decoration: none !important;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2) !important;
        white-space: nowrap !important;
        cursor: pointer !important;
        flex-shrink: 0 !important;
        transition: all 0.2s ease !important;
      }
      .as-renew-btn:hover {
        background: #fef08a !important;
        color: #991b1b !important;
        transform: scale(1.04) !important;
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3) !important;
      }
      @media (max-width: 640px) {
        #animasystem-renewal-banner {
          flex-direction: column !important;
          align-items: flex-start !important;
          gap: 8px !important;
          padding: 10px 12px !important;
        }
        .as-renew-btn {
          width: 100% !important;
          padding: 8px 14px !important;
        }
      }
    \`;
    document.head.appendChild(bannerStyle);

    var days = (data && typeof data.daysUntilRenewal === 'number') ? data.daysUntilRenewal : 7;
    var overdueDays = (data && typeof data.overdueDays === 'number') ? data.overdueDays : (days < 0 ? Math.abs(days) : 0);
    var toleranceRemaining = (data && typeof data.toleranceRemaining === 'number') ? data.toleranceRemaining : Math.max(0, 8 - overdueDays);
    var dateFormatted = (data && data.nextRenewalDateFormatted) ? data.nextRenewalDateFormatted : '';

    var bannerText = '';
    if (days < 0) {
      // Overdue text: exactly as requested by user
      var overdueLabel = overdueDays === 1 ? '1 dia' : overdueDays + ' dias';
      var toleranceLabel = toleranceRemaining === 1 ? 'resta 1 dia' : 'restam ' + toleranceRemaining + ' dias';
      bannerText = '<strong>Seu plano venceu há ' + overdueLabel + '.</strong> Evite a suspensão do seu serviço! (' + toleranceLabel + ' de tolerância antes da suspensão automática).';
    } else if (days === 0) {
      bannerText = '<strong>Aviso de Vencimento:</strong> Seu plano vence hoje' + (dateFormatted ? ' (' + dateFormatted + ')' : '') + '! Evite a suspensão do seu serviço.';
    } else if (days === 1) {
      bannerText = '<strong>Aviso de Vencimento de Hospedagem:</strong> Falta apenas 1 dia para o vencimento' + (dateFormatted ? ' (' + dateFormatted + ')' : '') + '. Mantenha seu site ativo sem interrupção.';
    } else {
      bannerText = '<strong>Aviso de Vencimento de Hospedagem:</strong> Faltam ' + days + ' dias para o vencimento' + (dateFormatted ? ' (' + dateFormatted + ')' : '') + '. Mantenha seu site e serviços ativos.';
    }

    var planSlug = (data && data.planSlug) ? data.planSlug : 'pro';
    var targetClientParam = clientId || (data && data.id) || '';
    var checkoutHref = apiBase + '/checkout?plan=' + encodeURIComponent(planSlug) + '&isRenewal=true&renov=true&client=' + encodeURIComponent(targetClientParam);

    var banner = document.createElement('div');
    banner.id = 'animasystem-renewal-banner';
    banner.innerHTML = \`
      <div class="as-renew-content">
        <div class="as-renew-icon">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        </div>
        <div class="as-renew-text">
          \` + bannerText + \`
        </div>
      </div>
      <a href="\` + checkoutHref + \`" target="_blank" rel="noopener noreferrer" class="as-renew-btn">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="5" width="20" height="14" rx="2"></rect>
          <line x1="2" y1="10" x2="22" y2="10"></line>
        </svg>
        Renovar Agora
      </a>
    \`;

    document.body.appendChild(banner);

    // Dynamically adjust body padding so top content is not cut off
    function adjustBodyPadding() {
      var h = banner.offsetHeight || 44;
      document.body.style.paddingTop = h + 'px';
    }
    adjustBodyPadding();
    window.addEventListener('resize', adjustBodyPadding);
  }

  function removeExistingElements() {
    var existingLock = document.getElementById('animasystem-guard-lock');
    if (existingLock) existingLock.remove();
    var existingBanner = document.getElementById('animasystem-renewal-banner');
    if (existingBanner) existingBanner.remove();
    if (document.body) document.body.style.paddingTop = '';

    // Forcefully hide any banner that might be injected late by old standalone scripts
    if (!document.getElementById('animasystem-force-hide-banner')) {
      var style = document.createElement('style');
      style.id = 'animasystem-force-hide-banner';
      style.innerHTML = '#animasystem-renewal-banner { display: none !important; opacity: 0 !important; pointer-events: none !important; }';
      document.head.appendChild(style);
    }
  }

  function checkStatus() {
    var checkUrl = apiBase + '/api/client-status?id=' + encodeURIComponent(clientId) + '&domain=' + encodeURIComponent(customDomain) + '&host=' + encodeURIComponent(window.location.hostname);
    
    fetch(checkUrl, { method: 'GET', mode: 'cors' })
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (data && (data.suspended === true || data.status === 'suspended' || data.status === 'ended')) {
          var banner = document.getElementById('animasystem-renewal-banner');
          if (banner) banner.remove();
          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
              renderSuspensionScreen(data);
            });
          } else {
            renderSuspensionScreen(data);
          }
        } else if (data && data.showRenewalWarning === true) {
          var lock = document.getElementById('animasystem-guard-lock');
          if (lock) lock.remove();
          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
              renderRenewalBanner(data);
            });
          } else {
            renderRenewalBanner(data);
          }
        } else {
          // Client is completely active and not in warning range
          removeExistingElements();
        }
      })
      .catch(function(err) {
        console.warn('[AnimaSystem Guard] License check completed.');
      });
  }

  // Execute check immediately
  checkStatus();

  // Forcefully protect public site from old standalone scripts injecting the banner
  var path = window.location.pathname.toLowerCase();
  var isAdmin = path.indexOf('/admin') !== -1 || path.indexOf('/wp-admin') !== -1 || path.indexOf('/painel') !== -1 || path.indexOf('/dashboard') !== -1 || path.indexOf('/login') !== -1;
  if (!isAdmin) {
    if (!document.getElementById('animasystem-force-hide-public')) {
      var style = document.createElement('style');
      style.id = 'animasystem-force-hide-public';
      style.innerHTML = '#animasystem-renewal-banner { display: none !important; opacity: 0 !important; pointer-events: none !important; }';
      document.head.appendChild(style);
    }
  }

  // Periodic polling every 30 seconds for immediate live unlock upon payment
  setInterval(checkStatus, 30000);
})();
    `;

    return res.send(script);
  });

  // Mercado Pago Create Payment
  app.post("/api/create-payment", async (req, res) => {
    try {
      const { clientId, amount, description, ownerId, clientName } = req.body;
      if (!amount || !description) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
        return res.status(500).json({ error: "Mercado Pago token not configured" });
      }

      const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });
      const preference = new Preference(client);

      const response = await preference.create({
        body: {
          items: [
            {
              id: clientId || "monthly-fee",
              title: description,
              quantity: 1,
              unit_price: Number(amount)
            }
          ],
          external_reference: JSON.stringify({ clientId, ownerId, clientName }),
          // notification_url: `${process.env.APP_URL}/api/webhook/mercadopago`, // Requires public HTTPS URL
        }
      });

      return res.json({ id: response.id, init_point: response.init_point });
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({ error: error.message });
    }
  });

  // Asaas Create Checkout & Customer API
  app.get("/api/asaas/create-checkout", (req, res) => {
    res.json({
      status: "ok",
      service: "AnimaSystem Asaas Checkout API",
      environment: process.env.ASAAS_BASE_URL?.includes("api.asaas.com") ? "production" : "sandbox",
      hasApiKey: !!process.env.ASAAS_API_KEY,
      message: "API operacional. Envie uma requisição POST com os dados do cliente e plano para gerar o checkout."
    });
  });

  app.post("/api/asaas/create-checkout", async (req, res) => {
    try {
      const { planId, items, coupon, customer, ownerId, userId, isRenewal, clientId, renewalMonths } = req.body;

      // 1. Resolve customer data from request or database
      let resolvedCustomer = { ...(customer || {}) };

      if (clientId && (!resolvedCustomer.name || !resolvedCustomer.email)) {
        try {
          const clientDocSnap = await getDoc(doc(db, "clients", clientId));
          if (clientDocSnap.exists()) {
            const cd = clientDocSnap.data();
            resolvedCustomer.name = resolvedCustomer.name || cd.responsible || cd.name || cd.companyRazaoSocial || "Cliente";
            resolvedCustomer.email = resolvedCustomer.email || cd.email || cd.companyEmail || "";
            resolvedCustomer.phone = resolvedCustomer.phone || cd.phone || cd.companyPhone || "";
            resolvedCustomer.cpf = resolvedCustomer.cpf || cd.cpf || cd.cnpj || cd.companyCnpj || "";
          }
        } catch (dbErr) {
          console.warn("Could not fetch client from Firestore:", dbErr);
        }
      }

      const customerName = (resolvedCustomer.name || resolvedCustomer.responsible || "").trim();
      if (!customerName) {
        return res.status(400).json({ error: "Falta a informação: Nome do Cliente / Razão Social. Verifique o cadastro do cliente." });
      }

      const ASAAS_API_KEY = (process.env.ASAAS_API_KEY || "").trim().replace(/^[`'"]+|[`'"]+$/g, "");
      if (!ASAAS_API_KEY) {
        console.error("ASAAS_API_KEY is not defined in environment variables.");
        return res.status(500).json({ error: "Integração Asaas não configurada no servidor (ASAAS_API_KEY ausente)." });
      }

      // 2. Sanitize customer data
      const rawCpf = (resolvedCustomer.cpf || resolvedCustomer.cnpj || "").replace(/\D/g, "");
      const cleanPhone = (resolvedCustomer.phone || "").replace(/\D/g, "");
      const cleanEmail = (resolvedCustomer.email || "").trim() || (rawCpf ? `cliente_${rawCpf}@animasystem.com.br` : `cliente_${Date.now()}@animasystem.com.br`);

      // Check if CPF is valid (11 digits, not all same digits) or CNPJ (14 digits)
      const isValidCpfCnpj = (rawCpf.length === 11 || rawCpf.length === 14) && !/^(\d)\1+$/.test(rawCpf);
      const cleanCpf = isValidCpfCnpj ? rawCpf : "";

      const asaasHeaders = {
        "access_token": ASAAS_API_KEY,
        "Content-Type": "application/json"
      };

      // 2. Identify or Create Customer in Asaas Sandbox
      let asaasCustomerId: string | null = null;
      try {
        const searchParams: Record<string, string> = {};
        if (cleanCpf) {
          searchParams.cpfCnpj = cleanCpf;
        } else if (cleanEmail && !cleanEmail.includes("@animasystem.com.br")) {
          searchParams.email = cleanEmail;
        }

        if (Object.keys(searchParams).length > 0) {
          const searchCustomerUrl = getAsaasApiUrl("/customers", searchParams);
          console.log(`[Asaas Sandbox] Searching customer: ${searchCustomerUrl}`);

          const searchCustomerRes = await fetch(searchCustomerUrl, {
            method: "GET",
            headers: asaasHeaders
          });

          if (searchCustomerRes.ok) {
            const searchData: any = await searchCustomerRes.json();
            if (searchData.data && searchData.data.length > 0) {
              asaasCustomerId = searchData.data[0].id;
              console.log(`[Asaas Sandbox] Existing customer found: ${asaasCustomerId}, syncing name: ${customerName}`);
              
              // Update customer on Asaas with current checkout details
              const updateCustomerUrl = getAsaasApiUrl(`/customers/${asaasCustomerId}`);
              const updatePayload: any = {
                name: customerName,
                email: cleanEmail
              };
              if (cleanPhone && cleanPhone.length >= 10) {
                updatePayload.mobilePhone = cleanPhone;
              }
              if (cleanCpf) {
                updatePayload.cpfCnpj = cleanCpf;
              }
              await fetch(updateCustomerUrl, {
                method: "POST",
                headers: asaasHeaders,
                body: JSON.stringify(updatePayload)
              }).catch(err => console.warn("Could not update Asaas customer details:", err));
            }
          }
        }
      } catch (err: any) {
        console.error("Error checking customer in Asaas:", err.message);
      }

      if (!asaasCustomerId) {
        const createCustomerUrl = getAsaasApiUrl("/customers");
        console.log(`[Asaas Sandbox] Creating new customer: ${createCustomerUrl}`);

        const newCustPayload: any = {
          name: customerName,
          email: cleanEmail,
          notificationDisabled: false
        };
        if (cleanPhone && cleanPhone.length >= 10) {
          newCustPayload.mobilePhone = cleanPhone;
          newCustPayload.phone = cleanPhone;
        }
        if (cleanCpf) {
          newCustPayload.cpfCnpj = cleanCpf;
        }

        let createCustomerRes = await fetch(createCustomerUrl, {
          method: "POST",
          headers: asaasHeaders,
          body: JSON.stringify(newCustPayload)
        });

        if (!createCustomerRes.ok) {
          const errData: any = await createCustomerRes.json().catch(() => ({}));
          console.error("Asaas create customer failed:", errData);
          
          // If failed due to cpfCnpj or invalid email format, retry with minimal safe payload
          if (newCustPayload.cpfCnpj || (errData.errors && errData.errors.some((e: any) => e.code === "invalid_cpfCnpj" || e.code === "invalid_email"))) {
            console.log("[Asaas Sandbox] Retrying customer creation with safe payload...");
            delete newCustPayload.cpfCnpj;
            createCustomerRes = await fetch(createCustomerUrl, {
              method: "POST",
              headers: asaasHeaders,
              body: JSON.stringify(newCustPayload)
            });
          }

          if (!createCustomerRes.ok) {
            const finalErr: any = await createCustomerRes.json().catch(() => ({}));
            const errorMsg = finalErr.errors?.[0]?.description || errData.errors?.[0]?.description || "Não foi possível registrar o cliente no Asaas.";
            return res.status(400).json({ error: errorMsg });
          }
        }

        const newCustomerData: any = await createCustomerRes.json();
        asaasCustomerId = newCustomerData.id;
        console.log(`[Asaas Sandbox] Customer created successfully: ${asaasCustomerId}`);
      }

      // 3. Catalogue & Price determination (Server-side authoritative pricing)
      const CATALOG: Record<string, { name: string; price: number; isSubscription: boolean }> = {
        starter: { name: "Plano Starter", price: 60.00, isSubscription: true },
        profissional: { name: "Plano Profissional", price: 149.00, isSubscription: true },
        pro: { name: "Plano Profissional", price: 149.00, isSubscription: true },
        enterprise: { name: "Plano Enterprise", price: 499.00, isSubscription: true },
        "suporte-24h": { name: "Suporte Técnico 24 Horas VIP", price: 50.00, isSubscription: true },
        "cloud-backup": { name: "Hospedagem Cloud Dedicada & Backup Diário", price: 39.90, isSubscription: true },
        "seo-ads": { name: "Otimização SEO Avançada & Google Ads Setup", price: 89.00, isSubscription: true }
      };

      const requestedItems = Array.isArray(items) && items.length > 0 
        ? items 
        : [{ id: planId || "profissional", quantity: 1 }];

      let subtotal = 0;
      const resolvedItems: Array<{ id: string; name: string; price: number; quantity: number }> = [];

      for (const item of requestedItems) {
        const product = CATALOG[item.id] || CATALOG[planId] || CATALOG.profissional;
        const qty = Math.max(1, Math.min(12, Number(item.quantity) || 1));
        const itemTotal = product.price * qty;
        subtotal += itemTotal;
        resolvedItems.push({
          id: item.id,
          name: product.name,
          price: product.price,
          quantity: qty
        });
      }

      // Coupon validation
      let discountPercent = 0;
      if (coupon) {
        const c = String(coupon).trim().toUpperCase();
        if (c === "ANIMA10" || c === "DESCONTO10") discountPercent = 10;
        else if (c === "VIP") discountPercent = 15;
      }

      const discountVal = (subtotal * discountPercent) / 100;
      const finalAmount = Math.max(5.00, subtotal - discountVal); // Asaas min value is 5.00 BRL

      // 4. Generate unique external reference
      const orderId = `order_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;
      const mainDescription = `Pedido ${orderId} - ${resolvedItems.map(i => i.name).join(" + ")}`;

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 3);
      const dueDateStr = dueDate.toISOString().split("T")[0];

      // 5. Create Asaas Checkout (Subscription or Payment with UNDEFINED billingType for PIX, Card & Boleto)
      let checkoutUrl = "";
      let asaasPaymentId: string | null = null;
      let asaasSubscriptionId: string | null = null;

      // Try creating recurring subscription first
      try {
        const createSubUrl = getAsaasApiUrl("/subscriptions");
        console.log(`[Asaas Sandbox] Creating subscription: ${createSubUrl}`);

        const subRes = await fetch(createSubUrl, {
          method: "POST",
          headers: asaasHeaders,
          body: JSON.stringify({
            customer: asaasCustomerId,
            billingType: "UNDEFINED",
            value: Number(finalAmount.toFixed(2)),
            nextDueDate: dueDateStr,
            cycle: "MONTHLY",
            description: mainDescription,
            externalReference: orderId
          })
        });

        if (subRes.ok) {
          const subData: any = await subRes.json();
          asaasSubscriptionId = subData.id;

          // Fetch the payment created for this subscription to get invoiceUrl
          const paymentsUrl = getAsaasApiUrl(`/subscriptions/${subData.id}/payments`);
          console.log(`[Asaas Sandbox] Fetching subscription payment: ${paymentsUrl}`);

          const paymentsRes = await fetch(paymentsUrl, {
            headers: asaasHeaders
          });

          if (paymentsRes.ok) {
            const pData: any = await paymentsRes.json();
            if (pData.data && pData.data.length > 0) {
              asaasPaymentId = pData.data[0].id;
              checkoutUrl = pData.data[0].invoiceUrl || pData.data[0].bankSlipUrl;
            }
          }
        }
      } catch (subErr: any) {
        console.warn("Could not create subscription on Asaas, falling back to direct payment:", subErr.message);
      }

      // If subscription didn't return invoiceUrl, create direct Asaas payment
      if (!checkoutUrl) {
        const createPaymentUrl = getAsaasApiUrl("/payments");
        console.log(`[Asaas Sandbox] Creating direct payment: ${createPaymentUrl}`);

        const payRes = await fetch(createPaymentUrl, {
          method: "POST",
          headers: asaasHeaders,
          body: JSON.stringify({
            customer: asaasCustomerId,
            billingType: "UNDEFINED",
            value: Number(finalAmount.toFixed(2)),
            dueDate: dueDateStr,
            description: mainDescription,
            externalReference: orderId,
            postalService: false
          })
        });

        if (!payRes.ok) {
          const errData: any = await payRes.json().catch(() => ({}));
          console.error("Asaas payment creation failed:", errData);
          const errorMsg = errData.errors?.[0]?.description || "Não foi possível gerar a fatura de pagamento no Asaas.";
          return res.status(400).json({ error: errorMsg });
        }

        const payData: any = await payRes.json();
        asaasPaymentId = payData.id;
        checkoutUrl = payData.invoiceUrl || payData.bankSlipUrl;
      }

      if (!checkoutUrl) {
        return res.status(500).json({ error: "URL de checkout do Asaas não foi gerada." });
      }

      // Ensure HTTPS protocol for checkoutUrl
      checkoutUrl = checkoutUrl.trim().replace(/^http:\/\//i, "https://");
      console.log(`[Asaas Sandbox] Generated checkout URL: ${checkoutUrl}`);

      // 6. Retrieve Asaas PIX QR Code if payment was created
      let asaasPixQrCode: string | null = null;
      let asaasPixCopyPaste: string | null = null;
      if (asaasPaymentId) {
        try {
          const pixQrUrl = getAsaasApiUrl(`/payments/${asaasPaymentId}/pixQrCode`);
          const pixRes = await fetch(pixQrUrl, { headers: asaasHeaders });
          if (pixRes.ok) {
            const pixData: any = await pixRes.json();
            asaasPixQrCode = pixData.encodedImage || null;
            asaasPixCopyPaste = pixData.payload || null;
            console.log(`[Asaas Sandbox] PIX QR Code generated for payment ${asaasPaymentId}`);
          }
        } catch (pixErr) {
          console.warn("Could not fetch Asaas PIX QR code:", pixErr);
        }
      }

      // 7. Record Order in Firestore
      const orderDoc = {
        orderId,
        userId: userId || null,
        productId: isRenewal ? "renovacao" : (planId || "profissional"),
        planId: planId || "profissional",
        isRenewal: !!isRenewal,
        clientId: clientId || null,
        renewalMonths: Number(renewalMonths || 1),
        items: resolvedItems,
        customerName,
        customerEmail: cleanEmail,
        customerPhone: cleanPhone,
        customerCpf: cleanCpf,
        asaasCustomerId,
        asaasPaymentId,
        asaasSubscriptionId,
        asaasPixQrCode,
        asaasPixCopyPaste,
        amount: Number(finalAmount.toFixed(2)),
        billingType: "UNDEFINED",
        status: "pending",
        externalReference: orderId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      try {
        await addDoc(collection(db, "orders"), orderDoc);
      } catch (firestoreErr) {
        console.error("Error saving order to Firestore:", firestoreErr);
      }

      // 8. Also record Lead in Firestore for CRM dashboard
      try {
        const effectiveOwnerUid = ownerId || "6rbybX9mBAMp8B6gS3zQ8rT0hW32";
        await addDoc(collection(db, "leads"), {
          ownerId: effectiveOwnerUid,
          name: customerName,
          phone: customer.phone || cleanPhone,
          cpf: cleanCpf,
          email: cleanEmail,
          company: resolvedItems.map(i => `${i.name} (x${i.quantity})`).join(" + "),
          status: "new",
          createdAt: new Date().toISOString(),
          message: `Checkout Asaas iniciado. Pedido: ${orderId}. Valor: R$ ${finalAmount.toFixed(2)}. CPF: ${cleanCpf}`
        });
      } catch (leadErr) {
        console.error("Error recording lead in Firestore:", leadErr);
      }

      // 9. Return secure safe response to frontend
      return res.json({
        success: true,
        checkoutUrl,
        orderId,
        asaasPaymentId,
        asaasCustomerId,
        pixQrCode: asaasPixQrCode,
        pixCopyPaste: asaasPixCopyPaste
      });

    } catch (error: any) {
      console.error("Error in Asaas checkout endpoint:", error);
      return res.status(500).json({ error: "Não foi possível iniciar o pagamento. Tente novamente." });
    }
  });

  // Direct Credit Card Payment Endpoint (Embedded in App - No redirection)
  app.post("/api/asaas/pay-credit-card", async (req, res) => {
    try {
      const { 
        orderId, 
        paymentId, 
        creditCard, 
        creditCardHolderInfo,
        installmentCount 
      } = req.body;

      if (!creditCard || !creditCard.number || !creditCard.holderName || !creditCard.expiryMonth || !creditCard.expiryYear || !creditCard.ccv) {
        return res.status(400).json({ error: "Por favor, preencha todos os dados do cartão de crédito." });
      }

      if (!orderId && !paymentId) {
        return res.status(400).json({ error: "Identificador do pedido/pagamento não fornecido." });
      }

      const ASAAS_API_KEY = (process.env.ASAAS_API_KEY || "").trim().replace(/^[`'"]+|[`'"]+$/g, "");
      if (!ASAAS_API_KEY) {
        return res.status(500).json({ error: "Chave Asaas não configurada no servidor." });
      }

      const asaasHeaders = {
        "Content-Type": "application/json",
        "access_token": ASAAS_API_KEY
      };

      // Retrieve order to get asaasPaymentId and customer details
      let targetPaymentId = paymentId;
      let orderDocSnap: any = null;
      let orderData: any = null;

      if (orderId) {
        const q = query(collection(db, "orders"), where("orderId", "==", orderId));
        const snap = await getDocs(q);
        if (!snap.empty) {
          orderDocSnap = snap.docs[0];
          orderData = orderDocSnap.data();
          targetPaymentId = targetPaymentId || orderData.asaasPaymentId;
        }
      }

      if (!targetPaymentId) {
        return res.status(400).json({ error: "Fatura do Asaas não encontrada para este pedido." });
      }

      // Format card details
      const cleanCardNumber = String(creditCard.number).replace(/\D/g, "");
      const cleanCcv = String(creditCard.ccv).replace(/\D/g, "");
      const expiryMonth = String(creditCard.expiryMonth).padStart(2, "0");
      let expiryYear = String(creditCard.expiryYear).trim();
      if (expiryYear.length === 2) expiryYear = `20${expiryYear}`;

      const holderCpfCnpj = (creditCardHolderInfo?.cpfCnpj || orderData?.customerCpf || "").replace(/\D/g, "");
      const holderPhone = (creditCardHolderInfo?.phone || creditCardHolderInfo?.mobilePhone || orderData?.customerPhone || "").replace(/\D/g, "");
      const holderEmail = (creditCardHolderInfo?.email || orderData?.customerEmail || "").trim();
      const holderPostalCode = (creditCardHolderInfo?.postalCode || "01310100").replace(/\D/g, "");
      const holderAddressNumber = creditCardHolderInfo?.addressNumber || "100";

      const cardPayload: any = {
        creditCard: {
          holderName: creditCard.holderName.trim(),
          number: cleanCardNumber,
          expiryMonth: expiryMonth,
          expiryYear: expiryYear,
          ccv: cleanCcv
        },
        creditCardHolderInfo: {
          name: creditCard.holderName.trim(),
          email: holderEmail || "cliente@animasystem.com.br",
          cpfCnpj: holderCpfCnpj || "00000000000",
          postalCode: holderPostalCode,
          addressNumber: holderAddressNumber,
          phone: holderPhone || "11999999999",
          mobilePhone: holderPhone || "11999999999"
        }
      };

      if (installmentCount && Number(installmentCount) > 1) {
        cardPayload.installmentCount = Number(installmentCount);
      }

      const payCardUrl = getAsaasApiUrl(`/payments/${targetPaymentId}/payWithCreditCard`);
      console.log(`[Asaas Sandbox] Processing direct credit card payment for: ${payCardUrl}`);

      const payCardRes = await fetch(payCardUrl, {
        method: "POST",
        headers: asaasHeaders,
        body: JSON.stringify(cardPayload)
      });

      const payCardData: any = await payCardRes.json().catch(() => ({}));

      if (!payCardRes.ok) {
        console.error("Asaas credit card payment failed:", payCardData);
        const errMsg = payCardData.errors?.[0]?.description || "O pagamento com cartão foi recusado pela operadora. Verifique os dados ou limite.";
        return res.status(400).json({ error: errMsg });
      }

      console.log("[Asaas Sandbox] Direct card payment success:", payCardData.status || "CONFIRMED");

      // Update Order document in Firestore
      if (orderDocSnap) {
        try {
          await updateDoc(doc(db, "orders", orderDocSnap.id), {
            status: "paid",
            asaasPaymentStatus: payCardData.status || "CONFIRMED",
            billingType: "CREDIT_CARD",
            paidAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });

          // Process into Dashboard & Clients
          await processConfirmedAsaasPayment(orderData, payCardData);
        } catch (dbErr) {
          console.error("Error updating order after card payment:", dbErr);
        }
      }

      return res.json({
        success: true,
        status: "paid",
        paymentId: targetPaymentId,
        orderId: orderId || orderData?.orderId
      });

    } catch (err: any) {
      console.error("Error processing embedded credit card payment:", err);
      return res.status(500).json({ error: err.message || "Erro ao processar cartão de crédito. Tente novamente." });
    }
  });

  // Helper to recognize and process a confirmed Asaas payment in Dashboard, Clients, Leads, and Transactions
  async function processConfirmedAsaasPayment(orderData: any, paymentDetails?: any) {
    try {
      const ownerId = orderData.ownerId || "6rbybX9mBAMp8B6gS3zQ8rT0hW32";
      const amount = Number(orderData.amount || paymentDetails?.value || 0);
      const clientName = orderData.customerName || "Cliente Asaas";
      const planRaw = (orderData.planId || "profissional").toLowerCase();
      const planName: "Starter" | "Profissional" | "Enterprise" = 
        planRaw.includes("starter") ? "Starter" : planRaw.includes("enterprise") ? "Enterprise" : "Profissional";
      const todayStr = new Date().toISOString().split("T")[0];
      const paymentRefId = orderData.asaasPaymentId || paymentDetails?.id || orderData.orderId;

      // 1. Register 'entrada' in Transactions collection so Dashboard & Finance reflect immediately
      const transQ = query(
        collection(db, "transactions"),
        where("paymentId", "==", paymentRefId)
      );
      const transSnap = await getDocs(transQ);

      if (transSnap.empty) {
        await addDoc(collection(db, "transactions"), {
          ownerId,
          title: `Assinatura Plano ${planName} - Asaas`,
          type: "entrada",
          clientName,
          amount,
          date: todayStr,
          status: "paid",
          method: (paymentDetails?.billingType || orderData.billingType || "pix").toLowerCase(),
          gateway: "asaas",
          paymentId: paymentRefId,
          orderId: orderData.orderId,
          createdAt: serverTimestamp()
        });
        console.log(`[Asaas] Registered entrada in transactions: R$ ${amount} from ${clientName}`);
      }

      // 2. Create or Update Client in 'clients' collection
      let existingClientId: string | null = null;
      let existingClientData: any = null;

      // Check if direct clientId was provided
      if (orderData.clientId) {
        try {
          const directSnap = await getDoc(doc(db, "clients", orderData.clientId));
          if (directSnap.exists()) {
            existingClientId = directSnap.id;
            existingClientData = directSnap.data();
          }
        } catch (e) {}
      }

      if (!existingClientId && orderData.customerCpf) {
        const clientQ = query(
          collection(db, "clients"),
          where("cpf", "==", orderData.customerCpf)
        );
        const clientSnap = await getDocs(clientQ);
        if (!clientSnap.empty) {
          existingClientId = clientSnap.docs[0].id;
          existingClientData = clientSnap.docs[0].data();
        }
      }

      const renewalMonths = Number(orderData.renewalMonths || 1);
      const isRenewal = orderData.isRenewal === true || (orderData.productId && orderData.productId.includes('renov'));

      if (existingClientId) {
        // Calculate new renewal date
        let baseDate = new Date();
        if (existingClientData?.nextRenewalDate && /^\d{4}-\d{2}-\d{2}/.test(existingClientData.nextRenewalDate)) {
          const [y, m, d] = existingClientData.nextRenewalDate.split('-').map(Number);
          baseDate = new Date(y, m - 1, d);
        }
        baseDate.setMonth(baseDate.getMonth() + (isRenewal ? renewalMonths : 1));
        const newRenewalDateStr = `${baseDate.getFullYear()}-${String(baseDate.getMonth() + 1).padStart(2, '0')}-${String(baseDate.getDate()).padStart(2, '0')}`;

        await updateDoc(doc(db, "clients", existingClientId), {
          status: "active",
          plan: planName,
          monthlyValue: amount,
          nextRenewalDate: newRenewalDateStr,
          lastRenewalPaidAt: new Date().toISOString(),
          renewalMonthsPaid: (existingClientData?.renewalMonthsPaid || 0) + (isRenewal ? renewalMonths : 1),
          updatedAt: new Date().toISOString()
        });
        console.log(`[Asaas] Updated existing client ${existingClientId} - Renewal extended to ${newRenewalDateStr} (+${renewalMonths} months)`);
      } else {
        const cleanDomain = clientName.toLowerCase().replace(/[^a-z0-9]/g, "");
        const baseDate = new Date();
        baseDate.setMonth(baseDate.getMonth() + renewalMonths);
        const newRenewalDateStr = `${baseDate.getFullYear()}-${String(baseDate.getMonth() + 1).padStart(2, '0')}-${String(baseDate.getDate()).padStart(2, '0')}`;

        const newClientRef = await addDoc(collection(db, "clients"), {
          name: clientName,
          responsible: clientName,
          logoInitials: clientName.slice(0, 2).toUpperCase(),
          plan: planName,
          domain: `${cleanDomain || 'cliente'}.animasystem.com.br`,
          firebaseProjectId: "animasystem-client",
          monthlyValue: amount,
          dueDate: 10,
          status: "active",
          nextRenewalDate: newRenewalDateStr,
          lastRenewalPaidAt: new Date().toISOString(),
          renewalMonthsPaid: renewalMonths,
          cpf: orderData.customerCpf || "",
          phone: orderData.customerPhone || "",
          email: orderData.customerEmail || "",
          ownerId,
          hireDate: todayStr,
          createdAt: new Date().toISOString()
        });
        existingClientId = newClientRef.id;
        console.log(`[Asaas] Created new active client ${existingClientId} with nextRenewalDate: ${newRenewalDateStr}`);
      }

      // 3. Update Leads collection to converted
      if (orderData.customerCpf) {
        const leadQ = query(
          collection(db, "leads"),
          where("cpf", "==", orderData.customerCpf)
        );
        const leadSnap = await getDocs(leadQ);
        for (const leadDoc of leadSnap.docs) {
          await updateDoc(doc(db, "leads", leadDoc.id), {
            status: "converted",
            updatedAt: new Date().toISOString()
          });
        }
      }

      return existingClientId;
    } catch (err: any) {
      console.error("[Asaas] Error processing confirmed payment:", err);
      return null;
    }
  }

  // Check Order Status and Sync with Asaas Sandbox API
  app.get("/api/asaas/check-order", async (req, res) => {
    try {
      const { orderId } = req.query;
      if (!orderId || typeof orderId !== "string") {
        return res.status(400).json({ error: "Parâmetro orderId obrigatório." });
      }

      const q = query(collection(db, "orders"), where("orderId", "==", orderId));
      const snap = await getDocs(q);

      if (snap.empty) {
        return res.status(404).json({ error: "Pedido não encontrado." });
      }

      const orderDocSnap = snap.docs[0];
      const orderData = orderDocSnap.data();

      // If already marked as paid in Firestore
      if (orderData.status === "paid") {
        return res.json({
          status: "paid",
          orderId,
          customerName: orderData.customerName,
          amount: orderData.amount,
          planId: orderData.planId
        });
      }

      // Check with Asaas API
      const asaasApiKey = (process.env.ASAAS_API_KEY || "").trim().replace(/^[`'"]+|[`'"]+$/g, "");
      if (asaasApiKey && (orderData.asaasPaymentId || orderData.asaasSubscriptionId)) {
        const asaasHeaders = {
          "Content-Type": "application/json",
          "access_token": asaasApiKey
        };

        let paymentStatus: string | null = null;
        let paymentData: any = null;

        if (orderData.asaasPaymentId) {
          const checkPayUrl = getAsaasApiUrl(`/payments/${orderData.asaasPaymentId}`);
          const payRes = await fetch(checkPayUrl, { headers: asaasHeaders });
          if (payRes.ok) {
            paymentData = await payRes.json();
            paymentStatus = paymentData.status;
          }
        }

        if (!paymentStatus && orderData.asaasSubscriptionId) {
          const checkSubUrl = getAsaasApiUrl(`/subscriptions/${orderData.asaasSubscriptionId}/payments`);
          const subRes = await fetch(checkSubUrl, { headers: asaasHeaders });
          if (subRes.ok) {
            const subPayments = await subRes.json();
            if (subPayments.data && subPayments.data.length > 0) {
              paymentData = subPayments.data[0];
              paymentStatus = paymentData.status;
            }
          }
        }

        console.log(`[Asaas Sandbox] Real-time status for order ${orderId}: ${paymentStatus}`);

        // Statuses that represent confirmed payment in Asaas
        const confirmedStatuses = ["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH", "DUNNING_RECEIVED"];
        if (paymentStatus && confirmedStatuses.includes(paymentStatus)) {
          let clientId = null;
          try {
            // Update Order document to paid
            await updateDoc(doc(db, "orders", orderDocSnap.id), {
              status: "paid",
              asaasPaymentStatus: paymentStatus,
              billingType: paymentData?.billingType || orderData.billingType,
              paidAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });

            // Process into Dashboard & Clients
            clientId = await processConfirmedAsaasPayment(orderData, paymentData);
          } catch (syncErr) {
            console.error("Error updating Firestore on confirmed payment:", syncErr);
          }

          return res.json({
            status: "paid",
            orderId,
            clientId,
            customerName: orderData.customerName,
            amount: orderData.amount,
            planId: orderData.planId
          });
        }
      }

      return res.json({
        status: orderData.status || "pending",
        orderId
      });

    } catch (err: any) {
      console.warn("Transient error checking order status:", err.message);
      return res.json({ status: "pending", orderId: req.query.orderId });
    }
  });

  // Asaas Webhook Endpoint
  app.post("/api/webhook/asaas", async (req, res) => {
    try {
      const event = req.body;
      console.log(`[Asaas Webhook] Event received: ${event.event}`, event.payment?.id || "");

      const payment = event.payment;
      if (payment) {
        const confirmedEvents = ["PAYMENT_RECEIVED", "PAYMENT_CONFIRMED", "PAYMENT_RECEIVED_IN_CASH_UNDONE"];
        
        if (confirmedEvents.includes(event.event)) {
          // Locate order by externalReference, asaasPaymentId, or asaasSubscriptionId
          let orderDocSnap: any = null;

          if (payment.externalReference) {
            const q = query(collection(db, "orders"), where("orderId", "==", payment.externalReference));
            const snap = await getDocs(q);
            if (!snap.empty) orderDocSnap = snap.docs[0];
          }

          if (!orderDocSnap && payment.id) {
            const q = query(collection(db, "orders"), where("asaasPaymentId", "==", payment.id));
            const snap = await getDocs(q);
            if (!snap.empty) orderDocSnap = snap.docs[0];
          }

          if (!orderDocSnap && payment.subscription) {
            const q = query(collection(db, "orders"), where("asaasSubscriptionId", "==", payment.subscription));
            const snap = await getDocs(q);
            if (!snap.empty) orderDocSnap = snap.docs[0];
          }

          if (orderDocSnap) {
            const orderData = orderDocSnap.data();
            await updateDoc(doc(db, "orders", orderDocSnap.id), {
              status: "paid",
              asaasPaymentStatus: payment.status,
              billingType: payment.billingType,
              paidAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });

            await processConfirmedAsaasPayment(orderData, payment);
            console.log(`[Asaas Webhook] Order ${orderData.orderId} processed successfully.`);
          }
        }
      }

      res.status(200).json({ received: true });
    } catch (err: any) {
      console.error("[Asaas Webhook] Error processing webhook:", err);
      res.status(500).json({ error: "Erro interno no processamento do webhook." });
    }
  });

  // Mercado Pago Webhook (simulated if no public URL, or works if correctly set)
  app.post("/api/webhook/mercadopago", async (req, res) => {
    try {
      if (req.query.type === "payment" && req.query["data.id"]) {
        const paymentId = req.query["data.id"] as string;
        const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN! });
        const mercadopagoPayment = new Payment(client);
        
        const paymentInfo = await mercadopagoPayment.get({ id: paymentId });
        if (paymentInfo.status === "approved") {
           // Parse metadata/external_reference
           const externalRef = paymentInfo.external_reference;
           if (externalRef) {
             const data = JSON.parse(externalRef);
             // Salvar no Firebase
             await addDoc(collection(db, "transactions"), {
                ownerId: data.ownerId,
                type: "entrada",
                clientName: data.clientName,
                amount: paymentInfo.transaction_amount,
                date: new Date(paymentInfo.date_approved!).toISOString().split('T')[0],
                status: "paid",
                method: "pix",
                gateway: "mercadopago",
                paymentId: paymentInfo.id,
                createdAt: serverTimestamp()
             });
           }
        }
      }
      res.status(200).send("OK");
    } catch (error: any) {
      console.error("Webhook error:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  // Google Cloud Monitoring API for Client Metrics
  app.get("/api/client-metrics-gcp", async (req, res) => {
    try {
      const { projectId, clientName, startDate, endDate } = req.query;
      if (!projectId || typeof projectId !== "string") {
        return res.status(400).json({ error: "O parâmetro 'projectId' é obrigatório." });
      }

      // IMPORT monitoring directly inside the route to avoid crashing the server if the dependency isn't fully set up globally, but we did install it
      const monitoring = await import("@google-cloud/monitoring");
      
      // We assume credentials are automatically handled by GCP / GOOGLE_APPLICATION_CREDENTIALS
      let client;
      if (process.env.GCP_SERVICE_ACCOUNT_JSON) {
        try {
          const creds = JSON.parse(process.env.GCP_SERVICE_ACCOUNT_JSON);
          client = new monitoring.MetricServiceClient({
            credentials: {
              client_email: creds.client_email,
              private_key: creds.private_key,
            },
            projectId: creds.project_id
          });
        } catch (err) {
          console.error("Failed to parse GCP_SERVICE_ACCOUNT_JSON:", err);
          client = new monitoring.MetricServiceClient();
        }
      } else {
        client = new monitoring.MetricServiceClient();
      }
      
      const now = new Date();
      let startSecs, endSecs;
      if (startDate && typeof startDate === "string" && endDate && typeof endDate === "string") {
        startSecs = Math.floor(new Date(startDate).getTime() / 1000);
        endSecs = Math.floor(new Date(endDate).getTime() / 1000);
      } else {
        const startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        startSecs = Math.floor(startTime.getTime() / 1000);
        endSecs = Math.floor(now.getTime() / 1000);
      }

      const metricsToFetch = [
        { key: "reads_ops", filter: 'metric.type="firestore.googleapis.com/document/read_ops_count"', aligner: "ALIGN_SUM", reducer: "REDUCE_SUM" },
        { key: "reads_billable", filter: 'metric.type="firestore.googleapis.com/api/billable_read_units"', aligner: "ALIGN_SUM", reducer: "REDUCE_SUM" },
        { key: "writes_ops", filter: 'metric.type="firestore.googleapis.com/document/write_ops_count"', aligner: "ALIGN_SUM", reducer: "REDUCE_SUM" },
        { key: "writes_billable", filter: 'metric.type="firestore.googleapis.com/api/billable_write_units"', aligner: "ALIGN_SUM", reducer: "REDUCE_SUM" },
        { key: "realtime", filter: 'metric.type="firestore.googleapis.com/network/snapshot_listeners"', aligner: "ALIGN_MAX", reducer: "REDUCE_MAX" },
        { key: "realtime_billable", filter: 'metric.type="firestore.googleapis.com/api/billable_realtime_read_units"', aligner: "ALIGN_SUM", reducer: "REDUCE_SUM" },
        { key: "storageBytes", filter: 'metric.type="firestore.googleapis.com/storage/data_and_index_storage_bytes"', aligner: "ALIGN_MAX", reducer: "REDUCE_MAX" },
        { key: "cloudStorageBytes", filter: 'metric.type="storage.googleapis.com/storage/total_bytes"', aligner: "ALIGN_MAX", reducer: "REDUCE_NONE" },
        { key: "cloudStorageBytesV2", filter: 'metric.type="storage.googleapis.com/storage/v2/total_bytes"', aligner: "ALIGN_MAX", reducer: "REDUCE_NONE" }
      ];

      const results: any = {
        reads_ops: { value: 0, metric: "" },
        reads_billable: { value: 0, metric: "" },
        writes_ops: { value: 0, metric: "" },
        writes_billable: { value: 0, metric: "" },
        realtime: { value: 0, metric: "" },
        realtime_billable: { value: 0, metric: "" },
        storageBytes: { value: 0, metric: "" },
        cloudStorageBytes: { value: 0, metric: "" },
        cloudStorageBytesV2: { value: 0, metric: "" },
        debug: [],
        lastUpdated: new Date().toISOString()
      };

      const projectName = client.projectPath(projectId);

      for (const m of metricsToFetch) {
        results[m.key] = { value: 0, metric: m.filter };
        
        try {
          let durationSecs = endSecs - startSecs;
          if (durationSecs <= 0) durationSecs = 86400;

          const reqObj = {
            name: projectName,
            filter: m.filter,
            interval: {
              startTime: { seconds: startSecs },
              endTime: { seconds: endSecs },
            },
            aggregation: {
              alignmentPeriod: { seconds: Math.max(60, durationSecs) },
              perSeriesAligner: m.aligner,
              crossSeriesReducer: m.reducer,
            },
            view: "FULL"
          };

          const startMs = Date.now();

          // ==== EXECUTING LOG BEFORE CLOUD MONITORING API CALL ====
          console.log("\n--------------------------------------------------------------");
          console.log("CHAMADA À CLOUD MONITORING API");
          console.log(` Confirmar Project ID: ${projectId}`);
          console.log(` Confirmar Project Number: (resolvido implicitamente pelo IAM)`);
          console.log(` Confirmar Billing Project: ${projectId}`);
          console.log(` Confirmar Quota Project: ${projectId}`);
          console.log(` Nome da métrica: ${m.key}`);
          console.log(` Resource name enviado para a API: ${projectName}`);
          console.log(` Filtro completo enviado para listTimeSeries: ${m.filter}`);
          let SA = "Application Default Credentials";
          if (process.env.GCP_SERVICE_ACCOUNT_JSON) {
             const c = JSON.parse(process.env.GCP_SERVICE_ACCOUNT_JSON);
             SA = c.client_email;
          }
          console.log(` Service Account utilizada: ${SA}`);
          console.log(` Request Payload:\n${JSON.stringify(reqObj, null, 2)}`);
          console.log("--------------------------------------------------------------\n");

          const [timeSeries] = await client.listTimeSeries(reqObj as any);
          const endMs = Date.now();
          
          const timeSeriesList = timeSeries || [];
          let finalValue = 0;
          
          for (const ts of timeSeriesList) {
             const seriesPoints = ts.points || [];
             let seriesVal = 0;
             if (m.aligner === "ALIGN_MAX") {
                seriesVal = seriesPoints.length > 0 ? Math.max(...seriesPoints.map((pt: any) => Number(pt.value?.int64Value || pt.value?.doubleValue || 0))) : 0;
             } else {
                seriesVal = seriesPoints.reduce((acc: number, pt: any) => acc + Number(pt.value?.int64Value || pt.value?.doubleValue || 0), 0);
             }
             finalValue += seriesVal;
          }

          results[m.key] = {
             value: finalValue,
             metric: m.filter
          };
          
          results.debug.push({
             metricName: m.key,
             request: reqObj,
             returnedSeriesCount: timeSeries?.length || 0,
             returnedValue: finalValue,
             rawPoints: timeSeriesList.reduce((acc: number, ts: any) => acc + (ts.points?.length || 0), 0),
             queryTimeMs: endMs - startMs
          });

        } catch (e: any) {
          if (!e.message.includes('NOT_FOUND') && !e.message.includes('Cannot find metric')) {
            console.warn(`Failed to fetch ${m.key} for ${projectId}:`, e.message);
          }
          // If the API hasn't been enabled or permission is denied, it will throw.
          if (e.message.includes('PermissionDenied') || e.message.includes('PERMISSION_DENIED') || e.message.includes('not enabled')) {
            const err = new Error(e.message) as any;
            err.projectId = projectId;
            err.metricName = m.filter;
            err.endpoint = 'monitoring.googleapis.com (listTimeSeries)';
            err.httpCode = e.code || 'UNKNOWN';
            throw err;
          }
        }
      }

      return res.json(results);
    } catch (error: any) {
      console.error("GCP Monitoring error:", error);
      let friendlyMsg = error.message;
      let errorType = 'Unknown';
      if (!process.env.GCP_SERVICE_ACCOUNT_JSON) {
         friendlyMsg = "GCP_SERVICE_ACCOUNT_JSON environment variable is missing. The system uses default credentials which do not have access. Please configure the service account JSON.";
      } else {
        const msg = error.message || "";
        if (msg.includes('billing')) {
            friendlyMsg = "A API do Cloud Monitoring requer que o faturamento (billing) esteja ativado no projeto do cliente.";
            errorType = 'Billing';
        } else if (msg.includes('PermissionDenied') || msg.includes('PERMISSION_DENIED') || msg.includes('IAM')) {
            friendlyMsg = "O serviço não tem permissão para acessar o projeto deste cliente. Verifique o IAM e conceda 'Visualizador do Monitoring'.";
            errorType = 'IAM Permissions';
        } else if (msg.includes('not enabled')) {
            friendlyMsg = "A API do Cloud Monitoring (monitoring.googleapis.com) não está ativada neste projeto.";
            errorType = 'API Not Enabled';
        }
      }
      
      return res.status(500).json({ 
        error: friendlyMsg, 
        raw: error.message,
        diagnostic: {
           endpoint: error.endpoint || 'monitoring.googleapis.com',
           metric: error.metricName || 'unknown',
           httpCode: error.httpCode || 403,
           projectId: error.projectId || req.query.projectId,
           errorType: errorType,
           fullMessage: error.message
        }
      });
    }
  });

  // Target: List all metric descriptors related to Firestore
  app.get("/api/gcp/discovery", async (req, res) => {
    try {
      const { projectId } = req.query;
      if (!projectId) return res.status(400).json({ error: "projectId parameter is required" });

      const gcpKey = process.env.GCP_SERVICE_ACCOUNT_JSON;
      let client;
      const monitoring = await import('@google-cloud/monitoring');
      
      if (gcpKey) {
        const credentials = JSON.parse(gcpKey);
        const { google } = await import('googleapis');
        const auth = new google.auth.GoogleAuth({
          credentials,
          scopes: ['https://www.googleapis.com/auth/cloud-platform', 'https://www.googleapis.com/auth/monitoring.read'],
        });
        const clientOptions = { authClient: await auth.getClient() };
        client = new monitoring.MetricServiceClient(clientOptions);
      } else {
        client = new monitoring.MetricServiceClient();
      }

      const projectName = client.projectPath(projectId);
      const [descriptorsFirestore] = await client.listMetricDescriptors({
        name: projectName,
        filter: 'metric.type = starts_with("firestore.googleapis.com/")'
      });
      
      const [descriptorsServiceRuntime] = await client.listMetricDescriptors({
        name: projectName,
        filter: 'metric.type = starts_with("serviceruntime.googleapis.com/")'
      });

      const [descriptorsStorage] = await client.listMetricDescriptors({
        name: projectName,
        filter: 'metric.type = starts_with("storage.googleapis.com/")'
      });

      const descriptors = [...descriptorsFirestore, ...descriptorsServiceRuntime, ...descriptorsStorage];

      const metricsList = descriptors.map((d: any) => ({
        type: d.type,
        displayName: d.displayName,
        description: d.description,
        unit: d.unit,
        metricKind: d.metricKind,
        valueType: d.valueType
      }));

      return res.json({ metrics: metricsList });

    } catch (error: any) {
      console.error("GCP Discovery error:", error);
      return res.status(500).json({ error: error.message });
    }
  });

  // Direct Storage calculation
  app.get("/api/client-metrics-storage-direct", async (req, res) => {
    try {
      const { projectId } = req.query;
      if (!projectId || typeof projectId !== "string") {
         return res.status(400).json({ error: "projectId is required" });
      }

      const gcpKey = process.env.GCP_SERVICE_ACCOUNT_JSON;
      let storageOpts: any = { projectId };
      if (gcpKey) {
         storageOpts.credentials = JSON.parse(gcpKey);
      }

      const { Storage } = await import('@google-cloud/storage');
      const storage = new Storage(storageOpts);

      let totalBytes = 0;
      let bucketDetails: any = [];

      try {
        const [buckets] = await storage.getBuckets();
        for (const bucket of buckets) {
           let bucketSize = 0;
           // We list all files to compute the exact storage size.
           // This may take time if there are millions of files, but works instantly for most smaller buckets
           const [files] = await bucket.getFiles();
           for (const f of files) {
              bucketSize += Number(f.metadata.size || 0);
           }
           totalBytes += bucketSize;
           bucketDetails.push({ name: bucket.name, sizeBytes: bucketSize, fileCount: files.length });
        }
      } catch (err: any) {
        console.error("Storage API error:", err);
        return res.status(500).json({ error: "Storage calculation failed", details: err.message });
      }

      return res.json({ totalBytes, buckets: bucketDetails });
    } catch (error: any) {
       console.error("Direct storage calculation error:", error);
       return res.status(500).json({ error: error.message });
    }
  });

  // Synchronize Google Cloud Billing Costs automatically from BigQuery Billing Export dataset
  app.get("/api/gcp/billing-sync-bigquery", async (req, res) => {
    try {
      let { bqProjectId, bqDatasetId, bqTableId } = req.query as { bqProjectId?: string; bqDatasetId?: string; bqTableId?: string };
      
      // Fallback: If not passed as query parameters, load from Firestore settings/global or env
      if (!bqProjectId || !bqDatasetId || !bqTableId) {
        try {
          const { getDoc, doc } = await import('firebase/firestore');
          const settingsSnap = await getDoc(doc(db, 'settings', 'global'));
          if (settingsSnap.exists()) {
            const sData = settingsSnap.data();
            bqProjectId = bqProjectId || sData.bqProjectId || process.env.BQ_PROJECT_ID;
            bqDatasetId = bqDatasetId || sData.bqDatasetId || process.env.BQ_DATASET_ID;
            bqTableId = bqTableId || sData.bqTableId || process.env.BQ_TABLE_ID;
          }
        } catch (settingsErr) {
          console.warn("Could not read settings from Firestore:", settingsErr);
        }
      }

      if (!bqProjectId || !bqDatasetId || !bqTableId) {
        return res.status(400).json({ 
          error: "Os parâmetros 'bqProjectId', 'bqDatasetId' e 'bqTableId' são obrigatórios. Configure-os na aba Configurações." 
        });
      }

      const gcpKey = process.env.GCP_SERVICE_ACCOUNT_JSON;
      if (!gcpKey) {
        return res.status(500).json({ 
          error: "A variável de ambiente GCP_SERVICE_ACCOUNT_JSON não está configurada ou está vazia." 
        });
      }

      const credentials = JSON.parse(gcpKey);
      const { google } = await import('googleapis');
      const { updateDoc, doc, getDocs } = await import('firebase/firestore');
      
      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/cloud-platform', 'https://www.googleapis.com/auth/bigquery.readonly'],
      });

      const bigquery = google.bigquery({ version: "v2", auth });
      
      // We want to query the sum of costs per project for the current invoice month and real-time usage
      const today = new Date();
      const currentInvoiceMonth = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`; // YYYYMM format
      const currentMonthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01 00:00:00`;
      
      const prevMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const previousInvoiceMonth = `${prevMonthDate.getFullYear()}${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;

      const bqTablePath = `${bqProjectId}.${bqDatasetId}.${bqTableId}`;
      
      // Standard GCP BigQuery billing query including invoice month and streaming real-time unbilled records
      const sqlQuery = `
        SELECT 
          COALESCE(project.id, '') AS project_id, 
          COALESCE(project.name, '') AS project_name,
          SUM(cost) + SUM(IFNULL((SELECT SUM(c.amount) FROM UNNEST(credits) c), 0)) AS total_cost,
          COALESCE(currency, 'USD') AS currency
        FROM 
          \`${bqTablePath}\`
        WHERE 
          invoice.month = '${currentInvoiceMonth}'
          OR (invoice.month IS NULL AND usage_start_time >= TIMESTAMP('${currentMonthStart}'))
        GROUP BY 
          project_id, project_name, currency
      `;

      // Previous month GCP BigQuery billing query
      const sqlPrevQuery = `
        SELECT 
          COALESCE(project.id, '') AS project_id, 
          COALESCE(project.name, '') AS project_name,
          SUM(cost) + SUM(IFNULL((SELECT SUM(c.amount) FROM UNNEST(credits) c), 0)) AS total_cost,
          COALESCE(currency, 'USD') AS currency
        FROM 
          \`${bqTablePath}\`
        WHERE 
          invoice.month = '${previousInvoiceMonth}'
        GROUP BY 
          project_id, project_name, currency
      `;

      console.log("Running BigQuery Billing Query:\n", sqlQuery);

      const [queryRes, queryPrevRes] = await Promise.all([
        bigquery.jobs.query({
          projectId: credentials.project_id, // We run the job in our service account project
          requestBody: {
            query: sqlQuery,
            useLegacySql: false,
            useQueryCache: false
          }
        }),
        bigquery.jobs.query({
          projectId: credentials.project_id,
          requestBody: {
            query: sqlPrevQuery,
            useLegacySql: false,
            useQueryCache: false
          }
        })
      ]);

      const rows = queryRes.data.rows || [];
      const records = rows.map((row: any) => {
        // BigQuery query rows have values in f[index].v
        const projectId = row.f?.[0]?.v || '';
        const projectName = row.f?.[1]?.v || '';
        const totalCost = parseFloat(row.f?.[2]?.v || '0');
        const currency = String(row.f?.[3]?.v || 'USD').trim().toUpperCase();
        return { projectId, projectName, totalCost, currency };
      });

      const prevRows = queryPrevRes.data.rows || [];
      const prevRecords = prevRows.map((row: any) => {
        const projectId = row.f?.[0]?.v || '';
        const projectName = row.f?.[1]?.v || '';
        const totalCost = parseFloat(row.f?.[2]?.v || '0');
        const currency = String(row.f?.[3]?.v || 'USD').trim().toUpperCase();
        return { projectId, projectName, totalCost, currency };
      });

      // Query daily costs for high-fidelity real dashboard graphics
      let dailyRecords: any[] = [];
      try {
        const sqlDailyQuery = `
          SELECT 
            EXTRACT(DAY FROM TIMESTAMP(usage_start_time)) AS usage_day,
            SUM(cost) + SUM(IFNULL((SELECT SUM(c.amount) FROM UNNEST(credits) c), 0)) AS total_cost,
            COALESCE(currency, 'USD') AS currency
          FROM 
            \`${bqTablePath}\`
          WHERE 
            invoice.month = '${currentInvoiceMonth}'
            OR (invoice.month IS NULL AND usage_start_time >= TIMESTAMP('${currentMonthStart}'))
          GROUP BY 
            usage_day, currency
          ORDER BY 
            usage_day ASC
        `;
        console.log("Running BigQuery Daily Billing Query:\n", sqlDailyQuery);
        
        const dailyQueryRes = await bigquery.jobs.query({
          projectId: credentials.project_id,
          requestBody: {
            query: sqlDailyQuery,
            useLegacySql: false,
            useQueryCache: false
          }
        });
        
        const dailyRows = dailyQueryRes.data.rows || [];
        dailyRecords = dailyRows.map((row: any) => {
          const day = Number(row.f?.[0]?.v || '0');
          const cost = parseFloat(row.f?.[1]?.v || '0');
          const currency = String(row.f?.[2]?.v || 'USD').trim().toUpperCase();
          
          let costBRL = cost;
          if (currency === 'USD') {
            costBRL = cost * 5.45;
          }
          return { day, costBRL };
        });
      } catch (e: any) {
        console.warn("Failed to query BigQuery daily costs:", e.message);
      }

      // Match these project IDs with clients list in our Firestore!
      const clientsRef = collection(db, "clients");
      const snapshot = await getDocs(clientsRef);
      
      let syncCount = 0;
      const syncedClientsDetails: any[] = [];
      const { setDoc } = await import('firebase/firestore');

      for (const clientDoc of snapshot.docs) {
        const clientData = clientDoc.data();
        const firebaseProjectId = clientData.firebaseProjectId?.trim().toLowerCase();
        
        if (!firebaseProjectId) continue;

        // Find matching record from BigQuery
        const matched = records.find(r => r.projectId?.trim().toLowerCase() === firebaseProjectId || r.projectName?.trim().toLowerCase() === firebaseProjectId);
        const prevMatched = prevRecords.find(r => r.projectId?.trim().toLowerCase() === firebaseProjectId || r.projectName?.trim().toLowerCase() === firebaseProjectId);
        
        if (matched) {
          // Update client in Firestore with bq fetched cost
          const docRef = doc(db, "clients", clientDoc.id);
          
          let costInBRL = matched.totalCost;
          if (matched.currency === 'USD') {
            costInBRL = matched.totalCost * 5.45;
          }

          let prevCostInBRL = 0;
          if (prevMatched) {
            prevCostInBRL = prevMatched.totalCost;
            if (prevMatched.currency === 'USD') {
              prevCostInBRL = prevMatched.totalCost * 5.45;
            }
          }

          const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
          const periodString = `${monthNames[today.getMonth()]} de ${today.getFullYear()}`;

          await updateDoc(docRef, {
            gcpBillingCost: costInBRL,
            gcpBillingCostPrevMonth: prevCostInBRL,
            gcpBillingPeriod: periodString,
            gcpBillingLastSync: new Date().toISOString()
          });

          syncCount++;
          syncedClientsDetails.push({
            clientId: clientDoc.id,
            clientName: clientData.name,
            projectId: matched.projectId,
            costOriginal: matched.totalCost,
            currency: matched.currency,
            costBRL: costInBRL
          });
        }
      }

      // Save daily costs summary to settings/gcp_billing_daily for the dashboard visualization
      if (dailyRecords.length > 0) {
        try {
          const dailySummaryRef = doc(db, "settings", "gcp_billing_daily");
          await setDoc(dailySummaryRef, {
            currentMonth: currentInvoiceMonth,
            dailyCosts: dailyRecords,
            lastUpdated: new Date().toISOString()
          }, { merge: true });
          console.log("Successfully saved daily billing data to settings/gcp_billing_daily");
        } catch (err: any) {
          console.error("Failed to save daily billing stats to settings/gcp_billing_daily:", err.message);
        }
      }

      return res.json({
        success: true,
        month: currentInvoiceMonth,
        syncedRecordsCount: syncCount,
        details: syncedClientsDetails,
        rawBigQueryRecords: records,
        dailyCosts: dailyRecords
      });

    } catch (err: any) {
      console.error("BigQuery Billing Sync Error:", err);
      return res.status(500).json({ 
        error: "Falha na sincronização automatizada com o BigQuery Billing Export.",
        details: err.message
      });
    }
  });

  // --- INVESTMENTS API ---
  
  // Proxy for brapi.dev quote
  app.get("/api/investments/quote", async (req, res) => {
    try {
      const { tickers } = req.query;
      if (!tickers) return res.status(400).json({ error: "Tickers parameter is required" });
      
      const apiKey = process.env.BRAPI_API_KEY;
      if (!apiKey) return res.status(500).json({ error: "BRAPI_API_KEY is not configured" });

      const response = await fetch(`https://brapi.dev/api/quote/${tickers}?token=${apiKey}`);
      if (!response.ok) {
        throw new Error(`Brapi API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("Error fetching quotes:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Proxy for brapi.dev search
  app.get("/api/investments/search", async (req, res) => {
    try {
      const { search } = req.query;
      if (!search) return res.status(400).json({ error: "Search parameter is required" });
      
      const apiKey = process.env.BRAPI_API_KEY;
      if (!apiKey) return res.status(500).json({ error: "BRAPI_API_KEY is not configured" });

      const response = await fetch(`https://brapi.dev/api/quote/list?search=${search}&token=${apiKey}`);
      if (!response.ok) {
        throw new Error(`Brapi API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("Error searching assets:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // --- EMAIL VERIFICATION FOR CLIENT REGISTRATION ---
  app.post("/api/send-verification-code", async (req, res) => {
    try {
      const { email, code, clientName } = req.body;
      if (!email || !code) {
        return res.status(400).json({ error: "E-mail e código são obrigatórios." });
      }

      console.log(`[Verification] Sending 4-digit code ${code} to ${email} (${clientName || 'Cliente'})`);

      // 1. Store in Firestore verification_codes collection for validation & audit
      try {
        await addDoc(collection(db, "verification_codes"), {
          email: email.trim().toLowerCase(),
          code: String(code).trim(),
          clientName: clientName || "Cliente",
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 mins
          used: false
        });
      } catch (dbErr) {
        console.warn("[Verification] Firestore log warning:", dbErr);
      }

      // 2. Send via Nodemailer if SMTP is configured
      let emailSent = false;
      let smtpErrorMessage = "";

      const smtpHost = process.env.SMTP_HOST || "smtp.umbler.com";
      const smtpPort = Number(process.env.SMTP_PORT) || 587;
      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASS;
      const smtpFrom = process.env.SMTP_FROM || (smtpUser ? `"AnimaSystem" <${smtpUser}>` : undefined);

      if (smtpUser && smtpPass) {
        try {
          const nodemailer = await import("nodemailer");
          const isSecure = smtpPort === 465;

          const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: isSecure, // true for 465 (SSL), false for 587 (TLS/STARTTLS)
            auth: {
              user: smtpUser.trim(),
              pass: smtpPass.trim(),
            },
            tls: {
              rejectUnauthorized: false, // Prevents self-signed or chain issues in container
            },
            connectionTimeout: 12000,
            greetingTimeout: 10000,
            socketTimeout: 15000,
          });

          // Ensure the 'from' address uses the authenticated user to satisfy Umbler anti-spoofing policy
          const safeFrom = smtpFrom?.includes("<") 
            ? smtpFrom 
            : `"AnimaSystem" <${smtpUser.trim()}>`;

          const mailOptions = {
            from: safeFrom,
            to: email.trim(),
            subject: `Código de Ativação AnimaSystem: ${code}`,
            text: `Olá ${clientName || 'Cliente'}! Seu código de liberação do Painel do Cliente AnimaSystem é: ${code}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 540px; margin: 0 auto; background-color: #0d1117; color: #ffffff; padding: 32px; border-radius: 16px; border: 1px solid #21262d;">
                <div style="text-align: center; margin-bottom: 24px;">
                  <span style="font-size: 22px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff;">Anima<span style="color: #D7FE03;">System</span></span>
                </div>
                <div style="background-color: #161b22; border: 1px solid #30363d; border-radius: 12px; padding: 24px; text-align: center;">
                  <h2 style="font-size: 18px; font-weight: 700; margin-top: 0; margin-bottom: 12px; color: #f0f6fc;">Código de Liberação do Painel</h2>
                  <p style="font-size: 14px; color: #8b949e; margin-bottom: 24px; line-height: 1.5;">
                    Olá, <strong>${clientName || 'Cliente'}</strong>! Utilize o código de 4 dígitos abaixo para confirmar seu e-mail e liberar o acesso ao seu Painel do Cliente:
                  </p>
                  <div style="display: inline-block; background-color: #0d1117; border: 2px dashed #D7FE03; border-radius: 12px; padding: 16px 32px; margin-bottom: 24px;">
                    <span style="font-size: 36px; font-weight: 900; letter-spacing: 12px; color: #D7FE03; font-family: monospace;">${code}</span>
                  </div>
                  <p style="font-size: 12px; color: #6e7681; margin: 0;">
                    Este código é válido por <strong>15 minutos</strong>. Se você não solicitou este cadastro, ignore esta mensagem com segurança.
                  </p>
                </div>
                <div style="text-align: center; margin-top: 24px; font-size: 11px; color: #484f58;">
                  &copy; ${new Date().getFullYear()} AnimaSystem - Todos os direitos reservados.
                </div>
              </div>
            `
          };

          const info = await transporter.sendMail(mailOptions);
          emailSent = true;
          console.log(`[Verification] Email sent successfully via SMTP (${smtpHost}) to ${email}. MessageId: ${info.messageId}`);
        } catch (smtpErr: any) {
          smtpErrorMessage = smtpErr.message || String(smtpErr);
          console.error(`[Verification] SMTP sending failed on host ${smtpHost}:${smtpPort}:`, smtpErr);
        }
      } else {
        console.warn("[Verification] SMTP_USER or SMTP_PASS not set in environment secrets.");
      }

      return res.json({
        success: true,
        emailSent,
        smtpError: smtpErrorMessage || undefined,
        message: emailSent 
          ? "Código de 4 dígitos enviado com sucesso para o seu e-mail." 
          : "Código gerado com sucesso."
      });
    } catch (err: any) {
      console.error("[Verification] Error processing verification code:", err);
      return res.status(500).json({ error: "Erro ao processar envio do código." });
    }
  });

  // Diagnostic endpoint to test SMTP settings
  app.post("/api/test-smtp", async (req, res) => {
    try {
      const { testEmail } = req.body;
      const smtpHost = process.env.SMTP_HOST || "smtp.umbler.com";
      const smtpPort = Number(process.env.SMTP_PORT) || 587;
      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASS;

      if (!smtpUser || !smtpPass) {
        return res.status(400).json({
          success: false,
          error: "Variáveis de ambiente SMTP_USER ou SMTP_PASS não estão configuradas nos Secrets."
        });
      }

      const nodemailer = await import("nodemailer");
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser.trim(),
          pass: smtpPass.trim(),
        },
        tls: {
          rejectUnauthorized: false
        },
        connectionTimeout: 10000
      });

      // Verify connection
      await transporter.verify();

      if (testEmail) {
        await transporter.sendMail({
          from: `"AnimaSystem" <${smtpUser.trim()}>`,
          to: testEmail,
          subject: "Teste de Envio SMTP - AnimaSystem",
          text: "Configuração SMTP do Umbler validada com sucesso!",
          html: "<p>Configuração SMTP do <strong>Umbler</strong> validada com sucesso!</p>"
        });
      }

      return res.json({
        success: true,
        message: "Conexão SMTP validada com sucesso com o servidor " + smtpHost
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: err.message || "Erro na verificação SMTP",
        code: err.code
      });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
