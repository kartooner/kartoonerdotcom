// config.js
const CONFIG = {
    LETTERBOXD_USERNAME: process.env.LETTERBOXD_USERNAME || 'kartooner',
    CORS_PROXY: process.env.CORS_PROXY || 'https://cors-anywhere.herokuapp.com/',
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000,
    CACHE_DURATION: 1800000, // 30 minutes in milliseconds
};

// letterboxdService.js
class LetterboxdService {
    constructor() {
        this.cache = new Map();
    }

    async fetchReviews() {
        const cacheKey = `reviews_${CONFIG.LETTERBOXD_USERNAME}`;
        const cachedData = this.getFromCache(cacheKey);

        if (cachedData) {
            return cachedData;
        }

        const reviews = await this.fetchWithRetry();
        this.setCache(cacheKey, reviews);
        return reviews;
    }

    getFromCache(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < CONFIG.CACHE_DURATION) {
            return cached.data;
        }
        return null;
    }

    setCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    async fetchWithRetry(retryCount = 0) {
        try {
            const rssUrl = `https://letterboxd.com/${CONFIG.LETTERBOXD_USERNAME}/rss/`;
            const response = await fetch(CONFIG.CORS_PROXY + rssUrl, {
                headers: {
                    'Origin': window.location.origin
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.text();
            return this.parseReviews(data);
        } catch (error) {
            if (retryCount < CONFIG.MAX_RETRIES) {
                await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY));
                return this.fetchWithRetry(retryCount + 1);
            }
            throw new Error(`Failed to fetch reviews after ${CONFIG.MAX_RETRIES} attempts: ${error.message}`);
        }
    }

    parseReviews(xmlData) {
        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlData, 'text/xml');
            const items = xmlDoc.querySelectorAll('item');

            return Array.from(items)
                .slice(0, 3)
                .map(item => this.parseReviewItem(item))
                .filter(review => review !== null);
        } catch (error) {
            console.error('Error parsing XML:', error);
            return [];
        }
    }

    parseReviewItem(item) {
        try {
            const description = item.querySelector('description')?.textContent || '';
            const imgMatch = description.match(/<img src="([^"]+)"/);

            return {
                title: item.querySelector('title')?.textContent?.trim() || 'Untitled',
                link: item.querySelector('link')?.textContent?.trim() || '#',
                imageUrl: imgMatch ? imgMatch[1] : '',
                date: new Date(item.querySelector('pubDate')?.textContent || Date.now())
            };
        } catch (error) {
            console.error('Error parsing review item:', error);
            return null;
        }
    }
}

// reviewsUI.js
class ReviewsUI {
    constructor(containerId, service) {
        this.container = document.getElementById(containerId);
        this.service = service;
        this.isLoading = false;
    }

    async initialize() {
        try {
            this.showLoading();
            const reviews = await this.service.fetchReviews();
            this.render(reviews);
        } catch (error) {
            this.showError(error);
        } finally {
            this.hideLoading();
        }
    }

    showLoading() {
        this.isLoading = true;
        this.container.innerHTML = '<div class="loading">Loading reviews...</div>';
    }

    hideLoading() {
        this.isLoading = false;
    }

    showError(error) {
        console.error('Error:', error);
        this.container.innerHTML = `
      <div class="review-error">
        Unable to load reviews. Please try again later.
      </div>
    `;
    }

    formatDate(date) {
        try {
            return new Date(date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return 'Invalid Date';
        }
    }

    render(reviews) {
        if (!reviews.length) {
            this.container.innerHTML = '<div class="review-error">No recent reviews found</div>';
            return;
        }

        this.container.innerHTML = reviews
            .map(review => this.createReviewCard(review))
            .join('');
    }

    createReviewCard(review) {
        return `
      <article class="review-card">
        <div class="review-image">
          <img 
            src="${review.imageUrl}" 
            alt="${this.escapeHtml(review.title)}" 
            loading="lazy"
            onerror="this.src='fallback-image.jpg'"
          >
          <div class="review-overlay">
            <h4 class="movie-title">${this.escapeHtml(review.title)}</h4>
            <div class="review-date">${this.formatDate(review.date)}</div>
            <a 
              href="${this.escapeHtml(review.link)}" 
              target="_blank" 
              rel="noopener noreferrer"
              class="review-link"
            >
              View on Letterboxd →
            </a>
          </div>
        </div>
      </article>
    `;
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}

// main.js
document.addEventListener('DOMContentLoaded', () => {
    const letterboxdService = new LetterboxdService();
    const reviewsUI = new ReviewsUI('reviews-container', letterboxdService);
    reviewsUI.initialize();

    // Optional: Refresh reviews periodically
    setInterval(() => {
        if (document.visibilityState === 'visible') {
            reviewsUI.initialize();
        }
    }, CONFIG.CACHE_DURATION);
});