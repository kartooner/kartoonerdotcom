/**
 * Fall Theme Loader
 * Loads fall-theme.css between October 1 and November 30
 * Shows "Boo!" Oct 20-31, then "Hei Der" for rest of fall season
 */

(function() {
    'use strict';

    // Check if we're in the fall theme date range
    function isFallSeason() {
        // Don't activate if Christmas theme is active
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('theme') === 'christmas') {
            return false;
        }

        // Theme preview mode: add ?theme=halloween to URL
        if (urlParams.get('theme') === 'halloween') {
            return true;
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
        // Check if the stylesheet is already loaded
        if (document.getElementById('fall-theme')) {
            return;
        }

        const link = document.createElement('link');
        link.id = 'fall-theme';
        link.rel = 'stylesheet';
        link.href = '/halloween-theme.css'; // Keep same filename for now

        // Insert after the main stylesheet
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
                // Update the actual text content for screen readers
                greetingSpan.textContent = 'Boo!';
                // Change lang attribute to English
                greetingSpan.setAttribute('lang', 'en');
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

    // Initialize fall theme if in season
    if (isFallSeason()) {
        loadFallTheme();

        // Only show "Boo!" during Halloween period (Oct 20-31)
        if (isHalloweenPeriod()) {
            updateHalloweenGreeting();
        }

        // Add a data attribute to the body for potential CSS hooks
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
    }
})();
