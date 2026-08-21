import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import fs from "fs";
import path from "path";

const fallbackFirebaseConfig = {
  projectId: "animahub",
  appId: "1:926962111868:web:1a3d720eb9cea247a540f9",
  apiKey: "AIzaSyDp2-sV6rHfkxqtNI39YYq2AcdX4I58Bx0",
  authDomain: "animahub.firebaseapp.com",
  firestoreDatabaseId: "(default)",
  storageBucket: "animahub.firebasestorage.app",
  messagingSenderId: "926962111868",
  measurementId: ""
};

export function getServerFirebase() {
  let firebaseConfig = fallbackFirebaseConfig;
  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (fs.existsSync(configPath)) {
      firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
    }
  } catch (e) {
    // Use fallback
  }

  const appFirebase = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  const db = getFirestore(appFirebase, firebaseConfig.firestoreDatabaseId || "(default)");
  return { app: appFirebase, db, config: firebaseConfig };
}
