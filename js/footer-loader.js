// Footer loader - loads footer.html into the page
(function () {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadFooter);
    } else {
        loadFooter();
    }

    function loadFooter() {
        const placeholder = document.getElementById('footer-placeholder');
        if (!placeholder) return;

        fetch('/partials/footer.html')
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

                const footer = document.querySelector('footer');

                if (!isIndexPage) {
                    const webring = document.querySelector('.webring');
                    if (webring) {
                        webring.style.display = 'none';
                    }
                    // No webring, so the footer content gets a single column
                    if (footer) {
                        footer.classList.add('footer--single');
                    }
                }

                alignFooterToContent(footer);
                window.addEventListener('resize', () => alignFooterToContent(footer));
            })
            .catch(error => {
                console.error('Error loading footer:', error);
            });
    }

    // Each page sets its own content width, so line the footer's side
    // padding up with the page's content edges (desktop only; mobile uses CSS)
    function alignFooterToContent(footer) {
        if (!footer) return;

        const content = document.querySelector('main') || document.querySelector('.container, .container-narrow');
        if (!content || !window.matchMedia('(min-width: 769px)').matches) {
            footer.style.removeProperty('padding-left');
            footer.style.removeProperty('padding-right');
            return;
        }

        const rect = content.getBoundingClientRect();
        const styles = window.getComputedStyle(content);
        const left = rect.left + parseFloat(styles.paddingLeft);
        const right = document.documentElement.clientWidth - (rect.right - parseFloat(styles.paddingRight));

        footer.style.paddingLeft = Math.round(left) + 'px';
        footer.style.paddingRight = Math.round(right) + 'px';
    }
})();
