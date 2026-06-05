import { MetricServiceClient } from "@google-cloud/monitoring";
import { google } from "googleapis";
import "dotenv/config";
import fs from "fs";

async function main() {
   const gcpKey = process.env.GCP_SERVICE_ACCOUNT_JSON;
   const credentials = JSON.parse(gcpKey);
   const auth = new google.auth.GoogleAuth({
       credentials,
       scopes: ['https://www.googleapis.com/auth/cloud-platform', 'https://www.googleapis.com/auth/monitoring.read'],
   });
   const clientOptions = { authClient: await auth.getClient() };
   const client = new MetricServiceClient(clientOptions);
   
   const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
   const projectId = config.projectId;
   const projectName = client.projectPath(projectId);
   
   const now = Date.now();
   const reqObj = {
     name: projectName,
     filter: 'metric.type="serviceruntime.googleapis.com/api/request_count" AND resource.labels.service="firestore.googleapis.com"',
     interval: {
       startTime: { seconds: Math.floor((now - 30 * 24 * 60 * 60 * 1000) / 1000) },
       endTime: { seconds: Math.floor(now / 1000) }
     },
     aggregation: {
       alignmentPeriod: { seconds: 86400 },
       perSeriesAligner: "ALIGN_SUM",
       crossSeriesReducer: "REDUCE_SUM",
       groupByFields: ["resource.labels.method"]
     }
   };
   
   const [timeSeries] = await client.listTimeSeries(reqObj as any);
   console.log("read_count by type:");
   for (const series of timeSeries) {
      let total = 0;
      for (const pt of series.points || []) total += Number(pt.value.int64Value || 0);
      console.log(`Method: ${JSON.stringify(series.resource?.labels)} => ${total}`);
   }
}

main().catch(console.error);
