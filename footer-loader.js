// Footer loader - loads footer.html into the page
(function() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadFooter);
    } else {
        loadFooter();
    }

    function loadFooter() {
        const placeholder = document.getElementById('footer-placeholder');
        if (!placeholder) return;

        fetch('/footer.html')
            .then(response => {
                if (!response.ok) throw new Error('Footer not found');
                return response.text();
            })
            .then(html => {
                placeholder.outerHTML = html;
            })
            .catch(error => {
                console.error('Error loading footer:', error);
            });
    }
})();
