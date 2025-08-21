// Reports Page JavaScript - JavaScript สำหรับหน้ารายงาน

// Import Firebase modules จาก window object
const { auth, db } = window.firebase;
import {
    collection,
    getDocs,
    query,
    where,
    orderBy,
    limit
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// Global variables - ตัวแปรทั่วโลก
let currentUser = null;
let charts = {};

// DOM Elements - องค์ประกอบ DOM
const logoutBtn = document.getElementById('logoutBtn');
const userEmail = document.getElementById('userEmail');

// Initialize Reports Page - เริ่มต้นหน้ารายงาน
document.addEventListener('DOMContentLoaded', function() {
    // console.log('กำลังโหลดหน้ารายงาน...');
    checkAuthentication();
    initializeEventListeners();
    
    // เพิ่มปุ่มทดสอบข้อมูล (เฉพาะในโหมดพัฒนา) - ปิดใช้งานแล้ว
    // if (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') {
    //     addTestDataButton();
    // }
});

// Add Test Data Button - เพิ่มปุ่มทดสอบข้อมูล (ปิดใช้งานแล้ว)
// function addTestDataButton() {
//     const container = document.querySelector('.container-fluid');
//     if (container) {
//         const testButton = document.createElement('button');
//         testButton.className = 'btn btn-warning mb-3';
//         testButton.innerHTML = '🧪 สร้างข้อมูลทดสอบ';
//         testButton.onclick = createTestData;
//         container.insertBefore(testButton, container.firstChild);
//     }
// }

// Create Test Data - สร้างข้อมูลทดสอบ (ปิดใช้งานแล้ว)
// async function createTestData() {
//     // console.log('🧪 เริ่มสร้างข้อมูลทดสอบ...');
//     
//     try {
//         // สร้างข้อมูลสินค้า
//         const testProducts = [
//             { name: 'กุ้งกุลาดำ', category: 'กุ้ง', buyPrice: 180, sellPrice: 220 },
//             { name: 'หอยแมลงภู่', category: 'หอย', buyPrice: 80, sellPrice: 120 },
//             { name: 'ปูม้า', category: 'ปู', buyPrice: 150, sellPrice: 200 },
//             { name: 'ปลาทูน่า', category: 'ปลา', buyPrice: 120, sellPrice: 180 },
//             { name: 'กุ้งขาว', category: 'กุ้ง', buyPrice: 160, sellPrice: 200 },
//             { name: 'หอยนางรม', category: 'หอย', buyPrice: 200, sellPrice: 280 },
//             { name: 'ปลาแซลมอน', category: 'ปลา', buyPrice: 300, sellPrice: 400 },
//             { name: 'ปูทะเล', category: 'ปู', buyPrice: 250, sellPrice: 320 }
//         ];
//         
//         // สร้างข้อมูลธุรกรรม
//         const testTransactions = [
//             { type: 'sell', productName: 'กุ้งกุลาดำ', total: 1100, date: '2024-01-15' },
//             { type: 'sell', productName: 'หอยแมลงภู่', total: 1800, date: '2024-01-15' },
//             { type: 'sell', productName: 'ปูม้า', total: 1600, date: '2024-01-15' },
//             { type: 'sell', productName: 'ปลาทูน่า', total: 2160, date: '2024-01-15' },
//             { type: 'sell', productName: 'กุ้งขาว', total: 3600, date: '2024-01-14' },
//             { type: 'sell', productName: 'หอยนางรม', total: 1680, date: '2024-01-14' },
//             { type: 'sell', productName: 'ปลาแซลมอน', total: 1600, date: '2024-01-13' },
//             { type: 'sell', productName: 'ปูทะเล', total: 960, date: '2024-01-13' }
//         ];
//         
//         // เพิ่มข้อมูลสินค้า
//         for (const product of testProducts) {
//             await addDoc(collection(db, 'products'), {
//                 ...product,
//                 stock: Math.floor(Math.random() * 100) + 20,
//                 unit: 'กิโลกรัม',
//                 supplier: 'พ่อค้าคนกลาง',
//                 description: `${product.name} สดจากทะเล`,
//                 createdAt: new Date(),
//                 updatedAt: new Date()
//             });
//         }
//         
//         // เพิ่มข้อมูลธุรกรรม
//         for (const transaction of testTransactions) {
//             await addDoc(collection(db, 'transactions'), {
//                 ...transaction,
//                 quantity: Math.floor(Math.random() * 10) + 1,
//                 price: Math.floor(Math.random() * 100) + 100,
//                 customerSupplier: 'ลูกค้าทดสอบ',
//                 notes: `ข้อมูลทดสอบ - ${transaction.productName}`,
//                 createdAt: new Date(),
//                 updatedAt: new Date()
//             });
//         }
//         
//         // console.log('✅ สร้างข้อมูลทดสอบเสร็จแล้ว');
//         alert('สร้างข้อมูลทดสอบเสร็จแล้ว! กรุณารีเฟรชหน้าเพื่อดูผลลัพธ์');
//         
//     } catch (error) {
//         console.error('❌ ข้อผิดพลาดในการสร้างข้อมูลทดสอบ:', error);
//         alert('เกิดข้อผิดพลาดในการสร้างข้อมูลทดสอบ');
//     }
// }

// Check Authentication - ตรวจสอบการยืนยันตัวตน
function checkAuthentication() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // console.log('ผู้ใช้เข้าสู่ระบบ:', user.email);
            currentUser = user;
            userEmail.textContent = user.email;
            loadReportsData();
        } else {
            // console.log('ผู้ใช้ไม่ได้เข้าสู่ระบบ');
            window.location.href = '../index.html';
        }
    });
}

// Initialize Event Listeners - เริ่มต้นการฟังเหตุการณ์
function initializeEventListeners() {
    // Logout Button - ปุ่มออกจากระบบ
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}

// Load Reports Data - โหลดข้อมูลรายงาน
async function loadReportsData() {
    // console.log('🚀 กำลังโหลดข้อมูลรายงาน...');
    
    try {
        // โหลดข้อมูลสินค้าและธุรกรรมพร้อมกัน
        const [productsSnapshot, transactionsSnapshot] = await Promise.all([
            getDocs(collection(db, 'products')),
            getDocs(collection(db, 'transactions'))
        ]);
        
        // console.log('📦 ข้อมูลสินค้าจาก Firestore:', productsSnapshot.size, 'รายการ');
        // console.log('💳 ข้อมูลธุรกรรมจาก Firestore:', transactionsSnapshot.size, 'รายการ');
        
        // ประมวลผลข้อมูลสินค้า
        const products = [];
        productsSnapshot.forEach((doc) => {
            const productData = {
                id: doc.id,
                ...doc.data()
            };
            products.push(productData);
            // console.log(`📋 สินค้า: ${productData.name} (หมวดหมู่: ${productData.category})`);
        });
        
        // ประมวลผลข้อมูลธุรกรรม
        const transactions = [];
        transactionsSnapshot.forEach((doc) => {
            const transactionData = {
                id: doc.id,
                ...doc.data()
            };
            transactions.push(transactionData);
            // console.log(`💳 ธุรกรรม: ${transactionData.productName} (ประเภท: ${transactionData.type}, ยอด: ${transactionData.total})`);
        });
        
        // console.log('✅ ข้อมูลสินค้าและธุรกรรมโหลดเสร็จแล้ว');
        
        // อัปเดตสถิติและสร้างรายงานพร้อมกัน
        updateStatisticsCards(products);
        generateMonthlySalesChart(transactions);
        await generateCategoryPieChart(transactions);
        generateProfitLossChart(transactions);
        generateTopProductsChart(transactions);
        
        // console.log('🎉 โหลดข้อมูลรายงานเสร็จแล้ว');
        
    } catch (error) {
        console.error('❌ ข้อผิดพลาดในการโหลดข้อมูลรายงาน:', error);
        showAlert('เกิดข้อผิดพลาดในการโหลดข้อมูลรายงาน', 'danger');
    }
}

// Update Statistics Cards - อัปเดตการ์ดสถิติ
function updateStatisticsCards(products) {
    const totalProducts = products.length;
    const inStockProducts = products.filter(product => product.stock > 10).length;
    const lowStockProducts = products.filter(product => product.stock > 0 && product.stock <= 10).length;
    const outOfStockProducts = products.filter(product => product.stock === 0).length;
    
    // Update DOM elements
    const totalProductsEl = document.getElementById('totalProducts');
    const inStockProductsEl = document.getElementById('inStockProducts');
    const lowStockProductsEl = document.getElementById('lowStockProducts');
    const outOfStockProductsEl = document.getElementById('outOfStockProducts');
    
    if (totalProductsEl) totalProductsEl.textContent = totalProducts;
    if (inStockProductsEl) inStockProductsEl.textContent = inStockProducts;
    if (lowStockProductsEl) lowStockProductsEl.textContent = lowStockProducts;
    if (outOfStockProductsEl) outOfStockProductsEl.textContent = outOfStockProducts;
}



// Handle Logout - จัดการการออกจากระบบ
async function handleLogout() {
    try {
        await signOut(auth);
        window.location.href = '../index.html';
    } catch (error) {
        console.error('ข้อผิดพลาดในการออกจากระบบ:', error);
        showAlert('เกิดข้อผิดพลาดในการออกจากระบบ', 'danger');
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
    
    // Insert at the top of the main content
    const mainContent = document.querySelector('.content-wrapper');
    if (mainContent) {
        mainContent.insertBefore(alertDiv, mainContent.firstChild);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }
}

// Generate Monthly Sales Chart - สร้างกราฟยอดขายรายเดือน
function generateMonthlySalesChart(transactions) {
    const ctx = document.getElementById('monthlySalesChart');
    if (!ctx) return;
    
    // Process data for monthly sales
    const monthlyData = processMonthlyData(transactions);
    
    if (charts.monthlySales) {
        charts.monthlySales.destroy();
    }
    
    charts.monthlySales = new Chart(ctx, {
        type: 'line',
        data: {
            labels: monthlyData.labels,
            datasets: [{
                label: 'ยอดขาย (บาท)',
                data: monthlyData.sales,
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'ยอดขายรายเดือน'
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
            }
        }
    });
}

// Generate Category Pie Chart - สร้างกราฟวงกลมหมวดหมู่
async function generateCategoryPieChart(transactions) {
    const ctx = document.getElementById('categoryPieChart');
    if (!ctx) return;
    
    // Process data for category sales
    const categoryData = await processCategoryData(transactions);
    
    if (charts.categoryPie) {
        charts.categoryPie.destroy();
    }
    
    // สีที่สื่อความหมายสำหรับแต่ละหมวดหมู่
    const categoryColors = {
        'ปลา': '#4BC0C0',      // สีเขียวน้ำเงิน - สดใหม่
        'กุ้ง': '#FF6384',     // สีชมพู - สดใส
        'ปู': '#FFCE56',       // สีเหลือง - ร้อนแรง
        'หอย': '#36A2EB',      // สีฟ้า - ธรรมชาติ
        'ปลาหมึก': '#9966FF',  // สีม่วง - ลึกลับ
        'อื่นๆ': '#FF9F40'     // สีส้ม - หลากหลาย
    };
    
    // สร้างสีสำหรับแต่ละหมวดหมู่
    const backgroundColor = categoryData.labels.map(label => {
        if (label === 'ไม่มีข้อมูล') {
            return '#C9CBCF'; // สีเทาสำหรับไม่มีข้อมูล
        }
        return categoryColors[label] || '#C9CBCF'; // สีเทาเป็นค่าเริ่มต้น
    });
    
    charts.categoryPie = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: categoryData.labels,
            datasets: [{
                data: categoryData.values,
                backgroundColor: backgroundColor,
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        font: {
                            size: 12
                        }
                    }
                },
                title: {
                    display: true,
                    text: 'สัดส่วนการขายตามหมวดหมู่',
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed;
                            
                            if (label === 'ไม่มีข้อมูล') {
                                return 'ยังไม่มีข้อมูลการขาย';
                            }
                            
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ฿${value.toLocaleString()} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Generate Profit Loss Chart - สร้างกราฟกำไร-ขาดทุน
function generateProfitLossChart(transactions) {
    const ctx = document.getElementById('profitLossChart');
    if (!ctx) return;
    
    // Process data for profit/loss
    const profitLossData = processProfitLossData(transactions);
    
    if (charts.profitLoss) {
        charts.profitLoss.destroy();
    }
    
    charts.profitLoss = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: profitLossData.labels,
            datasets: [{
                label: 'กำไร (บาท)',
                data: profitLossData.profits,
                backgroundColor: 'rgba(75, 192, 192, 0.8)',
                borderColor: 'rgb(75, 192, 192)',
                borderWidth: 1
            }, {
                label: 'ขาดทุน (บาท)',
                data: profitLossData.losses,
                backgroundColor: 'rgba(255, 99, 132, 0.8)',
                borderColor: 'rgb(255, 99, 132)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'กำไร-ขาดทุนรายเดือน'
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
            }
        }
    });
}

// Generate Top Products Chart - สร้างกราฟสินค้าขายดี
function generateTopProductsChart(transactions) {
    const ctx = document.getElementById('topProductsChart');
    if (!ctx) return;
    
    // Process data for top products
    const topProductsData = processTopProductsData(transactions);
    
    if (charts.topProducts) {
        charts.topProducts.destroy();
    }
    
    charts.topProducts = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: topProductsData.labels,
            datasets: [{
                data: topProductsData.values,
                backgroundColor: [
                    '#FF6384',
                    '#36A2EB',
                    '#FFCE56',
                    '#4BC0C0',
                    '#9966FF'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                },
                title: {
                    display: true,
                    text: 'สินค้าขายดี'
                }
            }
        }
    });
}

// Process Monthly Data - ประมวลผลข้อมูลรายเดือน
function processMonthlyData(transactions) {
    const monthlySales = {};
    
    transactions.forEach(transaction => {
        if (transaction.type === 'sell') {
            const date = new Date(transaction.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!monthlySales[monthKey]) {
                monthlySales[monthKey] = 0;
            }
            monthlySales[monthKey] += transaction.total || 0;
        }
    });
    
    const labels = Object.keys(monthlySales).sort();
    const sales = labels.map(key => monthlySales[key]);
    
    return { labels, sales };
}

// Process Category Data - ประมวลผลข้อมูลหมวดหมู่
async function processCategoryData(transactions) {
    const categorySales = {};
    
    try {
        // console.log('🔍 เริ่มประมวลผลข้อมูลหมวดหมู่...');
        // console.log('📊 จำนวนธุรกรรมที่ได้รับ:', transactions.length);
        
        // ดึงข้อมูลสินค้าจาก Firestore เพื่อสร้าง mapping
        const productsSnapshot = await getDocs(collection(db, 'products'));
        const productCategoryMap = {};
        
        // console.log('📦 จำนวนสินค้าจาก Firestore:', productsSnapshot.size);
        
        productsSnapshot.forEach(doc => {
            const product = doc.data();
            productCategoryMap[product.name] = product.category;
            // console.log(`📋 สินค้า: ${product.name} -> หมวดหมู่: ${product.category}`);
        });
        
        // console.log('🗂️ Product Category Map:', productCategoryMap);
        
        // ใช้การจำแนกหมวดหมู่แบบผสมผสาน
        transactions.forEach((transaction, index) => {
            if (transaction.type === 'sell' && transaction.productName) {
                let category = 'อื่นๆ';
                
                // console.log(`🔄 ประมวลผลธุรกรรมที่ ${index + 1}: ${transaction.productName}`);
                
                // ลองหาจาก mapping ก่อน
                if (productCategoryMap[transaction.productName]) {
                    category = productCategoryMap[transaction.productName];
                    // console.log(`✅ พบใน mapping: ${transaction.productName} -> ${category}`);
                } else {
                    // ถ้าไม่มีใน mapping ให้จำแนกจากชื่อสินค้า
                    const productName = transaction.productName.toLowerCase();
                    // console.log(`🔍 ไม่พบใน mapping, ใช้ keyword matching: ${productName}`);
                    
                    if (productName.includes('กุ้ง')) category = 'กุ้ง';
                    else if (productName.includes('ปลา')) category = 'ปลา';
                    else if (productName.includes('ปู')) category = 'ปู';
                    else if (productName.includes('หอย')) category = 'หอย';
                    else if (productName.includes('ปลาหมึก')) category = 'ปลาหมึก';
                    
                    // console.log(`🏷️ ผลการจำแนก: ${category}`);
                }
                
                if (!categorySales[category]) {
                    categorySales[category] = 0;
                }
                categorySales[category] += transaction.total || 0;
                
                // console.log(`💰 เพิ่มยอดขาย: ${category} += ${transaction.total || 0}`);
            }
        });
        
        // console.log('📈 ผลลัพธ์การประมวลผลหมวดหมู่:', categorySales);
        
        // ถ้าไม่มีข้อมูล ให้แสดงข้อความว่าไม่มีข้อมูล
        if (Object.keys(categorySales).length === 0) {
            // console.log('⚠️ ไม่มีข้อมูลการขาย');
            return {
                labels: ['ไม่มีข้อมูล'],
                values: [1]
            };
        }
        
        const labels = Object.keys(categorySales);
        const values = Object.values(categorySales);
        
        // console.log('🎯 ส่งคืนข้อมูลกราฟ:', { labels, values });
        
        return { labels, values };
        
    } catch (error) {
        console.error('❌ ข้อผิดพลาดในการประมวลผลข้อมูลหมวดหมู่:', error);
        return {
            labels: ['ไม่มีข้อมูล'],
            values: [1]
        };
    }
}

// Process Profit Loss Data - ประมวลผลข้อมูลกำไร-ขาดทุน
function processProfitLossData(transactions) {
    const monthlyProfitLoss = {};
    
    transactions.forEach(transaction => {
        const date = new Date(transaction.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyProfitLoss[monthKey]) {
            monthlyProfitLoss[monthKey] = { profit: 0, loss: 0 };
        }
        
        if (transaction.type === 'sell') {
            monthlyProfitLoss[monthKey].profit += transaction.total || 0;
        } else if (transaction.type === 'buy') {
            monthlyProfitLoss[monthKey].loss += transaction.total || 0;
        }
    });
    
    const labels = Object.keys(monthlyProfitLoss).sort();
    const profits = labels.map(key => monthlyProfitLoss[key].profit);
    const losses = labels.map(key => monthlyProfitLoss[key].loss);
    
    return { labels, profits, losses };
}

// Process Top Products Data - ประมวลผลข้อมูลสินค้าขายดี
function processTopProductsData(transactions) {
    const productSales = {};
    
    transactions.forEach(transaction => {
        if (transaction.type === 'sell' && transaction.productName) {
            if (!productSales[transaction.productName]) {
                productSales[transaction.productName] = 0;
            }
            productSales[transaction.productName] += transaction.quantity || 0;
        }
    });
    
    // Sort by sales quantity and get top 5
    const sortedProducts = Object.entries(productSales)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);
    
    const labels = sortedProducts.map(([name]) => name);
    const values = sortedProducts.map(([, quantity]) => quantity);
    
    return { labels, values };
}

// Export Report - ส่งออกรายงาน
function exportReport() {
    // Implementation for report export
    showAlert('ฟีเจอร์ส่งออกรายงานจะเปิดใช้งานเร็วๆ นี้', 'info');
}



// Make functions globally available - ทำให้ฟังก์ชันใช้งานได้ทั่วโลก
window.exportReport = exportReport;
