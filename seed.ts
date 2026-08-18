import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));

const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app);

const volunteers = [
  {"id":"FC-VOL-2026-025","name":"Nikitha B"},
  {"id":"FC-VOL-2026-010","name":"Mayur Hangda"},
  {"id":"FC-VOL-2026-024","name":"Kalyani Kumari"},
  {"id":"FC-VOL-2026-021","name":"Sheenal Sharma"},
  {"id":"FC-VOL-2026-011","name":"Deepanshi Malviya"},
  {"id":"FC-VOL-2026-007","name":"Poonam Kumari"},
  {"id":"FC-VOL-2026-015","name":"Daniella Acheampong"},
  {"id":"FC-VOL-2026-013","name":"Okorie Ketandu Victory"},
  {"id":"FC-VOL-2026-019","name":"Jubachukwu Adaeze Blessing"},
  {"id":"FC-VOL-2026-042","name":"Bhumi Gupta"},
  {"id":"FC-VOL-2026-037","name":"Sarannya Mukherjee"},
  {"id":"FC-VOL-2026-041","name":"Arshin Ajesh O M"},
  {"id":"FC-VOL-2026-002","name":"Akshat Dubey"},
  {"id":"FC-VOL-2026-004","name":"Ashmita Mondal"},
  {"id":"FC-VOL-2026-018","name":"Kailash Kaverappa"},
  {"id":"FC-VOL-2026-006","name":"Vaishnavi Harpale"},
  {"id":"FC-VOL-2026-001","name":"Nehal Rajput"},
  {"id":"FC-VOL-2026-016","name":"Dolby Harne"},
  {"id":"FC-VOL-2026-003","name":"Okeke Rejoice"},
  {"id":"FC-VOL-2026-035","name":"Shraddha Kamthe"},
  {"id":"FC-VOL-2026-033","name":"Madhura Arvind"},
  {"id":"FC-VOL-2026-038","name":"Donaldson"},
  {"id":"FC-VOL-2026-032","name":"Anjali Chaudhary"},
  {"id":"FC-VOL-2026-029","name":"Adebayo Kehinde"},
  {"id":"FC-VOL-2026-027","name":"Pranav Kale"},
  {"id":"FC-VOL-2026-034","name":"Aayna Mohanty"},
  {"id":"FC-VOL-2026-026","name":"Navina Nathan"},
  {"id":"FC-VOL-2026-036","name":"Kaashiha S U"}
];

async function seed() {
  for (const vol of volunteers) {
    try {
      const email = `${vol.id.toLowerCase()}@forenclue.com`;
      const password = "Forenclue@2025";
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUid = userCredential.user.uid;
      
      await setDoc(doc(db, 'users', newUid), {
        id: newUid,
        forenclueId: vol.id,
        name: vol.name,
        email: email,
        role: 'VOLUNTEER',
        joiningDate: new Date().toISOString(),
        tempPasswordChanged: false,
        active: true,
        createdAt: Date.now()
      });
      
      await setDoc(doc(db, 'user_mappings', vol.id.toUpperCase()), { email });
      await signOut(auth);
      
      console.log(`Created ${vol.id} - ${vol.name}`);
      // sleep to avoid auth rate limits
      await new Promise(r => setTimeout(r, 600));
    } catch (e) {
      if (e.code === 'auth/email-already-in-use') {
         console.log(`User ${vol.id} already exists, skipping.`);
      } else {
         console.error(`Error for ${vol.id}:`, e.message);
      }
    }
  }
  console.log("Done");
  process.exit(0);
}

seed();
