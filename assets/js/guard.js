// ตรวจสอบสถานะการเข้าสู่ระบบก่อนแสดงหน้า

import { supabase } from "./supabase-config.js";

// ใช้ในหน้าที่ต้องเข้าสู่ระบบก่อน คืนค่า user เมื่อพร้อม
// ถ้ายังไม่เข้าสู่ระบบจะพากลับไปหน้า login และคืน promise ที่ไม่ resolve
export async function requireAuth() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    location.replace("index.html");
    return new Promise(() => {});
  }
  return session.user;
}

// ใช้ในหน้า login และ register ถ้าเข้าสู่ระบบอยู่แล้วให้ข้ามไปกระดาน
export async function redirectIfSignedIn() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) location.replace("board.html");
}
