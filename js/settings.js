// Settings Page JavaScript - JavaScript สำหรับหน้าตั้งค่า

// Import Firebase modules จาก window object
const { auth, db } = window.firebase;
import {
    collection,
    doc,
    getDoc,
    updateDoc,
    setDoc
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { 
    onAuthStateChanged,
    updatePassword,
    EmailAuthProvider,
    reauthenticateWithCredential
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// Global variables - ตัวแปรทั่วโลก
let currentUser = null;
let userSettings = {};

// DOM Elements - องค์ประกอบ DOM
const profileForm = document.getElementById('profileForm');
const changePasswordForm = document.getElementById('changePasswordForm');
const logoutBtn = document.getElementById('logoutBtn');
const userEmail = document.getElementById('userEmail');
const profileName = document.getElementById('profileName');
const profileEmail = document.getElementById('profileEmail');

// Initialize Settings Page - เริ่มต้นหน้าตั้งค่า
document.addEventListener('DOMContentLoaded', function() {
    console.log('กำลังโหลดหน้าตั้งค่า...');
    checkAuthentication();
    initializeEventListeners();
});

// Check Authentication - ตรวจสอบการยืนยันตัวตน
function checkAuthentication() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log('ผู้ใช้เข้าสู่ระบบ:', user.email);
            currentUser = user;
            userEmail.textContent = user.email;
            loadUserData(); // โหลดข้อมูลทั้งหมดในครั้งเดียว
        } else {
            console.log('ผู้ใช้ไม่ได้เข้าสู่ระบบ');
            window.location.href = '../index.html';
        }
    });
}

// Initialize Event Listeners - เริ่มต้นการฟังเหตุการณ์
function initializeEventListeners() {
    // Profile Form - ฟอร์มโปรไฟล์
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileUpdate);
    }

    // Change Password Form - ฟอร์มเปลี่ยนรหัสผ่าน
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', handlePasswordChange);
    }

    // Logout Button - ปุ่มออกจากระบบ
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Notification Settings - ตั้งค่าการแจ้งเตือน
    const notificationSwitches = document.querySelectorAll('input[type="checkbox"]');
    notificationSwitches.forEach(switch_ => {
        switch_.addEventListener('change', saveNotificationSettings);
    });

    // System Settings - ตั้งค่าระบบ
    const systemSelects = document.querySelectorAll('select');
    systemSelects.forEach(select => {
        select.addEventListener('change', saveSystemSettings);
    });
}

// Load User Data - โหลดข้อมูลผู้ใช้ทั้งหมด
async function loadUserData() {
    try {
        // โหลดโปรไฟล์และการตั้งค่าพร้อมกัน
        const [userDoc, settingsDoc] = await Promise.all([
            getDoc(doc(db, 'users', currentUser.uid)),
            getDoc(doc(db, 'userSettings', currentUser.uid))
        ]);
        
        // โหลดโปรไฟล์
        if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // Populate profile fields - กรอกข้อมูลในฟิลด์โปรไฟล์
            document.getElementById('firstName').value = userData.firstName || '';
            document.getElementById('lastName').value = userData.lastName || '';
            document.getElementById('displayName').value = userData.displayName || '';
            document.getElementById('phone').value = userData.phone || '';
            document.getElementById('address').value = userData.address || '';
            
            // Update display - อัปเดตการแสดงผล
            profileName.textContent = userData.displayName || currentUser.email;
            profileEmail.textContent = currentUser.email;
            
            // Update profile image if exists - อัปเดตรูปโปรไฟล์ถ้ามี
            if (userData.profilePhoto) {
                document.getElementById('profileImage').src = userData.profilePhoto;
            }
        } else {
            // ถ้าเอกสารผู้ใช้ยังไม่มี ให้แสดงข้อมูลพื้นฐาน
            profileName.textContent = currentUser.email;
            profileEmail.textContent = currentUser.email;
            
            // กรอกข้อมูลเริ่มต้นในฟิลด์
            document.getElementById('displayName').value = currentUser.email;
        }
        
        // โหลดการตั้งค่า
        if (settingsDoc.exists()) {
            userSettings = settingsDoc.data();
            
            // Load notification settings - โหลดการตั้งค่าการแจ้งเตือน
            document.getElementById('emailNotifications').checked = userSettings.emailNotifications !== false;
            document.getElementById('lowStockAlert').checked = userSettings.lowStockAlert !== false;
            document.getElementById('salesReport').checked = userSettings.salesReport !== false;
            document.getElementById('systemNotifications').checked = userSettings.systemNotifications !== false;
            document.getElementById('soundNotifications').checked = userSettings.soundNotifications !== false;
            document.getElementById('desktopNotifications').checked = userSettings.desktopNotifications !== false;
            
            // Load system settings - โหลดการตั้งค่าระบบ
            document.getElementById('language').value = userSettings.language || 'th';
            document.getElementById('timezone').value = userSettings.timezone || 'Asia/Bangkok';
            document.getElementById('currency').value = userSettings.currency || 'THB';
            document.getElementById('dateFormat').value = userSettings.dateFormat || 'DD/MM/YYYY';
            
            // Load security settings - โหลดการตั้งค่าความปลอดภัย
            document.getElementById('twoFactorAuth').checked = userSettings.twoFactorAuth || false;
            document.getElementById('rememberMe').checked = userSettings.rememberMe !== false;
        }
        
        console.log('โหลดข้อมูลผู้ใช้เสร็จแล้ว');
        
    } catch (error) {
        console.error('ข้อผิดพลาดในการโหลดข้อมูลผู้ใช้:', error);
        showAlert('เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ใช้', 'danger');
    }
}

// Load User Profile - โหลดโปรไฟล์ผู้ใช้ (ไม่ใช้แล้ว - รวมใน loadUserData)
async function loadUserProfile() {
    // ฟังก์ชันนี้ไม่ใช้แล้ว เพราะรวมการโหลดใน loadUserData แล้ว
    console.log('loadUserProfile ไม่ใช้แล้ว - รวมการโหลดใน loadUserData');
}

// Load User Settings - โหลดการตั้งค่าผู้ใช้ (ไม่ใช้แล้ว - รวมใน loadUserData)
async function loadUserSettings() {
    // ฟังก์ชันนี้ไม่ใช้แล้ว เพราะรวมการโหลดใน loadUserData แล้ว
    console.log('loadUserSettings ไม่ใช้แล้ว - รวมการโหลดใน loadUserData');
}

// Handle Profile Update - จัดการการอัปเดตโปรไฟล์
async function handleProfileUpdate(e) {
    e.preventDefault();
    
    // เก็บรูปภาพโปรไฟล์ปัจจุบัน (ถ้ามี)
    const currentProfilePhoto = document.getElementById('profileImage').src;
    const isDefaultImage = currentProfilePhoto.includes('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+');
    
    const formData = {
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        displayName: document.getElementById('displayName').value,
        phone: document.getElementById('phone').value,
        address: document.getElementById('address').value,
        email: currentUser.email,
        createdAt: new Date(),
        updatedAt: new Date()
    };
    
    // เพิ่มรูปภาพโปรไฟล์ถ้าไม่ใช่รูปเริ่มต้น
    if (!isDefaultImage) {
        formData.profilePhoto = currentProfilePhoto;
    }
    
    try {
        // ใช้ setDoc แทน updateDoc เพื่อสร้างเอกสารใหม่ถ้ายังไม่มี
        await setDoc(doc(db, 'users', currentUser.uid), formData, { merge: true });
        showAlert('อัปเดตโปรไฟล์สำเร็จ', 'success');
        loadUserData(); // Reload profile data
    } catch (error) {
        console.error('ข้อผิดพลาดในการอัปเดตโปรไฟล์:', error);
        showAlert('เกิดข้อผิดพลาดในการอัปเดตโปรไฟล์', 'danger');
    }
}

// Handle Password Change - จัดการการเปลี่ยนรหัสผ่าน
async function handlePasswordChange(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validation - การตรวจสอบความถูกต้อง
    if (newPassword !== confirmPassword) {
        showAlert('รหัสผ่านใหม่ไม่ตรงกัน', 'danger');
        return;
    }
    
    if (newPassword.length < 6) {
        showAlert('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร', 'danger');
        return;
    }
    
    try {
        // Re-authenticate user - ยืนยันตัวตนผู้ใช้อีกครั้ง
        const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
        await reauthenticateWithCredential(currentUser, credential);
        
        // Update password - อัปเดตรหัสผ่าน
        await updatePassword(currentUser, newPassword);
        
        showAlert('เปลี่ยนรหัสผ่านสำเร็จ', 'success');
        changePasswordForm.reset();
    } catch (error) {
        console.error('ข้อผิดพลาดในการเปลี่ยนรหัสผ่าน:', error);
        
        if (error.code === 'auth/wrong-password') {
            showAlert('รหัสผ่านปัจจุบันไม่ถูกต้อง', 'danger');
        } else {
            showAlert('เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน', 'danger');
        }
    }
}

// Save Notification Settings - บันทึกการตั้งค่าการแจ้งเตือน
async function saveNotificationSettings() {
    const settings = {
        emailNotifications: document.getElementById('emailNotifications').checked,
        lowStockAlert: document.getElementById('lowStockAlert').checked,
        salesReport: document.getElementById('salesReport').checked,
        systemNotifications: document.getElementById('systemNotifications').checked,
        soundNotifications: document.getElementById('soundNotifications').checked,
        desktopNotifications: document.getElementById('desktopNotifications').checked,
        updatedAt: new Date()
    };
    
    try {
        await setDoc(doc(db, 'userSettings', currentUser.uid), settings, { merge: true });
        showAlert('บันทึกการตั้งค่าการแจ้งเตือนสำเร็จ', 'success');
    } catch (error) {
        console.error('ข้อผิดพลาดในการบันทึกการตั้งค่าการแจ้งเตือน:', error);
        showAlert('เกิดข้อผิดพลาดในการบันทึกการตั้งค่า', 'danger');
    }
}

// Save System Settings - บันทึกการตั้งค่าระบบ
async function saveSystemSettings() {
    const settings = {
        language: document.getElementById('language').value,
        timezone: document.getElementById('timezone').value,
        currency: document.getElementById('currency').value,
        dateFormat: document.getElementById('dateFormat').value,
        twoFactorAuth: document.getElementById('twoFactorAuth').checked,
        rememberMe: document.getElementById('rememberMe').checked,
        updatedAt: new Date()
    };
    
    try {
        await setDoc(doc(db, 'userSettings', currentUser.uid), settings, { merge: true });
        showAlert('บันทึกการตั้งค่าระบบสำเร็จ', 'success');
    } catch (error) {
        console.error('ข้อผิดพลาดในการบันทึกการตั้งค่าระบบ:', error);
        showAlert('เกิดข้อผิดพลาดในการบันทึกการตั้งค่า', 'danger');
    }
}

// Handle Logout - จัดการการออกจากระบบ
async function handleLogout() {
    try {
        await auth.signOut();
        window.location.href = '../index.html';
    } catch (error) {
        console.error('ข้อผิดพลาดในการออกจากระบบ:', error);
        showAlert('เกิดข้อผิดพลาดในการออกจากระบบ', 'danger');
    }
}

// Change Profile Photo - เปลี่ยนรูปโปรไฟล์
function changeProfilePhoto() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async function(e) {
        const file = e.target.files[0];
        if (file) {
            try {
                // ตรวจสอบขนาดไฟล์ (ไม่เกิน 5MB)
                if (file.size > 5 * 1024 * 1024) {
                    showAlert('ไฟล์รูปภาพต้องมีขนาดไม่เกิน 5MB', 'warning');
                    return;
                }
                
                // แสดงรูปภาพทันที
                const reader = new FileReader();
                reader.onload = function(e) {
                    document.getElementById('profileImage').src = e.target.result;
                };
                reader.readAsDataURL(file);
                
                // บันทึกรูปภาพลงฐานข้อมูล
                await saveProfilePhoto(file);
                
            } catch (error) {
                console.error('ข้อผิดพลาดในการอัปเดตรูปโปรไฟล์:', error);
                showAlert('เกิดข้อผิดพลาดในการอัปเดตรูปโปรไฟล์', 'danger');
            }
        }
    };
    
    input.click();
}

// Save Profile Photo - บันทึกรูปโปรไฟล์
async function saveProfilePhoto(file) {
    try {
        // แปลงไฟล์เป็น base64
        const base64 = await fileToBase64(file);
        
        // บันทึกลงฐานข้อมูล
        await updateDoc(doc(db, 'users', currentUser.uid), {
            profilePhoto: base64,
            updatedAt: new Date()
        });
        
        showAlert('อัปเดตรูปโปรไฟล์สำเร็จ', 'success');
        
    } catch (error) {
        console.error('ข้อผิดพลาดในการบันทึกรูปโปรไฟล์:', error);
        showAlert('เกิดข้อผิดพลาดในการบันทึกรูปโปรไฟล์', 'danger');
    }
}

// Convert File to Base64 - แปลงไฟล์เป็น Base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// Export Data - ส่งออกข้อมูล
function exportData() {
    // Implementation for data export
    showAlert('ฟีเจอร์ส่งออกข้อมูลจะเปิดใช้งานเร็วๆ นี้', 'info');
}

// Backup Data - สำรองข้อมูล
function backupData() {
    // Implementation for data backup
    showAlert('ฟีเจอร์สำรองข้อมูลจะเปิดใช้งานเร็วๆ นี้', 'info');
}

// Clear Data - ล้างข้อมูล
function clearData() {
    if (confirm('คุณแน่ใจหรือไม่ที่จะล้างข้อมูลทั้งหมด? การดำเนินการนี้ไม่สามารถยกเลิกได้')) {
        // Implementation for data clearing
        showAlert('ฟีเจอร์ล้างข้อมูลจะเปิดใช้งานเร็วๆ นี้', 'warning');
    }
}

// Show Alert - แสดงการแจ้งเตือน
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    const container = document.querySelector('.content-wrapper');
    container.insertBefore(alertDiv, container.firstChild);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

// Make functions globally available - ทำให้ฟังก์ชันใช้งานได้ทั่วโลก
window.changeProfilePhoto = changeProfilePhoto;
window.saveNotificationSettings = saveNotificationSettings;
window.saveSystemSettings = saveSystemSettings;
window.exportData = exportData;
window.backupData = backupData;
window.clearData = clearData;

