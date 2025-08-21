# ระบบจัดการร้านอาหารทะเลสด

ระบบจัดการรายรับ/รายจ่ายสำหรับร้านขายอาหารทะเลสด ที่รับอาหารทะเลจากพ่อค้าคนกลางและนำไปขายที่ตลาด

## 🚀 ฟีเจอร์หลัก

### 🔐 ระบบ Authentication
- หน้า Login พร้อม Firebase Authentication
- ระบบจดจำการเข้าสู่ระบบ
- การตรวจสอบสิทธิ์การเข้าถึง

### 📊 Dashboard
- สรุปภาพรวมธุรกิจ
- สถิติรายรับ/รายจ่าย/กำไร
- กราฟยอดขาย 7 วันล่าสุด
- สินค้าขายดี
- การแจ้งเตือนและธุรกรรมล่าสุด

### 📦 จัดการสินค้า
- เพิ่ม/แก้ไข/ลบ ข้อมูลอาหารทะเล
- จัดหมวดหมู่สินค้า (กุ้ง, หอย, ปู, ปลา)
- ระบบสต็อกสินค้า
- ตั้งราคาซื้อ/ขาย

### 💰 รายรับ/รายจ่าย
- บันทึกการซื้อจากพ่อค้าคนกลาง
- บันทึกการขายที่ตลาด
- คำนวณกำไร/ขาดทุน
- ประวัติธุรกรรม

### 📈 รายงาน
- รายงานยอดขายรายวัน/เดือน/ปี
- รายงานกำไร/ขาดทุน
- รายงานสินค้าขายดี
- Export เป็น PDF/Excel

## 🛠️ เทคโนโลยีที่ใช้

### Frontend
- **HTML5** - โครงสร้างหน้าเว็บ
- **CSS3** - การจัดรูปแบบและ Responsive Design
- **JavaScript (ES6+)** - ฟังก์ชันการทำงาน
- **Bootstrap 5** - UI Framework และ Responsive Grid
- **DataTables Bootstrap** - ตารางข้อมูลแบบ Interactive
- **Chart.js** - กราฟและแผนภูมิ
- **Google Fonts (Noto Sans Thai)** - ฟอนต์ภาษาไทย

### Backend & Database
- **Firebase Authentication** - ระบบเข้าสู่ระบบ
- **Firestore Database** - ฐานข้อมูล NoSQL
- **Firebase Hosting** - เซิร์ฟเวอร์

## 📁 โครงสร้างโปรเจค

```
seafood-restaurants-app2/
├── 📁 assets/
│   ├── 📁 images/          # รูปภาพ
│   └── 📁 icons/           # ไอคอน
├── 📁 css/
│   ├── style.css           # CSS หลัก
│   ├── login.css           # CSS สำหรับหน้า login
│   └── dashboard.css       # CSS สำหรับหน้า dashboard
├── 📁 js/
│   ├── firebase-config.js  # การตั้งค่า Firebase
│   ├── login.js            # JavaScript สำหรับ login
│   ├── dashboard.js        # JavaScript สำหรับ dashboard
│   ├── inventory.js        # JavaScript สำหรับจัดการสินค้า
│   ├── transactions.js     # JavaScript สำหรับรายรับ/รายจ่าย
│   └── reports.js          # JavaScript สำหรับรายงาน
├── 📁 pages/
│   ├── dashboard.html      # หน้า Dashboard
│   ├── inventory.html      # หน้าจัดการสินค้า
│   ├── transactions.html   # หน้ารายรับ/รายจ่าย
│   └── reports.html        # หน้ารายงาน
├── 📁 data/
│   ├── products.json       # ข้อมูลสินค้า
│   ├── transactions.json   # ข้อมูลรายรับ/รายจ่าย
│   └── users.json          # ข้อมูลผู้ใช้
├── firestore.rules         # กฎความปลอดภัย Firestore
├── index.html              # หน้า Login
└── README.md               # เอกสารโปรเจค
```

## 🚀 การติดตั้งและใช้งาน

### 1. Clone โปรเจค
```bash
git clone [repository-url]
cd seafood-restaurants-app2
```

### 2. ตั้งค่า Firebase
1. สร้างโปรเจคใหม่ใน [Firebase Console](https://console.firebase.google.com/)
2. เปิดใช้งาน Authentication และ Firestore Database
3. แก้ไขไฟล์ `js/firebase-config.js` ด้วยข้อมูลโปรเจคของคุณ

### 3. รันโปรเจค
```bash
# ใช้ Live Server หรือเซิร์ฟเวอร์อื่นๆ
# เปิดไฟล์ index.html ในเบราว์เซอร์
```

### 4. สร้างผู้ใช้ทดสอบ
1. เปิด Firebase Console
2. ไปที่ Authentication > Users
3. เพิ่มผู้ใช้ใหม่ด้วยอีเมลและรหัสผ่าน

## 📊 โครงสร้างฐานข้อมูล

### Collection: products
```json
{
  "id": "auto-generated",
  "name": "กุ้งกุลาดำ",
  "category": "กุ้ง",
  "buyPrice": 180,
  "sellPrice": 220,
  "stock": 50,
  "unit": "กิโลกรัม",
  "supplier": "พ่อค้าคนกลาง A",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### Collection: transactions
```json
{
  "id": "auto-generated",
  "type": "buy", // buy หรือ sell
  "productId": "product-id",
  "productName": "กุ้งกุลาดำ",
  "quantity": 10,
  "price": 180,
  "total": 1800,
  "date": "2024-01-15",
  "supplier": "พ่อค้าคนกลาง A",
  "notes": "ซื้อจากพ่อค้าคนกลาง",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

## 🎨 การออกแบบ UI/UX

### สีหลัก
- **Primary**: #0d6efd (น้ำเงิน)
- **Success**: #198754 (เขียว)
- **Danger**: #dc3545 (แดง)
- **Warning**: #ffc107 (เหลือง)
- **Info**: #0dcaf0 (ฟ้า)

### ฟอนต์
- **Noto Sans Thai** - ฟอนต์หลักสำหรับภาษาไทย
- **Bootstrap Icons** - ไอคอน

### Responsive Design
- **Desktop**: 1200px+
- **Tablet**: 768px - 1199px
- **Mobile**: < 768px

## 🔒 ความปลอดภัย

### Firebase Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // อนุญาตให้ผู้ใช้ที่ login แล้วเท่านั้นเข้าถึงข้อมูล
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // กฎเฉพาะสำหรับ collections ต่างๆ
    match /transactions/{transactionId} {
      allow read, write: if request.auth != null;
    }
    
    match /products/{productId} {
      allow read, write: if request.auth != null;
    }
    
    match /suppliers/{supplierId} {
      allow read, write: if request.auth != null;
    }
    
    match /users/{userId} {
      // ผู้ใช้สามารถเข้าถึงข้อมูลของตัวเองเท่านั้น
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Security Features
- ✅ **Authentication Required**: ต้อง login ก่อนเข้าถึงข้อมูล
- ✅ **Input Validation**: ตรวจสอบข้อมูลที่ผู้ใช้กรอก
- ✅ **Rate Limiting**: จำกัดจำนวนการพยายามเข้าสู่ระบบ
- ✅ **XSS Protection**: ป้องกัน Cross-Site Scripting
- ✅ **CSRF Protection**: ป้องกัน Cross-Site Request Forgery
- ✅ **Security Headers**: Content Security Policy (CSP)
- ✅ **Error Logging**: บันทึกเหตุการณ์ความปลอดภัย

## 📱 การใช้งาน

### 1. เข้าสู่ระบบ
- เปิดเว็บไซต์
- กรอกอีเมลและรหัสผ่าน
- เลือก "จดจำฉัน" (ถ้าต้องการ)

### 2. Dashboard
- ดูภาพรวมธุรกิจ
- ตรวจสอบสถิติรายรับ/รายจ่าย
- ดูกราฟยอดขาย

### 3. จัดการสินค้า
- เพิ่มสินค้าใหม่
- แก้ไขข้อมูลสินค้า
- ตรวจสอบสต็อก

### 4. บันทึกธุรกรรม
- บันทึกการซื้อจากพ่อค้าคนกลาง
- บันทึกการขายที่ตลาด
- ดูประวัติธุรกรรม

## 🚀 Performance & Security

### Performance Features
- ✅ **Service Worker**: Caching และ offline support
- ✅ **Lazy Loading**: โหลดข้อมูลเฉพาะที่จำเป็น
- ✅ **Query Optimization**: จำกัดจำนวนข้อมูลที่ดึง
- ✅ **Real-time Updates**: อัปเดตข้อมูลแบบ real-time
- ✅ **Performance Monitoring**: ติดตามประสิทธิภาพระบบ
- ✅ **Memory Management**: จัดการการใช้ memory
- ✅ **API Response Tracking**: ติดตามเวลา response

### Security Features
- ✅ **Authentication Required**: ต้อง login ก่อนเข้าถึงข้อมูล
- ✅ **Input Validation**: ตรวจสอบข้อมูลที่ผู้ใช้กรอก
- ✅ **Rate Limiting**: จำกัดจำนวนการพยายามเข้าสู่ระบบ
- ✅ **XSS Protection**: ป้องกัน Cross-Site Scripting
- ✅ **CSRF Protection**: ป้องกัน Cross-Site Request Forgery
- ✅ **Security Headers**: Content Security Policy (CSP)
- ✅ **Error Logging**: บันทึกเหตุการณ์ความปลอดภัย

## 🐛 การแก้ไขปัญหา

### ปัญหาที่พบบ่อย

1. **ไม่สามารถเข้าสู่ระบบได้**
   - ตรวจสอบการตั้งค่า Firebase
   - ตรวจสอบอีเมลและรหัสผ่าน
   - ตรวจสอบ rate limiting

2. **ข้อมูลไม่แสดง**
   - ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต
   - ตรวจสอบ Firestore Rules
   - ตรวจสอบการเข้าสู่ระบบ

3. **กราฟไม่แสดง**
   - ตรวจสอบการโหลด Chart.js
   - ตรวจสอบข้อมูลในฐานข้อมูล

4. **Performance Issues**
   - ตรวจสอบ Service Worker
   - ตรวจสอบ Performance Monitor
   - ตรวจสอบ Memory Usage

## 📞 การสนับสนุน

หากมีปัญหาหรือคำถาม สามารถติดต่อได้ที่:
- Email: [your-email@example.com]
- GitHub Issues: [repository-issues]

## 📄 License

MIT License - ดูรายละเอียดในไฟล์ LICENSE

## 🙏 ขอบคุณ

- Firebase สำหรับ Backend Services
- Bootstrap สำหรับ UI Framework
- Chart.js สำหรับกราฟ
- Google Fonts สำหรับฟอนต์ภาษาไทย
