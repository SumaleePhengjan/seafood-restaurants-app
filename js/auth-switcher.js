// Auth Switcher JavaScript - JavaScript สำหรับสลับระหว่างหน้า Login และ Register

// DOM Elements
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const formTitle = document.getElementById('formTitle');
const formSubtitle = document.getElementById('formSubtitle');
const showRegisterBtn = document.getElementById('showRegisterBtn');
const showLoginBtn = document.getElementById('showLoginBtn');
const errorAlert = document.getElementById('errorAlert');

// Switch to Register form
function showRegisterForm() {
    // Hide login form
    loginForm.classList.add('d-none');
    
    // Show register form
    registerForm.classList.remove('d-none');
    
    // Update title and subtitle
    formTitle.textContent = 'ลงทะเบียน';
    formSubtitle.textContent = 'สร้างบัญชีใหม่เพื่อใช้งานระบบ';
    
    // Hide any existing error messages
    if (errorAlert) {
        errorAlert.classList.add('d-none');
    }
    
    // Clear form fields
    clearLoginForm();
    
    // Focus on first field
    const firstField = registerForm.querySelector('input');
    if (firstField) {
        firstField.focus();
    }
    
    // Update URL without page reload
    const url = new URL(window.location);
    url.searchParams.set('mode', 'register');
    window.history.pushState({}, '', url);
}

// Switch to Login form
function showLoginForm() {
    // Hide register form
    registerForm.classList.add('d-none');
    
    // Show login form
    loginForm.classList.remove('d-none');
    
    // Update title and subtitle
    formTitle.textContent = 'เข้าสู่ระบบ';
    formSubtitle.textContent = 'กรุณาเข้าสู่ระบบเพื่อใช้งานระบบ';
    
    // Hide any existing error messages
    if (errorAlert) {
        errorAlert.classList.add('d-none');
    }
    
    // Clear form fields
    clearRegisterForm();
    
    // Focus on first field
    const firstField = loginForm.querySelector('input');
    if (firstField) {
        firstField.focus();
    }
    
    // Update URL without page reload
    const url = new URL(window.location);
    url.searchParams.delete('mode');
    window.history.pushState({}, '', url);
}

// Clear login form fields
function clearLoginForm() {
    if (loginForm) {
        loginForm.reset();
        loginForm.classList.remove('was-validated');
    }
}

// Clear register form fields
function clearRegisterForm() {
    if (registerForm) {
        registerForm.reset();
        registerForm.classList.remove('was-validated');
        
        // Clear custom validation messages
        const inputs = registerForm.querySelectorAll('input');
        inputs.forEach(input => {
            input.setCustomValidity('');
        });
    }
}

// Initialize form based on URL parameters
function initializeForm() {
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    
    if (mode === 'register') {
        showRegisterForm();
    } else {
        showLoginForm();
    }
}

// Handle browser back/forward buttons
window.addEventListener('popstate', () => {
    initializeForm();
});

// Event listeners
if (showRegisterBtn) {
    showRegisterBtn.addEventListener('click', showRegisterForm);
}

if (showLoginBtn) {
    showLoginBtn.addEventListener('click', showLoginForm);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeForm();
});

// Add smooth transitions
function addSmoothTransitions() {
    const forms = [loginForm, registerForm];
    
    forms.forEach(form => {
        if (form) {
            form.style.transition = 'opacity 0.3s ease-in-out';
        }
    });
}

// Enhanced form switching with animations
function showRegisterFormWithAnimation() {
    // Add fade out effect to login form
    loginForm.style.opacity = '0';
    
    setTimeout(() => {
        showRegisterForm();
        registerForm.style.opacity = '0';
        
        // Trigger reflow
        registerForm.offsetHeight;
        
        // Add fade in effect
        registerForm.style.opacity = '1';
    }, 150);
}

function showLoginFormWithAnimation() {
    // Add fade out effect to register form
    registerForm.style.opacity = '0';
    
    setTimeout(() => {
        showLoginForm();
        loginForm.style.opacity = '0';
        
        // Trigger reflow
        loginForm.offsetHeight;
        
        // Add fade in effect
        loginForm.style.opacity = '1';
    }, 150);
}

// Keyboard shortcuts
document.addEventListener('keydown', (event) => {
    // Ctrl/Cmd + R to switch to register
    if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
        event.preventDefault();
        if (loginForm && !loginForm.classList.contains('d-none')) {
            showRegisterFormWithAnimation();
        }
    }
    
    // Ctrl/Cmd + L to switch to login
    if ((event.ctrlKey || event.metaKey) && event.key === 'l') {
        event.preventDefault();
        if (registerForm && !registerForm.classList.contains('d-none')) {
            showLoginFormWithAnimation();
        }
    }
    
    // Escape to clear forms
    if (event.key === 'Escape') {
        if (loginForm && !loginForm.classList.contains('d-none')) {
            clearLoginForm();
        } else if (registerForm && !registerForm.classList.contains('d-none')) {
            clearRegisterForm();
        }
    }
});

// Add loading state management
function setFormLoading(isLoading) {
    const currentForm = loginForm.classList.contains('d-none') ? registerForm : loginForm;
    const inputs = currentForm.querySelectorAll('input, button');
    
    inputs.forEach(input => {
        input.disabled = isLoading;
    });
}

// Export functions for use in other modules
export {
    showRegisterForm,
    showLoginForm,
    showRegisterFormWithAnimation,
    showLoginFormWithAnimation,
    clearLoginForm,
    clearRegisterForm,
    initializeForm,
    setFormLoading
};
