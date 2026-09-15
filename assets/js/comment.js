// โมดัลอ่านและเขียนข้อความให้กำลังใจใต้โพสต์

import { supabase } from "./supabase-config.js";
import { moodOf } from "./data.js";
import { setMsg, openModal } from "./ui.js";
import { moderate } from "./moderation.js";

let current = null;
let user = null;
let onDone = null;
let bound = false;

async function renderComments() {
  const { data, error } = await supabase
    .from("comments")
    .select("body, created_at")
    .eq("post_id", current.id)
    .order("created_at", { ascending: true });
  const items = error ? [] : (data || []);
  if (error) console.error(error);

  document.getElementById("cm-count").textContent =
    `ข้อความให้กำลังใจ ${items.length} ข้อความ`;

  const box = document.getElementById("cm-list");
  box.innerHTML = "";
  items.forEach(c => {
    const el = document.createElement("div");
    el.className = "comment";
    const who = document.createElement("p");
    who.className = "who";
    who.textContent = "ไม่ระบุตัวตน";
    const body = document.createElement("p");
    body.textContent = c.body;
    el.append(who, body);
    box.appendChild(el);
  });
}

async function submit() {
  const text = document.getElementById("cm-text").value.trim();
  const check = moderate(text);
  if (!check.ok) return setMsg("cm-msg", check.message);

  const btn = document.getElementById("cm-submit");
  btn.disabled = true;
  const { error } = await supabase.from("comments").insert({
    post_id: current.id,
    user_id: user.id,
    body: text
  });
  if (error) {
    console.error(error);
    setMsg("cm-msg", "ส่งไม่สำเร็จ ลองใหม่อีกครั้ง");
    btn.disabled = false;
    return;
  }
  document.getElementById("cm-text").value = "";
  setMsg("cm-msg", "");
  await renderComments();
  await onDone();
  btn.disabled = false;
}

export async function openCommentModal(post, currentUser, reload) {
  current = post;
  user = currentUser;
  onDone = reload;

  const m = moodOf(post.mood);
  document.getElementById("cm-paper").style.background = m.bg;
  document.getElementById("cm-meta").style.color = m.ink;
  document.getElementById("cm-body").style.color = m.ink;
  document.getElementById("cm-meta").textContent = m.label;
  document.getElementById("cm-body").textContent = post.body;

  if (!bound) {
    document.getElementById("cm-submit").addEventListener("click", submit);
    document.getElementById("cm-text").addEventListener("input", () => setMsg("cm-msg", ""));
    bound = true;
  }

  await renderComments();
  openModal("ov-comment");
}
