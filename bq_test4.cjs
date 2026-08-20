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
  const datasetId = "faturamento_clientes";
  const tableId = "gcp_billing_export_v1_016A4C_B3CE07_A13B9F";
  
  try {
    const query = `
      SELECT 
        project.id AS project_id, 
        project.name AS project_name,
        service.description,
        sku.description,
        SUM(cost) as cost,
        SUM((SELECT SUM(c.amount) FROM UNNEST(credits) c)) as credits,
        currency,
        invoice.month
      FROM \`${bqProjectId}.${datasetId}.${tableId}\` 
      WHERE project.id = 'gen-lang-client-0353496357'
      GROUP BY 1, 2, 3, 4, 7, 8
      ORDER BY invoice.month DESC, cost DESC
    `;
    const qRes = await bigquery.jobs.query({
      projectId: credentials.project_id,
      requestBody: { query, useLegacySql: false }
    });
    console.log("Detailed BQ:", JSON.stringify(qRes.data.rows, null, 2));
  } catch(e) {
    console.log("Error:", e.message);
  }
}
run();
