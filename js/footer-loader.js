// Footer loader - sets up the footer, loading footer.html into the page if it isn't baked in
(function () {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadFooter);
    } else {
        loadFooter();
    }

    function loadFooter() {
        const placeholder = document.getElementById('footer-placeholder');

        // Footer baked into the page by scripts/build-partials.js
        if (!placeholder) {
            initFooter();
            return;
        }

        // Fallback for pages that haven't been built
        fetch('/partials/footer.html')
            .then(response => {
                if (!response.ok) throw new Error('Footer not found');
                return response.text();
            })
            .then(html => {
                placeholder.outerHTML = html;
                initFooter();
            })
            .catch(error => {
                console.error('Error loading footer:', error);
            });
    }

    function initFooter() {
        // Set current year in copyright (keeps a baked year current after New Year's)
        const yearSpan = document.getElementById('current-year');
        if (yearSpan) {
            yearSpan.textContent = new Date().getFullYear();
        }

        // Hide webring on all pages except index
        const currentPath = window.location.pathname;
        const isIndexPage = currentPath === '/' || currentPath === '/index.html';

        if (!isIndexPage) {
            const webring = document.querySelector('.webring');
            if (webring) {
                webring.style.display = 'none';
            }
        }
    }
})();
