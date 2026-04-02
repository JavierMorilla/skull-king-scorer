import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyA_9LiAjzdVTcIc3Jewa7WkjL7XApcuFl4",
  authDomain: "skull-king-60738.firebaseapp.com",
  projectId: "skull-king-60738",
  storageBucket: "skull-king-60738.firebasestorage.app",
  messagingSenderId: "719303534513",
  appId: "1:719303534513:web:a15ee8e3a68b0370583f90"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
