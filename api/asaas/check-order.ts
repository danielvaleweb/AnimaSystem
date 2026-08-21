import type { VercelRequest, VercelResponse } from '@vercel/node';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { getServerFirebase } from '../_firebase';
import { processConfirmedAsaasPayment } from '../_asaas-processor';

function getAsaasApiUrl(endpoint: string): string {
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
  if (!raw.endsWith("/v3") && !raw.includes("/v3")) {
    raw = `${raw}/v3`;
  }
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${raw}${cleanEndpoint}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { db } = getServerFirebase();
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

    if (orderData.status === "paid") {
      return res.status(200).json({
        status: "paid",
        orderId,
        customerName: orderData.customerName,
        amount: orderData.amount,
        planId: orderData.planId
      });
    }

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

      const confirmedStatuses = ["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH", "DUNNING_RECEIVED"];
      if (paymentStatus && confirmedStatuses.includes(paymentStatus)) {
        let clientId = null;
        try {
          await updateDoc(doc(db, "orders", orderDocSnap.id), {
            status: "paid",
            asaasPaymentStatus: paymentStatus,
            billingType: paymentData?.billingType || orderData.billingType,
            paidAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });

          clientId = await processConfirmedAsaasPayment(db, orderData, paymentData);
        } catch (syncErr) {
          console.error("Error updating Firestore on confirmed payment:", syncErr);
        }

        return res.status(200).json({
          status: "paid",
          orderId,
          clientId,
          customerName: orderData.customerName,
          amount: orderData.amount,
          planId: orderData.planId
        });
      }
    }

    return res.status(200).json({
      status: orderData.status || "pending",
      orderId
    });

  } catch (err: any) {
    console.warn("Error checking order status:", err.message);
    return res.status(200).json({ status: "pending", orderId: req.query.orderId });
  }
}
