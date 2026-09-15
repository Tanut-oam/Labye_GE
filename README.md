# ล้าบาย — เว็บไซต์กระดานข้อความให้กำลังใจ (Give & Take)

โครงงานรายวิชา GE362785 การคิดเชิงสร้างสรรค์และการแก้ปัญหา
กลุ่มเรียน 14 กลุ่มย่อย 4 — มหาวิทยาลัยขอนแก่น

เว็บไซต์ที่ให้นักศึกษาโพสต์ระบายความรู้สึกและอ่านข้อความให้กำลังใจจากเพื่อน
แบบไม่ระบุตัวตน เพื่อลดระดับความเครียด

## เครื่องมือที่ใช้

| ส่วน | เครื่องมือ |
|---|---|
| Frontend | HTML, CSS, JavaScript (ไม่ใช้เฟรมเวิร์ก) |
| Backend / ฐานข้อมูล | Supabase (Auth + Postgres + Row Level Security) |
| Hosting | Netlify |
| ออกแบบ | Figma |
| เวอร์ชัน | Git + GitHub |

## โครงสร้างโปรเจค

```
index.html            เข้าสู่ระบบ
register.html         สมัครสมาชิกพร้อมแบบประเมินก่อนสร้างบัญชี
forgot-password.html  ตั้งรหัสผ่านใหม่
stress-test.html      ทำแบบประเมินซ้ำ 20 ข้อ
stress-result.html    สรุปคะแนน
board.html            กระดานข้อความ (หน้าหลัก)
satisfaction.html     แบบประเมินความพึงพอใจ
assets/css/           สไตล์ แยกตามกลุ่มหน้า
assets/js/            ตรรกะแต่ละหน้า
supabase/schema.sql   สร้างตาราง + trigger + RLS ของฐานข้อมูล
docs/design/          ไฟล์ออกแบบจาก Figma
```

## เริ่มต้นใช้งาน

1. สร้างโปรเจคที่ https://supabase.com/dashboard
2. Authentication → Sign In / Providers → Email → **ปิด Confirm email**
   เพื่อให้สมัครแล้วเข้าใช้งานได้ทันทีโดยไม่ส่งอีเมลยืนยัน
3. SQL Editor → New query → วางทั้งไฟล์ `supabase/schema.sql` → Run
   (รวมฟังก์ชัน `complete_registration` สำหรับบันทึกโปรไฟล์และผลครั้งแรกพร้อมกัน)
4. Project Settings → Data API / API Keys คัดลอก `Project URL` และ `anon public`
   มาใส่ใน `assets/js/supabase-config.js`
5. Authentication → URL Configuration เพิ่มโดเมนเว็บ (เช่น Netlify) ใน Redirect URLs
6. เปิดเว็บด้วยเซิร์ฟเวอร์ (เปิดไฟล์ตรง ๆ ไม่ได้ เพราะใช้ ES module)

```bash
python3 -m http.server 8000
```

## นำขึ้นใช้งานจริง

เชื่อม repo นี้กับ Netlify แล้วตั้งค่า build command เป็นค่าว่าง
publish directory เป็น `.` เพราะเป็นเว็บ static ล้วน

## สิ่งที่ยังต้องทำก่อนเก็บข้อมูลจริง

- [x] ใส่คำถาม 20 ข้อและเกณฑ์แปลผลจากเอกสารโครงงานใน `assets/js/data.js`
- [ ] ขยายรายการคำต้องห้ามใน `assets/js/moderation.js`
- [ ] จัดทำเอกสารชี้แจงและขอความยินยอมผู้เข้าร่วมวิจัย
- [ ] ตกลงเวรดูแลกระดานระหว่างช่วงเก็บข้อมูล

## สมาชิกกลุ่ม

(ใส่ชื่อ-รหัสนักศึกษา 6 คน)
