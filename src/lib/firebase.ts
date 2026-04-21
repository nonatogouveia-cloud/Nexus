import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, query, where, onSnapshot, addDoc, serverTimestamp, orderBy, getDocs, doc, setDoc } from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';
const firebaseConfig = firebaseConfigJson as any;

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = () => signInWithPopup(auth, googleProvider);
export const logout = () => signOut(auth);

export { 
  collection, 
  query, 
  where,
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  orderBy, 
  getDocs, 
  doc, 
  setDoc,
  onAuthStateChanged
};
