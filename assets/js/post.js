// โมดัลเขียนโพสต์ใหม่

import { supabase } from "./supabase-config.js";
import { MOODS, moodOf } from "./data.js";
import { setMsg, closeModal } from "./ui.js";
import { moderate, RISK_NOTICE } from "./moderation.js?v=20260916.4";

let selected = "anx";
let commentsOpen = true;
let user = null;

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
  const createdPost = {
    id: crypto.randomUUID(),
    user_id: user.id,
    mood: selected,
    body: text,
    comments_open: commentsOpen,
    hidden: false,
    created_at: new Date().toISOString(),
    like_count: 0,
    comment_count: 0,
    liked: false
  };
  const { error } = await supabase.from("posts").insert({
    id: createdPost.id,
    user_id: createdPost.user_id,
    mood: createdPost.mood,
    body: createdPost.body,
    comments_open: createdPost.comments_open,
    hidden: createdPost.hidden,
    created_at: createdPost.created_at
  });
  if (error) {
    console.error(error);
    setMsg("post-msg", "โพสต์ไม่สำเร็จ ลองใหม่อีกครั้ง");
    btn.disabled = false;
    return;
  }
  textarea().value = "";
  setMsg("post-msg", "");
  document.dispatchEvent(new CustomEvent("labye:post-created", { detail: createdPost }));
  closeModal("ov-post");
  btn.disabled = false;
}

export function initPostModal(currentUser) {
  user = currentUser;
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
