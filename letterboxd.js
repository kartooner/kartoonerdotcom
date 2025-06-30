// letterboxdService.js
class LetterboxdService {
    constructor() {
        this.username = 'kartooner';
    }

    async fetchReviews() {
        try {
            // Using a simple and reliable proxy service
            const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://letterboxd.com/${this.username}/rss/`)}`;

            const response = await fetch(proxyUrl);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const xmlText = await response.text();
            return this.parseRSS(xmlText);
        } catch (error) {
            console.error('Fetch error:', error);
            throw error;
        }
    }

    parseRSS(xmlText) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlText, 'text/xml');
        const items = doc.querySelectorAll('item');

        return Array.from(items)
            .slice(0, 3)
            .map(item => {
                const description = item.querySelector('description').textContent;
                const imageMatch = description.match(/<img[^>]+src="([^">]+)"/);

                return {
                    title: item.querySelector('title').textContent,
                    link: item.querySelector('link').textContent,
                    imageUrl: imageMatch ? imageMatch[1] : null,
                    date: new Date(item.querySelector('pubDate').textContent)
                };
            })
            .filter(item => item.imageUrl);
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
                throw new Error('No reviews found');
            }

            this.render(reviews);
        } catch (error) {
            console.error('Failed to load reviews:', error);
            this.showError();
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

    showError() {
        this.container.innerHTML = `
      <div class="review-error">
        Unable to load reviews. 
        <button onclick="window.location.reload()" class="retry-button">
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
              alt="${review.title}" 
              loading="lazy"
              onerror="this.onerror=null; this.src='https://placehold.co/200x300/png?text=Movie'"
            >
            <div class="review-overlay">
              <h4 class="movie-title">${review.title}</h4>
              <div class="review-date">
                ${review.date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            })}
              </div>
              <a 
                href="${review.link}" 
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
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const reviews = new ReviewsUI('reviews-container');
    reviews.initialize();
});

// Add minimal required styles
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

  .review-error {
    text-align: center;
    padding: 2rem;
    color: #666;
  }

  .retry-button {
    display: block;
    margin: 1rem auto;
    padding: 0.5rem 1rem;
    background: #00b020;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  .retry-button:hover {
    background: #009018;
  }
`;
document.head.appendChild(style);