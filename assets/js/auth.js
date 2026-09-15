// จัดการการเข้าสู่ระบบ สมัครสมาชิก และตั้งรหัสผ่านใหม่
// ไฟล์เดียวใช้ได้ทั้งสามหน้า โดยดูจาก data-page ของ body

import { auth, db } from "./firebase-config.js";
import { redirectIfSignedIn } from "./guard.js";
import { setMsg, clearMsg, authError } from "./ui.js";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  doc, setDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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
  try {
    await signInWithEmailAndPassword(auth, email, password);
    location.href = "board.html";
  } catch (e) {
    setMsg("msg", authError(e.code));
    submit.disabled = false;
  }
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
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, p1);
    await setDoc(doc(db, "profiles", cred.user.uid), {
      faculty,
      year,
      createdAt: serverTimestamp()
    });
    // สมัครเสร็จให้ทำแบบวัดก่อนใช้งาน เก็บเป็นคะแนน pre-test
    location.href = "stress-test.html?phase=pre";
  } catch (e) {
    setMsg("msg", authError(e.code));
    submit.disabled = false;
  }
}

async function doReset() {
  const email = val("email");
  if (!email) return setMsg("msg", "กรอกอีเมลก่อน");

  submit.disabled = true;
  try {
    await sendPasswordResetEmail(auth, email);
    setMsg("msg", "ส่งลิงก์ตั้งรหัสผ่านไปที่อีเมลแล้ว ลองเช็กกล่องจดหมาย", true);
  } catch (e) {
    setMsg("msg", authError(e.code));
    submit.disabled = false;
  }
}

const handlers = { login: doLogin, register: doRegister, forgot: doReset };
submit.addEventListener("click", handlers[page]);

document.querySelectorAll("input").forEach(i => {
  i.addEventListener("input", () => clearMsg("msg"));
  i.addEventListener("keydown", e => { if (e.key === "Enter") handlers[page](); });
});
