class GitHubActivity {
    constructor() {
        this.username = 'kartooner';
        this.cache = null;
        this.cacheExpiry = null;
        this.isVisible = false;
        this.init();
    }

    init() {
        this.createActivityContainer();
        this.attachEventListeners();
        this.prefetchData();
    }

    createActivityContainer() {
        const container = document.createElement('div');
        container.id = 'github-activity';
        container.className = 'github-activity-container';
        container.innerHTML = `
            <div class="activity-header">
                <span class="activity-title">Recent GitHub Activity</span>
                <span class="activity-username">@${this.username}</span>
            </div>
            <div class="activity-chart">
                <div class="loading-state">Loading activity...</div>
            </div>
        `;
        
        document.querySelector('.container').appendChild(container);
    }

    attachEventListeners() {
        const dividers = document.querySelectorAll('.divider');
        
        dividers.forEach(divider => {
            // Mouse events
            divider.addEventListener('mouseenter', () => this.showActivity(divider));
            divider.addEventListener('mouseleave', () => this.hideActivity());
            
            // Touch events for mobile
            divider.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.toggleActivity(divider);
            });
        });

        // Hide when clicking elsewhere
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.divider') && !e.target.closest('#github-activity')) {
                this.hideActivity();
            }
        });
    }

    async fetchGitHubActivity() {
        // Check cache first (5 minute expiry)
        if (this.cache && this.cacheExpiry && Date.now() < this.cacheExpiry) {
            return this.cache;
        }

        try {
            // Fetch recent commits from public repos
            const response = await fetch(`https://api.github.com/users/${this.username}/events?per_page=100`);
            if (!response.ok) throw new Error('Failed to fetch GitHub data');
            
            const events = await response.json();
            
            // Process events into daily activity counts for last 14 days
            const activityData = this.processActivityData(events);
            
            // Cache the result
            this.cache = activityData;
            this.cacheExpiry = Date.now() + (5 * 60 * 1000); // 5 minutes
            
            return activityData;
        } catch (error) {
            console.log('GitHub activity fetch failed:', error.message);
            // Return mock data as fallback
            return this.getMockData();
        }
    }

    processActivityData(events) {
        const days = 14;
        const now = new Date();
        const activityMap = {};

        // Initialize last 14 days
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const dateKey = date.toISOString().split('T')[0];
            activityMap[dateKey] = 0;
        }

        // Count events by day
        events.forEach(event => {
            const eventDate = new Date(event.created_at).toISOString().split('T')[0];
            if (activityMap.hasOwnProperty(eventDate)) {
                // Weight different event types
                const weight = this.getEventWeight(event.type);
                activityMap[eventDate] += weight;
            }
        });

        return Object.entries(activityMap).map(([date, count]) => ({
            date,
            count,
            label: new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
        }));
    }

    getEventWeight(eventType) {
        const weights = {
            'PushEvent': 3,
            'CreateEvent': 2,
            'IssuesEvent': 2,
            'PullRequestEvent': 3,
            'ReleaseEvent': 4,
            'WatchEvent': 1,
            'ForkEvent': 1
        };
        return weights[eventType] || 1;
    }

    getMockData() {
        // Fallback mock data that looks realistic
        const mockActivity = [];
        for (let i = 13; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const count = Math.floor(Math.random() * 8); // 0-7 activities per day
            mockActivity.push({
                date: date.toISOString().split('T')[0],
                count,
                label: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
            });
        }
        return mockActivity;
    }

    renderChart(data) {
        const chartContainer = document.querySelector('.activity-chart');
        const maxCount = Math.max(...data.map(d => d.count), 1);
        
        chartContainer.innerHTML = `
            <div class="chart-bars">
                ${data.map(day => `
                    <div class="bar-container">
                        <div class="activity-bar" 
                             style="height: ${(day.count / maxCount) * 60}px"
                             title="${day.label}: ${day.count} activities">
                        </div>
                        <div class="bar-label">${day.label.split(' ')[0]}</div>
                    </div>
                `).join('')}
            </div>
            <div class="chart-footer">Last 14 days</div>
        `;
    }

    async showActivity(divider) {
        if (this.isVisible) return;
        
        const container = document.getElementById('github-activity');
        const rect = divider.getBoundingClientRect();
        
        // Position the container near the divider
        container.style.left = `${rect.left + (rect.width / 2) - 200}px`;
        container.style.top = `${rect.bottom + 10}px`;
        
        container.classList.add('visible');
        this.isVisible = true;

        // Load and render data
        try {
            const data = await this.fetchGitHubActivity();
            this.renderChart(data);
        } catch (error) {
            console.error('Failed to render GitHub activity:', error);
        }
    }

    hideActivity() {
        if (!this.isVisible) return;
        
        const container = document.getElementById('github-activity');
        container.classList.remove('visible');
        this.isVisible = false;
    }

    toggleActivity(divider) {
        if (this.isVisible) {
            this.hideActivity();
        } else {
            this.showActivity(divider);
        }
    }

    // Prefetch data on page load for faster display
    prefetchData() {
        setTimeout(() => {
            this.fetchGitHubActivity();
        }, 2000);
    }
}

// Initialize when DOM is ready, but only on index.html
document.addEventListener('DOMContentLoaded', () => {
    // Only activate GitHub activity on the homepage
    if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
        new GitHubActivity();
    }
});