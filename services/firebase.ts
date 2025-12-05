import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

// Definição de tipo para configuração global injetada pelo ambiente (comum em previews)
declare global {
  interface Window {
    __firebase_config?: any;
  }
}

// Configuração Fallback (Usando as credenciais fornecidas no prompt)
const defaultFirebaseConfig = {
  apiKey: "AIzaSyAe5vcJe5mUUxAX5mXWFjCwL26esbxLvbo",
  authDomain: "projeto-p-c672e.firebaseapp.com",
  databaseURL: "https://projeto-p-c672e-default-rtdb.firebaseio.com",
  projectId: "projeto-p-c672e",
  storageBucket: "projeto-p-c672e.firebasestorage.app",
  messagingSenderId: "474078684255",
  appId: "1:474078684255:web:78313a16cab4e501e0a7ea",
  measurementId: "G-DX6WX55RB8"
};

// Usa a config do window se existir (ambiente dinâmico), senão usa a hardcoded
const firebaseConfig = window.__firebase_config || defaultFirebaseConfig;

// Initialize Firebase
// Nota: O código usa 'getDatabase' (Realtime Database). Embora o prompt mencione Firestore,
// o código do App.tsx (ref, onValue) é estritamente para Realtime Database.
// Manteremos Realtime Database para evitar quebra de contrato com o código existente.
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);