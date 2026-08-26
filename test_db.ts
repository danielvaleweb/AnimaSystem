import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from "fs";

const firebaseConfigPath = "./firebase-applet-config.json";
const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf8"));
const appFirebase = initializeApp(firebaseConfig);
const db = getFirestore(appFirebase, firebaseConfig.firestoreDatabaseId);

async function run() {
  const snap = await getDocs(collection(db, "clients"));
  snap.forEach(d => {
    const data = d.data();
    console.log(data.name, "=> has parsedFirebaseConfig?", !!data.parsedFirebaseConfig);
  });
}
run();
