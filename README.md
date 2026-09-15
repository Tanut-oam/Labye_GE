# ล้าบาย — เว็บไซต์กระดานข้อความให้กำลังใจ (Give & Take)

โครงงานรายวิชา GE362785 การคิดเชิงสร้างสรรค์และการแก้ปัญหา
กลุ่มเรียน 14 กลุ่มย่อย 4 — มหาวิทยาลัยขอนแก่น

เว็บไซต์ที่ให้นักศึกษาโพสต์ระบายความรู้สึกและอ่านข้อความให้กำลังใจจากเพื่อน
แบบไม่ระบุตัวตน เพื่อลดระดับความเครียด

## เครื่องมือที่ใช้

| ส่วน | เครื่องมือ |
|---|---|
| Frontend | HTML, CSS, JavaScript (ไม่ใช้เฟรมเวิร์ก) |
| Backend / ฐานข้อมูล | Firebase (Authentication + Cloud Firestore) |
| Hosting | Netlify |
| ออกแบบ | Figma |
| เวอร์ชัน | Git + GitHub |

## โครงสร้างโปรเจค

```
index.html            เข้าสู่ระบบ
register.html         สมัครสมาชิก
forgot-password.html  ตั้งรหัสผ่านใหม่
stress-test.html      แบบวัดความเครียด 20 ข้อ
stress-result.html    สรุปคะแนน
board.html            กระดานข้อความ (หน้าหลัก)
satisfaction.html     แบบประเมินความพึงพอใจ
assets/css/           สไตล์ แยกตามกลุ่มหน้า
assets/js/            ตรรกะแต่ละหน้า
firestore.rules       กฎความปลอดภัยของฐานข้อมูล
docs/design/          ไฟล์ออกแบบจาก Figma
```

## เริ่มต้นใช้งาน

1. สร้างโปรเจคที่ https://console.firebase.google.com
2. เปิด Authentication → Sign-in method → Email/Password
3. สร้าง Cloud Firestore (เลือก production mode)
4. คัดลอกค่า config มาใส่ใน `assets/js/firebase-config.js`
5. นำกฎใน `firestore.rules` ไปวางใน Firestore → Rules แล้วกด Publish
6. เปิดเว็บด้วยเซิร์ฟเวอร์ (เปิดไฟล์ตรง ๆ ไม่ได้ เพราะใช้ ES module)

```bash
python3 -m http.server 8000
```

## นำขึ้นใช้งานจริง

เชื่อม repo นี้กับ Netlify แล้วตั้งค่า build command เป็นค่าว่าง
publish directory เป็น `.` เพราะเป็นเว็บ static ล้วน

## สิ่งที่ยังต้องทำก่อนเก็บข้อมูลจริง

- [ ] ใส่ข้อความแบบวัดความเครียดฉบับจริงและเกณฑ์แปลผลใน `assets/js/data.js`
- [ ] ขยายรายการคำต้องห้ามใน `assets/js/moderation.js`
- [ ] จัดทำเอกสารชี้แจงและขอความยินยอมผู้เข้าร่วมวิจัย
- [ ] ตกลงเวรดูแลกระดานระหว่างช่วงเก็บข้อมูล

## สมาชิกกลุ่ม

(ใส่ชื่อ-รหัสนักศึกษา 6 คน)
