import type { VercelRequest, VercelResponse } from '@vercel/node';
import { firestoreGetDoc, firestoreListDocs } from './_firebase-rest';

function cleanDomain(d: string): string {
  return d.toLowerCase()
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\/.*$/, '')
    .trim();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { domain, id, client, host } = req.query;
    const targetId = (id || client) as string | undefined;
    const targetDomain = (domain || host) as string | undefined;

    let clientData: any = null;
    let clientDocId: string = "";

    // 1. Try to find by Firestore Document ID directly
    if (targetId && typeof targetId === "string" && targetId.trim() !== "") {
      const cleanId = targetId.trim();
      try {
        const directDoc = await firestoreGetDoc("clients", cleanId);
        if (directDoc) {
          clientDocId = directDoc.id;
          clientData = directDoc.data;
        }
      } catch (e) {
        console.warn("Direct getDoc failed for id:", cleanId, e);
      }
    }

    // 2. Search across all clients by ID or domain / website
    if (!clientData) {
      try {
        const allClients = await firestoreListDocs("clients", 100);
        const normalizedTargetDomain = targetDomain ? cleanDomain(targetDomain) : '';
        const cleanTargetId = targetId ? targetId.trim().toLowerCase() : '';
        
        for (const docObj of allClients) {
          const d = docObj.data;
          const curDocId = docObj.id.toLowerCase();
          const curInternalId = d.id ? String(d.id).toLowerCase() : '';
          const docDomain = d.domain ? cleanDomain(d.domain) : '';
          const docWebsite = d.website ? cleanDomain(d.website) : '';
          
          if (cleanTargetId && (curDocId === cleanTargetId || curInternalId === cleanTargetId)) {
            clientData = d;
            clientDocId = docObj.id;
            break;
          }

          if (normalizedTargetDomain && (
            (docDomain && (docDomain === normalizedTargetDomain || normalizedTargetDomain.includes(docDomain) || docDomain.includes(normalizedTargetDomain))) ||
            (docWebsite && (docWebsite === normalizedTargetDomain || normalizedTargetDomain.includes(docWebsite) || docWebsite.includes(normalizedTargetDomain)))
          )) {
            clientData = d;
            clientDocId = docObj.id;
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

    let renewalDate: Date;
    if (clientData.nextRenewalDate && /^\d{4}-\d{2}-\d{2}/.test(clientData.nextRenewalDate)) {
      const [y, m, d] = clientData.nextRenewalDate.split('-').map(Number);
      renewalDate = new Date(y, m - 1, d);
    } else {
      const now = new Date();
      const dueDay = Number(clientData.dueDate) || 10;
      renewalDate = new Date(now.getFullYear(), now.getMonth(), dueDay);
      if (now.getDate() > dueDay) {
        renewalDate.setMonth(renewalDate.getMonth() + 1);
      }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(renewalDate);
    checkDate.setHours(0, 0, 0, 0);
    const diffMs = checkDate.getTime() - today.getTime();
    const daysUntilRenewal = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    const isOverdue = daysUntilRenewal < 0;
    const overdueDays = isOverdue ? Math.abs(daysUntilRenewal) : 0;
    const toleranceRemaining = Math.max(0, 8 - overdueDays);
    const isAutoSuspended = daysUntilRenewal <= -8;
    const isSuspended = isSuspendedManual || isAutoSuspended;

    const showRenewalWarning = !isSuspended && (daysUntilRenewal <= 7 && daysUntilRenewal >= -7);
    const renewalDateFormatted = `${String(renewalDate.getDate()).padStart(2, '0')}/${String(renewalDate.getMonth() + 1).padStart(2, '0')}/${renewalDate.getFullYear()}`;

    const rawPlan = (clientData.plan || 'profissional').toLowerCase();
    const planSlug = rawPlan.includes('starter') ? 'starter' : rawPlan.includes('enterprise') ? 'enterprise' : 'pro';

    return res.status(200).json({
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
}
