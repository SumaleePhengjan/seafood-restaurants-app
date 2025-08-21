// ===== Error Handler สำหรับระบบจัดการร้านอาหารทะเลสด =====

class ErrorHandler {
    constructor() {
        this.errorCount = 0;
        this.maxErrors = 10;
        this.errorWindow = 60000; // 1 นาที
        this.errors = [];
        this.init();
    }

    init() {
        // จับ JavaScript errors
        window.addEventListener('error', (event) => {
            // ตรวจสอบว่าเป็น error ที่สำคัญหรือไม่
            if (this.shouldIgnoreError(event)) {
                return;
            }
            
            this.handleError('javascript_error', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error?.stack
            });
        });

        // จับ Promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError('unhandled_promise_rejection', {
                reason: event.reason,
                promise: event.promise
            });
        });

        // จับ Resource loading errors
        window.addEventListener('error', (event) => {
            if (event.target !== window) {
                // ตรวจสอบว่าเป็น resource error ที่สำคัญหรือไม่
                if (this.shouldIgnoreResourceError(event)) {
                    return;
                }
                
                this.handleError('resource_error', {
                    type: event.target.tagName,
                    src: event.target.src || event.target.href,
                    message: 'Resource failed to load'
                });
            }
        }, true);
    }

    // ตรวจสอบว่าเป็น error ที่ควร ignore หรือไม่
    shouldIgnoreError(event) {
        const ignoredErrors = [
            'Illegal invocation',
            'Script error.',
            'ResizeObserver loop limit exceeded',
            'NetworkError when attempting to fetch resource',
            'Failed to fetch'
        ];
        
        return ignoredErrors.some(ignored => 
            event.message && event.message.includes(ignored)
        );
    }

    // ตรวจสอบว่าเป็น resource error ที่ควร ignore หรือไม่
    shouldIgnoreResourceError(event) {
        const ignoredResources = [
            'bootstrap-icons.woff2',
            'bootstrap-icons.woff',
            'googletagmanager.com',
            'google-analytics.com'
        ];
        
        const src = event.target.src || event.target.href || '';
        return ignoredResources.some(ignored => src.includes(ignored));
    }

    handleError(type, details) {
        const error = {
            type: type,
            details: details,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent
        };

        // เพิ่ม error ลงในรายการ
        this.errors.push(error);

        // ลบ errors เก่าที่เกิน 1 นาที
        const now = Date.now();
        this.errors = this.errors.filter(err => {
            const errorTime = new Date(err.timestamp).getTime();
            return now - errorTime < this.errorWindow;
        });

        // ตรวจสอบจำนวน errors
        if (this.errors.length > this.maxErrors) {
            this.showErrorAlert('มีข้อผิดพลาดเกิดขึ้นมากเกินไป กรุณารีเฟรชหน้าเว็บ');
            return;
        }

        // บันทึก error
        this.logError(error);

        // แสดง error ใน console (เฉพาะ development)
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.error('Error Handler:', error);
        }
    }

    logError(error) {
        try {
            // บันทึกลง localStorage
            const existingErrors = JSON.parse(localStorage.getItem('app_errors') || '[]');
            existingErrors.push(error);
            
            // เก็บเฉพาะ 100 errors ล่าสุด
            if (existingErrors.length > 100) {
                existingErrors.splice(0, existingErrors.length - 100);
            }
            
            localStorage.setItem('app_errors', JSON.stringify(existingErrors));
        } catch (e) {
            console.warn('Failed to save error to localStorage:', e);
        }
    }

    showErrorAlert(message) {
        // สร้าง error alert
        const alert = document.createElement('div');
        alert.className = 'error-alert alert alert-danger alert-fixed';
        alert.setAttribute('role', 'alert');
        
        alert.innerHTML = `
            <div class="alert-content">
                <div class="alert-icon">
                    <i class="bi bi-exclamation-triangle-fill"></i>
                </div>
                <div class="alert-text">
                    <div class="alert-title">ข้อผิดพลาด</div>
                    <div class="alert-message">${message}</div>
                </div>
            </div>
            <button type="button" class="btn-close" onclick="this.parentElement.remove()" aria-label="ปิด">
                <i class="bi bi-x"></i>
            </button>
            <div class="alert-progress"></div>
        `;

        document.body.appendChild(alert);

        // ลบ alert หลังจาก 10 วินาที
        setTimeout(() => {
            if (alert.parentElement) {
                alert.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => alert.remove(), 300);
            }
        }, 10000);
    }

    showSuccessAlert(message) {
        const alert = document.createElement('div');
        alert.className = 'success-alert alert alert-success alert-fixed';
        alert.setAttribute('role', 'alert');
        
        alert.innerHTML = `
            <div class="alert-content">
                <div class="alert-icon">
                    <i class="bi bi-check-circle-fill"></i>
                </div>
                <div class="alert-text">
                    <div class="alert-title">สำเร็จ</div>
                    <div class="alert-message">${message}</div>
                </div>
            </div>
            <button type="button" class="btn-close" onclick="this.parentElement.remove()" aria-label="ปิด">
                <i class="bi bi-x"></i>
            </button>
            <div class="alert-progress"></div>
        `;

        document.body.appendChild(alert);

        setTimeout(() => {
            if (alert.parentElement) {
                alert.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => alert.remove(), 300);
            }
        }, 5000);
    }

    showWarningAlert(message) {
        const alert = document.createElement('div');
        alert.className = 'warning-alert alert alert-warning alert-fixed';
        alert.setAttribute('role', 'alert');
        
        alert.innerHTML = `
            <div class="alert-content">
                <div class="alert-icon">
                    <i class="bi bi-exclamation-triangle-fill"></i>
                </div>
                <div class="alert-text">
                    <div class="alert-title">คำเตือน</div>
                    <div class="alert-message">${message}</div>
                </div>
            </div>
            <button type="button" class="btn-close" onclick="this.parentElement.remove()" aria-label="ปิด">
                <i class="bi bi-x"></i>
            </button>
            <div class="alert-progress"></div>
        `;

        document.body.appendChild(alert);

        setTimeout(() => {
            if (alert.parentElement) {
                alert.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => alert.remove(), 300);
            }
        }, 7000);
    }

    // ดึงข้อมูล errors จาก localStorage
    getStoredErrors() {
        try {
            return JSON.parse(localStorage.getItem('app_errors') || '[]');
        } catch (error) {
            console.warn('Failed to read stored errors:', error);
            return [];
        }
    }

    // ล้างข้อมูล errors
    clearErrors() {
        this.errors = [];
        localStorage.removeItem('app_errors');
    }

    // สร้างรายงาน errors
    generateErrorReport() {
        const storedErrors = this.getStoredErrors();
        const currentErrors = this.errors;

        return {
            timestamp: new Date().toISOString(),
            currentErrors: currentErrors.length,
            storedErrors: storedErrors.length,
            totalErrors: currentErrors.length + storedErrors.length,
            recentErrors: currentErrors.slice(-5), // 5 errors ล่าสุด
            errorTypes: this.getErrorTypeCount(currentErrors.concat(storedErrors))
        };
    }

    getErrorTypeCount(errors) {
        const typeCount = {};
        errors.forEach(error => {
            typeCount[error.type] = (typeCount[error.type] || 0) + 1;
        });
        return typeCount;
    }
}

// สร้าง instance ของ ErrorHandler
const errorHandler = new ErrorHandler();

// Export สำหรับใช้ในไฟล์อื่น
export default errorHandler;

// Export ฟังก์ชันสำหรับแสดง alerts
export const showError = (message) => errorHandler.showErrorAlert(message);
export const showSuccess = (message) => errorHandler.showSuccessAlert(message);
export const showWarning = (message) => errorHandler.showWarningAlert(message);
