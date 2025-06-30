// config.js
const CONFIG = {
    LETTERBOXD_USERNAME: 'kartooner', // Hardcoded for production since it's public anyway
    RSS_URL: 'https://letterboxd.com/kartooner/rss/', // Direct RSS URL
    MAX_RETRIES: 2,
    RETRY_DELAY: 1000,
};

// letterboxdService.js
class LetterboxdService {
    constructor() {
        this.lastFetch = null;
    }

    async fetchReviews() {
        try {
            const response = await this.fetchWithRetry();
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.text();
            return this.parseReviews(data);
        } catch (error) {
            console.error('Fetch error:', error);
            throw error;
        }
    }

    async fetchWithRetry(retryCount = 0) {
        try {
            // Using RSSBox as a CORS-friendly proxy
            const proxyUrl = `https://rssbox.herokuapp.com/feed/${CONFIG.RSS_URL}`;
            return await fetch(proxyUrl);
        } catch (error) {
            if (retryCount < CONFIG.MAX_RETRIES) {
                await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY));
                return this.fetchWithRetry(retryCount + 1);
            }
            throw error;
        }
    }

    parseReviews(xmlData) {
        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlData, 'text/xml');

            if (xmlDoc.querySelector('parsererror')) {
                throw new Error('XML parsing failed');
            }

            const items = xmlDoc.querySelectorAll('item');
            if (!items.length) {
                throw new Error('No reviews found');
            }

            return Array.from(items)
                .slice(0, 3)
                .map(item => this.parseReviewItem(item))
                .filter(Boolean);
        } catch (error) {
            console.error('Parse error:', error);
            throw error;
        }
    }

    parseReviewItem(item) {
        try {
            const description = item.querySelector('description')?.textContent || '';
            const imgMatch = description.match(/<img src="([^"]+)"/);

            if (!imgMatch) {
                console.warn('No image found for review');
                return null;
            }

            return {
                title: item.querySelector('title')?.textContent?.trim() || 'Untitled',
                link: item.querySelector('link')?.textContent?.trim() || '#',
                imageUrl: imgMatch[1],
                date: new Date(item.querySelector('pubDate')?.textContent || Date.now())
            };
        } catch (error) {
            console.error('Review parsing error:', error);
            return null;
        }
    }
}

// reviewsUI.js
class ReviewsUI {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.service = new LetterboxdService();
    }

    async initialize() {
        try {
            this.showLoading();
            const reviews = await this.service.fetchReviews();

            if (!reviews || reviews.length === 0) {
                this.showError('No reviews available');
                return;
            }

            this.render(reviews);
        } catch (error) {
            this.showError('Unable to load reviews');
            console.error('Initialization error:', error);
        }
    }

    showLoading() {
        this.container.innerHTML = `
      <div class="loading">
        Loading latest watches...
        <div class="loading-spinner"></div>
      </div>
    `;
    }

    showError(message) {
        this.container.innerHTML = `
      <div class="review-error">
        ${message}. Please try again later.
      </div>
    `;
    }

    render(reviews) {
        this.container.innerHTML = reviews
            .map(review => `
        <article class="review-card">
          <div class="review-image">
            <img 
              src="${review.imageUrl}" 
              alt="${this.escapeHtml(review.title)}" 
              loading="lazy"
            >
            <div class="review-overlay">
              <h4 class="movie-title">${this.escapeHtml(review.title)}</h4>
              <div class="review-date">${this.formatDate(review.date)}</div>
              <a 
                href="${this.escapeHtml(review.link)}" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                View on Letterboxd →
              </a>
            </div>
          </div>
        </article>
      `)
            .join('');
    }

    formatDate(date) {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
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

// Add loading spinner CSS
const style = document.createElement('style');
style.textContent = `
  .loading {
    text-align: center;
    padding: 2rem;
    color: #666;
  }

  .loading-spinner {
    margin: 1rem auto;
    width: 40px;
    height: 40px;
    border: 3px solid #f3f3f3;
    border-top: 3px solid #00b020;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const reviews = new ReviewsUI('reviews-container');
    reviews.initialize();
});