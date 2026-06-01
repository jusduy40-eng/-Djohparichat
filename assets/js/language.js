// ========================================
// LANGUAGE SWITCHER
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    initLanguageSwitcher();
});

function initLanguageSwitcher() {
    const langButtons = document.querySelectorAll('.lang-btn');
    const savedLang = localStorage.getItem('language') || 'th';
    
    setLanguage(savedLang);
    
    langButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const lang = btn.getAttribute('data-lang');
            setLanguage(lang);
            
            langButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}

function setLanguage(lang) {
    const html = document.documentElement;
    const translatableElements = document.querySelectorAll('[data-th][data-en]');
    
    localStorage.setItem('language', lang);
    html.setAttribute('lang', lang);
    
    if (lang === 'en') {
        document.body.classList.add('lang-en');
    } else {
        document.body.classList.remove('lang-en');
    }
    
    translatableElements.forEach(el => {
        const text = el.getAttribute(`data-${lang}`);
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            el.placeholder = text;
        } else if (el.tagName === 'OPTION') {
            el.textContent = text;
        } else {
            el.textContent = text;
        }
    });
    
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-lang') === lang) {
            btn.classList.add('active');
        }
    });
}