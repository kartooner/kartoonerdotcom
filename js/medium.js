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
        this.cacheUrl = '/data/medium-cache.json'; // written by scripts/fetch-medium.js
        this.fallbackJsonUrl = '/data/medium-fallback.json';
        this.profileUrl = 'https://medium.com/@kartooner';
        this.fetchTimeoutMs = 6000;
        this.liveCheckTimeoutMs = 4000;
    }

    async initialize() {
        // Show the cached article right away, then quietly look for a newer one
        const cached = await this.loadCache();
        if (cached) {
            this.render(cached);
            this.whenIdle(() => this.checkForNewer(cached));
            return;
        }

        // No cache: fetch the live feed through the proxies
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

    async loadCache() {
        try {
            const response = await fetch(this.cacheUrl, { cache: 'no-cache' });
            if (!response.ok) return null;
            const data = await response.json();
            return data.article ? this.toArticle(data.article) : null;
        } catch (error) {
            return null;
        }
    }

    // One proxy, short timeout; the cached article stays if anything fails.
    // Skipped with Data Saver on, since the cached article is good enough.
    async checkForNewer(cached) {
        if (navigator.connection && navigator.connection.saveData) return;

        try {
            const proxyUrl = this.proxies[0] + encodeURIComponent(this.mediumRssUrl);
            const text = await this.fetchWithTimeout(proxyUrl, { timeout: this.liveCheckTimeoutMs });
            const latest = this.parseRss(text)[0];
            if (latest && latest.date > cached.date) {
                this.render(latest);
            }
        } catch (error) {
            // Keep the cached article
        }
    }

    whenIdle(callback) {
        if ('requestIdleCallback' in window) {
            requestIdleCallback(callback, { timeout: 5000 });
        } else {
            setTimeout(callback, 2000);
        }
    }

    toArticle(article) {
        return {
            title: article.title || 'Latest Article',
            link: article.link || this.profileUrl,
            excerpt: article.excerpt || '',
            categories: article.categories || [],
            date: article.date ? new Date(article.date) : new Date()
        };
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
            // querySelector can't match the namespaced content:encoded tag in an XML document
            const content = (item.getElementsByTagName('content:encoded')[0] || item.querySelector('description') || {}).textContent || '';

            // Medium opens a post with its subtitle as a heading; use that when it's there,
            // otherwise the first 200 characters of plain text
            const subtitleMatch = content.match(/^\s*<h[2-4][^>]*>([\s\S]*?)<\/h[2-4]>/);
            const toText = html => new DOMParser().parseFromString(html, 'text/html').body.textContent.replace(/\s+/g, ' ').trim();
            const textContent = toText(content.replace(/<[^>]+>/g, ' '));
            const excerpt = subtitleMatch
                ? toText(subtitleMatch[1])
                : textContent.substring(0, 200) + (textContent.length > 200 ? '...' : '');

            // Get categories/tags
            const categories = Array.from(item.querySelectorAll('category')).map(cat => cat.textContent);

            return {
                title: (item.querySelector('title') || {}).textContent || 'Untitled',
                link: (item.querySelector('link') || {}).textContent || this.profileUrl,
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
        this.render(this.toArticle(data.article || data));
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

        // Text only, like the journal column beside it, so the section stays even
        this.container.innerHTML = `
            <div class="article-entry">
                <div class="article-info">
                    <h3><a href="${this.safeUrl(article.link, this.profileUrl)}" target="_blank" rel="noopener noreferrer">${this.escapeHtml(article.title)}</a></h3>
                    <p class="article-meta">Published ${formattedDate}</p>
                    ${article.excerpt ? `<p class="article-excerpt">${this.escapeHtml(article.excerpt)}</p>` : ''}
                </div>
            </div>
        `;
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

// Initialize
new MediumUI('medium-container').initialize();
