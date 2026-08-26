import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, getCountFromServer } from "firebase/firestore";

const cfg = {
  "messagingSenderId": "995124443655",
  "storageBucket": "tudonovo-animasystem.firebasestorage.app",
  "authDomain": "tudonovo-animasystem.firebaseapp.com",
  "measurementId": "G-JSPYSC7BM5",
  "projectId": "tudonovo-animasystem",
  "apiKey": "AIzaSyCfNK_u-zx1WWSfalFqH66XvXbmeLqp0p0",
  "appId": "1:995124443655:web:8728bac67a02a61f4f48a2"
};

const appFirebase = initializeApp(cfg);
const db = getFirestore(appFirebase);

async function run() {
  try {
    const snap = await getCountFromServer(collection(db, "users"));
    console.log("Users count:", snap.data().count);
  } catch(e: any) {
    console.error("Error reading users:", e.message);
  }
}
run();
