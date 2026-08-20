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
      SELECT 
        MIN(usage_start_time) as first_usage,
        MAX(usage_start_time) as last_usage,
        SUM(cost) as total_cost
      FROM \`${bqProjectId}.${datasetId}.${tableId}\` 
    `;
    const qRes = await bigquery.jobs.query({
      projectId: credentials.project_id,
      requestBody: { query, useLegacySql: false }
    });
    console.log("Usage Date Range:", JSON.stringify(qRes.data.rows, null, 2));
  } catch(e) {
    console.log("Error:", e.message);
  }
}
run();
