import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';

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
      console.log(doc.id, data.name, data.nextRenewalDate, data.dueDate, data.status);
    }
  });
}
run();
