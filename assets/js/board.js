// หน้ากระดานข้อความ โหลดโพสต์ กรองตามอารมณ์และช่วงเวลา กดใจ

import { auth, db } from "./firebase-config.js";
import { requireAuth } from "./guard.js";
import { MOODS, ALL_MOOD, moodOf } from "./data.js";
import { timeAgo, openModal, bindCloseButtons } from "./ui.js";
import { initPostModal } from "./post.js";
import { openCommentModal } from "./comment.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  collection, query, where, orderBy, limit, getDocs, setDoc, deleteDoc,
  doc, updateDoc, increment
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

let user = null;
let moodFilter = "all";
let days = 1;
let posts = [];

const grid = document.getElementById("grid");
const empty = document.getElementById("empty");

// ── โหลดโพสต์จากฐานข้อมูล ──────────────────────────────
// เรียงตามเวลาอย่างเดียว แล้วกรอง hidden กับช่วงเวลาฝั่ง client
// เพื่อไม่ต้องพึ่ง composite index ของ Firestore ซึ่งต้องสร้างเองใน Console
let loadFailed = false;
async function loadPosts() {
  const sinceMs = Date.now() - days * 86400000;
  loadFailed = false;
  try {
    const snap = await getDocs(query(
      collection(db, "posts"),
      orderBy("createdAt", "desc"),
      limit(200)
    ));
    posts = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(p => p.hidden === false && p.createdAt && p.createdAt.toMillis() >= sinceMs);

    // ดูว่าผู้ใช้เคยกดใจโพสต์ไหนไว้บ้าง
    const likes = await getDocs(query(collection(db, "likes"), where("uid", "==", user.uid)));
    const liked = new Set(likes.docs.map(d => d.data().postId));
    posts.forEach(p => { p.liked = liked.has(p.id); });
  } catch (e) {
    console.error(e);
    posts = [];
    loadFailed = true;
  }

  renderGrid();
}

// ── แถบกรองอารมณ์ ─────────────────────────────────────
function renderMoodBar() {
  const bar = document.getElementById("moods");
  bar.innerHTML = '<span class="q">อยากอ่านความรู้สึกไหน?</span>';
  [ALL_MOOD, ...MOODS].forEach(m => {
    const b = document.createElement("button");
    b.className = "mood";
    b.textContent = m.emoji ? `${m.emoji} ${m.label}` : m.label;
    b.style.background = m.bg;
    b.style.color = m.ink;
    b.setAttribute("aria-pressed", moodFilter === m.key);
    b.addEventListener("click", () => { moodFilter = m.key; renderMoodBar(); renderGrid(); });
    bar.appendChild(b);
  });
}

// ── การ์ดโพสต์ ────────────────────────────────────────
function renderGrid() {
  const list = moodFilter === "all" ? posts : posts.filter(p => p.mood === moodFilter);
  grid.innerHTML = "";
  grid.appendChild(newPostCard());
  list.forEach(p => grid.appendChild(postCard(p)));
  empty.textContent = loadFailed
    ? "โหลดโพสต์ไม่สำเร็จ ลองรีเฟรชหน้าอีกครั้ง หรือเช็กการเชื่อมต่ออินเทอร์เน็ต"
    : "ยังไม่มีใครโพสต์ในหมวดนี้ — เริ่มจากเรื่องของคุณก็ได้";
  empty.hidden = list.length > 0 && !loadFailed;
}

function newPostCard() {
  const el = document.createElement("button");
  el.className = "note note-new";
  el.innerHTML =
    '<span class="plus">+</span>' +
    '<p style="font-size:15px;margin:6px 0 4px">มีอะไรอยู่ในใจไหม?</p>' +
    '<p style="font-size:12px;color:var(--ink-faint);line-height:1.5;margin:0 0 10px">' +
    'เรื่องของคุณอาจทำให้ใครอีกคนรู้สึกว่าเขาไม่ได้อยู่คนเดียว</p>' +
    '<span class="btn-sm">แปะเรื่องราวของคุณ</span>';
  el.addEventListener("click", () => openModal("ov-post"));
  return el;
}

function postCard(p) {
  const m = moodOf(p.mood);
  const el = document.createElement("div");
  el.className = "note";
  el.style.background = m.bg;
  el.style.color = m.ink;

  const meta = document.createElement("p");
  meta.className = "meta";
  meta.textContent = `${m.label} · ${p.createdAt ? timeAgo(p.createdAt.toDate()) : ""}`;

  const body = document.createElement("p");
  body.className = "body";
  body.textContent = p.body;

  const foot = document.createElement("div");
  foot.className = "foot";

  const like = document.createElement("button");
  like.className = "like";
  like.style.color = m.ink;
  like.textContent = `${p.liked ? "♥" : "♡"} ${p.likeCount || 0}`;
  like.addEventListener("click", () => toggleLike(p));

  // เจ้าของโพสต์เลือกปิดความคิดเห็นได้ โพสต์เก่าที่ไม่มีฟิลด์นี้ถือว่าเปิดไว้
  const commentsOpen = p.commentsOpen !== false;
  if (commentsOpen) {
    const reply = document.createElement("button");
    reply.className = "reply";
    reply.style.color = m.ink;
    reply.textContent = `ตอบกลับ ${p.commentCount || 0}`;
    reply.addEventListener("click", () => openCommentModal(p, user, loadPosts));
    foot.append(like, reply);
  } else {
    const closed = document.createElement("span");
    closed.className = "reply-closed";
    closed.textContent = "ปิดความคิดเห็น";
    foot.append(like, closed);
  }

  el.append(meta, body, foot);
  return el;
}

// ── กดใจ ──────────────────────────────────────────────
// ใช้ uid ผสมกับ postId เป็นรหัสเอกสาร เพื่อไม่ให้กดซ้ำได้
async function toggleLike(p) {
  const ref = doc(db, "likes", `${p.id}_${user.uid}`);
  const postRef = doc(db, "posts", p.id);
  try {
    if (p.liked) {
      await deleteDoc(ref);
      await updateDoc(postRef, { likeCount: increment(-1) });
      p.likeCount--; p.liked = false;
    } else {
      await setDoc(ref, { postId: p.id, uid: user.uid });
      await updateDoc(postRef, { likeCount: increment(1) });
      p.likeCount = (p.likeCount || 0) + 1; p.liked = true;
    }
    renderGrid();
  } catch (e) {
    console.error(e);
  }
}

// ── ช่วงเวลา ──────────────────────────────────────────
document.querySelectorAll(".range-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".range-btn").forEach(b => b.setAttribute("aria-pressed", "false"));
    btn.setAttribute("aria-pressed", "true");
    days = Number(btn.dataset.days);
    loadPosts();
  });
});

document.getElementById("logout").addEventListener("click", async () => {
  await signOut(auth);
  location.href = "index.html";
});

bindCloseButtons();

requireAuth().then(u => {
  user = u;
  renderMoodBar();
  initPostModal(user, loadPosts);
  loadPosts();
});
