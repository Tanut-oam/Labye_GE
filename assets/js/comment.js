// โมดัลอ่านและเขียนข้อความให้กำลังใจใต้โพสต์

import { supabase } from "./supabase-config.js";
import { moodOf } from "./data.js";
import { setMsg, openModal } from "./ui.js";
import { moderate } from "./moderation.js?v=20260916.5";
import { fruitProfile } from "./fruit-profiles.js?v=20260916.5";

let current = null;
let user = null;
let onDone = null;
let bound = false;

async function renderComments() {
  const count = document.getElementById("cm-count");
  const box = document.getElementById("cm-list");
  count.textContent = "กำลังโหลดข้อความให้กำลังใจ…";
  box.innerHTML = "";
  const { data, error } = await supabase.rpc("get_post_comments", {
    p_post_id: current.id
  });
  const items = error ? [] : (data || []);
  if (error) {
    console.error(error);
    count.textContent = "โหลดความคิดเห็นไม่สำเร็จ ลองปิดแล้วเปิดใหม่อีกครั้ง";
    return;
  }

  count.textContent = `ข้อความให้กำลังใจ ${items.length} ข้อความ`;

  items.forEach(c => {
    const el = document.createElement("div");
    el.className = "comment";
    const head = document.createElement("div");
    head.className = "comment-head";
    const who = document.createElement("p");
    who.className = "who";
    const fruit = fruitProfile(c.author_avatar);
    who.textContent = `${fruit.emoji} ${fruit.name}`;
    head.appendChild(who);
    if (c.is_own) {
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "comment-delete";
      remove.textContent = "ลบ";
      remove.setAttribute("aria-label", "ลบความคิดเห็นของฉัน");
      remove.addEventListener("click", () => deleteComment(c.id, remove));
      head.appendChild(remove);
    }
    const body = document.createElement("p");
    body.textContent = c.body;
    el.append(head, body);
    box.appendChild(el);
  });
}

async function deleteComment(id, button) {
  if (button.dataset.confirm !== "true") {
    button.dataset.confirm = "true";
    button.textContent = "ยืนยันลบ";
    button.classList.add("confirming");
    setTimeout(() => {
      if (!button.isConnected) return;
      button.dataset.confirm = "false";
      button.textContent = "ลบ";
      button.classList.remove("confirming");
    }, 4000);
    return;
  }
  button.disabled = true;
  const { error } = await supabase.from("comments").delete().eq("id", id);
  if (error) {
    console.error(error);
    setMsg("cm-msg", "ลบความคิดเห็นไม่สำเร็จ ลองใหม่อีกครั้ง");
    button.disabled = false;
    return;
  }
  current.comment_count = Math.max((current.comment_count || 1) - 1, 0);
  await renderComments();
  await onDone();
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

  openModal("ov-comment");
  await renderComments();
}
