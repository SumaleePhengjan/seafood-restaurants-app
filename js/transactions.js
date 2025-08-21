// Transactions Page JavaScript - JavaScript สำหรับหน้ารายรับ/รายจ่าย

// Import Firebase modules จาก window object
const { auth, db } = window.firebase;
import {
    collection,
    doc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    onSnapshot
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// Global variables - ตัวแปรทั่วโลก
let currentUser = null;
let transactionsData = [];
let productsData = [];
let transactionsTable = null;

// DOM Elements - องค์ประกอบ DOM
const addTransactionForm = document.getElementById('addTransactionForm');
const editTransactionForm = document.getElementById('editTransactionForm');
const logoutBtn = document.getElementById('logoutBtn');
const userEmail = document.getElementById('userEmail');

// Initialize Transactions Page - เริ่มต้นหน้ารายรับ/รายจ่าย
document.addEventListener('DOMContentLoaded', function() {
    // รอให้ jQuery และ DataTable โหลดเสร็จ
    if (typeof $ !== 'undefined' && $.fn.DataTable) {
        initializePage();
    } else {
        // รอสักครู่แล้วลองใหม่
        setTimeout(() => {
            if (typeof $ !== 'undefined' && $.fn.DataTable) {
                initializePage();
            } else {
                showAlert('เกิดข้อผิดพลาดในการโหลดไลบรารีที่จำเป็น', 'danger');
            }
        }, 1000);
    }
});

// Initialize Page - เริ่มต้นหน้า
function initializePage() {
    // รอให้ Firebase และ DataTables Responsive โหลดเสร็จ
    if (window.firebase && window.firebase.auth && window.firebase.db) {
        checkAuthentication();
        initializeEventListeners();
        initializeDataTable();
    } else {
        // รอสักครู่แล้วลองใหม่
        setTimeout(() => {
            if (window.firebase && window.firebase.auth && window.firebase.db) {
                checkAuthentication();
                initializeEventListeners();
                initializeDataTable();
            } else {
                showAlert('เกิดข้อผิดพลาดในการโหลด Firebase', 'danger');
            }
        }, 1000);
    }
}

// Check Authentication - ตรวจสอบการยืนยันตัวตน
function checkAuthentication() {
    try {
        // ตรวจสอบว่า Firebase พร้อมใช้งานหรือไม่
        if (!auth || !db) {
            console.error('Firebase ยังไม่ได้เริ่มต้น');
            showAlert('เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล', 'danger');
            return;
        }
        
        // Firebase Auth และ Firestore พร้อมใช้งาน
        
        onAuthStateChanged(auth, (user) => {
            if (user) {
                currentUser = user;
                userEmail.textContent = user.email;
                loadTransactionsData(); // โหลดข้อมูลทั้งหมดในครั้งเดียว
            } else {
                window.location.href = '../index.html';
            }
        });
    } catch (error) {
        console.error('ข้อผิดพลาดในการตรวจสอบการยืนยันตัวตน:', error);
        showAlert('เกิดข้อผิดพลาดในการตรวจสอบการเข้าสู่ระบบ', 'danger');
    }
}

// Initialize Event Listeners - เริ่มต้นการฟังเหตุการณ์
function initializeEventListeners() {
    try {
        // กำลังเริ่มต้น Event Listeners...
        
        // Add Transaction Form - ฟอร์มเพิ่มธุรกรรม
        if (addTransactionForm) {
            addTransactionForm.addEventListener('submit', handleAddTransaction);
        }

        // Edit Transaction Form - ฟอร์มแก้ไขธุรกรรม
        if (editTransactionForm) {
            editTransactionForm.addEventListener('submit', handleEditTransaction);
        }

        // Logout Button - ปุ่มออกจากระบบ
        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
        }

        // Modal events - เหตุการณ์โมดอล
        const addModal = document.getElementById('addTransactionModal');
        if (addModal) {
            addModal.addEventListener('show.bs.modal', function(event) {
                try {
                    const button = event.relatedTarget;
                    const transactionType = button.getAttribute('data-transaction-type');
                    const transactionTypeInput = document.getElementById('transactionType');
                    const modalTitle = document.getElementById('modalTitle');
                    
                    if (transactionTypeInput) {
                        transactionTypeInput.value = transactionType;
                    }
                    if (modalTitle) {
                        modalTitle.textContent = transactionType === 'sell' ? 'เพิ่มรายรับ' : 'เพิ่มรายจ่าย';
                    }
                } catch (error) {
                    console.error('ข้อผิดพลาดในการจัดการ modal show event:', error);
                }
            });

            addModal.addEventListener('hidden.bs.modal', () => {
                try {
                    if (addTransactionForm) {
                        addTransactionForm.reset();
                    }
                } catch (error) {
                    console.error('ข้อผิดพลาดในการจัดการ modal hidden event:', error);
                }
            });
            // event listeners สำหรับ modal เพิ่มธุรกรรม
        } else {
            console.warn('ไม่พบ modal เพิ่มธุรกรรม');
        }

        const editModal = document.getElementById('editTransactionModal');
        if (editModal) {
            editModal.addEventListener('hidden.bs.modal', () => {
                try {
                    if (editTransactionForm) {
                        editTransactionForm.reset();
                    }
                } catch (error) {
                    console.error('ข้อผิดพลาดในการจัดการ modal hidden event:', error);
                }
            });
            // event listeners สำหรับ modal แก้ไขธุรกรรม
        } else {
            console.warn('ไม่พบ modal แก้ไขธุรกรรม');
        }

        // Auto-calculate total - คำนวณยอดรวมอัตโนมัติ
        const quantityInput = document.getElementById('quantity');
        const priceInput = document.getElementById('price');
        const totalInput = document.getElementById('total');

        if (quantityInput && priceInput && totalInput) {
            [quantityInput, priceInput].forEach(input => {
                input.addEventListener('input', calculateTotal);
            });
            // event listeners สำหรับคำนวณยอดรวมอัตโนมัติ
        } else {
            console.warn('ไม่พบ input elements สำหรับคำนวณยอดรวม');
        }

        // Edit form auto-calculate - คำนวณยอดรวมอัตโนมัติในฟอร์มแก้ไข
        const editQuantityInput = document.getElementById('editQuantity');
        const editPriceInput = document.getElementById('editPrice');
        const editTotalInput = document.getElementById('editTotal');

        if (editQuantityInput && editPriceInput && editTotalInput) {
            [editQuantityInput, editPriceInput].forEach(input => {
                input.addEventListener('input', calculateEditTotal);
            });
            // event listeners สำหรับคำนวณยอดรวมอัตโนมัติในฟอร์มแก้ไข
        } else {
            console.warn('ไม่พบ input elements สำหรับคำนวณยอดรวมในฟอร์มแก้ไข');
        }
        
        // เริ่มต้น Event Listeners เสร็จแล้ว
        
    } catch (error) {
        console.error('ข้อผิดพลาดในการเริ่มต้น Event Listeners:', error);
    }
}

// Initialize DataTable - เริ่มต้น DataTable
function initializeDataTable() {
    try {
        if ($.fn.DataTable) {
            // กำลังเริ่มต้น DataTable...
            
            // ตรวจสอบ DataTables Responsive extension
            if (typeof $.fn.dataTable !== 'undefined' && $.fn.dataTable.Responsive) {
            } else {
                console.warn('DataTables Responsive extension ไม่พร้อมใช้งาน - ใช้การตั้งค่า responsive แบบพื้นฐาน');
            }
            
            // ตรวจสอบว่าตารางมีอยู่หรือไม่
            const tableElement = document.getElementById('transactionsTable');
            if (!tableElement) {
                console.error('ไม่พบตาราง transactionsTable');
                return;
            }
            
            // ตั้งค่า responsive ตาม extension ที่มี
            let responsiveConfig = true;
            if (typeof $.fn.dataTable !== 'undefined' && $.fn.dataTable.Responsive) {
                try {
                    responsiveConfig = {
                        details: {
                            display: $.fn.dataTable.Responsive.display.modal({
                                header: function (row) {
                                    var data = row.data();
                                    return 'รายละเอียดธุรกรรม: ' + data[2];
                                }
                            }),
                            renderer: $.fn.dataTable.Responsive.renderer.tableAll()
                        }
                    };
                    // ใช้ DataTables Responsive extension แบบเต็มรูปแบบ
                } catch (error) {
                    console.warn('ไม่สามารถตั้งค่า DataTables Responsive extension ได้:', error);
                    responsiveConfig = true;
                }
            } else {
                // ใช้การตั้งค่า responsive แบบพื้นฐาน
            }

            transactionsTable = $('#transactionsTable').DataTable({
                language: {
                    url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/th.json'
                },
                responsive: responsiveConfig,
                order: [[0, 'desc']],
                pageLength: 10,
                lengthMenu: [[10, 25, 50, -1], [10, 25, 50, "ทั้งหมด"]],
                columnDefs: [
                    { orderable: false, targets: -1 } // Disable sorting for action column
                ]
            });
            
            // DataTable เริ่มต้นสำเร็จ
        } else {
            console.error('DataTable library ไม่พร้อมใช้งาน');
        }
    } catch (error) {
        console.error('ข้อผิดพลาดในการเริ่มต้น DataTable:', error);
    }
}

// Load Transactions Data - โหลดข้อมูลธุรกรรม
async function loadTransactionsData() {
    try {
        // กำลังโหลดข้อมูลธุรกรรม...
        
        // ดึงข้อมูลธุรกรรมและสินค้าพร้อมกัน
        const [transactionsSnapshot, productsSnapshot] = await Promise.all([
            getDocs(collection(db, 'transactions')),
            getDocs(collection(db, 'products'))
        ]);
        
        // ประมวลผลข้อมูลธุรกรรม
        transactionsData = [];
        transactionsSnapshot.forEach((doc) => {
            transactionsData.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        // เรียงลำดับตามวันที่ล่าสุด
        transactionsData.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // ประมวลผลข้อมูลสินค้า
        productsData = [];
        const uniqueProductNames = new Set();
        
        productsSnapshot.forEach((doc) => {
            const productData = doc.data();
            // ตรวจสอบว่าชื่อสินค้าไม่ซ้ำ
            if (productData.name && !uniqueProductNames.has(productData.name)) {
                uniqueProductNames.add(productData.name);
                productsData.push({
                    id: doc.id,
                    ...productData
                });
            }
        });
        
        // อัปเดต UI ทั้งหมดพร้อมกัน
        updateTransactionsTable();
        updateStatistics();
        updateProductSelect();
        
        // console.log('โหลดข้อมูลธุรกรรมเสร็จแล้ว');
        
        // ตั้งค่า real-time listener สำหรับธุรกรรม
        // console.log('กำลังตั้งค่า real-time listener...');
        setupTransactionsListener();
        
        // ตรวจสอบว่า real-time listener ถูกตั้งค่าหรือไม่
        setTimeout(() => {
            if (window.unsubscribeTransactions) {
                // console.log('✅ Real-time listener ถูกตั้งค่าสำเร็จ');
            } else {
                console.warn('❌ Real-time listener ไม่ได้ถูกตั้งค่า');
                showAlert('เกิดข้อผิดพลาดในการตั้งค่า real-time listener', 'warning');
            }
        }, 1000);
        
    } catch (error) {
        console.error('ข้อผิดพลาดในการโหลดข้อมูลธุรกรรม:', error);
        showAlert('เกิดข้อผิดพลาดในการโหลดข้อมูล', 'danger');
    }
}

// Setup Real-time Listener - ตั้งค่า real-time listener
function setupTransactionsListener() {
    try {
        // console.log('กำลังตั้งค่า real-time listener...');
        
        // สร้าง query สำหรับเรียงลำดับตามวันที่ล่าสุด
        const transactionsQuery = query(
            collection(db, 'transactions'),
            orderBy('date', 'desc')
        );
        
        // ตั้งค่า real-time listener
        const unsubscribe = onSnapshot(transactionsQuery, (snapshot) => {
            // console.log('ข้อมูลธุรกรรมมีการเปลี่ยนแปลง - จำนวนเอกสาร:', snapshot.size);
            
            // อัปเดตข้อมูลในหน่วยความจำ
            transactionsData = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                transactionsData.push({
                    id: doc.id,
                    ...data
                });
                // console.log('เพิ่มข้อมูลธุรกรรม:', doc.id, data);
            });
            
            // console.log('อัปเดตข้อมูลในหน่วยความจำเสร็จแล้ว - จำนวน:', transactionsData.length);
            
            // อัปเดต UI
            updateTransactionsTable();
            updateStatistics();
            
        }, (error) => {
            console.error('ข้อผิดพลาดในการฟังการเปลี่ยนแปลงของธุรกรรม:', error);
            showAlert('เกิดข้อผิดพลาดในการอัปเดตข้อมูลแบบ real-time', 'danger');
        });
        
        // console.log('ตั้งค่า real-time listener สำเร็จ');
        
        // เก็บ unsubscribe function ไว้ใช้ตอนออกจากหน้า
        window.unsubscribeTransactions = unsubscribe;
        
    } catch (error) {
        console.error('ข้อผิดพลาดในการตั้งค่า real-time listener:', error);
        showAlert('เกิดข้อผิดพลาดในการตั้งค่า real-time listener', 'danger');
    }
}

// Load Products Data - โหลดข้อมูลสินค้า (ไม่ใช้แล้ว - รวมใน loadTransactionsData)
async function loadProductsData() {
    // ฟังก์ชันนี้ไม่ใช้แล้ว เพราะรวมการโหลดใน loadTransactionsData แล้ว
    // console.log('loadProductsData ไม่ใช้แล้ว - รวมการโหลดใน loadTransactionsData');
}

// Update Product Select - อัปเดตตัวเลือกสินค้า
function updateProductSelect() {
    try {
        const productSelect = document.getElementById('productName');
        if (!productSelect) {
            console.warn('ไม่พบ element productName');
            return;
        }
        
        productSelect.innerHTML = '<option value="">เลือกสินค้า</option>';
        
        // ใช้ Set เพื่อป้องกันการซ้ำ
        const uniqueProducts = new Set();
        
        productsData.forEach(product => {
            if (product && product.name && !uniqueProducts.has(product.name)) {
                uniqueProducts.add(product.name);
                const option = document.createElement('option');
                option.value = product.name;
                option.textContent = product.name; // แสดงเฉพาะชื่อสินค้า
                productSelect.appendChild(option);
            }
        });
        
        // console.log('อัปเดตตัวเลือกสินค้าเสร็จแล้ว:', uniqueProducts.size, 'รายการ');
        
    } catch (error) {
        console.error('ข้อผิดพลาดในการอัปเดตตัวเลือกสินค้า:', error);
    }
}

// Update Transactions Table - อัปเดตตารางธุรกรรม
function updateTransactionsTable() {
    try {
        if (!transactionsTable) {
            console.warn('DataTable ยังไม่ได้เริ่มต้น');
            return;
        }
        
        // console.log('กำลังอัปเดตตารางธุรกรรม...', transactionsData.length, 'รายการ');
        
        // ตรวจสอบข้อมูลก่อนอัปเดต
        if (transactionsData.length === 0) {
            // console.log('ไม่มีข้อมูลธุรกรรมที่จะแสดง');
        } else {
            // console.log('ข้อมูลธุรกรรมล่าสุด:', transactionsData[0]);
        }
        
        transactionsTable.clear();
        
        transactionsData.forEach((transaction, index) => {
            const typeBadge = getTypeBadge(transaction.type);
            const amountClass = transaction.type === 'sell' ? 'amount-positive' : 'amount-negative';
            const actionButtons = getActionButtons(transaction.id);
            
            const rowData = [
                formatDate(transaction.date),
                typeBadge,
                transaction.productName || '-',
                formatNumber(transaction.quantity),
                formatCurrency(transaction.price),
                `<span class="${amountClass}">${formatCurrency(transaction.total)}</span>`,
                transaction.customerSupplier || '-',
                transaction.notes || '-',
                actionButtons
            ];
            
            // เพิ่มแถวด้วย DataTables API
            const addedRow = transactionsTable.row.add(rowData);
            
            // เพิ่ม data-label attributes หลังจากเพิ่มแถว
            const rowNode = addedRow.node();
            if (rowNode) {
                const cells = rowNode.cells;
                if (cells.length >= 9) {
                    cells[0].setAttribute('data-label', 'วันที่');
                    cells[1].setAttribute('data-label', 'ประเภท');
                    cells[2].setAttribute('data-label', 'สินค้า');
                    cells[3].setAttribute('data-label', 'จำนวน');
                    cells[4].setAttribute('data-label', 'ราคาต่อหน่วย');
                    cells[5].setAttribute('data-label', 'ยอดรวม');
                    cells[6].setAttribute('data-label', 'ลูกค้า/ซัพพลายเออร์');
                    cells[7].setAttribute('data-label', 'หมายเหตุ');
                    cells[8].setAttribute('data-label', 'การจัดการ');
                }
            }
            
            // console.log(`เพิ่มแถวที่ ${index + 1}:`, transaction.productName, transaction.total);
        });
        
        transactionsTable.draw();
        // console.log('อัปเดตตารางธุรกรรมเสร็จแล้ว - จำนวนแถว:', transactionsTable.data().count());
        
    } catch (error) {
        console.error('ข้อผิดพลาดในการอัปเดตตารางธุรกรรม:', error);
        showAlert('เกิดข้อผิดพลาดในการอัปเดตตาราง', 'danger');
    }
}

// Get Type Badge - ได้รับแบดจ์ประเภท
function getTypeBadge(type) {
    try {
        const typeMap = {
            'sell': '<span class="badge badge-success">ขาย</span>',
            'buy': '<span class="badge badge-warning">ซื้อ</span>'
        };
        return typeMap[type] || '<span class="badge badge-secondary">ไม่ระบุ</span>';
    } catch (error) {
        console.error('ข้อผิดพลาดในการสร้าง type badge:', error);
        return '<span class="badge badge-secondary">ไม่ระบุ</span>';
    }
}

// Get Action Buttons - ได้รับปุ่มการจัดการ
function getActionButtons(transactionId) {
    try {
        if (!transactionId) {
            console.warn('ไม่มี transactionId สำหรับปุ่มการจัดการ');
            return '';
        }
        
        return `
            <div class="btn-group" role="group">
                <button type="button" class="btn btn-sm btn-outline-primary" onclick="editTransaction('${transactionId}')">
                    <i class="bi bi-pencil"></i>
                </button>
                <button type="button" class="btn btn-sm btn-outline-danger" onclick="deleteTransaction('${transactionId}')">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        `;
    } catch (error) {
        console.error('ข้อผิดพลาดในการสร้างปุ่มการจัดการ:', error);
        return '';
    }
}

// Update Statistics - อัปเดตสถิติ
function updateStatistics() {
    try {
        const today = new Date().toISOString().split('T')[0];
        const todayTransactions = transactionsData.filter(t => t.date === today);
        
        const todayRevenue = todayTransactions
            .filter(t => t.type === 'sell')
            .reduce((sum, t) => sum + (t.total || 0), 0);
        
        const todayExpense = todayTransactions
            .filter(t => t.type === 'buy')
            .reduce((sum, t) => sum + (t.total || 0), 0);
        
        const todayProfit = todayRevenue - todayExpense;
        
        // ตรวจสอบว่าองค์ประกอบมีอยู่หรือไม่
        const revenueElement = document.getElementById('todayRevenue');
        const expenseElement = document.getElementById('todayExpense');
        const profitElement = document.getElementById('todayProfit');
        const transactionsElement = document.getElementById('todayTransactions');
        
        if (revenueElement) revenueElement.textContent = formatCurrency(todayRevenue);
        if (expenseElement) expenseElement.textContent = formatCurrency(todayExpense);
        if (profitElement) profitElement.textContent = formatCurrency(todayProfit);
        if (transactionsElement) transactionsElement.textContent = todayTransactions.length;
        
        // console.log('อัปเดตสถิติเสร็จแล้ว:', {
        //     revenue: todayRevenue,
        //     expense: todayExpense,
        //     profit: todayProfit,
        //     transactions: todayTransactions.length
        // });
        
    } catch (error) {
        console.error('ข้อผิดพลาดในการอัปเดตสถิติ:', error);
    }
}

// Calculate Total - คำนวณยอดรวม
function calculateTotal() {
    try {
        const quantityInput = document.getElementById('quantity');
        const priceInput = document.getElementById('price');
        const totalInput = document.getElementById('total');
        
        if (!quantityInput || !priceInput || !totalInput) {
            console.warn('ไม่พบ input elements สำหรับคำนวณยอดรวม');
            return;
        }
        
        const quantity = parseFloat(quantityInput.value) || 0;
        const price = parseFloat(priceInput.value) || 0;
        const total = quantity * price;
        totalInput.value = total.toFixed(2);
        
    } catch (error) {
        console.error('ข้อผิดพลาดในการคำนวณยอดรวม:', error);
    }
}

// Calculate Edit Total - คำนวณยอดรวมในฟอร์มแก้ไข
function calculateEditTotal() {
    try {
        const quantityInput = document.getElementById('editQuantity');
        const priceInput = document.getElementById('editPrice');
        const totalInput = document.getElementById('editTotal');
        
        if (!quantityInput || !priceInput || !totalInput) {
            console.warn('ไม่พบ input elements สำหรับคำนวณยอดรวมในฟอร์มแก้ไข');
            return;
        }
        
        const quantity = parseFloat(quantityInput.value) || 0;
        const price = parseFloat(priceInput.value) || 0;
        const total = quantity * price;
        totalInput.value = total.toFixed(2);
        
    } catch (error) {
        console.error('ข้อผิดพลาดในการคำนวณยอดรวมในฟอร์มแก้ไข:', error);
    }
}

// Handle Add Transaction - จัดการการเพิ่มธุรกรรม
async function handleAddTransaction(e) {
    e.preventDefault();
    
    // console.log('เริ่มต้นการเพิ่มธุรกรรม...');
    
    const formData = {
        date: document.getElementById('transactionDate').value,
        type: document.getElementById('transactionType').value,
        productName: document.getElementById('productName').value,
        quantity: parseFloat(document.getElementById('quantity').value),
        price: parseFloat(document.getElementById('price').value),
        total: parseFloat(document.getElementById('total').value),
        customerSupplier: document.getElementById('customerSupplier').value,
        notes: document.getElementById('notes').value,
        createdAt: new Date(),
        updatedAt: new Date()
    };
    
    // console.log('ข้อมูลฟอร์ม:', formData);
    
    try {
        // แสดง loading state
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="bi bi-hourglass-split me-1"></i>กำลังบันทึก...';
        submitBtn.disabled = true;
        
        // console.log('กำลังบันทึกข้อมูลไปยัง Firestore...');
        const docRef = await addDoc(collection(db, 'transactions'), formData);
        // console.log('บันทึกข้อมูลสำเร็จ - Document ID:', docRef.id);
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('addTransactionModal'));
        modal.hide();
        
        // รีเซ็ตฟอร์ม
        addTransactionForm.reset();
        
        showAlert('เพิ่มธุรกรรมสำเร็จ', 'success');
        
        // console.log('บันทึกธุรกรรมสำเร็จ - ข้อมูลจะอัปเดตโดยอัตโนมัติผ่าน real-time listener');
        
        // ตรวจสอบว่า real-time listener ทำงานหรือไม่
        setTimeout(() => {
            // console.log('ตรวจสอบข้อมูลในหน่วยความจำหลังบันทึก:', transactionsData.length, 'รายการ');
            if (transactionsData.length === 0) {
                console.warn('ข้อมูลยังไม่ปรากฏในหน่วยความจำ - อาจมีปัญหากับ real-time listener');
                showAlert('ข้อมูลอาจจะไม่แสดงทันที กรุณารีเฟรชหน้า', 'warning');
            }
        }, 2000);
        
    } catch (error) {
        console.error('ข้อผิดพลาดในการเพิ่มธุรกรรม:', error);
        showAlert('เกิดข้อผิดพลาดในการเพิ่มธุรกรรม', 'danger');
    } finally {
        // คืนค่าปุ่มเป็นปกติ
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<i class="bi bi-check-circle me-1"></i>บันทึก';
        submitBtn.disabled = false;
    }
}

// Handle Edit Transaction - จัดการการแก้ไขธุรกรรม
async function handleEditTransaction(e) {
    e.preventDefault();
    
    const transactionId = document.getElementById('editTransactionId').value;
    const formData = {
        date: document.getElementById('editTransactionDate').value,
        productName: document.getElementById('editProductName').value,
        quantity: parseFloat(document.getElementById('editQuantity').value),
        price: parseFloat(document.getElementById('editPrice').value),
        total: parseFloat(document.getElementById('editTotal').value),
        customerSupplier: document.getElementById('editCustomerSupplier').value,
        notes: document.getElementById('editNotes').value,
        updatedAt: new Date()
    };
    
    try {
        // แสดง loading state
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="bi bi-hourglass-split me-1"></i>กำลังบันทึก...';
        submitBtn.disabled = true;
        
        await updateDoc(doc(db, 'transactions', transactionId), formData);
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('editTransactionModal'));
        modal.hide();
        
        // รีเซ็ตฟอร์ม
        editTransactionForm.reset();
        
        showAlert('แก้ไขธุรกรรมสำเร็จ', 'success');
        
        // console.log('แก้ไขธุรกรรมสำเร็จ - ข้อมูลจะอัปเดตโดยอัตโนมัติผ่าน real-time listener');
        
    } catch (error) {
        console.error('ข้อผิดพลาดในการแก้ไขธุรกรรม:', error);
        showAlert('เกิดข้อผิดพลาดในการแก้ไขธุรกรรม', 'danger');
    } finally {
        // คืนค่าปุ่มเป็นปกติ
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<i class="bi bi-check-circle me-1"></i>บันทึกการเปลี่ยนแปลง';
        submitBtn.disabled = false;
    }
}

// Edit Transaction - แก้ไขธุรกรรม
function editTransaction(transactionId) {
    try {
        if (!transactionId) {
            console.error('ไม่มี transactionId สำหรับการแก้ไข');
            return;
        }
        
        const transaction = transactionsData.find(t => t.id === transactionId);
        if (!transaction) {
            console.error('ไม่พบธุรกรรมที่ต้องการแก้ไข:', transactionId);
            showAlert('ไม่พบธุรกรรมที่ต้องการแก้ไข', 'danger');
            return;
        }
        
        // ตรวจสอบว่าองค์ประกอบมีอยู่หรือไม่
        const elements = {
            id: document.getElementById('editTransactionId'),
            date: document.getElementById('editTransactionDate'),
            productName: document.getElementById('editProductName'),
            quantity: document.getElementById('editQuantity'),
            price: document.getElementById('editPrice'),
            total: document.getElementById('editTotal'),
            customerSupplier: document.getElementById('editCustomerSupplier'),
            notes: document.getElementById('editNotes')
        };
        
        // ตรวจสอบว่าองค์ประกอบทั้งหมดมีอยู่
        for (const [key, element] of Object.entries(elements)) {
            if (!element) {
                console.error(`ไม่พบ element: edit${key.charAt(0).toUpperCase() + key.slice(1)}`);
                return;
            }
        }
        
        // Populate form fields
        elements.id.value = transaction.id;
        elements.date.value = transaction.date;
        elements.productName.value = transaction.productName || '';
        elements.quantity.value = transaction.quantity || '';
        elements.price.value = transaction.price || '';
        elements.total.value = transaction.total || '';
        elements.customerSupplier.value = transaction.customerSupplier || '';
        elements.notes.value = transaction.notes || '';
        
        // Show modal
        const modalElement = document.getElementById('editTransactionModal');
        if (modalElement) {
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
        } else {
            console.error('ไม่พบ modal สำหรับแก้ไขธุรกรรม');
        }
        
    } catch (error) {
        console.error('ข้อผิดพลาดในการแก้ไขธุรกรรม:', error);
        showAlert('เกิดข้อผิดพลาดในการแก้ไขธุรกรรม', 'danger');
    }
}

// Delete Transaction - ลบธุรกรรม
async function deleteTransaction(transactionId) {
    try {
        if (!transactionId) {
            console.error('ไม่มี transactionId สำหรับการลบ');
            return;
        }
        
        if (!confirm('คุณแน่ใจหรือไม่ที่จะลบธุรกรรมรายนี้?')) {
            return;
        }
        
        await deleteDoc(doc(db, 'transactions', transactionId));
        showAlert('ลบธุรกรรมสำเร็จ', 'success');
        
        // console.log('ลบธุรกรรมสำเร็จ - ข้อมูลจะอัปเดตโดยอัตโนมัติผ่าน real-time listener');
        
    } catch (error) {
        console.error('ข้อผิดพลาดในการลบธุรกรรม:', error);
        showAlert('เกิดข้อผิดพลาดในการลบธุรกรรม', 'danger');
    }
}

// Handle Logout - จัดการการออกจากระบบ
async function handleLogout() {
    try {
        if (!auth) {
            console.error('Firebase Auth ไม่พร้อมใช้งาน');
            window.location.href = '../index.html';
            return;
        }
        
        await auth.signOut();
        // console.log('ออกจากระบบสำเร็จ');
        window.location.href = '../index.html';
    } catch (error) {
        console.error('ข้อผิดพลาดในการออกจากระบบ:', error);
        showAlert('เกิดข้อผิดพลาดในการออกจากระบบ', 'danger');
    }
}

// Format Date - จัดรูปแบบวันที่
function formatDate(dateString) {
    try {
        if (!dateString) {
            return '-';
        }
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return '-';
        }
        return date.toLocaleDateString('th-TH');
    } catch (error) {
        console.error('ข้อผิดพลาดในการจัดรูปแบบวันที่:', error);
        return '-';
    }
}

// Format Number - จัดรูปแบบตัวเลข
function formatNumber(number) {
    try {
        if (number === null || number === undefined || isNaN(number)) {
            return '0';
        }
        return parseFloat(number).toLocaleString('th-TH');
    } catch (error) {
        console.error('ข้อผิดพลาดในการจัดรูปแบบตัวเลข:', error);
        return '0';
    }
}

// Format Currency - จัดรูปแบบสกุลเงิน
function formatCurrency(amount) {
    try {
        if (amount === null || amount === undefined || isNaN(amount)) {
            return '฿0.00';
        }
        return '฿' + parseFloat(amount).toLocaleString('th-TH', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    } catch (error) {
        console.error('ข้อผิดพลาดในการจัดรูปแบบสกุลเงิน:', error);
        return '฿0.00';
    }
}

// Show Alert - แสดงการแจ้งเตือน
function showAlert(message, type = 'info') {
    try {
        if (!message) {
            console.warn('ไม่มีข้อความสำหรับแสดง alert');
            return;
        }
        
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        const container = document.querySelector('.content-wrapper');
        if (container) {
            container.insertBefore(alertDiv, container.firstChild);
            
            // Auto remove after 5 seconds
            setTimeout(() => {
                if (alertDiv.parentNode) {
                    alertDiv.remove();
                }
            }, 5000);
        } else {
            console.warn('ไม่พบ container สำหรับแสดง alert');
            // แสดงใน body แทน
            document.body.insertBefore(alertDiv, document.body.firstChild);
            
            setTimeout(() => {
                if (alertDiv.parentNode) {
                    alertDiv.remove();
                }
            }, 5000);
        }
        
    } catch (error) {
        console.error('ข้อผิดพลาดในการแสดง alert:', error);
    }
}

// Make functions globally available - ทำให้ฟังก์ชันใช้งานได้ทั่วโลก
window.editTransaction = editTransaction;
window.deleteTransaction = deleteTransaction;
