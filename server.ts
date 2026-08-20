import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";
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

  // API Route to check client status by domain
  app.get("/api/client-status", async (req, res) => {
    try {
      const { domain } = req.query;
      if (!domain || typeof domain !== "string") {
        return res.status(400).json({ error: "O parâmetro 'domain' é obrigatório." });
      }

      // Query clients by domain
      const clientsRef = collection(db, "clients");
      const q = query(clientsRef, where("domain", "==", domain));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return res.status(404).json({ error: "Cliente não encontrado.", active: false });
      }

      const clientDoc = snapshot.docs[0];
      const clientData = clientDoc.data();

      // Check transactions for this client to see if they are overdue
      // A full analysis would require checking if any transaction shows "overdue"
      // or "pending" for a past date, but we'll approximate based on what we have.
      const transactionsRef = collection(db, "transactions");
      const trxQuery = query(transactionsRef, where("clientName", "==", clientData.name));
      const trxSnapshot = await getDocs(trxQuery);
      
      let isOverdue = false;
      const today = new Date();
      const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
      const todayDay = today.getDate();

      // Check specific transactions 
      let foundOverdue = false;
      let hasPaidThisMonth = false;

      trxSnapshot.forEach(doc => {
        const trx = doc.data();
        if (trx.status === 'overdue') {
          foundOverdue = true;
        }
        if (trx.date && trx.date.startsWith(currentMonthStr) && trx.status === 'paid') {
            hasPaidThisMonth = true;
        }
      });

      if (foundOverdue) {
        isOverdue = true;
      }

      // Check the virtual overdue logic from the front-end
      if (!hasPaidThisMonth && clientData.status === 'active' && clientData.monthlyValue) {
        const dueDay = Number(clientData.dueDate) || 1;
        if (dueDay < todayDay) {
           isOverdue = true;
        }
      }

      return res.json({
        domain: clientData.domain,
        clientName: clientData.name,
        status: clientData.status, // "active", "inactive"
        isOverdue,
        message: isOverdue ? "Pagamento pendente/atrasado." : "Pagamento em dia."
      });

    } catch (error: any) {
      console.error(error);
      return res.status(500).json({ error: error.message });
    }
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
  app.post("/api/asaas/create-checkout", async (req, res) => {
    try {
      const { planId, items, coupon, customer, ownerId, userId } = req.body;

      if (!customer || !customer.name || !customer.cpf) {
        return res.status(400).json({ error: "Dados do cliente incompletos (nome e CPF são obrigatórios)." });
      }

      const ASAAS_API_KEY = (process.env.ASAAS_API_KEY || "").trim().replace(/^[`'"]+|[`'"]+$/g, "");
      if (!ASAAS_API_KEY) {
        console.error("ASAAS_API_KEY is not defined in environment variables.");
        return res.status(500).json({ error: "Integração Asaas não configurada no servidor (ASAAS_API_KEY ausente)." });
      }

      // 1. Sanitize customer data
      const cleanCpf = (customer.cpf || "").replace(/\D/g, "");
      const cleanPhone = (customer.phone || "").replace(/\D/g, "");
      const cleanEmail = (customer.email || "").trim() || `cliente_${cleanCpf}@animasystem.com.br`;
      const customerName = customer.name.trim();

      if (cleanCpf.length !== 11) {
        return res.status(400).json({ error: "CPF inválido. Deve conter 11 dígitos numéricos." });
      }

      const asaasHeaders = {
        "access_token": ASAAS_API_KEY,
        "Content-Type": "application/json"
      };

      // 2. Identify or Create Customer in Asaas Sandbox
      let asaasCustomerId: string | null = null;
      try {
        const searchCustomerUrl = getAsaasApiUrl("/customers", { cpfCnpj: cleanCpf });
        console.log(`[Asaas Sandbox] Searching customer: ${searchCustomerUrl}`);

        const searchCustomerRes = await fetch(searchCustomerUrl, {
          method: "GET",
          headers: asaasHeaders
        });

        if (searchCustomerRes.ok) {
          const searchData: any = await searchCustomerRes.json();
          if (searchData.data && searchData.data.length > 0) {
            asaasCustomerId = searchData.data[0].id;
            console.log(`[Asaas Sandbox] Existing customer found: ${asaasCustomerId}, syncing updated name: ${customerName}`);
            
            // Update customer on Asaas with current checkout details
            const updateCustomerUrl = getAsaasApiUrl(`/customers/${asaasCustomerId}`);
            await fetch(updateCustomerUrl, {
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
        console.log(`[Asaas Sandbox] Creating new customer: ${createCustomerUrl}`);

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
          const errorMsg = errData.errors?.[0]?.description || "Não foi possível registrar o cliente no Asaas.";
          return res.status(400).json({ error: errorMsg });
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

      // 6. Record Order in Firestore
      const orderDoc = {
        orderId,
        userId: userId || null,
        productId: planId || "profissional",
        planId: planId || "profissional",
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
        await addDoc(collection(db, "orders"), orderDoc);
      } catch (firestoreErr) {
        console.error("Error saving order to Firestore:", firestoreErr);
      }

      // 7. Also record Lead in Firestore for CRM dashboard
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

      // 8. Return secure safe response to frontend
      return res.json({
        success: true,
        checkoutUrl,
        orderId
      });

    } catch (error: any) {
      console.error("Error in Asaas checkout endpoint:", error);
      return res.status(500).json({ error: "Não foi possível iniciar o pagamento. Tente novamente." });
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
      if (orderData.customerCpf) {
        const clientQ = query(
          collection(db, "clients"),
          where("cpf", "==", orderData.customerCpf)
        );
        const clientSnap = await getDocs(clientQ);
        if (!clientSnap.empty) {
          existingClientId = clientSnap.docs[0].id;
          await updateDoc(doc(db, "clients", existingClientId), {
            status: "active",
            plan: planName,
            monthlyValue: amount,
            updatedAt: new Date().toISOString()
          });
          console.log(`[Asaas] Updated existing client ${existingClientId} to active`);
        }
      }

      if (!existingClientId) {
        const cleanDomain = clientName.toLowerCase().replace(/[^a-z0-9]/g, "");
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
          cpf: orderData.customerCpf || "",
          phone: orderData.customerPhone || "",
          email: orderData.customerEmail || "",
          ownerId,
          hireDate: todayStr,
          createdAt: new Date().toISOString()
        });
        existingClientId = newClientRef.id;
        console.log(`[Asaas] Created new active client ${existingClientId}`);
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
      const { bqProjectId, bqDatasetId, bqTableId } = req.query;
      
      if (!bqProjectId || !bqDatasetId || !bqTableId) {
        return res.status(400).json({ 
          error: "Os parâmetros 'bqProjectId', 'bqDatasetId' e 'bqTableId' são obrigatórios." 
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
      
      // We want to query the sum of costs per project for the current invoice month
      const today = new Date();
      const currentInvoiceMonth = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`; // YYYYMM format
      
      const prevMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const previousInvoiceMonth = `${prevMonthDate.getFullYear()}${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;

      const bqTablePath = `${bqProjectId}.${bqDatasetId}.${bqTableId}`;
      
      // Standard GCP BigQuery billing query
      const sqlQuery = `
        SELECT 
          project.id AS project_id, 
          project.name AS project_name,
          SUM(cost) + SUM(IFNULL((SELECT SUM(c.amount) FROM UNNEST(credits) c), 0)) AS total_cost,
          currency
        FROM 
          \`${bqTablePath}\`
        WHERE 
          invoice.month = '${currentInvoiceMonth}'
        GROUP BY 
          project_id, project_name, currency
      `;

      // Previous month GCP BigQuery billing query
      const sqlPrevQuery = `
        SELECT 
          project.id AS project_id, 
          project.name AS project_name,
          SUM(cost) + SUM(IFNULL((SELECT SUM(c.amount) FROM UNNEST(credits) c), 0)) AS total_cost,
          currency
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
            currency
          FROM 
            \`${bqTablePath}\`
          WHERE 
            invoice.month = '${currentInvoiceMonth}'
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

      // Let's matching these project IDs with clients list in our local Firestore!
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
        const matched = records.find(r => r.projectId.trim().toLowerCase() === firebaseProjectId);
        const prevMatched = prevRecords.find(r => r.projectId.trim().toLowerCase() === firebaseProjectId);
        
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
