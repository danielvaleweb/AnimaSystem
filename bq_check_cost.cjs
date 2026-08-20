const { google } = require('googleapis');
require('dotenv').config();

async function run() {
  const gcpKey = process.env.GCP_SERVICE_ACCOUNT_JSON;
  if (!gcpKey) {
    console.log("No GCP_SERVICE_ACCOUNT_JSON");
    return;
  }
  const credentials = JSON.parse(gcpKey);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/cloud-platform', 'https://www.googleapis.com/auth/bigquery.readonly'],
  });
  const bigquery = google.bigquery({ version: "v2", auth });
  
  const bqProjectId = "animahub";
  
  try {
    const datasetId = "faturamento_clientes";
    const tableId = "gcp_billing_export_v1_016A4C_B3CE07_A13B9F";
    const currentInvoiceMonth = `202608`;
    
    const query = `
      SELECT 
        project.id AS project_id, 
        project.name AS project_name,
        SUM(cost) + SUM(IFNULL((SELECT SUM(c.amount) FROM UNNEST(credits) c), 0)) AS total_cost,
        currency
      FROM \`${bqProjectId}.${datasetId}.${tableId}\` 
      WHERE invoice.month = '${currentInvoiceMonth}' 
      GROUP BY project_id, project_name, currency
    `;
    const qRes = await bigquery.jobs.query({
      projectId: credentials.project_id,
      requestBody: { query, useLegacySql: false }
    });
    console.log("Query Results:", JSON.stringify(qRes.data.rows, null, 2));
  } catch(e) {
    console.log("Error:", e.message);
  }
}
run();
