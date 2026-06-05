import { MetricServiceClient } from "@google-cloud/monitoring";
import { google } from "googleapis";
import "dotenv/config";

async function main() {
   const gcpKey = process.env.GCP_SERVICE_ACCOUNT_JSON;
   const credentials = JSON.parse(gcpKey!);
   const auth = new google.auth.GoogleAuth({
       credentials,
       scopes: ['https://www.googleapis.com/auth/cloud-platform', 'https://www.googleapis.com/auth/monitoring.read'],
   });
   const clientOptions = { authClient: await auth.getClient() };
   const client = new MetricServiceClient(clientOptions);
   
   const projectId = "animahub";
   const projectName = client.projectPath(projectId);
   
   const res = await client.listMetricDescriptors({
       name: projectName,
       filter: 'metric.type="firestore.googleapis.com/document/read_ops_count"'
   });
   
   console.log("Labels for read_ops_count:");
   for (const l of res[0][0]?.labels || []) {
       console.log(" -", l.key);
   }
}

main().catch(console.error);
