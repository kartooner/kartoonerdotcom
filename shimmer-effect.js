/**
 * Mouse-following shimmer effect for the top skills box
 * Creates a glass-like effect where the shimmer follows the cursor
 */
(function() {
    'use strict';
    
    // Only run on desktop devices
    function isDesktop() {
        return window.innerWidth >= 769 && !('ontouchstart' in window);
    }
    
    function initShimmerEffect() {
        if (!isDesktop()) return;
        
        const skillsBox = document.querySelector('.top-skills-box');
        if (!skillsBox) return;
        
        let isHovering = false;
        
        function updateShimmerPosition(e) {
            if (!isHovering) return;
            
            const rect = skillsBox.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            
            // Update CSS custom properties for the shimmer position
            skillsBox.style.setProperty('--shimmer-x', `${x}%`);
            skillsBox.style.setProperty('--shimmer-y', `${y}%`);
            
            // Update the background position of the ::before pseudo-element
            const shimmerElement = skillsBox;
            shimmerElement.style.background = `
                radial-gradient(circle, #2c9ecb1a, #a1177708),
                radial-gradient(circle at ${x}% ${y}%, 
                    rgba(255, 255, 255, 0.15) 0%, 
                    rgba(255, 255, 255, 0.05) 30%, 
                    rgba(255, 255, 255, 0) 70%
                )
            `;
            
            // For light theme, use different colors
            if (document.documentElement.getAttribute('data-theme') === 'light') {
                shimmerElement.style.background = `
                    radial-gradient(circle, rgba(0, 102, 204, 0.03), rgba(0, 102, 204, 0.01)),
                    radial-gradient(circle at ${x}% ${y}%, 
                        rgba(0, 102, 204, 0.2) 0%, 
                        rgba(0, 102, 204, 0.1) 30%, 
                        rgba(0, 102, 204, 0) 70%
                    )
                `;
            }
        }
        
        function handleMouseEnter() {
            isHovering = true;
            skillsBox.classList.add('mouse-following');
        }
        
        function handleMouseLeave() {
            isHovering = false;
            skillsBox.classList.remove('mouse-following');
            
            // Reset to original background
            skillsBox.style.background = '';
        }
        
        // Add event listeners
        skillsBox.addEventListener('mouseenter', handleMouseEnter);
        skillsBox.addEventListener('mouseleave', handleMouseLeave);
        skillsBox.addEventListener('mousemove', updateShimmerPosition);
        
        // Handle theme changes
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                // Small delay to ensure theme has switched
                setTimeout(() => {
                    if (isHovering) {
                        // Trigger a mouse move event to update colors
                        const rect = skillsBox.getBoundingClientRect();
                        const fakeEvent = new MouseEvent('mousemove', {
                            clientX: rect.left + rect.width / 2,
                            clientY: rect.top + rect.height / 2
                        });
                        updateShimmerPosition(fakeEvent);
                    }
                }, 50);
            });
        }
        
        // Handle window resize
        window.addEventListener('resize', () => {
            if (!isDesktop() && isHovering) {
                handleMouseLeave();
            }
        });
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initShimmerEffect);
    } else {
        initShimmerEffect();
    }
})();