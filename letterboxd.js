// config.js
const CONFIG = {
    LETTERBOXD_USERNAME: 'kartooner',
    MAX_RETRIES: 2,
    RETRY_DELAY: 1000,
};

// letterboxdService.js
class LetterboxdService {
    constructor() {
        // Using RapidAPI's RSS to JSON converter
        this.API_URL = 'https://api.rss2json.com/v1/api.json';
        this.API_KEY = 'YOUR_FREE_RSS2JSON_API_KEY'; // Get free API key from rss2json.com
    }

    async fetchReviews() {
        try {
            const response = await this.fetchWithRetry();

            if (!response.ok) {
                console.error('Response not OK:', response.status, response.statusText);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (!data.items) {
                console.error('Invalid data structure:', data);
                throw new Error('Invalid data received');
            }

            return this.parseReviews(data.items);
        } catch (error) {
            console.error('Fetch error:', error);
            throw error;
        }
    }

    async fetchWithRetry(retryCount = 0) {
        try {
            const params = new URLSearchParams({
                rss_url: `https://letterboxd.com/${CONFIG.LETTERBOXD_USERNAME}/rss/`,
                api_key: this.API_KEY,
                count: 3
            });

            return await fetch(`${this.API_URL}?${params}`);
        } catch (error) {
            if (retryCount < CONFIG.MAX_RETRIES) {
                await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY));
                return this.fetchWithRetry(retryCount + 1);
            }
            throw error;
        }
    }

    parseReviews(items) {
        try {
            return items
                .slice(0, 3)
                .map(item => ({
                    title: item.title || 'Untitled',
                    link: item.link || '#',
                    imageUrl: this.extractImageUrl(item.description),
                    date: new Date(item.pubDate)
                }))
                .filter(review => review.imageUrl);
        } catch (error) {
            console.error('Parse error:', error);
            throw error;
        }
    }

    extractImageUrl(description) {
        try {
            const imgMatch = description.match(/<img[^>]+src="([^">]+)"/);
            return imgMatch ? imgMatch[1] : null;
        } catch (error) {
            console.error('Image extraction error:', error);
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
                this.showError('No reviews found');
                return;
            }

            this.render(reviews);
        } catch (error) {
            console.error('Initialization error:', error);
            this.showError(error.message);
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
        Unable to load reviews. Please try again later.
        <br>
        <button onclick="location.reload()" class="retry-button">
          Retry
        </button>
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
              onerror="this.onerror=null; this.src='https://placehold.co/200x300/png?text=Movie'"
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

// Add styles
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

  .retry-button {
    margin-top: 1rem;
    padding: 0.5rem 1rem;
    background-color: #00b020;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
  }

  .retry-button:hover {
    background-color: #009018;
  }
`;
document.head.appendChild(style);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const reviews = new ReviewsUI('reviews-container');
    reviews.initialize();
});