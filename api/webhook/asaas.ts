import type { VercelRequest, VercelResponse } from '@vercel/node';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { getServerFirebase } from '../_firebase';
import { processConfirmedAsaasPayment } from '../_asaas-processor';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { db } = getServerFirebase();
    const event = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    console.log(`[Asaas Webhook] Event received: ${event.event}`, event.payment?.id || "");

    const payment = event.payment;
    if (payment) {
      const confirmedEvents = ["PAYMENT_RECEIVED", "PAYMENT_CONFIRMED", "PAYMENT_RECEIVED_IN_CASH_UNDONE"];
      
      if (confirmedEvents.includes(event.event)) {
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

          await processConfirmedAsaasPayment(db, orderData, payment);
          console.log(`[Asaas Webhook] Order ${orderData.orderId} processed successfully.`);
        }
      }
    }

    return res.status(200).json({ received: true });
  } catch (err: any) {
    console.error("[Asaas Webhook] Error processing webhook:", err);
    return res.status(500).json({ error: "Erro interno no processamento do webhook." });
  }
}
