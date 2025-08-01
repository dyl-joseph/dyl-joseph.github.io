// Theme switching functionality
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = themeToggle.querySelector('i');
const html = document.documentElement;

// Check for saved theme preference or default to light theme
const currentTheme = localStorage.getItem('theme') || 'light';
html.setAttribute('data-theme', currentTheme);
updateThemeIcon(currentTheme);

// // Theme toggle event listener
// themeToggle.addEventListener('click', () => {
//     const currentTheme = html.getAttribute('data-theme');
//     const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
//     html.setAttribute('data-theme', newTheme);
//     localStorage.setItem('theme', newTheme);
//     updateThemeIcon(newTheme);
// });

function updateThemeIcon(theme) {
    if (theme === 'dark') {
        themeIcon.className = 'fas fa-moon';
        themeIcon.title = 'Switch to light theme';
    } else {
        themeIcon.className = 'fas fa-sun';
        themeIcon.title = 'Switch to dark theme';
    }
}

// Mobile navigation functionality
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Close mobile menu when clicking on a link
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    });
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Intersection Observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe sections for animation (only main content sections)
document.querySelectorAll('.content-area .section').forEach(section => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(20px)';
    section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(section);
});

// Portfolio item hover effects
document.querySelectorAll('.portfolio-item').forEach(item => {
    item.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-5px) scale(1.02)';
    });
    
    item.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
    });
});

// // Project item hover effects
// document.querySelectorAll('.project-item').forEach(item => {
//     item.addEventListener('mouseenter', function() {
//         this.style.transform = 'translateX(5px)';
//         this.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.15)';
//     });
    
//     item.addEventListener('mouseleave', function() {
//         this.style.transform = 'translateX(0)';
//         this.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
//     });
// });

// Social links hover effects
document.querySelectorAll('.social-links a').forEach(link => {
    link.addEventListener('mouseenter', function() {
        this.style.transform = 'translateX(5px)';
        this.style.backgroundColor = 'var(--bg-secondary)';
    });
    
    link.addEventListener('mouseleave', function() {
        this.style.transform = 'translateX(0)';
        this.style.backgroundColor = 'transparent';
    });
});

// Add keyboard navigation support
document.addEventListener('keydown', (e) => {
    // Escape key to close mobile menu
    if (e.key === 'Escape') {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    }
    
    // Ctrl/Cmd + K to toggle theme
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        themeToggle.click();
    }
});

// Add focus management for accessibility
document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
        document.body.classList.add('keyboard-navigation');
    }
});

document.addEventListener('mousedown', () => {
    document.body.classList.remove('keyboard-navigation');
});

// Add CSS for keyboard navigation
const style = document.createElement('style');
style.textContent = `
    .keyboard-navigation *:focus {
        outline: 2px solid var(--secondary-color) !important;
        outline-offset: 2px !important;
    }
`;
document.head.appendChild(style);

// Performance optimization: Debounce scroll events
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Apply debouncing to scroll events
const debouncedScrollHandler = debounce(() => {
    // Scroll-based animations and effects
}, 10);

window.addEventListener('scroll', debouncedScrollHandler);

// Add service worker for offline functionality (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Uncomment to enable service worker
        // navigator.serviceWorker.register('/sw.js');
    });
}

// Add analytics tracking (optional)
function trackEvent(eventName, eventData = {}) {
    // Replace with your analytics service
    console.log('Event tracked:', eventName, eventData);
}

// Track page views and interactions
document.addEventListener('DOMContentLoaded', () => {
    trackEvent('page_view', { page: window.location.pathname });
});

// Track theme changes
themeToggle.addEventListener('click', () => {
    const newTheme = html.getAttribute('data-theme');
    trackEvent('theme_change', { theme: newTheme });
});

// Track portfolio item clicks
document.querySelectorAll('.portfolio-item').forEach((item, index) => {
    item.addEventListener('click', () => {
        trackEvent('portfolio_click', { item: index + 1 });
    });
});

// Add error handling
window.addEventListener('error', (e) => {
    console.error('JavaScript error:', e.error);
    trackEvent('javascript_error', { 
        message: e.message, 
        filename: e.filename, 
        lineno: e.lineno 
    });
});

// Add console welcome message
console.log(`
🎉 Welcome to Dylan's Personal Website!
📧 Contact: dylan.simeon6@gmail.com
🌐 GitHub: https://github.com/dyl-joseph
📝 Blog: https://neural-lens.blogspot.com/
`); 