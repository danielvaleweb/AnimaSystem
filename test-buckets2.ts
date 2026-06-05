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
   const projectId = "gen-lang-client-0162085067";
   const projectName = client.projectPath(projectId);
   
   const filters = [
      'metric.type="firestore.googleapis.com/document/read_ops_count"',
      'metric.type="firestore.googleapis.com/document/read_count"',
      'metric.type="firestore.googleapis.com/api/billable_read_units"',
      'metric.type="firestore.googleapis.com/api/request_count"',
      'metric.type="serviceruntime.googleapis.com/api/request_count" AND resource.labels.service="firestore.googleapis.com"',
      'metric.type="firestore.googleapis.com/rules/evaluation_count"'
   ];

   const now = Date.now();
   const startTime = { seconds: Math.floor((now - 1 * 24 * 60 * 60 * 1000) / 1000) };
   const endTime = { seconds: Math.floor(now / 1000) };

   for (const filter of filters) {
       console.log("Checking:", filter);
       try {
           const [timeSeries] = await client.listTimeSeries({
             name: projectName,
             filter,
             interval: { startTime, endTime },
             aggregation: {
               alignmentPeriod: { seconds: 3600 },
               perSeriesAligner: "ALIGN_SUM",
               crossSeriesReducer: "REDUCE_SUM"
             }
           });
           let total = 0;
           for (const series of timeSeries) {
              for (const pt of series.points || []) total += Number(pt.value.int64Value || pt.value.doubleValue || 0);
           }
           console.log("  => Total:", total);
       } catch (e: any) {
           console.log("  => Error:", e.message);
       }
   }
}

main().catch(console.error);
