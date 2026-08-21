import type { VercelRequest, VercelResponse } from '@vercel/node';
import { firestoreQuery, firestoreUpdateDoc } from '../_firebase-rest';
import { processConfirmedAsaasPayment } from '../_asaas-processor';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const event = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    console.log(`[Asaas Webhook] Event received: ${event.event}`, event.payment?.id || "");

    const payment = event.payment;
    if (payment) {
      const confirmedEvents = ["PAYMENT_RECEIVED", "PAYMENT_CONFIRMED", "PAYMENT_RECEIVED_IN_CASH_UNDONE"];
      
      if (confirmedEvents.includes(event.event)) {
        let orderDoc: { id: string; data: Record<string, any> } | null = null;

        if (payment.externalReference) {
          const docs = await firestoreQuery("orders", "orderId", payment.externalReference);
          if (docs.length > 0) orderDoc = docs[0];
        }

        if (!orderDoc && payment.id) {
          const docs = await firestoreQuery("orders", "asaasPaymentId", payment.id);
          if (docs.length > 0) orderDoc = docs[0];
        }

        if (!orderDoc && payment.subscription) {
          const docs = await firestoreQuery("orders", "asaasSubscriptionId", payment.subscription);
          if (docs.length > 0) orderDoc = docs[0];
        }

        if (orderDoc) {
          const orderData = orderDoc.data;
          await firestoreUpdateDoc("orders", orderDoc.id, {
            status: "paid",
            asaasPaymentStatus: payment.status,
            billingType: payment.billingType,
            paidAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });

          await processConfirmedAsaasPayment(null, orderData, payment);
          console.log(`[Asaas Webhook] Order ${orderData.orderId} processed successfully.`);
        }
      }
    }

    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error("[Asaas Webhook] Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
