/**
 * Tag Filtering for the Journal page
 * The page already lists every entry (with its tags in data-tags), so a
 * ?tag= in the URL just hides the ones without it, plus any month or year
 * left empty.
 */

(function () {
    'use strict';

    const urlParams = new URLSearchParams(window.location.search);
    const tagFilter = (urlParams.get('tag') || '').trim().toLowerCase();

    if (!tagFilter) {
        return; // No tag filter, show default view
    }

    const archive = document.querySelector('.journal-archive');
    const title = document.querySelector('.logo');
    if (!archive || !title) return;

    let matches = 0;
    archive.querySelectorAll('.journal-item').forEach(item => {
        const tags = (item.dataset.tags || '').split(',');
        const match = tags.includes(tagFilter);
        item.hidden = !match;
        if (match) matches++;
    });

    archive.querySelectorAll('.journal-month, .journal-year').forEach(section => {
        section.hidden = !section.querySelector('.journal-item:not([hidden])');
    });

    // Escape tag to prevent XSS and update title
    const escapedTag = tagFilter.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    title.innerHTML = `Journal <span style="font-size: 0.6em; color: var(--text-color);">/ #${escapedTag}</span>`;
    document.title = `#${tagFilter} · Journal`;

    const note = document.createElement('p');
    note.className = 'journal-filter-note';
    note.innerHTML = matches
        ? `<a href="/journal">&larr; View all posts</a>`
        : `No posts found with tag "#${escapedTag}". <a href="/journal">&larr; View all posts</a>`;
    archive.before(note);
})();
