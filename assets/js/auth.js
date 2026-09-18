// จัดการการเข้าสู่ระบบ สมัครสมาชิก และตั้งรหัสผ่านใหม่
// ไฟล์เดียวใช้ได้ทั้งสามหน้า โดยดูจาก data-page ของ body

import { supabase } from "./supabase-config.js";
import { redirectIfSignedIn } from "./guard.js";
import { setMsg, clearMsg, authError } from "./ui.js";
import { QUESTIONS, SCALE_OPTIONS, levelOf } from "./data.js";

const page = document.body.dataset.page;
const submit = document.getElementById("submit");

if (page === "login" || page === "register") redirectIfSignedIn();

const val = id => document.getElementById(id).value.trim();

// รับอีเมลที่ฟอร์แมตถูกต้องทุกโดเมน ทั้งอีเมลสากลและของมหาวิทยาลัย (เช่น @kkumail.com)
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isValidEmail = email => EMAIL_RE.test(email);

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

let registerStep = "account";
let questionIndex = 0;
const assessmentAnswers = new Array(QUESTIONS.length).fill(null);

function fieldError(id, message = "") {
  const input = document.getElementById(id);
  const error = document.getElementById(`${id}-error`);
  if (!input || !error) return;
  error.textContent = message;
  if (message) {
    input.setAttribute("aria-invalid", "true");
    input.setAttribute("aria-describedby", error.id);
  } else {
    input.removeAttribute("aria-invalid");
    input.removeAttribute("aria-describedby");
  }
}

function validateAccount() {
  const email = val("email");
  const p1 = document.getElementById("password").value;
  const p2 = document.getElementById("password2").value;
  const faculty = val("faculty");
  const year = val("year");

  ["email", "password", "password2", "faculty", "year"].forEach(id => fieldError(id));
  if (!isValidEmail(email)) fieldError("email", "กรอกอีเมลให้ถูกต้อง เช่น you@kkumail.com");
  if (p1.length < 8) fieldError("password", "รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร");
  if (!p2) fieldError("password2", "กรอกยืนยันรหัสผ่าน");
  else if (p1 !== p2) fieldError("password2", "รหัสผ่านทั้งสองช่องไม่ตรงกัน");
  if (!faculty) fieldError("faculty", "เลือกคณะหรือวิทยาลัย");
  if (!year) fieldError("year", "เลือกชั้นปี");

  const firstInvalid = document.querySelector('[aria-invalid="true"]');
  if (firstInvalid) {
    setMsg("msg", "ตรวจสอบข้อมูลที่ยังไม่ครบ");
    firstInvalid.focus();
    return false;
  }
  return true;
}

function showRegisterStep(step) {
  registerStep = step;
  document.querySelectorAll("[data-register-step]").forEach(section => {
    section.hidden = section.dataset.registerStep !== step;
  });
  document.querySelectorAll("[data-step-dot]").forEach(item => {
    const order = ["account", "assessment", "review"];
    const current = order.indexOf(step);
    const itemIndex = order.indexOf(item.dataset.stepDot);
    item.classList.toggle("active", itemIndex === current);
    item.classList.toggle("done", itemIndex < current);
  });
  clearMsg("msg");
}

function renderRegisterQuestion() {
  document.getElementById("register-q-no").textContent = `ข้อ ${questionIndex + 1} จาก ${QUESTIONS.length}`;
  document.getElementById("register-q-text").textContent = QUESTIONS[questionIndex];
  document.getElementById("register-bar").style.width = `${((questionIndex + 1) / QUESTIONS.length) * 100}%`;
  document.getElementById("register-next").textContent = questionIndex === QUESTIONS.length - 1 ? "ดูผลประเมิน" : "ข้อต่อไป";
  const scale = document.getElementById("register-scale");
  scale.innerHTML = "";
  SCALE_OPTIONS.forEach(option => {
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("aria-pressed", assessmentAnswers[questionIndex] === option.value);
    button.setAttribute("aria-label", `${option.value} ${option.label}`);
    button.innerHTML = `<strong>${option.value}</strong><span>${option.label}</span>`;
    button.addEventListener("click", () => {
      assessmentAnswers[questionIndex] = option.value;
      renderRegisterQuestion();
      document.getElementById("register-next").focus();
    });
    scale.appendChild(button);
  });
}

function reviewAssessment() {
  const total = assessmentAnswers.reduce((sum, answer) => sum + answer, 0);
  const level = levelOf(total);
  document.getElementById("register-score").textContent = total;
  document.getElementById("register-level").textContent = level.label;
  document.getElementById("register-note").textContent = level.note;
  showRegisterStep("review");
  document.getElementById("create-account").focus();
}

async function doRegister() {
  if (!validateAccount() || assessmentAnswers.some(answer => answer === null)) {
    showRegisterStep(assessmentAnswers.some(answer => answer === null) ? "assessment" : "account");
    renderRegisterQuestion();
    return;
  }

  const email = val("email");
  const p1 = document.getElementById("password").value;
  const faculty = val("faculty");
  const year = val("year");
  const total = assessmentAnswers.reduce((sum, answer) => sum + answer, 0);
  const createButton = document.getElementById("create-account");

  createButton.disabled = true;
  createButton.setAttribute("aria-busy", "true");
  createButton.textContent = "กำลังสร้างบัญชี…";
  setMsg("msg", "กำลังสร้างบัญชีและบันทึกผลประเมิน…", true);

  const { data: sessionData } = await supabase.auth.getSession();
  let session = sessionData.session;
  let user = session?.user;
  if (!session) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: p1
    });
    if (error) {
      setMsg("msg", authError(error));
      createButton.disabled = false;
      createButton.removeAttribute("aria-busy");
      createButton.textContent = "สร้างบัญชีและบันทึกผล";
      return;
    }
    session = data.session;
    user = data.user;
  }

  // เว็บนี้สมัครแล้วเข้าใช้ทันที จึงต้องปิด Confirm email ใน Supabase
  if (!session || !user) {
    setMsg("msg", "Supabase ยังเปิดการยืนยันอีเมลอยู่ กรุณาปิด Confirm email แล้วลองสมัครใหม่");
    createButton.disabled = false;
    createButton.removeAttribute("aria-busy");
    createButton.textContent = "สร้างบัญชีและบันทึกผล";
    return;
  }

  const { error: saveError } = await supabase.rpc("complete_registration", {
    p_faculty: faculty,
    p_year: year,
    p_total: total,
    p_answers: assessmentAnswers
  });
  if (saveError) {
    console.error(saveError);
    setMsg("msg", "สร้างบัญชีแล้ว แต่บันทึกข้อมูลยังไม่สำเร็จ กดอีกครั้งเพื่อลองบันทึกใหม่");
    createButton.disabled = false;
    createButton.removeAttribute("aria-busy");
    createButton.textContent = "ลองบันทึกผลอีกครั้ง";
    return;
  }
  location.href = `stress-result.html?score=${total}&source=register`;
}

async function doReset() {
  const email = val("email");
  fieldError("email");
  if (!isValidEmail(email)) {
    fieldError("email", "กรอกอีเมลให้ถูกต้อง เช่น you@kkumail.com");
    return setMsg("msg", "ตรวจสอบอีเมลอีกครั้ง");
  }

  submit.disabled = true;
  // กดลิงก์ในอีเมลแล้วกลับมาที่หน้านี้ ระบบจะสลับไปช่องตั้งรหัสใหม่ให้เอง
  const redirectTo = location.origin + location.pathname;
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) {
    setMsg("msg", authError(error));
    submit.disabled = false;
    return;
  }
  setMsg("msg", "ส่งลิงก์ตั้งรหัสผ่านไปที่อีเมลแล้ว เปิดลิงก์ในอีเมลเพื่อตั้งรหัสใหม่", true);
}

// สลับระหว่างขั้นขอลิงก์กับขั้นตั้งรหัสใหม่ ในหน้าลืมรหัสผ่าน
function showForgotStep(step) {
  document.querySelectorAll("[data-forgot-step]").forEach(section => {
    section.hidden = section.dataset.forgotStep !== step;
  });
  clearMsg("msg");
}

// ตั้งรหัสผ่านใหม่หลังกดลิงก์จากอีเมล (มี session ชั่วคราวแบบ recovery อยู่แล้ว)
async function doSetNewPassword() {
  const p1 = document.getElementById("new-password").value;
  const p2 = document.getElementById("new-password2").value;

  ["new-password", "new-password2"].forEach(id => fieldError(id));
  if (p1.length < 8) fieldError("new-password", "รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร");
  else if (p1 !== p2) fieldError("new-password2", "รหัสผ่านทั้งสองช่องไม่ตรงกัน");

  const firstInvalid = document.querySelector('[aria-invalid="true"]');
  if (firstInvalid) {
    setMsg("msg", "ตรวจสอบรหัสผ่านอีกครั้ง");
    firstInvalid.focus();
    return;
  }

  const setBtn = document.getElementById("set-submit");
  setBtn.disabled = true;
  setMsg("msg", "กำลังบันทึกรหัสผ่านใหม่…", true);
  const { error } = await supabase.auth.updateUser({ password: p1 });
  if (error) {
    setMsg("msg", authError(error));
    setBtn.disabled = false;
    return;
  }
  setMsg("msg", "ตั้งรหัสผ่านใหม่เรียบร้อย กำลังพาไปหน้ากระดาน…", true);
  setTimeout(() => { location.href = "board.html"; }, 1200);
}

if (page === "forgot") {
  // ถ้าเปิดหน้ามาจากลิงก์รีเซ็ตในอีเมล supabase จะยิง event PASSWORD_RECOVERY
  supabase.auth.onAuthStateChange(event => {
    if (event === "PASSWORD_RECOVERY") {
      showForgotStep("set");
      document.getElementById("new-password").focus();
    }
  });
  document.getElementById("forgot-form").addEventListener("submit", event => {
    event.preventDefault();
    const setStep = document.querySelector('[data-forgot-step="set"]');
    if (setStep && !setStep.hidden) doSetNewPassword();
    else doReset();
  });
} else if (page === "register") {
  document.getElementById("submit").addEventListener("click", () => {
    if (!validateAccount()) return;
    showRegisterStep("assessment");
    renderRegisterQuestion();
  });
  document.getElementById("register-next").addEventListener("click", () => {
    if (!assessmentAnswers[questionIndex]) return setMsg("msg", "เลือกระดับความรู้สึกก่อน");
    clearMsg("msg");
    if (questionIndex < QUESTIONS.length - 1) {
      questionIndex++;
      renderRegisterQuestion();
    } else reviewAssessment();
  });
  document.getElementById("register-back").addEventListener("click", () => {
    if (questionIndex > 0) {
      questionIndex--;
      renderRegisterQuestion();
    } else showRegisterStep("account");
  });
  document.getElementById("edit-assessment").addEventListener("click", () => {
    showRegisterStep("assessment");
    renderRegisterQuestion();
  });
  document.getElementById("register-form").addEventListener("submit", e => {
    e.preventDefault();
    doRegister();
  });
} else {
  // หน้าเข้าสู่ระบบ
  document.getElementById("login-form").addEventListener("submit", event => {
    event.preventDefault();
    doLogin();
  });
}

document.querySelectorAll("input").forEach(i => {
  i.addEventListener("input", () => clearMsg("msg"));
  i.addEventListener("keydown", e => {
    if (e.key === "Enter" && page === "register" && registerStep === "account") {
      e.preventDefault();
      document.getElementById("submit").click();
    }
  });
});
