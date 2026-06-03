import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import fs from "fs";
import path from "path";

// Add vercel runtime export to ensure it's treated as a single serverless function
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Configura CORS para permitir que o cliente acesse de outro domínio
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { domain } = req.query;
    if (!domain || typeof domain !== "string") {
      return res.status(400).json({ error: "O parâmetro 'domain' é obrigatório." });
    }

    // Carrega a configuração do Firebase do arquivo json
    const firebaseConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
    let firebaseConfig;
    if (fs.existsSync(firebaseConfigPath)) {
       firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf8"));
    } else {
       return res.status(500).json({ error: "Configuração do Firebase não encontrada no Vercel." });
    }

    // Inicializa o firebase (Singleton para evitar erro do Vercel executar várias vezes)
    const appFirebase = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    const db = getFirestore(appFirebase, firebaseConfig.firestoreDatabaseId);

    // Busca o cliente pelo domínio
    const clientsRef = collection(db, "clients");
    const q = query(clientsRef, where("domain", "==", domain));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return res.status(404).json({ error: "Cliente não encontrado.", active: false });
    }

    const clientDoc = snapshot.docs[0];
    const clientData = clientDoc.data();

    // Check transactions for this client to see if they are overdue
    const transactionsRef = collection(db, "transactions");
    const trxQuery = query(transactionsRef, where("clientName", "==", clientData.name));
    const trxSnapshot = await getDocs(trxQuery);
    
    let isOverdue = false;
    const today = new Date();
    const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const todayDay = today.getDate();

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

    if (!hasPaidThisMonth && clientData.status === 'active' && clientData.monthlyValue) {
      const dueDay = Number(clientData.dueDate) || 1;
      if (dueDay < todayDay) {
         isOverdue = true;
      }
    }

    return res.status(200).json({
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
}
