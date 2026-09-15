// แบบวัดความเครียด 20 ข้อ ทีละข้อ
// รับพารามิเตอร์ phase จาก URL  pre = ก่อนใช้เว็บ  post = หลังครบระยะทดลอง

import { supabase } from "./supabase-config.js";
import { requireAuth } from "./guard.js";
import { QUESTIONS, SCALE_OPTIONS } from "./data.js";
import { setMsg } from "./ui.js";

const phase = new URLSearchParams(location.search).get("phase") === "post" ? "post" : "pre";

let user = null;
let index = 0;
const answers = new Array(QUESTIONS.length).fill(null);

const el = {
  bar: document.getElementById("bar"),
  no: document.getElementById("q-no"),
  text: document.getElementById("q-text"),
  scale: document.getElementById("scale"),
  back: document.getElementById("back"),
  next: document.getElementById("next")
};

function render() {
  el.no.textContent = `ข้อ ${index + 1} จาก ${QUESTIONS.length}`;
  el.text.textContent = QUESTIONS[index];
  el.bar.style.width = `${((index + 1) / QUESTIONS.length) * 100}%`;
  el.next.textContent = index === QUESTIONS.length - 1 ? "ดูผลลัพธ์" : "ต่อไป";
  setMsg("msg", "");

  el.scale.innerHTML = "";
  SCALE_OPTIONS.forEach(option => {
    const b = document.createElement("button");
    b.type = "button";
    b.setAttribute("aria-label", `${option.value} ${option.label}`);
    b.innerHTML = `<strong>${option.value}</strong><span>${option.label}</span>`;
    b.setAttribute("aria-pressed", answers[index] === option.value);
    b.addEventListener("click", () => { answers[index] = option.value; render(); el.next.focus(); });
    el.scale.appendChild(b);
  });
}

async function finish() {
  const total = answers.reduce((a, b) => a + b, 0);
  el.next.disabled = true;
  setMsg("msg", "กำลังบันทึกคำตอบ…", true);
  const { error } = await supabase.from("stress_tests").insert({
    user_id: user.id,
    phase,
    total,
    answers
  });
  if (error) {
    console.error(error);
    setMsg("msg", "บันทึกไม่สำเร็จ ลองกดอีกครั้ง");
    el.next.disabled = false;
    return;
  }
  location.href = `stress-result.html?score=${total}&source=retake`;
}

el.next.addEventListener("click", () => {
  if (!answers[index]) return setMsg("msg", "เลือกคำตอบก่อนไปข้อถัดไป");
  if (index < QUESTIONS.length - 1) { index++; render(); }
  else finish();
});

el.back.addEventListener("click", () => {
  if (index > 0) { index--; render(); }
});

requireAuth().then(u => { user = u; render(); });
