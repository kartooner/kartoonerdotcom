const themeToggle = document.getElementById('themeToggle');
const menuToggle = document.getElementById('menuToggle');
const mainNav = document.getElementById('mainNav');
const htmlElement = document.documentElement;

// Store theme preference
const currentTheme = localStorage.getItem('theme') || 'light';
htmlElement.setAttribute('data-theme', currentTheme);

// Theme Toggle
themeToggle.addEventListener('click', () => {
    const newTheme = htmlElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    htmlElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    console.log(`Theme shifted to: ${newTheme}`);
});

// Mobile Menu Toggle
menuToggle.addEventListener('click', () => {
    mainNav.classList.toggle('active');
    const isActive = mainNav.classList.contains('active');
    menuToggle.textContent = isActive ? 'Close [x]' : 'Menu [+]';
});

// Subtle interaction logic
document.querySelectorAll('a').forEach(link => {
    link.addEventListener('mouseenter', () => {
        link.style.transition = 'color 0.1s ease-in-out';
    });
});
