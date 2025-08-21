// ===== JavaScript สำหรับระบบ Login =====

// Import Firebase modules จาก window object
const { auth } = window.firebase;
import { 
    signInWithEmailAndPassword, 
    onAuthStateChanged,
    signOut 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// Import security utilities
import {
    validateFormData,
    VALIDATION_RULES,
    sanitizeInput,
    rateLimiter,
    logSecurityEvent,
    initializeSecurity
} from './security.js';

// Import error handler
import errorHandler, { showError, showSuccess, showWarning } from './error-handler.js';

// ฟังก์ชันหลักเมื่อโหลดหน้า
document.addEventListener('DOMContentLoaded', function() {
    console.log('หน้า Login โหลดเสร็จแล้ว');
    
    // เริ่มต้น security features
    initializeSecurity();
    
    // ตรวจสอบสถานะการเข้าสู่ระบบ
    checkAuthState();
    
    // เพิ่ม event listener สำหรับฟอร์ม login
    setupLoginForm();
    
    // โหลดข้อมูลที่จดจำไว้ (ถ้ามี)
    loadRememberedData();
});

// ตรวจสอบสถานะการเข้าสู่ระบบ
function checkAuthState() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log('ผู้ใช้เข้าสู่ระบบแล้ว:', user.email);
            // ถ้าเข้าสู่ระบบแล้ว ให้ไปหน้า dashboard
            window.location.href = 'pages/dashboard.html';
        } else {
            console.log('ไม่มีผู้ใช้เข้าสู่ระบบ');
        }
    });
}

// ตั้งค่าฟอร์ม Login
function setupLoginForm() {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const rememberMeCheckbox = document.getElementById('rememberMe');
    const loginBtn = document.querySelector('button[type="submit"]');
    const loginBtnText = document.getElementById('loginBtnText');
    const loginBtnSpinner = document.getElementById('loginBtnSpinner');
    const errorAlert = document.getElementById('errorAlert');
    const errorMessage = document.getElementById('errorMessage');

    // เพิ่ม event listener สำหรับการ submit ฟอร์ม
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // ตรวจสอบ rate limiting
        const userId = emailInput.value.trim() || 'anonymous';
        if (!rateLimiter.isAllowed(userId)) {
            showError('มีการพยายามเข้าสู่ระบบมากเกินไป กรุณารอสักครู่');
            return;
        }

        // Sanitize และ validate ข้อมูล
        const formData = {
            email: sanitizeInput(emailInput.value.trim()),
            password: passwordInput.value
        };

        // ตรวจสอบความถูกต้องของข้อมูล
        const validation = validateFormData(formData, {
            email: VALIDATION_RULES.email,
            password: VALIDATION_RULES.password
        });

        if (!validation.isValid) {
            const errorMessages = Object.values(validation.errors).join(', ');
            showError(errorMessages);
            return;
        }

        // ตรวจสอบความถูกต้องของฟอร์ม
        if (!loginForm.checkValidity()) {
            e.stopPropagation();
            loginForm.classList.add('was-validated');
            return;
        }

        // แสดง loading state
        setLoadingState(true);
        
        // ซ่อนข้อผิดพลาดเก่า
        hideError();

        try {
            // ดึงข้อมูลจากฟอร์ม
            const email = formData.email;
            const password = formData.password;
            const rememberMe = rememberMeCheckbox.checked;

            console.log('กำลังเข้าสู่ระบบด้วย:', email);

            // เข้าสู่ระบบด้วย Firebase
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            console.log('เข้าสู่ระบบสำเร็จ:', user.email);

            // Log successful login
            logSecurityEvent('login_success', { email: user.email });

            // จดจำข้อมูลถ้าเลือก "จดจำฉัน"
            if (rememberMe) {
                saveRememberedData(email);
            } else {
                clearRememberedData();
            }

            // แสดงข้อความสำเร็จ
            showSuccess('เข้าสู่ระบบสำเร็จ! กำลังไปยังหน้า Dashboard...');

            // รอสักครู่แล้วไปหน้า dashboard
            setTimeout(() => {
                window.location.href = 'pages/dashboard.html';
            }, 1500);

        } catch (error) {
            console.error('ข้อผิดพลาดในการเข้าสู่ระบบ:', error);
            
            // Log failed login attempt
            logSecurityEvent('login_failed', { 
                email: formData.email, 
                error: error.code 
            });
            
            // แสดงข้อผิดพลาดที่เหมาะสม
            let errorMsg = 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ';
            
            switch (error.code) {
                case 'auth/user-not-found':
                    errorMsg = 'ไม่พบผู้ใช้นี้ในระบบ';
                    break;
                case 'auth/wrong-password':
                    errorMsg = 'รหัสผ่านไม่ถูกต้อง';
                    break;
                case 'auth/invalid-email':
                    errorMsg = 'รูปแบบอีเมลไม่ถูกต้อง';
                    break;
                case 'auth/too-many-requests':
                    errorMsg = 'มีการพยายามเข้าสู่ระบบมากเกินไป กรุณารอสักครู่';
                    break;
                case 'auth/user-disabled':
                    errorMsg = 'บัญชีผู้ใช้นี้ถูกระงับการใช้งาน';
                    break;
                default:
                    errorMsg = 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง';
            }
            
            showError(errorMsg);
        } finally {
            // ซ่อน loading state
            setLoadingState(false);
        }
    });

    // ฟังก์ชันแสดง loading state
    function setLoadingState(isLoading) {
        if (isLoading) {
            loginBtn.disabled = true;
            loginBtnText.style.display = 'none';
            loginBtnSpinner.classList.remove('d-none');
        } else {
            loginBtn.disabled = false;
            loginBtnText.style.display = 'inline';
            loginBtnSpinner.classList.add('d-none');
        }
    }

    // ฟังก์ชันแสดงข้อผิดพลาด
    function showError(message) {
        errorMessage.textContent = message;
        errorAlert.classList.remove('d-none');
        errorAlert.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // ฟังก์ชันซ่อนข้อผิดพลาด
    function hideError() {
        errorAlert.classList.add('d-none');
    }

    // ฟังก์ชันแสดงข้อความสำเร็จ
    function showSuccess(message) {
        // สร้าง alert สำเร็จ
        const successAlert = document.createElement('div');
        successAlert.className = 'alert alert-success mt-3';
        successAlert.innerHTML = `
            <i class="bi bi-check-circle-fill"></i>
            ${message}
        `;
        
        // แทนที่ error alert ด้วย success alert
        errorAlert.parentNode.insertBefore(successAlert, errorAlert);
        hideError();
    }
}

// ฟังก์ชันจดจำข้อมูลการเข้าสู่ระบบ
function saveRememberedData(email) {
    try {
        localStorage.setItem('rememberedEmail', email);
        console.log('จดจำอีเมลแล้ว:', email);
    } catch (error) {
        console.error('ไม่สามารถจดจำข้อมูลได้:', error);
    }
}

// ฟังก์ชันล้างข้อมูลที่จดจำไว้
function clearRememberedData() {
    try {
        localStorage.removeItem('rememberedEmail');
        console.log('ล้างข้อมูลที่จดจำแล้ว');
    } catch (error) {
        console.error('ไม่สามารถล้างข้อมูลได้:', error);
    }
}

// ฟังก์ชันโหลดข้อมูลที่จดจำไว้
function loadRememberedData() {
    try {
        const rememberedEmail = localStorage.getItem('rememberedEmail');
        if (rememberedEmail) {
            const emailInput = document.getElementById('email');
            const rememberMeCheckbox = document.getElementById('rememberMe');
            
            emailInput.value = rememberedEmail;
            rememberMeCheckbox.checked = true;
            
            console.log('โหลดข้อมูลที่จดจำแล้ว:', rememberedEmail);
        }
    } catch (error) {
        console.error('ไม่สามารถโหลดข้อมูลที่จดจำได้:', error);
    }
}

// ฟังก์ชันออกจากระบบ (สำหรับใช้ในหน้าอื่น)
export function logout() {
    return signOut(auth).then(() => {
        console.log('ออกจากระบบสำเร็จ');
        window.location.href = '../index.html';
    }).catch((error) => {
        console.error('ข้อผิดพลาดในการออกจากระบบ:', error);
    });
}

// ฟังก์ชันตรวจสอบการเข้าสู่ระบบ (สำหรับใช้ในหน้าอื่น)
export function isAuthenticated() {
    return new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            unsubscribe();
            resolve(!!user);
        });
    });
}
