// ===== Session Manager สำหรับระบบจัดการร้านอาหารทะเลสด =====

// Import Firebase modules
const { auth } = window.firebase;
import { signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// Import security utilities
import { logSecurityEvent } from './security.js';

// ตั้งค่า session timeout (30 นาที)
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
const WARNING_TIMEOUT = 5 * 60 * 1000; // 5 minutes warning before logout

// ตัวแปรสำหรับจัดการ session
let sessionTimer = null;
let warningTimer = null;
let lastActivity = Date.now();
let isSessionActive = false;

// ฟังก์ชันเริ่มต้น session manager
export function initializeSessionManager() {
    console.log('เริ่มต้น Session Manager');
    
    // ตรวจสอบสถานะการเข้าสู่ระบบ
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log('ผู้ใช้เข้าสู่ระบบ - เริ่มต้น session tracking');
            startSessionTracking();
        } else {
            console.log('ผู้ใช้ออกจากระบบ - หยุด session tracking');
            stopSessionTracking();
        }
    });
    
    // ตั้งค่า event listeners สำหรับตรวจจับกิจกรรมของผู้ใช้
    setupActivityListeners();
}

// เริ่มต้นการติดตาม session
function startSessionTracking() {
    isSessionActive = true;
    lastActivity = Date.now();
    
    // เริ่มต้น timer สำหรับ session timeout
    startSessionTimer();
    
    // เริ่มต้น timer สำหรับ warning
    startWarningTimer();
    
    console.log('Session tracking เริ่มต้นแล้ว');
}

// หยุดการติดตาม session
function stopSessionTracking() {
    isSessionActive = false;
    
    // หยุด timers
    if (sessionTimer) {
        clearTimeout(sessionTimer);
        sessionTimer = null;
    }
    
    if (warningTimer) {
        clearTimeout(warningTimer);
        warningTimer = null;
    }
    
    console.log('Session tracking หยุดแล้ว');
}

// เริ่มต้น session timer
function startSessionTimer() {
    if (sessionTimer) {
        clearTimeout(sessionTimer);
    }
    
    sessionTimer = setTimeout(() => {
        if (isSessionActive) {
            console.log('Session timeout - ออกจากระบบอัตโนมัติ');
            autoLogout('Session timeout - ไม่มีการใช้งานเป็นเวลานาน');
        }
    }, SESSION_TIMEOUT);
}

// เริ่มต้น warning timer
function startWarningTimer() {
    if (warningTimer) {
        clearTimeout(warningTimer);
    }
    
    warningTimer = setTimeout(() => {
        if (isSessionActive) {
            showSessionWarning();
        }
    }, SESSION_TIMEOUT - WARNING_TIMEOUT);
}

// แสดงคำเตือน session timeout
function showSessionWarning() {
    // สร้าง modal สำหรับแสดงคำเตือน
    const warningModal = document.createElement('div');
    warningModal.className = 'modal fade';
    warningModal.id = 'sessionWarningModal';
    warningModal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header bg-warning">
                    <h5 class="modal-title">
                        <i class="bi bi-exclamation-triangle-fill"></i>
                        คำเตือน Session Timeout
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <p>เซสชันของคุณจะหมดเวลาภายใน 5 นาที</p>
                    <p>คุณต้องการคงการเข้าสู่ระบบหรือไม่?</p>
                    <div class="progress mb-3">
                        <div class="progress-bar progress-bar-striped progress-bar-animated bg-warning" 
                             role="progressbar" style="width: 100%"></div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                        ออกจากระบบ
                    </button>
                    <button type="button" class="btn btn-primary" id="extendSessionBtn">
                        คงการเข้าสู่ระบบ
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // เพิ่ม modal ลงในหน้า
    document.body.appendChild(warningModal);
    
    // แสดง modal
    const modal = new bootstrap.Modal(warningModal);
    modal.show();
    
    // ตั้งค่า event listeners
    const extendBtn = warningModal.querySelector('#extendSessionBtn');
    extendBtn.addEventListener('click', () => {
        extendSession();
        modal.hide();
    });
    
    // เมื่อ modal ถูกปิด ให้ logout
    warningModal.addEventListener('hidden.bs.modal', () => {
        autoLogout('Session timeout - ผู้ใช้ไม่ตอบสนอง');
        document.body.removeChild(warningModal);
    });
    
    // เริ่มต้น countdown timer
    startCountdownTimer(warningModal);
}

// เริ่มต้น countdown timer
function startCountdownTimer(modal) {
    let timeLeft = 300; // 5 minutes in seconds
    
    const countdownInterval = setInterval(() => {
        timeLeft--;
        
        const progressBar = modal.querySelector('.progress-bar');
        const percentage = (timeLeft / 300) * 100;
        progressBar.style.width = percentage + '%';
        
        if (timeLeft <= 0) {
            clearInterval(countdownInterval);
            const modalInstance = bootstrap.Modal.getInstance(modal);
            if (modalInstance) {
                modalInstance.hide();
            }
        }
    }, 1000);
}

// ขยาย session
function extendSession() {
    console.log('ขยาย session');
    
    // อัปเดตเวลากิจกรรมล่าสุด
    lastActivity = Date.now();
    
    // รีเซ็ต timers
    startSessionTimer();
    startWarningTimer();
    
    // Log security event
    logSecurityEvent('session_extended', { 
        timestamp: new Date().toISOString() 
    });
    
    // แสดงข้อความยืนยัน
    showSuccessMessage('Session ถูกขยายแล้ว');
}

// ออกจากระบบอัตโนมัติ
async function autoLogout(reason) {
    console.log('Auto logout:', reason);
    
    // หยุด session tracking
    stopSessionTracking();
    
    // Log security event
    logSecurityEvent('auto_logout', { 
        reason: reason,
        timestamp: new Date().toISOString() 
    });
    
    try {
        // ออกจากระบบ Firebase
        await signOut(auth);
        
        // แสดงข้อความแจ้งเตือน
        showLogoutMessage(reason);
        
        // รอสักครู่แล้วไปหน้า login
        setTimeout(() => {
            window.location.href = '../index.html';
        }, 3000);
        
    } catch (error) {
        console.error('ข้อผิดพลาดในการ auto logout:', error);
        // ไปหน้า login แม้จะเกิดข้อผิดพลาด
        window.location.href = '../index.html';
    }
}

// แสดงข้อความ logout
function showLogoutMessage(reason) {
    const logoutAlert = document.createElement('div');
    logoutAlert.className = 'alert alert-warning alert-dismissible fade show position-fixed';
    logoutAlert.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    logoutAlert.innerHTML = `
        <i class="bi bi-exclamation-triangle-fill"></i>
        <strong>ออกจากระบบอัตโนมัติ</strong><br>
        ${reason}<br>
        กำลังไปยังหน้าเข้าสู่ระบบ...
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(logoutAlert);
    
    // ลบ alert หลังจาก 3 วินาที
    setTimeout(() => {
        if (logoutAlert.parentNode) {
            logoutAlert.parentNode.removeChild(logoutAlert);
        }
    }, 3000);
}

// แสดงข้อความสำเร็จ
function showSuccessMessage(message) {
    const successAlert = document.createElement('div');
    successAlert.className = 'alert alert-success alert-dismissible fade show position-fixed';
    successAlert.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    successAlert.innerHTML = `
        <i class="bi bi-check-circle-fill"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(successAlert);
    
    // ลบ alert หลังจาก 3 วินาที
    setTimeout(() => {
        if (successAlert.parentNode) {
            successAlert.parentNode.removeChild(successAlert);
        }
    }, 3000);
}

// ตั้งค่า event listeners สำหรับตรวจจับกิจกรรม
function setupActivityListeners() {
    const activityEvents = [
        'mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'
    ];
    
    activityEvents.forEach(event => {
        document.addEventListener(event, updateActivity, true);
    });
    
    // ตรวจจับการเปลี่ยนแท็บ
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            updateActivity();
        }
    });
}

// อัปเดตเวลากิจกรรมล่าสุด
function updateActivity() {
    if (isSessionActive) {
        lastActivity = Date.now();
        
        // รีเซ็ต timers ถ้าจำเป็น
        const timeSinceLastActivity = Date.now() - lastActivity;
        if (timeSinceLastActivity > WARNING_TIMEOUT) {
            startSessionTimer();
            startWarningTimer();
        }
    }
}

// ฟังก์ชันสำหรับตรวจสอบสถานะ session
export function getSessionStatus() {
    return {
        isActive: isSessionActive,
        lastActivity: lastActivity,
        timeRemaining: isSessionActive ? SESSION_TIMEOUT - (Date.now() - lastActivity) : 0
    };
}

// ฟังก์ชันสำหรับตั้งค่า timeout ใหม่
export function setSessionTimeout(minutes) {
    if (minutes > 0) {
        SESSION_TIMEOUT = minutes * 60 * 1000;
        WARNING_TIMEOUT = Math.min(5 * 60 * 1000, SESSION_TIMEOUT * 0.2);
        
        if (isSessionActive) {
            startSessionTimer();
            startWarningTimer();
        }
        
        console.log(`Session timeout ถูกตั้งเป็น ${minutes} นาที`);
    }
}

// ฟังก์ชันสำหรับ logout แบบ manual
export function manualLogout() {
    console.log('Manual logout');
    stopSessionTracking();
    return signOut(auth);
}
