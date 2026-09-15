// โมดัลเขียนโพสต์ใหม่

import { db } from "./firebase-config.js";
import { MOODS, moodOf } from "./data.js";
import { setMsg, closeModal } from "./ui.js";
import { moderate, RISK_NOTICE } from "./moderation.js";
import {
  collection, addDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

let selected = "anx";
let commentsOpen = true;
let user = null;
let onDone = null;

const paper = () => document.getElementById("post-paper");
const textarea = () => document.getElementById("post-text");

// แถบเลือกเปิด/ปิดความคิดเห็นของโพสต์
function renderCommentsToggle() {
  document.querySelectorAll("#post-comments .ct-opt").forEach(btn => {
    btn.setAttribute("aria-pressed", (btn.dataset.open === "true") === commentsOpen);
  });
}

function renderMoodPicker() {
  const bar = document.getElementById("post-moods");
  bar.innerHTML = "";
  MOODS.forEach(m => {
    const b = document.createElement("button");
    b.className = "mood";
    b.textContent = m.emoji ? `${m.emoji} ${m.label}` : m.label;
    b.style.background = m.bg;
    b.style.color = m.ink;
    b.setAttribute("aria-pressed", selected === m.key);
    b.addEventListener("click", () => { selected = m.key; renderMoodPicker(); paintPaper(); });
    bar.appendChild(b);
  });
}

// กระดาษในโมดัลเปลี่ยนสีตามอารมณ์ ให้เห็นก่อนว่าโพสต์จะหน้าตาแบบไหน
function paintPaper() {
  const m = moodOf(selected);
  paper().style.background = m.bg;
  textarea().style.color = m.ink;
}

async function submit() {
  const text = textarea().value.trim();
  const check = moderate(text);

  if (!check.ok) return setMsg("post-msg", check.message);
  if (check.risky) setMsg("post-msg", RISK_NOTICE, true);

  const btn = document.getElementById("post-submit");
  btn.disabled = true;
  try {
    await addDoc(collection(db, "posts"), {
      uid: user.uid,
      mood: selected,
      body: text,
      commentsOpen,
      likeCount: 0,
      commentCount: 0,
      hidden: false,
      createdAt: serverTimestamp()
    });
    textarea().value = "";
    setMsg("post-msg", "");
    closeModal("ov-post");
    await onDone();
  } catch (e) {
    console.error(e);
    setMsg("post-msg", "โพสต์ไม่สำเร็จ ลองใหม่อีกครั้ง");
  } finally {
    btn.disabled = false;
  }
}

export function initPostModal(currentUser, reload) {
  user = currentUser;
  onDone = reload;
  renderMoodPicker();
  paintPaper();
  renderCommentsToggle();
  document.querySelectorAll("#post-comments .ct-opt").forEach(btn => {
    btn.addEventListener("click", () => {
      commentsOpen = btn.dataset.open === "true";
      renderCommentsToggle();
    });
  });
  document.getElementById("post-submit").addEventListener("click", submit);
  textarea().addEventListener("input", () => setMsg("post-msg", ""));
}
