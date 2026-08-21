import type { VercelRequest, VercelResponse } from '@vercel/node';
import { firestoreAddDoc, firestoreQuery } from '../_firebase-rest';

// Helper to build robust Asaas API URLs with proper base and query parameters
function getAsaasApiUrl(endpoint: string, queryParams?: Record<string, string | number | boolean | undefined>): string {
  let raw = (process.env.ASAAS_BASE_URL || "https://api-sandbox.asaas.com/v3").trim();
  raw = raw.replace(/^[`'"]+|[`'"]+$/g, "").trim();

  if (!raw || (!raw.startsWith("http://") && !raw.startsWith("https://"))) {
    if (raw.includes("asaas.com")) {
      raw = `https://${raw}`;
    } else {
      raw = "https://api-sandbox.asaas.com/v3";
    }
  }

  raw = raw.replace(/\/+$/, "");
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Helpful status message on GET request
  if (req.method === 'GET') {
    return res.status(200).json({
      status: "ok",
      service: "AnimaSystem Asaas Checkout API",
      environment: process.env.ASAAS_BASE_URL?.includes("api.asaas.com") ? "production" : "sandbox",
      hasApiKey: !!process.env.ASAAS_API_KEY,
      message: "API operacional. Envie uma requisição POST com os dados do cliente e plano para gerar o checkout."
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Use POST.' });
  }

  try {
    let body: any = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }
    body = body || {};

    const { planId, items, coupon, customer, ownerId, userId, isRenewal, clientId, renewalMonths } = body;

    if (!customer || !customer.name || !customer.cpf) {
      return res.status(400).json({ error: "Dados do cliente incompletos (nome e CPF são obrigatórios)." });
    }

    const ASAAS_API_KEY = (process.env.ASAAS_API_KEY || "").trim().replace(/^[`'"]+|[`'"]+$/g, "");
    if (!ASAAS_API_KEY) {
      console.error("ASAAS_API_KEY is not defined in environment variables.");
      return res.status(500).json({ 
        error: "Chave da API do Asaas não configurada no servidor (adicione a variável ASAAS_API_KEY nas configurações de ambiente da Vercel)." 
      });
    }

    // 1. Sanitize customer data
    const cleanCpf = String(customer.cpf || "").replace(/\D/g, "");
    const cleanPhone = String(customer.phone || "").replace(/\D/g, "");
    const cleanEmail = String(customer.email || "").trim() || `cliente_${cleanCpf}@animasystem.com.br`;
    const customerName = String(customer.name || "").trim();

    if (cleanCpf.length !== 11) {
      return res.status(400).json({ error: "CPF inválido. Deve conter exatamente 11 dígitos numéricos." });
    }

    const asaasHeaders = {
      "access_token": ASAAS_API_KEY,
      "Content-Type": "application/json"
    };

    // 2. Identify or Create Customer in Asaas
    let asaasCustomerId: string | null = null;
    try {
      const searchCustomerUrl = getAsaasApiUrl("/customers", { cpfCnpj: cleanCpf });
      const searchCustomerRes = await fetch(searchCustomerUrl, {
        method: "GET",
        headers: asaasHeaders
      });

      if (searchCustomerRes.ok) {
        const searchData: any = await searchCustomerRes.json();
        if (searchData.data && searchData.data.length > 0) {
          asaasCustomerId = searchData.data[0].id;
          
          // Background update details if needed
          const updateCustomerUrl = getAsaasApiUrl(`/customers/${asaasCustomerId}`);
          fetch(updateCustomerUrl, {
            method: "POST",
            headers: asaasHeaders,
            body: JSON.stringify({
              name: customerName,
              email: cleanEmail,
              mobilePhone: cleanPhone || undefined,
              phone: cleanPhone || undefined
            })
          }).catch(err => console.warn("Could not update Asaas customer details:", err));
        }
      }
    } catch (err: any) {
      console.error("Error checking customer in Asaas:", err.message);
    }

    if (!asaasCustomerId) {
      const createCustomerUrl = getAsaasApiUrl("/customers");
      const createCustomerRes = await fetch(createCustomerUrl, {
        method: "POST",
        headers: asaasHeaders,
        body: JSON.stringify({
          name: customerName,
          cpfCnpj: cleanCpf,
          email: cleanEmail,
          mobilePhone: cleanPhone || undefined,
          phone: cleanPhone || undefined,
          notificationDisabled: false
        })
      });

      if (!createCustomerRes.ok) {
        const errData: any = await createCustomerRes.json().catch(() => ({}));
        console.error("Asaas create customer failed:", errData);
        const errorMsg = errData.errors?.[0]?.description || "Não foi possível registrar o cliente no Asaas. Verifique os dados informados.";
        return res.status(400).json({ error: errorMsg });
      }

      const newCustomerData: any = await createCustomerRes.json();
      asaasCustomerId = newCustomerData.id;
    }

    // 3. Catalogue & Price determination
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
      try {
        const couponsFound = await firestoreQuery("coupons", "code", c);
        if (couponsFound.length > 0) {
          const cData = couponsFound[0].data;
          if (cData.active !== false && cData.discountPercent) {
            discountPercent = Number(cData.discountPercent);
          }
        }
      } catch (e) {
        console.warn("Could not query coupons:", e);
      }
      
      if (!discountPercent) {
        if (c === "ANIMA10" || c === "DESCONTO10") discountPercent = 10;
        else if (c === "VIP" || c === "RENOVAVIP") discountPercent = 15;
        else if (c === "ANIMA20" || c === "PROMO20") discountPercent = 20;
      }
    }

    const discountVal = (subtotal * discountPercent) / 100;
    const finalAmount = Math.max(5.00, subtotal - discountVal);

    // 4. Generate unique external reference
    const orderId = `order_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;
    const mainDescription = `Pedido ${orderId} - ${resolvedItems.map(i => i.name).join(" + ")}`;

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 3);
    const dueDateStr = dueDate.toISOString().split("T")[0];

    // 5. Create Asaas Checkout (Try subscription first, fallback to payment)
    let checkoutUrl = "";
    let asaasPaymentId: string | null = null;
    let asaasSubscriptionId: string | null = null;

    try {
      const createSubUrl = getAsaasApiUrl("/subscriptions");
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

        const paymentsUrl = getAsaasApiUrl(`/subscriptions/${subData.id}/payments`);
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

    if (!checkoutUrl) {
      const createPaymentUrl = getAsaasApiUrl("/payments");
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
      return res.status(500).json({ error: "URL de checkout do Asaas não foi retornada pela API." });
    }

    checkoutUrl = checkoutUrl.trim().replace(/^http:\/\//i, "https://");

    // 6. Record Order in Firestore (via REST)
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
      amount: Number(finalAmount.toFixed(2)),
      billingType: "UNDEFINED",
      status: "pending",
      externalReference: orderId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await firestoreAddDoc("orders", orderDoc);
    } catch (firestoreErr) {
      console.warn("Could not save order in Firestore REST:", firestoreErr);
    }

    // 7. Also record Lead in Firestore for CRM dashboard
    try {
      const effectiveOwnerUid = ownerId || "6rbybX9mBAMp8B6gS3zQ8rT0hW32";
      await firestoreAddDoc("leads", {
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
      console.warn("Could not record lead in Firestore REST:", leadErr);
    }

    return res.status(200).json({
      success: true,
      checkoutUrl,
      orderId
    });

  } catch (error: any) {
    console.error("Error in Asaas checkout serverless endpoint:", error);
    return res.status(500).json({ 
      error: error.message || "Erro inesperado ao processar pagamento com Asaas." 
    });
  }
}
