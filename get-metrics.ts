import fs from 'fs';

async function main() {
   const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
   const projectId = config.projectId;
   
   console.log('Project ID:', projectId);
   
   // hit the local server to get discovery using our new endpoint
   const res = await fetch(`http://localhost:3000/api/gcp/discovery?projectId=${projectId}`);
   if (!res.ok) {
     console.error('Failed to fetch:', await res.text());
     return;
   }
   const data = await res.json();
   const metrics = data.metrics;
   
   // filter those related to listeners, realtime, reads, requests
   const realtimeCandidates = metrics.filter((m: any) => 
     m.type.toLowerCase().includes('listen') ||
     m.description.toLowerCase().includes('listen') ||
     m.type.toLowerCase().includes('realtime') ||
     m.description.toLowerCase().includes('realtime') ||
     m.type.toLowerCase().includes('read') ||
     m.description.toLowerCase().includes('read') ||
     m.type.toLowerCase().includes('request')
   );
   
   for (const m of realtimeCandidates) {
     console.log(`- ${m.type} | ${m.displayName}`);
     console.log(`  Desc: ${m.description}`);
     console.log(`  Unit: ${m.unit} | Kind: ${m.metricKind} | Value: ${m.valueType}`);
   }
}

main().catch(console.error);
