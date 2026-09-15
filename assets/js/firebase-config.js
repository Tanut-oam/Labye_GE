// ตั้งค่าเชื่อมต่อ Firebase
//
// นำค่าจาก Firebase Console > Project settings > Your apps > Web app มาวางแทนค่าด้านล่าง
// ค่าเหล่านี้เปิดเผยในหน้าเว็บได้ ไม่ใช่ความลับ เพราะการควบคุมสิทธิ์อยู่ที่ firestore.rules
// สิ่งที่ห้ามใส่ในไฟล์นี้เด็ดขาดคือ service account key หรือ private key ใด ๆ

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA1auahMlXnZSOrRbymJlDI-PWDdBOXYKY",
  authDomain: "labye-3b581.firebaseapp.com",
  projectId: "labye-3b581",
  storageBucket: "labye-3b581.firebasestorage.app",
  messagingSenderId: "444570364872",
  appId: "1:444570364872:web:e613413c4be75c2e352efd",
  measurementId: "G-9R5Q3R44C0"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
