// ===== Security Utilities สำหรับระบบจัดการร้านอาหารทะเลสด =====

// ตรวจสอบการเข้าสู่ระบบ
export function checkAuthentication() {
    return new Promise((resolve) => {
        let retryCount = 0;
        const maxRetries = 5;
        
        const checkAuth = () => {
            try {
                // กำลังตรวจสอบ Firebase Auth...
                
                if (!window.firebase) {
                    console.warn('Firebase ยังไม่ได้โหลด');
                    if (retryCount < maxRetries) {
                        retryCount++;
                        setTimeout(checkAuth, 1000);
                    } else {
                        console.error('Firebase ไม่สามารถโหลดได้หลังจากลอง', maxRetries, 'ครั้ง');
                        resolve(false);
                    }
                    return;
                }
                
                if (!window.firebase.auth) {
                    console.warn('Firebase Auth ยังไม่ได้โหลด');
                    if (retryCount < maxRetries) {
                        retryCount++;
                        setTimeout(checkAuth, 1000);
                    } else {
                        console.error('Firebase Auth ไม่สามารถโหลดได้หลังจากลอง', maxRetries, 'ครั้ง');
                        resolve(false);
                    }
                    return;
                }
                
                // ตรวจสอบว่า auth object พร้อมใช้งานหรือไม่
                const auth = window.firebase.auth;
                if (!auth || typeof auth.onAuthStateChanged !== 'function') {
                    console.warn('Firebase Auth object ไม่ถูกต้อง');
                    if (retryCount < maxRetries) {
                        retryCount++;
                        setTimeout(checkAuth, 1000);
                    } else {
                        resolve(false);
                    }
                    return;
                }
                
                // Firebase Auth พร้อมใช้งานแล้ว
                
                // ใช้ try-catch เพื่อป้องกัน error
                try {
                    const unsubscribe = auth.onAuthStateChanged((user) => {
                        try {
                            if (unsubscribe && typeof unsubscribe === 'function') {
                                unsubscribe();
                            }
                        } catch (e) {
                            console.warn('Error unsubscribing from auth state:', e);
                        }
                        resolve(!!user);
                    }, (error) => {
                        console.error('Auth state change error:', error);
                        resolve(false);
                    });
                } catch (error) {
                    console.error('Error setting up auth state listener:', error);
                    resolve(false);
                }
                
            } catch (error) {
                console.error('Error in checkAuthentication:', error);
                if (retryCount < maxRetries) {
                    retryCount++;
                    setTimeout(checkAuth, 1000);
                } else {
                    resolve(false);
                }
            }
        };
        
        // เริ่มต้นการตรวจสอบ
        checkAuth();
    });
}

// ตรวจสอบสิทธิ์การเข้าถึง
export function checkPermission(requiredRole = 'user') {
    return new Promise(async (resolve) => {
        const isAuthenticated = await checkAuthentication();
        if (!isAuthenticated) {
            resolve(false);
            return;
        }
        
        // ตรวจสอบ role ของผู้ใช้ (ถ้ามี)
        const user = window.firebase.auth.currentUser;
        if (user) {
            // TODO: เพิ่มการตรวจสอบ role จาก Firestore
            resolve(true);
        } else {
            resolve(false);
        }
    });
}

// Sanitize input data
export function sanitizeInput(input) {
    if (typeof input !== 'string') {
        return input;
    }
    
    // Remove potentially dangerous characters
    return input
        .replace(/[<>]/g, '') // Remove < and >
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+=/gi, '') // Remove event handlers
        .trim();
}

// Validate email format
export function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Validate phone number (Thai format)
export function validatePhone(phone) {
    const phoneRegex = /^(\+66|0)[0-9]{8,9}$/;
    return phoneRegex.test(phone);
}

// Validate price (positive number)
export function validatePrice(price) {
    const num = parseFloat(price);
    return !isNaN(num) && num >= 0;
}

// Validate quantity (positive integer)
export function validateQuantity(quantity) {
    const num = parseInt(quantity);
    return !isNaN(num) && num > 0 && Number.isInteger(num);
}

// Rate limiting
class RateLimiter {
    constructor(maxRequests = 10, timeWindow = 60000) { // 10 requests per minute
        this.maxRequests = maxRequests;
        this.timeWindow = timeWindow;
        this.requests = new Map();
    }
    
    isAllowed(userId) {
        const now = Date.now();
        const userRequests = this.requests.get(userId) || [];
        
        // Remove old requests
        const recentRequests = userRequests.filter(time => now - time < this.timeWindow);
        
        if (recentRequests.length >= this.maxRequests) {
            return false;
        }
        
        // Add current request
        recentRequests.push(now);
        this.requests.set(userId, recentRequests);
        
        return true;
    }
    
    reset(userId) {
        this.requests.delete(userId);
    }
}

export const rateLimiter = new RateLimiter();

// CSRF Protection
export function generateCSRFToken() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function validateCSRFToken(token) {
    // TODO: Implement proper CSRF validation
    return token && token.length > 0;
}

// Input validation for forms
export function validateFormData(formData, rules) {
    const errors = {};
    
    for (const [field, value] of Object.entries(formData)) {
        const fieldRules = rules[field];
        if (!fieldRules) continue;
        
        // Required validation
        if (fieldRules.required && (!value || value.toString().trim() === '')) {
            errors[field] = `${field} is required`;
            continue;
        }
        
        // Skip other validations if value is empty and not required
        if (!value || value.toString().trim() === '') continue;
        
        // Type validation
        if (fieldRules.type) {
            switch (fieldRules.type) {
                case 'email':
                    if (!validateEmail(value)) {
                        errors[field] = 'Invalid email format';
                    }
                    break;
                case 'phone':
                    if (!validatePhone(value)) {
                        errors[field] = 'Invalid phone number format';
                    }
                    break;
                case 'price':
                    if (!validatePrice(value)) {
                        errors[field] = 'Price must be a positive number';
                    }
                    break;
                case 'quantity':
                    if (!validateQuantity(value)) {
                        errors[field] = 'Quantity must be a positive integer';
                    }
                    break;
                case 'number':
                    if (isNaN(parseFloat(value))) {
                        errors[field] = 'Must be a valid number';
                    }
                    break;
            }
        }
        
        // Length validation
        if (fieldRules.minLength && value.toString().length < fieldRules.minLength) {
            errors[field] = `Minimum length is ${fieldRules.minLength} characters`;
        }
        
        if (fieldRules.maxLength && value.toString().length > fieldRules.maxLength) {
            errors[field] = `Maximum length is ${fieldRules.maxLength} characters`;
        }
        
        // Range validation
        if (fieldRules.min !== undefined && parseFloat(value) < fieldRules.min) {
            errors[field] = `Minimum value is ${fieldRules.min}`;
        }
        
        if (fieldRules.max !== undefined && parseFloat(value) > fieldRules.max) {
            errors[field] = `Maximum value is ${fieldRules.max}`;
        }
        
        // Pattern validation
        if (fieldRules.pattern && !fieldRules.pattern.test(value)) {
            errors[field] = fieldRules.patternMessage || 'Invalid format';
        }
    }
    
    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
}

// Security headers
export function addSecurityHeaders() {
    // Add CSP meta tag if not exists
    if (!document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
        const cspMeta = document.createElement('meta');
        cspMeta.setAttribute('http-equiv', 'Content-Security-Policy');
        cspMeta.setAttribute('content', "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.gstatic.com https://cdn.jsdelivr.net https://www.googletagmanager.com https://www.google-analytics.com https://ssl.google-analytics.com https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net https://cdn.datatables.net; font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net; img-src 'self' data: https: https://www.google-analytics.com https://ssl.google-analytics.com; connect-src 'self' https://firestore.googleapis.com https://identitytoolkit.googleapis.com https://firebaseinstallations.googleapis.com https://www.google-analytics.com https://analytics.google.com https://ssl.google-analytics.com https://firebase.googleapis.com https://www.googletagmanager.com https://region1.google-analytics.com https://region1.analytics.google.com; frame-src 'self' https://www.google-analytics.com https://ssl.google-analytics.com;");
        document.head.appendChild(cspMeta);
    }
}

// Log security events
export function logSecurityEvent(event, details = {}) {
    const securityLog = {
        timestamp: new Date().toISOString(),
        event: event,
        details: details,
        userAgent: navigator.userAgent,
        url: window.location.href
    };
    
    console.warn('Security Event:', securityLog);
    
    // TODO: Send to security monitoring service
    // sendToSecurityService(securityLog);
}

// Initialize security features
export function initializeSecurity() {
    try {
        addSecurityHeaders();
        
        // Monitor for suspicious activities (simplified)
        const originalErrorHandler = window.onerror;
        window.onerror = function(message, source, lineno, colno, error) {
            // Call original handler if exists
            if (originalErrorHandler) {
                try {
                    originalErrorHandler.call(this, message, source, lineno, colno, error);
                } catch (e) {
                    console.warn('Original error handler failed:', e);
                }
            }
            
            // Log security event safely
            try {
                logSecurityEvent('javascript_error', {
                    message: message,
                    filename: source,
                    lineno: lineno,
                    colno: colno
                });
            } catch (logError) {
                console.warn('Error logging security event:', logError);
            }
            
            return false; // Don't prevent default error handling
        };
        
        // Security features initialized successfully
    } catch (error) {
        console.warn('Security initialization failed:', error);
    }
}

// Export validation rules
export const VALIDATION_RULES = {
    email: {
        required: true,
        type: 'email',
        maxLength: 100
    },
    password: {
        required: true,
        minLength: 6,
        maxLength: 50
    },
    productName: {
        required: true,
        minLength: 1,
        maxLength: 100
    },
    price: {
        required: true,
        type: 'price',
        min: 0,
        max: 1000000
    },
    quantity: {
        required: true,
        type: 'quantity',
        min: 1,
        max: 10000
    },
    phone: {
        type: 'phone',
        maxLength: 15
    }
};
