// ===== Performance Monitoring สำหรับระบบจัดการร้านอาหารทะเลสด =====

class PerformanceMonitor {
    constructor() {
        this.metrics = {
            pageLoadTimes: {},
            apiResponseTimes: {},
            memoryUsage: [],
            errors: []
        };
        this.startTime = performance.now();
        this.init();
    }

    init() {
        // วัดเวลาโหลดหน้า
        this.measurePageLoad();
        
        // วัดการใช้ memory
        this.measureMemoryUsage();
        
        // ติดตาม API calls
        this.interceptAPICalls();
        
        // ติดตาม errors
        this.trackErrors();
        
        // ติดตาม user interactions
        this.trackUserInteractions();
    }

    // วัดเวลาโหลดหน้า
    measurePageLoad() {
        window.addEventListener('load', () => {
            const loadTime = performance.now() - this.startTime;
            const navigation = performance.getEntriesByType('navigation')[0];
            
            this.metrics.pageLoadTimes = {
                totalLoadTime: loadTime,
                domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                firstPaint: this.getFirstPaint(),
                firstContentfulPaint: this.getFirstContentfulPaint(),
                largestContentfulPaint: this.getLargestContentfulPaint()
            };
            
            this.sendMetrics('page_load', this.metrics.pageLoadTimes);
        });
    }

    // วัด First Paint
    getFirstPaint() {
        const paintEntries = performance.getEntriesByType('paint');
        const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
        return firstPaint ? firstPaint.startTime : 0;
    }

    // วัด First Contentful Paint
    getFirstContentfulPaint() {
        const paintEntries = performance.getEntriesByType('paint');
        const firstContentfulPaint = paintEntries.find(entry => entry.name === 'first-contentful-paint');
        return firstContentfulPaint ? firstContentfulPaint.startTime : 0;
    }

    // วัด Largest Contentful Paint
    async getLargestContentfulPaint() {
        try {
            // ใช้ Performance Observer แทน getEntriesByType
            if ('PerformanceObserver' in window) {
                return new Promise((resolve) => {
                    const observer = new PerformanceObserver((list) => {
                        const entries = list.getEntries();
                        if (entries.length > 0) {
                            resolve(entries[entries.length - 1].startTime);
                        }
                    });
                    
                    try {
                        observer.observe({ entryTypes: ['largest-contentful-paint'] });
                    } catch (e) {
                        console.warn('LCP observer not supported:', e);
                        resolve(0);
                        return;
                    }
                    
                    // Timeout after 5 seconds
                    setTimeout(() => resolve(0), 5000);
                });
            } else {
                // Fallback สำหรับ browser ที่ไม่รองรับ PerformanceObserver
                try {
                    const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
                    if (lcpEntries.length > 0) {
                        return lcpEntries[lcpEntries.length - 1].startTime;
                    }
                } catch (fallbackError) {
                    console.warn('LCP fallback not supported:', fallbackError);
                }
            }
        } catch (error) {
            console.warn('LCP API not supported:', error);
        }
        return 0;
    }

    // วัดการใช้ memory
    measureMemoryUsage() {
        if ('memory' in performance) {
            setInterval(() => {
                const memoryInfo = performance.memory;
                this.metrics.memoryUsage.push({
                    timestamp: Date.now(),
                    usedJSHeapSize: memoryInfo.usedJSHeapSize,
                    totalJSHeapSize: memoryInfo.totalJSHeapSize,
                    jsHeapSizeLimit: memoryInfo.jsHeapSizeLimit
                });
                
                // เก็บข้อมูล 100 รายการล่าสุด
                if (this.metrics.memoryUsage.length > 100) {
                    this.metrics.memoryUsage.shift();
                }
            }, 5000); // วัดทุก 5 วินาที
        }
    }

    // ติดตาม API calls
    interceptAPICalls() {
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const startTime = performance.now();
            const url = args[0];
            
            try {
                const response = await originalFetch(...args);
                const endTime = performance.now();
                const duration = endTime - startTime;
                
                this.metrics.apiResponseTimes[url] = {
                    duration: duration,
                    status: response.status,
                    timestamp: Date.now()
                };
                
                this.sendMetrics('api_call', { url, duration, status: response.status });
                
                return response;
            } catch (error) {
                const endTime = performance.now();
                const duration = endTime - startTime;
                
                this.metrics.errors.push({
                    type: 'api_error',
                    url: url,
                    error: error.message,
                    duration: duration,
                    timestamp: Date.now()
                });
                
                console.error(`API Error: ${url} - ${error.message}`);
                this.sendMetrics('api_error', { url, error: error.message, duration });
                
                throw error;
            }
        };
    }

    // ติดตาม errors
    trackErrors() {
        window.addEventListener('error', (event) => {
            // ตรวจสอบว่าเป็น Google Analytics error หรือไม่
            if (this.shouldIgnoreError(event)) {
                return;
            }
            
            this.metrics.errors.push({
                type: 'javascript_error',
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                timestamp: Date.now()
            });
            
            this.sendMetrics('javascript_error', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno
            });
        });

        window.addEventListener('unhandledrejection', (event) => {
            this.metrics.errors.push({
                type: 'unhandled_promise_rejection',
                reason: event.reason,
                timestamp: Date.now()
            });
            
            this.sendMetrics('unhandled_promise_rejection', {
                reason: event.reason
            });
        });
        
        // ติดตาม resource loading errors
        window.addEventListener('error', (event) => {
            if (event.target && (event.target.tagName === 'IMG' || event.target.tagName === 'SCRIPT' || event.target.tagName === 'LINK')) {
                // ตรวจสอบว่าเป็น Google Analytics resource error หรือไม่
                if (this.shouldIgnoreResourceError(event)) {
                    return;
                }
                
                this.metrics.errors.push({
                    type: 'resource_error',
                    resourceType: event.target.tagName,
                    resourceUrl: event.target.src || event.target.href,
                    timestamp: Date.now()
                });
            }
        }, true);
    }

    // ติดตาม user interactions
    trackUserInteractions() {
        let interactionCount = 0;
        let lastInteractionTime = Date.now();
        
        const trackInteraction = () => {
            interactionCount++;
            lastInteractionTime = Date.now();
        };
        
        // ติดตาม clicks
        document.addEventListener('click', trackInteraction);
        
        // ติดตาม form submissions
        document.addEventListener('submit', (event) => {
            trackInteraction();
            this.sendMetrics('form_submission', {
                formId: event.target.id || 'unknown',
                timestamp: Date.now()
            });
        });
        
        // ติดตาม navigation
        document.addEventListener('DOMContentLoaded', () => {
            this.sendMetrics('page_navigation', {
                url: window.location.href,
                timestamp: Date.now()
            });
        });
    }

    // ส่ง metrics ไปยัง monitoring service
    sendMetrics(type, data) {
        // TODO: ส่งข้อมูลไปยัง monitoring service
        // เช่น Google Analytics, Firebase Analytics, หรือ custom service
        
        // สำหรับตอนนี้ให้เก็บใน localStorage
        try {
            const existingMetrics = JSON.parse(localStorage.getItem('performance_metrics') || '[]');
            existingMetrics.push({
                type: type,
                data: data,
                timestamp: Date.now()
            });
            
            // เก็บข้อมูล 1000 รายการล่าสุด
            if (existingMetrics.length > 1000) {
                existingMetrics.splice(0, existingMetrics.length - 1000);
            }
            
            localStorage.setItem('performance_metrics', JSON.stringify(existingMetrics));
        } catch (error) {
            console.error('Error saving performance metrics:', error);
        }
    }

    // ดึงข้อมูล performance metrics
    getMetrics() {
        return this.metrics;
    }

    // ดึงข้อมูลจาก localStorage
    getStoredMetrics() {
        try {
            return JSON.parse(localStorage.getItem('performance_metrics') || '[]');
        } catch (error) {
            console.error('Error reading stored metrics:', error);
            return [];
        }
    }

    // ล้างข้อมูล metrics
    clearMetrics() {
        this.metrics = {
            pageLoadTimes: {},
            apiResponseTimes: {},
            memoryUsage: [],
            errors: []
        };
        localStorage.removeItem('performance_metrics');
    }

    // สร้างรายงาน performance
    generateReport() {
        const metrics = this.getMetrics();
        const storedMetrics = this.getStoredMetrics();
        
        const report = {
            timestamp: new Date().toISOString(),
            pageLoad: metrics.pageLoadTimes,
            memory: metrics.memoryUsage.length > 0 ? metrics.memoryUsage[metrics.memoryUsage.length - 1] : null,
            errors: metrics.errors.length,
            apiCalls: Object.keys(metrics.apiResponseTimes).length,
            totalStoredMetrics: storedMetrics.length
        };
        
        // คำนวณค่าเฉลี่ย API response time
        const apiTimes = Object.values(metrics.apiResponseTimes).map(m => m.duration);
        if (apiTimes.length > 0) {
            report.averageAPITime = apiTimes.reduce((a, b) => a + b, 0) / apiTimes.length;
        }
        
        return report;
    }
}

// สร้าง instance ของ PerformanceMonitor
const performanceMonitor = new PerformanceMonitor();

// Export สำหรับใช้ในไฟล์อื่น
export default performanceMonitor;

// ฟังก์ชันสำหรับแสดง performance dashboard
export function showPerformanceDashboard() {
    const report = performanceMonitor.generateReport();
    
    // Performance report generated silently
    
    return report;
}

// ฟังก์ชันสำหรับส่ง performance data ไปยัง server
export async function sendPerformanceData() {
    const report = performanceMonitor.generateReport();
    const storedMetrics = performanceMonitor.getStoredMetrics();
    
    try {
        // ส่งข้อมูลไปยัง server (ถ้ามี)
        const response = await fetch('/api/performance', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                report: report,
                metrics: storedMetrics
            })
        });
        
        if (response.ok) {
            // ล้างข้อมูลหลังจากส่งสำเร็จ
            performanceMonitor.clearMetrics();
        }
    } catch (error) {
        console.error('Error sending performance data:', error);
    }
}

// ฟังก์ชันสำหรับตรวจสอบว่า error ควรถูก ignore หรือไม่
function shouldIgnoreError(event) {
    const errorMessage = event.message || '';
    const errorSource = event.filename || '';
    
    // Google Analytics errors ที่ควร ignore
    const ignorePatterns = [
        'google-analytics.com',
        'googletagmanager.com',
        'analytics.google.com',
        'ssl.google-analytics.com',
        'region1.google-analytics.com',
        'region1.analytics.google.com',
        'www.google-analytics.com',
        'g/collect',
        'G-EP0RBFGLW6'
    ];
    
    // ตรวจสอบว่า error มาจาก Google Analytics หรือไม่
    return ignorePatterns.some(pattern => 
        errorMessage.includes(pattern) || 
        errorSource.includes(pattern)
    );
}

// ฟังก์ชันสำหรับตรวจสอบว่า resource error ควรถูก ignore หรือไม่
function shouldIgnoreResourceError(event) {
    const resourceUrl = event.target?.src || event.target?.href || '';
    
    // Google Analytics resources ที่ควร ignore
    const ignorePatterns = [
        'google-analytics.com',
        'googletagmanager.com',
        'analytics.google.com',
        'ssl.google-analytics.com',
        'region1.google-analytics.com',
        'region1.analytics.google.com',
        'www.google-analytics.com',
        'g/collect',
        'G-EP0RBFGLW6'
    ];
    
    // ตรวจสอบว่า resource มาจาก Google Analytics หรือไม่
    return ignorePatterns.some(pattern => resourceUrl.includes(pattern));
}

// เพิ่มฟังก์ชันเหล่านี้เข้าไปใน PerformanceMonitor class
PerformanceMonitor.prototype.shouldIgnoreError = shouldIgnoreError;
PerformanceMonitor.prototype.shouldIgnoreResourceError = shouldIgnoreResourceError;
