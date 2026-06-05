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
   
   const now = Date.now();
   const startTime = { seconds: Math.floor((now - 1 * 24 * 60 * 60 * 1000) / 1000) };
   const endTime = { seconds: Math.floor(now / 1000) };
   
   const filters = [
      'metric.type="firestore.googleapis.com/document/read_count"',
      'metric.type="firestore.googleapis.com/document/read_ops_count"',
      'metric.type="firestore.googleapis.com/api/billable_read_units"',
      'metric.type="firestore.googleapis.com/document/write_ops_count"'
   ];

   for (const filter of filters) {
       console.log("Checking:", filter);
       try {
           const [timeSeries] = await client.listTimeSeries({
             name: projectName,
             filter,
             interval: { startTime, endTime },
             aggregation: {
               // try smaller alignment
               alignmentPeriod: { seconds: 3600 },
               perSeriesAligner: "ALIGN_SUM",
               crossSeriesReducer: "REDUCE_SUM"
             }
           });
           let total = 0;
           for (const series of timeSeries) {
              for (const pt of series.points || []) total += Number(pt.value.int64Value || pt.value.doubleValue || 0);
           }
           console.log("  => Total (1hr buckets):", total);
       } catch (e: any) {
           console.error("  => Error:", e.message);
       }
   }
}

main().catch(console.error);
