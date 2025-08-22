// ===== User Manager สำหรับระบบจัดการร้านอาหารทะเลสด =====

// Import Firebase modules
const { auth, db } = window.firebase;
import { 
    doc, 
    setDoc, 
    getDoc, 
    updateDoc,
    collection,
    query,
    where,
    getDocs
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Import security utilities
import { logSecurityEvent } from './security.js';

// สร้างข้อมูลผู้ใช้เริ่มต้น
export async function createDefaultUserData(user) {
    try {
        console.log('สร้างข้อมูลผู้ใช้เริ่มต้นสำหรับ:', user.email);
        
        const defaultUserData = {
            firstName: user.displayName?.split(' ')[0] || 'ผู้ใช้',
            lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
            displayName: user.displayName || user.email.split('@')[0],
            phone: '',
            address: '',
            email: user.email,
            profilePhoto: '',
            role: 'user',
            isActive: true,
            lastLogin: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const defaultSettings = {
            theme: 'light',
            language: 'th',
            timezone: 'Asia/Bangkok',
            currency: 'THB',
            dateFormat: 'DD/MM/YYYY',
            desktopNotifications: true,
            twoFactorAuth: false,
            rememberMe: true,
            sessionTimeout: 30,
            emailNotifications: true,
            smsNotifications: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // สร้างข้อมูลผู้ใช้
        await setDoc(doc(db, 'users', user.uid), defaultUserData, { merge: true });
        
        // สร้างการตั้งค่าผู้ใช้
        await setDoc(doc(db, 'user_settings', user.uid), defaultSettings, { merge: true });
        
        // บันทึกเหตุการณ์ความปลอดภัย
        logSecurityEvent('user_created', {
            userId: user.uid,
            email: user.email,
            timestamp: new Date().toISOString()
        });
        
        console.log('สร้างข้อมูลผู้ใช้เริ่มต้นสำเร็จ');
        return { userData: defaultUserData, settings: defaultSettings };
        
    } catch (error) {
        console.error('ข้อผิดพลาดในการสร้างข้อมูลผู้ใช้เริ่มต้น:', error);
        throw error;
    }
}

// ดึงข้อมูลผู้ใช้
export async function getUserData(userId) {
    try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        
        if (userDoc.exists()) {
            return userDoc.data();
        } else {
            console.log('ไม่พบข้อมูลผู้ใช้:', userId);
            return null;
        }
        
    } catch (error) {
        console.error('ข้อผิดพลาดในการดึงข้อมูลผู้ใช้:', error);
        
        // ถ้าเป็น permission error ให้ return null แทนที่จะ throw
        if (error.code === 'permission-denied') {
            console.log('ไม่มีสิทธิ์เข้าถึงข้อมูลผู้ใช้ - จะสร้างข้อมูลใหม่');
            return null;
        }
        
        throw error;
    }
}

// ดึงการตั้งค่าผู้ใช้
export async function getUserSettings(userId) {
    try {
        const settingsDoc = await getDoc(doc(db, 'user_settings', userId));
        
        if (settingsDoc.exists()) {
            return settingsDoc.data();
        } else {
            console.log('ไม่พบการตั้งค่าผู้ใช้:', userId);
            return null;
        }
        
    } catch (error) {
        console.error('ข้อผิดพลาดในการดึงการตั้งค่าผู้ใช้:', error);
        
        // ถ้าเป็น permission error ให้ return null แทนที่จะ throw
        if (error.code === 'permission-denied') {
            console.log('ไม่มีสิทธิ์เข้าถึงการตั้งค่าผู้ใช้ - จะสร้างการตั้งค่าใหม่');
            return null;
        }
        
        throw error;
    }
}

// อัปเดตข้อมูลผู้ใช้
export async function updateUserData(userId, userData) {
    try {
        const userRef = doc(db, 'users', userId);
        const updateData = {
            ...userData,
            updatedAt: new Date().toISOString()
        };
        
        await updateDoc(userRef, updateData);
        
        // บันทึกเหตุการณ์ความปลอดภัย
        logSecurityEvent('user_updated', {
            userId: userId,
            updatedFields: Object.keys(userData),
            timestamp: new Date().toISOString()
        });
        
        console.log('อัปเดตข้อมูลผู้ใช้สำเร็จ');
        return true;
        
    } catch (error) {
        console.error('ข้อผิดพลาดในการอัปเดตข้อมูลผู้ใช้:', error);
        throw error;
    }
}

// อัปเดตการตั้งค่าผู้ใช้
export async function updateUserSettings(userId, settings) {
    try {
        const settingsRef = doc(db, 'user_settings', userId);
        const updateData = {
            ...settings,
            updatedAt: new Date().toISOString()
        };
        
        await updateDoc(settingsRef, updateData);
        
        // บันทึกเหตุการณ์ความปลอดภัย
        logSecurityEvent('user_settings_updated', {
            userId: userId,
            updatedSettings: Object.keys(settings),
            timestamp: new Date().toISOString()
        });
        
        console.log('อัปเดตการตั้งค่าผู้ใช้สำเร็จ');
        return true;
        
    } catch (error) {
        console.error('ข้อผิดพลาดในการอัปเดตรการตั้งค่าผู้ใช้:', error);
        throw error;
    }
}

// ตรวจสอบว่าผู้ใช้มีข้อมูลในระบบหรือไม่
export async function checkUserExists(userId) {
    try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        return userDoc.exists();
        
    } catch (error) {
        console.error('ข้อผิดพลาดในการตรวจสอบผู้ใช้:', error);
        return false;
    }
}

// ดึงข้อมูลผู้ใช้ทั้งหมด (สำหรับ admin)
export async function getAllUsers() {
    try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('isActive', '==', true));
        const querySnapshot = await getDocs(q);
        
        const users = [];
        querySnapshot.forEach((doc) => {
            users.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        return users;
        
    } catch (error) {
        console.error('ข้อผิดพลาดในการดึงข้อมูลผู้ใช้ทั้งหมด:', error);
        throw error;
    }
}

// เปลี่ยนสถานะผู้ใช้ (active/inactive)
export async function toggleUserStatus(userId, isActive) {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            isActive: isActive,
            updatedAt: new Date().toISOString()
        });
        
        // บันทึกเหตุการณ์ความปลอดภัย
        logSecurityEvent('user_status_changed', {
            userId: userId,
            newStatus: isActive ? 'active' : 'inactive',
            timestamp: new Date().toISOString()
        });
        
        console.log('เปลี่ยนสถานะผู้ใช้สำเร็จ');
        return true;
        
    } catch (error) {
        console.error('ข้อผิดพลาดในการเปลี่ยนสถานะผู้ใช้:', error);
        throw error;
    }
}

// อัปเดตเวลาล็อกอินล่าสุด
export async function updateLastLogin(userId) {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            lastLogin: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('ข้อผิดพลาดในการอัปเดตเวลาล็อกอิน:', error);
        // ไม่ throw error เพราะไม่ใช่เรื่องสำคัญ
    }
}

// ตรวจสอบสิทธิ์ผู้ใช้
export async function checkUserRole(userId, requiredRole = 'user') {
    try {
        const userData = await getUserData(userId);
        
        if (!userData) {
            return false;
        }
        
        const userRole = userData.role || 'user';
        
        // ตรวจสอบสิทธิ์ตามลำดับ
        const roleHierarchy = {
            'user': 1,
            'manager': 2,
            'admin': 3,
            'superadmin': 4
        };
        
        const userLevel = roleHierarchy[userRole] || 1;
        const requiredLevel = roleHierarchy[requiredRole] || 1;
        
        return userLevel >= requiredLevel;
        
    } catch (error) {
        console.error('ข้อผิดพลาดในการตรวจสอบสิทธิ์ผู้ใช้:', error);
        return false;
    }
}

// สร้างข้อมูลผู้ใช้ admin เริ่มต้น
export async function createAdminUser(user) {
    try {
        const adminUserData = {
            firstName: user.displayName?.split(' ')[0] || 'Admin',
            lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
            displayName: user.displayName || 'Administrator',
            phone: '',
            address: '',
            email: user.email,
            profilePhoto: '',
            role: 'admin',
            isActive: true,
            lastLogin: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const adminSettings = {
            theme: 'light',
            language: 'th',
            timezone: 'Asia/Bangkok',
            currency: 'THB',
            dateFormat: 'DD/MM/YYYY',
            desktopNotifications: true,
            twoFactorAuth: true,
            rememberMe: true,
            sessionTimeout: 60,
            emailNotifications: true,
            smsNotifications: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // สร้างข้อมูล admin
        await setDoc(doc(db, 'users', user.uid), adminUserData, { merge: true });
        await setDoc(doc(db, 'user_settings', user.uid), adminSettings, { merge: true });
        
        // บันทึกเหตุการณ์ความปลอดภัย
        logSecurityEvent('admin_user_created', {
            userId: user.uid,
            email: user.email,
            timestamp: new Date().toISOString()
        });
        
        console.log('สร้างข้อมูล admin สำเร็จ');
        return { userData: adminUserData, settings: adminSettings };
        
    } catch (error) {
        console.error('ข้อผิดพลาดในการสร้างข้อมูล admin:', error);
        throw error;
    }
}
