// Main JavaScript for Vector-Star Probability Dynamics website

document.addEventListener('DOMContentLoaded', function() {
    // Initialize theme toggle
    initThemeToggle();

    // Initialize smooth scrolling for navigation
    initSmoothScrolling();

    // Initialize any interactive elements
    initInteractiveElements();
    initExplanationTabs();
    initThoughtExperiment();
});

function initThemeToggle() {
    // Create theme toggle button
    const themeToggle = document.createElement('button');
    themeToggle.className = 'theme-toggle';
    themeToggle.innerHTML = '🌓';
    themeToggle.title = 'Toggle Dark Mode';
    document.body.appendChild(themeToggle);

    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
    }

    // Toggle theme on button click
    themeToggle.addEventListener('click', function() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });
}

function initSmoothScrolling() {
    // Add smooth scrolling to navigation links
    const navLinks = document.querySelectorAll('.nav-menu a');

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Only apply smooth scrolling if it's an anchor link on the same page
            if (this.getAttribute('href').startsWith('#')) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                const targetElement = document.querySelector(targetId);

                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });
}

function initInteractiveElements() {
    // Add fade-in animation to cards on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
            }
        });
    }, observerOptions);

    // Observe all cards and sections
    const cards = document.querySelectorAll('.interpretation-card, .experiment-card, .concept-card, .theory-section');
    cards.forEach(card => {
        observer.observe(card);
    });
}

function initExplanationTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Add active class to clicked button and corresponding content
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab') + '-tab';
            const targetContent = document.getElementById(tabId);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });
}

// Initialize thought experiment specific functionality
function initThoughtExperiment() {
    // Add any thought experiment specific initialization here
    console.log('Thought experiment page initialized');
}

// Utility functions
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

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

// Export utility functions for use in other scripts
window.VSPDUtils = {
    debounce,
    clamp
};