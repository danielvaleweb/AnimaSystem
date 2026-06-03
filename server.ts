import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import fs from "fs";
import cors from "cors";
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

// Initialize Firebase using the config
const firebaseConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf8"));
const appFirebase = initializeApp(firebaseConfig);
const db = getFirestore(appFirebase, firebaseConfig.firestoreDatabaseId);

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

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
