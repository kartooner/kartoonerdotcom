/**
 * Christmas Theme Loader
 * Automatically loads christmas-theme.css during December
 * Updates greeting from "Hei Der" to "God Jul!" during Christmas season
 */

(function() {
    'use strict';

    // Check if we're in the Christmas date range
    function isChristmasSeason() {
        // Theme preview mode: add ?theme=christmas to URL
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('theme') === 'christmas') {
            return true;
        }

        const now = new Date();
        const year = now.getFullYear();

        // Christmas season: December 1 - December 31
        const startDate = new Date(year, 11, 1);  // Month 11 = December
        const endDate = new Date(year, 11, 31);

        return now >= startDate && now <= endDate;
    }

    // Load the Christmas theme CSS
    function loadChristmasTheme() {
        // Check if the stylesheet is already loaded
        if (document.getElementById('christmas-theme')) {
            return;
        }

        const link = document.createElement('link');
        link.id = 'christmas-theme';
        link.rel = 'stylesheet';
        link.href = '/christmas-theme.css';

        // Insert after the main stylesheet
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
                // Update the actual text content for screen readers
                greetingSpan.textContent = 'God Jul!';
                // Keep lang attribute as Norwegian
                greetingSpan.setAttribute('lang', 'no');
            }

            // Remove the comma after the greeting
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
            // Prevent duplicate lights
            if (document.querySelector('.christmas-lights')) {
                return;
            }

            // Create lights container
            const lightsContainer = document.createElement('div');
            lightsContainer.className = 'christmas-lights';
            lightsContainer.setAttribute('aria-hidden', 'true');

            // SVG with Christmas lights
            lightsContainer.innerHTML = `
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="100%" height="100%" viewBox="0 0 1200 120" preserveAspectRatio="xMidYMid meet">
                    <g>
                        <path class="lightrope" d="M0,60 Q100,35 200,58 Q300,75 400,55 Q500,40 600,62 Q700,78 800,52 Q900,38 1000,65 Q1100,80 1200,50"></path>

                        <!-- Light fixtures and bulbs (ellipse for narrow bulb shape) -->
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

            // Insert after the theme toggle button, in the same location as doodle lines
            const themeToggle = document.getElementById('theme-toggle');
            if (themeToggle && themeToggle.nextSibling) {
                themeToggle.parentNode.insertBefore(lightsContainer, themeToggle.nextSibling);
            } else {
                // Fallback: insert at start of body if theme toggle not found
                document.body.insertBefore(lightsContainer, document.body.firstChild);
            }
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', addLights);
        } else {
            addLights();
        }
    }

    // Initialize Christmas theme if in season
    if (isChristmasSeason()) {
        loadChristmasTheme();
        updateChristmasGreeting();
        addChristmasLights();

        // Add a data attribute to the body for potential CSS hooks
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                document.body.dataset.christmas = 'true';
            });
        } else {
            document.body.dataset.christmas = 'true';
        }
    }
})();
