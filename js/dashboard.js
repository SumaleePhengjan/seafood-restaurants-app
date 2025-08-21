// ===== JavaScript สำหรับหน้า Dashboard =====

// Import Firebase modules จาก window object
const { auth, db } = window.firebase;
import { 
    collection, 
    getDocs, 
    query, 
    where, 
    orderBy, 
    limit,
    onSnapshot 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// Import security utilities
import {
    checkAuthentication,
    logSecurityEvent,
    initializeSecurity
} from './security.js';

// Import performance monitoring
import performanceMonitor from './performance.js';

// Import error handler
import errorHandler, { showError, showSuccess, showWarning } from './error-handler.js';

// ตัวแปรสำหรับเก็บข้อมูล
let salesChart = null;
let currentUser = null;

// ฟังก์ชันหลักเมื่อโหลดหน้า
document.addEventListener('DOMContentLoaded', function() {
    // เริ่มต้น error handler
    try {
        // errorHandler ถูก import แล้วและจะเริ่มต้นอัตโนมัติ
    } catch (error) {
        // เงียบๆ
    }
    
    // เริ่มต้น security features
    try {
        initializeSecurity();
    } catch (error) {
        // เงียบๆ
    }
    
    // ตรวจสอบการเข้าสู่ระบบ
    checkAuthStateAndLoadData();
    
    // ตั้งค่า event listeners
    setupEventListeners();
    
            // ตรวจสอบว่าปุ่มออกจากระบบทำงานหรือไม่ (เงียบๆ)
    setTimeout(() => {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.style.cursor = 'pointer';
        }
    }, 1000);
});

// ตรวจสอบการเข้าสู่ระบบและโหลดข้อมูล
async function checkAuthStateAndLoadData() {
    try {
        // รอให้ Firebase โหลดเสร็จ
        let retryCount = 0;
        const maxRetries = 3;
        
        while (retryCount < maxRetries) {
            if (window.firebase && window.firebase.auth) {
                break;
            }
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            retryCount++;
        }
        
        if (!window.firebase || !window.firebase.auth) {
            showError('เกิดข้อผิดพลาดในการโหลด Firebase');
            return;
        }
        
        const isAuthenticated = await checkAuthentication();
        
        if (isAuthenticated) {
            const user = auth.currentUser;
            if (user) {
                currentUser = user;
                
                // แสดงข้อมูลผู้ใช้
                const userEmailElement = document.getElementById('userEmail');
                if (userEmailElement) {
                    userEmailElement.textContent = user.email;
                }
                
                // โหลดข้อมูล dashboard
                loadDashboardData();
            } else {
                window.location.href = '../index.html';
            }
        } else {
            // ไปหน้า login
            window.location.href = '../index.html';
        }
        
    } catch (error) {
        showError('เกิดข้อผิดพลาดในการตรวจสอบการเข้าสู่ระบบ');
    }
}

// ตั้งค่า event listeners
function setupEventListeners() {
    try {
        // ปุ่มออกจากระบบ
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function(e) {
                e.preventDefault();
                logout();
            });
        }
        
        // ปุ่มรีเฟรช
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', function() {
                loadDashboardData();
            });
        }
        
    } catch (error) {
        // เงียบๆ
    }
}

// โหลดข้อมูล dashboard
async function loadDashboardData() {
    try {
        // แสดง loading state
        showLoadingState(true);
        
        // โหลดข้อมูลทั้งหมดในครั้งเดียว
        await loadAllData();
        
    } catch (error) {
        showError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
        // ซ่อน loading state
        showLoadingState(false);
    }
}

// โหลดข้อมูลทั้งหมดในครั้งเดียว
async function loadAllData() {
    try {
        // ตรวจสอบการเข้าสู่ระบบก่อนโหลดข้อมูล
        const isAuthenticated = await checkAuthentication();
        if (!isAuthenticated) {
            window.location.href = '../index.html';
            return;
        }

        // ดึงข้อมูลทั้งหมดจาก Firestore เพียงครั้งเดียว
        // ใช้ query เพื่อ optimize และจำกัดจำนวนข้อมูล
        const [transactionsSnapshot, productsSnapshot] = await Promise.all([
            getDocs(query(
                collection(db, 'transactions'),
                orderBy('date', 'desc'),
                limit(100) // จำกัดจำนวนข้อมูล
            )),
            getDocs(query(
                collection(db, 'products'),
                orderBy('createdAt', 'desc'),
                limit(50) // จำกัดจำนวนสินค้า
            ))
        ]);
        
        // แปลงข้อมูลเป็น array
        const transactions = [];
        const products = [];
        
        transactionsSnapshot.forEach((doc) => {
            transactions.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        productsSnapshot.forEach((doc) => {
            products.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        // ประมวลผลข้อมูลทั้งหมด
        processDashboardData(transactions, products);
        
    } catch (error) {
        console.error('ข้อผิดพลาดในการโหลดข้อมูล:', error);
        showError('เกิดข้อผิดพลาดในการโหลดข้อมูลจากฐานข้อมูล');
    }
}

// ประมวลผลข้อมูล Dashboard
function processDashboardData(transactions, products) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // คำนวณสถิติ
    let totalRevenue = 0;
    let totalExpense = 0;
    const salesByDate = {};
    const productSales = {};
    
    // เริ่มต้นข้อมูล 7 วันล่าสุด
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateKey = formatDate(date);
        salesByDate[dateKey] = 0;
    }
    
    // ประมวลผลธุรกรรม
    transactions.forEach(transaction => {
        if (transaction.date) {
            const transactionDate = new Date(transaction.date);
            
            if (transaction.type === 'sell') {
                const total = transaction.total || 0;
                
                // สถิติรายวัน
                if (transactionDate >= today) {
                    totalRevenue += total;
                }
                
                // ยอดขาย 7 วันล่าสุด
                const diffTime = Math.abs(new Date() - transactionDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays <= 7) {
                    const dateKey = formatDate(transactionDate);
                    if (salesByDate[dateKey] !== undefined) {
                        salesByDate[dateKey] += total;
                    }
                }
                
                // สินค้าขายดี
                if (transaction.productName) {
                    productSales[transaction.productName] = (productSales[transaction.productName] || 0) + total;
                }
            } else if (transaction.type === 'buy' && transactionDate >= today) {
                totalExpense += transaction.total || 0;
            }
        }
    });
    
    // อัปเดตสถิติ
    updateStatistics(totalRevenue, totalExpense, products.length);
    
    // อัปเดตกราฟยอดขาย
    updateSalesChart(salesByDate);
    
    // อัปเดตสินค้าขายดี
    updateTopProducts(productSales);
    
    // อัปเดตการแจ้งเตือน
    updateNotifications(products, transactions);
    
    // อัปเดตธุรกรรมล่าสุด
    updateRecentTransactions(transactions);
}

// อัปเดตสถิติ
function updateStatistics(totalRevenue, totalExpense, totalProducts) {
    const totalProfit = totalRevenue - totalExpense;
    
    document.getElementById('totalRevenue').textContent = formatCurrency(totalRevenue);
    document.getElementById('totalExpense').textContent = formatCurrency(totalExpense);
    document.getElementById('totalProfit').textContent = formatCurrency(totalProfit);
    document.getElementById('totalProducts').textContent = totalProducts;
    
    // เพิ่มสีให้กับสถิติ
    document.getElementById('totalRevenue').parentElement.parentElement.classList.add('revenue');
    document.getElementById('totalExpense').parentElement.parentElement.classList.add('expense');
    document.getElementById('totalProfit').parentElement.parentElement.classList.add('profit');
    document.getElementById('totalProducts').parentElement.parentElement.classList.add('products');
}

// อัปเดตกราฟยอดขาย
function updateSalesChart(salesByDate) {
    const dates = Object.keys(salesByDate);
    const salesData = Object.values(salesByDate);
    
    createSalesChart(dates, salesData);
}

// สร้างกราฟยอดขาย
function createSalesChart(labels, data) {
    const ctx = document.getElementById('salesChart').getContext('2d');
    
    // ทำลายกราฟเก่าถ้ามี
    if (salesChart) {
        salesChart.destroy();
    }
    
    salesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'ยอดขาย (บาท)',
                data: data,
                borderColor: '#0d6efd',
                backgroundColor: 'rgba(13, 110, 253, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#0d6efd',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '฿' + value.toLocaleString();
                        }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

// อัปเดตสินค้าขายดี
function updateTopProducts(productSales) {
    const topProductsContainer = document.getElementById('topProducts');
    
    // เรียงลำดับสินค้าตามยอดขาย
    const sortedProducts = Object.entries(productSales)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);
    
    if (sortedProducts.length === 0) {
        topProductsContainer.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-star"></i>
                <h5>ไม่มีข้อมูลยอดขาย</h5>
                <p>เริ่มต้นการขายสินค้าเพื่อดูสถิติ</p>
            </div>
        `;
        return;
    }
    
    const productsHTML = sortedProducts.map((product, index) => {
        const [name, sales] = product;
        const rankClass = index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : '';
        
        return `
            <div class="top-product-item">
                <div class="product-rank ${rankClass}">${index + 1}</div>
                <div class="product-info">
                    <div class="product-name">${name}</div>
                    <div class="product-sales">ยอดขาย: <span class="product-amount">฿${sales.toLocaleString()}</span></div>
                </div>
            </div>
        `;
    }).join('');
    
    topProductsContainer.innerHTML = productsHTML;
}

// อัปเดตการแจ้งเตือน
function updateNotifications(products, transactions) {
    const notificationsContainer = document.getElementById('notifications');
    const notifications = [];
    
    // ตรวจสอบสินค้าใกล้หมด
    products.forEach(product => {
        if (product.stock <= (product.minStock || 10) && product.stock > 0) {
            notifications.push({
                type: 'warning',
                title: 'สินค้าใกล้หมด',
                message: `${product.name} เหลือ ${product.stock} ${product.unit || 'ชิ้น'}`,
                time: 'เมื่อสักครู่'
            });
        } else if (product.stock <= 0) {
            notifications.push({
                type: 'danger',
                title: 'สินค้าหมด',
                message: `${product.name} หมดสต็อกแล้ว`,
                time: 'เมื่อสักครู่'
            });
        }
    });
    
    // ตรวจสอบธุรกรรมล่าสุด
    const recentTransactions = transactions
        .filter(t => t.date)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 3);
    
    recentTransactions.forEach(transaction => {
        if (transaction.type === 'sell') {
            notifications.push({
                type: 'success',
                title: 'ขายสินค้า',
                message: `ขาย ${transaction.productName || 'สินค้า'} จำนวน ${transaction.quantity || 1} ${transaction.unit || 'ชิ้น'}`,
                time: formatTimeAgo(new Date(transaction.date))
            });
        }
    });
    
    if (notifications.length === 0) {
        notificationsContainer.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-bell"></i>
                <h5>ไม่มีการแจ้งเตือน</h5>
                <p>ทุกอย่างเป็นไปตามปกติ</p>
            </div>
        `;
        return;
    }
    
    const notificationsHTML = notifications.slice(0, 5).map(notification => `
        <div class="notification-item">
            <div class="notification-icon ${notification.type}">
                <i class="bi bi-${notification.type === 'warning' ? 'exclamation-triangle' : 
                                  notification.type === 'danger' ? 'x-circle' : 
                                  notification.type === 'success' ? 'check-circle' : 'info-circle'}"></i>
            </div>
            <div class="notification-content">
                <div class="notification-title">${notification.title}</div>
                <div class="notification-message">${notification.message}</div>
                <div class="notification-time">${notification.time}</div>
            </div>
        </div>
    `).join('');
    
    notificationsContainer.innerHTML = notificationsHTML;
}

// อัปเดตธุรกรรมล่าสุด
function updateRecentTransactions(transactions) {
    const recentTransactionsContainer = document.getElementById('recentTransactions');
    
    const recentTransactions = transactions
        .filter(t => t.date)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);
    
    if (recentTransactions.length === 0) {
        recentTransactionsContainer.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-clock-history"></i>
                <h5>ไม่มีธุรกรรม</h5>
                <p>เริ่มต้นธุรกรรมเพื่อดูประวัติ</p>
            </div>
        `;
        return;
    }
    
    const transactionsHTML = recentTransactions.map(transaction => {
        const isSell = transaction.type === 'sell';
        const iconClass = isSell ? 'bi-arrow-up-circle' : 'bi-arrow-down-circle';
        const typeClass = isSell ? 'sell' : 'buy';
        const typeText = isSell ? 'ขาย' : 'ซื้อ';
        
        return `
            <div class="transaction-item">
                <div class="transaction-icon ${typeClass}">
                    <i class="bi ${iconClass}"></i>
                </div>
                <div class="transaction-content">
                    <div class="transaction-title">${typeText} ${transaction.productName || 'สินค้า'}</div>
                    <div class="transaction-details">จำนวน: ${transaction.quantity || 1} ${transaction.unit || 'ชิ้น'}</div>
                    <div class="transaction-time">${formatTimeAgo(new Date(transaction.date))}</div>
                </div>
                <div class="transaction-amount ${typeClass}">
                    ${isSell ? '+' : '-'}฿${(transaction.total || 0).toLocaleString()}
                </div>
            </div>
        `;
    }).join('');
    
    recentTransactionsContainer.innerHTML = transactionsHTML;
}

// ฟังก์ชันช่วยเหลือ
function formatTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
        return 'เมื่อสักครู่';
    } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} นาทีที่แล้ว`;
    } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} ชั่วโมงที่แล้ว`;
    } else {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days} วันที่แล้ว`;
    }
}

function formatCurrency(amount) {
    return '฿' + amount.toLocaleString();
}

function formatDate(date) {
    return date.toLocaleDateString('th-TH', { 
        month: 'short', 
        day: 'numeric' 
    });
}

function showLoadingState(isLoading) {
    const mainContent = document.querySelector('.main-content');
    if (isLoading) {
        mainContent.classList.add('loading');
    } else {
        mainContent.classList.remove('loading');
    }
}

// ฟังก์ชัน showError ถูก import จาก error-handler.js แล้ว

// ฟังก์ชันออกจากระบบ
async function logout() {
    try {
        // ตรวจสอบว่า auth พร้อมใช้งานหรือไม่
        if (!auth) {
            showError('เกิดข้อผิดพลาดในการออกจากระบบ');
            return;
        }
        
        // ออกจากระบบ
        await auth.signOut();
        
        // ล้างข้อมูลใน localStorage (ถ้ามี)
        try {
            localStorage.removeItem('user_session');
            localStorage.removeItem('app_errors');
            localStorage.removeItem('performance_metrics');
        } catch (e) {
            // เงียบๆ
        }
        
        // ไปหน้า login
        window.location.href = '../index.html';
        
    } catch (error) {
        showError('เกิดข้อผิดพลาดในการออกจากระบบ');
    }
}

// ฟังก์ชันช่วยเหลือสำหรับตรวจสอบ event listeners
function getEventListeners(element) {
    try {
        // ตรวจสอบ onclick attribute
        const onclick = element.onclick;
        
        // ตรวจสอบ event listeners ที่เพิ่มผ่าน addEventListener
        const hasClickListeners = element._clickListeners || 
                                 element._listeners || 
                                 element._eventListeners;
        
        return {
            onclick: onclick,
            hasClickListeners: !!hasClickListeners,
            elementType: element.tagName,
            elementId: element.id,
            elementClass: element.className
        };
    } catch (error) {
        return {
            error: error.message,
            elementType: element.tagName,
            elementId: element.id
        };
    }
}
