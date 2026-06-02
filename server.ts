import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import fs from "fs";
import cors from "cors";

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
