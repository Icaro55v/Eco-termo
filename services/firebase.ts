import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyCqIzWpvyn_q41-HhgOFtefmyBEpbLkJhU",
  authDomain: "projeto-almox-48819.firebaseapp.com",
  databaseURL: "https://projeto-almox-48819-default-rtdb.firebaseio.com",
  projectId: "projeto-almox-48819",
  storageBucket: "projeto-almox-48819.firebasestorage.app",
  messagingSenderId: "604367180658",
  appId: "1:604367180658:web:ab32ef3990a3d55f8083eb",
  measurementId: "G-THDGMNQLE9"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);