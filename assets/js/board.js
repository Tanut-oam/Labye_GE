// หน้ากระดานข้อความ โหลดโพสต์ กรองตามอารมณ์และช่วงเวลา กดใจ

import { supabase } from "./supabase-config.js";
import { requireAuth } from "./guard.js";
import { MOODS, ALL_MOOD, moodOf, levelOf } from "./data.js";
import { timeAgo, openModal, bindCloseButtons } from "./ui.js";
import { initPostModal } from "./post.js";
import { openCommentModal } from "./comment.js";

let user = null;
let moodFilter = "all";
let days = 1;
let posts = [];

const grid = document.getElementById("grid");
const empty = document.getElementById("empty");
const historyList = document.getElementById("stress-history-list");
const historyStatus = document.getElementById("history-status");
let stressHistory = [];

function formatAssessmentDate(value) {
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function renderStressHistory() {
  historyList.innerHTML = "";
  if (!stressHistory.length) {
    historyStatus.textContent = "ยังไม่มีผลแบบประเมิน";
    return;
  }
  historyStatus.textContent = `พบ ${stressHistory.length} ครั้ง เรียงจากล่าสุด`;
  stressHistory.forEach((test, index) => {
    const level = levelOf(test.total);
    const previous = stressHistory[index + 1];
    const change = previous ? test.total - previous.total : null;
    const row = document.createElement("article");
    row.className = "history-item";
    row.innerHTML = `
      <div class="history-score"><strong>${test.total}</strong><span>/ 100</span></div>
      <div class="history-copy">
        <strong>${level.label}</strong>
        <span>${formatAssessmentDate(test.created_at)}</span>
      </div>
      <span class="history-change ${change === null ? "neutral" : change <= 0 ? "better" : "higher"}">
        ${change === null ? "ครั้งแรก" : change === 0 ? "เท่าครั้งก่อน" : `${change > 0 ? "+" : ""}${change} คะแนน`}
      </span>`;
    historyList.appendChild(row);
  });
}

async function loadStressHistory() {
  historyStatus.textContent = "กำลังโหลดประวัติ…";
  const { data, error } = await supabase
    .from("stress_tests")
    .select("id,total,phase,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) {
    console.error(error);
    historyStatus.innerHTML = 'โหลดประวัติไม่สำเร็จ <button class="link" id="retry-history" type="button">ลองอีกครั้ง</button>';
    document.getElementById("retry-history").addEventListener("click", loadStressHistory);
    return;
  }
  stressHistory = data || [];
  const latest = stressHistory[0];
  document.getElementById("latest-stress-level").textContent = latest ? levelOf(latest.total).label : "ยังไม่มีผลประเมิน";
  document.getElementById("latest-stress-meta").textContent = latest ? `${latest.total} คะแนน · ${formatAssessmentDate(latest.created_at)}` : "เริ่มประเมินเพื่อเก็บเป็นจุดเริ่มต้น";
  renderStressHistory();
}

// ── โหลดโพสต์จากฐานข้อมูล ──────────────────────────────
let loadFailed = false;
async function loadPosts() {
  const sinceIso = new Date(Date.now() - days * 86400000).toISOString();
  loadFailed = false;
  try {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("hidden", false)
      .gte("created_at", sinceIso)
      .order("created_at", { ascending: false });
    if (error) throw error;
    posts = data || [];

    // ดูว่าผู้ใช้เคยกดใจโพสต์ไหนไว้บ้าง
    const { data: likes, error: lErr } = await supabase
      .from("likes")
      .select("post_id")
      .eq("user_id", user.id);
    if (lErr) throw lErr;
    const liked = new Set((likes || []).map(l => l.post_id));
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
  meta.textContent = `${m.label} · ${p.created_at ? timeAgo(new Date(p.created_at)) : ""}`;

  const body = document.createElement("p");
  body.className = "body";
  body.textContent = p.body;

  const foot = document.createElement("div");
  foot.className = "foot";

  const like = document.createElement("button");
  like.className = "like";
  like.style.color = m.ink;
  like.textContent = `${p.liked ? "♥" : "♡"} ${p.like_count || 0}`;
  like.addEventListener("click", () => toggleLike(p));

  // เจ้าของโพสต์เลือกปิดความคิดเห็นได้ โพสต์เก่าที่ไม่มีฟิลด์นี้ถือว่าเปิดไว้
  const commentsOpen = p.comments_open !== false;
  if (commentsOpen) {
    const reply = document.createElement("button");
    reply.className = "reply";
    reply.style.color = m.ink;
    reply.textContent = `ตอบกลับ ${p.comment_count || 0}`;
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
// ตัวนับ like บนโพสต์ถูกดูแลด้วย trigger ฝั่งฐานข้อมูล จึงแค่ insert/delete แถวใน likes
async function toggleLike(p) {
  try {
    if (p.liked) {
      const { error } = await supabase.from("likes")
        .delete().eq("post_id", p.id).eq("user_id", user.id);
      if (error) throw error;
      p.like_count = Math.max((p.like_count || 0) - 1, 0); p.liked = false;
    } else {
      const { error } = await supabase.from("likes")
        .insert({ post_id: p.id, user_id: user.id });
      if (error) throw error;
      p.like_count = (p.like_count || 0) + 1; p.liked = true;
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
  await supabase.auth.signOut();
  location.href = "index.html";
});

document.getElementById("open-stress-history").addEventListener("click", async event => {
  openModal("ov-stress-history");
  document.querySelector('#ov-stress-history [data-close]').focus();
  await loadStressHistory();
  event.currentTarget.dataset.opened = "true";
});

bindCloseButtons();

requireAuth().then(u => {
  user = u;
  renderMoodBar();
  initPostModal(user, loadPosts);
  loadStressHistory().then(() => {
    if (location.hash === "#stress-history") {
      openModal("ov-stress-history");
      document.querySelector('#ov-stress-history [data-close]').focus();
      history.replaceState(null, "", location.pathname + location.search);
    }
  });
  loadPosts();
});
