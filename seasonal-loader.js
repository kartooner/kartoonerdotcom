/**
 * Seasonal Theme Loader
 * Loads consolidated seasonal themes and activates based on current date
 * All themes are in one CSS file, switched via data attributes on <body>
 */

(function() {
    'use strict';

    // Load the consolidated seasonal themes CSS file once
    function loadSeasonalThemesCSS() {
        if (document.getElementById('seasonal-themes')) {
            console.log('🎄 Seasonal themes CSS already loaded');
            return;
        }

        const link = document.createElement('link');
        link.id = 'seasonal-themes';
        link.rel = 'stylesheet';
        link.href = '/seasonal-themes.css';

        const mainStylesheet = document.querySelector('link[href*="style.css"]') || document.querySelector('link[rel="stylesheet"]');
        if (mainStylesheet) {
            mainStylesheet.parentNode.insertBefore(link, mainStylesheet.nextSibling);
            console.log('🎄 Loaded seasonal-themes.css after main stylesheet');
        } else {
            document.head.appendChild(link);
            console.log('🎄 Loaded seasonal-themes.css at end of head');
        }
    }

    // Load the CSS file immediately
    loadSeasonalThemesCSS();

    // ============ FALL/HALLOWEEN THEME ============

    // Check if we're in the fall theme date range
    function isFallSeason() {
        const urlParams = new URLSearchParams(window.location.search);
        const themeParam = urlParams.get('theme');

        // If a specific theme is requested, only activate if it matches
        if (themeParam) {
            return themeParam === 'halloween' || themeParam === 'fall';
        }

        const now = new Date();
        const year = now.getFullYear();

        // Fall season: October 1 - November 30
        const startDate = new Date(year, 9, 1);   // Oct 1
        const endDate = new Date(year, 10, 30);   // Nov 30

        return now >= startDate && now <= endDate;
    }

    // Check if we're specifically in Halloween (for "Boo!" greeting)
    function isHalloweenPeriod() {
        const now = new Date();
        const year = now.getFullYear();

        // Halloween period: October 20 - October 31
        const startDate = new Date(year, 9, 20);  // Oct 20
        const endDate = new Date(year, 9, 31);    // Oct 31

        return now >= startDate && now <= endDate;
    }


    // Update greeting to "Boo!" during Halloween period only
    function updateHalloweenGreeting() {
        const updateGreeting = () => {
            const greetingSpan = document.querySelector('h1 span[lang="no"]');
            if (greetingSpan) {
                greetingSpan.textContent = 'Boo!';
                greetingSpan.setAttribute('lang', 'en');
            }

            const h1 = document.querySelector('h1');
            if (h1) {
                const walker = document.createTreeWalker(
                    h1,
                    NodeFilter.SHOW_TEXT,
                    null,
                    false
                );

                let node;
                while (node = walker.nextNode()) {
                    if (node.textContent.trim().startsWith(',')) {
                        node.textContent = node.textContent.replace(/^,\s*/, ' ');
                    }
                }
            }
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', updateGreeting);
        } else {
            updateGreeting();
        }
    }

    // ============ CHRISTMAS THEME ============

    // Check if we're in the Christmas date range
    function isChristmasSeason() {
        const urlParams = new URLSearchParams(window.location.search);
        const themeParam = urlParams.get('theme');

        // If a specific theme is requested, only activate if it matches
        if (themeParam) {
            return themeParam === 'christmas';
        }

        const now = new Date();
        const year = now.getFullYear();

        // Christmas season: December 1 - December 31
        const startDate = new Date(year, 11, 1);
        const endDate = new Date(year, 11, 31);

        return now >= startDate && now <= endDate;
    }


    // Update greeting to "God Jul!" during Christmas season
    function updateChristmasGreeting() {
        const updateGreeting = () => {
            const greetingSpan = document.querySelector('h1 span[lang="no"]');
            if (greetingSpan) {
                greetingSpan.textContent = 'God Jul!';
                greetingSpan.setAttribute('lang', 'no');
            }

            const h1 = document.querySelector('h1');
            if (h1) {
                const walker = document.createTreeWalker(
                    h1,
                    NodeFilter.SHOW_TEXT,
                    null,
                    false
                );

                let node;
                while (node = walker.nextNode()) {
                    if (node.textContent.trim().startsWith(',')) {
                        node.textContent = node.textContent.replace(/^,\s*/, ' ');
                    }
                }
            }
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', updateGreeting);
        } else {
            updateGreeting();
        }
    }

    // Add Christmas lights SVG to the page
    function addChristmasLights() {
        const addLights = () => {
            if (document.querySelector('.christmas-lights')) {
                return;
            }

            const lightsContainer = document.createElement('div');
            lightsContainer.className = 'christmas-lights';
            lightsContainer.setAttribute('aria-hidden', 'true');

            lightsContainer.innerHTML = `
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="100%" height="100%" viewBox="0 0 1200 120" preserveAspectRatio="xMidYMid meet">
                    <g>
                        <path class="lightrope" d="M0,60 Q100,35 200,58 Q300,75 400,55 Q500,40 600,62 Q700,78 800,52 Q900,38 1000,65 Q1100,80 1200,50"></path>
                        <circle class="light-fixture" cx="100" cy="35" r="2"></circle>
                        <ellipse class="light bulb-red" cx="100" cy="41" rx="4" ry="6"></ellipse>
                        <circle class="light-fixture" cx="200" cy="58" r="2"></circle>
                        <ellipse class="light bulb-green" cx="200" cy="64" rx="4" ry="6"></ellipse>
                        <circle class="light-fixture" cx="300" cy="75" r="2"></circle>
                        <ellipse class="light bulb-blue" cx="300" cy="81" rx="4" ry="6"></ellipse>
                        <circle class="light-fixture" cx="400" cy="55" r="2"></circle>
                        <ellipse class="light bulb-white" cx="400" cy="61" rx="4" ry="6"></ellipse>
                        <circle class="light-fixture" cx="500" cy="40" r="2"></circle>
                        <ellipse class="light bulb-gold" cx="500" cy="46" rx="4" ry="6"></ellipse>
                        <circle class="light-fixture" cx="600" cy="62" r="2"></circle>
                        <ellipse class="light bulb-red" cx="600" cy="68" rx="4" ry="6"></ellipse>
                        <circle class="light-fixture" cx="700" cy="78" r="2"></circle>
                        <ellipse class="light bulb-green" cx="700" cy="84" rx="4" ry="6"></ellipse>
                        <circle class="light-fixture" cx="800" cy="52" r="2"></circle>
                        <ellipse class="light bulb-blue" cx="800" cy="58" rx="4" ry="6"></ellipse>
                        <circle class="light-fixture" cx="900" cy="38" r="2"></circle>
                        <ellipse class="light bulb-white" cx="900" cy="44" rx="4" ry="6"></ellipse>
                        <circle class="light-fixture" cx="1000" cy="65" r="2"></circle>
                        <ellipse class="light bulb-gold" cx="1000" cy="71" rx="4" ry="6"></ellipse>
                        <circle class="light-fixture" cx="1100" cy="80" r="2"></circle>
                        <ellipse class="light bulb-red" cx="1100" cy="86" rx="4" ry="6"></ellipse>
                    </g>
                </svg>
            `;

            const themeToggle = document.getElementById('theme-toggle');
            if (themeToggle && themeToggle.nextSibling) {
                themeToggle.parentNode.insertBefore(lightsContainer, themeToggle.nextSibling);
            } else {
                document.body.insertBefore(lightsContainer, document.body.firstChild);
            }
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', addLights);
        } else {
            addLights();
        }
    }

    // ============ NEW YEAR'S THEME ============

    // Check if we're in the New Year's date range
    function isNewYearSeason() {
        const urlParams = new URLSearchParams(window.location.search);
        const themeParam = urlParams.get('theme');

        // If a specific theme is requested, only activate if it matches
        if (themeParam) {
            return themeParam === 'newyear';
        }

        const now = new Date();
        const year = now.getFullYear();

        // New Year's season: January 1 - March 20
        const startDate = new Date(year, 0, 1);   // Jan 1
        const endDate = new Date(year, 2, 20);    // Mar 20

        return now >= startDate && now <= endDate;
    }


    // Add 3D disco ball animation for New Year's theme (replaces joystick icon in footer)
    //
    // Performance: Uses Three.js WebGL rendering for GPU acceleration
    // Accessibility:
    // - Marked with aria-hidden="true" (purely decorative)
    // - Respects prefers-reduced-motion setting
    // - Dynamically stops/resumes if motion preference changes
    async function addDiscoBall() {
        const addBall = async () => {
            try {
                // Respect user's motion preferences
                const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                if (prefersReducedMotion) {
                    console.log('🎊 Reduced motion preferred, skipping disco ball animation');
                    return;
                }

                if (document.querySelector('#discoBallCanvas')) {
                    console.log('🎊 Disco ball already exists');
                    return;
                }

                console.log('🎊 Loading Three.js disco ball...');

            // Dynamically import Three.js
            const THREE = await import('https://cdn.skypack.dev/three@0.133.1/build/three.module');
            const BufferGeometryUtils = await import('https://cdn.skypack.dev/three@0.133.1/examples/jsm/utils/BufferGeometryUtils.js');

            console.log('🎊 Three.js loaded successfully');

            // Wait for footer to load
            const waitForFooter = () => {
                return new Promise((resolve) => {
                    const checkFooter = () => {
                        const footerIcon = document.querySelector('.footer-icon');
                        if (footerIcon) {
                            resolve(footerIcon);
                        } else {
                            setTimeout(checkFooter, 100);
                        }
                    };
                    checkFooter();
                });
            };

            const footerIcon = await waitForFooter();

            // Create canvas container to replace footer icon
            const canvasContainer = document.createElement('div');
            canvasContainer.id = 'discoBallContainer';
            canvasContainer.style.position = 'relative';
            canvasContainer.style.display = 'flex';
            canvasContainer.style.justifyContent = 'center';
            canvasContainer.style.alignItems = 'center';
            canvasContainer.setAttribute('aria-hidden', 'true');

            // Responsive sizing
            const isMobile = window.innerWidth <= 768;
            const canvasSize = isMobile ? 60 : 80;
            canvasContainer.style.width = canvasSize + 'px';
            canvasContainer.style.height = canvasSize + 'px';

            // Create canvas
            const canvas = document.createElement('canvas');
            canvas.id = 'discoBallCanvas';
            canvasContainer.appendChild(canvas);

            // Replace footer icon with disco ball
            footerIcon.innerHTML = '';
            footerIcon.appendChild(canvasContainer);

            console.log('🎊 Canvas created and added to DOM');

            // Setup Three.js scene
            const renderer = new THREE.WebGLRenderer({
                alpha: true,
                antialias: true,
                canvas: canvas
            });
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            renderer.setSize(canvasSize, canvasSize);

            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 10);
            camera.position.z = 2;

            // Load matcap texture and create disco ball
            new THREE.TextureLoader().load(
                'https://assets.codepen.io/959327/matcap-crystal.png',
                (texture) => {
                    const discoBall = createDiscoBall(THREE, BufferGeometryUtils, texture);
                    scene.add(discoBall);

                    // Animation loop with motion preference check
                    let animationFrameId;
                    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

                    const animate = () => {
                        if (!motionQuery.matches) {
                            animationFrameId = requestAnimationFrame(animate);
                            discoBall.rotation.y += 0.005;
                            discoBall.rotation.x += 0.002;
                            renderer.render(scene, camera);
                        }
                    };

                    // Listen for motion preference changes
                    motionQuery.addEventListener('change', (e) => {
                        if (e.matches) {
                            // User enabled reduced motion - stop animation
                            if (animationFrameId) {
                                cancelAnimationFrame(animationFrameId);
                            }
                            console.log('🎊 Reduced motion enabled, stopping disco ball');
                        } else {
                            // User disabled reduced motion - resume animation
                            console.log('🎊 Reduced motion disabled, resuming disco ball');
                            animate();
                        }
                    });

                    animate();
                }
            );

            function createDiscoBall(THREE, BufferGeometryUtils, texture) {
                const dummy = new THREE.Object3D();
                const mirrorMaterial = new THREE.MeshMatcapMaterial({ matcap: texture });

                // Use icosahedron for disco ball shape
                let geometryOriginal = new THREE.IcosahedronGeometry(0.5, 3);
                geometryOriginal.deleteAttribute('normal');
                geometryOriginal.deleteAttribute('uv');
                geometryOriginal = BufferGeometryUtils.mergeVertices(geometryOriginal);
                geometryOriginal.computeVertexNormals();

                const mirrorSize = 0.11;
                const mirrorGeometry = new THREE.PlaneGeometry(mirrorSize, mirrorSize);
                let instancedMirrorMesh = new THREE.InstancedMesh(
                    mirrorGeometry,
                    mirrorMaterial,
                    geometryOriginal.attributes.position.count
                );

                const positions = geometryOriginal.attributes.position.array;
                const normals = geometryOriginal.attributes.normal.array;
                for (let i = 0; i < positions.length; i += 3) {
                    dummy.position.set(positions[i], positions[i + 1], positions[i + 2]);
                    dummy.lookAt(
                        positions[i] + normals[i],
                        positions[i + 1] + normals[i + 1],
                        positions[i + 2] + normals[i + 2]
                    );
                    dummy.updateMatrix();
                    instancedMirrorMesh.setMatrixAt(i / 3, dummy.matrix);
                }

                const obj = new THREE.Group();
                const innerGeometry = geometryOriginal.clone();
                const ballInnerMaterial = new THREE.MeshBasicMaterial({ color: 0x1a1714 });
                const innerMesh = new THREE.Mesh(innerGeometry, ballInnerMaterial);
                obj.add(innerMesh, instancedMirrorMesh);

                return obj;
            }

            console.log('🎊 Disco ball created successfully!');
            } catch (error) {
                console.error('🎊 Error creating disco ball:', error);
            }
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', addBall);
        } else {
            addBall();
        }
    }

    // ============ SPRING THEME ============

    // Check if we're in the spring season date range
    function isSpringSeason() {
        const urlParams = new URLSearchParams(window.location.search);
        const themeParam = urlParams.get('theme');

        // If a specific theme is requested, only activate if it matches
        if (themeParam) {
            return themeParam === 'spring';
        }

        const now = new Date();
        const year = now.getFullYear();

        // Spring season: March 21 - May 31 (updated to start after New Year's theme ends)
        const startDate = new Date(year, 2, 21);   // Mar 21
        const endDate = new Date(year, 4, 31);     // May 31

        return now >= startDate && now <= endDate;
    }


    // Update greeting to "Bloom!" during Spring
    function updateSpringGreeting() {
        const updateGreeting = () => {
            const greetingSpan = document.querySelector('h1 span[lang="no"]');
            if (greetingSpan) {
                greetingSpan.textContent = 'Bloom!';
                greetingSpan.setAttribute('lang', 'en');
            }

            const h1 = document.querySelector('h1');
            if (h1) {
                const walker = document.createTreeWalker(
                    h1,
                    NodeFilter.SHOW_TEXT,
                    null,
                    false
                );

                let node;
                while (node = walker.nextNode()) {
                    if (node.textContent.trim().startsWith(',')) {
                        node.textContent = node.textContent.replace(/^,\s*/, ' ');
                    }
                }
            }
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', updateGreeting);
        } else {
            updateGreeting();
        }
    }

    // ============ SUMMER THEME ============

    // Check if we're in the summer season date range
    function isSummerSeason() {
        const urlParams = new URLSearchParams(window.location.search);
        const themeParam = urlParams.get('theme');

        // If a specific theme is requested, only activate if it matches
        if (themeParam) {
            return themeParam === 'summer';
        }

        const now = new Date();
        const year = now.getFullYear();

        // Summer season: June 1 - August 31
        const startDate = new Date(year, 5, 1);   // Jun 1
        const endDate = new Date(year, 7, 31);    // Aug 31

        return now >= startDate && now <= endDate;
    }


    // Update greeting to "Sunshine!" during Summer
    function updateSummerGreeting() {
        const updateGreeting = () => {
            const greetingSpan = document.querySelector('h1 span[lang="no"]');
            if (greetingSpan) {
                greetingSpan.textContent = 'Sunshine!';
                greetingSpan.setAttribute('lang', 'en');
            }

            const h1 = document.querySelector('h1');
            if (h1) {
                const walker = document.createTreeWalker(
                    h1,
                    NodeFilter.SHOW_TEXT,
                    null,
                    false
                );

                let node;
                while (node = walker.nextNode()) {
                    if (node.textContent.trim().startsWith(',')) {
                        node.textContent = node.textContent.replace(/^,\s*/, ' ');
                    }
                }
            }
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', updateGreeting);
        } else {
            updateGreeting();
        }
    }

    // ============ INITIALIZATION ============

    // Check for active seasonal theme (dates don't overlap, so order doesn't affect logic)
    // Chronological order: New Year's (Jan 1-Mar 20) > Spring (Mar 21-May 31) > Summer (Jun 1-Aug 31) > Fall (Oct 1-Nov 30) > Christmas (Dec 1-31)
    if (isNewYearSeason()) {
        console.log('✨ New Year\'s season detected! Activating New Year\'s theme...');
        addDiscoBall();
        document.documentElement.dataset.newyear = 'true';
        console.log('✨ Set data-newyear="true" on html element');
    } else if (isSpringSeason()) {
        document.documentElement.dataset.spring = 'true';
    } else if (isSummerSeason()) {
        document.documentElement.dataset.summer = 'true';
    } else if (isFallSeason()) {
        if (isHalloweenPeriod()) {
            updateHalloweenGreeting();
        }
        document.documentElement.dataset.fall = 'true';
        if (isHalloweenPeriod()) {
            document.documentElement.dataset.halloween = 'true';
        }
    } else if (isChristmasSeason()) {
        console.log('🎄 Christmas season detected! Activating Christmas theme...');
        updateChristmasGreeting();
        addChristmasLights();
        document.documentElement.dataset.christmas = 'true';
        console.log('🎄 Set data-christmas="true" on html element');
    }
})();
