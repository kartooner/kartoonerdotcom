(function() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadThemeToggle);
    } else {
        loadThemeToggle();
    }

    function loadThemeToggle() {
        const placeholder = document.getElementById('theme-toggle-placeholder');
        if (!placeholder) return;

        fetch('/partials/theme-toggle.html')
            .then(response => {
                if (!response.ok) throw new Error('Theme toggle not found');
                return response.text();
            })
            .then(html => {
                placeholder.outerHTML = html;
                initThemeToggle();
            })
            .catch(error => {
                console.error('Error loading theme toggle:', error);
            });
    }

    function initThemeToggle() {
        const themeToggle = document.getElementById('theme-toggle');
        if (!themeToggle) return;

        if (themeToggle.dataset.initialized) {
            return;
        }
        themeToggle.dataset.initialized = 'true';

        const htmlElement = document.documentElement;
        const themeIcon = themeToggle.querySelector('.theme-toggle-icon');
        const themeText = themeToggle.querySelector('.theme-toggle-text');

        const savedTheme = htmlElement.getAttribute('data-theme') || 'dark';

        function updateToggleButton(theme) {
            if (theme === 'light') {
                themeIcon.textContent = '🌙';
                themeText.textContent = 'Dark mode';
                themeToggle.setAttribute('aria-pressed', 'true');
            } else {
                themeIcon.textContent = '☀️';
                themeText.textContent = 'Light mode';
                themeToggle.setAttribute('aria-pressed', 'false');
            }
        }

        updateToggleButton(savedTheme);

        themeToggle.addEventListener('click', function() {
            const currentTheme = htmlElement.getAttribute('data-theme') || 'dark';
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            htmlElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateToggleButton(newTheme);
        });

        themeToggle.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                themeToggle.click();
            }
        });
    }
})();
