import type { VercelRequest, VercelResponse } from '@vercel/node';
import { MercadoPagoConfig, Payment } from "mercadopago";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
import fs from "fs";
import path from "path";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    if (req.query.type === "payment" && req.query["data.id"]) {
      const paymentId = req.query["data.id"] as string;
      
      const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN! });
      const mercadopagoPayment = new Payment(client);
      
      const paymentInfo = await mercadopagoPayment.get({ id: paymentId });
      
      if (paymentInfo.status === "approved") {
         const externalRef = paymentInfo.external_reference;
         if (externalRef) {
           const data = JSON.parse(externalRef);
           
           // Initialize Firebase
           const firebaseConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
           let firebaseConfig;
           if (fs.existsSync(firebaseConfigPath)) {
              firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf8"));
              const appFirebase = !getApps().length ? initializeApp(firebaseConfig) : getApp();
              const db = getFirestore(appFirebase, firebaseConfig.firestoreDatabaseId);

              // Save to Firebase
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
    }
    return res.status(200).send("OK");
  } catch (error: any) {
    console.error("Webhook error:", error);
    return res.status(500).send("Internal Server Error");
  }
}
