/**
 * Seasonal Theme Loader
 * Combines Halloween/Fall and Christmas theme loaders
 * Loads appropriate seasonal theme based on current date
 */

(function() {
    'use strict';

    // ============ FALL/HALLOWEEN THEME ============

    // Check if we're in the fall theme date range
    function isFallSeason() {
        const urlParams = new URLSearchParams(window.location.search);
        const themeParam = urlParams.get('theme');

        // If a specific theme is requested, only activate if it matches
        if (themeParam) {
            return themeParam === 'halloween' || themeParam === 'fall';
        }

        const now = new Date();
        const year = now.getFullYear();

        // Fall season: October 1 - November 30
        const startDate = new Date(year, 9, 1);   // Oct 1
        const endDate = new Date(year, 10, 30);   // Nov 30

        return now >= startDate && now <= endDate;
    }

    // Check if we're specifically in Halloween (for "Boo!" greeting)
    function isHalloweenPeriod() {
        const now = new Date();
        const year = now.getFullYear();

        // Halloween period: October 20 - October 31
        const startDate = new Date(year, 9, 20);  // Oct 20
        const endDate = new Date(year, 9, 31);    // Oct 31

        return now >= startDate && now <= endDate;
    }

    // Load the fall theme CSS
    function loadFallTheme() {
        if (document.getElementById('fall-theme')) {
            return;
        }

        const link = document.createElement('link');
        link.id = 'fall-theme';
        link.rel = 'stylesheet';
        link.href = '/halloween-theme.css';

        const mainStylesheet = document.querySelector('link[href*="style.min.css"]');
        if (mainStylesheet) {
            mainStylesheet.parentNode.insertBefore(link, mainStylesheet.nextSibling);
        } else {
            document.head.appendChild(link);
        }
    }

    // Update greeting to "Boo!" during Halloween period only
    function updateHalloweenGreeting() {
        const updateGreeting = () => {
            const greetingSpan = document.querySelector('h1 span[lang="no"]');
            if (greetingSpan) {
                greetingSpan.textContent = 'Boo!';
                greetingSpan.setAttribute('lang', 'en');
            }

            const h1 = document.querySelector('h1');
            if (h1) {
                const walker = document.createTreeWalker(
                    h1,
                    NodeFilter.SHOW_TEXT,
                    null,
                    false
                );

                let node;
                while (node = walker.nextNode()) {
                    if (node.textContent.trim().startsWith(',')) {
                        node.textContent = node.textContent.replace(/^,\s*/, ' ');
                    }
                }
            }
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', updateGreeting);
        } else {
            updateGreeting();
        }
    }

    // ============ CHRISTMAS THEME ============

    // Check if we're in the Christmas date range
    function isChristmasSeason() {
        const urlParams = new URLSearchParams(window.location.search);
        const themeParam = urlParams.get('theme');

        // If a specific theme is requested, only activate if it matches
        if (themeParam) {
            return themeParam === 'christmas';
        }

        const now = new Date();
        const year = now.getFullYear();

        // Christmas season: December 1 - December 31
        const startDate = new Date(year, 11, 1);
        const endDate = new Date(year, 11, 31);

        return now >= startDate && now <= endDate;
    }

    // Load the Christmas theme CSS
    function loadChristmasTheme() {
        if (document.getElementById('christmas-theme')) {
            return;
        }

        const link = document.createElement('link');
        link.id = 'christmas-theme';
        link.rel = 'stylesheet';
        link.href = '/christmas-theme.css';

        const mainStylesheet = document.querySelector('link[href*="style.min.css"]');
        if (mainStylesheet) {
            mainStylesheet.parentNode.insertBefore(link, mainStylesheet.nextSibling);
        } else {
            document.head.appendChild(link);
        }
    }

    // Update greeting to "God Jul!" during Christmas season
    function updateChristmasGreeting() {
        const updateGreeting = () => {
            const greetingSpan = document.querySelector('h1 span[lang="no"]');
            if (greetingSpan) {
                greetingSpan.textContent = 'God Jul!';
                greetingSpan.setAttribute('lang', 'no');
            }

            const h1 = document.querySelector('h1');
            if (h1) {
                const walker = document.createTreeWalker(
                    h1,
                    NodeFilter.SHOW_TEXT,
                    null,
                    false
                );

                let node;
                while (node = walker.nextNode()) {
                    if (node.textContent.trim().startsWith(',')) {
                        node.textContent = node.textContent.replace(/^,\s*/, ' ');
                    }
                }
            }
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', updateGreeting);
        } else {
            updateGreeting();
        }
    }

    // Add Christmas lights SVG to the page
    function addChristmasLights() {
        const addLights = () => {
            if (document.querySelector('.christmas-lights')) {
                return;
            }

            const lightsContainer = document.createElement('div');
            lightsContainer.className = 'christmas-lights';
            lightsContainer.setAttribute('aria-hidden', 'true');

            lightsContainer.innerHTML = `
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="100%" height="100%" viewBox="0 0 1200 120" preserveAspectRatio="xMidYMid meet">
                    <g>
                        <path class="lightrope" d="M0,60 Q100,35 200,58 Q300,75 400,55 Q500,40 600,62 Q700,78 800,52 Q900,38 1000,65 Q1100,80 1200,50"></path>
                        <circle class="light-fixture" cx="100" cy="35" r="2"></circle>
                        <ellipse class="light bulb-red" cx="100" cy="41" rx="4" ry="6"></ellipse>
                        <circle class="light-fixture" cx="200" cy="58" r="2"></circle>
                        <ellipse class="light bulb-green" cx="200" cy="64" rx="4" ry="6"></ellipse>
                        <circle class="light-fixture" cx="300" cy="75" r="2"></circle>
                        <ellipse class="light bulb-blue" cx="300" cy="81" rx="4" ry="6"></ellipse>
                        <circle class="light-fixture" cx="400" cy="55" r="2"></circle>
                        <ellipse class="light bulb-white" cx="400" cy="61" rx="4" ry="6"></ellipse>
                        <circle class="light-fixture" cx="500" cy="40" r="2"></circle>
                        <ellipse class="light bulb-gold" cx="500" cy="46" rx="4" ry="6"></ellipse>
                        <circle class="light-fixture" cx="600" cy="62" r="2"></circle>
                        <ellipse class="light bulb-red" cx="600" cy="68" rx="4" ry="6"></ellipse>
                        <circle class="light-fixture" cx="700" cy="78" r="2"></circle>
                        <ellipse class="light bulb-green" cx="700" cy="84" rx="4" ry="6"></ellipse>
                        <circle class="light-fixture" cx="800" cy="52" r="2"></circle>
                        <ellipse class="light bulb-blue" cx="800" cy="58" rx="4" ry="6"></ellipse>
                        <circle class="light-fixture" cx="900" cy="38" r="2"></circle>
                        <ellipse class="light bulb-white" cx="900" cy="44" rx="4" ry="6"></ellipse>
                        <circle class="light-fixture" cx="1000" cy="65" r="2"></circle>
                        <ellipse class="light bulb-gold" cx="1000" cy="71" rx="4" ry="6"></ellipse>
                        <circle class="light-fixture" cx="1100" cy="80" r="2"></circle>
                        <ellipse class="light bulb-red" cx="1100" cy="86" rx="4" ry="6"></ellipse>
                    </g>
                </svg>
            `;

            const themeToggle = document.getElementById('theme-toggle');
            if (themeToggle && themeToggle.nextSibling) {
                themeToggle.parentNode.insertBefore(lightsContainer, themeToggle.nextSibling);
            } else {
                document.body.insertBefore(lightsContainer, document.body.firstChild);
            }
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', addLights);
        } else {
            addLights();
        }
    }

    // ============ SPRING THEME ============

    // Check if we're in the spring season date range
    function isSpringSeason() {
        const urlParams = new URLSearchParams(window.location.search);
        const themeParam = urlParams.get('theme');

        // If a specific theme is requested, only activate if it matches
        if (themeParam) {
            return themeParam === 'spring';
        }

        const now = new Date();
        const year = now.getFullYear();

        // Spring season: March 1 - May 31
        const startDate = new Date(year, 2, 1);   // Mar 1
        const endDate = new Date(year, 4, 31);    // May 31

        return now >= startDate && now <= endDate;
    }

    // Load the spring theme CSS
    function loadSpringTheme() {
        if (document.getElementById('spring-theme')) {
            return;
        }

        const link = document.createElement('link');
        link.id = 'spring-theme';
        link.rel = 'stylesheet';
        link.href = '/spring-theme.css';

        const mainStylesheet = document.querySelector('link[href*="style.min.css"]');
        if (mainStylesheet) {
            mainStylesheet.parentNode.insertBefore(link, mainStylesheet.nextSibling);
        } else {
            document.head.appendChild(link);
        }
    }

    // Update greeting to "Bloom!" during Spring
    function updateSpringGreeting() {
        const updateGreeting = () => {
            const greetingSpan = document.querySelector('h1 span[lang="no"]');
            if (greetingSpan) {
                greetingSpan.textContent = 'Bloom!';
                greetingSpan.setAttribute('lang', 'en');
            }

            const h1 = document.querySelector('h1');
            if (h1) {
                const walker = document.createTreeWalker(
                    h1,
                    NodeFilter.SHOW_TEXT,
                    null,
                    false
                );

                let node;
                while (node = walker.nextNode()) {
                    if (node.textContent.trim().startsWith(',')) {
                        node.textContent = node.textContent.replace(/^,\s*/, ' ');
                    }
                }
            }
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', updateGreeting);
        } else {
            updateGreeting();
        }
    }

    // ============ SUMMER THEME ============

    // Check if we're in the summer season date range
    function isSummerSeason() {
        const urlParams = new URLSearchParams(window.location.search);
        const themeParam = urlParams.get('theme');

        // If a specific theme is requested, only activate if it matches
        if (themeParam) {
            return themeParam === 'summer';
        }

        const now = new Date();
        const year = now.getFullYear();

        // Summer season: June 1 - August 31
        const startDate = new Date(year, 5, 1);   // Jun 1
        const endDate = new Date(year, 7, 31);    // Aug 31

        return now >= startDate && now <= endDate;
    }

    // Load the summer theme CSS
    function loadSummerTheme() {
        if (document.getElementById('summer-theme')) {
            return;
        }

        const link = document.createElement('link');
        link.id = 'summer-theme';
        link.rel = 'stylesheet';
        link.href = '/summer-theme.css';

        const mainStylesheet = document.querySelector('link[href*="style.min.css"]');
        if (mainStylesheet) {
            mainStylesheet.parentNode.insertBefore(link, mainStylesheet.nextSibling);
        } else {
            document.head.appendChild(link);
        }
    }

    // Update greeting to "Sunshine!" during Summer
    function updateSummerGreeting() {
        const updateGreeting = () => {
            const greetingSpan = document.querySelector('h1 span[lang="no"]');
            if (greetingSpan) {
                greetingSpan.textContent = 'Sunshine!';
                greetingSpan.setAttribute('lang', 'en');
            }

            const h1 = document.querySelector('h1');
            if (h1) {
                const walker = document.createTreeWalker(
                    h1,
                    NodeFilter.SHOW_TEXT,
                    null,
                    false
                );

                let node;
                while (node = walker.nextNode()) {
                    if (node.textContent.trim().startsWith(',')) {
                        node.textContent = node.textContent.replace(/^,\s*/, ' ');
                    }
                }
            }
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', updateGreeting);
        } else {
            updateGreeting();
        }
    }

    // ============ INITIALIZATION ============

    // Priority order: Christmas > Fall > Summer > Spring
    if (isChristmasSeason()) {
        loadChristmasTheme();
        updateChristmasGreeting();
        addChristmasLights();

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                document.body.dataset.christmas = 'true';
            });
        } else {
            document.body.dataset.christmas = 'true';
        }
    } else if (isFallSeason()) {
        loadFallTheme();

        if (isHalloweenPeriod()) {
            updateHalloweenGreeting();
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                document.body.dataset.fall = 'true';
                if (isHalloweenPeriod()) {
                    document.body.dataset.halloween = 'true';
                }
            });
        } else {
            document.body.dataset.fall = 'true';
            if (isHalloweenPeriod()) {
                document.body.dataset.halloween = 'true';
            }
        }
    } else if (isSummerSeason()) {
        loadSummerTheme();

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                document.body.dataset.summer = 'true';
            });
        } else {
            document.body.dataset.summer = 'true';
        }
    } else if (isSpringSeason()) {
        loadSpringTheme();

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                document.body.dataset.spring = 'true';
            });
        } else {
            document.body.dataset.spring = 'true';
        }
    }
})();
