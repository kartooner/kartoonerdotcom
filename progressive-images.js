/**
 * Progressive Image Enhancement Loader
 * Serves different image resolutions based on device capabilities and network conditions
 * Provides graceful fallbacks and progressive enhancement
 */

class ProgressiveImageLoader {
    constructor() {
        this.isSlowConnection = this.detectSlowConnection();
        this.init();
    }

    /**
     * Detect if user is on a slow connection
     * Uses Network Information API with fallbacks
     */
    detectSlowConnection() {
        // Check Network Information API (modern browsers)
        if ('connection' in navigator) {
            const conn = navigator.connection;
            
            // Consider 2G, slow-2g, or low data savings mode as slow
            if (conn.effectiveType === '2g' || conn.effectiveType === 'slow-2g') {
                return true;
            }
            
            // Consider 3G with data saver enabled as slow
            if (conn.effectiveType === '3g' && conn.saveData) {
                return true;
            }
            
            // Consider very low downlink as slow (< 1 Mbps)
            if (conn.downlink && conn.downlink < 1) {
                return true;
            }
        }
        
        // Fallback: check if user has data saver enabled
        if ('connection' in navigator && navigator.connection.saveData) {
            return true;
        }
        
        // Default to false (assume fast connection)
        return false;
    }

    /**
     * Get appropriate image suffix based on device and connection
     */
    getImageSuffix(baseName) {
        const isMobile = window.innerWidth <= 768;
        const isRetina = window.devicePixelRatio >= 2;
        
        // For slow connections, prioritize smaller images
        if (this.isSlowConnection) {
            return isMobile ? '-mobile' : '-tablet';
        }
        
        // For fast connections, serve based on screen size and pixel density
        if (isMobile) {
            return isRetina ? '-mobile@2x' : '-mobile';
        } else if (window.innerWidth <= 1024) {
            return isRetina ? '-tablet@2x' : '-tablet';
        } else {
            return isRetina ? '-desktop@2x' : '-desktop';
        }
    }

    /**
     * Generate image variants object from base image path
     */
    generateImageVariants(basePath) {
        const parts = basePath.split('.');
        const extension = parts.pop();
        const nameWithPath = parts.join('.');
        
        return {
            mobile: `${nameWithPath}-mobile.${extension}`,
            mobileRetina: `${nameWithPath}-mobile@2x.${extension}`,
            tablet: `${nameWithPath}-tablet.${extension}`,
            tabletRetina: `${nameWithPath}-tablet@2x.${extension}`,
            desktop: `${nameWithPath}-desktop.${extension}`,
            desktopRetina: `${nameWithPath}-desktop@2x.${extension}`,
            original: basePath
        };
    }

    /**
     * Check if an image variant exists
     */
    async imageExists(url) {
        try {
            const response = await fetch(url, { method: 'HEAD' });
            return response.ok;
        } catch {
            return false;
        }
    }

    /**
     * Create responsive picture element
     */
    createResponsivePicture(src, alt = '', className = '') {
        const variants = this.generateImageVariants(src);
        
        // Create picture element
        const picture = document.createElement('picture');
        if (className) {
            picture.className = className;
        }
        
        // Mobile source (up to 768px)
        const mobileSource = document.createElement('source');
        mobileSource.media = '(max-width: 768px)';
        mobileSource.srcset = this.isSlowConnection 
            ? variants.mobile
            : `${variants.mobile} 1x, ${variants.mobileRetina} 2x`;
        
        // Tablet source (769px to 1024px)
        const tabletSource = document.createElement('source');
        tabletSource.media = '(max-width: 1024px)';
        tabletSource.srcset = this.isSlowConnection
            ? variants.tablet
            : `${variants.tablet} 1x, ${variants.tabletRetina} 2x`;
        
        // Desktop source (1025px+)
        const desktopSource = document.createElement('source');
        desktopSource.media = '(min-width: 1025px)';
        desktopSource.srcset = this.isSlowConnection
            ? variants.desktop
            : `${variants.desktop} 1x, ${variants.desktopRetina} 2x`;
        
        // Fallback img element
        const img = document.createElement('img');
        img.src = variants.original; // Fallback to original
        img.alt = alt;
        img.loading = 'lazy';
        
        // Progressive enhancement: if variants don't exist, fallback gracefully
        this.addFallbackLogic(picture, variants);
        
        // Assemble picture element
        picture.appendChild(mobileSource);
        picture.appendChild(tabletSource);  
        picture.appendChild(desktopSource);
        picture.appendChild(img);
        
        return picture;
    }

    /**
     * Add fallback logic for missing image variants
     */
    addFallbackLogic(pictureElement, variants) {
        const sources = pictureElement.querySelectorAll('source');
        const img = pictureElement.querySelector('img');
        
        // Listen for load errors and fallback to original
        sources.forEach(source => {
            source.addEventListener('error', () => {
                // If source fails, remove it to fallback to next source or img
                source.remove();
            });
        });
        
        // Ultimate fallback: if img fails, try original
        if (img) {
            img.addEventListener('error', () => {
                if (img.src !== variants.original) {
                    img.src = variants.original;
                }
            });
        }
    }

    /**
     * Replace existing img elements with progressive versions
     */
    enhanceExistingImages() {
        const images = document.querySelectorAll('img[data-progressive]');
        
        images.forEach(img => {
            const src = img.src || img.dataset.src;
            const alt = img.alt;
            const className = img.className;
            
            if (src) {
                const picture = this.createResponsivePicture(src, alt, className);
                img.parentNode.replaceChild(picture, img);
            }
        });
    }

    /**
     * Create a simple responsive img with srcset (for basic enhancement)
     */
    createSimpleResponsiveImg(src, alt = '', className = '') {
        const variants = this.generateImageVariants(src);
        const img = document.createElement('img');
        
        img.src = variants.original;
        img.alt = alt;
        if (className) img.className = className;
        img.loading = 'lazy';
        
        // Build srcset based on connection speed
        if (!this.isSlowConnection) {
            img.srcset = `
                ${variants.mobile} 480w,
                ${variants.mobileRetina} 960w,
                ${variants.tablet} 768w,
                ${variants.tabletRetina} 1536w,
                ${variants.desktop} 1200w,
                ${variants.desktopRetina} 2400w
            `.replace(/\s+/g, ' ').trim();
            
            img.sizes = `
                (max-width: 768px) 100vw,
                (max-width: 1024px) 768px,
                1200px
            `.replace(/\s+/g, ' ').trim();
        }
        
        return img;
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

        // Monitor connection changes (if supported)
        if ('connection' in navigator) {
            navigator.connection.addEventListener('change', () => {
                this.isSlowConnection = this.detectSlowConnection();
                // Could reload images with new strategy, but that might be jarring
                console.log('Connection changed. Slow connection:', this.isSlowConnection);
            });
        }
    }

    /**
     * Public method to create responsive images programmatically
     */
    static createResponsiveImage(src, alt = '', className = '', useSimple = false) {
        const loader = new ProgressiveImageLoader();
        return useSimple 
            ? loader.createSimpleResponsiveImg(src, alt, className)
            : loader.createResponsivePicture(src, alt, className);
    }
}

// Auto-initialize when script loads
const progressiveLoader = new ProgressiveImageLoader();

// Export for use in other scripts
window.ProgressiveImageLoader = ProgressiveImageLoader;