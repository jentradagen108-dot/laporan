
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, getDocs, getDoc, setDoc, doc, addDoc, updateDoc, deleteDoc, serverTimestamp, onSnapshot, Timestamp, query, where, limit, orderBy, runTransaction, FieldValue, increment, writeBatch } from 'firebase/firestore';

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD6F-pfLuauK6nQyB6-1MZl56-J6B0PTnc",
  authDomain: "laporan-b9456.firebaseapp.com",
  projectId: "laporan-b9456",
  storageBucket: "laporan-b9456.appspot.com",
  messagingSenderId: "705126693863",
  appId: "1:705126693863:web:a234a7d7d2022b76491b42",
  measurementId: "G-CMFF728Y20"
};


// Inisialisasi Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { 
    db,
    collection, 
    doc,
    updateDoc,
    deleteDoc,
    setDoc,
    getDocs,
    getDoc,
    addDoc,
    onSnapshot,
    serverTimestamp,
    Timestamp,
    query,
    where,
    limit,
    orderBy,
    runTransaction,
    FieldValue,
    increment,
    writeBatch
};
