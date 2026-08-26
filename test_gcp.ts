import { google } from 'googleapis';
try {
  const credentials = {
    "project_info": { "project_number": "995124443655" }
  };
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/cloud-platform']
  });
  auth.getClient().then(() => console.log("Success")).catch(e => console.error("Client Error", e));
} catch(e) {
  console.error("Sync Error", e);
}
