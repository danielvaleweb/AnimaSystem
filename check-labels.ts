import { MetricServiceClient } from "@google-cloud/monitoring";
import { google } from "googleapis";
import "dotenv/config";
import fs from "fs";

async function main() {
   const gcpKey = process.env.GCP_SERVICE_ACCOUNT_JSON;
   let client;
   
   if (gcpKey) {
     const credentials = JSON.parse(gcpKey);
     const auth = new google.auth.GoogleAuth({
       credentials,
       scopes: ['https://www.googleapis.com/auth/cloud-platform', 'https://www.googleapis.com/auth/monitoring.read'],
     });
     const clientOptions = { authClient: await auth.getClient() };
     client = new MetricServiceClient(clientOptions);
   } else {
     client = new MetricServiceClient();
   }
   
   const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
   const projectId = config.projectId;

   const projectName = client.projectPath(projectId);
   const [descriptors1] = await client.listMetricDescriptors({
     name: projectName,
     filter: 'metric.type = starts_with("firestore.googleapis.com/")'
   });
   
   const [descriptors2] = await client.listMetricDescriptors({
     name: projectName,
     filter: 'metric.type = starts_with("serviceruntime.googleapis.com/api/")'
   });
   
   const descriptors = [...descriptors1, ...descriptors2];
   
   for (const d of descriptors) {
     if (d.type === 'firestore.googleapis.com/document/read_count' || 
         d.type === 'firestore.googleapis.com/document/read_ops_count' || 
         d.type === 'serviceruntime.googleapis.com/api/request_count') {
         console.log(d.type);
         console.log(d.labels?.map((l: any) => l.key).join(", "));
     }
   }
}

main().catch(console.error);
