// แบบประเมินความพึงพอใจหลังใช้เว็บไซต์ ทำทีละข้อแบบเดียวกับแบบวัดความเครียด

import { supabase } from "./supabase-config.js";
import { requireAuth } from "./guard.js";
import { SAT_ITEMS } from "./data.js";
import { setMsg } from "./ui.js";

let user = null;
let index = 0;
const answers = new Array(SAT_ITEMS.length).fill(null);

const el = {
  bar: document.getElementById("bar"),
  no: document.getElementById("q-no"),
  text: document.getElementById("q-text"),
  scale: document.getElementById("scale"),
  back: document.getElementById("back"),
  cancel: document.getElementById("cancel"),
  next: document.getElementById("next")
};

el.cancel.addEventListener("click", event => {
  if (answers.some(answer => answer !== null) && !window.confirm("ยกเลิกแบบประเมินความพึงพอใจ? คำตอบที่เลือกไว้จะไม่ถูกบันทึก")) {
    event.preventDefault();
  }
});

function render() {
  el.no.textContent = `ข้อ ${index + 1} จาก ${SAT_ITEMS.length}`;
  el.text.textContent = SAT_ITEMS[index];
  el.bar.style.width = `${((index + 1) / SAT_ITEMS.length) * 100}%`;
  el.next.textContent = index === SAT_ITEMS.length - 1 ? "ส่งแบบประเมิน" : "ต่อไป";
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
  el.next.disabled = true;
  el.back.disabled = true;
  setMsg("msg", "กำลังส่ง…", true);
  const { error } = await supabase.from("satisfaction").insert({
    user_id: user.id,
    answers
  });
  if (error) {
    console.error(error);
    setMsg("msg", "ส่งไม่สำเร็จ ลองกดอีกครั้ง");
    el.next.disabled = false;
    el.back.disabled = false;
    return;
  }
  setMsg("msg", "ส่งแบบประเมินแล้ว ขอบคุณที่ช่วยกันทำให้เว็บนี้ดีขึ้น กำลังกลับไปหน้ากระดาน…", true);
  setTimeout(() => { location.href = "board.html"; }, 1200);
}

el.next.addEventListener("click", () => {
  if (!answers[index]) return setMsg("msg", "เลือกคำตอบก่อนไปข้อถัดไป");
  if (index < SAT_ITEMS.length - 1) { index++; render(); }
  else finish();
});

el.back.addEventListener("click", () => {
  if (index > 0) { index--; render(); }
});

requireAuth().then(u => { user = u; render(); });
