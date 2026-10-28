// letterboxd.js — reads from build-time cached movie data
class ReviewsUI {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.cacheUrl = '/data/letterboxd-cache.json';
        this.profileUrl = 'https://letterboxd.com/kartooner/';
    }

    async initialize() {
        try {
            const response = await fetch(this.cacheUrl);
            if (!response.ok) throw new Error('Cache not found');
            const data = await response.json();
            const movies = Array.isArray(data.movies) ? data.movies : [];
            if (movies.length > 0) {
                this.render(movies.slice(0, 4));
            } else {
                this.renderCta();
            }
        } catch (error) {
            this.renderCta();
        }
    }

    renderCta() {
        this.container.innerHTML = `
            <article class="review-card">
                <a href="${this.profileUrl}" target="_blank" rel="noopener">
                    <div class="review-info">
                        <h3>See my latest reviews on Letterboxd</h3>
                    </div>
                </a>
            </article>
        `;
    }

    render(movies) {
        // Posters are optional extras, so skip them when the visitor has Data Saver on
        const showPosters = !(navigator.connection && navigator.connection.saveData);

        this.container.innerHTML = movies
            .map(movie => `
                <article class="review-card">
                    <a href="${this.safeUrl(movie.link, this.profileUrl)}" target="_blank" rel="noopener">
                        ${showPosters && this.safeUrl(movie.imageUrl) ? `<img src="${this.safeUrl(movie.imageUrl)}" alt="${this.escapeHtml(movie.title)}" loading="lazy">` : ''}
                        <div class="review-info">
                            <h3>${this.escapeHtml(movie.title)}</h3>
                            ${movie.stars ? `<span class="review-stars">${movie.stars}</span>` : ''}
                        </div>
                    </a>
                </article>
            `)
            .join('');
    }

    // Only http(s) URLs make it into href/src, escaped
    safeUrl(url, fallback) {
        return /^https?:\/\//i.test(url || '') ? this.escapeHtml(url) : fallback;
    }

    escapeHtml(text) {
        if (typeof text !== 'string') return '';
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}

new ReviewsUI('reviews-container').initialize();
