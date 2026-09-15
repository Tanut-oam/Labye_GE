// แบบวัดความเครียด 20 ข้อ ทีละข้อ
// รับพารามิเตอร์ phase จาก URL  pre = ก่อนใช้เว็บ  post = หลังครบระยะทดลอง

import { db } from "./firebase-config.js";
import { requireAuth } from "./guard.js";
import { QUESTIONS } from "./data.js";
import { setMsg } from "./ui.js";
import {
  collection, addDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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
  for (let v = 1; v <= 5; v++) {
    const b = document.createElement("button");
    b.textContent = v;
    b.setAttribute("aria-pressed", answers[index] === v);
    b.addEventListener("click", () => { answers[index] = v; render(); });
    el.scale.appendChild(b);
  }
}

async function finish() {
  const total = answers.reduce((a, b) => a + b, 0);
  el.next.disabled = true;
  setMsg("msg", "กำลังบันทึกคำตอบ…", true);
  try {
    await addDoc(collection(db, "stressTests"), {
      uid: user.uid,
      phase,
      total,
      answers,
      createdAt: serverTimestamp()
    });
    location.href = `stress-result.html?score=${total}`;
  } catch (e) {
    console.error(e);
    setMsg("msg", "บันทึกไม่สำเร็จ ลองกดอีกครั้ง");
    el.next.disabled = false;
  }
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
