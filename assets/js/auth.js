// จัดการการเข้าสู่ระบบ สมัครสมาชิก และตั้งรหัสผ่านใหม่
// ไฟล์เดียวใช้ได้ทั้งสามหน้า โดยดูจาก data-page ของ body

import { supabase } from "./supabase-config.js";
import { redirectIfSignedIn } from "./guard.js";
import { setMsg, clearMsg, authError } from "./ui.js";

const page = document.body.dataset.page;
const submit = document.getElementById("submit");

if (page === "login" || page === "register") redirectIfSignedIn();

const val = id => document.getElementById(id).value.trim();

async function doLogin() {
  const email = val("email");
  const password = document.getElementById("password").value;

  if (!email || !password) return setMsg("msg", "กรอกอีเมลและรหัสผ่านให้ครบก่อน");

  submit.disabled = true;
  setMsg("msg", "กำลังเข้าสู่ระบบ…", true);
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    setMsg("msg", authError(error));
    submit.disabled = false;
    return;
  }
  location.href = "board.html";
}

async function doRegister() {
  const email = val("email");
  const p1 = document.getElementById("password").value;
  const p2 = document.getElementById("password2").value;
  const faculty = val("faculty");
  const year = val("year");

  if (!email || !p1 || !p2 || !faculty || !year)
    return setMsg("msg", "กรอกข้อมูลให้ครบทุกช่องก่อน");
  if (p1.length < 8)
    return setMsg("msg", "รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร");
  if (p1 !== p2)
    return setMsg("msg", "รหัสผ่านทั้งสองช่องไม่ตรงกัน");

  submit.disabled = true;
  setMsg("msg", "กำลังสร้างบัญชี…", true);

  const { data, error } = await supabase.auth.signUp({ email, password: p1 });
  if (error) {
    setMsg("msg", authError(error));
    submit.disabled = false;
    return;
  }
  // ต้องปิด Confirm email ใน Supabase เพื่อให้ได้ session ทันที ไม่งั้นจะเขียน profile ไม่ได้
  if (!data.session) {
    setMsg("msg", "สมัครแล้ว แต่ต้องยืนยันอีเมลก่อน (ปิด Confirm email ใน Supabase หากเป็นเว็บทดลอง)", true);
    submit.disabled = false;
    return;
  }

  const { error: pErr } = await supabase
    .from("profiles")
    .insert({ id: data.user.id, faculty, year });
  if (pErr) {
    console.error(pErr);
    setMsg("msg", "สร้างบัญชีสำเร็จ แต่บันทึกข้อมูลคณะ/ชั้นปีไม่สำเร็จ ลองเข้าสู่ระบบแล้วทำแบบวัดต่อได้");
  }
  // สมัครเสร็จให้ทำแบบวัดก่อนใช้งาน เก็บเป็นคะแนน pre-test
  location.href = "stress-test.html?phase=pre";
}

async function doReset() {
  const email = val("email");
  if (!email) return setMsg("msg", "กรอกอีเมลก่อน");

  submit.disabled = true;
  const redirectTo = location.origin + location.pathname.replace(/forgot-password\.html$/, "index.html");
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) {
    setMsg("msg", authError(error));
    submit.disabled = false;
    return;
  }
  setMsg("msg", "ส่งลิงก์ตั้งรหัสผ่านไปที่อีเมลแล้ว ลองเช็กกล่องจดหมาย", true);
}

const handlers = { login: doLogin, register: doRegister, forgot: doReset };
submit.addEventListener("click", handlers[page]);

document.querySelectorAll("input").forEach(i => {
  i.addEventListener("input", () => clearMsg("msg"));
  i.addEventListener("keydown", e => { if (e.key === "Enter") handlers[page](); });
});
