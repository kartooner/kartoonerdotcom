(function () {
    function escapeHtml(text) {
        if (typeof text !== 'string') return '';
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function renderRecentLinks(links) {
        var grid = document.querySelector('#link-share .link-grid');
        if (!grid || !Array.isArray(links)) return;
        grid.innerHTML = '';

        links.forEach(function (item) {
            var card = document.createElement('div');
            card.className = 'link-card';
            card.innerHTML =
                '<img src="' + escapeHtml(item.thumbnail || '') + '" alt="' + escapeHtml(item.alt || item.title || '') + '" class="link-thumb" data-progressive />' +
                '<div class="link-info">' +
                '  <h3>' +
                '    <a href="' + escapeHtml(item.url || '#') + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(item.title || '') + '</a>' +
                '  </h3>' +
                '  <p>' + escapeHtml(item.description || '') + '</p>' +
                '</div>';
            grid.appendChild(card);
        });
    }

    function renderCurrentlyReading(book) {
        var entry = document.querySelector('#reading .book-entry');
        if (!entry || !book) return;

        entry.innerHTML =
            '<img src="' + escapeHtml(book.thumbnail || '') + '" alt="' + escapeHtml(book.alt || book.title || '') + '" class="book-cover" data-progressive />' +
            '<div class="book-info">' +
            '  <h3><a href="' + escapeHtml(book.url || '#') + '" target="_blank" rel="noopener noreferrer" aria-label="View ' + escapeHtml(book.title || '') + '">' + escapeHtml(book.title || '') + '</a> by ' + escapeHtml(book.author || '') + '</h3>' +
            '  <p>' + escapeHtml(book.review || '') + '</p>' +
            '  <div class="books-callout">' +
            '    <p><strong>UX Reading:</strong> Want to see what else I\'ve enjoyed? <a href="/recommended-books">Check out my recommended books</a> for further reading.</p>' +
            '  </div>' +
            '</div>';
    }

    function init() {
        fetch('/data/content.json', { cache: 'no-cache' })
            .then(function (response) { return response.json(); })
            .then(function (data) {
                try { renderRecentLinks(data.recentLinks); } catch (e) { /* no-op */ }
                try { renderCurrentlyReading(data.currentlyReading); } catch (e) { /* no-op */ }
            })
            .catch(function () { /* leave fallback HTML */ });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

// Darkwing Duck interactive animation
document.addEventListener('DOMContentLoaded', function () {
    const darkwingSprite = document.querySelector('.darkwing-sprite');

    if (darkwingSprite) {
        function triggerLookAnimation() {
            // Prevent multiple animations at once
            if (darkwingSprite.classList.contains('looking')) {
                return;
            }

            // Add animation class
            darkwingSprite.classList.add('looking');

            // Remove class after animation completes
            setTimeout(() => {
                darkwingSprite.classList.remove('looking');
            }, 800); // Match animation duration
        }

        // Add click/tap event listeners
        darkwingSprite.addEventListener('click', triggerLookAnimation);
        darkwingSprite.addEventListener('touchstart', function (e) {
            e.preventDefault(); // Prevent double-tap zoom
            triggerLookAnimation();
        });

        // Add keyboard support (Enter and Space)
        darkwingSprite.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                triggerLookAnimation();
            }
        });
    }
});
