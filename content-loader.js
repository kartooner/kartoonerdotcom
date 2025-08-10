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
        '<img src="' + escapeHtml(item.thumbnail || '') + '" alt="' + escapeHtml(item.alt || item.title || '') + '" class="link-thumb" />' +
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
      '<img src="' + escapeHtml(book.thumbnail || '') + '" alt="' + escapeHtml(book.alt || book.title || '') + '" class="book-cover" />' +
      '<div class="book-info">' +
      '  <h3><a href="' + escapeHtml(book.url || '#') + '" target="_blank" rel="noopener noreferrer" aria-label="View ' + escapeHtml(book.title || '') + '">' + escapeHtml(book.title || '') + '</a> by ' + escapeHtml(book.author || '') + '</h3>' +
      '  <p>' + escapeHtml(book.review || '') + '</p>' +
      '</div>';
  }

  function init() {
    fetch('content.json', { cache: 'no-cache' })
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