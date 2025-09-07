// reviews.js
class ReviewsUI {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent('https://letterboxd.com/kartooner/rss/');
        this.fallbackJsonUrl = 'letterboxd-fallback.json';
        this.profileUrl = 'https://letterboxd.com/kartooner/';
        this.fetchTimeoutMs = 6000;
    }

    async initialize() {
        this.showLoading();
        try {
            const text = await this.fetchWithTimeout(this.proxyUrl, { timeout: this.fetchTimeoutMs });
            const reviews = this.parseRss(text).slice(0, 3).filter(r => r.imageUrl);
            if (reviews.length > 0) {
                this.render(reviews);
                return;
            }
            // If RSS parsed but no items/images, try fallback JSON
            await this.loadFallback();
        } catch (error) {
            // Network or parse error: attempt fallback JSON, else CTA
            try {
                await this.loadFallback();
            } catch (fallbackError) {
                this.renderCta();
            }
        }
    }

    async fetchWithTimeout(url, { timeout = 5000 } = {}) {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        try {
            const response = await fetch(url, { signal: controller.signal });
            if (!response.ok) throw new Error('HTTP ' + response.status);
            return await response.text();
        } finally {
            clearTimeout(id);
        }
    }

    parseRss(text) {
        const parser = new DOMParser();
        const xml = parser.parseFromString(text, 'text/xml');
        const parseError = xml.querySelector('parsererror');
        if (parseError) throw new Error('RSS parse error');
        return Array.from(xml.querySelectorAll('item')).map(item => {
            const description = (item.querySelector('description') || {}).textContent || '';
            const imageMatch = description.match(/<img[^>]+src="([^">]+)"/);
            return {
                title: (item.querySelector('title') || {}).textContent || 'Untitled',
                link: (item.querySelector('link') || {}).textContent || this.profileUrl,
                imageUrl: imageMatch ? imageMatch[1] : null,
                date: new Date(((item.querySelector('pubDate') || {}).textContent) || Date.now())
            };
        });
    }

    async loadFallback() {
        const response = await fetch(this.fallbackJsonUrl, { cache: 'no-cache' });
        if (!response.ok) throw new Error('Fallback JSON missing');
        const data = await response.json();
        const items = Array.isArray(data) ? data : (Array.isArray(data.reviews) ? data.reviews : []);
        if (!items.length) throw new Error('Fallback JSON empty');
        const reviews = items.slice(0, 3).map(item => ({
            title: item.title || 'Letterboxd',
            link: item.link || this.profileUrl,
            imageUrl: item.imageUrl || '',
            date: item.date ? new Date(item.date) : new Date()
        }));
        this.render(reviews);
    }

    showLoading() {
        this.container.innerHTML = '<div class="reviews-loading">Loading latest watches...</div>';
    }

    renderCta() {
        this.container.innerHTML = `
            <article class="review-card">
                <a href="${this.profileUrl}" target="_blank" rel="noopener">
                    <div class="review-info">
                        <h3>See my latest reviews on Letterboxd</h3>
                        <time>${new Date().toLocaleDateString()}</time>
                    </div>
                </a>
            </article>
        `;
    }

    render(reviews) {
        this.container.innerHTML = reviews
            .map(review => `
                <article class="review-card">
                    <a href="${review.link}" target="_blank" rel="noopener">
                        ${review.imageUrl ? `<img src="${review.imageUrl}" alt="${this.escapeHtml(review.title)}">` : ''}
                        <div class="review-info">
                            <h3>${this.escapeHtml(review.title)}</h3>
                            <time>${review.date instanceof Date ? review.date.toLocaleDateString() : new Date(review.date).toLocaleDateString()}</time>
                        </div>
                    </a>
                </article>
            `)
            .join('');
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

// Initialize
new ReviewsUI('reviews-container').initialize();