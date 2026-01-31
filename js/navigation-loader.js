(function() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadNavigation);
    } else {
        loadNavigation();
    }

    function loadNavigation() {
        const placeholder = document.getElementById('navigation-placeholder');
        if (!placeholder) return;

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
            } else if (navType === 'journal' && (currentPath.startsWith('/journal') || currentPath.startsWith('/entry') || currentPath.startsWith('/archive'))) {
                isActive = true;
            } else if (navType !== 'home' && currentPath.startsWith('/' + navType)) {
                isActive = true;
            }

            if (isActive) {
                link.classList.add('current');
                link.setAttribute('aria-current', 'page');
            }
        });
    }

    function initMobileNavigation() {
        const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
        const mobileCloseButton = document.querySelector('.mobile-close-button');
        const navLinks = document.querySelector('.nav-links');

        if (!mobileMenuToggle || !navLinks) return;

        function toggleMobileMenu() {
            const isOpen = mobileMenuToggle.getAttribute('aria-expanded') === 'true';
            const newState = !isOpen;

            mobileMenuToggle.setAttribute('aria-expanded', newState);

            if (newState) {
                navLinks.classList.add('mobile-menu-open');
            } else {
                navLinks.classList.remove('mobile-menu-open');
            }
        }

        function closeMobileMenu() {
            mobileMenuToggle.setAttribute('aria-expanded', 'false');
            navLinks.classList.remove('mobile-menu-open');
        }

        mobileMenuToggle.addEventListener('click', toggleMobileMenu);

        if (mobileCloseButton) {
            mobileCloseButton.addEventListener('click', closeMobileMenu);

            mobileCloseButton.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    closeMobileMenu();
                }
            });
        }

        mobileMenuToggle.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleMobileMenu();
            }
            if (e.key === 'Escape') {
                closeMobileMenu();
            }
        });

        navLinks.addEventListener('click', function(e) {
            if (e.target.tagName === 'A') {
                closeMobileMenu();
            }
        });

        document.addEventListener('click', function(e) {
            if (!mobileMenuToggle.contains(e.target) && !navLinks.contains(e.target)) {
                closeMobileMenu();
            }
        });

        window.addEventListener('resize', function() {
            if (window.innerWidth > 500) {
                closeMobileMenu();
                updateCloseButtonAccessibility();
            } else {
                updateCloseButtonAccessibility();
            }
        });

        function updateCloseButtonAccessibility() {
            if (mobileCloseButton) {
                if (window.innerWidth > 500) {
                    mobileCloseButton.setAttribute('aria-hidden', 'true');
                    mobileCloseButton.setAttribute('tabindex', '-1');
                } else {
                    mobileCloseButton.removeAttribute('aria-hidden');
                    mobileCloseButton.removeAttribute('tabindex');
                }
            }
        }

        updateCloseButtonAccessibility();
    }
})();
