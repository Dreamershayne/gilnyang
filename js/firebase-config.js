// ⚠️ Firebase Console > 프로젝트 설정 > 내 앱 에서 복사한 값으로 교체하세요
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyCrTc8dfSzjqTcsFi-ytUnh_ZsWdhGQlWE",
  authDomain: "gilnyang-a9516.firebaseapp.com",
  projectId: "gilnyang-a9516",
  storageBucket: "gilnyang-a9516.firebasestorage.app",
  messagingSenderId: "496614893032",
  appId: "1:496614893032:web:51352e2f69dde60774f05d",
  measurementId: "G-7VWF446Q9F",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export {
  app,
  auth,
  db,
  storage,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
  ref,
  uploadBytes,
  getDownloadURL,
};
