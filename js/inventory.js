// ===== JavaScript สำหรับหน้าจัดการสินค้า =====

// Import Firebase modules จาก window object
const { auth, db } = window.firebase;
import { 
    collection, 
    getDocs, 
    getDoc,
    addDoc, 
    updateDoc, 
    deleteDoc, 
    doc,
    onSnapshot,
    query,
    limit,
    orderBy
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// Import session manager
import { initializeSessionManager } from './session-manager.js';

// ตัวแปรสำหรับเก็บข้อมูล
let productsTable = null;
let currentUser = null;
let productsData = [];
let isLoading = false;

// ฟังก์ชันหลักเมื่อโหลดหน้า
document.addEventListener('DOMContentLoaded', function() {
    console.log('หน้าจัดการสินค้าโหลดเสร็จแล้ว');
    
    // เริ่มต้น session manager
    try {
        initializeSessionManager();
    } catch (error) {
        console.warn('ไม่สามารถเริ่มต้น session manager ได้:', error);
    }
    
    // ตั้งค่า event listeners ก่อน
    setupEventListeners();
    
    // ตรวจสอบการเข้าสู่ระบบ
    checkAuthentication();
});

// ตรวจสอบการเข้าสู่ระบบ
function checkAuthentication() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUser = user;
            console.log('ผู้ใช้เข้าสู่ระบบ:', user.email);
            
            // แสดงข้อมูลผู้ใช้
            const userEmailElement = document.getElementById('userEmail');
            if (userEmailElement) {
                userEmailElement.textContent = user.email;
            }
            
            // โหลดข้อมูลสินค้าแบบ lazy
            setTimeout(() => {
                loadProducts();
            }, 100);
        } else {
            console.log('ไม่มีผู้ใช้เข้าสู่ระบบ');
            // ไปหน้า login
            window.location.href = '../index.html';
        }
    });
}

// ตั้งค่า event listeners
function setupEventListeners() {
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
        refreshBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (!isLoading) {
                loadProducts();
            }
        });
    }
    
    // ฟอร์มเพิ่มสินค้า
    const addProductForm = document.getElementById('addProductForm');
    if (addProductForm) {
        addProductForm.addEventListener('submit', function(e) {
            e.preventDefault();
            addProduct();
        });
    }
    
    // ฟอร์มแก้ไขสินค้า
    const editProductForm = document.getElementById('editProductForm');
    if (editProductForm) {
        editProductForm.addEventListener('submit', function(e) {
            e.preventDefault();
            updateProduct();
        });
    }
    
    // จัดการโมดอลเพื่อแก้ไขปัญหา aria-hidden
    const addModal = document.getElementById('addProductModal');
    if (addModal) {
        addModal.addEventListener('hidden.bs.modal', function() {
            // ลบ aria-hidden เมื่อโมดอลปิด
            this.removeAttribute('aria-hidden');
            // รีเซ็ตฟอร์ม
            const form = document.getElementById('addProductForm');
            if (form) form.reset();
        });
        
        addModal.addEventListener('show.bs.modal', function() {
            // ตั้งค่า focus ที่ input แรก
            setTimeout(() => {
                const firstInput = this.querySelector('input');
                if (firstInput) {
                    firstInput.focus();
                }
            }, 100);
        });
    }
    
    const editModal = document.getElementById('editProductModal');
    if (editModal) {
        editModal.addEventListener('hidden.bs.modal', function() {
            // ลบ aria-hidden เมื่อโมดอลปิด
            this.removeAttribute('aria-hidden');
            // รีเซ็ตฟอร์ม
            const form = document.getElementById('editProductForm');
            if (form) form.reset();
        });
        
        editModal.addEventListener('show.bs.modal', function() {
            // ตั้งค่า focus ที่ input แรก
            setTimeout(() => {
                const firstInput = this.querySelector('input');
                if (firstInput) {
                    firstInput.focus();
                }
            }, 100);
        });
    }
}

// โหลดข้อมูลสินค้าแบบ optimize
async function loadProducts() {
    if (isLoading) {
        console.log('กำลังโหลดข้อมูลอยู่ กรุณารอ...');
        return;
    }
    
    try {
        isLoading = true;
        console.log('กำลังโหลดข้อมูลสินค้า...');
        
        // แสดง loading state
        showLoadingState(true);
        
        // ใช้ query เพื่อ optimize การดึงข้อมูล
        const productsRef = collection(db, 'products');
        const productsQuery = query(
            productsRef,
            orderBy('createdAt', 'desc'),
            limit(100) // จำกัดจำนวนข้อมูลที่ดึง
        );
        
        const querySnapshot = await getDocs(productsQuery);
        
        productsData = [];
        querySnapshot.forEach((doc) => {
            productsData.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        // อัปเดตสถิติและตารางพร้อมกัน
        updateStatistics(productsData);
        createProductsTable(productsData);
        
        console.log('โหลดข้อมูลสินค้าเสร็จแล้ว - จำนวน:', productsData.length);
        
    } catch (error) {
        console.error('ข้อผิดพลาดในการโหลดข้อมูลสินค้า:', error);
        showError('เกิดข้อผิดพลาดในการโหลดข้อมูลสินค้า');
    } finally {
        isLoading = false;
        // ซ่อน loading state
        showLoadingState(false);
    }
}

// อัปเดตสถิติ
function updateStatistics(products) {
    const totalProducts = products.length;
    const inStockProducts = products.filter(p => p.stock > 10).length;
    const lowStockProducts = products.filter(p => p.stock > 0 && p.stock <= 10).length;
    const outOfStockProducts = products.filter(p => p.stock <= 0).length;
    
    const totalProductsElement = document.getElementById('totalProducts');
    if (totalProductsElement) {
        totalProductsElement.textContent = totalProducts;
    }
    const inStockProductsElement = document.getElementById('inStockProducts');
    if (inStockProductsElement) {
        inStockProductsElement.textContent = inStockProducts;
    }
    const lowStockProductsElement = document.getElementById('lowStockProducts');
    if (lowStockProductsElement) {
        lowStockProductsElement.textContent = lowStockProducts;
    }
    const outOfStockProductsElement = document.getElementById('outOfStockProducts');
    if (outOfStockProductsElement) {
        outOfStockProductsElement.textContent = outOfStockProducts;
    }
}

// สร้างตารางสินค้า
function createProductsTable(products) {
    const tableElement = document.getElementById('productsTable');
    if (!tableElement) return;
    
    // ลบ DataTable เก่าถ้ามี
    try {
        if ($.fn.DataTable.isDataTable('#productsTable')) {
            $('#productsTable').DataTable().destroy();
        }
    } catch (error) {
        console.log('DataTable destroy error:', error);
    }
    
    // สร้างโครงสร้างตารางใหม่
    tableElement.innerHTML = `
        <thead>
            <tr>
                <th>รหัสสินค้า</th>
                <th>ชื่อสินค้า</th>
                <th>หมวดหมู่</th>
                <th>ราคาซื้อ</th>
                <th>ราคาขาย</th>
                <th>สต็อก</th>
                <th>หน่วย</th>
                <th>ซัพพลายเออร์</th>
                <th>สถานะ</th>
                <th>การจัดการ</th>
            </tr>
        </thead>
        <tbody>
            ${products.length === 0 ? `
                <tr>
                    <td colspan="10" class="text-center">
                        <div class="empty-state">
                            <i class="bi bi-box-seam"></i>
                            <h5>ไม่มีข้อมูลสินค้า</h5>
                            <p>เริ่มต้นโดยการเพิ่มสินค้าใหม่</p>
                        </div>
                    </td>
                </tr>
            ` : products.map(product => {
                const status = getProductStatus(product.stock);
                const statusClass = getStatusClass(product.stock);
                
                return `
                    <tr>
                        <td data-label="รหัสสินค้า">${product.id}</td>
                        <td data-label="ชื่อสินค้า">${product.name}</td>
                        <td data-label="หมวดหมู่">${product.category || '-'}</td>
                        <td data-label="ราคาซื้อ">฿${(product.buyPrice || 0).toLocaleString()}</td>
                        <td data-label="ราคาขาย">฿${(product.sellPrice || 0).toLocaleString()}</td>
                        <td data-label="สต็อก">${product.stock || 0}</td>
                        <td data-label="หน่วย">${product.unit || 'กิโลกรัม'}</td>
                        <td data-label="ซัพพลายเออร์">${product.supplier || '-'}</td>
                        <td data-label="สถานะ"><span class="status-badge ${statusClass}">${status}</span></td>
                        <td data-label="การจัดการ">
                            <button class="btn btn-sm btn-outline-primary btn-action" onclick="editProduct('${product.id}')">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger btn-action" onclick="deleteProduct('${product.id}')">
                                <i class="bi bi-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            }).join('')}
        </tbody>
    `;
    
    // เริ่มต้น DataTable ใหม่
    setTimeout(() => {
        if ($.fn.DataTable) {
            try {
                // ตั้งค่า responsive ตาม extension ที่มี
                let responsiveConfig = true;
                if (typeof $.fn.dataTable !== 'undefined' && $.fn.dataTable.Responsive) {
                    try {
                        responsiveConfig = {
                            details: {
                                display: $.fn.dataTable.Responsive.display.modal({
                                    header: function (row) {
                                        var data = row.data();
                                        return 'รายละเอียดสินค้า: ' + data[1];
                                    }
                                }),
                                renderer: $.fn.dataTable.Responsive.renderer.tableAll()
                            }
                        };
                        console.log('ใช้ DataTables Responsive extension แบบเต็มรูปแบบ');
                    } catch (error) {
                        console.warn('ไม่สามารถตั้งค่า DataTables Responsive extension ได้:', error);
                        responsiveConfig = true;
                    }
                } else {
                    console.log('ใช้การตั้งค่า responsive แบบพื้นฐาน');
                }

                productsTable = $('#productsTable').DataTable({
                    language: {
                        url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/th.json'
                    },
                    pageLength: 10,
                    order: [[1, 'asc']],
                    responsive: responsiveConfig,
                    destroy: true
                });
            } catch (error) {
                console.log('DataTable initialization error:', error);
            }
        }
    }, 100);
}

// ฟังก์ชันเพิ่มสินค้า
async function addProduct() {
    try {
        const formData = {
            name: document.getElementById('productName').value,
            category: document.getElementById('productCategory').value,
            buyPrice: parseFloat(document.getElementById('buyPrice').value),
            sellPrice: parseFloat(document.getElementById('sellPrice').value),
            stock: parseInt(document.getElementById('stock').value),
            unit: document.getElementById('unit').value,
            supplier: document.getElementById('supplier').value,
            minStock: parseInt(document.getElementById('minStock').value),
            description: document.getElementById('description').value,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // เพิ่มข้อมูลลง Firestore
        const productsRef = collection(db, 'products');
        await addDoc(productsRef, formData);
        
        // ปิด modal
        const modalElement = document.getElementById('addProductModal');
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) {
            modal.hide();
        }
        
        // โหลดข้อมูลใหม่
        loadProducts();
        
        showSuccess('เพิ่มสินค้าเรียบร้อยแล้ว');
        
    } catch (error) {
        console.error('ข้อผิดพลาดในการเพิ่มสินค้า:', error);
        showError('เกิดข้อผิดพลาดในการเพิ่มสินค้า');
    }
}

// ฟังก์ชันแก้ไขสินค้า
async function editProduct(productId) {
    try {
        // ดึงข้อมูลสินค้า
        const productRef = doc(db, 'products', productId);
        const productSnap = await getDoc(productRef);
        
        if (productSnap.exists()) {
            const product = productSnap.data();
            
            // เติมข้อมูลในฟอร์ม
            document.getElementById('editProductId').value = productId;
            document.getElementById('editProductName').value = product.name || '';
            document.getElementById('editProductCategory').value = product.category || 'กุ้ง';
            document.getElementById('editBuyPrice').value = product.buyPrice || '';
            document.getElementById('editSellPrice').value = product.sellPrice || '';
            document.getElementById('editStock').value = product.stock || '';
            document.getElementById('editUnit').value = product.unit || 'กิโลกรัม';
            document.getElementById('editSupplier').value = product.supplier || '';
            document.getElementById('editMinStock').value = product.minStock || 10;
            document.getElementById('editDescription').value = product.description || '';
            
            // เปิด modal
            const modal = new bootstrap.Modal(document.getElementById('editProductModal'));
            modal.show();
        }
        
    } catch (error) {
        console.error('ข้อผิดพลาดในการดึงข้อมูลสินค้า:', error);
        showError('เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า');
    }
}

// ฟังก์ชันอัปเดตสินค้า
async function updateProduct() {
    try {
        const productId = document.getElementById('editProductId').value;
        const formData = {
            name: document.getElementById('editProductName').value,
            category: document.getElementById('editProductCategory').value,
            buyPrice: parseFloat(document.getElementById('editBuyPrice').value),
            sellPrice: parseFloat(document.getElementById('editSellPrice').value),
            stock: parseInt(document.getElementById('editStock').value),
            unit: document.getElementById('editUnit').value,
            supplier: document.getElementById('editSupplier').value,
            minStock: parseInt(document.getElementById('editMinStock').value),
            description: document.getElementById('editDescription').value,
            updatedAt: new Date().toISOString()
        };
        
        // อัปเดตข้อมูลใน Firestore
        const productRef = doc(db, 'products', productId);
        await updateDoc(productRef, formData);
        
        // ปิด modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('editProductModal'));
        modal.hide();
        
        // โหลดข้อมูลใหม่
        loadProducts();
        
        showSuccess('อัปเดตสินค้าเรียบร้อยแล้ว');
        
    } catch (error) {
        console.error('ข้อผิดพลาดในการอัปเดตสินค้า:', error);
        showError('เกิดข้อผิดพลาดในการอัปเดตสินค้า');
    }
}

// ฟังก์ชันลบสินค้า
async function deleteProduct(productId) {
    if (confirm('คุณแน่ใจหรือไม่ที่จะลบสินค้านี้?')) {
        try {
            // ลบข้อมูลจาก Firestore
            const productRef = doc(db, 'products', productId);
            await deleteDoc(productRef);
            
            // โหลดข้อมูลใหม่
            loadProducts();
            
            showSuccess('ลบสินค้าเรียบร้อยแล้ว');
            
        } catch (error) {
            console.error('ข้อผิดพลาดในการลบสินค้า:', error);
            showError('เกิดข้อผิดพลาดในการลบสินค้า');
        }
    }
}

// ฟังก์ชันช่วยเหลือ
function getProductStatus(stock) {
    if (stock <= 0) return 'หมด';
    if (stock <= 10) return 'ใกล้หมด';
    return 'มีสต็อก';
}

function getStatusClass(stock) {
    if (stock <= 0) return 'status-out-of-stock';
    if (stock <= 10) return 'status-low-stock';
    return 'status-in-stock';
}

function showLoadingState(isLoading) {
    if (isLoading) {
        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.innerHTML = '<div class="spinner-border text-primary" role="status"></div>';
        document.body.appendChild(overlay);
    } else {
        const overlay = document.querySelector('.loading-overlay');
        if (overlay) {
            overlay.remove();
        }
    }
}

function showSuccess(message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-success alert-dismissible fade show';
    alertDiv.innerHTML = `
        <i class="bi bi-check-circle-fill me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    const contentWrapper = document.querySelector('.content-wrapper');
    contentWrapper.insertBefore(alertDiv, contentWrapper.firstChild);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

function showError(message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-danger alert-dismissible fade show';
    alertDiv.innerHTML = `
        <i class="bi bi-exclamation-triangle-fill me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    const contentWrapper = document.querySelector('.content-wrapper');
    contentWrapper.insertBefore(alertDiv, contentWrapper.firstChild);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// ฟังก์ชันออกจากระบบ
async function logout() {
    try {
        await auth.signOut();
        console.log('ออกจากระบบสำเร็จ');
        window.location.href = '../index.html';
    } catch (error) {
        console.error('ข้อผิดพลาดในการออกจากระบบ:', error);
        showError('เกิดข้อผิดพลาดในการออกจากระบบ');
    }
}

// Export functions for global use
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
