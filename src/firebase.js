import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey:"AIzaSyCGqFPzwPVwluaGZJF6FlNg_FxAHECq6yQ",
  authDomain: "rsapp-eda3a.firebaseapp.com",
  projectId: "rsapp-eda3a",
  storageBucket: "rsapp-eda3a.appspot.com",
  messagingSenderId: "791312567274",
  appId: "1:791312567274:web:0391e0f13d443127ecc093",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const setUserRole = async (userId, role) => {
  await setDoc(doc(db, 'users', userId), { role }, { merge: true });
};

export { auth, db, setUserRole };
