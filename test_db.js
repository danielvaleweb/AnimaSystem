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
    if (data.name === "CR IMÓVEIS DE LUXO" || data.name === "Tudo Novo") {
       console.log("---", data.name, "---");
       console.log(JSON.stringify(data.parsedFirebaseConfig, null, 2));
    }
  });
}
run();
