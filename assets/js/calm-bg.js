// พื้นหลังผ่อนคลาย ฟองอากาศสีพาสเทลลอยขึ้นช้า ๆ และหลบเมื่อเอาเมาส์ไปแตะ
// วาดบน canvas เต็มจอ สีอ่านจาก CSS variable ใน base.css (--calm-orb-1..4 + --paper)
// เรียกครั้งเดียวตอนโหลดหน้า  import "./calm-bg.js"

const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

const layer = document.createElement("div");
layer.className = "calm-bg";
layer.setAttribute("aria-hidden", "true");
document.body.prepend(layer);

const cv = document.createElement("canvas");
layer.appendChild(cv);
const ctx = cv.getContext("2d");
const dpr = Math.min(devicePixelRatio || 1, 2);
let W, H;
function resize() {
  W = cv.width = innerWidth * dpr;
  H = cv.height = innerHeight * dpr;
  cv.style.width = innerWidth + "px";
  cv.style.height = innerHeight + "px";
}
resize();
addEventListener("resize", resize);

// สีฟองอ่านจากตัวแปรใน base.css จะได้แก้สีที่เดียว
const css = getComputedStyle(document.documentElement);
const COLORS = ["--calm-orb-1", "--calm-orb-2", "--calm-orb-3", "--calm-orb-4", "--paper"]
  .map((v) => css.getPropertyValue(v).trim() || "#C7EFDF");

// สร้างฟองกระจายทั่วจอ จำนวนปรับตามความกว้างจอ
const bubbles = [];
const N = Math.min(40, Math.round(innerWidth / 28));
for (let i = 0; i < N; i++) {
  bubbles.push({
    x: Math.random() * W,
    y: Math.random() * H,
    r: (8 + Math.random() * 24) * dpr,
    sp: (0.15 + Math.random() * 0.4) * dpr, // ความเร็วลอยขึ้น ช้า ๆ
    c: COLORS[i % COLORS.length],
    a: 0.24 + Math.random() * 0.34, // ความทึบ
    vx: 0, vy: 0,
  });
}

const mouse = { x: -9999, y: -9999 };
if (!reduceMotion) {
  addEventListener("pointermove", (e) => {
    mouse.x = e.clientX * dpr;
    mouse.y = e.clientY * dpr;
  }, { passive: true });
  addEventListener("pointerleave", () => { mouse.x = mouse.y = -9999; });
}

function frame() {
  ctx.clearRect(0, 0, W, H);
  for (const b of bubbles) {
    b.y -= b.sp;
    b.x += b.vx;
    b.y += b.vy;
    b.vx *= 0.94;
    b.vy *= 0.94;
    // ฟองหลบเมาส์ ยิ่งใกล้ยิ่งถูกผลักแรง
    if (!reduceMotion) {
      const dx = b.x - mouse.x, dy = b.y - mouse.y;
      const d = Math.hypot(dx, dy) || 1, R = 110 * dpr;
      if (d < R) { const f = (1 - d / R) * 1.8; b.vx += (dx / d) * f; b.vy += (dy / d) * f; }
    }
    // วนขึ้นใหม่เมื่อลอยพ้นขอบบน และเผื่อขอบซ้ายขวา
    if (b.y + b.r < 0) { b.y = H + b.r; b.x = Math.random() * W; }
    if (b.x < -b.r) b.x = W + b.r;
    if (b.x > W + b.r) b.x = -b.r;
    ctx.globalAlpha = b.a;
    ctx.fillStyle = b.c;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, 7);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  if (!reduceMotion) requestAnimationFrame(frame);
}
frame();
