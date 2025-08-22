# คู่มือการ Deploy - Seafood Restaurants App

## การแก้ไขปัญหา Permissions

### ปัญหาที่พบ
```
FirebaseError: Missing or insufficient permissions.
```

### สาเหตุ
- Firestore Security Rules ยังไม่ถูก deploy
- กฎความปลอดภัยเข้มงวดเกินไป
- ไม่มีข้อมูลผู้ใช้ในระบบ

### การแก้ไข

#### 1. ติดตั้ง Firebase CLI
```bash
npm install -g firebase-tools
```

#### 2. Login Firebase
```bash
firebase login
```

#### 3. ตั้งค่าโปรเจค
```bash
firebase use <your-project-id>
```

#### 4. Deploy Firestore Rules
```bash
# ใช้ script ที่สร้างไว้
npm run deploy

# หรือใช้คำสั่งโดยตรง
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

#### 5. ตรวจสอบการ Deploy
```bash
firebase firestore:rules:get
```

## ไฟล์ที่สำคัญ

### firestore.rules
- กฎความปลอดภัยสำหรับ Firestore
- อนุญาตให้ผู้ใช้ที่ login แล้วเข้าถึงข้อมูลได้
- เฉพาะเจ้าของข้อมูลเท่านั้นที่เข้าถึง users และ user_settings

### firebase.json
- ไฟล์ config สำหรับ Firebase
- กำหนด path ของ rules และ hosting

### firestore.indexes.json
- กำหนด indexes สำหรับ Firestore
- เพิ่มประสิทธิภาพการ query

## การทำงานของระบบ

### 1. เมื่อผู้ใช้เข้าสู่ระบบครั้งแรก
- ระบบจะตรวจสอบว่ามีข้อมูลใน Firestore หรือไม่
- ถ้าไม่มี จะสร้างข้อมูลผู้ใช้เริ่มต้นอัตโนมัติ
- สร้างการตั้งค่าเริ่มต้น

### 2. Error Handling
- ถ้าเกิด permission error จะสร้างข้อมูลใหม่
- ไม่แสดง error ให้ผู้ใช้เห็น
- บันทึก log เพื่อ debug

### 3. Security Features
- Auto logout หลังจาก 30 นาที (60 นาทีสำหรับ admin)
- Rate limiting
- Input validation
- Security monitoring

## การทดสอบ

### 1. ทดสอบการเข้าสู่ระบบ
```bash
# เปิด browser ไปที่
http://localhost:8000
```

### 2. ทดสอบการสร้างข้อมูลผู้ใช้
- Login ด้วย admin@gmail.com
- ตรวจสอบว่าสร้างข้อมูล admin อัตโนมัติ
- ตรวจสอบการตั้งค่าเริ่มต้น

### 3. ทดสอบการเข้าถึงข้อมูล
- ไปที่หน้าตั้งค่า
- ตรวจสอบว่าไม่มี permission error
- ตรวจสอบการแสดงข้อมูล

## Troubleshooting

### ปัญหา: Firebase CLI ไม่พบ
```bash
npm install -g firebase-tools
```

### ปัญหา: ไม่สามารถ login ได้
```bash
firebase logout
firebase login
```

### ปัญหา: Rules ไม่ถูก deploy
```bash
firebase deploy --only firestore:rules --force
```

### ปัญหา: Permission error ยังคงอยู่
1. ตรวจสอบว่า rules ถูก deploy แล้ว
2. ตรวจสอบ project ID ถูกต้อง
3. ลอง refresh browser
4. ลอง logout และ login ใหม่

## คำสั่งที่มีประโยชน์

```bash
# ดูสถานะ Firebase
firebase projects:list

# ดู rules ปัจจุบัน
firebase firestore:rules:get

# ดู indexes
firebase firestore:indexes

# Deploy ทั้งหมด
firebase deploy

# Deploy เฉพาะ hosting
firebase deploy --only hosting

# Emulator (สำหรับ development)
firebase emulators:start
```

## ข้อควรระวัง

### 1. Security
- อย่าเปิด rules ให้กว้างเกินไป
- ตรวจสอบสิทธิ์การเข้าถึงข้อมูล
- บันทึก security logs

### 2. Performance
- ใช้ indexes อย่างเหมาะสม
- หลีกเลี่ยงการ query ข้อมูลมากเกินไป
- ใช้ pagination สำหรับข้อมูลจำนวนมาก

### 3. Data Consistency
- ตรวจสอบความถูกต้องของข้อมูล
- ใช้ transactions เมื่อจำเป็น
- บันทึก audit logs

## สรุป

หลังจาก deploy Firestore Rules แล้ว:
- ✅ ไม่มี permission error
- ✅ ระบบสร้างข้อมูลผู้ใช้อัตโนมัติ
- ✅ Security features ทำงานปกติ
- ✅ Performance ดีขึ้น

ระบบพร้อมใช้งาน! 🎉
