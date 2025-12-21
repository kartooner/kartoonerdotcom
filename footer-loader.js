// Footer loader - loads footer.html into the page
(function() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadFooter);
    } else {
        loadFooter();
    }

    function loadFooter() {
        const placeholder = document.getElementById('footer-placeholder');
        if (!placeholder) return;

        fetch('/footer.html')
            .then(response => {
                if (!response.ok) throw new Error('Footer not found');
                return response.text();
            })
            .then(html => {
                placeholder.outerHTML = html;

                // Set current year in copyright
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
            })
            .catch(error => {
                console.error('Error loading footer:', error);
            });
    }
})();
