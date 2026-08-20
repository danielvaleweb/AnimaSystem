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
  const tableId = "gcp_billing_export_v1_016A4C_B3CE07_A13B9F";
  
  try {
    const query = `
      SELECT *
      FROM \`${bqProjectId}.${datasetId}.${tableId}\` 
      LIMIT 1
    `;
    const qRes = await bigquery.jobs.query({
      projectId: credentials.project_id,
      requestBody: { query, useLegacySql: false }
    });
    console.log("Columns:", qRes.data.schema.fields.map(f => f.name).join(", "));
  } catch(e) {
    console.log("Error:", e.message);
  }
}
run();
