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

// แปลงข้อผิดพลาดของ Supabase Auth เป็นข้อความที่ผู้ใช้เข้าใจ
// รับ error object จาก supabase-js (มี .code และ .message)
export function authError(err) {
  const code = err && err.code ? err.code : "";
  const msg = (err && err.message ? err.message : "").toLowerCase();

  const byCode = {
    invalid_credentials: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
    email_not_confirmed: "อีเมลนี้ยังไม่ได้ยืนยัน (ถ้าเป็นเว็บทดลอง ให้ปิด Confirm email ใน Supabase)",
    user_already_exists: "อีเมลนี้สมัครไว้แล้ว",
    email_exists: "อีเมลนี้สมัครไว้แล้ว",
    weak_password: "รหัสผ่านสั้นเกินไป ต้องยาวอย่างน้อย 6 ตัวอักษร",
    over_request_rate_limit: "ลองบ่อยเกินไป รอสักครู่แล้วลองใหม่",
    over_email_send_rate_limit: "ขออีเมลบ่อยเกินไป รอสักครู่แล้วลองใหม่",
    validation_failed: "รูปแบบอีเมลหรือรหัสผ่านยังไม่ถูกต้อง",
    signup_disabled: "ระบบยังไม่เปิดให้สมัคร ต้องเปิด Email provider ใน Supabase ก่อน"
  };
  if (byCode[code]) return byCode[code];

  // เผื่อบางเวอร์ชันส่งมาเป็นข้อความอย่างเดียว
  if (msg.includes("already registered") || msg.includes("already been registered"))
    return "อีเมลนี้สมัครไว้แล้ว";
  if (msg.includes("invalid login")) return "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
  if (msg.includes("email") && msg.includes("confirm")) return "อีเมลนี้ยังไม่ได้ยืนยัน";
  if (msg.includes("password")) return "รหัสผ่านไม่ผ่านเงื่อนไข ต้องยาวอย่างน้อย 6 ตัวอักษร";
  if (msg.includes("failed to fetch") || msg.includes("network"))
    return "เชื่อมต่อไม่ได้ ลองเช็กอินเทอร์เน็ต";

  return "เกิดข้อผิดพลาด ลองใหม่อีกครั้ง";
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
