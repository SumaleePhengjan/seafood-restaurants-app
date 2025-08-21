// Suppliers Page JavaScript - JavaScript สำหรับหน้าพ่อค้าคนกลาง

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
let suppliersData = [];
let suppliersTable = null;

// DOM Elements - องค์ประกอบ DOM
const addSupplierForm = document.getElementById('addSupplierForm');
const editSupplierForm = document.getElementById('editSupplierForm');
const logoutBtn = document.getElementById('logoutBtn');
const userEmail = document.getElementById('userEmail');

// Initialize Suppliers Page - เริ่มต้นหน้าพ่อค้าคนกลาง
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
    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUser = user;
            userEmail.textContent = user.email;
            loadSuppliersData();
        } else {
            window.location.href = '../index.html';
        }
    });
}

// Initialize Event Listeners - เริ่มต้นการฟังเหตุการณ์
function initializeEventListeners() {
    // Add Supplier Form - ฟอร์มเพิ่มพ่อค้าคนกลาง
    if (addSupplierForm) {
        addSupplierForm.addEventListener('submit', handleAddSupplier);
    }

    // Edit Supplier Form - ฟอร์มแก้ไขพ่อค้าคนกลาง
    if (editSupplierForm) {
        editSupplierForm.addEventListener('submit', handleEditSupplier);
    }

    // Logout Button - ปุ่มออกจากระบบ
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Modal events - เหตุการณ์โมดอล
    const addModal = document.getElementById('addSupplierModal');
    if (addModal) {
        addModal.addEventListener('hidden.bs.modal', () => {
            addSupplierForm.reset();
        });
    }

    const editModal = document.getElementById('editSupplierModal');
    if (editModal) {
        editModal.addEventListener('hidden.bs.modal', () => {
            editSupplierForm.reset();
        });
    }
}

// Initialize DataTable - เริ่มต้น DataTable
function initializeDataTable() {
    try {
        if ($.fn.DataTable) {
 
            
            // ตรวจสอบ DataTables Responsive extension
            if (typeof $.fn.dataTable !== 'undefined' && $.fn.dataTable.Responsive) {
       
            } else {
                console.warn('DataTables Responsive extension ไม่พร้อมใช้งาน - ใช้การตั้งค่า responsive แบบพื้นฐาน');
            }
            
            // ตรวจสอบว่าตารางมีอยู่หรือไม่
            const tableElement = document.getElementById('suppliersTable');
            if (!tableElement) {
                console.error('ไม่พบตาราง suppliersTable');
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
                                    return 'รายละเอียดซัพพลายเออร์: ' + data[1];
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

            }

            suppliersTable = $('#suppliersTable').DataTable({
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

// Load Suppliers Data - โหลดข้อมูลพ่อค้าคนกลาง
async function loadSuppliersData() {
    try {
        // กำลังโหลดข้อมูลพ่อค้าคนกลาง...
        
        const suppliersRef = collection(db, 'suppliers');
        const querySnapshot = await getDocs(suppliersRef);
        
        suppliersData = [];
        querySnapshot.forEach((doc) => {
            suppliersData.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        // เรียงลำดับตามวันที่สร้างล่าสุด
        suppliersData.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
            const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
            return dateB - dateA;
        });
        
        updateSuppliersTable();
        updateStatistics();
        
        // โหลดข้อมูลพ่อค้าคนกลางเสร็จแล้ว
        
    } catch (error) {
        console.error('ข้อผิดพลาดในการโหลดข้อมูลพ่อค้าคนกลาง:', error);
        showAlert('เกิดข้อผิดพลาดในการโหลดข้อมูล', 'danger');
    }
}

// Update Suppliers Table - อัปเดตตารางพ่อค้าคนกลาง
function updateSuppliersTable() {
    if (!suppliersTable) return;
    
    suppliersTable.clear();
    
    suppliersData.forEach((supplier, index) => {
        const statusBadge = getStatusBadge(supplier.status);
        const actionButtons = getActionButtons(supplier.id);
        
        const rowData = [
            supplier.id,
            supplier.name,
            supplier.phone || '-',
            supplier.email || '-',
            supplier.address || '-',
            supplier.products || '-',
            statusBadge,
            actionButtons
        ];
        
        // เพิ่มแถวด้วย DataTables API
        const addedRow = suppliersTable.row.add(rowData);
        
        // เพิ่ม data-label attributes หลังจากเพิ่มแถว
        const rowNode = addedRow.node();
        if (rowNode) {
            const cells = rowNode.cells;
            if (cells.length >= 8) {
                cells[0].setAttribute('data-label', 'รหัส');
                cells[1].setAttribute('data-label', 'ชื่อ');
                cells[2].setAttribute('data-label', 'เบอร์โทร');
                cells[3].setAttribute('data-label', 'อีเมล');
                cells[4].setAttribute('data-label', 'ที่อยู่');
                cells[5].setAttribute('data-label', 'สินค้าที่จำหน่าย');
                cells[6].setAttribute('data-label', 'สถานะ');
                cells[7].setAttribute('data-label', 'การจัดการ');
            }
        }
        
        // เพิ่มแถวที่ ${index + 1}: ${supplier.name}
    });
    
    suppliersTable.draw();
}

// Get Status Badge - ได้รับแบดจ์สถานะ
function getStatusBadge(status) {
    const statusMap = {
        'active': '<span class="badge badge-success">ใช้งาน</span>',
        'inactive': '<span class="badge badge-secondary">ไม่ใช้งาน</span>'
    };
    return statusMap[status] || '<span class="badge badge-secondary">ไม่ระบุ</span>';
}

// Get Action Buttons - ได้รับปุ่มการจัดการ
function getActionButtons(supplierId) {
    return `
        <div class="btn-group" role="group">
            <button type="button" class="btn btn-sm btn-outline-primary" onclick="editSupplier('${supplierId}')">
                <i class="bi bi-pencil"></i>
            </button>
            <button type="button" class="btn btn-sm btn-outline-danger" onclick="deleteSupplier('${supplierId}')">
                <i class="bi bi-trash"></i>
            </button>
        </div>
    `;
}

// Update Statistics - อัปเดตสถิติ
function updateStatistics() {
    const totalSuppliers = suppliersData.length;
    const activeSuppliers = suppliersData.filter(s => s.status === 'active').length;
    
    document.getElementById('totalSuppliers').textContent = totalSuppliers;
    document.getElementById('activeSuppliers').textContent = activeSuppliers;
    
    // Calculate monthly purchase (placeholder)
    document.getElementById('monthlyPurchase').textContent = '฿0';
    
    // Find top supplier (placeholder)
    document.getElementById('topSupplier').textContent = totalSuppliers > 0 ? suppliersData[0].name : '-';
}

// Handle Add Supplier - จัดการการเพิ่มพ่อค้าคนกลาง
async function handleAddSupplier(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('supplierName').value,
        phone: document.getElementById('supplierPhone').value,
        email: document.getElementById('supplierEmail').value,
        address: document.getElementById('supplierAddress').value,
        products: document.getElementById('supplierProducts').value,
        notes: document.getElementById('supplierNotes').value,
        status: document.getElementById('supplierStatus').value,
        createdAt: new Date(),
        updatedAt: new Date()
    };
    
    try {
        await addDoc(collection(db, 'suppliers'), formData);
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('addSupplierModal'));
        modal.hide();
        
        showAlert('เพิ่มพ่อค้าคนกลางสำเร็จ', 'success');
    } catch (error) {
        console.error('ข้อผิดพลาดในการเพิ่มพ่อค้าคนกลาง:', error);
        showAlert('เกิดข้อผิดพลาดในการเพิ่มพ่อค้าคนกลาง', 'danger');
    }
}

// Handle Edit Supplier - จัดการการแก้ไขพ่อค้าคนกลาง
async function handleEditSupplier(e) {
    e.preventDefault();
    
    const supplierId = document.getElementById('editSupplierId').value;
    const formData = {
        name: document.getElementById('editSupplierName').value,
        phone: document.getElementById('editSupplierPhone').value,
        email: document.getElementById('editSupplierEmail').value,
        address: document.getElementById('editSupplierAddress').value,
        products: document.getElementById('editSupplierProducts').value,
        notes: document.getElementById('editSupplierNotes').value,
        status: document.getElementById('editSupplierStatus').value,
        updatedAt: new Date()
    };
    
    try {
        await updateDoc(doc(db, 'suppliers', supplierId), formData);
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('editSupplierModal'));
        modal.hide();
        
        showAlert('แก้ไขพ่อค้าคนกลางสำเร็จ', 'success');
    } catch (error) {
        console.error('ข้อผิดพลาดในการแก้ไขพ่อค้าคนกลาง:', error);
        showAlert('เกิดข้อผิดพลาดในการแก้ไขพ่อค้าคนกลาง', 'danger');
    }
}

// Edit Supplier - แก้ไขพ่อค้าคนกลาง
function editSupplier(supplierId) {
    const supplier = suppliersData.find(s => s.id === supplierId);
    if (!supplier) return;
    
    // Populate form fields
    document.getElementById('editSupplierId').value = supplier.id;
    document.getElementById('editSupplierName').value = supplier.name;
    document.getElementById('editSupplierPhone').value = supplier.phone || '';
    document.getElementById('editSupplierEmail').value = supplier.email || '';
    document.getElementById('editSupplierAddress').value = supplier.address || '';
    document.getElementById('editSupplierProducts').value = supplier.products || '';
    document.getElementById('editSupplierNotes').value = supplier.notes || '';
    document.getElementById('editSupplierStatus').value = supplier.status || 'active';
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('editSupplierModal'));
    modal.show();
}

// Delete Supplier - ลบพ่อค้าคนกลาง
async function deleteSupplier(supplierId) {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบพ่อค้าคนกลางรายนี้?')) {
        return;
    }
    
    try {
        await deleteDoc(doc(db, 'suppliers', supplierId));
        showAlert('ลบพ่อค้าคนกลางสำเร็จ', 'success');
    } catch (error) {
        console.error('ข้อผิดพลาดในการลบพ่อค้าคนกลาง:', error);
        showAlert('เกิดข้อผิดพลาดในการลบพ่อค้าคนกลาง', 'danger');
    }
}

// Handle Logout - จัดการการออกจากระบบ
async function handleLogout() {
    try {
        await auth.signOut();
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
    
    const container = document.querySelector('.content-wrapper');
    container.insertBefore(alertDiv, container.firstChild);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

// Make functions globally available - ทำให้ฟังก์ชันใช้งานได้ทั่วโลก
window.editSupplier = editSupplier;
window.deleteSupplier = deleteSupplier;
