import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Upload, Loader2, Image as ImageIcon, Trash2, Building2, User, Database, DollarSign,
  ShieldCheck, Copy, Check, Eye, Globe, Zap, Phone, ChevronDown, ChevronUp, AlertTriangle,
  CreditCard, ExternalLink, Calendar, RefreshCw
} from 'lucide-react';
import { ClientData } from '../../types';
import { ref, uploadBytesResumable, getDownloadURL, getStorage, deleteObject } from 'firebase/storage';
import { app, db } from '../../lib/firebase';
import { ConfirmationModal } from '../ConfirmationModal';
import { motion, AnimatePresence } from 'motion/react';
import { DOMAIN_YEAR_OPTIONS, DOMAIN_YEAR_PRICES, getClientDomainInfo } from '../../utils';

interface ClientModalProps {
  client: ClientData | null;
  onClose: () => void;
  onSave: (clientData: ClientData) => void;
}

export function ClientModal({ client, onClose, onSave }: ClientModalProps) {
  const [formData, setFormData] = useState<Partial<ClientData>>({
    name: '',
    responsible: '',
    logoInitials: '',
    domain: '',
    website: '',
    projectName: '',
    plan: 'Starter',
    firebaseProjectId: '',
    firebaseDatabaseName: '(default)',
    firebaseSdkConfig: '',
    monthlyValue: 290,
    dueDate: 5,
    status: 'active',
    domainContractDate: new Date().toISOString().split('T')[0],
    domainDurationYears: 1,
    domainPrice: 40,
  });
  const [uploading, setUploading] = useState(false);
  const [showRemoveLogoConfirm, setShowRemoveLogoConfirm] = useState(false);
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [showLivePreview, setShowLivePreview] = useState(false);
  const [showBannerPreview, setShowBannerPreview] = useState(false);
  const [bannerPreviewMode, setBannerPreviewMode] = useState<'overdue' | 'today' | 'upcoming'>('overdue');
  const [expandedTag, setExpandedTag] = useState(false);
  const [expandedStandalone, setExpandedStandalone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://ais-pre-p5xzmtslhtg7gruyoqvdo4-373656924597.us-west2.run.app';
  const guardClientId = client?.id || (formData as any).id || '';
  const dynamicScriptTag = `<script src="${currentOrigin}/api/guard.js?client=${guardClientId}"></script>`;

  const standaloneScript = `<!-- AnimaSystem Guard: Proteção, Régua de Vencimento & Bloqueio Remoto -->
<script>
(function() {
  var cId = "${guardClientId}";
  if (!cId) return;

  function renderSuspension(d) {
    if (document.getElementById('animasystem-guard-lock')) return;
    var target = document.body || document.documentElement;
    if (!target) {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() { renderSuspension(d); });
      }
      return;
    }

    if (!document.getElementById('as-guard-styles')) {
      var st = document.createElement('style');
      st.id = 'as-guard-styles';
      st.innerHTML = \`
        html, body { overflow: hidden !important; margin: 0 !important; padding: 0 !important; width: 100% !important; height: 100% !important; background: #050505 !important; }
        #animasystem-guard-lock { position: fixed !important; inset: 0 !important; top: 0 !important; left: 0 !important; width: 100vw !important; height: 100vh !important; background: #050505 !important; z-index: 2147483647 !important; display: flex !important; flex-direction: column !important; align-items: center !important; justify-content: center !important; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important; color: #ffffff !important; padding: 24px !important; box-sizing: border-box !important; text-align: center !important; user-select: none !important; -webkit-font-smoothing: antialiased !important; }
        .as-glow-1 { position: absolute !important; top: -10% !important; left: -10% !important; width: 750px !important; height: 750px !important; background: radial-gradient(circle, rgba(215, 254, 3, 0.06) 0%, rgba(34, 197, 94, 0.02) 50%, transparent 75%) !important; border-radius: 50% !important; filter: blur(90px) !important; pointer-events: none !important; animation: asOrb1 4.5s ease-in-out infinite alternate !important; }
        .as-glow-2 { position: absolute !important; bottom: -15% !important; right: -10% !important; width: 800px !important; height: 800px !important; background: radial-gradient(circle, rgba(215, 254, 3, 0.06) 0%, rgba(34, 197, 94, 0.02) 45%, transparent 75%) !important; border-radius: 50% !important; filter: blur(100px) !important; pointer-events: none !important; animation: asOrb2 5s ease-in-out infinite alternate !important; }
        @keyframes asOrb1 { 0% { transform: translate(0, 0) scale(1); } 50% { transform: translate(120px, -80px) scale(1.2); } 100% { transform: translate(-80px, 100px) scale(0.9); } }
        @keyframes asOrb2 { 0% { transform: translate(0, 0) scale(1); } 50% { transform: translate(-110px, 90px) scale(1.25); } 100% { transform: translate(90px, -70px) scale(0.85); } }
        @keyframes asSpinCw { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes asSpinCcw { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
        .as-card { position: relative !important; z-index: 10 !important; max-width: 520px !important; width: 100% !important; display: flex !important; flex-direction: column !important; align-items: center !important; gap: 18px !important; animation: asFadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards !important; }
        @keyframes asFadeIn { from { opacity: 0; transform: scale(0.96) translateY(12px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .as-logo-container { display: inline-flex !important; align-items: center !important; gap: 8px !important; padding: 8px 18px !important; background: rgba(255, 255, 255, 0.06) !important; border-radius: 9999px !important; border: 1px solid rgba(255, 255, 255, 0.12) !important; backdrop-filter: blur(12px) !important; }
        .as-gears-cluster { width: 106px !important; height: 100px !important; position: relative !important; color: #D7FE03 !important; filter: drop-shadow(0 0 22px rgba(215, 254, 3, 0.6)) !important; margin: 6px 0 !important; }
        .as-btn { display: inline-flex !important; align-items: center !important; justify-content: center !important; gap: 8px !important; background: #D7FE03 !important; color: #000000 !important; font-weight: 700 !important; font-size: 14px !important; padding: 13px 32px !important; border-radius: 9999px !important; text-decoration: none !important; border: none !important; cursor: pointer !important; transition: all 0.25s ease !important; box-shadow: 0 4px 20px rgba(215, 254, 3, 0.35) !important; }
        .as-btn:hover { background: #e5ff33 !important; transform: translateY(-2px) scale(1.02) !important; box-shadow: 0 6px 28px rgba(215, 254, 3, 0.55) !important; }
      \`;
      (document.head || document.documentElement).appendChild(st);
    }

    var phone = (d && d.phone ? d.phone : '5524981000306').replace(/\\D/g, '');
    var waMsg = encodeURIComponent('Olá! Gostaria de falar com o suporte sobre meu site em manutenção.');
    var waUrl = 'https://wa.me/' + (phone || '5524981000306') + '?text=' + waMsg;

    var el = document.createElement('div');
    el.id = 'animasystem-guard-lock';
    el.innerHTML = \`
      <div class="as-glow-1"></div>
      <div class="as-glow-2"></div>
      <div class="as-card">
        <div class="as-logo-container">
          <div style="width:24px;height:24px;background:#D7FE03;border-radius:50%;display:flex;align-items:center;justify-content:center;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#000000"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
          </div>
          <span style="font-size:13px;font-weight:700;letter-spacing:0.02em;">Anima<span style="color:#D7FE03;">System</span></span>
        </div>

        <div class="as-gears-cluster">
          <svg style="width:62px;height:62px;position:absolute;top:0;left:6px;transform-origin:center center;animation:asSpinCw 9s linear infinite;" viewBox="0 0 100 100" fill="currentColor">
            <path d="M50 35a15 15 0 1 0 0 30 15 15 0 0 0 0-30zm0-25a8 8 0 0 1 8 8v4.1a35.2 35.2 0 0 1 12.1 5l3-3a8 8 0 0 1 11.3 0l5.6 5.6a8 8 0 0 1 0 11.3l-3 3a35.2 35.2 0 0 1 5 12.1H92a8 8 0 0 1 8 8v8a8 8 0 0 1-8 8h-4.1a35.2 35.2 0 0 1-5 12.1l3 3a8 8 0 0 1 0 11.3l-5.6 5.6a8 8 0 0 1-11.3 0l-3-3a35.2 35.2 0 0 1-12.1 5V92a8 8 0 0 1-8 8h-8a8 8 0 0 1-8-8v-4.1a35.2 35.2 0 0 1-12.1-5l-3 3a8 8 0 0 1-11.3 0l-5.6-5.6a8 8 0 0 1 0-11.3l3-3a35.2 35.2 0 0 1-5-12.1H8a8 8 0 0 1-8-8v-8a8 8 0 0 1 8-8h4.1a35.2 35.2 0 0 1 5-12.1l-3-3a8 8 0 0 1 0-11.3l5.6-5.6a8 8 0 0 1 11.3 0l3 3a35.2 35.2 0 0 1 12.1-5V8a8 8 0 0 1 8-8h8z"/>
          </svg>
          <svg style="width:45px;height:45px;position:absolute;bottom:6px;right:4px;transform-origin:center center;animation:asSpinCcw 6.75s linear infinite;" viewBox="0 0 100 100" fill="currentColor">
            <path d="M50 35a15 15 0 1 0 0 30 15 15 0 0 0 0-30zm0-25a8 8 0 0 1 8 8v4.1a35.2 35.2 0 0 1 12.1 5l3-3a8 8 0 0 1 11.3 0l5.6 5.6a8 8 0 0 1 0 11.3l-3 3a35.2 35.2 0 0 1 5 12.1H92a8 8 0 0 1 8 8v8a8 8 0 0 1-8 8h-4.1a35.2 35.2 0 0 1-5 12.1l3 3a8 8 0 0 1 0 11.3l-5.6 5.6a8 8 0 0 1-11.3 0l-3-3a35.2 35.2 0 0 1-12.1 5V92a8 8 0 0 1-8 8h-8a8 8 0 0 1-8-8v-4.1a35.2 35.2 0 0 1-12.1-5l-3 3a8 8 0 0 1-11.3 0l-5.6-5.6a8 8 0 0 1 0-11.3l3-3a35.2 35.2 0 0 1-5-12.1H8a8 8 0 0 1-8-8v-8a8 8 0 0 1 8-8h4.1a35.2 35.2 0 0 1 5-12.1l-3-3a8 8 0 0 1 0-11.3l5.6-5.6a8 8 0 0 1 11.3 0l3 3a35.2 35.2 0 0 1 12.1-5V8a8 8 0 0 1 8-8h8z"/>
          </svg>
        </div>

        <h1 style="font-size:28px;font-weight:700;color:#ffffff;margin:0;">Site em Manutenção</h1>
        <p style="font-size:14px;color:#a1a1aa;line-height:1.5;max-width:440px;margin:0;">
          Estamos realizando melhorias técnicas e ajustes de segurança na plataforma. Em breve os serviços estarão totalmente restabelecidos.
        </p>

        <a href="\${waUrl}" target="_blank" rel="noopener noreferrer" class="as-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
          <span>Falar com o Suporte</span>
        </a>
      </div>
    \`;

    target.appendChild(el);
    document.title = "Site em Manutenção - AnimaSystem";

    try {
      var obs = new MutationObserver(function() {
        if (!document.getElementById('animasystem-guard-lock')) {
          var p = document.body || document.documentElement;
          if (p) p.appendChild(el);
        }
      });
      obs.observe(document.body || document.documentElement, { childList: true, subtree: true });
    } catch(e) {}
  }

  function renderBanner(d) {
    if (document.getElementById('animasystem-renewal-banner')) return;
    var target = document.body || document.documentElement;
    if (!target) {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() { renderBanner(d); });
      }
      return;
    }

    var banner = document.createElement('div');
    banner.id = 'animasystem-renewal-banner';
    banner.style.cssText = 'position:fixed!important;top:0!important;left:0!important;width:100%!important;background:linear-gradient(90deg,#dc2626,#b91c1c)!important;color:#fff!important;z-index:2147483640!important;padding:10px 18px!important;box-shadow:0 4px 14px rgba(220,38,38,0.45)!important;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif!important;font-size:13px!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:12px!important;box-sizing:border-box!important;';

    var msg = (d && d.bannerMessage) ? d.bannerMessage : 'Aviso de Vencimento: Regularize seu plano para evitar a interrupção dos serviços.';
    var checkoutUrl = "${currentOrigin}/checkout?renov=true&client=" + encodeURIComponent(cId);

    banner.innerHTML = \`
      <div style="display:flex;align-items:center;gap:10px;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        <span style="font-weight:600;">\${msg}</span>
      </div>
      <a href="\${checkoutUrl}" target="_blank" rel="noopener noreferrer" style="background:#fff;color:#dc2626;font-weight:800;font-size:11px;text-transform:uppercase;padding:6px 14px;border-radius:9999px;text-decoration:none;box-shadow:0 2px 8px rgba(0,0,0,0.2);white-space:nowrap;display:inline-flex;align-items:center;gap:4px;">
        Renovar Agora
      </a>
    \`;

    target.insertBefore(banner, target.firstChild);
    if (document.body) {
      document.body.style.paddingTop = '48px';
    }
  }

  // 1. Tenta consulta direta no Firestore REST API
  var firestoreUrl = "https://firestore.googleapis.com/v1/projects/animahub/databases/(default)/documents/clients/" + encodeURIComponent(cId);
  var fallbackUrl = "${currentOrigin}/api/client-status?id=" + encodeURIComponent(cId) + "&domain=" + encodeURIComponent(window.location.hostname);

  function evaluateClient(status, nextRenewalStr, dueDayNum, phone) {
    var isSuspended = (status === 'suspended' || status === 'ended' || status === 'suspenso' || status === 'blocked');
    var now = new Date();
    var renewalDate = null;
    if (nextRenewalStr) {
      renewalDate = new Date(nextRenewalStr + 'T23:59:59');
    } else if (dueDayNum) {
      var d = parseInt(dueDayNum, 10) || 5;
      var curYear = now.getFullYear();
      var curMonth = now.getMonth();
      renewalDate = new Date(curYear, curMonth, d, 23, 59, 59);
      if (now.getDate() > d + 7) {
        renewalDate = new Date(curYear, curMonth + 1, d, 23, 59, 59);
      }
    }

    if (renewalDate && !isNaN(renewalDate.getTime())) {
      var diffDays = Math.ceil((renewalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays < -7) {
        isSuspended = true;
      } else if (diffDays <= 7 && !isSuspended) {
        var bannerMsg = "";
        if (diffDays < 0) {
          var overdue = Math.abs(diffDays);
          var remainingTolerance = 7 - overdue;
          bannerMsg = "Seu plano venceu há " + overdue + " dia(s). Evite a suspensão do serviço! (restam " + (remainingTolerance > 0 ? remainingTolerance : 0) + " dias de tolerância).";
        } else if (diffDays === 0) {
          bannerMsg = "Aviso de Vencimento: Seu plano vence hoje! Evite a suspensão do serviço.";
        } else {
          bannerMsg = "Aviso de Vencimento: Faltam " + diffDays + " dias para o vencimento do seu plano.";
        }
        renderBanner({ bannerMessage: bannerMsg, phone: phone });
      }
    }

    if (isSuspended) {
      renderSuspension({ phone: phone });
    }
  }

  fetch(firestoreUrl)
    .then(function(r) { return r.json(); })
    .then(function(res) {
      if (res && res.fields) {
        var st = (res.fields.status && res.fields.status.stringValue) || 'active';
        var ren = (res.fields.nextRenewalDate && res.fields.nextRenewalDate.stringValue) || '';
        var due = (res.fields.dueDate && (res.fields.dueDate.integerValue || res.fields.dueDate.stringValue)) || '';
        var phone = (res.fields.phone && res.fields.phone.stringValue) || '5524981000306';
        evaluateClient(st, ren, due, phone);
      } else {
        throw new Error("Fallback required");
      }
    })
    .catch(function() {
      // Fallback para API AnimaSystem
      fetch(fallbackUrl)
        .then(function(r) { return r.json(); })
        .then(function(data) {
          if (data && data.suspended) {
            renderSuspension(data);
          } else if (data && data.showRenewalBanner) {
            renderBanner(data);
          }
        })
        .catch(function(e) { console.warn("Guard check offline", e); });
    });
})();
</script>`;

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  // Lock body scroll and prevent double scrollbars while modal is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalHeight = document.body.style.height;
    
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.height = originalHeight;
    };
  }, []);

  useEffect(() => {
    if (client) {
      const years = Number(client.domainDurationYears) || 1;
      const contractDate = client.domainContractDate || client.hireDate || (client.createdAt ? client.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]);
      setFormData({
        ...client,
        domainDurationYears: years,
        domainContractDate: contractDate,
        domainPrice: client.domainPrice !== undefined ? client.domainPrice : (DOMAIN_YEAR_PRICES[years] ?? 40),
      });
    }
  }, [client]);

  useEffect(() => {
    if (formData.firebaseSdkConfig) {
      const projectIdMatch = formData.firebaseSdkConfig.match(/projectId['"]?\s*:\s*['"]([^'"]+)['"]/);
      if (projectIdMatch && projectIdMatch[1] && !formData.firebaseProjectId) {
        setFormData(prev => ({ ...prev, firebaseProjectId: projectIdMatch[1] }));
      }
    }
  }, [formData.firebaseSdkConfig]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: value 
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      alert("Por favor, preencha o Nome da Empresa.");
      return;
    }
    if (!formData.responsible) {
      alert("Por favor, preencha o Nome do Responsável.");
      return;
    }
    
    // Cast number fields properly
    formData.monthlyValue = Number(formData.monthlyValue) || 0;
    formData.dueDate = Number(formData.dueDate) || 1;

    // Calculate domain expiration & price
    const years = Number(formData.domainDurationYears) || 1;
    const baseContractDate = formData.domainContractDate || formData.hireDate || new Date().toISOString().split('T')[0];
    const [cy, cm, cd] = baseContractDate.split('-').map(Number);
    const expDate = new Date(cy + years, cm - 1, cd);
    const expDateStr = `${expDate.getFullYear()}-${String(expDate.getMonth() + 1).padStart(2, '0')}-${String(expDate.getDate()).padStart(2, '0')}`;
    
    formData.domainContractDate = baseContractDate;
    formData.domainDurationYears = years;
    formData.domainPrice = DOMAIN_YEAR_PRICES[years] || 40;
    formData.domainExpirationDate = expDateStr;

    // Generate initials if not provided
    if (!formData.logoInitials) {
      formData.logoInitials = formData.name.substring(0, 2).toUpperCase();
    }
    
    // Try to parse firebaseSdkConfig
    if (formData.firebaseSdkConfig) {
      try {
        let parsed = null;
        try {
          parsed = JSON.parse(formData.firebaseSdkConfig);
        } catch (e) {
          const match = formData.firebaseSdkConfig.match(/{\s*(?:['"]?apiKey['"]?\s*:[\s\S]+)\s*}/);
          if (match) {
            const getObj = new Function(`return ${match[0]}`);
            parsed = getObj();
          }
        }
        if (parsed && typeof parsed === 'object') {
          formData.parsedFirebaseConfig = parsed;
          if (parsed.projectId && !formData.firebaseProjectId) {
            formData.firebaseProjectId = parsed.projectId;
          }
        }
      } catch (err) {
        console.warn('Could not parse SDK config', err);
      }
    }
    
    onSave(formData as ClientData);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const hubStorage = getStorage(app, 'gs://animahub.firebasestorage.app');
      const storageRef = ref(hubStorage, `clientes/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file, { contentType: file.type, cacheControl: 'public, max-age=31536000' });

      await new Promise<void>((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          null,
          (error) => reject(error),
          () => resolve()
        );
      });

      const url = await getDownloadURL(storageRef);
      setFormData(prev => ({ ...prev, logoUrl: url }));
    } catch (err: any) {
      console.error('Failed to upload logo', err);
      alert(`Erro ao fazer upload da imagem: ${err.message}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveLogo = async () => {
    if (!formData.logoUrl) return;
    
    try {
      setUploading(true);
      const hubStorage = getStorage(app, 'gs://animahub.firebasestorage.app');
      const fileRef = ref(hubStorage, formData.logoUrl);
      await deleteObject(fileRef).catch(e => console.error("Logo delete error:", e));
      
      setFormData(prev => ({ ...prev, logoUrl: '' }));
      
      // Immediately save to Firestore to keep it in sync since we deleted from Storage
      if (client?.id) {
        const { doc, updateDoc } = await import('firebase/firestore');
        await updateDoc(doc(db, 'clients', client.id), {
          logoUrl: ''
        });
      }
    } catch (err) {
      console.error('Failed to remove logo', err);
    } finally {
      setUploading(false);
      setShowRemoveLogoConfirm(false);
    }
  };

  const modalContent = (
    <motion.div 
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 220 }}
      className="fixed inset-0 z-[100] w-full h-[100dvh] bg-[#F5F5F8] flex flex-col overflow-hidden select-auto font-sans"
    >
      {/* 1. Header Fixo Superior */}
      <header className="bg-white border-b border-zinc-200 shrink-0 z-30 shadow-xs">
        <div className="w-full px-6 sm:px-10 xl:px-16 py-4 sm:py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="font-display font-bold text-xl sm:text-2xl text-zinc-900">
              {client ? 'Editar Cliente' : 'Novo Cliente'}
            </h2>
            {client?.name && (
              <span className="hidden sm:inline-flex items-center text-xs font-semibold px-3 py-1 bg-zinc-100 text-zinc-700 rounded-full border border-zinc-200">
                {client.name}
              </span>
            )}
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* 2. Área de Conteúdo com Rolagem Única */}
      <main className="flex-1 overflow-y-auto custom-scrollbar w-full relative z-10">
        <div className="w-full px-6 sm:px-10 xl:px-16 py-8">
          <form id="client-form" onSubmit={handleSubmit} className="w-full space-y-8 pb-8">
            
            {/* PARTE 1: Informações da Empresa */}
            <section className="bg-white border border-zinc-200 rounded-[2rem] p-6 sm:p-8 shadow-xs space-y-8">
              <div className="flex items-center gap-3 border-b border-zinc-100 pb-4">
                <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-700">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg sm:text-xl text-zinc-900">
                    Informações da Empresa
                  </h3>
                  <p className="text-xs text-zinc-500">Dados cadastrais, links e endereço da empresa</p>
                </div>
              </div>
              
              <div className="space-y-6">
                {/* Logo Upload Box */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-5 sm:p-6 border border-zinc-200/80 rounded-2xl bg-zinc-50/70">
                  <div className="relative group shrink-0">
                    <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-zinc-300 flex items-center justify-center bg-white overflow-hidden transition-all group-hover:border-accent group-hover:bg-accent/5 shadow-xs">
                      {uploading ? (
                        <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
                      ) : formData.logoUrl ? (
                        <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-zinc-300" />
                      )}
                    </div>
                    {formData.logoUrl && !uploading && (
                      <button
                        type="button"
                        onClick={() => setShowRemoveLogoConfirm(true)}
                        className="absolute -top-2 -right-2 w-7 h-7 bg-white border border-zinc-200 rounded-full flex items-center justify-center text-rose-500 hover:text-rose-600 hover:bg-rose-50 shadow-sm opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                        title="Remover Logo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <h4 className="text-sm font-semibold text-zinc-900">Logo do Cliente</h4>
                    <p className="text-xs text-zinc-500">Recomendado: 256x256px, formato PNG ou JPG com fundo transparente ou sólido.</p>
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        accept="image/*" 
                        onChange={handleFileChange} 
                        className="hidden" 
                      />
                      <button 
                        type="button" 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                      >
                        <Upload className="w-4 h-4" />
                        Alterar Logo
                      </button>
                      {formData.logoUrl && (
                        <button
                          type="button"
                          onClick={() => setShowRemoveLogoConfirm(true)}
                          className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-xl text-sm font-medium hover:bg-rose-100 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                          Remover
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Grid de Campos da Empresa */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-zinc-700">Nome da Empresa *</label>
                    <input 
                      name="name"
                      value={formData.name || ''}
                      onChange={handleChange}
                      className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-accent text-zinc-900 text-sm transition-all shadow-2xs"
                      placeholder="Ex: Tudo Novo"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-zinc-700">CNPJ</label>
                    <input 
                      name="cnpj"
                      value={formData.cnpj || ''}
                      onChange={handleChange}
                      className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-accent text-zinc-900 text-sm transition-all shadow-2xs"
                      placeholder="00.000.000/0000-00"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-zinc-700 flex items-center justify-between">
                      <span>Domínio / Site da Empresa (sem https://)</span>
                      <Globe className="w-4 h-4 text-zinc-400" />
                    </label>
                    <input 
                      name="domain"
                      value={formData.domain || formData.website || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData(prev => ({ ...prev, domain: val, website: val }));
                      }}
                      className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-accent text-zinc-900 text-sm transition-all shadow-2xs font-mono"
                      placeholder="tudonovojf.com.br"
                    />
                  </div>

                  {/* Bloco de Validade e Contratação do Domínio */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-zinc-700 flex items-center justify-between">
                      <span>Validade & Registro do Domínio</span>
                      <Calendar className="w-4 h-4 text-zinc-400" />
                    </label>
                    
                    <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-medium text-zinc-500 block mb-1">Data da Contratação</label>
                          <input 
                            type="date"
                            name="domainContractDate"
                            value={formData.domainContractDate || formData.hireDate || ''}
                            onChange={(e) => {
                              const contractDate = e.target.value;
                              const years = Number(formData.domainDurationYears) || 1;
                              let expDateStr = '';
                              if (contractDate) {
                                const [cy, cm, cd] = contractDate.split('-').map(Number);
                                const expDate = new Date(cy + years, cm - 1, cd);
                                expDateStr = `${expDate.getFullYear()}-${String(expDate.getMonth() + 1).padStart(2, '0')}-${String(expDate.getDate()).padStart(2, '0')}`;
                              }
                              setFormData(prev => ({ 
                                ...prev, 
                                domainContractDate: contractDate,
                                domainExpirationDate: expDateStr
                              }));
                            }}
                            className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-1.5 outline-none focus:border-accent text-zinc-900 text-xs font-mono"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-medium text-zinc-500 block mb-1">Período Contratado</label>
                          <select
                            name="domainDurationYears"
                            value={formData.domainDurationYears || 1}
                            onChange={(e) => {
                              const years = Number(e.target.value) || 1;
                              const price = DOMAIN_YEAR_PRICES[years] || 40;
                              const baseContractDate = formData.domainContractDate || formData.hireDate || new Date().toISOString().split('T')[0];
                              const [cy, cm, cd] = baseContractDate.split('-').map(Number);
                              const expDate = new Date(cy + years, cm - 1, cd);
                              const expDateStr = `${expDate.getFullYear()}-${String(expDate.getMonth() + 1).padStart(2, '0')}-${String(expDate.getDate()).padStart(2, '0')}`;

                              setFormData(prev => ({
                                ...prev,
                                domainDurationYears: years,
                                domainPrice: price,
                                domainExpirationDate: expDateStr
                              }));
                            }}
                            className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-1.5 outline-none focus:border-accent text-zinc-900 text-xs font-medium cursor-pointer"
                          >
                            {DOMAIN_YEAR_OPTIONS.map(opt => (
                              <option key={opt.years} value={opt.years}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Botões rápidos de seleção de período (1 ano: 40 / 2 anos: 80 / 3 anos: 120 / 5 anos: 200) */}
                      <div className="grid grid-cols-4 gap-1.5">
                        {DOMAIN_YEAR_OPTIONS.map(opt => {
                          const isSelected = (formData.domainDurationYears || 1) === opt.years;
                          return (
                            <button
                              key={opt.years}
                              type="button"
                              onClick={() => {
                                const years = opt.years;
                                const price = opt.price;
                                const baseContractDate = formData.domainContractDate || formData.hireDate || new Date().toISOString().split('T')[0];
                                const [cy, cm, cd] = baseContractDate.split('-').map(Number);
                                const expDate = new Date(cy + years, cm - 1, cd);
                                const expDateStr = `${expDate.getFullYear()}-${String(expDate.getMonth() + 1).padStart(2, '0')}-${String(expDate.getDate()).padStart(2, '0')}`;

                                setFormData(prev => ({
                                  ...prev,
                                  domainDurationYears: years,
                                  domainPrice: price,
                                  domainExpirationDate: expDateStr
                                }));
                              }}
                              className={`py-1 px-1.5 rounded-lg text-center border text-[11px] font-semibold transition-all cursor-pointer ${
                                isSelected 
                                  ? 'bg-accent text-black border-accent shadow-xs' 
                                  : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-100'
                              }`}
                            >
                              <div className="font-bold">{opt.years} {opt.years === 1 ? 'Ano' : 'Anos'}</div>
                              <div className="text-[10px] font-mono opacity-80">R$ {opt.price}</div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Preview de Validade e Dias Restantes */}
                      {(() => {
                        const domInfo = getClientDomainInfo(formData as any);
                        return (
                          <div className="flex items-center justify-between pt-2 border-t border-zinc-200/80 text-[11px]">
                            <span className="text-zinc-500">Validade: <strong className="text-zinc-800 font-mono">{domInfo.formattedDate}</strong></span>
                            <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              domInfo.isExpired 
                                ? 'bg-rose-100 text-rose-700' 
                                : domInfo.isExpiringSoon 
                                ? 'bg-amber-100 text-amber-800' 
                                : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {domInfo.statusText}
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-zinc-700">URL da Logo (ou use upload acima)</label>
                    <input 
                      name="logoUrl"
                      value={formData.logoUrl || ''}
                      onChange={handleChange}
                      className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-accent text-zinc-900 text-sm transition-all shadow-2xs"
                      placeholder="https://firebasestorage.googleapis.com/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-zinc-700">Status</label>
                    <select
                      name="status"
                      value={formData.status || 'active'}
                      onChange={handleChange}
                      className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-accent text-zinc-900 text-sm transition-all shadow-2xs cursor-pointer"
                    >
                      <option value="active">Ativo</option>
                      <option value="trial">Trial</option>
                      <option value="developing">Em construção</option>
                      <option value="suspended">Suspenso</option>
                      <option value="ended">Encerrado</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-zinc-700">Data de Contratação do Cliente</label>
                    <input 
                      type="date"
                      name="hireDate"
                      value={formData.hireDate || ''}
                      onChange={handleChange}
                      className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-accent text-zinc-900 text-sm transition-all shadow-2xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-zinc-700">Data de Encerramento</label>
                    <input 
                      type="date"
                      name="endDate"
                      value={formData.endDate || ''}
                      onChange={handleChange}
                      className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-accent text-zinc-900 text-sm transition-all shadow-2xs"
                    />
                  </div>
                </div>

                {/* Bloco de Endereço */}
                <div className="pt-6 border-t border-zinc-100 space-y-4">
                  <h4 className="font-semibold text-zinc-800 text-sm">Endereço da Empresa</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-600">CEP</label>
                      <input 
                        name="cep"
                        value={formData.cep || ''}
                        onChange={handleChange}
                        className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-accent text-zinc-900 text-sm transition-all shadow-2xs"
                        placeholder="00000-000"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium text-zinc-600">Rua / Logradouro</label>
                      <input 
                        name="street"
                        value={formData.street || ''}
                        onChange={handleChange}
                        className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-accent text-zinc-900 text-sm transition-all shadow-2xs"
                        placeholder="Rua, Avenida, etc."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-600">Número</label>
                      <input 
                        name="number"
                        value={formData.number || ''}
                        onChange={handleChange}
                        className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-accent text-zinc-900 text-sm transition-all shadow-2xs"
                        placeholder="123"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-600">Bairro</label>
                      <input 
                        name="neighborhood"
                        value={formData.neighborhood || ''}
                        onChange={handleChange}
                        className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-accent text-zinc-900 text-sm transition-all shadow-2xs"
                        placeholder="Centro"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-600">Complemento</label>
                      <input 
                        name="complement"
                        value={formData.complement || ''}
                        onChange={handleChange}
                        className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-accent text-zinc-900 text-sm transition-all shadow-2xs"
                        placeholder="Sala 101, Bloco A"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* PARTE 2: Informações do Contratante */}
            <section className="bg-white border border-zinc-200 rounded-[2rem] p-6 sm:p-8 shadow-xs space-y-8">
              <div className="flex items-center gap-3 border-b border-zinc-100 pb-4">
                <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-700">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg sm:text-xl text-zinc-900">
                    Informações do Contratante
                  </h3>
                  <p className="text-xs text-zinc-500">Dados do responsável direto e contatos</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700">Nome do Responsável *</label>
                  <input 
                    name="responsible"
                    value={formData.responsible || ''}
                    onChange={handleChange}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-accent text-zinc-900 text-sm transition-all shadow-2xs"
                    placeholder="Nome completo do contato principal"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700">CPF</label>
                  <input 
                    name="cpf"
                    value={formData.cpf || ''}
                    onChange={handleChange}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-accent text-zinc-900 text-sm transition-all shadow-2xs"
                    placeholder="000.000.000-00"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700">E-mail do Responsável</label>
                  <input 
                    name="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={handleChange}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-accent text-zinc-900 text-sm transition-all shadow-2xs"
                    placeholder="contato@empresa.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700">Telefone / WhatsApp</label>
                  <input 
                    name="phone"
                    value={formData.phone || ''}
                    onChange={handleChange}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-accent text-zinc-900 text-sm transition-all shadow-2xs"
                    placeholder="(00) 90000-0000"
                  />
                </div>
              </div>
            </section>

            {/* PARTE 3: Informações do Banco de Dados (Firebase) */}
            <section className="bg-white border border-zinc-200 rounded-[2rem] p-6 sm:p-8 shadow-xs space-y-8">
              <div className="flex items-center gap-3 border-b border-zinc-100 pb-4">
                <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-700">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg sm:text-xl text-zinc-900">
                    Informações do Banco de Dados (Firebase)
                  </h3>
                  <p className="text-xs text-zinc-500">Configuração de banco de dados e monitoramento em tempo real</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700">Firebase Project ID</label>
                  <input 
                    name="firebaseProjectId"
                    value={formData.firebaseProjectId || ''}
                    onChange={handleChange}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-accent text-zinc-900 text-sm transition-all shadow-2xs font-mono"
                    placeholder="exemplo-projeto-123"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700">Nome do Banco de Dados</label>
                  <input 
                    name="firebaseDatabaseName"
                    value={formData.firebaseDatabaseName || '(default)'}
                    onChange={handleChange}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-accent text-zinc-900 text-sm transition-all shadow-2xs font-mono"
                    placeholder="(default)"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold text-zinc-700 flex justify-between items-center">
                    <span>Firebase SDK Config (Objeto de configuração)</span>
                    <span className="text-xs text-zinc-400 font-normal">Preenche o Project ID automaticamente</span>
                  </label>
                  <textarea 
                    name="firebaseSdkConfig"
                    value={formData.firebaseSdkConfig || ''}
                    onChange={handleChange}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-4 outline-none focus:border-accent text-zinc-900 text-xs sm:text-sm transition-all font-mono h-32 leading-relaxed shadow-2xs"
                    placeholder={`const firebaseConfig = {\n  apiKey: "AIzaSy...",\n  authDomain: "projeto.firebaseapp.com",\n  projectId: "meu-projeto"\n};`}
                  />
                </div>
              </div>
            </section>

            {/* PARTE 4: Informações do Financeiro */}
            <section className="bg-white border border-zinc-200 rounded-[2rem] p-6 sm:p-8 shadow-xs space-y-8">
              <div className="flex items-center gap-3 border-b border-zinc-100 pb-4">
                <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-700">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg sm:text-xl text-zinc-900">
                    Informações do Financeiro
                  </h3>
                  <p className="text-xs text-zinc-500">Planos, mensalidade e dia de vencimento</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700">Plano Contratado</label>
                  <select
                    name="plan"
                    value={formData.plan || 'Starter'}
                    onChange={handleChange}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-accent text-zinc-900 text-sm transition-all shadow-2xs cursor-pointer"
                  >
                    <option value="Starter">Starter</option>
                    <option value="Profissional">Profissional</option>
                    <option value="Enterprise">Enterprise</option>
                    <option value="Nenhum">Nenhum (Sem contrato ativo)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700">Valor Mensal (R$)</label>
                  <input 
                    type="number"
                    name="monthlyValue"
                    value={formData.monthlyValue !== undefined ? formData.monthlyValue : 290}
                    onChange={handleChange}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-accent text-zinc-900 text-sm transition-all shadow-2xs"
                    placeholder="290"
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700">Dia do Vencimento</label>
                  <input 
                    type="number"
                    name="dueDate"
                    value={formData.dueDate !== undefined ? formData.dueDate : 5}
                    onChange={handleChange}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-accent text-zinc-900 text-sm transition-all shadow-2xs"
                    placeholder="5"
                    min="1"
                    max="31"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700">Próxima Renovação</label>
                  <input 
                    type="date"
                    name="nextRenewalDate"
                    value={formData.nextRenewalDate || ''}
                    onChange={handleChange}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-accent text-zinc-900 text-sm transition-all shadow-2xs"
                    placeholder="AAAA-MM-DD"
                  />
                </div>
              </div>
            </section>

            {/* PARTE 5: Proteção & Bloqueio Remoto (Guard) */}
            <section className="bg-white border border-zinc-200 rounded-[2rem] p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg sm:text-xl text-zinc-900 flex items-center gap-2">
                      Proteção &amp; Bloqueio Remoto (Guard)
                      {guardClientId && (
                        <span className="font-mono text-xs font-normal px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600 border border-zinc-200">
                          ID: {guardClientId}
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-zinc-500">Régua de cobrança preventiva e suspensão automática na data limite</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowLivePreview(true)}
                    className="inline-flex items-center gap-2 px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold rounded-xl transition-all cursor-pointer border border-zinc-200/80 shadow-2xs"
                  >
                    <Eye className="w-3.5 h-3.5 text-zinc-600" />
                    <span>Pré-visualizar Tela de Manutenção</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowBannerPreview(true)}
                    className="inline-flex items-center gap-2 px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold rounded-xl transition-all cursor-pointer border border-red-200 shadow-2xs"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                    <span>Pré-visualizar Faixa Vermelha</span>
                  </button>
                </div>
              </div>

              {/* Scripts de Instalação */}
              <div className="space-y-5">
                <div>
                  <h4 className="text-xs font-bold text-zinc-800 flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 text-zinc-600" />
                    Instalação no site do cliente (AntiGravity / HTML / WordPress / React)
                  </h4>
                  <p className="text-xs text-zinc-500 mt-1">
                    Basta colar a tag ou script no <code className="bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 rounded text-zinc-800 font-mono text-[11px]">&lt;head&gt;</code> ou <code className="bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 rounded text-zinc-800 font-mono text-[11px]">index.html</code> do site:
                  </p>
                </div>

                {/* 1. Tag Principal Recomendada */}
                <div className="border border-zinc-200/90 rounded-2xl p-4 sm:p-5 bg-zinc-50/60 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-zinc-800">Tag Recomendada</span>
                        <span className="text-[10px] text-emerald-700 bg-emerald-100/80 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">
                          Automático &amp; Inteligente
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 mt-0.5">Faixa de vencimento e suspensão em uma única linha</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setExpandedTag(!expandedTag)}
                        className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                      >
                        {expandedTag ? <ChevronUp className="w-3.5 h-3.5 text-zinc-500" /> : <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />}
                        <span>{expandedTag ? 'Recolher' : 'Expandir'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopy(dynamicScriptTag, 'tag')}
                        className="px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-black text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                      >
                        {copiedType === 'tag' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedType === 'tag' ? 'Copiado!' : 'Copiar Tag'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Expanded Tag Code Box - Fundo cinza claro e texto preto */}
                  <AnimatePresence>
                    {expandedTag && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden pt-1"
                      >
                        <div className="relative bg-zinc-100 border border-zinc-300/90 text-zinc-900 p-3.5 sm:p-4 rounded-xl font-mono text-xs overflow-x-auto shadow-inner">
                          <code className="text-zinc-900 select-all whitespace-pre-wrap break-all font-medium">{dynamicScriptTag}</code>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* 2. Script Assíncrono para AntiGravity */}
                <div className="border border-zinc-200/90 rounded-2xl p-4 sm:p-5 bg-zinc-50/60 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-zinc-800">Script Completo Auto-Contido (AntiGravity / Localhost)</span>
                        <span className="text-[10px] text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-2 py-0.5 rounded-full font-semibold">
                          Zero Dependências
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 mt-0.5">Execução autônoma com consulta direta, animações e bloqueio completo no próprio HTML</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setExpandedStandalone(!expandedStandalone)}
                        className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                      >
                        {expandedStandalone ? <ChevronUp className="w-3.5 h-3.5 text-zinc-500" /> : <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />}
                        <span>{expandedStandalone ? 'Recolher' : 'Expandir'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopy(standaloneScript, 'standalone')}
                        className="px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-black text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                      >
                        {copiedType === 'standalone' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedType === 'standalone' ? 'Copiado!' : 'Copiar Script'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Expanded Standalone Script Code Box - Fundo cinza claro e texto preto */}
                  <AnimatePresence>
                    {expandedStandalone && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden pt-1"
                      >
                        <div className="relative bg-zinc-100 border border-zinc-300/90 text-zinc-900 p-3.5 sm:p-4 rounded-xl font-mono text-xs overflow-x-auto max-h-56 shadow-inner">
                          <code className="text-zinc-900 select-all whitespace-pre-wrap font-medium">{standaloneScript}</code>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Regras e Funcionamento */}
                <div className="pt-2 border-t border-zinc-100">
                  <h6 className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    Como a régua atua no site do cliente:
                  </h6>
                  <ul className="text-xs text-zinc-600 space-y-1.5 list-disc list-inside leading-relaxed">
                    <li><strong>7 dias antes do vencimento:</strong> Uma faixa no topo do site exibe os dias restantes para o vencimento.</li>
                    <li><strong>No dia do vencimento:</strong> A faixa avisa <em>"Seu plano vence hoje!"</em>.</li>
                    <li><strong>1 a 7 dias de tolerância:</strong> A faixa alerta sobre o atraso e os dias restantes antes da suspensão.</li>
                    <li><strong>No 8º dia de atraso:</strong> O site entra em <strong>tela de Manutenção Preventiva</strong> com botão direto de suporte no WhatsApp.</li>
                    <li><strong>Reativação Imediata:</strong> Ao renovar a data no painel, o site é restabelecido na hora.</li>
                  </ul>
                </div>
              </div>
            </section>
            
            {client && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 flex items-center gap-3">
                 <div className="space-y-1">
                   <h4 className="text-sm font-bold text-emerald-800">Modo de Edição</h4>
                   <p className="text-xs text-emerald-700">
                     Ao terminar as alterações, clique no botão "Salvar Alterações" no rodapé fixo para gravar os novos dados.
                   </p>
                 </div>
              </div>
            )}
          </form>
        </div>
      </main>

      {/* 3. Rodapé Fixo na Base da Janela */}
      <footer className="bg-white border-t border-zinc-200 py-4 px-6 sm:px-10 xl:px-16 shrink-0 z-30 w-full shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
        <div className="w-full flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-full text-sm font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="client-form"
            className="px-8 py-2.5 rounded-full text-sm font-bold bg-accent text-black hover:bg-accent-hover transition-colors cursor-pointer shadow-xs hover:shadow-sm"
          >
            {client ? 'Salvar Alterações' : 'Criar Cliente'}
          </button>
        </div>
      </footer>

      <ConfirmationModal
        isOpen={showRemoveLogoConfirm}
        title="Remover Logo"
        message="Deseja realmente remover a logo do cliente? Esta alteração será salva de imediato."
        confirmText="Remover"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={handleRemoveLogo}
        onCancel={() => setShowRemoveLogoConfirm(false)}
      />

      {/* Full Live Preview Modal */}
      <AnimatePresence>
        {showLivePreview && (
          <div className="fixed inset-0 z-[120] bg-[#050505] flex flex-col items-center justify-center p-6 text-center font-sans overflow-hidden">
            {/* Ambient Moving Green Glows - 5% Opacity */}
            <motion.div 
              animate={{ 
                x: [0, 140, -90, 0],
                y: [0, -90, 120, 0],
                scale: [1, 1.25, 0.9, 1]
              }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-[10%] -left-[10%] w-[800px] h-[800px] rounded-full bg-[#D7FE03]/5 blur-[90px] pointer-events-none"
            />
            <motion.div 
              animate={{ 
                x: [0, -130, 100, 0],
                y: [0, 100, -80, 0],
                scale: [1, 1.3, 0.88, 1]
              }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-[15%] -right-[10%] w-[850px] h-[850px] rounded-full bg-emerald-500/5 blur-[100px] pointer-events-none"
            />

            {/* Close preview button */}
            <button
              onClick={() => setShowLivePreview(false)}
              className="absolute top-6 right-6 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-lg backdrop-blur-md border border-white/10 z-20"
            >
              <X className="w-4 h-4" />
              Fechar Pré-visualização
            </button>

            <div className="relative z-10 max-w-[500px] w-full flex flex-col items-center gap-5">
              {/* Brand Logo AnimaSystem with Lightning Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/5 rounded-full border border-white/10 backdrop-blur-md">
                <div className="w-6 h-6 rounded-full bg-[#D7FE03] flex items-center justify-center shadow-[0_0_12px_rgba(215,254,3,0.5)]">
                  <Zap className="w-3.5 h-3.5 text-black fill-black" />
                </div>
                <span className="text-sm font-semibold tracking-tight text-white">
                  <span className="text-zinc-400 font-normal">Anima</span>System
                </span>
              </div>

              {/* 3 Connected Industrial Gears Cluster in Neon Green (#D7FE03) */}
              <div className="w-[106px] h-[100px] relative text-[#D7FE03] drop-shadow-[0_0_22px_rgba(215,254,3,0.6)] my-1">
                {/* Large Gear (Top-Left) - 12 teeth */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
                  className="w-[62px] h-[62px] absolute top-0 left-[6px] origin-center"
                >
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <path fill="currentColor" fillRule="evenodd" d="M 86.00 50.00 A 36 36 0 0 1 85.87 53.01 L 97.41 57.51 A 48 48 0 0 1 94.81 67.20 L 82.57 65.33 A 36 36 0 0 1 81.18 68.00 A 36 36 0 0 1 79.56 70.55 L 87.30 80.21 A 48 48 0 0 1 80.21 87.30 L 70.55 79.56 A 36 36 0 0 1 68.00 81.18 A 36 36 0 0 1 65.33 82.57 L 67.20 94.81 A 48 48 0 0 1 57.51 97.41 L 53.01 85.87 A 36 36 0 0 1 50.00 86.00 A 36 36 0 0 1 46.99 85.87 L 42.49 97.41 A 48 48 0 0 1 32.80 94.81 L 34.67 82.57 A 36 36 0 0 1 32.00 81.18 A 36 36 0 0 1 29.45 79.56 L 19.79 87.30 A 48 48 0 0 1 12.70 80.21 L 20.44 70.55 A 36 36 0 0 1 18.82 68.00 A 36 36 0 0 1 17.43 65.33 L 5.19 67.20 A 48 48 0 0 1 2.59 57.51 L 14.13 53.01 A 36 36 0 0 1 14.00 50.00 A 36 36 0 0 1 14.13 46.99 L 2.59 42.49 A 48 48 0 0 1 5.19 32.80 L 17.43 34.67 A 36 36 0 0 1 18.82 32.00 A 36 36 0 0 1 20.44 29.45 L 12.70 19.79 A 48 48 0 0 1 19.79 12.70 L 29.45 20.44 A 36 36 0 0 1 32.00 18.82 A 36 36 0 0 1 34.67 17.43 L 32.80 5.19 A 48 48 0 0 1 42.49 2.59 L 46.99 14.13 A 36 36 0 0 1 50.00 14.00 A 36 36 0 0 1 53.01 14.13 L 57.51 2.59 A 48 48 0 0 1 67.20 5.19 L 65.33 17.43 A 36 36 0 0 1 68.00 18.82 A 36 36 0 0 1 70.55 20.44 L 80.21 12.70 A 48 48 0 0 1 87.30 19.79 L 79.56 29.45 A 36 36 0 0 1 81.18 32.00 A 36 36 0 0 1 82.57 34.67 L 94.81 32.80 A 48 48 0 0 1 97.41 42.49 L 85.87 46.99 A 36 36 0 0 1 86.00 50.00 Z M 50 29 A 21 21 0 1 0 50 71 A 21 21 0 1 0 50 29 Z" />
                  </svg>
                </motion.div>

                {/* Medium Gear (Bottom-Right) - 10 teeth */}
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 6.75, repeat: Infinity, ease: "linear" }}
                  className="w-[45px] h-[45px] absolute bottom-[6px] right-[4px] origin-center"
                >
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <path fill="currentColor" fillRule="evenodd" d="M 84.00 50.00 A 34 34 0 0 1 83.83 53.41 L 97.15 58.99 A 48 48 0 0 1 93.43 70.44 L 79.37 67.12 A 34 34 0 0 1 77.51 69.98 A 34 34 0 0 1 75.36 72.64 L 82.86 84.99 A 48 48 0 0 1 73.12 92.06 L 63.70 81.12 A 34 34 0 0 1 60.51 82.34 A 34 34 0 0 1 57.21 83.23 L 56.02 97.62 A 48 48 0 0 1 43.98 97.62 L 42.79 83.23 A 34 34 0 0 1 39.49 82.34 A 34 34 0 0 1 36.30 81.12 L 26.88 92.06 A 48 48 0 0 1 17.14 84.99 L 24.64 72.64 A 34 34 0 0 1 22.49 69.98 A 34 34 0 0 1 20.63 67.12 L 6.57 70.44 A 48 48 0 0 1 2.85 58.99 L 16.17 53.41 A 34 34 0 0 1 16.00 50.00 A 34 34 0 0 1 16.17 46.59 L 2.85 41.01 A 48 48 0 0 1 6.57 29.56 L 20.63 32.88 A 34 34 0 0 1 22.49 30.02 A 34 34 0 0 1 24.64 27.36 L 17.14 15.01 A 48 48 0 0 1 26.88 7.94 L 36.30 18.88 A 34 34 0 0 1 39.49 17.66 A 34 34 0 0 1 42.79 16.77 L 43.98 2.38 A 48 48 0 0 1 56.02 2.38 L 57.21 16.77 A 34 34 0 0 1 60.51 17.66 A 34 34 0 0 1 63.70 18.88 L 73.12 7.94 A 48 48 0 0 1 82.86 15.01 L 75.36 27.36 A 34 34 0 0 1 77.51 30.02 A 34 34 0 0 1 79.37 32.88 L 93.43 29.56 A 48 48 0 0 1 97.15 41.01 L 83.83 46.59 A 34 34 0 0 1 84.00 50.00 Z M 50 31 A 19 19 0 1 0 50 69 A 19 19 0 1 0 50 31 Z" />
                  </svg>
                </motion.div>

                {/* Small Gear (Bottom-Left) - 8 teeth */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 5.4, repeat: Infinity, ease: "linear" }}
                  className="w-[37px] h-[37px] absolute bottom-0 left-[18px] origin-center"
                >
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <path fill="currentColor" fillRule="evenodd" d="M 82.00 50.00 A 32 32 0 0 1 81.75 54.01 L 96.67 61.21 A 48 48 0 0 1 90.93 75.08 L 75.28 69.61 A 32 32 0 0 1 72.63 72.63 A 32 32 0 0 1 69.61 75.28 L 75.08 90.93 A 48 48 0 0 1 61.21 96.67 L 54.01 81.75 A 32 32 0 0 1 50.00 82.00 A 32 32 0 0 1 45.99 81.75 L 38.79 96.67 A 48 48 0 0 1 24.92 90.93 L 30.39 75.28 A 32 32 0 0 1 27.37 72.63 A 32 32 0 0 1 24.72 69.61 L 9.07 75.08 A 48 48 0 0 1 3.33 61.21 L 18.25 54.01 A 32 32 0 0 1 18.00 50.00 A 32 32 0 0 1 18.25 45.99 L 3.33 38.79 A 48 48 0 0 1 9.07 24.92 L 24.72 30.39 A 32 32 0 0 1 27.37 27.37 A 32 32 0 0 1 30.39 24.72 L 24.92 9.07 A 48 48 0 0 1 38.79 3.33 L 45.99 18.25 A 32 32 0 0 1 50.00 18.00 A 32 32 0 0 1 54.01 18.25 L 61.21 3.33 A 48 48 0 0 1 75.08 9.07 L 69.61 24.72 A 32 32 0 0 1 72.63 27.37 A 32 32 0 0 1 75.28 30.39 L 90.93 24.92 A 48 48 0 0 1 96.67 38.79 L 81.75 45.99 A 32 32 0 0 1 82.00 50.00 Z M 50 33 A 17 17 0 1 0 50 67 A 17 17 0 1 0 50 33 Z" />
                  </svg>
                </motion.div>
              </div>

              {/* Headline */}
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Site em Manutenção
              </h1>

              <p className="text-xs text-zinc-400 max-w-md -mt-1 leading-relaxed">
                Este site encontra-se temporariamente em manutenção preventiva para atualização de recursos e estabilidade dos serviços.
              </p>

              {/* Action Button */}
              <button 
                type="button"
                onClick={() => alert("Exemplo de clique do cliente: Abre WhatsApp direto com o suporte (+55 24 98100-0306).")}
                className="mt-1 inline-flex items-center justify-center gap-2.5 bg-[#D7FE03] hover:bg-[#e5ff33] text-black font-bold text-sm px-8 py-3.5 rounded-full transition-all shadow-[0_4px_20px_rgba(215,254,3,0.35),0_0_35px_rgba(215,254,3,0.2)] hover:shadow-[0_6px_28px_rgba(215,254,3,0.55),0_0_45px_rgba(215,254,3,0.4)] hover:-translate-y-0.5 cursor-pointer"
              >
                <Phone className="w-4 h-4 text-black fill-black" />
                <span>Falar com o Suporte</span>
              </button>

              {/* Footer text */}
              <div className="mt-4 text-[11px] text-zinc-500 uppercase tracking-wider">
                AnimaSystem • Sistemas personalizados para seu negócio!
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Red Banner Live Preview Modal */}
      <AnimatePresence>
        {showBannerPreview && (
          <div className="fixed inset-0 z-[120] bg-zinc-900/90 backdrop-blur-md flex flex-col items-center justify-start overflow-y-auto p-4 sm:p-6 font-sans">
            {/* Modal Controls Header */}
            <div className="w-full max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4 mb-4 z-30">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-base flex items-center gap-2">
                    Pré-visualização da Faixa Vermelha
                    <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                      Régua de Vencimento &amp; Tolerância
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-400">Veja exatamente como o alerta surge no topo do site do cliente</p>
                </div>
              </div>

              {/* Mode Selector Tabs */}
              <div className="flex items-center gap-1.5 bg-zinc-800/90 p-1.5 rounded-2xl border border-zinc-700/80">
                <button
                  type="button"
                  onClick={() => setBannerPreviewMode('overdue')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    bannerPreviewMode === 'overdue'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-700/60'
                  }`}
                >
                  Em Tolerância (Atrasado)
                </button>
                <button
                  type="button"
                  onClick={() => setBannerPreviewMode('today')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    bannerPreviewMode === 'today'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-700/60'
                  }`}
                >
                  Vence Hoje
                </button>
                <button
                  type="button"
                  onClick={() => setBannerPreviewMode('upcoming')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    bannerPreviewMode === 'upcoming'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-700/60'
                  }`}
                >
                  7 Dias Antes
                </button>
              </div>

              {/* Close preview button */}
              <button
                type="button"
                onClick={() => setShowBannerPreview(false)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-lg backdrop-blur-md border border-white/10"
              >
                <X className="w-4 h-4" />
                Fechar Pré-visualização
              </button>
            </div>

            {/* Simulated Browser Window Frame */}
            <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-zinc-700 overflow-hidden flex flex-col min-h-[500px] relative">
              {/* Browser Mock Header */}
              <div className="bg-zinc-100 border-b border-zinc-200 px-4 py-2.5 flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400/80"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-400/80"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-400/80"></div>
                </div>
                <div className="flex-1 max-w-md mx-auto bg-white border border-zinc-200 rounded-lg px-3 py-1 text-xs text-zinc-500 font-mono text-center flex items-center justify-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-zinc-400" />
                  <span>https://{formData.domain || 'www.site-do-cliente.com.br'}</span>
                </div>
              </div>

              {/* Red Banner Simulation at the Top */}
              <motion.div
                key={bannerPreviewMode}
                initial={{ y: -40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white px-4 sm:px-6 py-3 shadow-[0_4px_16px_rgba(220,38,38,0.45)] border-b border-white/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative z-20"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-xs sm:text-sm font-medium text-white leading-tight drop-shadow-xs">
                    {bannerPreviewMode === 'overdue' && (
                      <span>
                        <strong className="font-extrabold">Seu plano venceu há 3 dias.</strong> Evite a suspensão do seu serviço! (restam 5 dias de tolerância antes da suspensão automática).
                      </span>
                    )}
                    {bannerPreviewMode === 'today' && (
                      <span>
                        <strong className="font-extrabold">Aviso de Vencimento:</strong> Seu plano vence hoje! Evite a suspensão do seu serviço.
                      </span>
                    )}
                    {bannerPreviewMode === 'upcoming' && (
                      <span>
                        <strong className="font-extrabold">Aviso de Vencimento de Hospedagem:</strong> Faltam 7 dias para o vencimento. Mantenha seu site e serviços ativos.
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const checkoutLink = `${currentOrigin}/checkout?renov=true&client=${encodeURIComponent(guardClientId)}`;
                    window.open(checkoutLink, '_blank');
                  }}
                  className="px-4 py-1.5 rounded-full bg-white hover:bg-yellow-100 text-red-600 hover:text-red-800 font-extrabold text-xs uppercase tracking-wider transition-all shadow-md shrink-0 self-stretch sm:self-auto cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Renovar Plano Agora</span>
                </button>
              </motion.div>

              {/* Simulated Client Website Body */}
              <div className="p-8 sm:p-12 flex-1 bg-zinc-50 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center text-zinc-400 shadow-xs">
                  <Building2 className="w-8 h-8 text-zinc-400" />
                </div>
                <h4 className="text-xl font-bold text-zinc-800">
                  {formData.name || 'Website do Cliente'}
                </h4>
                <p className="text-sm text-zinc-500 max-w-md">
                  O conteúdo normal do site continua navegável pelo visitante, enquanto a faixa vermelha de aviso orienta o cliente a manter a mensalidade em dia.
                </p>
                <div className="pt-4 flex items-center gap-2 text-xs text-zinc-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Proteção AnimaSystem Guard Ativa</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );

  return createPortal(modalContent, document.body);
}
