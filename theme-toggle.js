// Theme toggle functionality
(function() {
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = themeToggle.querySelector('.theme-toggle-icon');
    const themeText = themeToggle.querySelector('.theme-toggle-text');
    const htmlElement = document.documentElement;
    
    // Get saved theme from localStorage or default to 'dark'
    const savedTheme = localStorage.getItem('theme') || 'dark';
    
    // Apply saved theme
    htmlElement.setAttribute('data-theme', savedTheme);
    updateToggleButton(savedTheme);
    
    // Add click event listener
    themeToggle.addEventListener('click', function() {
        const currentTheme = htmlElement.getAttribute('data-theme') || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        // Update theme
        htmlElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateToggleButton(newTheme);
    });
    
    // Update button state based on theme
    function updateToggleButton(theme) {
        if (theme === 'light') {
            themeIcon.textContent = '☀️';
            themeText.textContent = 'Light mode';
            themeToggle.setAttribute('aria-pressed', 'true');
        } else {
            themeIcon.textContent = '🌙';
            themeText.textContent = 'Dark mode';
            themeToggle.setAttribute('aria-pressed', 'false');
        }
    }
    
    // Keyboard support
    themeToggle.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            themeToggle.click();
        }
    });
})();