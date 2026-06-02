// ========================================
// ADMIN PANEL JAVASCRIPT
// Compatible with Supabase Auth
// ========================================

// Import Supabase from CDN (ถ้ายังไม่ได้โหลดใน HTML)
if (!window.supabase) {
    console.error('❌ Supabase CDN not loaded. Please add:');
    console.error('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>');
}

// ========== CONFIG ==========
let config;
let supabase;

async function loadConfig() {
    try {
        const configModule = await import('../lib/config.js');
        config = configModule.config;
    } catch (e) {
        console.warn('⚠️ Using fallback config');
        config = {
            supabaseUrl: 'https://srtsdminbdmxtvjgriev.supabase.co',
            supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNydHNkbWluYmRteHR2amdyaWV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY4OTU2NzMsImV4cCI6MjA1MjQ3MTY3M30.XYZ123',
            adminEmail: ['jusduy40@gmail.com']
        };
    }
    
    // Initialize Supabase client
    if (config?.supabaseUrl && config?.supabaseAnonKey) {
        supabase = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
        console.log('✅ Supabase client initialized');
    }
}

// ========== GLOBAL STATE ==========
let currentUser = null;
let isAdmin = false;
let authChecked = false;

// ========== AUTH FUNCTIONS ==========

// เช็คสิทธิ์แอดมิน (ใช้ครั้งเดียวต่อหน้า)
async function checkAdminAuth() {
    if (authChecked) return isAdmin; // ป้องกันเช็คซ้ำ
    if (!supabase) await loadConfig();
    
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
            console.error('Session error:', error);
            return false;
        }
        
        currentUser = session?.user || null;
        
        if (currentUser) {
            // เช็คอีเมลแอดมิน
            const adminEmails = Array.isArray(config.adminEmail) 
                ? config.adminEmail 
                : [config.adminEmail].filter(e => e);
            
            // อนุญาตถ้าเป็นแอดมิน หรือ ไม่มี config (สำหรับทดสอบ)
            isAdmin = adminEmails.length === 0 || adminEmails.includes(currentUser.email);
            
            if (isAdmin) {
                console.log('✅ Admin authenticated:', currentUser.email);
                // อัปเดตแสดงอีเมลใน UI
                const emailEl = document.getElementById('adminEmail');
                if (emailEl) {
                    emailEl.textContent = currentUser.email?.split('@')[0] || 'Admin';
                }
            }
        }
        
        authChecked = true;
        return isAdmin;
        
    } catch (error) {
        console.error('Auth check error:', error);
        return false;
    }
}

// ฟังก์ชัน Login ด้วย Supabase
async function handleLogin(email, password) {
    if (!supabase) await loadConfig();
    
    const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
    });
    
    if (error) throw error;
    return data;
}

// ฟังก์ชัน Logout
async function handleLogout() {
    if (!supabase) await loadConfig();
    
    await supabase.auth.signOut();
    currentUser = null;
    isAdmin = false;
    authChecked = false;
    
    // ลบข้อมูลใน localStorage (ถ้ามี)
    localStorage.removeItem('djohparichat_admin_token');
    
    console.log('✅ Logged out');
}

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', async () => {
    // 1. โหลด config และสร้าง Supabase client
    await loadConfig();
    
    // 2. ตรวจสอบ path ปัจจุบัน
    const path = window.location.pathname;
    const isLoginPage = path.includes('login.html') || path.includes('auth');
    
    // 3. Init Sidebar (ทำงานทุกหน้า)
    initAdminSidebar();
    
    // 4. เช็คสิทธิ์
    const isAuth = await checkAdminAuth();
    
    if (isLoginPage) {
        // หน้า Login
        if (isAuth) {
            // ถ้าล็อกอินแล้ว ให้ไป dashboard แทน
            window.location.href = 'index.html';
        } else {
            // ยังไม่ล็อกอิน → แสดงฟอร์ม
            initLoginPage();
        }
    } else {
        // หน้าอื่นๆ ใน admin
        if (!isAuth) {
            // ไม่มีสิทธิ์ → ไปหน้าหลักหรือแสดง overlay
            showLoginOverlay();
        } else {
            // มีสิทธิ์ → โหลดฟีเจอร์
            hideLoginOverlay();
            initAdminTable();
            initImageUpload();
            initFormValidation();
            loadContents();
        }
    }
    
    // 5. Listen auth state changes (สำหรับทุกหน้า)
    setupAuthListener();
});

// ========== LOGIN PAGE ==========
function initLoginPage() {
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('loginEmail')?.value || 
                         document.getElementById('email')?.value;
            const password = document.getElementById('loginPassword')?.value || 
                            document.getElementById('password')?.value;
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn?.innerHTML;
            
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังเข้าสู่ระบบ...';
            }
            
            try {
                await handleLogin(email, password);
                
                showAdminNotification('success', 'เข้าสู่ระบบสำเร็จ!');
                
                // รอเล็กน้อยแล้วไป dashboard
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
                
            } catch (error) {
                console.error('Login error:', error);
                showAdminNotification('error', error.message || 'เข้าสู่ระบบไม่สำเร็จ');
            } finally {
                if (submitBtn && originalBtnText) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnText;
                }
            }
        });
    }
    
    // ปุ่มสมัครสมาชิก (ถ้ามี)
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('signupName')?.value;
            const email = document.getElementById('signupEmail')?.value;
            const password = document.getElementById('signupPassword')?.value;
            
            if (password?.length < 6) {
                showAdminNotification('error', 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
                return;
            }
            
            try {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: { data: { name } }
                });
                
                if (error) throw error;
                
                showAdminNotification('success', 'สมัครสมาชิกสำเร็จ! กรุณาตรวจสอบอีเมล');
                signupForm.reset();
                
            } catch (error) {
                showAdminNotification('error', error.message || 'สมัครไม่สำเร็จ');
            }
        });
    }
}

// ========== AUTH LISTENER ==========
function setupAuthListener() {
    if (!supabase) return;
    
    supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('🔄 Auth state changed:', event);
        
        if (event === 'SIGNED_IN' && session?.user) {
            currentUser = session.user;
            
            // เช็คสิทธิ์แอดมินใหม่
            const adminEmails = Array.isArray(config.adminEmail) 
                ? config.adminEmail 
                : [config.adminEmail].filter(e => e);
            
            isAdmin = adminEmails.length === 0 || adminEmails.includes(currentUser.email);
            
            if (isAdmin) {
                hideLoginOverlay();
                // รีโหลดหน้าถ้าจำเป็น
                if (window.location.pathname.includes('settings')) {
                    location.reload();
                }
            }
        }
        
        if (event === 'SIGNED_OUT') {
            currentUser = null;
            isAdmin = false;
            authChecked = false;
            showLoginOverlay();
        }
    });
}

// ========== LOGIN OVERLAY ==========
function showLoginOverlay() {
    const overlay = document.getElementById('loginOverlay');
    if (overlay) {
        overlay.classList.remove('hidden');
        // ปิดการคลิกที่เนื้อหาหลัก
        document.querySelector('.admin-sidebar')?.style.setProperty('pointer-events', 'none');
        document.querySelector('.admin-main')?.style.setProperty('pointer-events', 'none');
    }
}

function hideLoginOverlay() {
    const overlay = document.getElementById('loginOverlay');
    if (overlay) {
        overlay.classList.add('hidden');
        // เปิดการคลิกที่เนื้อหาหลัก
        document.querySelector('.admin-sidebar')?.style.setProperty('pointer-events', '');
        document.querySelector('.admin-main')?.style.setProperty('pointer-events', '');
    }
}

// ========== SIDEBAR ==========
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
    
    // ปุ่ม Logout ใน sidebar
    const logoutBtn = document.querySelector('.admin-nav a.logout') || 
                     document.getElementById('sidebarLogout') ||
                     document.getElementById('logoutBtn');
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            if (confirm('คุณต้องการออกจากระบบใช่หรือไม่?')) {
                await handleLogout();
                window.location.href = '../index';
            }
        });
    }
}

// ========== LOAD CONTENTS ==========
async function loadContents() {
    const tableBody = document.querySelector('.admin-table tbody');
    if (!tableBody || !supabase) return;
    
    // แสดงสถานะกำลังโหลด
    tableBody.innerHTML = `
        <tr>
            <td colspan="5" class="text-center">
                <i class="fas fa-spinner fa-spin"></i> กำลังโหลดข้อมูล...
            </td>
        </tr>
    `;
    
    try {
        // โหลดจากตาราง contents หรือ about_content ตามความเหมาะสม
        const { data, error } = await supabase
            .from('contents')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);
        
        if (error) {
            // ถ้าไม่มีตาราง contents ให้ลองโหลดจาก about_content
            const { data: aboutData, error: aboutError } = await supabase
                .from('about_content')
                .select('*');
            
            if (aboutError) throw aboutError;
            renderContentsTable(aboutData, tableBody);
            return;
        }
        
        renderContentsTable(data, tableBody);
        
    } catch (error) {
        console.error('Load contents error:', error);
        tableBody.innerHTML = `<tr><td colspan="5" class="text-center text-error">โหลดข้อมูลไม่สำเร็จ</td></tr>`;
    }
}

function renderContentsTable(contents, tableBody) {
    if (!contents || contents.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" class="text-center">ไม่มีข้อมูล</td></tr>`;
        return;
    }
    
    tableBody.innerHTML = contents.map(item => {
        const title = item.title_th || item.title || item.key || '-';
        const category = item.category || 'general';
        const published = item.published !== false;
        const createdAt = item.created_at || item.updated_at;
        
        return `
            <tr data-id="${item.id}">
                <td>${escapeHtml(title)}</td>
                <td><span class="badge badge-${getCategoryColor(category)}">${category}</span></td>
                <td>${formatDate(createdAt)}</td>
                <td>
                    <span class="status ${published ? 'published' : 'draft'}">
                        ${published ? 'เผยแพร่' : 'ร่าง'}
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
        `;
    }).join('');
    
    // เพิ่ม Event Listener ให้ปุ่มใหม่
    initTableActions();
}

// Helper: ระบุสีตามหมวดหมู่
function getCategoryColor(category) {
    const colors = {
        'ai': 'blue',
        'insurance': 'gold',
        'training': 'green',
        'portfolio': 'purple',
        'text': 'blue',
        'image': 'green'
    };
    return colors[category?.toLowerCase()] || 'gray';
}

// Helper: จัดรูปแบบวันที่
function formatDate(dateString) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
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
    return String(text).replace(/[&<>"']/g, m => map[m]);
}

// ========== TABLE ACTIONS ==========
function initAdminTable() {
    initTableActions();
    
    // ปุ่มเพิ่มเนื้อหาใหม่
    const addBtn = document.getElementById('addContentBtn');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            openContentModal();
        });
    }
}

function initTableActions() {
    // Edit buttons
    document.querySelectorAll('.btn-icon.edit').forEach(btn => {
        btn.addEventListener('click', async function() {
            const row = this.closest('tr');
            const id = row?.dataset.id;
            const title = row?.querySelector('td:first-child')?.textContent || 'รายการ';
            
            console.log('Edit content ID:', id);
            showAdminNotification('info', `กำลังแก้ไข: ${title}`);
            
            // TODO: เปิด Modal แก้ไข หรือ redirect ไปหน้า edit
            // window.location.href = `contents.html?edit=${id}`;
        });
    });

    // Delete buttons
    document.querySelectorAll('.btn-icon.delete').forEach(btn => {
        btn.addEventListener('click', async function() {
            if (!confirm('คุณแน่ใจหรือไม่ที่จะลบรายการนี้?')) return;
            
            const row = this.closest('tr');
            const id = row?.dataset.id;
            
            if (!id || !supabase) return;
            
            try {
                // ลองลบจากตาราง contents ก่อน
                let { error } = await supabase
                    .from('contents')
                    .delete()
                    .eq('id', id);
                
                // ถ้าไม่มีตาราง contents ให้ลอง about_content
                if (error?.code === '42P01') {
                    const { error: aboutError } = await supabase
                        .from('about_content')
                        .delete()
                        .eq('id', id);
                    
                    if (aboutError) throw aboutError;
                } else if (error) {
                    throw error;
                }
                
                // อนิเมชั่นลบ
                row.style.transition = 'all 0.3s ease';
                row.style.opacity = '0';
                row.style.transform = 'translateX(-100%)';
                setTimeout(() => row.remove(), 300);
                
                showAdminNotification('success', 'ลบข้อมูลสำเร็จ');
                
            } catch (error) {
                console.error('Delete error:', error);
                showAdminNotification('error', 'ลบข้อมูลไม่สำเร็จ: ' + error.message);
            }
        });
    });
}

// ========== IMAGE UPLOAD ==========
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
    
    input.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });
    
    input.click();
}

function setupDragAndDrop(uploadArea) {
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'var(--primary-blue, #1e88e5)';
        uploadArea.style.background = 'var(--sky-blue, #e3f2fd)';
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.borderColor = 'var(--gray-300, #cbd5e1)';
        uploadArea.style.background = 'transparent';
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'var(--gray-300, #cbd5e1)';
        uploadArea.style.background = 'transparent';
        handleFiles(e.dataTransfer.files);
    });
}

async function handleFiles(files) {
    if (!supabase) return;
    
    for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue;
        if (file.size > 5 * 1024 * 1024) {
            showAdminNotification('error', 'ไฟล์ใหญ่เกินไป (สูงสุด 5MB)');
            continue;
        }
        
        showAdminNotification('info', `กำลังอัปโหลด: ${file.name}`);
        
        try {
            // อัปโหลดไป Supabase Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `admin-${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
            
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('images')
                .upload(fileName, file);
            
            if (uploadError) throw uploadError;
            
            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('images')
                .getPublicUrl(fileName);
            
            showAdminNotification('success', `อัปโหลดสำเร็จ: ${file.name}`);
            console.log('Uploaded URL:', publicUrl);
            
            // TODO: แสดงพรีวิวหรือเก็บ URL ลงฟอร์ม
            // document.getElementById('imagePreview').src = publicUrl;
            
        } catch (error) {
            console.error('Upload error:', error);
            showAdminNotification('error', 'อัปโหลดไม่สำเร็จ: ' + error.message);
        }
    }
}

// ========== FORM SUBMISSION ==========
function initFormValidation() {
    const forms = document.querySelectorAll('.admin-form');
    
    forms.forEach(form => {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(form);
            const data = Object.fromEntries(formData);
            
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn?.innerHTML;
            
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังบันทึก...';
            }
            
            try {
                const isEdit = data.id && data.id !== 'undefined';
                
                if (isEdit) {
                    // Update existing
                    const { error } = await supabase
                        .from('contents')
                        .update({
                            ...data,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', data.id);
                    
                    if (error) throw error;
                    showAdminNotification('success', 'อัปเดตข้อมูลสำเร็จ');
                } else {
                    // Create new
                    const { error } = await supabase
                        .from('contents')
                        .insert([{
                            ...data,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        }]);
                    
                    if (error) throw error;
                    showAdminNotification('success', 'บันทึกข้อมูลสำเร็จ');
                }
                
                // รีโหลดตารางถ้าอยู่หน้าจัดการเนื้อหา
                if (window.location.pathname.includes('contents')) {
                    setTimeout(() => loadContents(), 1000);
                }
                
                // รีเซ็ตฟอร์มถ้าไม่ใช่หน้าแก้ไข
                if (!isEdit) {
                    form.reset();
                }
                
            } catch (error) {
                console.error('Form submit error:', error);
                showAdminNotification('error', 'บันทึกไม่สำเร็จ: ' + error.message);
            } finally {
                if (submitBtn && originalBtnText) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnText;
                }
            }
        });
    });
}

// ========== NOTIFICATIONS ==========
function showAdminNotification(type, message) {
    // ลบ notification เก่าถ้ามี
    const existing = document.querySelector('.admin-notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = `admin-notification notification-${type}`;
    
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        info: 'info-circle',
        warning: 'exclamation-triangle'
    };
    
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        info: '#3b82f6',
        warning: '#f59e0b'
    };
    
    Object.assign(notification.style, {
        position: 'fixed',
        top: '80px',
        right: '20px',
        padding: '14px 20px',
        background: colors[type] || colors.info,
        color: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        zIndex: '9999',
        maxWidth: '350px',
        animation: 'slideIn 0.3s ease',
        fontFamily: 'inherit',
        fontSize: '0.95rem'
    });
    
    notification.innerHTML = `
        <i class="fas fa-${icons[type] || icons.info}"></i>
        <span>${escapeHtml(message)}</span>
    `;
    
    document.body.appendChild(notification);
    
    // ลบอัตโนมัติหลัง 3-4 วินาที
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, type === 'error' ? 5000 : 3000);
}

// ========== MODAL HELPER ==========
function openContentModal(content = null) {
    console.log('Open modal for:', content ? 'edit' : 'create', content);
    showAdminNotification('info', 'เปิดฟอร์มเพิ่มเนื้อหา (ต้องสร้าง Modal HTML)');
    
    // TODO: สร้าง Modal HTML ใน admin/contents.html แล้วเรียกฟังก์ชันนี้
    // ตัวอย่าง:
    // document.getElementById('contentModal').style.display = 'block';
    // if (content) { /* กรอกข้อมูลสำหรับแก้ไข */ }
}

function closeContentModal() {
    // document.getElementById('contentModal').style.display = 'none';
}

// ========== ADD CSS FOR ANIMATIONS ==========
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
        .badge-blue { background: #dbeafe; color: #1d4ed8; }
        .badge-gold { background: #fef3c7; color: #92400e; }
        .badge-green { background: #d1fae5; color: #065f46; }
        .badge-purple { background: #ede9fe; color: #5b21b6; }
        .badge-gray { background: #f1f5f9; color: #64748b; }
        .text-error { color: #ef4444; }
        .text-center { text-align: center; }
        .status {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 600;
        }
        .status.published { background: #d1fae5; color: #065f46; }
        .status.draft { background: #fef3c7; color: #92400e; }
        .btn-icon {
            width: 32px;
            height: 32px;
            border-radius: 8px;
            border: none;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 0.9rem;
            transition: all 0.2s ease;
            margin-right: 4px;
        }
        .btn-icon.edit { background: #dbeafe; color: #1d4ed8; }
        .btn-icon.edit:hover { background: #1d4ed8; color: white; }
        .btn-icon.delete { background: #fee2e2; color: #ef4444; }
        .btn-icon.delete:hover { background: #ef4444; color: white; }
    `;
    document.head.appendChild(style);
}

// ========== EXPORT FOR USE IN OTHER FILES ==========
if (typeof window !== 'undefined') {
    window.adminAuth = {
        checkAdminAuth,
        handleLogin,
        handleLogout,
        currentUser: () => currentUser,
        isAdmin: () => isAdmin
    };
}
