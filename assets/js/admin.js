// ========================================
// ADMIN PANEL JAVASCRIPT
// Compatible with Vercel API + Supabase
// ========================================

// Base API URL (อัตโนมัติตามโดเมน)
const API_BASE = '/api';

// Token Key สำหรับเก็บใน localStorage
const TOKEN_KEY = 'djohparichat_admin_token';

document.addEventListener('DOMContentLoaded', () => {
    // ตรวจสอบว่าอยู่ในหน้าไหน
    const path = window.location.pathname;
    
    initAdminSidebar();
    
    if (path.includes('login.html')) {
        initLogin();
    } else {
        // หน้าอื่นๆ ใน admin ต้องตรวจสอบสิทธิ์ก่อน
        checkAuth();
        initAdminTable();
        initImageUpload();
        initFormValidation();
        loadContents(); // โหลดข้อมูลจากฐานข้อมูล
    }
});

// ========================================
// AUTHENTICATION
// ========================================

// ตรวจสอบสิทธิ์การเข้าถึง
function checkAuth() {
    const token = localStorage.getItem(TOKEN_KEY);
    const currentPath = window.location.pathname;
    
    // ถ้าไม่มี token และไม่ใช่หน้า login ให้ redirect
    if (!token && !currentPath.includes('login.html')) {
        window.location.href = 'login.html';
        return false;
    }
    
    // ถ้ามี token แต่อยู่หน้า login ให้ไป dashboard
    if (token && currentPath.includes('login.html')) {
        window.location.href = 'index.html';
        return false;
    }
    
    return true;
}

// ฟังก์ชัน Login
function initLogin() {
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const password = document.getElementById('password').value;
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            
            // แสดงสถานะกำลังโหลด
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังตรวจสอบ...';
            
            try {
                const response = await fetch(`${API_BASE}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password })
                });
                
                const data = await response.json();
                
                if (data.success && data.token) {
                    // เก็บ Token ไว้
                    localStorage.setItem(TOKEN_KEY, data.token);
                    showAdminNotification('success', 'เข้าสู่ระบบสำเร็จ!');
                    
                    // ไปหน้า Dashboard
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 1000);
                } else {
                    showAdminNotification('error', data.message || 'รหัสผ่านไม่ถูกต้อง');
                }
            } catch (error) {
                console.error('Login error:', error);
                showAdminNotification('error', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
            } finally {
                // คืนค่าปุ่มเดิม
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        });
    }
}

// ฟังก์ชัน Logout
function logout() {
    localStorage.removeItem(TOKEN_KEY);
    window.location.href = 'login.html';
}

// ========================================
// SIDEBAR & UI
// ========================================

function initAdminSidebar() {
    const sidebar = document.querySelector('.admin-sidebar');
    const toggleBtn = document.querySelector('.admin-mobile-toggle');
    
    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.toggle('open');
        });

        document.addEventListener('click', (e) => {
            if (sidebar.classList.contains('open') && 
                !sidebar.contains(e.target) && 
                !toggleBtn.contains(e.target)) {
                sidebar.classList.remove('open');
            }
        });
    }
    
    // ปุ่ม Logout
    const logoutBtn = document.querySelector('.admin-nav a.logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }
}

// ========================================
// LOAD & DISPLAY CONTENTS
// ========================================

async function loadContents() {
    const tableBody = document.querySelector('.admin-table tbody');
    if (!tableBody) return;
    
    // แสดงสถานะกำลังโหลด
    tableBody.innerHTML = `
        <tr>
            <td colspan="5" class="text-center">
                <i class="fas fa-spinner fa-spin"></i> กำลังโหลดข้อมูล...
            </td>
        </tr>
    `;
    
    try {
        const token = localStorage.getItem(TOKEN_KEY);
        const response = await fetch(`${API_BASE}/contents`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            renderContentsTable(data, tableBody);
        } else {
            tableBody.innerHTML = `<tr><td colspan="5" class="text-center text-red">โหลดข้อมูลไม่สำเร็จ</td></tr>`;
        }
    } catch (error) {
        console.error('Load contents error:', error);
        tableBody.innerHTML = `<tr><td colspan="5" class="text-center text-red">เกิดข้อผิดพลาดในการเชื่อมต่อ</td></tr>`;
    }
}

function renderContentsTable(contents, tableBody) {
    if (!contents || contents.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" class="text-center">ไม่มีข้อมูล</td></tr>`;
        return;
    }
    
    tableBody.innerHTML = contents.map(item => `
        <tr data-id="${item.id}">
            <td>${escapeHtml(item.title_th || item.title || '-')}</td>
            <td><span class="badge badge-${getCategoryColor(item.category)}">${item.category || '-'}</span></td>
            <td>${formatDate(item.created_at)}</td>
            <td>
                <span class="status ${item.published ? 'published' : 'draft'}">
                    ${item.published ? 'เผยแพร่' : 'ร่าง'}
                </span>
            </td>
            <td>
                <button class="btn-icon edit" data-action="edit" title="แก้ไข">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon delete" data-action="delete" title="ลบ">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
    
    // เพิ่ม Event Listener ให้ปุ่มใหม่
    initTableActions();
}

// Helper: ระบุสีตามหมวดหมู่
function getCategoryColor(category) {
    const colors = {
        'ai': 'blue',
        'insurance': 'gold',
        'training': 'green',
        'portfolio': 'purple'
    };
    return colors[category?.toLowerCase()] || 'gray';
}

// Helper: จัดรูปแบบวันที่
function formatDate(dateString) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Helper: ป้องกัน XSS
function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// ========================================
// TABLE ACTIONS (Edit/Delete)
// ========================================

function initAdminTable() {
    initTableActions();
    
    // ปุ่มเพิ่มเนื้อหาใหม่
    const addBtn = document.getElementById('addContentBtn');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            openContentModal(); // เปิด Modal เพิ่มเนื้อหา (ต้องสร้าง HTML Modal เพิ่ม)
        });
    }
}

function initTableActions() {
    // Edit buttons
    document.querySelectorAll('.btn-icon.edit').forEach(btn => {
        btn.addEventListener('click', async function() {
            const row = this.closest('tr');
            const id = row.dataset.id;
            const title = row.querySelector('td:first-child').textContent;
            
            console.log('Edit content ID:', id);
            // TODO: เปิด Modal แก้ไข หรือเปลี่ยนหน้าไปหน้า edit
            showAdminNotification('info', `กำลังแก้ไข: ${title}`);
        });
    });

    // Delete buttons
    document.querySelectorAll('.btn-icon.delete').forEach(btn => {
        btn.addEventListener('click', async function() {
            if (!confirm('คุณแน่ใจหรือไม่ที่จะลบรายการนี้?')) return;
            
            const row = this.closest('tr');
            const id = row.dataset.id;
            const token = localStorage.getItem(TOKEN_KEY);
            
            try {
                const response = await fetch(`${API_BASE}/contents`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ id })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    // อนิเมชั่นลบ
                    row.style.transition = 'all 0.3s ease';
                    row.style.opacity = '0';
                    row.style.transform = 'translateX(-100%)';
                    setTimeout(() => row.remove(), 300);
                    showAdminNotification('success', 'ลบข้อมูลสำเร็จ');
                } else {
                    showAdminNotification('error', 'ลบข้อมูลไม่สำเร็จ');
                }
            } catch (error) {
                console.error('Delete error:', error);
                showAdminNotification('error', 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
            }
        });
    });
}

// ========================================
// IMAGE UPLOAD (Supabase Storage)
// ========================================

function initImageUpload() {
    const uploadArea = document.querySelector('.image-upload');
    
    if (uploadArea) {
        uploadArea.addEventListener('click', () => triggerFileInput());
        setupDragAndDrop(uploadArea);
    }
}

function triggerFileInput() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    
    input.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });
    
    input.click();
}

function setupDragAndDrop(uploadArea) {
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'var(--primary-blue)';
        uploadArea.style.background = 'var(--sky-blue)';
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.borderColor = 'var(--gray-300)';
        uploadArea.style.background = 'transparent';
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'var(--gray-300)';
        uploadArea.style.background = 'transparent';
        handleFiles(e.dataTransfer.files);
    });
}

async function handleFiles(files) {
    const token = localStorage.getItem(TOKEN_KEY);
    
    for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue;
        
        showAdminNotification('info', `กำลังอัปโหลด: ${file.name}`);
        
        try {
            // อัปโหลดไป Supabase Storage
            const formData = new FormData();
            formData.append('file', file);
            formData.append('bucket', 'images'); // ชื่อ bucket ใน Supabase
            
            const response = await fetch(`${API_BASE}/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                    // ไม่ต้องตั้ง Content-Type เพราะ FormData ตั้งให้เอง
                },
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                showAdminNotification('success', `อัปโหลดสำเร็จ: ${file.name}`);
                // TODO: แสดงภาพพรีวิว หรือเก็บ URL ลงฟอร์ม
                console.log('Uploaded URL:', data.url);
            } else {
                showAdminNotification('error', `อัปโหลดไม่สำเร็จ: ${file.name}`);
            }
        } catch (error) {
            console.error('Upload error:', error);
            showAdminNotification('error', 'เกิดข้อผิดพลาดในการอัปโหลด');
        }
    }
}

// ========================================
// FORM SUBMISSION (Create/Update Content)
// ========================================

function initFormValidation() {
    const forms = document.querySelectorAll('.admin-form');
    
    forms.forEach(form => {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(form);
            const data = Object.fromEntries(formData);
            const token = localStorage.getItem(TOKEN_KEY);
            
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn?.innerHTML;
            
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังบันทึก...';
            }
            
            try {
                // ตรวจสอบว่าเป็นหน้าสร้างใหม่หรือแก้ไข
                const isEdit = data.id && data.id !== '';
                const method = isEdit ? 'PUT' : 'POST';
                
                const response = await fetch(`${API_BASE}/contents`, {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showAdminNotification('success', isEdit ? 'อัปเดตข้อมูลสำเร็จ' : 'บันทึกข้อมูลสำเร็จ');
                    
                    // รีโหลดตารางถ้าอยู่หน้าจัดการเนื้อหา
                    if (window.location.pathname.includes('contents.html')) {
                        setTimeout(() => loadContents(), 1000);
                    }
                    
                    // รีเซ็ตฟอร์มถ้าไม่ใช่หน้าแก้ไข
                    if (!isEdit) {
                        form.reset();
                    }
                } else {
                    showAdminNotification('error', result.message || 'บันทึกไม่สำเร็จ');
                }
            } catch (error) {
                console.error('Form submit error:', error);
                showAdminNotification('error', 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
            } finally {
                if (submitBtn && originalBtnText) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnText;
                }
            }
        });
    });
}

// ========================================
// NOTIFICATIONS
// ========================================

function showAdminNotification(type, message) {
    // ลบ notification เก่าถ้ามี
    const existing = document.querySelector('.admin-notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = `admin-notification notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Style
    Object.assign(notification.style, {
        position: 'fixed',
        top: '80px',
        right: '20px',
        padding: '14px 20px',
        background: type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3',
        color: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        zIndex: '9999',
        maxWidth: '350px',
        animation: 'slideIn 0.3s ease'
    });
    
    document.body.appendChild(notification);
    
    // ลบอัตโนมัติหลัง 3 วินาที
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ========================================
// MODAL HELPER (สำหรับเปิด/ปิดฟอร์มเพิ่มเนื้อหา)
// ========================================

function openContentModal(content = null) {
    // TODO: สร้าง Modal HTML ใน admin/contents.html แล้วเรียกฟังก์ชันนี้
    // ตัวอย่าง:
    // document.getElementById('contentModal').style.display = 'block';
    // if (content) { /* กรอกข้อมูลสำหรับแก้ไข */ }
    
    console.log('Open modal for:', content ? 'edit' : 'create', content);
    showAdminNotification('info', 'เปิดฟอร์มเพิ่มเนื้อหา (ต้องสร้าง Modal HTML)');
}

function closeContentModal() {
    // document.getElementById('contentModal').style.display = 'none';
}

// ========================================
// UTILITY: Add CSS for notifications if not exists
// ========================================
if (!document.querySelector('#admin-notification-styles')) {
    const style = document.createElement('style');
    style.id = 'admin-notification-styles';
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(400px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(400px); opacity: 0; }
        }
        .badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: 600;
        }
        .badge-blue { background: #e3f2fd; color: #1565c0; }
        .badge-gold { background: #fff8e1; color: #f57f17; }
        .badge-green { background: #e8f5e9; color: #2e7d32; }
        .badge-purple { background: #f3e5f5; color: #7b1fa2; }
        .badge-gray { background: #f5f5f5; color: #616161; }
        .text-red { color: #f44336; }
        .text-center { text-align: center; }
    `;
    document.head.appendChild(style);
}