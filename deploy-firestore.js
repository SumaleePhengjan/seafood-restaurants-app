// ===== Deploy Firestore Rules Script =====

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 เริ่มต้น Deploy Firestore Rules...');

// ตรวจสอบไฟล์ firestore.rules
const rulesPath = path.join(__dirname, 'firestore.rules');
if (!fs.existsSync(rulesPath)) {
    console.error('❌ ไม่พบไฟล์ firestore.rules');
    process.exit(1);
}

// ตรวจสอบไฟล์ firebase.json
const firebaseConfigPath = path.join(__dirname, 'firebase.json');
if (!fs.existsSync(firebaseConfigPath)) {
    console.error('❌ ไม่พบไฟล์ firebase.json');
    process.exit(1);
}

try {
    console.log('📋 ตรวจสอบ Firebase CLI...');
    
    // ตรวจสอบ Firebase CLI
    execSync('firebase --version', { stdio: 'pipe' });
    console.log('✅ Firebase CLI พร้อมใช้งาน');
    
    console.log('🔐 Deploy Firestore Rules...');
    
    // Deploy Firestore Rules
    execSync('firebase deploy --only firestore:rules', { 
        stdio: 'inherit',
        cwd: __dirname 
    });
    
    console.log('✅ Deploy Firestore Rules สำเร็จ!');
    
    console.log('📊 Deploy Firestore Indexes...');
    
    // Deploy Firestore Indexes
    execSync('firebase deploy --only firestore:indexes', { 
        stdio: 'inherit',
        cwd: __dirname 
    });
    
    console.log('✅ Deploy Firestore Indexes สำเร็จ!');
    
    console.log('🎉 Deploy เสร็จสิ้น! ระบบพร้อมใช้งาน');
    
} catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการ Deploy:', error.message);
    
    if (error.message.includes('firebase: command not found')) {
        console.log('\n💡 วิธีแก้ไข:');
        console.log('1. ติดตั้ง Firebase CLI: npm install -g firebase-tools');
        console.log('2. Login Firebase: firebase login');
        console.log('3. ตั้งค่าโปรเจค: firebase use <project-id>');
        console.log('4. รัน script อีกครั้ง');
    }
    
    process.exit(1);
}
