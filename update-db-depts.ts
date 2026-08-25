import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function updateDepartments() {
  const usersCol = collection(db, 'users');
  const snap = await getDocs(usersCol);
  
  for (const document of snap.docs) {
    const data = document.data();
    let updated = false;
    let newDept = data.department;
    let newDesg = data.designation;

    if (data.department === 'Creative & Design') {
      newDept = 'Creative & Graphics';
      updated = true;
    } else if (data.department === 'Events & Webinars') {
      newDept = 'Events & Management';
      updated = true;
    }

    if (data.designation && data.designation.includes('Creative & Design')) {
      newDesg = data.designation.replace('Creative & Design', 'Creative & Graphics');
      updated = true;
    }
    if (data.designation && data.designation.includes('Events & Webinars')) {
      newDesg = data.designation.replace('Events & Webinars', 'Events & Management');
      updated = true;
    }

    if (updated) {
      await updateDoc(doc(db, 'users', document.id), {
        department: newDept,
        designation: newDesg,
        updatedAt: new Date().toISOString()
      });
      console.log(`Updated user ${data.name}: ${newDept}`);
    }
  }

  const groupsCol = collection(db, 'chat_groups');
  const groupsSnap = await getDocs(groupsCol);
  for (const gDoc of groupsSnap.docs) {
    const gData = gDoc.data();
    let updated = false;
    let newName = gData.name;
    let newDept = gData.department;

    if (gData.name === 'Creative & Design') {
      newName = 'Creative & Graphics';
      updated = true;
    } else if (gData.name === 'Events & Webinars') {
      newName = 'Events & Management';
      updated = true;
    }

    if (gData.department === 'Creative & Design') {
      newDept = 'Creative & Graphics';
      updated = true;
    } else if (gData.department === 'Events & Webinars') {
      newDept = 'Events & Management';
      updated = true;
    }

    if (updated) {
      await updateDoc(doc(db, 'chat_groups', gDoc.id), {
        name: newName,
        department: newDept,
        updatedAt: new Date().toISOString()
      });
      console.log(`Updated group ${newName}`);
    }
  }

  console.log('Finished updating DB departments!');
  process.exit(0);
}

updateDepartments().catch(err => {
  console.error(err);
  process.exit(1);
});
