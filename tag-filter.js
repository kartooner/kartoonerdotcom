/**
 * Tag Filtering for Journal Pages
 * Filters journal posts by tag when ?tag= parameter is present in URL
 */

(function() {
    'use strict';

    const urlParams = new URLSearchParams(window.location.search);
    const tagFilter = urlParams.get('tag');

    if (!tagFilter) {
        return; // No tag filter, show default view
    }

    // Fetch journal entries and filter by tag
    fetch('/journal-entries.json')
        .then(response => response.json())
        .then(data => {
            const filteredEntries = data.entries.filter(entry =>
                entry.tags && entry.tags.includes(tagFilter)
            );

            if (filteredEntries.length > 0) {
                displayFilteredPosts(filteredEntries, tagFilter);
            } else {
                displayNoResults(tagFilter);
            }
        })
        .catch(error => console.error('Error loading journal entries:', error));

    function displayFilteredPosts(entries, tag) {
        const container = document.querySelector('.journal-container');
        const title = document.querySelector('.logo');

        if (!container || !title) return;

        // Update title
        title.innerHTML = `Journal <span style="font-size: 0.6em; color: var(--text-color);">/ #${tag}</span>`;

        // Add clear filter link
        const clearFilter = document.createElement('div');
        clearFilter.style.cssText = 'text-align: center; margin-bottom: 2rem;';
        clearFilter.innerHTML = `
            <a href="/journal" style="color: var(--skills-color); text-decoration: none; font-size: 0.9rem;">
                ← View all posts
            </a>
        `;
        title.after(clearFilter);

        // Sort entries by date (newest first)
        const sortedEntries = entries.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Build filtered posts HTML using recent-post-item style
        const postsHtml = sortedEntries.map(entry => {
            const snippet = entry.excerpt || entry.subtitle || '';

            return `
                <div class="recent-post-item">
                    <h3 class="recent-post-title"><a href="/entry/${entry.id}.html">${entry.title}</a></h3>
                    <p class="recent-post-snippet">${snippet}</p>
                    <a href="/entry/${entry.id}.html" class="recent-post-link" aria-label="Read more about ${entry.title}">Read more →</a>
                </div>
            `;
        }).join('');

        // Replace existing content
        const existingPosts = container.querySelectorAll('.post, .recent-posts, .journal-intro, .featured-post');
        existingPosts.forEach(el => el.remove());

        const postsContainer = document.createElement('div');
        postsContainer.className = 'recent-posts-grid';
        postsContainer.innerHTML = postsHtml;

        const divider = container.querySelector('hr.divider');
        if (divider) {
            divider.after(postsContainer);
        } else {
            const firstHr = container.querySelector('hr');
            if (firstHr) {
                firstHr.after(postsContainer);
            }
        }
    }

    function displayNoResults(tag) {
        const container = document.querySelector('.journal-container');
        const title = document.querySelector('.logo');

        if (!container || !title) return;

        title.innerHTML = `Journal <span style="font-size: 0.6em; color: var(--text-color);">/ #${tag}</span>`;

        const noResults = document.createElement('div');
        noResults.style.cssText = 'text-align: center; padding: 4rem 0;';
        noResults.innerHTML = `
            <p style="font-size: 1.2rem; color: var(--text-color); margin-bottom: 1rem;">
                No posts found with tag "#${tag}"
            </p>
            <a href="/journal" style="color: var(--accent-color); text-decoration: none;">
                ← View all posts
            </a>
        `;

        const existingPosts = container.querySelectorAll('.post, .recent-posts, .journal-intro, .featured-post');
        existingPosts.forEach(el => el.remove());

        const divider = container.querySelector('hr.divider');
        if (divider) {
            divider.after(noResults);
        }
    }
})();
