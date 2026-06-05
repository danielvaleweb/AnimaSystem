import type { VercelRequest, VercelResponse } from '@vercel/node';
import { MercadoPagoConfig, Payment } from "mercadopago";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
import fs from "fs";
import path from "path";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log("Webhook body:", req.body);
    console.log("Webhook query:", req.query);

    // Mercado Pago often sends data in the body for webhooks, or in query string
    const topic = req.query.topic || req.body?.topic;
    const type = req.query.type || req.body?.type;
    
    // Webhook from mercadopago has different payload structures depending on IPN or Webhook
    let paymentId = req.query["data.id"] || req.body?.data?.id || req.body?.id;

    if (type === "payment" || topic === "payment") {
      if (paymentId) {
        if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
          console.error("Missing MERCADOPAGO_ACCESS_TOKEN");
          return res.status(200).send("Config missing");
        }

        const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });
        const mercadopagoPayment = new Payment(client);
        
        try {
          const paymentInfo = await mercadopagoPayment.get({ id: paymentId as string });
          
          if (paymentInfo.status === "approved") {
             const externalRef = paymentInfo.external_reference;
             if (externalRef) {
               const data = JSON.parse(externalRef);
               
               // Initialize Firebase
               const firebaseConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
               if (fs.existsSync(firebaseConfigPath)) {
                  const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf8"));
                  const appFirebase = !getApps().length ? initializeApp(firebaseConfig) : getApp();
                  const db = getFirestore(appFirebase, firebaseConfig.firestoreDatabaseId);

                  // Save to Firebase
                  await addDoc(collection(db, "transactions"), {
                     ownerId: data.ownerId,
                     type: "entrada",
                     clientName: data.clientName || 'Desconhecido',
                     amount: paymentInfo.transaction_amount,
                     date: new Date(paymentInfo.date_approved || new Date()).toISOString().split('T')[0],
                     status: "paid",
                     method: "pix",
                     gateway: "mercadopago",
                     paymentId: paymentInfo.id,
                     createdAt: serverTimestamp()
                  });
                  console.log("Successfully recorded payment to Firebase.");
               }
             }
          }
        } catch (mpError: any) {
          console.error("Error fetching payment from MP:", mpError.message || mpError);
          // Don't fail the webhook request, return 200 so MP stops retrying
          return res.status(200).send("MP Error bypassed");
        }
      }
    }

    return res.status(200).send("OK");
  } catch (error: any) {
    console.error("General Webhook error:", error);
    return res.status(200).send("Handled Error"); // return 200 to acknowledge MP
  }
}
