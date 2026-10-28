(function() {
    // A baked-in toggle sits above this script, so set it up right away
    if (document.getElementById('theme-toggle')) {
        initThemeToggle();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadThemeToggle);
    } else {
        loadThemeToggle();
    }

    function loadThemeToggle() {
        const placeholder = document.getElementById('theme-toggle-placeholder');

        // Toggle baked into the page by scripts/build-partials.js
        if (!placeholder) {
            initThemeToggle();
            return;
        }

        // Fallback for pages that haven't been built
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
        // The sun/moon icon follows data-theme in CSS; only the label changes here
        const themeText = themeToggle.querySelector('.theme-toggle-text');
        if (!themeText) return;

        const savedTheme = htmlElement.getAttribute('data-theme') || 'dark';

        function updateToggleButton(theme) {
            themeText.textContent = theme === 'light' ? 'Dark mode' : 'Light mode';
        }

        updateToggleButton(savedTheme);

        themeToggle.addEventListener('click', function() {
            const currentTheme = htmlElement.getAttribute('data-theme') || 'dark';
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            htmlElement.setAttribute('data-theme', newTheme);
            try { localStorage.setItem('theme', newTheme); } catch (e) {}
            updateToggleButton(newTheme);
        });
    }
})();
