// ตรวจสอบสถานะการเข้าสู่ระบบก่อนแสดงหน้า

import { auth } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// ใช้ในหน้าที่ต้องเข้าสู่ระบบก่อน คืนค่า user เมื่อพร้อม
export function requireAuth() {
  return new Promise(resolve => {
    onAuthStateChanged(auth, user => {
      if (user) resolve(user);
      else location.replace("index.html");
    });
  });
}

// ใช้ในหน้า login และ register ถ้าเข้าสู่ระบบอยู่แล้วให้ข้ามไปกระดาน
export function redirectIfSignedIn() {
  onAuthStateChanged(auth, user => {
    if (user) location.replace("board.html");
  });
}
