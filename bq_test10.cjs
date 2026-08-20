const { google } = require('googleapis');
require('dotenv').config();

async function run() {
  const gcpKey = process.env.GCP_SERVICE_ACCOUNT_JSON;
  const credentials = JSON.parse(gcpKey);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/cloud-platform', 'https://www.googleapis.com/auth/bigquery.readonly'],
  });
  const bigquery = google.bigquery({ version: "v2", auth });
  
  const bqProjectId = "animahub";
  const datasetId = "faturamento_clientes";
  
  try {
    const tables = await bigquery.tables.list({ projectId: bqProjectId, datasetId });
    console.log("Tables:", tables.data.tables.map(t => t.tableReference.tableId));
  } catch(e) {
    console.log("Error:", e.message);
  }
}
run();
