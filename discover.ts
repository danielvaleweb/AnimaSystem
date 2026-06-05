import monitoring from '@google-cloud/monitoring';
const client = new monitoring.MetricServiceClient();
async function run() {
  const projectId = 'gen-lang-client-0162085067'; // Wait, let's just get project from env or just list metrics from a valid project if we have one. actually I don't have the google cloud project id readily available in this script without auth.
}
