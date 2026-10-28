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

    // Local JPG/PNG images get their WebP version (made by scripts/optimize-images.js),
    // with the original as the fallback
    function imageHtml(src, alt, className) {
        var img = '<img src="' + escapeHtml(src) + '" alt="' + escapeHtml(alt) + '" class="' + className + '" data-progressive />';
        if (!/^(\.\.)?\/?assets\/images\/.+\.(jpe?g|png)$/i.test(src)) return img;
        var webp = src.replace(/\.(jpe?g|png)$/i, '.webp');
        return '<picture><source srcset="' + escapeHtml(webp) + '" type="image/webp">' + img + '</picture>';
    }

    function renderRecentLinks(links) {
        var grid = document.querySelector('#link-share .link-grid');
        if (!grid || !Array.isArray(links)) return;
        grid.innerHTML = '';

        links.forEach(function (item) {
            var card = document.createElement('div');
            card.className = 'link-card';
            card.innerHTML =
                imageHtml(item.thumbnail || '', item.alt || item.title || '', 'link-thumb') +
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
            imageHtml(book.thumbnail || '', book.alt || book.title || '', 'book-cover') +
            '<div class="book-info">' +
            '  <h3><a href="' + escapeHtml(book.url || '#') + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(book.title || '') + '</a></h3>' +
            '  <p class="book-author">by ' + escapeHtml(book.author || '') + '</p>' +
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

