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

        // Build filtered posts HTML
        const postsHtml = entries.map(entry => {
            const date = new Date(entry.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });

            // Calculate reading time (simple approximation from word count)
            const wordCount = entry.content.split(/\s+/).length;
            const readingTime = Math.ceil(wordCount / 225);
            const readingTimeText = readingTime === 1 ? '1 min read' : `${readingTime} min read`;

            return `
                <div class="post" style="margin-bottom: 3rem;">
                    <div class="post-date">
                        <a href="/entry/${entry.id}.html">#</a> • ${date} • ${readingTimeText} • Erik Sagen
                    </div>
                    <h2 class="post-title">
                        <a href="/entry/${entry.id}.html">${entry.title}</a>
                    </h2>
                    ${entry.subtitle ? `<div class="post-subtitle">${entry.subtitle}</div>` : ''}
                    <div class="post-content">
                        <p>${entry.excerpt}</p>
                        <p class="read-more">
                            <a href="/entry/${entry.id}.html">Read more →</a>
                        </p>
                    </div>
                </div>
            `;
        }).join('<hr class="divider" />');

        // Replace existing content
        const existingPosts = container.querySelectorAll('.post, .recent-posts');
        existingPosts.forEach(el => el.remove());

        const postsContainer = document.createElement('div');
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

        const existingPosts = container.querySelectorAll('.post, .recent-posts');
        existingPosts.forEach(el => el.remove());

        const divider = container.querySelector('hr.divider');
        if (divider) {
            divider.after(noResults);
        }
    }
})();
