// medium.js - Fetch and display latest Medium article
class MediumUI {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.mediumRssUrl = 'https://medium.com/feed/@kartooner';
        // Multiple CORS proxies to try in sequence
        this.proxies = [
            'https://api.allorigins.win/raw?url=',
            'https://corsproxy.io/?',
            'https://api.codetabs.com/v1/proxy?quest='
        ];
        this.fallbackJsonUrl = '/data/medium-fallback.json';
        this.profileUrl = 'https://medium.com/@kartooner';
        this.fetchTimeoutMs = 6000;
    }

    async initialize() {
        this.showLoading();

        // Try each proxy in sequence
        for (let i = 0; i < this.proxies.length; i++) {
            try {
                const proxyUrl = this.proxies[i] + encodeURIComponent(this.mediumRssUrl);
                const text = await this.fetchWithTimeout(proxyUrl, { timeout: this.fetchTimeoutMs });
                const articles = this.parseRss(text).slice(0, 1); // Get only the latest article
                if (articles.length > 0) {
                    this.render(articles[0]);
                    return;
                }
            } catch (error) {
                // Try next proxy
                continue;
            }
        }

        // If all proxies failed, try fallback JSON
        try {
            await this.loadFallback();
        } catch (fallbackError) {
            this.renderCta();
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
            const content = (item.querySelector('content\\:encoded') || item.querySelector('description') || {}).textContent || '';

            // Extract first image from content
            const imageMatch = content.match(/<img[^>]+src="([^">]+)"/);

            // Extract plain text excerpt (remove HTML tags)
            const textContent = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
            const excerpt = textContent.substring(0, 200) + (textContent.length > 200 ? '...' : '');

            // Get categories/tags
            const categories = Array.from(item.querySelectorAll('category')).map(cat => cat.textContent);

            return {
                title: (item.querySelector('title') || {}).textContent || 'Untitled',
                link: (item.querySelector('link') || {}).textContent || this.profileUrl,
                imageUrl: imageMatch ? imageMatch[1] : null,
                excerpt: excerpt,
                categories: categories,
                date: new Date(((item.querySelector('pubDate') || {}).textContent) || Date.now())
            };
        });
    }

    async loadFallback() {
        const response = await fetch(this.fallbackJsonUrl, { cache: 'no-cache' });
        if (!response.ok) throw new Error('Fallback JSON missing');
        const data = await response.json();
        const article = data.article || data;
        this.render({
            title: article.title || 'Latest Article',
            link: article.link || this.profileUrl,
            imageUrl: article.imageUrl || '',
            excerpt: article.excerpt || '',
            categories: article.categories || [],
            date: article.date ? new Date(article.date) : new Date()
        });
    }

    showLoading() {
        this.container.innerHTML = `
            <div class="article-loading" role="status" aria-label="Loading latest Medium article">
                <div class="spinner" aria-hidden="true">
                    <div class="double-bounce1"></div>
                    <div class="double-bounce2"></div>
                </div>
            </div>`;
    }

    renderCta() {
        this.container.innerHTML = `
            <div class="article-entry">
                <div class="article-info">
                    <h3><a href="${this.profileUrl}" target="_blank" rel="noopener noreferrer">Read my latest articles on Medium</a></h3>
                    <p class="article-meta">Visit my Medium profile to see what I've been writing about.</p>
                </div>
            </div>
        `;
    }

    render(article) {
        const formattedDate = article.date instanceof Date ?
            article.date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) :
            new Date(article.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

        this.container.innerHTML = `
            <div class="article-entry">
                ${article.imageUrl ? `
                    <img src="${article.imageUrl}" 
                         alt="${this.escapeHtml(article.title)}" 
                         class="article-image"
                         loading="lazy" />
                ` : ''}
                <div class="article-info">
                    <h3><a href="${article.link}" target="_blank" rel="noopener noreferrer" aria-label="Read article on Medium">${this.escapeHtml(article.title)}</a></h3>
                    <p class="article-meta">Published ${formattedDate}</p>
                    ${article.excerpt ? `<p class="article-excerpt">${this.escapeHtml(article.excerpt)}</p>` : ''}
                </div>
            </div>
        `;
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
new MediumUI('medium-container').initialize();
