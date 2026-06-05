import fetch from 'node-fetch';
import fs from 'fs';

async function main() {
   const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
   const projectId = config.projectId;
   
   const res = await fetch(`http://localhost:3000/api/gcp/discovery?projectId=${projectId}`);
   const data = (await res.json()) as any;
   const metrics = data.metrics;
   
   const targetMetrics = [
     'firestore.googleapis.com/document/read_count',
     'firestore.googleapis.com/document/read_ops_count',
     'serviceruntime.googleapis.com/api/request_count'
   ];
   
   // We didn't fetch labels in the discovery endpoint. Let's hit the original library since we installed google-cloud/monitoring locally?
   // Actually, the server's discovery endpoint only returns type, displayName, description, unit, metricKind, valueType.
}

main().catch(console.error);
