/**
 * Simple Progressive Image Loader with Skeleton Loading
 * Creates a smooth loading experience with animated skeletons
 * No need for multiple image variants - just better UX!
 */

class ProgressiveImageLoader {
    constructor() {
        this.addSkeletonStyles();
        this.init();
    }

    /**
     * Add CSS for skeleton loading animation
     */
    addSkeletonStyles() {
        if (document.querySelector('#progressive-image-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'progressive-image-styles';
        style.textContent = `
            .image-skeleton {
                position: relative;
                overflow: hidden;
                background: linear-gradient(90deg, 
                    var(--skeleton-bg, #f0f0f0) 25%, 
                    var(--skeleton-shimmer, #e0e0e0) 50%, 
                    var(--skeleton-bg, #f0f0f0) 75%);
                background-size: 200% 100%;
                animation: skeleton-shimmer 1.5s infinite;
                border-radius: 4px;
            }
            
            [data-theme="dark"] .image-skeleton {
                --skeleton-bg: rgba(255, 255, 255, 0.1);
                --skeleton-shimmer: rgba(255, 255, 255, 0.15);
            }
            
            @keyframes skeleton-shimmer {
                0% { background-position: -200% 0; }
                100% { background-position: 200% 0; }
            }
            
            .progressive-img {
                transition: opacity 0.3s ease;
                opacity: 0;
            }
            
            .progressive-img.loaded {
                opacity: 1;
            }
            
            .progressive-img.error {
                opacity: 1;
                filter: grayscale(1) brightness(0.8);
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Create skeleton placeholder that matches image dimensions
     */
    createSkeleton(img, fallbackWidth = '100%', fallbackHeight = '200px') {
        const skeleton = document.createElement('div');
        skeleton.className = 'image-skeleton';
        
        // Try to match the image's dimensions
        const computedStyle = window.getComputedStyle(img);
        skeleton.style.width = computedStyle.width || fallbackWidth;
        skeleton.style.height = computedStyle.height || fallbackHeight;
        skeleton.style.minHeight = '200px'; // Ensure minimum height for blog images
        
        return skeleton;
    }

    /**
     * Enhanced image loading with skeleton and error handling
     */
    enhanceImage(img) {
        if (!img.src) return;
        
        // Create a wrapper div that exactly contains the image
        const wrapper = document.createElement('div');
        wrapper.style.position = 'relative';
        wrapper.style.display = 'inline-block';
        wrapper.style.width = img.style.width || '100%';
        wrapper.style.height = 'auto';
        
        // Create skeleton that matches the image
        const skeleton = document.createElement('div');
        skeleton.className = 'image-skeleton';
        skeleton.style.position = 'absolute';
        skeleton.style.top = '0';
        skeleton.style.left = '0';
        skeleton.style.width = '100%';
        skeleton.style.height = '100%';
        skeleton.style.zIndex = '1';
        skeleton.style.pointerEvents = 'none';
        
        // Wrap the image
        img.parentNode.insertBefore(wrapper, img);
        wrapper.appendChild(img);
        wrapper.appendChild(skeleton);
        
        // Add progressive class and hide image initially
        img.classList.add('progressive-img');
        
        // Store original src and create loader
        const originalSrc = img.src;
        const loader = new Image();
        
        loader.onload = () => {
            // Image loaded successfully - show it
            img.classList.add('loaded');
            
            // Remove skeleton after transition
            setTimeout(() => {
                if (skeleton.parentNode) {
                    skeleton.remove();
                }
            }, 300);
        };
        
        loader.onerror = () => {
            // Image failed to load - show error state
            img.classList.add('error');
            
            // Update skeleton to show error
            skeleton.style.background = 'repeating-linear-gradient(45deg, rgba(255,0,0,0.1), rgba(255,0,0,0.1) 10px, transparent 10px, transparent 20px)';
            skeleton.style.animation = 'none';
            
            // Remove skeleton after showing error
            setTimeout(() => {
                if (skeleton.parentNode) {
                    skeleton.remove();
                }
            }, 1000);
        };
        
        // Start loading with a small delay to show skeleton
        setTimeout(() => {
            loader.src = originalSrc;
        }, 100);
        
        console.log('Progressive Images: Enhanced image with skeleton wrapper:', originalSrc);
    }

    /**
     * Process all images marked for progressive loading
     */
    enhanceExistingImages() {
        const images = document.querySelectorAll('img[data-progressive]');
        
        console.log(`Progressive Images: Found ${images.length} images to enhance with skeletons`);
        
        images.forEach(img => {
            // Remove the marker attribute
            img.removeAttribute('data-progressive');
            
            // Add lazy loading if not already present
            if (!img.hasAttribute('loading')) {
                img.loading = 'lazy';
            }
            
            // Enhance with skeleton loading
            this.enhanceImage(img);
        });
    }

    /**
     * Initialize the progressive image loader
     */
    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.enhanceExistingImages();
            });
        } else {
            this.enhanceExistingImages();
        }
        
        // Watch for new images added dynamically
        if (window.MutationObserver) {
            const observer = new MutationObserver(mutations => {
                mutations.forEach(mutation => {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1) { // Element node
                            const newImages = node.querySelectorAll ? 
                                node.querySelectorAll('img[data-progressive]') : 
                                [];
                            newImages.forEach(img => {
                                img.removeAttribute('data-progressive');
                                this.enhanceImage(img);
                            });
                        }
                    });
                });
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }
    }

    /**
     * Public method to manually enhance an image
     */
    static enhanceImage(img) {
        const loader = new ProgressiveImageLoader();
        loader.enhanceImage(img);
    }
}

// Auto-initialize when script loads
const progressiveLoader = new ProgressiveImageLoader();

// Export for use in other scripts
window.ProgressiveImageLoader = ProgressiveImageLoader;