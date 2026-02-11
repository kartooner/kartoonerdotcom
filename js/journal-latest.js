// journal-latest.js - Fetch and display latest journal entry
class JournalUI {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.journalRssUrl = '/journal-feed.xml';
        this.profileUrl = '/journal';
    }

    async initialize() {
        this.showLoading();

        try {
            const response = await fetch(this.journalRssUrl, { cache: 'no-cache' });
            if (!response.ok) throw new Error('Failed to fetch journal RSS');
            const text = await response.text();
            const entries = this.parseRss(text).slice(0, 1); // Get only the latest entry
            if (entries.length > 0) {
                this.render(entries[0]);
                return;
            }
        } catch (error) {
            this.renderCta();
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

            // Extract plain text excerpt (remove HTML tags and CDATA)
            const textContent = content
                .replace(/<!\[CDATA\[/g, '')
                .replace(/\]\]>/g, '')
                .replace(/<[^>]+>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
            const excerpt = textContent.substring(0, 200) + (textContent.length > 200 ? '...' : '');

            return {
                title: (item.querySelector('title') || {}).textContent || 'Untitled',
                link: (item.querySelector('link') || {}).textContent || this.profileUrl,
                excerpt: description || excerpt,
                date: new Date(((item.querySelector('pubDate') || {}).textContent) || Date.now())
            };
        });
    }

    showLoading() {
        this.container.innerHTML = `
            <div class="article-loading" role="status" aria-label="Loading latest journal entry">
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
                    <h3><a href="${this.profileUrl}" target="_blank" rel="noopener noreferrer">Read my journal</a></h3>
                    <p class="article-meta">Visit my journal to see what I've been writing about.</p>
                </div>
            </div>
        `;
    }

    render(entry) {
        const formattedDate = entry.date instanceof Date ?
            entry.date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) :
            new Date(entry.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

        this.container.innerHTML = `
            <div class="article-entry">
                <div class="article-info">
                    <h3><a href="${entry.link}" rel="noopener noreferrer" aria-label="Read journal entry">${this.escapeHtml(entry.title)}</a></h3>
                    <p class="article-meta">Published ${formattedDate}</p>
                    ${entry.excerpt ? `<p class="article-excerpt">${this.escapeHtml(entry.excerpt)}</p>` : ''}
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
new JournalUI('journal-container').initialize();
