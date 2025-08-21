// Register Page JavaScript - JavaScript สำหรับหน้าลงทะเบียน
import { createUserWithEmailAndPassword, updateProfile } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// DOM Elements
const registerForm = document.getElementById('registerForm');
const registerName = document.getElementById('registerName');
const registerEmail = document.getElementById('registerEmail');
const registerPassword = document.getElementById('registerPassword');
const confirmPassword = document.getElementById('confirmPassword');
const agreeTerms = document.getElementById('agreeTerms');
const registerBtnText = document.getElementById('registerBtnText');
const registerBtnSpinner = document.getElementById('registerBtnSpinner');
const errorAlert = document.getElementById('errorAlert');
const errorMessage = document.getElementById('errorMessage');

// Form validation
function validateRegisterForm() {
    let isValid = true;
    
    // Clear previous validation
    registerForm.classList.remove('was-validated');
    
    // Check if passwords match
    if (registerPassword.value !== confirmPassword.value) {
        confirmPassword.setCustomValidity('รหัสผ่านไม่ตรงกัน');
        isValid = false;
    } else {
        confirmPassword.setCustomValidity('');
    }
    
    // Check password length
    if (registerPassword.value.length < 6) {
        registerPassword.setCustomValidity('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
        isValid = false;
    } else {
        registerPassword.setCustomValidity('');
    }
    
    // Check terms agreement
    if (!agreeTerms.checked) {
        agreeTerms.setCustomValidity('กรุณายอมรับเงื่อนไขการใช้งาน');
        isValid = false;
    } else {
        agreeTerms.setCustomValidity('');
    }
    
    // Add validation class
    registerForm.classList.add('was-validated');
    
    return isValid;
}

// Show error message
function showError(message) {
    errorMessage.textContent = message;
    errorAlert.classList.remove('d-none');
    errorAlert.scrollIntoView({ behavior: 'smooth' });
}

// Hide error message
function hideError() {
    errorAlert.classList.add('d-none');
}

// Show loading state
function showLoading() {
    registerBtnText.textContent = 'กำลังลงทะเบียน...';
    registerBtnSpinner.classList.remove('d-none');
    registerForm.querySelectorAll('input, button').forEach(element => {
        element.disabled = true;
    });
}

// Hide loading state
function hideLoading() {
    registerBtnText.textContent = 'ลงทะเบียน';
    registerBtnSpinner.classList.add('d-none');
    registerForm.querySelectorAll('input, button').forEach(element => {
        element.disabled = false;
    });
}

// Create user profile in Firestore
async function createUserProfile(user, displayName) {
    try {
        const userRef = doc(window.firebase.db, 'users', user.uid);
        await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            displayName: displayName,
            role: 'user',
            createdAt: new Date(),
            lastLogin: new Date(),
            isActive: true
        });
    } catch (error) {
        console.error('Error creating user profile:', error);
        throw new Error('ไม่สามารถสร้างโปรไฟล์ผู้ใช้ได้');
    }
}

// Handle register form submission
async function handleRegister(event) {
    event.preventDefault();
    
    // Validate form
    if (!validateRegisterForm()) {
        return;
    }
    
    // Hide previous errors
    hideError();
    
    // Show loading state
    showLoading();
    
    try {
        const email = registerEmail.value.trim();
        const password = registerPassword.value;
        const displayName = registerName.value.trim();
        
        // Create user with Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(
            window.firebase.auth, 
            email, 
            password
        );
        
        const user = userCredential.user;
        
        // Update user profile with display name
        await updateProfile(user, {
            displayName: displayName
        });
        
        // Create user profile in Firestore
        await createUserProfile(user, displayName);
        
        // Show success message
        showSuccessMessage('ลงทะเบียนสำเร็จ! กำลังเข้าสู่ระบบ...');
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
            window.location.href = 'pages/dashboard.html';
        }, 2000);
        
    } catch (error) {
        console.error('Registration error:', error);
        hideLoading();
        
        // Handle specific Firebase Auth errors
        let errorMessage = 'เกิดข้อผิดพลาดในการลงทะเบียน';
        
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = 'อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่น';
                break;
            case 'auth/invalid-email':
                errorMessage = 'รูปแบบอีเมลไม่ถูกต้อง';
                break;
            case 'auth/weak-password':
                errorMessage = 'รหัสผ่านอ่อนเกินไป กรุณาใช้รหัสผ่านที่แข็งแกร่งกว่า';
                break;
            case 'auth/operation-not-allowed':
                errorMessage = 'การลงทะเบียนด้วยอีเมลและรหัสผ่านถูกปิดใช้งาน';
                break;
            case 'auth/too-many-requests':
                errorMessage = 'มีการพยายามลงทะเบียนมากเกินไป กรุณาลองใหม่ในภายหลัง';
                break;
            default:
                errorMessage = error.message || 'เกิดข้อผิดพลาดในการลงทะเบียน';
        }
        
        showError(errorMessage);
    }
}

// Show success message
function showSuccessMessage(message) {
    // Create success alert
    const successAlert = document.createElement('div');
    successAlert.className = 'alert alert-success mt-3';
    successAlert.role = 'alert';
    successAlert.innerHTML = `
        <i class="bi bi-check-circle-fill"></i>
        ${message}
    `;
    
    // Insert before error alert
    errorAlert.parentNode.insertBefore(successAlert, errorAlert);
    
    // Scroll to success message
    successAlert.scrollIntoView({ behavior: 'smooth' });
}

// Event listeners
if (registerForm) {
    registerForm.addEventListener('submit', handleRegister);
}

// Real-time password confirmation validation
if (confirmPassword) {
    confirmPassword.addEventListener('input', () => {
        if (registerPassword.value !== confirmPassword.value) {
            confirmPassword.setCustomValidity('รหัสผ่านไม่ตรงกัน');
        } else {
            confirmPassword.setCustomValidity('');
        }
    });
}

// Password strength indicator
if (registerPassword) {
    registerPassword.addEventListener('input', () => {
        const password = registerPassword.value;
        const strengthIndicator = document.getElementById('passwordStrength');
        
        if (strengthIndicator) {
            let strength = 0;
            let message = '';
            let color = '';
            
            if (password.length >= 6) strength++;
            if (password.match(/[a-z]/)) strength++;
            if (password.match(/[A-Z]/)) strength++;
            if (password.match(/[0-9]/)) strength++;
            if (password.match(/[^a-zA-Z0-9]/)) strength++;
            
            switch (strength) {
                case 0:
                case 1:
                    message = 'อ่อน';
                    color = 'danger';
                    break;
                case 2:
                    message = 'ปานกลาง';
                    color = 'warning';
                    break;
                case 3:
                    message = 'ดี';
                    color = 'info';
                    break;
                case 4:
                case 5:
                    message = 'แข็งแกร่ง';
                    color = 'success';
                    break;
            }
            
            strengthIndicator.textContent = message;
            strengthIndicator.className = `badge bg-${color}`;
        }
    });
}

// Export functions for use in other modules
export {
    validateRegisterForm,
    showError,
    hideError,
    showLoading,
    hideLoading,
    handleRegister
};
