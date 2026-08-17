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
      
      const bqTablePath = `${bqProjectId}.${bqDatasetId}.${bqTableId}`;
      
      // Standard GCP BigQuery billing query
      const sqlQuery = `
        SELECT 
          project.id AS project_id, 
          project.name AS project_name,
          SUM(cost) AS total_cost,
          currency
        FROM 
          \`${bqTablePath}\`
        WHERE 
          invoice.month = '${currentInvoiceMonth}'
        GROUP BY 
          project_id, project_name, currency
      `;

      console.log("Running BigQuery Billing Query:\n", sqlQuery);

      const queryRes = await bigquery.jobs.query({
        projectId: credentials.project_id, // We run the job in our service account project
        requestBody: {
          query: sqlQuery,
          useLegacySql: false
        }
      });

      const rows = queryRes.data.rows || [];
      const records = rows.map((row: any) => {
        // BigQuery query rows have values in f[index].v
        const projectId = row.f?.[0]?.v || '';
        const projectName = row.f?.[1]?.v || '';
        const totalCost = parseFloat(row.f?.[2]?.v || '0');
        const currency = row.f?.[3]?.v || 'USD';
        return { projectId, projectName, totalCost, currency };
      });

      // Query daily costs for high-fidelity real dashboard graphics
      let dailyRecords: any[] = [];
      try {
        const sqlDailyQuery = `
          SELECT 
            EXTRACT(DAY FROM TIMESTAMP(usage_start_time)) AS usage_day,
            SUM(cost) AS total_cost,
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
            useLegacySql: false
          }
        });
        
        const dailyRows = dailyQueryRes.data.rows || [];
        dailyRecords = dailyRows.map((row: any) => {
          const day = Number(row.f?.[0]?.v || '0');
          const cost = parseFloat(row.f?.[1]?.v || '0');
          const currency = row.f?.[2]?.v || 'USD';
          
          let costBRL = cost;
          if (currency === 'USD') {
            costBRL = cost * 5.20;
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
        if (matched) {
          // Update client in Firestore with bq fetched cost
          const docRef = doc(db, "clients", clientDoc.id);
          
          let costInBRL = matched.totalCost;
          // If currency is USD, we can multiply by current approximate exchange rate or use a standard rate
          if (matched.currency === 'USD') {
            costInBRL = matched.totalCost * 5.20;
          }

          const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
          const periodString = `${monthNames[today.getMonth()]} de ${today.getFullYear()} (Automático via BigQuery)`;

          await updateDoc(docRef, {
            gcpBillingCost: costInBRL,
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
