// ========================================
// DJOHPARICHAT.SITE - MAIN JAVASCRIPT
// FIXED VERSION
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    initLoader();
    initNavigation();
    initScrollAnimations();
    initCounterAnimation();
    initPortfolioFilter();
    initContactForm();
    initSmoothScroll();
});

// Loading Screen
function initLoader() {
    const loader = document.getElementById('loader');
    window.addEventListener('load', () => {
        setTimeout(() => {
            if (loader) loader.classList.add('hidden');
        }, 500);
    });
}

// Navigation
function initNavigation() {
    const navbar = document.getElementById('navbar');
    const mobileToggle = document.getElementById('mobileToggle');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');

    // Initial call to set active link on page load
    updateActiveNavLink();

    window.addEventListener('scroll', () => {
        if (navbar) {
            if (window.scrollY > 100) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        }
        updateActiveNavLink();
    });

    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            mobileToggle.classList.toggle('active');
        });

        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                mobileToggle.classList.remove('active');
            });
        });

        document.addEventListener('click', (e) => {
            if (!navbar?.contains(e.target) && navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                mobileToggle.classList.remove('active');
            }
        });
    }
}

// ✅ FIX: ฟังก์ชันตรวจสอบ Active Link ที่ถูกต้อง
function updateActiveNavLink() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    const currentPath = window.location.pathname;
    
    let currentSection = '';

    // หา section ที่กำลังอยู่ในหน้าจอ
    sections.forEach(section => {
        const sectionTop = section.offsetTop - 150; // Offset สำหรับ navbar
        if (window.scrollY >= sectionTop) {
            currentSection = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        
        // ❌ ลบ class active ออกก่อนทุกอัน
        link.classList.remove('active');
        
        // === กรณีที่ 1: เป็นลิงก์ภายในหน้าเดียวกัน (ขึ้นต้นด้วย #) ===
        if (href?.startsWith('#')) {
            const targetId = href.substring(1); // ตัด # ออก
            
            // ถ้าอยู่ที่บนสุดของหน้า (ไม่ใช่หน้าอื่น) ให้ актив "หน้าหลัก"
            if (window.scrollY < 100 && (currentPath.endsWith('index.html') || currentPath.endsWith('/'))) {
                if (href === '#home' || href === 'index.html') {
                    link.classList.add('active');
                }
            }
            // ถ้าเลื่อนถึง section นั้นๆ ให้ актив ลิงก์นั้น
            else if (currentSection && targetId === currentSection) {
                link.classList.add('active');
            }
        }
        // === กรณีที่ 2: เป็นลิงก์ไปหน้าอื่น ===
        else if (href) {
            // เช็คถ้า URL ตรงกับหน้าปัจจุบัน
            if (currentPath.endsWith(href) || 
                (href === 'index.html' && (currentPath.endsWith('/') || currentPath.endsWith('index.html')))) {
                link.classList.add('active');
            }
        }
    });
}

// Scroll Animations
function initScrollAnimations() {
    const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.fade-in, .fade-in-up, .fade-in-left, .fade-in-right, .scale-in').forEach(el => {
        observer.observe(el);
    });
}

// Counter Animation
function initCounterAnimation() {
    const counters = document.querySelectorAll('[data-count]');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(counter => observer.observe(counter));
}

function animateCounter(element) {
    const target = parseInt(element.getAttribute('data-count'));
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;

    const timer = setInterval(() => {
        current += step;
        if (current >= target) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 16);
}

// Portfolio Filter
function initPortfolioFilter() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const portfolioItems = document.querySelectorAll('.portfolio-item');

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.getAttribute('data-filter');

            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            portfolioItems.forEach(item => {
                const category = item.getAttribute('data-category');
                
                if (filter === 'all' || category === filter) {
                    item.style.display = 'block';
                    setTimeout(() => {
                        item.style.opacity = '1';
                        item.style.transform = 'scale(1)';
                    }, 10);
                } else {
                    item.style.opacity = '0';
                    item.style.transform = 'scale(0.8)';
                    setTimeout(() => {
                        item.style.display = 'none';
                    }, 300);
                }
            });
        });
    });
}

// Contact Form
function initContactForm() {
    const form = document.getElementById('contactForm');
    
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(form);
            const data = Object.fromEntries(formData);
            
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            submitBtn.disabled = true;
            
            try {
                await simulateFormSubmission(data);
                const lang = document.body.classList.contains('lang-en') ? 'en' : 'th';
                const msg = lang === 'en' ? 'Message sent successfully!' : 'ส่งข้อความสำเร็จ!';
                showNotification('success', msg);
                form.reset();
            } catch (error) {
                const lang = document.body.classList.contains('lang-en') ? 'en' : 'th';
                const msg = lang === 'en' ? 'An error occurred. Please try again.' : 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';
                showNotification('error', msg);
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }
}

function simulateFormSubmission(data) {
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log('Form data:', data);
            resolve({ success: true });
        }, 1500);
    });
}

function showNotification(type, message) {
    // ลบ notification เก่าถ้ามี
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i><span>${message}</span>`;
    notification.style.animation = 'slideIn 0.3s ease';
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// Smooth Scroll
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href !== '#') {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    const offsetTop = target.offsetTop - 80;
                    window.scrollTo({ top: offsetTop, behavior: 'smooth' });
                }
            }
        });
    });
}

// เพิ่มโค้ดนี้ใน main.js

// เช็คสถานะ Login ทุกครั้งที่โหลดหน้า
async function checkUserSession() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
        console.log('User logged in:', session.user.email);
        // ถ้า Login อยู่แล้ว อาจจะเปลี่ยนปุ่มเมนูเป็น "ออกจากระบบ"
        // หรือแสดงชื่อผู้ใช้
    } else {
        console.log('Not logged in');
    }
}

// เรียกใช้เมื่อหน้าโหลดเสร็จ
document.addEventListener('DOMContentLoaded', () => {
    checkUserSession();
    // ... ฟังก์ชันอื่นๆ ที่มีอยู่แล้ว
});
/**
 * Hide .html extensions from URLs
 * Usage: <a href="index.html"> → shows as /index in browser
 */
document.addEventListener('DOMContentLoaded', function() {
    
    // 🔹 1. Rewrite all internal links to hide .html
    document.querySelectorAll('a[href]').forEach(link => {
        const href = link.getAttribute('href');
        
        // Skip external links, anchors, mailto, tel, etc.
        if (href.startsWith('http') || href.startsWith('#') || 
            href.startsWith('mailto:') || href.startsWith('tel:')) {
            return;
        }
        
        // Remove .html from display but keep functionality
        if (href.endsWith('.html')) {
            const cleanHref = href.replace('.html', '');
            link.setAttribute('data-real-href', href); // Store real href
            link.setAttribute('href', cleanHref); // Display clean URL
            
            // Intercept click to navigate to real file
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const realHref = this.getAttribute('data-real-href');
                
                // Handle relative paths
                const basePath = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
                const targetPath = realHref.startsWith('../') ? 
                    basePath + realHref : 
                    (realHref.startsWith('/') ? realHref : basePath + realHref);
                
                window.location.href = targetPath;
            });
        }
    });
    
    // 🔹 2. Handle browser back/forward buttons (History API)
    window.addEventListener('popstate', function() {
        // Optional: Add logic here if using SPA-style navigation
    });
    
    // 🔹 3. Optional: Redirect clean URLs to .html files (for direct access)
    // Note: This requires server configuration for full support
    // For static hosting, add this to your hosting config:
    
    /* 
    === Netlify (_redirects file) ===
    /*    /index    /index.html   200
    /*    /about    /pages/about.html   200
    
    === Vercel (vercel.json) ===
    {
      "rewrites": [
        { "source": "/:path*", "destination": "/:path*.html" }
      ]
    }
    
    === Apache (.htaccess) ===
    RewriteEngine On
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^([^\.]+)$ $1.html [NC,L]
    */
});
// Hide .html from URLs
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('a[href]').forEach(link => {
        const href = link.getAttribute('href');
        
        if (href.endsWith('.html') && !href.startsWith('http')) {
            const cleanHref = href.replace('.html', '');
            link.setAttribute('data-real-href', href);
            link.setAttribute('href', cleanHref);
            
            link.addEventListener('click', function(e) {
                e.preventDefault();
                window.location.href = this.getAttribute('data-real-href');
            });
        }
    });
});
// Remove .html from URLs on click
document.addEventListener('DOMContentLoaded', function() {
    // Update all links
    document.querySelectorAll('a[href]').forEach(link => {
        const href = link.getAttribute('href');
        
        // Skip external links and special protocols
        if (href.startsWith('http') || href.startsWith('#') || 
            href.startsWith('mailto:') || href.startsWith('tel:') ||
            href.includes('://')) {
            return;
        }
        
        // Remove .html from href
        if (href.endsWith('.html')) {
            const cleanHref = href.replace('.html', '');
            link.setAttribute('href', cleanHref);
        }
    });
    
    // Handle browser navigation
    window.addEventListener('popstate', function() {
        // Optional: Add custom handling
    });
});
// ลบ .html จากทุกอัตโนมัติ
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('a[href]').forEach(link => {
        const href = link.getAttribute('href');
        if (href.endsWith('.html') && !href.startsWith('http')) {
            link.setAttribute('href', href.replace('.html', ''));
        }
    });
});
