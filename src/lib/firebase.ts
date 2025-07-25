
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAad17lH7fCNK5KHJkwQfX59plJuVlXd0A",
  authDomain: "communityproject-71e5d.firebaseapp.com",
  databaseURL: "https://communityproject-71e5d-default-rtdb.firebaseio.com",
  projectId: "communityproject-71e5d",
  storageBucket: "communityproject-71e5d.firebasestorage.app",
  messagingSenderId: "1097974054473",
  appId: "1:1097974054473:web:ad639e5784e30989cc4998",
  measurementId: "G-XXHZD0KTXV"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
