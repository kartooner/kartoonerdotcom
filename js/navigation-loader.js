(function() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadNavigation);
    } else {
        loadNavigation();
    }

    function loadNavigation() {
        const placeholder = document.getElementById('navigation-placeholder');

        // Navigation baked into the page by scripts/build-partials.js
        if (!placeholder) {
            if (document.querySelector('.persistent-nav')) {
                setActiveNavLink();
                initMobileNavigation();
            }
            return;
        }

        // Fallback for pages that haven't been built
        fetch('/partials/navigation.html')
            .then(response => {
                if (!response.ok) throw new Error('Navigation not found');
                return response.text();
            })
            .then(html => {
                placeholder.outerHTML = html;
                setActiveNavLink();
                initMobileNavigation();
            })
            .catch(error => {
                console.error('Error loading navigation:', error);
            });
    }

    function setActiveNavLink() {
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('.nav-links a[data-nav]');

        navLinks.forEach(link => {
            const navType = link.getAttribute('data-nav');
            let isActive = false;

            if (navType === 'home' && (currentPath === '/' || currentPath === '/index.html')) {
                isActive = true;
            } else if (navType === 'journal' && (currentPath.startsWith('/journal') || currentPath.startsWith('/entry'))) {
                isActive = true;
            } else if (navType !== 'home' && currentPath.startsWith('/' + navType)) {
                isActive = true;
            }

            if (isActive) {
                link.classList.add('current');
                // An entry sits inside Journal but isn't the Journal page itself
                link.setAttribute('aria-current', currentPath.startsWith('/entry') ? 'true' : 'page');
            }
        });
    }

    function initMobileNavigation() {
        const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
        const mobileCloseButton = document.querySelector('.mobile-close-button');
        const navLinks = document.querySelector('.nav-links');

        if (!mobileMenuToggle || !navLinks) return;

        // Matches the 750px breakpoint in style.css where the menu button takes over.
        // Above it the close button is display:none, so it's already out of the
        // tab order and hidden from screen readers.
        const mobileQuery = window.matchMedia('(max-width: 750px)');

        function isOpen() {
            return mobileMenuToggle.getAttribute('aria-expanded') === 'true';
        }

        function openMobileMenu() {
            mobileMenuToggle.setAttribute('aria-expanded', 'true');
            navLinks.classList.add('mobile-menu-open');
            // The open menu covers the button, so start keyboard focus inside it
            (mobileCloseButton || navLinks.querySelector('a')).focus();
        }

        function closeMobileMenu(returnFocus) {
            if (!isOpen()) return;
            mobileMenuToggle.setAttribute('aria-expanded', 'false');
            navLinks.classList.remove('mobile-menu-open');
            if (returnFocus) mobileMenuToggle.focus();
        }

        mobileMenuToggle.addEventListener('click', function() {
            if (isOpen()) {
                closeMobileMenu(true);
            } else {
                openMobileMenu();
            }
        });

        if (mobileCloseButton) {
            mobileCloseButton.addEventListener('click', function() {
                closeMobileMenu(true);
            });
        }

        // Escape closes the menu from anywhere inside it
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && isOpen()) {
                closeMobileMenu(navLinks.contains(document.activeElement) || document.activeElement === mobileMenuToggle);
            }
        });

        // Tabbing out past the last link closes it, so it never sits over the page
        navLinks.addEventListener('focusout', function(e) {
            if (isOpen() && e.relatedTarget && !navLinks.contains(e.relatedTarget) && e.relatedTarget !== mobileMenuToggle) {
                closeMobileMenu(false);
            }
        });

        navLinks.addEventListener('click', function(e) {
            if (e.target.closest('a')) {
                closeMobileMenu(false);
            }
        });

        document.addEventListener('click', function(e) {
            if (!mobileMenuToggle.contains(e.target) && !navLinks.contains(e.target)) {
                closeMobileMenu(false);
            }
        });

        // Widening past the breakpoint (rotating a tablet, resizing) resets the menu
        mobileQuery.addEventListener('change', function(e) {
            if (!e.matches) closeMobileMenu(false);
        });
    }
})();
