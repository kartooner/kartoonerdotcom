/**
 * Tag Filtering for Journal Pages
 * Filters journal posts by tag when ?tag= parameter is present in URL
 */

(function () {
    'use strict';

    const urlParams = new URLSearchParams(window.location.search);
    const tagFilter = urlParams.get('tag');

    if (!tagFilter) {
        return; // No tag filter, show default view
    }

    // Fetch journal entries and filter by tag
    fetch('/data/journal-entries.json')
        .then(response => response.json())
        .then(data => {
            const lowerTag = tagFilter.toLowerCase();
            const filteredEntries = data.entries.filter(entry =>
                entry.tags && entry.tags.some(t => t.toLowerCase() === lowerTag)
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

        // Escape tag to prevent XSS and update title
        const escapedTag = tag.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        title.innerHTML = `Journal <span style="font-size: 0.6em; color: var(--text-color);">/ #${escapedTag}</span>`;

        // Add clear filter link
        const clearFilter = document.createElement('div');
        clearFilter.className = 'animate-fade-in';
        clearFilter.style.cssText = 'text-align: center; margin-bottom: 2rem; animation-delay: 0.2s;';
        clearFilter.innerHTML = `
            <a href="/journal" style="color: var(--accent-color); text-decoration: none; font-size: 0.9rem; font-weight: 500;">
                ← View all posts
            </a>
        `;
        title.after(clearFilter);

        // Sort entries by date (newest first)
        const sortedEntries = entries.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Build filtered posts HTML using recent-post-item style
        const postsHtml = sortedEntries.map((entry, index) => {
            const snippet = entry.excerpt || entry.subtitle || '';
            const delay = 0.3 + (index * 0.1);

            return `
                <div class="recent-post-item animate-fade-in" style="animation-delay: ${delay}s">
                    <h3 class="recent-post-title"><a href="/entry/${entry.id}.html">${entry.title}</a></h3>
                    <p class="recent-post-snippet">${snippet}</p>
                    <a href="/entry/${entry.id}.html" class="recent-post-link" aria-label="Read more about ${entry.title}">Read more →</a>
                </div>
            `;
        }).join('');

        // Clean up existing content properly
        const topDivider = container.querySelector('hr.divider');
        const elementsToRemove = container.querySelectorAll('.post, .recent-posts, .journal-intro, .featured-post, hr.divider');
        elementsToRemove.forEach(el => {
            if (el !== topDivider) el.remove();
        });

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

        const escapedTag = tag.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        title.innerHTML = `Journal <span style="font-size: 0.6em; color: var(--text-color);">/ #${escapedTag}</span>`;

        const noResults = document.createElement('div');
        noResults.className = 'animate-fade-in';
        noResults.style.cssText = 'text-align: center; padding: 4rem 0;';
        noResults.innerHTML = `
            <p style="font-size: 1.2rem; color: var(--text-color); margin-bottom: 2rem;">
                No posts found with tag "#${escapedTag}"
            </p>
            <a href="/journal" style="color: var(--accent-color); text-decoration: none; font-weight: 500; border: 1px solid var(--accent-color); padding: 0.5rem 1rem; border-radius: 4px;">
                ← View all posts
            </a>
        `;

        // Clean up existing content properly
        const topDivider = container.querySelector('hr.divider');
        const elementsToRemove = container.querySelectorAll('.post, .recent-posts, .journal-intro, .featured-post, hr.divider');
        elementsToRemove.forEach(el => {
            if (el !== topDivider) el.remove();
        });

        if (topDivider) {
            topDivider.after(noResults);
        } else {
            container.appendChild(noResults);
        }
    }
})();
