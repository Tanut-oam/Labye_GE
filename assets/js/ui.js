// ฟังก์ชันช่วยเหลือที่ใช้ร่วมกันหลายหน้า

export function setMsg(id, text, ok = false) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.classList.toggle("ok", ok);
}

export function clearMsg(id) {
  setMsg(id, "");
}

// แปลงรหัสข้อผิดพลาดของ Firebase เป็นข้อความที่ผู้ใช้เข้าใจ
export function authError(code) {
  const map = {
    "auth/invalid-email": "รูปแบบอีเมลยังไม่ถูกต้อง",
    "auth/user-not-found": "ไม่พบบัญชีที่ใช้อีเมลนี้",
    "auth/wrong-password": "รหัสผ่านไม่ถูกต้อง",
    "auth/invalid-credential": "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
    "auth/email-already-in-use": "อีเมลนี้สมัครไว้แล้ว",
    "auth/weak-password": "รหัสผ่านสั้นเกินไป ต้องยาวอย่างน้อย 6 ตัวอักษร",
    "auth/too-many-requests": "ลองผิดหลายครั้งเกินไป รอสักครู่แล้วลองใหม่",
    "auth/network-request-failed": "เชื่อมต่อไม่ได้ ลองเช็กอินเทอร์เน็ต",
    "auth/operation-not-allowed": "ระบบยังไม่เปิดให้สมัครด้วยอีเมล ต้องเปิด Email/Password ใน Firebase Console ก่อน",
    "auth/configuration-not-found": "ยังไม่ได้เปิด Authentication ใน Firebase Console ให้เปิดแล้วลองใหม่"
  };
  return map[code] || "เกิดข้อผิดพลาด ลองใหม่อีกครั้ง";
}

export function timeAgo(date) {
  const min = Math.floor((Date.now() - date.getTime()) / 60000);
  if (min < 1) return "เมื่อสักครู่";
  if (min < 60) return `${min} นาทีที่แล้ว`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} ชั่วโมงที่แล้ว`;
  return `${Math.floor(hr / 24)} วันที่แล้ว`;
}

export function openModal(id) {
  document.getElementById(id).classList.add("open");
}

export function closeModal(id) {
  document.getElementById(id).classList.remove("open");
}

// ผูกปุ่มที่มี data-close ให้ปิดโมดัลตามที่ระบุ
export function bindCloseButtons() {
  document.querySelectorAll("[data-close]").forEach(btn => {
    btn.addEventListener("click", () => closeModal(btn.dataset.close));
  });
}
