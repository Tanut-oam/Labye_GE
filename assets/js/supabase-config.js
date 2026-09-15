// ตั้งค่าเชื่อมต่อ Supabase
//
// นำค่าจาก Supabase Dashboard → Project Settings → Data API / API Keys
//   Project URL  →  SUPABASE_URL
//   anon public  →  SUPABASE_ANON_KEY
// ค่า anon key เปิดเผยในหน้าเว็บได้ ไม่ใช่ความลับ เพราะการควบคุมสิทธิ์อยู่ที่ RLS policy
// สิ่งที่ห้ามใส่ในไฟล์นี้เด็ดขาดคือ service_role key เพราะข้ามสิทธิ์ RLS ได้ทั้งหมด

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://YOUR-PROJECT.supabase.co";
const SUPABASE_ANON_KEY = "YOUR-ANON-PUBLIC-KEY";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
