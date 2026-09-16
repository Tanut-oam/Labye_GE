// หน้ากระดานข้อความ โหลดโพสต์ กรองตามอารมณ์และช่วงเวลา กดใจ

import { supabase } from "./supabase-config.js";
import { requireAuth } from "./guard.js";
import { MOODS, ALL_MOOD, moodOf, levelOf } from "./data.js";
import { timeAgo, openModal, bindCloseButtons } from "./ui.js";
import { initPostModal, openPostModal } from "./post.js?v=20260916.5";
import { openCommentModal } from "./comment.js?v=20260916.5";
import { FRUIT_PROFILES, fruitProfile } from "./fruit-profiles.js?v=20260916.5";

let user = null;
let moodFilter = "all";
let viewFilter = "all";
let days = 1;
let posts = [];

const grid = document.getElementById("grid");
const empty = document.getElementById("empty");
const boardStatus = document.getElementById("board-status");
const historyList = document.getElementById("stress-history-list");
const historyStatus = document.getElementById("history-status");
const sideMenu = document.getElementById("side-menu");
const sideToggle = document.getElementById("side-toggle");
const profileTrigger = document.getElementById("profile-trigger");
const profilePicker = document.getElementById("profile-picker");
const fruitOptions = document.getElementById("fruit-options");
let stressHistory = [];
let stressHistoryLoaded = false;

let selectedFruit = FRUIT_PROFILES[0].key;

function renderFruitProfile() {
  const fruit = fruitProfile(selectedFruit);
  document.getElementById("profile-emoji").textContent = fruit.emoji;
  document.getElementById("profile-name").textContent = fruit.name;
  profileTrigger.setAttribute("aria-label", `เปลี่ยนโปรไฟล์ ปัจจุบัน${fruit.name}`);
  fruitOptions.innerHTML = "";
  FRUIT_PROFILES.forEach(item => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "fruit-option";
    button.textContent = item.emoji;
    button.title = item.name;
    button.setAttribute("aria-label", item.name);
    button.setAttribute("aria-pressed", String(item.key === selectedFruit));
    button.addEventListener("click", () => selectFruitProfile(item.key));
    fruitOptions.appendChild(button);
  });
}

async function selectFruitProfile(key) {
  selectedFruit = key;
  localStorage.setItem(`labye-fruit-${user.id}`, key);
  renderFruitProfile();
  profilePicker.hidden = true;
  profileTrigger.setAttribute("aria-expanded", "false");
  await supabase.from("profiles").update({ fruit_avatar: key }).eq("id", user.id);
}

async function initFruitProfile() {
  const saved = localStorage.getItem(`labye-fruit-${user.id}`);
  if (FRUIT_PROFILES.some(item => item.key === saved)) {
    selectedFruit = saved;
  } else {
    const { data } = await supabase.from("profiles").select("fruit_avatar").eq("id", user.id).maybeSingle();
    if (FRUIT_PROFILES.some(item => item.key === data?.fruit_avatar)) selectedFruit = data.fruit_avatar;
    else selectedFruit = FRUIT_PROFILES[user.id.charCodeAt(0) % FRUIT_PROFILES.length].key;
  }
  renderFruitProfile();
}

function setSideMenu(open) {
  sideMenu.classList.toggle("menu-open", open);
  sideToggle.setAttribute("aria-expanded", String(open));
  sideToggle.querySelector(".sr-only").textContent = open ? "ปิดเมนู" : "เปิดเมนู";
  sideToggle.querySelector(".menu-chevron").textContent = open ? "👆" : "👇";
  document.body.classList.toggle("side-menu-open", open);
}

profileTrigger.addEventListener("click", () => {
  const open = profilePicker.hidden;
  profilePicker.hidden = !open;
  profileTrigger.setAttribute("aria-expanded", String(open));
});

document.addEventListener("click", event => {
  if (!profilePicker.hidden && !event.target.closest("#profile-picker,#profile-trigger")) {
    profilePicker.hidden = true;
    profileTrigger.setAttribute("aria-expanded", "false");
  }
});

sideToggle.addEventListener("click", () => {
  setSideMenu(sideToggle.getAttribute("aria-expanded") !== "true");
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && sideMenu.classList.contains("menu-open")) setSideMenu(false);
});

window.matchMedia("(min-width: 761px)").addEventListener("change", event => {
  if (event.matches) setSideMenu(false);
});

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
  stressHistoryLoaded = true;
  renderStressHistory();
}

async function loadLatestStress() {
  const { data, error } = await supabase
    .from("stress_tests")
    .select("total,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error(error);
    document.getElementById("latest-stress-level").textContent = "โหลดผลล่าสุดไม่สำเร็จ";
    document.getElementById("latest-stress-meta").textContent = "เปิดประวัติเพื่อลองโหลดอีกครั้ง";
    return;
  }
  document.getElementById("latest-stress-level").textContent = data ? levelOf(data.total).label : "ยังไม่มีผลประเมิน";
  document.getElementById("latest-stress-meta").textContent = data ? `${data.total} คะแนน · ${formatAssessmentDate(data.created_at)}` : "เริ่มประเมินเพื่อเก็บเป็นจุดเริ่มต้น";
}

// ── โหลดโพสต์จากฐานข้อมูล ──────────────────────────────
let loadFailed = false;
async function loadPosts() {
  const sinceIso = new Date(Date.now() - days * 86400000).toISOString();
  loadFailed = false;
  try {
    const [postResult, likeResult] = await Promise.all([
      supabase
        .from("posts")
        .select("id,user_id,mood,body,comments_open,created_at,like_count,comment_count")
        .eq("hidden", false)
        .gte("created_at", sinceIso)
        .order("created_at", { ascending: false }),
      supabase
        .from("likes")
        .select("post_id")
        .eq("user_id", user.id)
    ]);
    const { data, error } = postResult;
    if (error) throw error;
    posts = data || [];

    // ดูว่าผู้ใช้เคยกดใจโพสต์ไหนไว้บ้าง
    const { data: likes, error: lErr } = likeResult;
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

function renderFeedTabs() {
  document.querySelectorAll(".feed-tab").forEach(button => {
    button.setAttribute("aria-pressed", String(button.dataset.view === viewFilter));
  });
}

document.querySelectorAll(".feed-tab").forEach(button => {
  button.addEventListener("click", () => {
    viewFilter = button.dataset.view;
    renderFeedTabs();
    renderGrid();
  });
});

// ── การ์ดโพสต์ ────────────────────────────────────────
function renderGrid() {
  let list = posts;
  if (viewFilter === "liked") list = list.filter(post => post.liked);
  if (viewFilter === "mine") list = list.filter(post => post.user_id === user.id);
  if (moodFilter !== "all") list = list.filter(post => post.mood === moodFilter);
  grid.innerHTML = "";
  grid.appendChild(newPostCard());
  list.forEach((p, index) => grid.appendChild(postCard(p, index + 1)));
  const emptyCopy = {
    all: "ยังไม่มีใครโพสต์ในหมวดนี้ — เริ่มจากเรื่องของคุณก็ได้",
    liked: "ยังไม่มีโพสต์ที่คุณกดถูกใจในช่วงเวลานี้",
    mine: "คุณยังไม่ได้โพสต์ในช่วงเวลานี้"
  };
  empty.textContent = loadFailed
    ? "โหลดโพสต์ไม่สำเร็จ ลองรีเฟรชหน้าอีกครั้ง หรือเช็กการเชื่อมต่ออินเทอร์เน็ต"
    : emptyCopy[viewFilter];
  empty.hidden = list.length > 0 && !loadFailed;
}

// แสดงโพสต์ที่บันทึกสำเร็จทันที ไม่ต้องรอโหลดข้อมูลรอบใหม่จากเครือข่าย
function showCreatedPost(createdPost) {
  if (!createdPost) return loadPosts();
  posts = [createdPost, ...posts.filter(post => post.id !== createdPost.id)];
  moodFilter = "all";
  viewFilter = "all";
  loadFailed = false;
  renderMoodBar();
  renderFeedTabs();
  renderGrid();
  grid.querySelector('.note:not(.note-new)')?.scrollIntoView({ behavior: "smooth", block: "center" });
}

function newPostCard() {
  const el = document.createElement("button");
  el.className = "note note-new";
  el.type = "button";
  el.style.setProperty("--delay", "0ms");
  el.setAttribute("aria-label", "เขียนโพสต์ใหม่บนกระดานให้กำลังใจ");
  el.innerHTML =
    '<span class="plus">+</span>' +
    '<p class="note-new-title">มีอะไรอยู่ในใจไหม?</p>' +
    '<p class="note-new-copy">' +
    'เรื่องของคุณอาจทำให้ใครอีกคนรู้สึกว่าเขาไม่ได้อยู่คนเดียว</p>' +
    '<span class="btn-sm">แปะเรื่องราวของคุณ</span>';
  el.addEventListener("click", openPostModal);
  return el;
}

function postCard(p, index) {
  const m = moodOf(p.mood);
  const el = document.createElement("div");
  el.className = "note";
  el.style.background = m.bg;
  el.style.color = m.ink;
  const tilts = ["1deg", "-.8deg", ".65deg", "-1.1deg", "-.55deg", ".85deg"];
  el.style.setProperty("--tilt", tilts[(index - 1) % tilts.length]);
  el.style.setProperty("--delay", `${Math.min(index * 65, 390)}ms`);

  const meta = document.createElement("p");
  meta.className = "meta";
  meta.textContent = `${m.label} · ${p.created_at ? timeAgo(new Date(p.created_at)) : ""}`;

  const body = document.createElement("p");
  body.className = "body";
  body.textContent = p.body;

  const foot = document.createElement("div");
  foot.className = "foot";

  const like = document.createElement("button");
  like.type = "button";
  like.className = `like${p.liked ? " liked" : ""}`;
  like.style.color = m.ink;
  like.textContent = `${p.liked ? "♥" : "♡"} ${p.like_count || 0}`;
  like.setAttribute("aria-pressed", String(Boolean(p.liked)));
  like.setAttribute("aria-label", `${p.liked ? "เลิกส่ง" : "ส่ง"}กำลังใจ ปัจจุบัน ${p.like_count || 0} ครั้ง`);
  like.addEventListener("click", () => toggleLike(p, like));

  // เจ้าของโพสต์เลือกปิดความคิดเห็นได้ โพสต์เก่าที่ไม่มีฟิลด์นี้ถือว่าเปิดไว้
  const commentsOpen = p.comments_open !== false;
  if (commentsOpen) {
    const reply = document.createElement("button");
    reply.type = "button";
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

  if (p.user_id === user.id) {
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "post-delete";
    remove.textContent = "ลบโพสต์";
    remove.setAttribute("aria-label", "ลบโพสต์ของฉัน");
    remove.addEventListener("click", () => deletePost(p, remove));
    foot.appendChild(remove);
  }

  el.append(meta, body, foot);
  return el;
}

function setBoardStatus(message, ok = false) {
  boardStatus.textContent = message;
  boardStatus.classList.toggle("ok", ok);
}

async function deletePost(post, button) {
  if (button.dataset.confirm !== "true") {
    button.dataset.confirm = "true";
    button.textContent = "ยืนยันลบ";
    button.classList.add("confirming");
    setTimeout(() => {
      if (!button.isConnected) return;
      button.dataset.confirm = "false";
      button.textContent = "ลบโพสต์";
      button.classList.remove("confirming");
    }, 4000);
    return;
  }
  button.disabled = true;
  setBoardStatus("กำลังลบโพสต์…");
  const { error } = await supabase.from("posts").delete().eq("id", post.id);
  if (error) {
    console.error(error);
    setBoardStatus("ลบโพสต์ไม่สำเร็จ ลองใหม่อีกครั้ง");
    button.disabled = false;
    return;
  }
  posts = posts.filter(item => item.id !== post.id);
  setBoardStatus("ลบโพสต์แล้ว", true);
  renderGrid();
}

// ── กดใจ ──────────────────────────────────────────────
// ตัวนับ like บนโพสต์ถูกดูแลด้วย trigger ฝั่งฐานข้อมูล จึงแค่ insert/delete แถวใน likes
async function toggleLike(p, button) {
  button.disabled = true;
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
    button.textContent = `${p.liked ? "♥" : "♡"} ${p.like_count || 0}`;
    button.classList.toggle("liked", p.liked);
    button.setAttribute("aria-pressed", String(p.liked));
    button.setAttribute("aria-label", `${p.liked ? "เลิกส่ง" : "ส่ง"}กำลังใจ ปัจจุบัน ${p.like_count || 0} ครั้ง`);
    button.classList.remove("pop");
    void button.offsetWidth;
    button.classList.add("pop");
    if (viewFilter === "liked" && !p.liked) renderGrid();
  } catch (e) {
    console.error(e);
  } finally {
    button.disabled = false;
  }
}

// ── ช่วงเวลา ──────────────────────────────────────────
document.querySelectorAll(".range-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".range-btn").forEach(b => b.setAttribute("aria-pressed", "false"));
    btn.setAttribute("aria-pressed", "true");
    days = Number(btn.dataset.days);
    setSideMenu(false);
    loadPosts();
  });
});

document.getElementById("logout").addEventListener("click", async () => {
  await supabase.auth.signOut();
  location.href = "index.html";
});

document.getElementById("open-stress-history").addEventListener("click", async event => {
  setSideMenu(false);
  openModal("ov-stress-history");
  document.querySelector('#ov-stress-history [data-close]').focus();
  if (!stressHistoryLoaded) await loadStressHistory();
  event.currentTarget.dataset.opened = "true";
});

bindCloseButtons();

requireAuth().then(u => {
  user = u;
  initFruitProfile();
  renderMoodBar();
  renderFeedTabs();
  document.addEventListener("labye:post-created", event => showCreatedPost(event.detail));
  initPostModal(user);
  loadLatestStress();
  if (location.hash === "#stress-history") {
    loadStressHistory().then(() => {
      openModal("ov-stress-history");
      document.querySelector('#ov-stress-history [data-close]').focus();
      history.replaceState(null, "", location.pathname + location.search);
    });
  }
  loadPosts();
});
