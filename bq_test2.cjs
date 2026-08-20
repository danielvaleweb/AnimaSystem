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
  
  const bqProjectId = "animasystem-client";
  
  try {
    const ds = await bigquery.datasets.list({ projectId: bqProjectId });
    
    if (ds.data.datasets?.length > 0) {
      const datasetId = ds.data.datasets[0].datasetReference.datasetId;
      const tables = await bigquery.tables.list({ projectId: bqProjectId, datasetId });
      const tableId = tables.data.tables[0].tableReference.tableId;
      
      const query = `SELECT project.id, project.name, SUM(cost) as cost, currency FROM \`${bqProjectId}.${datasetId}.${tableId}\` WHERE invoice.month = '202608' GROUP BY 1, 2, 4`;
      const qRes = await bigquery.jobs.query({
        projectId: credentials.project_id,
        requestBody: { query, useLegacySql: false }
      });
      console.log("Query Results:", JSON.stringify(qRes.data.rows, null, 2));
    }
  } catch(e) {
    console.log("Error:", e.message);
  }
}
run();
