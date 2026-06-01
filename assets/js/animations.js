// ========================================
// ANIMATIONS CONTROLLER
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    initRevealAnimations();
    initParallaxEffect();
    initHoverEffects();
});

// Reveal Animations on Scroll
function initRevealAnimations() {
    const revealElements = document.querySelectorAll('.reveal');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.2 });

    revealElements.forEach(el => observer.observe(el));
}

// Parallax Effect for Floating Shapes
function initParallaxEffect() {
    const shapes = document.querySelectorAll('.floating-shape');
    
    if (shapes.length === 0) return;
    
    window.addEventListener('scroll', () => {
        const scrolled = window.scrollY;
        
        shapes.forEach((shape, index) => {
            const speed = (index + 1) * 0.05;
            const yPos = -(scrolled * speed);
            shape.style.transform = `translateY(${yPos}px)`;
        });
    });
}

// Hover Effects for Service Cards
function initHoverEffects() {
    const serviceCards = document.querySelectorAll('.service-card');
    
    serviceCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
}

// Stagger Animation for Lists
function initStaggerAnimation(selector) {
    const items = document.querySelectorAll(selector);
    
    items.forEach((item, index) => {
        item.style.transitionDelay = `${index * 0.1}s`;
    });
}