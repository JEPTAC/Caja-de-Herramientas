import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js';
import {
  getAuth,
  setPersistence,
  browserLocalPersistence
} from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js';

const firebaseConfig = {
  apiKey: 'AIzaSyD02YaIMxLO2IPAJYZdPY2cWUvpkZDRo2U',
  authDomain: 'rendicion-de-cuentas-6aceb.firebaseapp.com',
  projectId: 'rendicion-de-cuentas-6aceb',
  storageBucket: 'rendicion-de-cuentas-6aceb.firebasestorage.app',
  messagingSenderId: '509564686428',
  appId: '1:509564686428:web:4e1257b5305dd8b4c51699',
  measurementId: 'G-BQ6DLM4ENY'
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
auth.languageCode = 'es';

setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.warn('No fue posible conservar la sesión local:', error);
});

export { app, db, auth };
