import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query } from 'firebase/firestore';
import { readFileSync } from 'fs';

const firebaseConfig = {
  projectId: "animahub",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  const q = query(collection(db, 'clients'));
  const snap = await getDocs(q);
  snap.forEach(doc => {
    const data = doc.data();
    if (data.name && data.name.toLowerCase().includes('cr')) {
      console.log(doc.id, data.name, 'nextRenewalDate:', data.nextRenewalDate, 'dueDate:', data.dueDate, 'status:', data.status);
    }
  });
  process.exit(0);
}
run().catch(console.error);
