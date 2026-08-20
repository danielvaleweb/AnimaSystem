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
  
  // Find dataset
  const bqProjectId = "animasystem-client";
  
  try {
    const ds = await bigquery.datasets.list({ projectId: bqProjectId });
    console.log("Datasets:", ds.data.datasets?.map(d => d.datasetReference.datasetId));
    
    // We need to find the exact dataset and table. 
    // Let's just look at the .env to see what is configured for bqTableId.
  } catch(e) {
    console.log("Error:", e.message);
  }
}
run();
