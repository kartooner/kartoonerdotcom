// reviews.js
class ReviewsUI {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent('https://letterboxd.com/kartooner/rss/');
    }

    async initialize() {
        try {
            this.showLoading();
            const response = await fetch(this.proxyUrl);
            const text = await response.text();

            const parser = new DOMParser();
            const xml = parser.parseFromString(text, 'text/xml');

            const reviews = Array.from(xml.querySelectorAll('item'))
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
                .filter(review => review.imageUrl);

            this.render(reviews);
        } catch (error) {
            console.error('Error:', error);
            this.showError();
        }
    }

    showLoading() {
        this.container.innerHTML = '<div class="loading">Loading...</div>';
    }

    showError() {
        this.container.innerHTML = '<div class="error">Unable to load reviews. Please try again later.</div>';
    }

    render(reviews) {
        this.container.innerHTML = reviews
            .map(review => `
                <article class="review-card">
                    <a href="${review.link}" target="_blank" rel="noopener">
                        <img src="${review.imageUrl}" alt="${review.title}">
                        <div class="review-info">
                            <h3>${review.title}</h3>
                            <time>${review.date.toLocaleDateString()}</time>
                        </div>
                    </a>
                </article>
            `)
            .join('');
    }
}

// Initialize
new ReviewsUI('reviews-container').initialize();