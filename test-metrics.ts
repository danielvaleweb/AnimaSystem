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
   
   const reqCount = 'serviceruntime.googleapis.com/api/request_count';
   try {
       const [timeSeries] = await client.listTimeSeries({
           name: projectName,
           filter: `metric.type="${reqCount}" AND resource.labels.service="firestore.googleapis.com"`,
           interval: { startTime, endTime },
           aggregation: {
               alignmentPeriod: { seconds: 86400 },
               perSeriesAligner: "ALIGN_SUM",
               crossSeriesReducer: "REDUCE_SUM",
               groupByFields: ["resource.labels.method"]
           }
       });
       for (const series of timeSeries) {
           let total = 0;
           for (const pt of series.points || []) total += Number(pt.value.int64Value || 0);
           console.log(`Method %s: %d`, series.resource?.labels?.method, total);
       }
   } catch (e: any) { console.log(e.message); }
}

main().catch(console.error);
