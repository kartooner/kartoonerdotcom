    import * as THREE from 'three';
    import { initUI, updateUI } from './ui.js';

    const container = document.getElementById('footer-canvas');
    const gameContainer = document.getElementById('game-container');

    // Prevent pinch zoom on mobile
    document.addEventListener('gesturestart', e => e.preventDefault());
    document.addEventListener('gesturechange', e => e.preventDefault());
    document.addEventListener('gestureend', e => e.preventDefault());

    // Prevent double-tap zoom (but allow barrel roll in game area)
    let lastTouchEnd = 0;
    document.addEventListener('touchend', e => {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300 && !gameContainer.contains(e.target)) {
            e.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
    const isMobile = window.innerWidth < 768;
    const isEdge = /Edg/.test(navigator.userAgent); // Detect Edge browser

    // Game state
    let highScore = parseInt(localStorage.getItem('paperPlaneHighScore') || '0');
    let currentLevel = 1;
    let crashMessage = '';
    let crashMessageTimer = 0;
    let levelUpMessage = '';
    let levelUpMessageTimer = 0;
    let score = 0; // Points from collecting rings
    let bonusFadeTimer = 0; // Timer for fading bonus display

    // Checkpoint system
    let nextCheckpoint = 25; // First checkpoint at 25 miles (gives clean 10-mile onboarding)
    let checkpointActive = false;
    let ringsSpawnedForCheckpoint = false; // Track if rings spawned before this checkpoint
    let isFirstCheckpoint = true; // First checkpoint gives free upgrade

    // Grace period and shield mechanics
    let gracePeriodActive = false;
    let gracePeriodEndTime = 0;
    let previousGracePeriodActive = false; // Track state changes to avoid unnecessary material updates
    let shieldActive = false; // Start without shields - must be purchased
    let shieldHits = 0;
    const maxShieldHits = 2;

    // Health system
    let currentHealth = 4;
    const maxHealth = 4;

    // Lives system (3 lives per run)
    let currentLives = 3;
    const maxLives = 3;
    let checkpointHistory = []; // Track last 3 checkpoints for regression

    // Anti-camping detection (prevent staying in one spot)
    let campingDetected = false;
    let campingTimer = 0;
    let lastCampCheckPosition = { x: 0, y: 0 };
    const campingDetectionThreshold = 480; // 8 seconds at 60fps (reduced from 15s for more aggressive anti-camping)
    const campingPositionThreshold = 1.0; // Movement radius to count as "camping" (reduced from 1.5 for stricter detection)

    // Hidden dynamic difficulty system (completely invisible to player)
    let difficultyScalar = 1.0; // Starting scalar (0.85-1.15 range)
    let gameStartTime = 0; // Track when game actually starts
    const warmupDuration = 75000; // 75 seconds warm-up (60-90s range)
    const difficultyWindow = 25000; // 25 second rolling window for metrics

    // Rolling window for difficulty metrics
    const difficultyMetrics = {
        collisions: [], // {time, happened}
        ringAttempts: [], // {time, success}
        healthSamples: [], // {time, health}
        lastHitTime: 0
    };

    // Debug mode via F3 key (Minecraft-style)
    let DEBUG_ENABLED = false; // Toggle with F3 key

    let debugMetrics = {
        fps: 0,
        frameCount: 0,
        lastFrameTime: performance.now(),
        avgFrameTime: 0,
        minFps: Infinity,
        maxFps: 0,
        difficultyScalar: 1.0,
        performance: {
            renderTime: 0,
            collisionChecks: 0,
            activeObjects: 0,
            pooledObjects: 0
        }
    };

    // Debug overlay (Minecraft-style F3 debug screen) - Press F3 to toggle
    let debugOverlay = null;
    function createDebugOverlay() {
        if (debugOverlay) {
            console.log('Debug overlay already exists');
            return; // Already created
        }
        debugOverlay = document.createElement('div');
        debugOverlay.id = 'debug-overlay';
        debugOverlay.style.position = 'fixed';
        debugOverlay.style.bottom = '10px';
        debugOverlay.style.left = '10px';
        debugOverlay.style.background = 'rgba(0, 0, 0, 0.9)';
        debugOverlay.style.color = '#ffffff';
        debugOverlay.style.fontFamily = "'Courier New', monospace";
        debugOverlay.style.fontSize = '12px';
        debugOverlay.style.padding = '10px';
        debugOverlay.style.lineHeight = '1.6';
        debugOverlay.style.zIndex = '999999';
        debugOverlay.style.pointerEvents = 'none';
        debugOverlay.style.border = '2px solid rgba(255, 255, 255, 0.5)';
        debugOverlay.style.display = 'none';
        debugOverlay.style.minWidth = '200px';
        debugOverlay.innerHTML = 'Debug overlay created...';
        // Append to game container instead of body to avoid CSS hiding
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
            gameContainer.appendChild(debugOverlay);
        } else {
            document.body.appendChild(debugOverlay);
        }
        console.log('Debug overlay created and appended');
        console.log('Overlay element:', debugOverlay);
        console.log('Overlay parent:', debugOverlay.parentElement);
    }

    function toggleDebugOverlay() {
        createDebugOverlay();
        DEBUG_ENABLED = !DEBUG_ENABLED;

        console.log('Before toggle - DEBUG_ENABLED:', DEBUG_ENABLED);
        console.log('Before toggle - display:', debugOverlay.style.display);

        if (DEBUG_ENABLED) {
            debugOverlay.style.display = 'block';
            debugOverlay.style.visibility = 'visible';
            debugOverlay.style.opacity = '1';
        } else {
            debugOverlay.style.display = 'none';
        }

        console.log('After toggle - display:', debugOverlay.style.display);
        console.log('After toggle - visibility:', debugOverlay.style.visibility);
        console.log('After toggle - opacity:', debugOverlay.style.opacity);

        // Get computed styles to see what's actually applied
        const computed = window.getComputedStyle(debugOverlay);
        console.log('Computed display:', computed.display);
        console.log('Computed visibility:', computed.visibility);
        console.log('Computed position:', computed.position);
        console.log('Computed zIndex:', computed.zIndex);
        console.log('Computed bottom:', computed.bottom);
        console.log('Computed left:', computed.left);
    }

    // Upgrade loss system (risk/reward mechanic)
    let buildingHitsSinceUpgrade = 0;
    let hitsUntilUpgradeLoss = 0;
    let activeUpgrades = []; // Track order of upgrades acquired (for removal)
    let hasActiveUpgrades = false;

    // Abilities system
    const abilities = {
        thrusters: {
            name: 'Add Thrusters',
            cost: 150,
            owned: false,
            description: 'Increases flight speed for faster travel'
        },
        randomColor: {
            name: 'Random Color',
            cost: 100,
            owned: false,
            description: 'Changes your plane to a random color'
        },
        changeShape: {
            name: 'Change Plane Shape',
            cost: 200,
            owned: false,
            description: 'Morphs your plane into a different primitive form'
        },
        smallPlane: {
            name: 'Small Plane',
            cost: 175,
            owned: false,
            description: 'Shrinks your plane for tighter maneuvers'
        },
        coinMagnet: {
            name: 'Coin Magnet',
            cost: 250,
            owned: false,
            description: 'Auto-collect nearby coins for 90 seconds'
        },
        barrelRollUpgrade: {
            name: 'Barrel Roll',
            cost: 400,
            owned: false,
            description: 'Unlock barrel roll ability with double-click'
        },
        increaseDifficulty: {
            name: 'Increase Difficulty',
            cost: 500,
            owned: false,
            description: 'More buildings spawn, fewer rings appear'
        },
        invincibility: {
            name: 'Invincibility',
            cost: 250,
            owned: false,
            description: 'Become invincible for 2 minutes - flash yellow like Mario'
        },
        shields: {
            name: 'Shields',
            cost: 200,
            owned: false,
            description: 'Adds 2-hit shield protection - collect green capsules to restore'
        }
    };

    // Laser system
    const lasers = [];
    const enemies = [];
    let canShoot = false;
    let lastShot = 0;

    // Invincibility system
    let invincibilityActive = false;
    let invincibilityEndTime = 0;
    let invincibilityPulsePhase = 0;

    // Coin magnet timer system (time-limited ability)
    let coinMagnetActive = false;
    let coinMagnetEndTime = 0;
    const coinMagnetRadius = 5.0; // Auto-collect coins within this radius

    // Laser timer system (lasers are time-limited like invincibility) - DEPRECATED but keeping for compatibility
    let lasersActive = false;
    let lasersEndTime = 0;

    const scene = new THREE.Scene();
    // Simpler fog for better performance
    // Dark CRT green background so ground shadow is visible
    const bgColor = 0x000f00; // Very dark green (nearly black)
    scene.background = new THREE.Color(bgColor);
    scene.fog = new THREE.Fog(bgColor, 15, 45);

    // Adjust FOV and camera position based on device and orientation
    const isPortrait = window.innerHeight > window.innerWidth;
    const cameraFOV = isMobile ? (isPortrait ? 85 : 75) : 70; // Consistent wider FOV for better spatial awareness
    const cameraZ = isMobile && isPortrait ? 10 : 8; // Pull back camera on portrait mobile

    const camera = new THREE.PerspectiveCamera(cameraFOV, container.clientWidth / container.clientHeight, 0.1, 400);
    camera.position.set(0, 2.5, cameraZ);

    const renderer = new THREE.WebGLRenderer({
        antialias: false, // Disabled for crisp 80s aesthetic
        alpha: true,
        powerPreference: 'high-performance', // Request high-performance GPU
        precision: isEdge ? 'mediump' : 'highp', // Lower precision for Edge performance
        preserveDrawingBuffer: false, // Better mobile performance
        stencil: false, // Disable stencil buffer for mobile performance
        depth: true // Keep depth buffer for 3D rendering
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    // Clamp pixel ratio - lower for Edge, max 2 for mobile
    const maxPixelRatio = isEdge ? 1.5 : 2;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxPixelRatio));
    // Optimization: ensure efficient clearing
    renderer.autoClear = true;
    renderer.autoClearColor = true;
    container.appendChild(renderer.domElement);

    // --- 1. THE PAPER AIRPLANE (FACING FORWARD) ---
    const shipGroup = new THREE.Group();
    const originalPlaneColor = 0x008080; // Original teal - never select this in random color
    const paperMat = new THREE.MeshStandardMaterial({
        color: originalPlaneColor,
        side: THREE.DoubleSide,
        metalness: 0.75,  // More reflective
        roughness: 0.35,  // Smoother for better reflections
        envMapIntensity: 1.2  // Enhance environment reflections
    });
    const wireMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, wireframe: true });

    // Plane type tracking
    let currentPlaneType = 'dart';
    let planeStats = {
        dart: { smoothing: 0.10, barrelRollSpeed: 0.025, shadowSize: 0.7 },    // Compact, small shadow
        glider: { smoothing: 0.15, barrelRollSpeed: 0.020, shadowSize: 1.0 },  // Large wingspan, bigger shadow
        stunt: { smoothing: 0.08, barrelRollSpeed: 0.035, shadowSize: 0.8 }    // Medium size
    };

    // Create different plane geometries
    function createDartGeometry() {
        const geom = new THREE.BufferGeometry();
        // Simple triangle fan paper airplane (adapted from classic origami dart)
        const vertices = new Float32Array([
            // 0: Nose (sharp point)
            0.0,  0.0, -0.85,

            // 1: Left wing tip (back, angled down)
            -0.70, -0.08, 0.45,

            // 2: Left body edge (back, center fold)
            -0.12, 0.05, 0.45,

            // 3: Center back (tail, slightly raised for fold)
            0.0, 0.10, 0.50,

            // 4: Right body edge (back, center fold)
            0.12, 0.05, 0.45,

            // 5: Right wing tip (back, angled down)
            0.70, -0.08, 0.45,
        ]);

        // Triangle fan from nose (vertex 0)
        const indices = [
            0, 2, 1,  // Left wing
            0, 3, 2,  // Left center body
            0, 4, 3,  // Right center body
            0, 5, 4,  // Right wing
        ];

        geom.setIndex(indices);
        geom.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        geom.computeVertexNormals();
        return geom;
    }

    function createGliderGeometry() {
        const geom = new THREE.BufferGeometry();
        // Wide glider - paper airplane with broad wings
        const vertices = new Float32Array([
            // Nose
            0.0,  0.0, -0.75,      // 0: Blunt nose

            // Center body (shorter body, longer wings)
            0.0,  0.03, -0.40,     // 1: Body front top
            0.0,  0.03,  0.45,     // 2: Body back top
            0.0, -0.05, -0.25,     // 3: Body front bottom
            0.0, -0.05,  0.40,     // 4: Body back bottom

            // Left wing (very wide for gliding)
            -0.85,  0.0, -0.20,    // 5: Left wing front point
            -0.95,  0.0,  0.45,    // 6: Left wing back point

            // Right wing (very wide for gliding)
            0.85,  0.0, -0.20,     // 7: Right wing front point
            0.95,  0.0,  0.45,     // 8: Right wing back point
        ]);

        const indices = [
            // Left wing top
            0, 1, 5,    // Nose to body to wing
            1, 2, 6,    // Body to back
            1, 6, 5,    // Wing triangle

            // Right wing top
            0, 7, 1,    // Nose to wing to body
            1, 7, 2,    // Body to back
            2, 7, 8,    // Wing triangle

            // Left wing bottom
            0, 5, 3,    // Nose underside
            3, 5, 6,    // Wing underside
            3, 6, 4,    // Body underside

            // Right wing bottom
            0, 3, 7,    // Nose underside
            3, 4, 7,    // Body underside
            4, 8, 7,    // Wing underside

            // Tail closure
            2, 6, 8,    // Top back
            4, 6, 8,    // Bottom back
        ];

        geom.setIndex(indices);
        geom.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        geom.computeVertexNormals();
        return geom;
    }

    function createStuntGeometry() {
        const geom = new THREE.BufferGeometry();
        // Stunt plane - swept-back narrow wings for aerobatics
        const vertices = new Float32Array([
            // Nose
            0.0,  0.0, -0.70,      // 0: Pointed nose

            // Center body (longer body for stability)
            0.0,  0.05, -0.50,     // 1: Body front top
            0.0,  0.05,  0.55,     // 2: Body back top
            0.0, -0.08, -0.35,     // 3: Body front bottom
            0.0, -0.08,  0.50,     // 4: Body back bottom

            // Left wing (narrow, swept back)
            -0.45, 0.0,  0.05,     // 5: Left wing front point
            -0.55, 0.0,  0.55,     // 6: Left wing back point

            // Right wing (narrow, swept back)
            0.45,  0.0,  0.05,     // 7: Right wing front point
            0.55,  0.0,  0.55,     // 8: Right wing back point
        ]);

        const indices = [
            // Left wing top
            0, 1, 5,    // Nose to body to wing
            1, 2, 6,    // Body to back
            1, 6, 5,    // Wing triangle

            // Right wing top
            0, 7, 1,    // Nose to wing to body
            1, 7, 2,    // Body to back
            2, 7, 8,    // Wing triangle

            // Left wing bottom
            0, 5, 3,    // Nose underside
            3, 5, 6,    // Wing underside
            3, 6, 4,    // Body underside

            // Right wing bottom
            0, 3, 7,    // Nose underside
            3, 4, 7,    // Body underside
            4, 8, 7,    // Wing underside

            // Tail closure
            2, 6, 8,    // Top back
            4, 6, 8,    // Bottom back
        ];

        geom.setIndex(indices);
        geom.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        geom.computeVertexNormals();
        return geom;
    }

    // Start with Dart
    const airplaneGeom = createDartGeometry();
    const mainMesh = new THREE.Mesh(airplaneGeom, paperMat);
    const wireMesh = new THREE.Mesh(airplaneGeom, wireMat);
    wireMesh.scale.set(1.04, 1.04, 1.04);

    // Add subtle shadow
    const shadowMat = new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
    });
    const shadowMesh = new THREE.Mesh(airplaneGeom, shadowMat);
    shadowMesh.position.y = -0.05;

    shipGroup.add(shadowMesh, mainMesh, wireMesh);
    scene.add(shipGroup);

    // Function to swap plane geometry
    function changePlaneShape(type) {
        let newGeom;
        if (type === 'glider') {
            newGeom = createGliderGeometry();
        } else if (type === 'stunt') {
            newGeom = createStuntGeometry();
        } else {
            newGeom = createDartGeometry();
        }

        mainMesh.geometry.dispose();
        wireMesh.geometry.dispose();
        shadowMesh.geometry.dispose();
        mainMesh.geometry = newGeom;
        wireMesh.geometry = newGeom;
        shadowMesh.geometry = newGeom;
        currentPlaneType = type;
    }

    // Light sitting behind the plane to light up the tail
    const engineLight = new THREE.PointLight(0x00ffff, 12, 12);
    scene.add(engineLight);
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));

    // --- GROUND SHADOW (CHEAP BLOB) ---
    // Simple circular shadow for depth perception
    const groundShadowGeom = new THREE.CircleGeometry(0.8, 16);
    const groundShadowMat = new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.4,
        depthWrite: false // Prevent z-fighting with terrain
    });
    const groundShadow = new THREE.Mesh(groundShadowGeom, groundShadowMat);
    groundShadow.rotation.x = -Math.PI / 2; // Lay flat on ground
    groundShadow.position.y = 0.05; // Slightly above terrain to prevent z-fighting
    scene.add(groundShadow);

    // --- 2. MOUNTAIN VALLEY (RANDOMIZED EACH LOAD) ---
    // Optimized segments for consistent performance across all platforms
    const terrainSegments = 25;
    const terrainGeom = new THREE.PlaneGeometry(100, 120, terrainSegments, terrainSegments);
    const pos = terrainGeom.attributes.position;

    // Random terrain parameters for variety (dynamic based on level)
    const freqX = Math.random() * 0.3 + 0.3;   // 0.3 to 0.6
    const freqY = Math.random() * 0.2 + 0.15;  // 0.15 to 0.35
    let currentAmplitude = Math.random() * 4 + 5;   // 5 to 9 (changes with level)
    const offset = Math.random() * 100;        // Random phase offset
    let lastTerrainLevel = 1; // Track when we last updated terrain

    // Function to smoothly update terrain based on level
    function updateTerrainForLevel(level) {
        // Every 3 levels, mountains get less tall (more flat terrain)
        let targetAmplitude;
        if (level <= 2) {
            targetAmplitude = Math.random() * 4 + 5; // 5-9
        } else if (level <= 5) {
            targetAmplitude = Math.random() * 3 + 3; // 3-6
        } else if (level <= 8) {
            targetAmplitude = Math.random() * 2 + 2; // 2-4
        } else {
            targetAmplitude = Math.random() * 2 + 1; // 1-3
        }

        currentAmplitude = targetAmplitude;

        // Update terrain geometry
        for (let i = 0; i < pos.count; i++) {
            let x = pos.getX(i);
            let y = pos.getY(i);
            let h = (Math.abs(x) > 8) ? Math.abs(Math.sin(x * freqX + offset) * Math.cos(y * freqY)) * currentAmplitude : 0;
            pos.setZ(i, h);
        }
        pos.needsUpdate = true;
    }

    // Initial terrain setup
    for (let i = 0; i < pos.count; i++) {
        let x = pos.getX(i);
        let y = pos.getY(i);
        let h = (Math.abs(x) > 8) ? Math.abs(Math.sin(x * freqX + offset) * Math.cos(y * freqY)) * currentAmplitude : 0;
        pos.setZ(i, h);
    }
    const terrainMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, wireframe: true, transparent: true, opacity: 0.25 });
    const t1 = new THREE.Mesh(terrainGeom, terrainMat);
    const t2 = t1.clone();
    t2.position.z = -120;
    t1.rotation.x = t2.rotation.x = -Math.PI / 2;
    scene.add(t1, t2);

    // --- 3. ANIMATED PARTICLES (STARS) ---
    // Optimized for consistent performance across all platforms
    const particleCount = 200;
    const particleGeom = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleVelocities = [];

    for(let i=0; i<particleCount; i++) {
        const i3 = i * 3;
        particlePositions[i3] = (Math.random()-0.5)*250;     // x
        particlePositions[i3+1] = (Math.random()-0.5)*250;   // y
        particlePositions[i3+2] = (Math.random()-0.5)*250;   // z

        // Store velocity for each particle
        particleVelocities.push({
            z: Math.random() * 0.3 + 0.2,  // Forward movement
            x: (Math.random()-0.5) * 0.05   // Slight lateral drift
        });
    }
    particleGeom.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particles = new THREE.Points(particleGeom, new THREE.PointsMaterial({
        color: 0x00ffff,
        size: 0.2,
        transparent: true,
        opacity: 0.8
    }));
    scene.add(particles);

    // --- 4. GROUND DEBRIS (ROCKS & SMALL OBJECTS) ---
    // Small decorative debris on the terrain for visual interest
    const debris = [];
    const debrisCount = 25; // Optimized for consistent performance
    const debrisMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, wireframe: true, transparent: true, opacity: 0.3 });
    const debrisGeometries = [
        new THREE.BoxGeometry(0.3, 0.3, 0.3),           // Small cube
        new THREE.ConeGeometry(0.2, 0.4, 3),            // Tiny pyramid
        new THREE.SphereGeometry(0.2, 4, 3),            // Low-poly sphere
        new THREE.CylinderGeometry(0.15, 0.15, 0.4, 4)  // Tiny cylinder
    ];

    for (let i = 0; i < debrisCount; i++) {
        const geometry = debrisGeometries[Math.floor(Math.random() * debrisGeometries.length)];
        const rock = new THREE.Mesh(geometry, debrisMat.clone());

        // Random position across terrain
        rock.position.x = (Math.random() - 0.5) * 80; // Spread across terrain width
        rock.position.y = 0.2; // Just above terrain
        rock.position.z = (Math.random() - 0.5) * 200; // Spread along depth

        // Random rotation and scale for variety
        rock.rotation.set(
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2
        );
        const scale = Math.random() * 0.5 + 0.5; // 0.5 to 1.0
        rock.scale.set(scale, scale, scale);

        rock.userData.baseZ = rock.position.z; // Store original z position
        rock.userData.rotationSpeed = (Math.random() - 0.5) * 0.02; // Slow rotation

        scene.add(rock);
        debris.push(rock);
    }

    // --- 4.5. COLLISION DEBRIS (CHUNKS FROM STRUCTURES) ---
    // Physics-based debris that spawns when hitting buildings/walls
    // Reuses existing ground debris geometries for performance
    const collisionDebris = [];
    const collisionDebrisPool = [];
    const collisionDebrisCount = 15; // Reduced for 60fps on older devices

    // Pre-create collision debris pool using existing debris geometries for performance
    for (let i = 0; i < collisionDebrisCount; i++) {
        const geometry = debrisGeometries[Math.floor(Math.random() * debrisGeometries.length)];
        const chunk = new THREE.Mesh(geometry, debrisMat.clone());
        chunk.material.opacity = 0.8; // More visible than ground debris
        chunk.material.color.setHex(0x00ffff); // Cyan to match structures
        chunk.visible = false;
        chunk.position.set(0, 0, -1000);
        chunk.userData.velocity = new THREE.Vector3();
        chunk.userData.rotationVelocity = new THREE.Vector3();
        chunk.userData.active = false;
        // Scale set per-spawn for varied sizes

        scene.add(chunk);
        collisionDebrisPool.push(chunk);
    }

    // Pre-calculated fracture patterns for each structure type
    // Better performance and more realistic breaking
    const fracturePatterns = {
        box: {
            // Boxes break into 4-6 chunks based on impact location
            top: { chunks: 4, spread: 2 },      // Top impact
            bottom: { chunks: 3, spread: 1.5 }, // Bottom impact
            left: { chunks: 4, spread: 2 },     // Left side impact
            right: { chunks: 4, spread: 2 },    // Right side impact
            front: { chunks: 5, spread: 2.5 }   // Front impact (most chunks)
        },
        pyramid: {
            // Pyramids break at apex or base
            top: { chunks: 2, spread: 1.5 },    // Apex breaks off
            bottom: { chunks: 4, spread: 2 },   // Base shatters
            side: { chunks: 3, spread: 2 }      // Side impact
        },
        cylinder: {
            // Cylinders shatter into many pieces
            top: { chunks: 5, spread: 3 },      // Top ring breaks
            middle: { chunks: 6, spread: 3.5 }, // Middle shatters
            bottom: { chunks: 5, spread: 2.5 }  // Base breaks
        }
    };

    // --- 4.7. DUST PARTICLE SYSTEM (SPILLED POWDER EFFECT) ---
    // Fine particles that spawn when debris hits ground - like spilled salt/powder
    const dustParticles = [];
    const dustParticlePool = [];
    const dustParticlePoolSize = isMobile ? 10 : 20; // Pool of dust clouds
    const dustParticlesPerCloud = isMobile ? 30 : 60; // Particles per dust cloud

    // Pre-create dust particle clouds
    for (let p = 0; p < dustParticlePoolSize; p++) {
        const dustGeom = new THREE.BufferGeometry();
        const dustPositions = new Float32Array(dustParticlesPerCloud * 3);

        dustGeom.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));

        const dustCloud = new THREE.Points(dustGeom, new THREE.PointsMaterial({
            color: 0x00ffff,
            size: 0.08, // Very small - like powder
            transparent: true,
            opacity: 0.6,
            sizeAttenuation: true // Particles get smaller with distance
        }));

        dustCloud.visible = false;
        dustCloud.userData.active = false;
        dustCloud.userData.lifetime = 0;
        dustCloud.userData.maxLifetime = 60; // Fade over ~1 second (60 frames)
        dustCloud.userData.velocities = []; // Store velocity for each particle

        scene.add(dustCloud);
        dustParticlePool.push(dustCloud);
    }

    // Function to spawn dust cloud when debris hits ground
    function spawnDustCloud(x, y, z, velocityX, velocityZ) {
        const dustCloud = dustParticlePool.find(d => !d.userData.active);
        if (!dustCloud) return; // Pool exhausted

        const positions = dustCloud.geometry.attributes.position.array;
        dustCloud.userData.velocities = [];

        // Spawn particles in a spreading pattern (like spilled powder)
        for (let i = 0; i < dustParticlesPerCloud; i++) {
            const i3 = i * 3;

            // Small initial spread around impact point
            const angle = (i / dustParticlesPerCloud) * Math.PI * 2;
            const radius = Math.random() * 0.5; // Start clustered

            positions[i3] = x + Math.cos(angle) * radius;     // x
            positions[i3 + 1] = y + Math.random() * 0.1;      // y (just above ground)
            positions[i3 + 2] = z + Math.sin(angle) * radius; // z

            // Particle velocities: spread forward and sideways like powder
            const spreadAngle = angle + (Math.random() - 0.5) * 0.5;
            const spreadSpeed = 0.15 + Math.random() * 0.25; // 0.15-0.4

            dustCloud.userData.velocities.push({
                x: Math.cos(spreadAngle) * spreadSpeed + velocityX * 0.3, // Inherit some debris velocity
                y: 0, // Stays on ground
                z: Math.sin(spreadAngle) * spreadSpeed + velocityZ * 0.5  // More forward bias
            });
        }

        dustCloud.geometry.attributes.position.needsUpdate = true;
        dustCloud.visible = true;
        dustCloud.userData.active = true;
        dustCloud.userData.lifetime = 0;
        dustCloud.material.opacity = 0.6; // Reset opacity

        dustParticles.push(dustCloud);
    }

    // Function to spawn debris chunks from a collision point
    // Uses pre-calculated fracture patterns based on impact location
    // NOTE: Will be reused for laser impacts in the future
    function spawnCollisionDebris(structureX, structureY, structureZ, shipX, shipY, structureObj = null) {
        // Determine structure type for realistic break pattern
        const isBox = structureObj && (structureObj.geometry === boxGeometry);
        const isPyramid = structureObj && (structureObj.geometry === pyramidGeometry);
        const isCylinder = structureObj && (structureObj.geometry === cylinderGeometry);
        const isWall = !structureObj; // Walls don't pass structure object

        // Calculate impact location relative to structure
        const relX = shipX - structureX;
        const relY = shipY - structureY;

        // Determine fracture zone based on impact location
        let fractureZone;
        if (isPyramid) {
            // Pyramids: top vs bottom vs side
            if (relY > 1) fractureZone = fracturePatterns.pyramid.top;
            else if (Math.abs(relX) > 1) fractureZone = fracturePatterns.pyramid.side;
            else fractureZone = fracturePatterns.pyramid.bottom;
        } else if (isCylinder) {
            // Cylinders: top vs middle vs bottom
            if (relY > 1.5) fractureZone = fracturePatterns.cylinder.top;
            else if (relY < -1) fractureZone = fracturePatterns.cylinder.bottom;
            else fractureZone = fracturePatterns.cylinder.middle;
        } else {
            // Boxes/Walls: determine side hit
            if (Math.abs(relY) > Math.abs(relX)) {
                fractureZone = relY > 0 ? fracturePatterns.box.top : fracturePatterns.box.bottom;
            } else {
                fractureZone = relX > 0 ? fracturePatterns.box.right : fracturePatterns.box.left;
            }
        }

        const chunkCount = fractureZone.chunks;
        const spreadFactor = fractureZone.spread;

        for (let i = 0; i < chunkCount; i++) {
            // Find available chunk from pool
            const chunk = collisionDebrisPool.find(c => !c.userData.active);
            if (!chunk) break; // No more available chunks

            // Activate and position chunk at collision point
            chunk.userData.active = true;
            chunk.visible = true;
            chunk.userData.onGround = false;
            chunk.userData.lifetime = 0;

            // Set debris color based on structure type
            if (isWall) {
                chunk.material.color.setHex(0xff00ff); // Purple for walls
            } else {
                chunk.material.color.setHex(0x00ffff); // Cyan for buildings
            }

            // Varied chunk sizes (mix of small and large)
            const sizeType = Math.random();
            let scale;
            if (sizeType < 0.3) {
                scale = Math.random() * 0.8 + 0.5; // Small (0.5-1.3) - 30%
            } else if (sizeType < 0.7) {
                scale = Math.random() * 1.0 + 1.3; // Medium (1.3-2.3) - 40%
            } else {
                scale = Math.random() * 1.5 + 2.3; // Large (2.3-3.8) - 30%
            }
            chunk.scale.set(scale, scale, scale);

            // FORWARD-FOCUSED SPRAY: debris spills onto landscape ahead, minimal sideways
            const chunkOffset = (i / chunkCount) - 0.5; // -0.5 to 0.5 for spreading chunks

            // Spawn position: mostly forward with slight fracture-based offset
            const spawnX = structureX + (chunkOffset * spreadFactor); // Spread based on fracture zone
            const spawnY = structureY + 0.5 + Math.random() * 1; // Start slightly elevated (lower spawn)
            const spawnZ = structureZ - 15 - Math.random() * 25; // 15-40 units AHEAD

            // Velocity: DRAMATIC FORWARD spray with DOWNWARD arc (always falls to ground)
            const forwardVel = 0.8 + Math.random() * 0.8; // 0.8-1.6 (very fast forward!)
            const sidewaysVel = chunkOffset * 0.15; // Minimal sideways (fracture spread only)
            const upwardVel = -0.1 - Math.random() * 0.15; // Slight upward arc (0.1-0.25), then gravity pulls down

            chunk.position.set(spawnX, spawnY, spawnZ);
            chunk.userData.velocity.set(sidewaysVel, upwardVel, forwardVel);

            // DRAMATIC tumbling based on chunk size and structure type
            const baseSpin = 3.0 / scale; // Smaller chunks spin MUCH faster
            let spinIntensity;
            if (isPyramid) spinIntensity = 1.8; // Very dramatic
            else if (isCylinder) spinIntensity = 2.2; // Extremely dramatic
            else spinIntensity = 1.5; // Dramatic

            const finalSpin = baseSpin * spinIntensity;

            // Multi-axis tumbling - exaggerated for visual impact
            chunk.userData.rotationVelocity.set(
                (Math.random() - 0.5) * finalSpin * 1.5, // X-axis tumble
                (Math.random() - 0.5) * finalSpin * 1.8, // Y-axis spin (fastest)
                (Math.random() - 0.5) * finalSpin * 1.2  // Z-axis roll
            );

            // Erratic wobble for realism
            chunk.userData.wobblePhase = Math.random() * Math.PI * 2;
            chunk.userData.wobbleSpeed = 0.1 + Math.random() * 0.15; // Faster wobble

            // VARIETY: Each chunk gets unique physics characteristics
            chunk.userData.frictionFactor = 0.92 + Math.random() * 0.04; // 0.92-0.96 (varied friction)
            chunk.userData.rotationDecay = 0.91 + Math.random() * 0.04; // 0.91-0.95 (varied spin slowdown)
            chunk.userData.wobbleIntensity = 0.5 + Math.random() * 1.0; // 0.5-1.5 (varied wobble strength)
            chunk.userData.skidPattern = Math.floor(Math.random() * 3); // 0-2 (different skid behaviors)

            // Random initial rotation
            chunk.rotation.set(
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2
            );

            collisionDebris.push(chunk);
        }
    }

    // --- 4.7. TREE PROPS (BILLBOARD SPRITES) ---
    // DISABLED FOR NOW - Keep code for future implementation
    const trees = [];

    /* TREE CODE - DISABLED
    const treeCount = 15; // Sparse placement for visual variety

    // Create simple tree sprite texture using canvas (shared by all trees)
    const treeCanvas = document.createElement('canvas');
    treeCanvas.width = 32;
    treeCanvas.height = 48;
    const treeCtx = treeCanvas.getContext('2d');

    // Draw simple tree silhouette (triangle + trunk)
    treeCtx.strokeStyle = '#00ffff';
    treeCtx.lineWidth = 2;

    // Trunk
    treeCtx.beginPath();
    treeCtx.moveTo(14, 40);
    treeCtx.lineTo(14, 48);
    treeCtx.moveTo(18, 40);
    treeCtx.lineTo(18, 48);
    treeCtx.stroke();

    // Foliage (triangle)
    treeCtx.beginPath();
    treeCtx.moveTo(16, 8);
    treeCtx.lineTo(6, 40);
    treeCtx.lineTo(26, 40);
    treeCtx.closePath();
    treeCtx.stroke();

    // Inner detail
    treeCtx.beginPath();
    treeCtx.moveTo(16, 16);
    treeCtx.lineTo(10, 30);
    treeCtx.moveTo(16, 16);
    treeCtx.lineTo(22, 30);
    treeCtx.stroke();

    const treeTexture = new THREE.CanvasTexture(treeCanvas);
    const treeMat = new THREE.SpriteMaterial({
        map: treeTexture,
        transparent: true,
        opacity: 0.6
    });

    // Helper to check if position is clear of buildings and debris
    function isTreePositionClear(x, z) {
        const minDistFromDebris = 3;
        const minDistFromBuildings = 8;

        // Check against debris
        for (let rock of debris) {
            const dx = rock.position.x - x;
            const dz = rock.position.z - z;
            if (Math.sqrt(dx * dx + dz * dz) < minDistFromDebris) {
                return false;
            }
        }

        // Check against buildings (if any exist yet)
        if (typeof buildings !== 'undefined') {
            for (let building of buildings) {
                if (!building.visible) continue;
                const dx = building.position.x - x;
                const dz = building.position.z - z;
                if (Math.sqrt(dx * dx + dz * dz) < minDistFromBuildings) {
                    return false;
                }
            }
        }

        return true;
    }

    // Spawn trees with collision avoidance
    for (let i = 0; i < treeCount; i++) {
        let attempts = 0;
        let x, z;

        // Try to find clear position (max 10 attempts)
        do {
            x = (Math.random() - 0.5) * 70; // Stay within terrain bounds
            z = (Math.random() - 0.5) * 180; // Spread along depth
            attempts++;
        } while (!isTreePositionClear(x, z) && attempts < 10);

        // Skip if no clear position found
        if (attempts >= 10) continue;

        const tree = new THREE.Sprite(treeMat);
        tree.position.x = x;
        tree.position.y = 1.2; // Height above ground
        tree.position.z = z;

        // Random scale for variety
        const scale = Math.random() * 0.8 + 0.8; // 0.8 to 1.6
        tree.scale.set(scale, scale * 1.5, 1); // Taller than wide

        tree.userData.baseZ = z; // Store for scrolling

        scene.add(tree);
        trees.push(tree);
    }
    */ // END TREE CODE

    // --- 5. DISTANT BACKGROUND STARS ---
    // Distant stars for atmospheric depth - what you're flying towards
    const distantStars = [];
    const starCount = 100; // Optimized for 60fps on older devices

    for (let i = 0; i < starCount; i++) {
        // Subtle mix of colors - cyan, white, light blue, pink (rare)
        const rand = Math.random();
        let starColor;
        if (rand < 0.50) {
            starColor = 0x00ffff; // Cyan (50%)
        } else if (rand < 0.85) {
            starColor = 0xffffff; // White (35%)
        } else if (rand < 0.95) {
            starColor = 0x88ccff; // Light blue (10%)
        } else {
            starColor = 0xffaacc; // Pink (5% - rare)
        }

        const starMat = new THREE.MeshBasicMaterial({
            color: starColor,
            transparent: true,
            opacity: 0.8, // Brighter base
            fog: false // Prevent fog from hiding stars
        });

        // Tiny period-sized stars
        const starSize = Math.random() * 0.08 + 0.08; // 0.08 to 0.16 - period sized
        const starGeometry = new THREE.SphereGeometry(starSize, 6, 4);
        const star = new THREE.Mesh(starGeometry, starMat);

        // Position far ahead in the distance (what you're flying towards)
        // Only in top half of viewport to avoid clipping through landscape
        star.position.x = (Math.random() - 0.5) * 600; // Very wide spread
        star.position.y = Math.random() * 80 + 50; // Top half only (y: 50 to 130)
        star.position.z = -Math.random() * 180 - 20; // Far ahead (z: -20 to -200)

        // Twinkling effect
        star.userData.baseOpacity = Math.random() * 0.3 + 0.5; // 0.5 to 0.8
        star.userData.twinkleSpeed = Math.random() * 0.02 + 0.01;
        star.userData.twinkleOffset = Math.random() * Math.PI * 2;

        scene.add(star);
        distantStars.push(star);
    }

    // --- 6. VARIED BUILDINGS (INSTANCED) - GPU OPTIMIZED ---
    // Lane-based system for building placement (5 lanes)
    const lanes = [-8, -4, 0, 4, 8]; // 5 lanes across the playing field

    // Different building geometries (low-poly for performance)
    const boxGeometry = new THREE.BoxGeometry(2, 5, 2);
    const pyramidGeometry = new THREE.ConeGeometry(2, 5, 12, 4); // 12 radial segments, 4 height segments for better wireframe depth
    const cylinderGeometry = new THREE.CylinderGeometry(1.5, 1.5, 5, 8, 1); // 8 segments, low-poly

    // Shared material for all building types
    const buildMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, wireframe: true, transparent: true, opacity: 0.4 });

    // InstancedMesh for each geometry type (max 20 instances each for better distribution)
    const MAX_BUILDING_INSTANCES = 20;
    const boxInstancedMesh = new THREE.InstancedMesh(boxGeometry, buildMat, MAX_BUILDING_INSTANCES);
    const pyramidInstancedMesh = new THREE.InstancedMesh(pyramidGeometry, buildMat, MAX_BUILDING_INSTANCES);
    const cylinderInstancedMesh = new THREE.InstancedMesh(cylinderGeometry, buildMat, MAX_BUILDING_INSTANCES);

    scene.add(boxInstancedMesh);
    scene.add(pyramidInstancedMesh);
    scene.add(cylinderInstancedMesh);

    // Instance management - track each instance's state
    const buildings = []; // Array of building instance data
    const buildingInstances = {
        box: [],
        pyramid: [],
        cylinder: []
    };

    // Initialize instance pools
    for (let i = 0; i < MAX_BUILDING_INSTANCES; i++) {
        buildingInstances.box.push({
            active: false,
            matrix: new THREE.Matrix4(),
            position: new THREE.Vector3(0, 0, -1000), // Start far off screen
            scale: new THREE.Vector3(1, 1, 1),
            rotation: new THREE.Euler(),
            height: 5,
            width: 1,
            originalY: 0,
            originalScale: { x: 1, y: 1, z: 1 },
            box: new THREE.Box3(),
            opacity: 1,
            nearMissCredited: false,
            geometry: 'box'
        });
        buildingInstances.pyramid.push({
            active: false,
            matrix: new THREE.Matrix4(),
            position: new THREE.Vector3(0, 0, -1000), // Start far off screen
            scale: new THREE.Vector3(1, 1, 1),
            rotation: new THREE.Euler(),
            height: 5,
            width: 1,
            originalY: 0,
            originalScale: { x: 1, y: 1, z: 1 },
            box: new THREE.Box3(),
            opacity: 1,
            nearMissCredited: false,
            geometry: 'pyramid'
        });
        buildingInstances.cylinder.push({
            active: false,
            matrix: new THREE.Matrix4(),
            position: new THREE.Vector3(0, 0, -1000), // Start far off screen
            scale: new THREE.Vector3(1, 1, 1),
            rotation: new THREE.Euler(),
            height: 5,
            width: 1,
            originalY: 0,
            originalScale: { x: 1, y: 1, z: 1 },
            box: new THREE.Box3(),
            opacity: 1,
            nearMissCredited: false,
            geometry: 'cylinder'
        });
        // Also add to buildings array for compatibility
        buildings.push(buildingInstances.box[i]);
        buildings.push(buildingInstances.pyramid[i]);
        buildings.push(buildingInstances.cylinder[i]);

        // Initialize matrices to position instances off-screen
        const offScreenMatrix = new THREE.Matrix4();
        offScreenMatrix.setPosition(0, 0, -1000);
        boxInstancedMesh.setMatrixAt(i, offScreenMatrix);
        pyramidInstancedMesh.setMatrixAt(i, offScreenMatrix);
        cylinderInstancedMesh.setMatrixAt(i, offScreenMatrix);
    }

    // Set instance counts (how many instances to render)
    boxInstancedMesh.count = MAX_BUILDING_INSTANCES;
    pyramidInstancedMesh.count = MAX_BUILDING_INSTANCES;
    cylinderInstancedMesh.count = MAX_BUILDING_INSTANCES;

    // Mark instance matrices as needing update
    boxInstancedMesh.instanceMatrix.needsUpdate = true;
    pyramidInstancedMesh.instanceMatrix.needsUpdate = true;
    cylinderInstancedMesh.instanceMatrix.needsUpdate = true;

    // Reusable quaternion for matrix updates (prevents garbage collection)
    const _tempQuaternion = new THREE.Quaternion();

    // Helper to update instance matrix (optimized to reuse quaternion)
    function updateInstanceMatrix(instance, mesh, index) {
        _tempQuaternion.setFromEuler(instance.rotation);
        instance.matrix.compose(instance.position, _tempQuaternion, instance.scale);
        mesh.setMatrixAt(index, instance.matrix);

        // Set flag based on mesh type (batch updates per frame)
        if (mesh === boxInstancedMesh) boxMatricesNeedUpdate = true;
        else if (mesh === pyramidInstancedMesh) pyramidMatricesNeedUpdate = true;
        else if (mesh === cylinderInstancedMesh) cylinderMatricesNeedUpdate = true;
    }

    // Flags to track if matrices need updating this frame
    let boxMatricesNeedUpdate = false;
    let pyramidMatricesNeedUpdate = false;
    let cylinderMatricesNeedUpdate = false;

    // Helper to get available instance of specific type
    function getAvailableInstance(type) {
        const instances = buildingInstances[type];
        for (let i = 0; i < instances.length; i++) {
            if (!instances[i].active) {
                return { instance: instances[i], index: i };
            }
        }
        return null;
    }

    // Helper to create building data (returns type and properties)
    function createBuildingData() {
        const buildingType = Math.random();
        let type, height;

        if (buildingType < 0.25) {
            // Square building
            type = 'box';
            height = Math.random() * 6 + 3; // 3-9 units tall
        } else if (buildingType < 0.4) {
            // Rectangle (tall or wide)
            type = 'box';
            height = Math.random() * 8 + 2; // 2-10 units tall
        } else if (buildingType < 0.7) {
            // Cone/Pyramid - increased spawn rate to 30%
            type = 'pyramid';
            height = Math.random() * 5 + 3; // 3-8 units tall
        } else {
            // Cylinder (squat or tall)
            type = 'cylinder';
            height = Math.random() < 0.5 ? Math.random() * 3 + 2 : Math.random() * 8 + 5; // Squat: 2-5, Tall: 5-13
        }

        return { type, height };
    }

    // Seeded random number generator for procedural patterns
    let gameSeed = Date.now(); // Unique seed per game session
    function seededRandom() {
        // Simple mulberry32 algorithm
        gameSeed = (gameSeed + 0x6D2B79F5) | 0;
        let t = Math.imul(gameSeed ^ (gameSeed >>> 15), 1 | gameSeed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    // Helper to get random lane position
    function getRandomLane(occupiedLanes = []) {
        const availableLanes = lanes.filter(lane => !occupiedLanes.includes(lane));
        if (availableLanes.length === 0) return lanes[Math.floor(seededRandom() * lanes.length)];
        return availableLanes[Math.floor(seededRandom() * availableLanes.length)];
    }

    // Check if building position has minimum X separation from other buildings
    function hasMinimumSeparation(xPos, zPos, buildingWidth, excludeBuilding = null) {
        const minXSeparation = 3; // Minimum horizontal distance between building edges
        const laneSpacing = 4;

        for (let i = 0; i < buildings.length; i++) {
            const other = buildings[i];
            if (other === excludeBuilding || !other.active) continue;

            // Calculate building bounds accounting for scale and width
            const otherWidth = other.width || 1;
            const otherScaleX = other.scale.x;
            const thisScaleX = buildingWidth * 1.5; // Approximate scale (will be set properly later)

            // Calculate X extents (accounting for geometry size and scale)
            const thisHalfWidth = (buildingWidth * laneSpacing / 2) + (thisScaleX * 1);
            const otherHalfWidth = (otherWidth * laneSpacing / 2) + (otherScaleX * 1);

            const thisMinX = xPos - thisHalfWidth;
            const thisMaxX = xPos + thisHalfWidth;
            const otherMinX = other.position.x - otherHalfWidth;
            const otherMaxX = other.position.x + otherHalfWidth;

            // Check if X ranges overlap or are too close
            const xOverlap = thisMaxX + minXSeparation > otherMinX && thisMinX - minXSeparation < otherMaxX;

            // Only check separation if Z positions are close (within spawn proximity)
            const zDist = Math.abs(other.position.z - zPos);
            if (xOverlap && zDist < 50) {
                return false;
            }
        }
        return true;
    }

    // Wave tracking
    let currentWave = null;
    let currentWavePositions = null; // Cache wave positions
    let waveProgress = 0;
    let nextWaveDistance = -200;
    let spawnedBuildings = []; // Track spawned buildings for collision detection

    // Procedural building generator with collision detection
    function generateProceduralWave(miles) {
        // Difficulty progression based on miles
        const difficulty = Math.min(miles / 50, 5); // 0-5 difficulty scale

        // Early game (0-50mi): 1-2 buildings, sparse
        // Mid game (50-150mi): 2-4 buildings, getting denser
        // Late game (150+mi): 3-5 buildings with intentional gaps

        let buildingCount;
        let minSpacing; // Minimum space between buildings
        let allowAdjacentLanes; // Can buildings be in adjacent lanes?

        if (miles < 50) {
            // Early: sparse for learning (but using wave patterns instead)
            buildingCount = Math.floor(seededRandom() * 2) + 1; // 1-2 buildings
            minSpacing = 80; // Wide spacing
            allowAdjacentLanes = false; // Never adjacent
        } else if (miles < 100) {
            // Mid: starting to cluster
            buildingCount = Math.floor(seededRandom() * 3) + 2; // 2-4 buildings
            minSpacing = 40; // Medium spacing
            allowAdjacentLanes = seededRandom() < 0.5; // 50% chance adjacent
        } else if (miles < 200) {
            // Late: dense patterns - waves stacking
            buildingCount = Math.floor(seededRandom() * 3) + 4; // 4-6 buildings
            minSpacing = 20; // Very tight spacing
            allowAdjacentLanes = true; // Can be adjacent
        } else if (miles < 300) {
            // VERY late (200-300): RELENTLESS waves
            buildingCount = Math.floor(seededRandom() * 4) + 5; // 5-8 buildings
            minSpacing = 15; // Extremely tight spacing
            allowAdjacentLanes = true; // Always adjacent
        } else if (miles < 400) {
            // EXTREME (300-400): Barely surviving
            buildingCount = Math.floor(seededRandom() * 4) + 6; // 6-9 buildings
            minSpacing = 12; // Insane spacing
            allowAdjacentLanes = true; // Always adjacent
        } else {
            // HARROWING (400+): For absolute masters like 500+ mile runs!
            buildingCount = Math.floor(seededRandom() * 5) + 7; // 7-11 buildings
            minSpacing = 10; // Absolutely brutal spacing
            allowAdjacentLanes = true; // Always adjacent - threading the needle
        }

        const positions = [];
        spawnedBuildings = []; // Reset tracking

        for (let i = 0; i < buildingCount; i++) {
            let attempts = 0;
            let validPosition = null;

            while (attempts < 10 && !validPosition) {
                const lane = Math.floor(seededRandom() * 5);
                const offset = -Math.floor(seededRandom() * 100) - 50; // Random Z offset
                const width = seededRandom() < 0.7 ? 1 : (seededRandom() < 0.5 ? 1.5 : 2); // Varied widths

                // Check collision with existing buildings
                let collides = false;

                for (const existing of spawnedBuildings) {
                    const zDist = Math.abs(existing.offset - offset);
                    const laneDist = Math.abs(existing.lane - lane);

                    // Too close in Z axis
                    if (zDist < minSpacing) {
                        collides = true;
                        break;
                    }

                    // Too close in lanes (if not allowing adjacent)
                    if (!allowAdjacentLanes && laneDist <= 1 && zDist < 100) {
                        collides = true;
                        break;
                    }
                }

                if (!collides) {
                    validPosition = { lane, offset, width };
                    spawnedBuildings.push({ lane, offset, width });
                }

                attempts++;
            }

            if (validPosition) {
                positions.push(validPosition);
            }
        }

        // Always ensure at least one gap (don't block all lanes)
        const occupiedLanes = positions.map(p => p.lane);
        if (occupiedLanes.length >= 4) {
            // Remove one random building to create a gap
            const removeIndex = Math.floor(seededRandom() * positions.length);
            positions.splice(removeIndex, 1);
        }

        return positions;
    }

    // Anti-camping system
    let playerLane = 2; // Center lane (0-4)
    let lastPlayerLane = 2;
    let timeInSameLane = 0;
    let campingThreshold = 2000; // 2 seconds (reduced from 4s for more aggressive anti-camping)
    let antiCampingActive = false;

    // Helper function to determine which lane the player is in
    function getPlayerLane(xPosition) {
        // Find closest lane to player position
        let closestLane = 0;
        let minDistance = Math.abs(xPosition - lanes[0]);

        for (let i = 1; i < lanes.length; i++) {
            const distance = Math.abs(xPosition - lanes[i]);
            if (distance < minDistance) {
                minDistance = distance;
                closestLane = i;
            }
        }

        return closestLane;
    }

    // Define building wave patterns
    const wavePatterns = {
        breather: {
            buildings: 0,
            getPositions: () => [] // No buildings, just a breather
        },
        antiCamping: {
            buildings: 1,
            getPositions: () => [{ lane: playerLane, offset: 0 }] // Spawn directly in player's lane
        },
        single: {
            buildings: 1,
            getPositions: () => [{ lane: Math.floor(seededRandom() * 5), offset: 0, width: 1 }]
        },
        double: {
            buildings: 2,
            getPositions: () => {
                const lane1 = Math.floor(seededRandom() * 5);
                let lane2 = Math.floor(seededRandom() * 5);
                while (lane2 === lane1) lane2 = Math.floor(seededRandom() * 5);
                return [
                    { lane: lane1, offset: 0, width: 1 },
                    { lane: lane2, offset: -20, width: 1 } // Quick follow-up (was -30)
                ];
            }
        },
        // EARLY GAME DENSE PATTERNS - multiple buildings at same Z position
        double_simultaneous: {
            buildings: 2,
            getPositions: () => {
                // 2 buildings at SAME depth forcing left/right dodge
                const lane1 = Math.floor(seededRandom() * 2); // Lane 0 or 1 (left side)
                const lane2 = 3 + Math.floor(seededRandom() * 2); // Lane 3 or 4 (right side)
                return [
                    { lane: lane1, offset: 0, width: 1 },
                    { lane: lane2, offset: 0, width: 1 } // SAME Z - forces center navigation
                ];
            }
        },
        triple_simultaneous: {
            buildings: 3,
            getPositions: () => {
                // 3 buildings at same depth - leaves 2 lanes open
                const allLanes = [0, 1, 2, 3, 4];
                const shuffled = allLanes.sort(() => 0.5 - seededRandom());
                const selectedLanes = shuffled.slice(0, 3);
                return selectedLanes.map(lane => ({
                    lane,
                    offset: 0, // ALL at same Z position
                    width: 1
                }));
            }
        },
        quad_simultaneous: {
            buildings: 4,
            getPositions: () => {
                // 4 buildings at same depth - leaves 1 lane open
                const openLane = Math.floor(seededRandom() * 5);
                const positions = [];
                for (let i = 0; i < 5; i++) {
                    if (i !== openLane) {
                        positions.push({ lane: i, offset: 0, width: 1 });
                    }
                }
                return positions;
            }
        },
        triple: {
            buildings: 3,
            getPositions: () => {
                // Pick 3 random lanes, leave 2 open
                const allLanes = [0, 1, 2, 3, 4];
                const shuffled = allLanes.sort(() => 0.5 - seededRandom());
                return shuffled.slice(0, 3).map((lane, i) => ({
                    lane,
                    offset: i * -25, // Tighter spacing (was -40)
                    width: 1
                }));
            }
        },
        gentle_wall: {
            buildings: 3,
            getPositions: () => {
                // Block only 3 lanes, leave 2 lanes CLEARLY open (adjacent for visibility)
                const openStart = Math.floor(seededRandom() * 4); // 0-3
                const positions = [];
                for (let i = 0; i < 5; i++) {
                    // Skip two adjacent lanes
                    if (i !== openStart && i !== openStart + 1) {
                        positions.push({ lane: i, offset: 0, width: 1 });
                    }
                }
                return positions;
            }
        },
        wall: {
            buildings: 4,
            getPositions: () => {
                // Always leave 1 lane CLEARLY open in center or edges
                const openLaneOptions = [0, 2, 4]; // Left, Center, or Right (more visible)
                const openLane = openLaneOptions[Math.floor(seededRandom() * openLaneOptions.length)];
                const positions = [];
                for (let i = 0; i < 5; i++) {
                    if (i !== openLane) {
                        positions.push({ lane: i, offset: 0, width: 1 });
                    }
                }
                return positions;
            }
        },
        staircase: {
            buildings: 3,
            getPositions: () => {
                // Staircase pattern forcing serpentine movement
                const direction = seededRandom() < 0.5 ? 1 : -1;
                const startLane = direction > 0 ? 0 : 4;
                const positions = [];
                for (let i = 0; i < 3; i++) {
                    positions.push({
                        lane: startLane + (i * direction),
                        offset: i * -25, // Tighter spacing (was -40)
                        width: 1
                    });
                }
                return positions;
            }
        },
        procedural: {
            buildings: -1, // Variable
            getPositions: (currentMiles = 0) => generateProceduralWave(currentMiles) // Use new procedural system
        },
        // Wide building patterns - appear at higher levels
        wide_single: {
            buildings: 1,
            getPositions: () => {
                // Single wide building (2 lanes), leaving 3 lanes open
                const startLane = Math.floor(seededRandom() * 4); // 0-3 (can't start at 4)
                return [{ lane: startLane, offset: 0, width: 2 }];
            }
        },
        wide_gap_regular: {
            buildings: 2,
            getPositions: () => {
                // Wide building (2 lanes), gap, regular building
                const wideStart = Math.floor(seededRandom() * 2); // 0 or 1 (lanes 0-1 or 1-2)
                const regularLanes = wideStart === 0 ? [3, 4] : [4]; // Pick from remaining lanes
                const regularLane = regularLanes[Math.floor(seededRandom() * regularLanes.length)];
                return [
                    { lane: wideStart, offset: 0, width: 2 },
                    { lane: regularLane, offset: -50, width: 1 }
                ];
            }
        },
        wide_sandwich: {
            buildings: 3,
            getPositions: () => {
                // Regular, wide (2 lanes), regular - creates tight corridor
                return [
                    { lane: 0, offset: 0, width: 1 },
                    { lane: 1, offset: -45, width: 2 },
                    { lane: 4, offset: -90, width: 1 }
                ];
            }
        },
        double_wide: {
            buildings: 2,
            getPositions: () => {
                // Two wide buildings with gap - challenging but fair
                return [
                    { lane: 0, offset: 0, width: 2 },
                    { lane: 3, offset: -60, width: 2 }
                ];
            }
        }
    };

    // Get wave pattern based on level
    function getWavePattern(level) {
        const rand = seededRandom(); // Use seeded random for consistency

        // Use procedural generation for most patterns
        // Keep some classic patterns for variety
        if (level <= 2) {
            // Early levels: DENSE simultaneous patterns forcing constant left-right movement
            // Patterns spawn multiple buildings at SAME depth so you must weave between them
            if (rand < 0.20) return 'double_simultaneous';  // 20% two buildings side-by-side
            if (rand < 0.40) return 'triple_simultaneous';  // 20% three buildings simultaneous
            if (rand < 0.55) return 'quad_simultaneous';    // 15% four buildings simultaneous
            if (rand < 0.70) return 'gentle_wall';          // 15% gentle wall (3 buildings at same Z)
            if (rand < 0.85) return 'staircase';            // 15% staircase
            return 'wall'; // 15% wall (4 buildings, 1 lane open)
        } else if (level <= 5) {
            // Mid levels: MORE dense patterns, less breathers
            if (rand < 0.05) return 'breather';    // 5% breather (reduced from 15%)
            if (rand < 0.20) return 'triple';      // 15% triple
            if (rand < 0.35) return 'gentle_wall'; // 15% gentle wall
            if (rand < 0.50) return 'wall';        // 15% wall (4 buildings)
            if (rand < 0.65) return 'staircase';   // 15% staircase
            if (rand < 0.80) return 'double';      // 15% double
            return 'procedural'; // 20% procedural (reduced from 55%)
        } else {
            // Late levels: VERY dense + wide building variants
            if (rand < 0.05) return 'breather';         // 5% breather (reduced from 8%)
            if (rand < 0.15) return 'wall';             // 10% wall
            if (rand < 0.24) return 'staircase';        // 8% staircase
            if (rand < 0.32) return 'wide_single';      // 8% wide single
            if (rand < 0.40) return 'wide_gap_regular'; // 8% wide + gap + regular
            if (rand < 0.46) return 'wide_sandwich';    // 6% wide sandwich
            if (rand < 0.50) return 'double_wide';      // 4% double wide (challenging)
            return 'procedural'; // 50% procedural (will be dense)
        }
    }

    // Initialize with some buildings - spawn across different types
    for(let i=0; i<15; i++) {
        const buildingData = createBuildingData();
        const available = getAvailableInstance(buildingData.type);

        if (!available) continue; // Skip if no instance available

        const instance = available.instance;
        const index = available.index;

        // Use lane-based positioning with separation checking
        let lanePosition;
        let validPosition = false;
        const zPos = -250 - (i*50); // Spawn further ahead for better visibility
        const buildingWidth = 1;

        // Try up to 8 times to find valid position
        for (let attempt = 0; attempt < 8; attempt++) {
            lanePosition = getRandomLane();
            if (hasMinimumSeparation(lanePosition, zPos, buildingWidth, instance)) {
                validPosition = true;
                break;
            }
        }

        // Skip spawn if no valid position found
        if (!validPosition) {
            continue;
        }

        // Set instance properties
        instance.active = true;
        instance.height = buildingData.height;
        instance.width = buildingWidth;

        // Random scale for variety
        const scaleX = Math.random() * 0.8 + 0.6;
        const scaleY = buildingData.height / 5;
        const scaleZ = Math.random() * 0.8 + 0.6;
        instance.scale.set(scaleX, scaleY, scaleZ);
        instance.originalScale = { x: scaleX, y: scaleY, z: scaleZ };

        // All geometries are centered (including cones), so position at height/2 for ground level
        const baseY = buildingData.height / 2;
        instance.position.set(lanePosition, baseY, zPos);
        instance.originalY = baseY;
        instance.opacity = 1;
        instance.nearMissCredited = false;

        // Update instance matrix
        const mesh = buildingData.type === 'box' ? boxInstancedMesh :
                     buildingData.type === 'pyramid' ? pyramidInstancedMesh :
                     cylinderInstancedMesh;
        updateInstanceMatrix(instance, mesh, index);
    }

    // --- 5. HIGH WALLS & LOW WALLS (VERTICAL MOVEMENT) - OBJECT POOLING ---
    const walls = [];
    const wallPool = []; // Pre-created walls for reuse
    const wallMat = new THREE.MeshBasicMaterial({ color: 0xff00ff, wireframe: true, transparent: true, opacity: 0.5 });

    // High wall: long horizontal rectangle at top (y=8-10)
    const highWallGeometry = new THREE.BoxGeometry(40, 1.5, 0.8); // Wide, thin, shallow

    // Low wall: long horizontal rectangle at ground level (y=0-2)
    const lowWallGeometry = new THREE.BoxGeometry(40, 1.5, 0.8);

    // Pre-create wall pool (16 walls total - mix of high and low, increased for more frequent spawning)
    for (let i = 0; i < 16; i++) {
        const isHigh = i < 8;
        const wall = new THREE.Mesh(
            isHigh ? highWallGeometry : lowWallGeometry,
            wallMat
        );
        wall.userData.type = isHigh ? 'high' : 'low';
        wall.userData.box = new THREE.Box3();
        wall.userData.originalScale = { x: 1, y: 1, z: 1 }; // Store for parallax
        wall.visible = false;
        wall.position.z = -1000; // Off screen
        scene.add(wall);
        wallPool.push(wall);
    }

    // Get wall from pool instead of creating new one
    function getWallFromPool(type, zPos, yOverride = null) {
        const wall = wallPool.find(w => !w.visible && w.userData.type === type);
        if (wall) {
            wall.visible = true;
            // Use yOverride if provided (for anti-camping), otherwise use default heights
            // Low walls are at y=0.75 (bottom at ground level) to prevent camping lowest position
            const yPos = yOverride !== null ? yOverride : (type === 'high' ? 5 : 0.75);
            wall.position.set(0, yPos, zPos);
            wall.userData.originalY = yPos; // Store original Y for parallax scaling
            return wall;
        }
        return null;
    }

    // --- BARRIER WALLS (STAR FOX STYLE - FULL COVERAGE WITH GAPS) ---
    const barrierWalls = [];
    const barrierWallPool = []; // Pool of barrier segments
    const barrierMat = new THREE.MeshBasicMaterial({
        color: 0xff0088,
        wireframe: true,
        transparent: true,
        opacity: 0.6
    });

    // Create vertical barrier segments (these stack to create full coverage)
    // Each barrier is 2 units tall, we need 3-4 to cover 0-8 range
    const barrierSegmentGeometry = new THREE.BoxGeometry(30, 2, 0.8); // Wide, medium height, thin

    // Pre-create barrier segment pool (24 segments - enough for 4 complete barriers with 6 segments each)
    for (let i = 0; i < 24; i++) {
        const barrier = new THREE.Mesh(barrierSegmentGeometry, barrierMat);
        barrier.userData.box = new THREE.Box3();
        barrier.userData.originalScale = { x: 1, y: 1, z: 1 };
        barrier.userData.type = 'barrier_segment';
        barrier.visible = false;
        barrier.position.z = -1000;
        scene.add(barrier);
        barrierWallPool.push(barrier);
    }

    // Spawn a complete barrier wall with gaps (Star Fox style)
    // gapConfig: array of gap positions, e.g. [{y: 2.5, height: 2.5}] for one gap
    function spawnBarrierWithGaps(zPos, gapConfig) {
        const fullHeight = 8; // Cover from y=0 to y=8
        const segmentHeight = 2; // Each barrier segment is 2 units tall
        const usedSegments = [];

        // Calculate which vertical positions need barriers (skip gaps)
        const positions = [];
        for (let y = 1; y < fullHeight; y += segmentHeight) {
            let isInGap = false;
            for (const gap of gapConfig) {
                if (y >= gap.y && y < gap.y + gap.height) {
                    isInGap = true;
                    break;
                }
            }
            if (!isInGap) {
                positions.push(y);
            }
        }

        // Spawn barrier segments at calculated positions
        for (const yPos of positions) {
            const segment = barrierWallPool.find(b => !b.visible);
            if (segment) {
                segment.visible = true;
                segment.position.set(0, yPos, zPos);
                segment.userData.originalY = yPos;
                usedSegments.push(segment);
            }
        }

        return usedSegments;
    }

    // Get predefined barrier configurations (Star Fox style patterns)
    function getBarrierConfig() {
        const configs = [
            // Single center gap
            [{ y: 3, height: 2.5 }],
            // Top gap only
            [{ y: 6, height: 2.5 }],
            // Bottom gap only
            [{ y: 0.5, height: 2.5 }],
            // Two gaps (top and bottom)
            [{ y: 0.5, height: 1.8 }, { y: 6, height: 2 }],
            // Two gaps (diagonal)
            [{ y: 1.5, height: 2 }, { y: 5, height: 2.5 }],
        ];
        return configs[Math.floor(Math.random() * configs.length)];
    }

    // --- 6. BONUS RINGS (RARE) - OBJECT POOLING ---
    const rings = [];
    const ringPool = []; // Pre-created rings for reuse
    // Simplified ring geometry for better performance
    const ringGeometry = new THREE.TorusGeometry(3, 0.3, 6, 12);
    const ringMat = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        wireframe: true,
        transparent: true,
        opacity: 0.6
    });
    const fuchsiaRingMat = new THREE.MeshBasicMaterial({
        color: 0xff00ff,
        wireframe: true,
        transparent: true,
        opacity: 0.7
    });

    // Pre-create ring pool (6 rings - enough for 2 sets of 3)
    for (let i = 0; i < 6; i++) {
        const ring = new THREE.Mesh(ringGeometry, ringMat);
        ring.rotation.x = 0;
        ring.rotation.y = 0;
        ring.userData.collected = false;
        ring.userData.originalScale = { x: 1, y: 1, z: 1 }; // Store for parallax
        ring.visible = false;
        ring.position.z = -1000; // Off screen
        scene.add(ring);
        ringPool.push(ring);
    }

    // Get ring from pool instead of creating new one
    function getRingFromPool() {
        const ring = ringPool.find(r => !r.visible);
        if (ring) {
            ring.visible = true;
            ring.userData.collected = false;
            ring.userData.collectTime = 0;
            ring.userData.missTracked = false; // Reset for difficulty tracking
            return ring;
        }
        return null;
    }

    // --- SHIELD PICKUPS (GREEN CAPSULES) ---
    const shieldPickups = [];
    const shieldPickupPool = [];
    const capsuleGeometry = new THREE.CapsuleGeometry(0.5, 1.5, 4, 8);
    const capsuleMat = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        wireframe: true,
        transparent: true,
        opacity: 0.7
    });

    // Pre-create shield pickup pool (3 pickups)
    for (let i = 0; i < 3; i++) {
        const pickup = new THREE.Mesh(capsuleGeometry, capsuleMat);
        pickup.scale.set(2, 2, 2); // Make shields 2x larger for better visibility
        pickup.userData.originalScale = { x: 2, y: 2, z: 2 }; // Store for parallax
        pickup.userData.collected = false;
        pickup.visible = false;
        pickup.position.z = -1000;
        scene.add(pickup);
        shieldPickupPool.push(pickup);
    }

    // Get shield pickup from pool
    function getShieldPickupFromPool() {
        const pickup = shieldPickupPool.find(p => !p.visible);
        if (pickup) {
            pickup.visible = true;
            pickup.userData.collected = false;
            return pickup;
        }
        return null;
    }

    // --- WIND GUSTS (SPEED BOOSTS) ---
    const windGusts = [];
    const windGustPool = [];

    // Create wind gust visual - @ symbol / snail shell spiral pattern
    function createWindGustGeometry() {
        const group = new THREE.Group();
        const gustColor = 0xbbbbbb; // Off-grey

        // Create 3 staggered circular lines (@ symbol / snail shell pattern)
        for (let i = 0; i < 3; i++) {
            const radius = 2.0 + (i * 0.4);
            const ringGeom = new THREE.TorusGeometry(radius, 0.12, 4, 20);
            const ringMat = new THREE.MeshBasicMaterial({
                color: gustColor,
                wireframe: true,
                transparent: true,
                opacity: 0.65 - (i * 0.1)
            });
            const ring = new THREE.Mesh(ringGeom, ringMat);
            // Offset each ring slightly to create spiral/@ effect
            ring.position.z = i * 0.3;
            ring.userData.rotationOffset = i * 0.3;
            group.add(ring);
        }

        group.userData.animationTime = 0;
        return group;
    }

    // Pre-create wind gust pool (5 gusts - needed for bonus phases with 2-3 gusts)
    for (let i = 0; i < 5; i++) {
        const gust = createWindGustGeometry();
        gust.userData.collected = false;
        gust.userData.originalScale = { x: 1, y: 1, z: 1 };
        gust.visible = false;
        gust.position.z = -1000;
        scene.add(gust);
        windGustPool.push(gust);
    }

    // Get wind gust from pool
    function getWindGustFromPool() {
        const gust = windGustPool.find(g => !g.visible);
        if (gust) {
            gust.visible = true;
            gust.userData.collected = false;
            gust.userData.collectTime = 0;
            return gust;
        }
        return null;
    }

    // Spawn shield pickup if conditions are met
    function trySpawnShieldPickup() {
        // Only spawn if player owns shields AND doesn't have full shields (has lost some or all shield)
        if (abilities.shields.owned && (!shieldActive || shieldHits >= 1) && shieldPickups.length === 0) {
            const pickup = getShieldPickupFromPool();
            if (pickup) {
                pickup.position.set(
                    (Math.random() - 0.5) * 10,
                    Math.random() * 3 + 2,
                    -220 // Further ahead for better visibility
                );
                shieldPickups.push(pickup);
            }
        }
    }

    // Phase system for balancing building dodging and ring collection
    // Smart phase configuration with intensity-based balancing
    const phaseConfig = {
        buildings: {
            intensity: 'high',
            duration: [30000, 60000], // 30-60 seconds - CORE MECHANIC - CAN CHAIN 2-3x for 60-180s runs
            canFollowItself: true, // BUILDINGS CAN STACK - 2-3 phases in a row for extended gameplay
            description: 'Dodge buildings - main risk/reward gameplay'
        },
        walls: {
            intensity: 'high',
            duration: [15000, 22000], // 15-22 seconds - Quick change of pace
            canFollowItself: false,
            description: 'Navigate high/low walls'
        },
        rings: {
            intensity: 'low',
            duration: [10000, 15000], // 10-15 seconds - Quick collection moment
            canFollowItself: false,
            description: 'Collect rings - peaceful'
        },
        coins: {
            intensity: 'low',
            duration: [12000, 18000], // 12-18 seconds - Quick collection
            canFollowItself: false,
            description: 'Collect scattered coins'
        },
        bonus: {
            intensity: 'medium',
            duration: [15000, 22000], // 15-22 seconds - Special moment
            canFollowItself: false,
            description: 'Coin run + wind gusts'
        },
        breather: {
            intensity: 'calm',
            duration: [12000, 18000], // 12-18 seconds - Quick rest
            canFollowItself: false,
            description: 'Just flying - minimal obstacles'
        },
        mixed: {
            intensity: 'medium',
            duration: [20000, 30000], // 20-30 seconds - Light buildings + coins (ALWAYS shorter than pure buildings)
            canFollowItself: false,
            description: 'Light buildings + coins'
        },
        boss_gauntlet: {
            intensity: 'extreme',
            duration: [60000, 90000], // 60-90 seconds - NEARLY UNSUSTAINABLE gauntlet
            canFollowItself: false,
            description: 'BOSS GAUNTLET - Relentless buildings barrage, nearly unsustainable'
        }
    };

    // Phase tracking
    // NOTE: For future seeding feature - seeded runs should ALWAYS follow:
    // 1. Short breather (5s) for orientation
    // 2. Dense buildings phase for immediate engagement
    // This pattern is now enforced for all runs via RULE 7 in selectNextPhase()
    let currentPhase = 'breather'; // Start with short breather for orientation
    let phaseStartTime = 0;
    let phaseDuration = 5000; // Initial 5-second breather
    let phaseHistory = []; // Last 5 phases
    let phaseLastSeen = {
        buildings: -Infinity,
        walls: -Infinity,
        rings: -Infinity,
        coins: -Infinity,
        bonus: -Infinity,
        breather: -Infinity,
        mixed: -Infinity,
        boss_gauntlet: -Infinity
    };
    let totalPhasesCompleted = 0;

    // Phase spawn flags
    let ringsSpawnedThisPhase = false;
    let wallsSpawnedThisPhase = false;
    let coinsSpawnedThisPhase = false;
    let mixedSpawnedThisPhase = false;
    let bonusSpawnedThisPhase = false;
    let breatherSetup = false;

    // Smart phase selection algorithm
    function selectNextPhase(milesFlown = 0) {
        const lastPhase = phaseHistory[phaseHistory.length - 1] || 'none';
        const lastIntensity = lastPhase !== 'none' ? phaseConfig[lastPhase].intensity : 'medium';

        // Calculate weights for each phase
        let weights = {};

        for (let phaseName in phaseConfig) {
            const config = phaseConfig[phaseName];
            let weight = 100; // Base weight

            // RULE 1: Can't follow itself
            if (!config.canFollowItself && lastPhase === phaseName) {
                weight = 0;
                continue;
            }

            // RULE 2: Can't be in recent history (last 3 phases)
            // EXCEPTION: Buildings can chain 2-3 times, so skip this check for buildings
            if (phaseName !== 'buildings' && phaseHistory.slice(-3).includes(phaseName)) {
                weight *= 0.1; // Drastically reduce weight
            }

            // RULE 3: Intensity balancing with BUILDINGS CHAINING BONUS
            // Buildings can stack 2-3 times for extended gameplay
            if (phaseName === 'buildings' && lastPhase === 'buildings') {
                // Count consecutive building phases
                let consecutiveBuildings = 1;
                for (let i = phaseHistory.length - 1; i >= 0 && phaseHistory[i] === 'buildings'; i--) {
                    consecutiveBuildings++;
                }

                // Encourage chaining up to 3 buildings phases (90-180s of buildings)
                if (consecutiveBuildings === 1) {
                    weight *= 2.0; // High chance of 2nd buildings phase
                } else if (consecutiveBuildings === 2) {
                    weight *= 1.2; // Decent chance of 3rd buildings phase
                } else {
                    weight *= 0.3; // After 3rd, strongly prefer variety
                }
            } else if (lastIntensity === 'high' && config.intensity === 'high' && phaseName !== 'buildings') {
                weight *= 0.3; // Discourage other high intensity after high (but not buildings)
            } else if (lastIntensity === 'high') {
                if (config.intensity === 'calm' || config.intensity === 'low') {
                    weight *= 3.0; // Strongly prefer calm/low after high intensity
                }
            } else if (lastIntensity === 'calm') {
                if (config.intensity === 'high' || config.intensity === 'medium') {
                    weight *= 2.0; // Prefer action after calm
                } else if (config.intensity === 'calm') {
                    weight *= 0.2; // Don't want back-to-back calm
                }
            } else if (lastIntensity === 'low') {
                if (config.intensity === 'high') {
                    weight *= 1.5; // Slight preference for action
                }
            }

            // RULE 4: Time since last seen
            // Phases not seen recently get boosted weight
            const timeSinceLastSeen = totalPhasesCompleted - phaseLastSeen[phaseName];
            if (timeSinceLastSeen > 5) {
                weight *= 2.0; // Haven't seen in a while
            } else if (timeSinceLastSeen > 3) {
                weight *= 1.5;
            }

            // RULE 5: Bonus stages should be rare (10% base chance)
            if (phaseName === 'bonus') {
                weight *= 0.15; // Make rare but possible
            }

            // RULE 6: Breathers every 3-4 phases
            if (phaseName === 'breather') {
                const phasesSinceLastBreather = phaseHistory.slice().reverse()
                    .findIndex(p => p === 'breather');

                if (phasesSinceLastBreather >= 3 || phasesSinceLastBreather === -1) {
                    weight *= 3.0; // It's been a while, encourage breather
                } else if (phasesSinceLastBreather < 2) {
                    weight *= 0.2; // Too soon for another breather
                }
            }

            // RULE 7: First phase after initial breather MUST be buildings
            // This ensures players get core gameplay immediately after orientation
            const isFirstRealPhase = phaseHistory.length === 0 ||
                                    (phaseHistory.length === 1 && phaseHistory[0] === 'breather');
            if (isFirstRealPhase) {
                if (phaseName === 'buildings') {
                    weight *= 1000; // Virtually guarantee buildings as first phase
                } else if (phaseName !== 'breather') {
                    weight *= 0.01; // Eliminate other phases
                }
            }

            // RULE 8: Early game adjustments (first 50 miles)
            if (milesFlown < 50) {
                if (phaseName === 'walls') weight *= 0.5; // Fewer walls early
                if (phaseName === 'breather') weight *= 0.3; // Fewer breathers early (already had initial one)
                if (phaseName === 'bonus') weight *= 0.5; // Fewer bonus stages early
            }

            // RULE 9: Late game variety (150+ miles)
            if (milesFlown >= 150) {
                if (phaseName === 'mixed') weight *= 2.0; // More variety late
                if (phaseName === 'bonus') weight *= 1.5; // More bonus stages late
            }

            // RULE 10: Boss Gauntlet triggers at specific milestones (replaces old rotating boss)
            // Trigger at 150 miles, then every 150 miles (300, 450, 600...)
            // Boss gauntlet is EXTREME - nearly unsustainable density, constant dodging
            if (phaseName === 'boss_gauntlet') {
                if (milesFlown >= 150 && (milesFlown === 150 || (milesFlown - 150) % 150 === 0)) {
                    weight *= 1000; // Virtually guarantee boss gauntlet at milestone
                } else {
                    weight *= 0.01; // Extremely rare otherwise
                }
            }

            // RULE 11: Intensity balancing for "extreme" phases (boss gauntlet)
            if (lastIntensity === 'extreme') {
                if (config.intensity === 'calm' || config.intensity === 'low') {
                    weight *= 5.0; // Strongly prefer calm after extreme intensity
                } else if (config.intensity === 'high' || config.intensity === 'extreme') {
                    weight *= 0.05; // Avoid back-to-back extreme/high
                }
            }

            // RULE 12: First 15 miles ONLY breathers and buildings
            // This creates a focused onboarding experience where players learn the core dodging mechanic
            // Rings, coins, wind, walls, and mixed phases are introduced AFTER mile 15
            if (milesFlown < 15) {
                if (phaseName !== 'breather' && phaseName !== 'buildings') {
                    weight = 0; // Eliminate all non-core phases in first 15 miles
                }
            }

            weights[phaseName] = Math.max(weight, 0);
        }

        // Weighted random selection
        const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
        let random = Math.random() * totalWeight;

        for (let phaseName in weights) {
            random -= weights[phaseName];
            if (random <= 0) {
                // Update tracking
                phaseHistory.push(phaseName);
                if (phaseHistory.length > 5) phaseHistory.shift(); // Keep last 5
                phaseLastSeen[phaseName] = totalPhasesCompleted;
                totalPhasesCompleted++;

                // Set duration (extend buildings phase for late game to create relentless feeling)
                const config = phaseConfig[phaseName];
                let minDuration = config.duration[0];
                let maxDuration = config.duration[1];

                // PHASE DURATION SCALING: Buildings phase duration increases with miles
                if (phaseName === 'buildings' && milesFlown >= 500) {
                    minDuration = 240000; // 4 minutes minimum - MARATHON GAUNTLET
                    maxDuration = 420000; // 7 minutes maximum - 6-8 phases worth!
                } else if (phaseName === 'buildings' && milesFlown >= 400) {
                    minDuration = 180000; // 3 minutes minimum
                    maxDuration = 300000; // 5 minutes maximum
                } else if (phaseName === 'buildings' && milesFlown >= 300) {
                    minDuration = 120000; // 2 minutes minimum
                    maxDuration = 180000; // 3 minutes maximum
                } else if (phaseName === 'buildings' && milesFlown >= 100) {
                    minDuration = 45000; // 45 seconds minimum
                    maxDuration = 90000; // 90 seconds maximum
                } else if (phaseName === 'buildings' && milesFlown >= 50) {
                    minDuration = 40000; // 40 seconds minimum
                    maxDuration = 75000; // 75 seconds maximum
                } else if (phaseName === 'buildings' && milesFlown < 20) {
                    // EARLY GAME ONBOARDING: Long first buildings phase to teach dodging
                    minDuration = 60000; // 1 minute minimum
                    maxDuration = 120000; // 2 minutes maximum - establish "this is the game"
                }

                // Shorten breathers at ultra-late game - make relief brief
                if ((phaseName === 'breather' || phaseName === 'rings') && milesFlown >= 400) {
                    minDuration = 8000; // 8 seconds (reduced from default)
                    maxDuration = 12000; // 12 seconds - brief relief before back to hell
                }

                const duration = minDuration + Math.random() * (maxDuration - minDuration);

                return { phase: phaseName, duration: duration };
            }
        }

        // Fallback (shouldn't happen)
        return { phase: 'buildings', duration: 20000 };
    }

    // Helper: Check if all phase items collected
    function allPhaseItemsCollected() {
        // Safety check: arrays might not be initialized yet
        if (typeof rings === 'undefined' || typeof walls === 'undefined' ||
            typeof coins === 'undefined' || typeof windGusts === 'undefined') {
            return false; // Not ready for phase transitions yet
        }

        switch(currentPhase) {
            case 'rings':
                return ringsSpawnedThisPhase && rings.length === 0;
            case 'walls':
                return wallsSpawnedThisPhase && walls.length === 0;
            case 'coins':
                return coinsSpawnedThisPhase && coins.length === 0;
            case 'bonus':
                return bonusSpawnedThisPhase && coins.length === 0 && windGusts.length === 0;
            case 'mixed':
                // For mixed phase, just check if coins are collected (time-based for buildings)
                return mixedSpawnedThisPhase && coins.length === 0;
            case 'breather':
                return breatherSetup; // Time-based only
            case 'buildings':
                return true; // Time-based with wave spawning
            default:
                return true;
        }
    }

    // --- 6.5. COINS (COLLECTIBLES) - OBJECT POOLING ---
    const coins = [];
    const coinPool = []; // Pre-created coins for reuse
    // Spinning yellow coins that face the camera
    const coinGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.1, 8); // Thin cylinder (slightly 3D)
    const coinMat = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        wireframe: true,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
    });

    // Pre-create reusable rotation objects to prevent garbage collection hitching
    const coinXRotQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);
    const coinSpinQuat = new THREE.Quaternion();
    const coinLookAtQuat = new THREE.Quaternion();
    const coinZAxis = new THREE.Vector3(0, 0, 1);

    // Pre-create coin pool (30 coins - enough for bonus/coins phases with 12-18 coins)
    for (let i = 0; i < 30; i++) {
        const coin = new THREE.Mesh(coinGeometry, coinMat.clone());
        coin.userData.collected = false;
        coin.userData.spinSpeed = 0.05; // Rotation speed
        coin.userData.spinAngle = 0; // Track total spin rotation
        coin.userData.originalScale = { x: 1, y: 1, z: 1 }; // Store for parallax
        coin.visible = false;
        coin.position.z = -1000; // Off screen
        scene.add(coin);
        coinPool.push(coin);
    }

    // Get coin from pool instead of creating new one
    function getCoinFromPool() {
        const coin = coinPool.find(c => !c.visible);
        if (coin) {
            coin.visible = true;
            coin.userData.collected = false;
            return coin;
        }
        return null;
    }

    // --- SPATIAL OVERLAP PREVENTION ---
    // Universal function to check if a position is clear of all other game objects
    // Prevents "monster spawns" where multiple objects overlap (rings + buildings + coins + wind)
    function isPositionClear(x, y, z, minDistance = 6) {
        // Check against buildings
        for (const building of buildings) {
            if (!building.active) continue;
            const dx = building.position.x - x;
            const dy = building.position.y - y;
            const dz = building.position.z - z;
            const distSq = dx * dx + dy * dy + dz * dz;
            if (distSq < minDistance * minDistance) {
                return false; // Too close to building
            }
        }

        // Check against rings
        for (const ring of rings) {
            if (!ring.visible) continue;
            const dx = ring.position.x - x;
            const dy = ring.position.y - y;
            const dz = ring.position.z - z;
            const distSq = dx * dx + dy * dy + dz * dz;
            if (distSq < minDistance * minDistance) {
                return false; // Too close to ring
            }
        }

        // Check against coins
        for (const coin of coins) {
            if (!coin.visible) continue;
            const dx = coin.position.x - x;
            const dy = coin.position.y - y;
            const dz = coin.position.z - z;
            const distSq = dx * dx + dy * dy + dz * dz;
            if (distSq < minDistance * minDistance) {
                return false; // Too close to coin
            }
        }

        // Check against wind gusts
        for (const gust of windGusts) {
            if (!gust.visible) continue;
            const dx = gust.position.x - x;
            const dy = gust.position.y - y;
            const dz = gust.position.z - z;
            const distSq = dx * dx + dy * dy + dz * dz;
            if (distSq < minDistance * minDistance) {
                return false; // Too close to wind gust
            }
        }

        // Check against walls
        for (const wall of walls) {
            if (!wall.visible) continue;
            const dx = wall.position.x - x;
            const dy = wall.position.y - y;
            const dz = wall.position.z - z;
            const distSq = dx * dx + dy * dy + dz * dz;
            if (distSq < minDistance * minDistance) {
                return false; // Too close to wall
            }
        }

        // Check against barrier walls
        for (const barrier of barrierWalls) {
            if (!barrier.visible) continue;
            const dx = barrier.position.x - x;
            const dy = barrier.position.y - y;
            const dz = barrier.position.z - z;
            const distSq = dx * dx + dy * dy + dz * dz;
            if (distSq < minDistance * minDistance) {
                return false; // Too close to barrier
            }
        }

        return true; // Position is clear
    }

    // --- COIN SPARKLE PARTICLES ---
    const sparkles = [];
    const sparkleGeometry = new THREE.PlaneGeometry(0.2, 0.2);
    const sparkleMat = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        transparent: true,
        opacity: 1,
        side: THREE.DoubleSide
    });

    // Spawn sparkle particles at coin collection
    function spawnCoinSparkles(x, y, z) {
        const particleCount = 6; // 6 sparkle particles
        for (let i = 0; i < particleCount; i++) {
            const sparkle = new THREE.Mesh(sparkleGeometry, sparkleMat.clone());
            sparkle.position.set(x, y, z);

            // Random velocity for each particle
            sparkle.userData.velocity = {
                x: (Math.random() - 0.5) * 0.15,
                y: Math.random() * 0.15 + 0.05,
                z: (Math.random() - 0.5) * 0.15
            };
            sparkle.userData.life = 30; // Frames to live
            sparkle.userData.maxLife = 30;

            scene.add(sparkle);
            sparkles.push(sparkle);
        }
    }

    // --- CHRISTMAS SNOW (Seasonal: Until Jan 1st) ---
    const snowflakes = [];
    const isChristmasSeason = () => {
        const now = new Date();
        const month = now.getMonth(); // 0-11
        const day = now.getDate();
        // Show snow from Dec 20 through Jan 1
        return (month === 11 && day >= 20) || (month === 0 && day === 1);
    };

    if (isChristmasSeason()) {
        const snowGeometry = new THREE.CircleGeometry(0.15, 6); // Small hexagon
        const snowMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide
        });

        // Pre-create 50 snowflakes for subtle effect
        for (let i = 0; i < 50; i++) {
            const snowflake = new THREE.Mesh(snowGeometry, snowMat.clone());

            // Random starting positions spread across view
            snowflake.position.x = (Math.random() - 0.5) * 40; // Wide spread
            snowflake.position.y = Math.random() * 20 + 5; // High up
            snowflake.position.z = (Math.random() - 0.5) * 100 - 50; // Depth variation

            // Random fall speeds and drift
            snowflake.userData.fallSpeed = Math.random() * 0.02 + 0.01; // 0.01-0.03
            snowflake.userData.driftSpeed = (Math.random() - 0.5) * 0.01; // Slight horizontal drift
            snowflake.userData.rotationSpeed = (Math.random() - 0.5) * 0.02; // Gentle rotation

            scene.add(snowflake);
            snowflakes.push(snowflake);
        }
    }

    // --- CHECKPOINT GATE ---
    const gates = [];
    const gateGeometry = new THREE.BoxGeometry(20, 8, 0.5);
    const gateMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00, wireframe: true, transparent: true, opacity: 0.6 });

    function createCheckpointGate() {
        // Simple torus ring gate (optimized for Edge)
        const simpleGateGeometry = new THREE.TorusGeometry(8, 0.4, 6, 12);
        const gate = new THREE.Mesh(simpleGateGeometry, gateMaterial);

        gate.position.set(0, 4, -200);
        gate.userData.passed = false;
        scene.add(gate);
        gates.push(gate);

        return gate;
    }

    /* --- ROTATING BOSS (MINI-BOSS CHALLENGE) --- COMMENTED OUT - NEEDS REWORK
    const bosses = [];
    let bossEncounterCount = 0; // Track number of boss encounters for rotation direction
    let bossActive = false; // Flag to prevent other spawns during boss encounter
    const bossMaterial = new THREE.MeshBasicMaterial({ color: 0xff00ff, wireframe: true, transparent: true, opacity: 0.7 });

    // Create rotating boss structure - giant cylinder with blades
    function createRotatingBoss() {
        const bossGroup = new THREE.Group();

        // Central cylinder (the "axle")
        const axleGeometry = new THREE.CylinderGeometry(1, 1, 20, 8);
        const axle = new THREE.Mesh(axleGeometry, bossMaterial);
        axle.rotation.z = Math.PI / 2; // Horizontal
        bossGroup.add(axle);

        // Create 4 blades arranged around the cylinder
        const bladeGeometry = new THREE.BoxGeometry(3, 18, 0.5);
        for (let i = 0; i < 4; i++) {
            const blade = new THREE.Mesh(bladeGeometry, bossMaterial.clone());
            const angle = (i / 4) * Math.PI * 2;
            blade.position.y = Math.cos(angle) * 10;
            blade.position.x = Math.sin(angle) * 10;
            blade.rotation.z = angle;
            bossGroup.add(blade);
        }

        bossGroup.position.set(0, 4, -400); // Spawn far ahead
        bossGroup.userData.rotationSpeed = 0.02; // Slow rotation
        bossGroup.userData.active = false;
        bossGroup.userData.box = new THREE.Box3();
        bossGroup.userData.originalScale = { x: 1, y: 1, z: 1 }; // Store for parallax

        scene.add(bossGroup);
        return bossGroup;
    }

    // Pre-create boss pool (12 bosses - enough for 3 encounters of 4 bosses each)
    const bossPool = [];
    for (let i = 0; i < 12; i++) {
        bossPool.push(createRotatingBoss());
    }

    let bossesDefeated = 0; // Track how many bosses defeated in current encounter
    const totalBossesPerEncounter = 4; // 4 bosses per encounter
    const bossSpacing = 120; // Distance between bosses (closer spacing for better flow)

    function spawnBoss() {
        bossEncounterCount++;
        bossActive = true; // Set flag to prevent other spawns
        bossesDefeated = 0; // Reset counter for new encounter

        // Cancel invincibility for boss arena (bosses must be fair challenge)
        if (invincibilityActive) {
            invincibilityActive = false;
            invincibilityEndTime = 0;
            paperMat.color.setHex(originalPlaneColor); // Revert to original teal
            crashMessage = 'INVINCIBILITY DISABLED';
            crashMessageTimer = 60;
        }

        // Clear arena - hide all buildings, walls, and coins
        buildings.forEach(b => {
            b.visible = false;
            b.position.z = -500;
        });
        walls.forEach(w => {
            w.visible = false;
            w.position.z = -1000;
        });
        coins.forEach(c => {
            c.visible = false;
            c.position.z = -1000;
            c.userData.collected = false;
        });
        // Clear active arrays
        walls.length = 0;
        coins.length = 0;

        // Spawn ONLY the first boss - others will spawn after each defeat
        spawnNextBoss();
    }

    function spawnNextBoss() {
        const boss = bossPool.find(b => !b.userData.active);
        if (!boss) return; // No more available bosses in pool

        boss.userData.active = true;
        boss.visible = true;
        boss.userData.dodged = false; // Reset dodge flag for new boss
        boss.position.set(0, 4, -220); // Spawn further ahead for better visibility (Guitar Hero-style)

        // Consistent moderate speed - challenging but dodgeable
        const baseSpeed = 0.015;

        // Alternate rotation direction based on how many bosses defeated
        const rotateLeft = bossesDefeated % 2 === 0;
        boss.userData.rotationSpeed = rotateLeft ? -baseSpeed : baseSpeed;

        bosses.push(boss);
    }
    END BOSS CODE */

    // Temporary boss replacement: intense building phase
    let bossActive = false; // Keep flag for phase system compatibility

    // Death and respawn handler
    function handleDeath() {
        // Lose a life
        currentLives--;
        uiControls.updateLivesDisplay(currentLives, maxLives);

        if (currentLives > 0) {
            // Still have lives - respawn at current position with 1 heart
            crashMessage = `LIFE LOST! ${currentLives} REMAINING`;
            crashMessageTimer = 120; // Show for 2 seconds

            // Respawn after brief delay
            setTimeout(() => {
                // No hearts on respawn - must reach checkpoint to refill
                currentHealth = 0;
                uiControls.updateHealthBar(currentHealth, maxHealth);

                // Reset ship position to center
                shipGroup.position.x = 0;
                shipGroup.position.y = 0;
                targetX = 0;
                targetY = 2.5;

                // Activate grace period to give player time to reach checkpoint
                gracePeriodActive = true;
                gracePeriodEndTime = Date.now() + 5000; // 5 seconds grace period

                crashMessage = `NO HEARTS! FIND CHECKPOINT!`;
                crashMessageTimer = 90;
            }, 1000); // 1 second delay
        } else {
            // Game Over - no lives left
            triggerGameOver();
        }
    }

    function triggerGameOver() {
        // Stop the game completely
        animationRunning = false;
        isPaused = true;

        // Show Game Over overlay with stats after a brief delay
        setTimeout(() => {
            uiControls.showGameOver(distance, score, highScore);
        }, 500);
    }

    // Reset game state and start new run (for RETRY button)
    window.resetAndStartNewRun = function() {
        // Reset core game state
        score = 0;
        distance = 0;
        time = 0;
        currentHealth = maxHealth;
        currentLives = maxLives;
        checkpointHistory = [];
        currentLevel = 1;
        nextCheckpoint = 25; // First checkpoint at 25 miles
        isFirstCheckpoint = true;

        // Reset difficulty and timing
        difficultyScalar = 1.0;
        gameStartTime = 0;
        phaseStartTime = Date.now();
        lastFrameTime = null;

        // Reset phase system for fresh start
        currentPhase = 'breather'; // Start with short breather
        phaseDuration = 5000; // 5 seconds to get oriented
        phaseHistory = [];
        totalPhasesCompleted = 0;
        // Reset phase spawn flags
        ringsSpawnedThisPhase = false;
        wallsSpawnedThisPhase = false;
        coinsSpawnedThisPhase = false;
        mixedSpawnedThisPhase = false;
        bonusSpawnedThisPhase = false;
        breatherSetup = false;

        // Reset player position and movement
        shipGroup.position.x = 0;
        shipGroup.position.y = 0;
        curX = 0;
        curY = 0;
        targetX = 0;
        targetY = 2.5;
        prevX = 0;
        prevY = 2.5;
        velocityX = 0;
        velocityY = 0;

        // Reset shields and grace period
        shieldActive = false;
        shieldHits = 0;
        gracePeriodActive = false;
        speedBoostActive = false;

        // Reset boost effects
        nearMissBoost = 0;
        ringBoost = 0;

        // Reset camping detection
        campingDetected = false;
        campingTimer = 0;
        lastCampCheckPosition = { x: 0, y: 0 };
        playerLane = 2;
        lastPlayerLane = 2;
        timeInSameLane = 0;
        antiCampingActive = false;

        // Clear all game objects
        buildings.forEach(b => {
            b.position.z = -1000;
            b.active = false;
        });
        walls.forEach(w => scene.remove(w));
        walls.length = 0;
        rings.forEach(r => scene.remove(r));
        rings.length = 0;
        gates.forEach(g => scene.remove(g));
        gates.length = 0;

        // Clear debris chunks
        collisionDebris.forEach(chunk => {
            chunk.visible = false;
            chunk.userData.active = false;
            chunk.position.set(0, 0, -1000);
        });
        collisionDebris.length = 0;

        // Update UI
        uiControls.updateHealthBar(currentHealth, maxHealth);
        uiControls.updateLivesDisplay(currentLives, maxLives);
        uiControls.updateShieldBar(shieldActive, shieldHits);

        // Clear messages
        crashMessage = '';
        crashMessageTimer = 0;
        levelUpMessage = '';
        levelUpMessageTimer = 0;

        // Restart game - NOT paused
        isPaused = false;
        animationRunning = true;
        checkpointActive = false;
        animate();
    };

    // Checkpoint UI functions
    function showCheckpointUI(milesReached) {
        checkpointActive = true;
        isPaused = true;

        // Track checkpoint in history for regression (keep last 3)
        checkpointHistory.push(Math.floor(milesReached));
        if (checkpointHistory.length > 3) {
            checkpointHistory.shift(); // Remove oldest
        }

        // Replenish health at checkpoint
        currentHealth = maxHealth;
        uiControls.updateHealthBar(currentHealth, maxHealth);

        // Call UI module to show checkpoint overlay
        uiControls.showCheckpointUI({
            score,
            isFirstCheckpoint
        }, abilities);
    }

    function purchaseAbility(abilityKey) {
        const ability = abilities[abilityKey];

        // Cosmetic upgrades (color/shape/size) can be purchased multiple times
        const isCosmetic = abilityKey === 'randomColor' || abilityKey === 'changeShape' || abilityKey === 'smallPlane';

        // First checkpoint is free, subsequent checkpoints cost points
        const isFree = isFirstCheckpoint && !ability.owned;
        const canPurchase = isFree || (score >= ability.cost && (isCosmetic || !ability.owned));

        if (canPurchase) {
            if (!isFree) {
                score -= ability.cost;
            }

            // Mark as owned (cosmetic upgrades stay purchasable via the isCosmetic check above)
            ability.owned = true;

            // Disable first checkpoint bonus after first upgrade
            if (isFirstCheckpoint) {
                isFirstCheckpoint = false;
            }

            // Apply ability effect
            applyAbilityEffect(abilityKey);

            // Track upgrade for potential loss (risk/reward) - but not cosmetics multiple times
            if (!isCosmetic || !activeUpgrades.includes(abilityKey)) {
                activeUpgrades.push(abilityKey);
            }
            hasActiveUpgrades = true;
            buildingHitsSinceUpgrade = 0;
            hitsUntilUpgradeLoss = Math.floor(Math.random() * 2) + 3; // Random 3-4 hits

            // Close checkpoint UI
            closeCheckpointUI();
        }
    }

    function applyAbilityEffect(abilityKey) {
        switch(abilityKey) {
            case 'thrusters':
                baseSpeed = isMobile ? 0.825 : 1.0;
                break;
            case 'randomColor':
                // 8 colors - NEVER includes original teal (0x008080)
                const colors = [
                    0xff0000,  // Red
                    0x00ff00,  // Green
                    0x0000ff,  // Blue
                    0xffff00,  // Yellow
                    0xff00ff,  // Magenta
                    0x00ffff,  // Cyan
                    0xff8800,  // Orange
                    0xff1493   // Deep Pink
                ];
                const randomColor = colors[Math.floor(Math.random() * colors.length)];
                paperMat.color.setHex(randomColor);
                break;
            case 'changeShape':
                // Change to random plane shape
                const planeTypes = ['dart', 'glider', 'stunt'];
                const randomType = planeTypes[Math.floor(Math.random() * planeTypes.length)];
                changePlaneShape(randomType);
                break;
            case 'smallPlane':
                // Scale plane to 0.65x size (smaller for tighter maneuvers)
                shipGroup.scale.set(0.65, 0.65, 0.65);
                break;
            case 'coinMagnet':
                coinMagnetActive = true;
                coinMagnetEndTime = Date.now() + 90000; // 90 seconds
                break;
            case 'barrelRollUpgrade':
                // Barrel roll is now enabled (already exists in code)
                break;
            case 'increaseDifficulty':
                // Increase difficulty (handled in spawn logic)
                break;
            case 'invincibility':
                invincibilityActive = true;
                invincibilityEndTime = Date.now() + 120000; // 2 minutes (120 seconds)
                invincibilityPulsePhase = 0;
                break;
            case 'shields':
                shieldActive = true;
                shieldHits = 0;
                uiControls.updateShieldBar(shieldActive, shieldHits);
                break;
        }
    }

    function removeUpgrade(abilityKey) {
        if (!abilities[abilityKey]) return;

        // Revert the upgrade effect
        switch(abilityKey) {
            case 'thrusters':
                baseSpeed = isMobile ? 0.33 : 0.48; // Revert to base speed
                break;
            case 'randomColor':
                paperMat.color.setHex(originalPlaneColor); // Revert to original teal
                break;
            case 'changeShape':
                changePlaneShape('dart'); // Revert to dart shape
                break;
            case 'smallPlane':
                // Restore normal plane size
                shipGroup.scale.set(1.0, 1.0, 1.0);
                break;
            case 'coinMagnet':
                coinMagnetActive = false;
                coinMagnetEndTime = 0;
                break;
            case 'barrelRollUpgrade':
                // Can't really disable barrel roll mid-animation,
                // but we can mark it as not owned
                break;
            case 'increaseDifficulty':
                // Difficulty changes are applied during spawn,
                // so just marking as not owned will revert it
                break;
            case 'invincibility':
                invincibilityActive = false;
                invincibilityEndTime = 0;
                paperMat.color.setHex(originalPlaneColor); // Revert to original teal
                break;
            case 'shields':
                shieldActive = false;
                shieldHits = 0;
                uiControls.updateShieldBar(shieldActive, shieldHits);
                break;
        }

        // Mark ability as not owned
        abilities[abilityKey].owned = false;

        // Remove from active upgrades
        const index = activeUpgrades.indexOf(abilityKey);
        if (index > -1) {
            activeUpgrades.splice(index, 1);
        }

        // Update flag
        hasActiveUpgrades = activeUpgrades.length > 0;

        // Show message
        crashMessage = `UPGRADE LOST: ${abilities[abilityKey].name.toUpperCase()}`;
        crashMessageTimer = 90;
    }

    function closeCheckpointUI() {
        // Close the UI overlay
        uiControls.closeCheckpointUI();

        checkpointActive = false;

        // Activate 3-second grace period when exiting upgrade screen
        gracePeriodActive = true;
        gracePeriodEndTime = Date.now() + 3000;

        isPaused = false;
        const uiState = uiControls.getGameState();
        if (uiState.gameStarted) {
            animate();
        }
    }

    // --- LASER & ENEMY SYSTEM ---
    const laserGeometry = new THREE.BoxGeometry(0.1, 0.1, 2);
    const laserMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // MeshBasicMaterial doesn't support emissive

    const enemyGeometry = new THREE.DodecahedronGeometry(1.5, 0);
    const enemyMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true, transparent: true, opacity: 0.5 });

    function shootLaser() {
        if (!canShoot) return;

        const now = Date.now();
        if (now - lastShot < 300) return; // Fire rate limit (300ms)

        lastShot = now;

        // Recoil: Kick the ship back and up slightly for better game feel
        curY += 0.2;
        targetY -= 0.1;

        const laser = new THREE.Mesh(laserGeometry, laserMaterial);
        laser.position.set(curX, curY, 3.5);
        laser.userData.velocity = -2.5; // Move forward (slightly faster)
        scene.add(laser);
        lasers.push(laser);
    }

    // Enemy spawning removed - lasers now destroy buildings/walls instead
    // function spawnEnemy() {
    //     if (!abilities.lasers.owned) return;
    //     const enemy = new THREE.Mesh(enemyGeometry, enemyMaterial);
    //     enemy.position.set(
    //         (Math.random() - 0.5) * 12,
    //         Math.random() * 5 + 1,
    //         -200 - Math.random() * 50
    //     );
    //     enemy.userData.box = new THREE.Box3();
    //     scene.add(enemy);
    //     enemies.push(enemy);
    // }

    // --- 6. FLIGHT CONTROLS (STICKY) WITH SWAY PHYSICS ---
    let targetX = 0, targetY = 2.5, curX = 0, curY = 2.5;
    let velocityX = 0, velocityY = 0;
    let prevX = 0, prevY = 2.5;
    let isInteracting = false;

    // Barrel roll easter egg
    let barrelRollActive = false;
    let barrelRollProgress = 0;
    let lastTapTime = 0;

    // Speed boost
    let speedBoostActive = false;

    // Keyboard controls
    const keys = { left: false, right: false, up: false, down: false };

    const handleMove = (x, y) => {
        const rect = container.getBoundingClientRect();
        // Constrain to lane boundaries (-8 to +8) for both mobile and desktop
        // This prevents escaping outside viewport to avoid obstacles
        targetX = (((x - rect.left) / rect.width) * 2 - 1) * 8;
        targetY = 2.5 + (-((y - rect.top) / rect.height) * 2 + 1) * (isMobile ? 2.5 : 3);
    };

    const startInteraction = (x, y) => {
        isInteracting = true;
        handleMove(x, y);
    };

    const endInteraction = () => {
        isInteracting = false;
    };

    // Mouse events
    container.addEventListener('mousedown', e => startInteraction(e.clientX, e.clientY));
    container.addEventListener('mousemove', e => { if(isInteracting) handleMove(e.clientX, e.clientY); });
    window.addEventListener('mouseup', endInteraction);

    // Touch events with better mobile support
    container.addEventListener('touchstart', e => {
        e.preventDefault();
        startInteraction(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: false });

    container.addEventListener('touchmove', e => {
        e.preventDefault();
        if(isInteracting) handleMove(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: false });

    container.addEventListener('touchend', e => {
        e.preventDefault();
        endInteraction();
    }, { passive: false });

    // KEYBOARD CONTROLS (Arrow keys + WASD)
    window.addEventListener('keydown', e => {
        if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') keys.left = true;
        if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') keys.right = true;
        if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') keys.up = true;
        if (e.key === 'ArrowDown' || e.key.toLowerCase() === 's') keys.down = true;
        if (e.key === ' ') {
            e.preventDefault();
            if (abilities && abilities.lasers && abilities.lasers.owned) {
                shootLaser();
            } else {
                speedBoostActive = true;
            }
        }
        if (e.key.toLowerCase() === 'f') {
            e.preventDefault();
            uiControls.toggleFullscreen();
        }
        // ESC to pause/unpause
        if (e.key === 'Escape') {
            e.preventDefault();
            if (animationRunning && !checkpointActive) {
                // Trigger pause menu
                document.getElementById('pause-button').click();
            }
        }
        // F3 for debug overlay (Minecraft-style)
        if (e.key === 'F3' || e.code === 'F3') {
            e.preventDefault();
            console.log('F3 pressed, key:', e.key, 'code:', e.code);
            toggleDebugOverlay();
        }
    });

    window.addEventListener('keyup', e => {
        if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') keys.left = false;
        if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') keys.right = false;
        if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') keys.up = false;
        if (e.key === 'ArrowDown' || e.key.toLowerCase() === 's') keys.down = false;
        if (e.key === ' ') speedBoostActive = false;
    });

    // Fullscreen change handler - pause game when exiting fullscreen
    const handleFullscreenChange = () => {
        const isFullscreen = !!(document.fullscreenElement ||
                               document.webkitFullscreenElement ||
                               document.mozFullScreenElement ||
                               document.msFullscreenElement);

        // If we just exited fullscreen and game is running, pause it
        if (!isFullscreen && animationRunning && !isPaused && !checkpointActive) {
            document.getElementById('pause-button').click();
        }
    };

    // Listen for all fullscreen change events (cross-browser)
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    // BARREL ROLL - Double click/tap (requires upgrade)
    const triggerBarrelRoll = () => {
        if (!barrelRollActive && abilities.barrelRollUpgrade.owned) {
            barrelRollActive = true;
            barrelRollProgress = 0;
        }
    };

    // Mouse click controls - single click shoots (if lasers), double click barrel roll (if upgraded)
    let lastClickTime = 0;
    container.addEventListener('click', e => {
        const currentTime = new Date().getTime();
        const clickGap = currentTime - lastClickTime;

        if (clickGap < 300 && clickGap > 0) {
            // Double click - barrel roll
            e.preventDefault();
            triggerBarrelRoll();
        } else if (abilities && abilities.lasers && abilities.lasers.owned) {
            // Single click - shoot laser
            shootLaser();
        }
        lastClickTime = currentTime;
    });

    // Touch tap controls - single tap shoots (if lasers), double tap barrel roll (if upgraded)
    container.addEventListener('touchstart', e => {
        const currentTime = new Date().getTime();
        const tapGap = currentTime - lastTapTime;

        if (tapGap < 300 && tapGap > 0) {
            // Double tap - barrel roll
            e.preventDefault();
            triggerBarrelRoll();
        } else if (abilities && abilities.lasers && abilities.lasers.owned) {
            // Single tap - shoot laser
            shootLaser();
        }
        lastTapTime = currentTime;
    });

    // --- 7. ANIMATION LOOP, COLLISION & GAME LOGIC ---
    let baseSpeed = isMobile ? 0.33 : 0.48;
    let distance = 0, time = 0, collisionFlash = 0;
    const shipBox = new THREE.Box3();

    // Near-miss speed boost
    let nearMissBoost = 0; // Multiplier that decays over time
    const nearMissDistance = 2.5; // How close counts as "near miss"
    const nearMissDistSq = nearMissDistance * nearMissDistance; // Pre-calculate for performance

    // Ring boost - temporary speed boost when flying through rings
    let ringBoost = 0; // Multiplier that decays over time

    // Reusable Vector3, Box3, and Color objects to avoid garbage collection
    const tempVec3_1 = new THREE.Vector3();
    const tempVec3_2 = new THREE.Vector3();
    const tempBox = new THREE.Box3();
    const tempColor = new THREE.Color();

    // Set initial colors once
    renderer.setClearColor(0x000000, 1);
    terrainMat.color.setHex(0x00ffff);
    wireMat.color.setHex(0x00ffff);

    // UI Initialization
    const uiControls = initUI({
        onPlayClick: () => {
            phaseStartTime = Date.now();
            uiControls.updateHealthBar(currentHealth, maxHealth);
            uiControls.updateLivesDisplay(currentLives, maxLives);
            uiControls.updateShieldBar(shieldActive, shieldHits);
            if (!animationRunning) {
                animate();
            }
        },
        onPauseClick: (paused) => {
            isPaused = paused;
            if (!paused) {
                const uiState = uiControls.getGameState();
                if (uiState.gameStarted) {
                    animate();
                }
            }
        },
        onHowToPlayClick: () => {
            // Handled in UI module
        },
        onCloseInstructions: () => {
            if (!animationRunning) {
                animate();
            }
        },
        onCheckpointSkip: () => {
            closeCheckpointUI();
        },
        onAbilityPurchase: (abilityKey) => {
            purchaseAbility(abilityKey);
        },
        onResize: (isPortraitNow, isMobileNow) => {
            // Detect full screen mode
            const isFullscreen = !!(document.fullscreenElement ||
                                   document.webkitFullscreenElement ||
                                   document.mozFullScreenElement ||
                                   document.msFullscreenElement);

            if (isMobileNow) {
                camera.fov = isPortraitNow ? 85 : 75;
                camera.position.z = isPortraitNow ? 10 : 8;
            }
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);

            // Full screen optimizations - Edge gets lower pixel ratio for better performance
            let pixelRatio;
            if (isEdge) {
                pixelRatio = isFullscreen ? 1.25 : 1.5;
            } else {
                pixelRatio = isFullscreen ? 1.5 : 2;
            }
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, pixelRatio));

            // Performance optimization: Hide plane shadow in full screen mode
            shadowMesh.visible = !isFullscreen;

            const uiState = uiControls.getGameState();
            // Re-render on resize if paused (including start screen background)
            if (!animationRunning || uiState.isPaused) {
                renderer.render(scene, camera);
            }
        },
        getAnimationRunning: () => animationRunning
    });

    let animationRunning = false;
    let lastFrameTime = 0;
    let isPaused = false;

    // Update difficulty scalar based on player performance (hidden system)
    function updateDifficultyScalar(currentTime) {
        // Clean old metrics outside rolling window
        const windowStart = currentTime - difficultyWindow;
        difficultyMetrics.collisions = difficultyMetrics.collisions.filter(m => m.time > windowStart);
        difficultyMetrics.ringAttempts = difficultyMetrics.ringAttempts.filter(m => m.time > windowStart);
        difficultyMetrics.healthSamples = difficultyMetrics.healthSamples.filter(m => m.time > windowStart);

        // Sample current health periodically
        if (difficultyMetrics.healthSamples.length === 0 ||
            currentTime - difficultyMetrics.healthSamples[difficultyMetrics.healthSamples.length - 1].time > 1000) {
            difficultyMetrics.healthSamples.push({time: currentTime, health: currentHealth});
        }

        // Calculate performance factors
        const collisionCount = difficultyMetrics.collisions.filter(m => m.happened).length;
        const timeSinceLastHit = difficultyMetrics.lastHitTime === 0 ? difficultyWindow :
                                 Math.min(currentTime - difficultyMetrics.lastHitTime, difficultyWindow);

        const ringTotal = difficultyMetrics.ringAttempts.length;
        const ringHits = difficultyMetrics.ringAttempts.filter(m => m.success).length;
        const ringHitRate = ringTotal > 0 ? ringHits / ringTotal : 0.5;

        const avgHealth = difficultyMetrics.healthSamples.length > 0 ?
            difficultyMetrics.healthSamples.reduce((sum, m) => sum + m.health, 0) / difficultyMetrics.healthSamples.length :
            maxHealth;

        // Calculate target scalar
        let targetScalar = 1.0;

        // Collision penalty - ease down quickly after damage
        if (collisionCount > 0) {
            targetScalar -= collisionCount * 0.04; // -4% per collision in window
        }

        // Time without hits - ramp up slowly with clean play
        if (timeSinceLastHit > 10000) { // 10+ seconds clean
            const cleanBonus = Math.min((timeSinceLastHit - 10000) / 15000, 1.0); // Max bonus after 25s clean
            targetScalar += cleanBonus * 0.08; // Up to +8% for sustained clean play
        }

        // Ring accuracy - reward good play
        if (ringTotal >= 3) { // Need at least 3 attempts
            targetScalar += (ringHitRate - 0.5) * 0.12; // -6% to +6% based on accuracy
        }

        // Health state - lower difficulty when struggling
        const healthRatio = avgHealth / maxHealth;
        if (healthRatio < 0.5) {
            targetScalar -= (0.5 - healthRatio) * 0.2; // Up to -10% when low health
        }

        // Clamp to tight range
        targetScalar = Math.max(0.85, Math.min(1.15, targetScalar));

        // Smooth transition - lerp toward target (slow changes)
        const lerpSpeed = targetScalar < difficultyScalar ? 0.15 : 0.03; // Faster easing down, slower ramping up
        difficultyScalar += (targetScalar - difficultyScalar) * lerpSpeed;

        // Update debug metrics if enabled
        if (DEBUG_ENABLED) {
            debugMetrics.difficultyScalar = difficultyScalar;
        }
    }

    function animate(timestamp = performance.now()) {
        // Stop immediately if animation should not be running
        if (!animationRunning && isPaused) return;

        const uiState = uiControls.getGameState();
        if (!uiState.gameStarted && !animationRunning) return; // Don't start until play button clicked
        if (uiState.isPaused || isPaused) {
            animationRunning = false;
            return; // Stop animation loop when paused
        }

        // Initialize lastFrameTime and gameStartTime on first frame
        if (!animationRunning) {
            lastFrameTime = timestamp;
            gameStartTime = timestamp; // Track when game actually starts
        }
        animationRunning = true;

        // Frame-rate independent animation
        const deltaTime = lastFrameTime === 0 ? 1 : Math.min((timestamp - lastFrameTime) / 16.67, 2);
        lastFrameTime = timestamp;

        // Update difficulty scalar based on performance (hidden system)
        updateDifficultyScalar(timestamp);

        // Debug metrics tracking (internal only)
        if (DEBUG_ENABLED) {
            const frameDelta = timestamp - debugMetrics.lastFrameTime;
            debugMetrics.frameCount++;
            debugMetrics.fps = 1000 / frameDelta;
            debugMetrics.minFps = Math.min(debugMetrics.minFps, debugMetrics.fps);
            debugMetrics.maxFps = Math.max(debugMetrics.maxFps, debugMetrics.fps);
            debugMetrics.avgFrameTime = (debugMetrics.avgFrameTime * 0.9) + (frameDelta * 0.1);
            debugMetrics.lastFrameTime = timestamp;
            debugMetrics.performance.activeObjects =
                buildings.filter(b => b.visible).length +
                walls.filter(w => w.visible).length +
                rings.filter(r => r.visible).length;
            debugMetrics.performance.collisionChecks = 0; // Reset per frame
        }

        requestAnimationFrame(animate);
        time += 0.01 * deltaTime;

        // Warm-up phase - cap speed for first 60-90 seconds (hidden)
        const timeSinceStart = timestamp - gameStartTime;
        const inWarmup = timeSinceStart < warmupDuration;

        // Smooth transition out of warmup over 2 seconds (instead of instant jump)
        const transitionDuration = 2000; // 2 seconds
        const transitionStart = warmupDuration;
        const transitionEnd = warmupDuration + transitionDuration;

        let warmupSpeedCap;
        if (timeSinceStart < transitionStart) {
            warmupSpeedCap = 0.75; // Still in warmup
        } else if (timeSinceStart < transitionEnd) {
            // Smooth interpolation from 0.75 to 1.0
            const transitionProgress = (timeSinceStart - transitionStart) / transitionDuration;
            warmupSpeedCap = 0.75 + (0.25 * transitionProgress);
        } else {
            warmupSpeedCap = 1.0; // Full speed
        }

        // Speed boost effect (includes near-miss boost and ring boost) with deltaTime
        const speedBoostMultiplier = speedBoostActive ? 2.5 : 1.0;
        const totalSpeedMultiplier = speedBoostMultiplier + nearMissBoost + ringBoost;

        // Apply difficulty scalar and warm-up cap to base speed (hidden systems)
        const adjustedBaseSpeed = baseSpeed * difficultyScalar * warmupSpeedCap;
        let speed = adjustedBaseSpeed * totalSpeedMultiplier * deltaTime;

        // Enforce minimum forward speed (prevent game from stopping)
        const minSpeed = (isMobile ? 0.2 : 0.3) * deltaTime;
        speed = Math.max(speed, minSpeed);

        // Decay near-miss boost over time (frame-rate independent)
        if (nearMissBoost > 0) {
            nearMissBoost -= 0.01 * deltaTime; // Smooth decay
            if (nearMissBoost < 0) nearMissBoost = 0;
        }

        // Decay ring boost over time (frame-rate independent)
        if (ringBoost > 0) {
            ringBoost -= 0.008 * deltaTime; // Slightly slower decay than near-miss
            if (ringBoost < 0) ringBoost = 0;
        }

        // Update distance and calculate miles/level FIRST (needed for building logic)
        // Mobile gets faster progression (feels slower on iOS)
        const speedMultiplier = isMobile ? 120 : 50;
        distance += speed * speedMultiplier;
        const miles = distance / 5280;
        const newLevel = Math.floor(miles / 20) + 1; // Levels every 20 miles
        const levelDifficulty = Math.max(1, Math.min(newLevel, 5)); // Start at 1, cap at 5

        // Keyboard controls with deltaTime for smooth frame-rate independent movement
        // Reduced speed for less finicky, more controlled movement
        const keyboardSpeed = 0.3 * deltaTime;
        if (keys.left) targetX -= keyboardSpeed;
        if (keys.right) targetX += keyboardSpeed;
        if (keys.up) targetY += keyboardSpeed * 0.67;
        if (keys.down) targetY -= keyboardSpeed * 0.67;

        // Clamp targets to viewport bounds (match lane boundaries)
        targetX = Math.max(-8, Math.min(8, targetX));
        targetY = Math.max(0.5, Math.min(5.5, targetY));

        // Terrain treadmill (simplified - no fade to prevent flashing)
        [t1, t2].forEach(t => {
            t.position.z += speed;
            if (t.position.z >= 120) {
                t.position.z -= 240;
            }
        });

        // Animate particles (stars flying toward camera) - optimized with deltaTime
        const positions = particleGeom.attributes.position.array;
        for(let i=0; i<particleCount; i++) {
            const i3 = i * 3;
            const vel = particleVelocities[i];
            positions[i3] += vel.x * deltaTime;      // x drift
            positions[i3+2] += vel.z * deltaTime;    // z movement (toward camera)

            // Reset particle if it goes past camera (staggered to prevent flash)
            if(positions[i3+2] > 15) {
                const rand = Math.random();
                positions[i3] = (rand - 0.5) * 250;
                positions[i3+1] = (Math.random() - 0.5) * 250;
                positions[i3+2] = -125 - (rand * 20);
            }
        }
        particleGeom.attributes.position.needsUpdate = true;

        // Warp lines effect when speed boost/thrusters active
        const warpFactor = (speedBoostActive || abilities.thrusters.owned) ? 4.0 : 1.0;
        particles.scale.z = warpFactor;

        // Animate ground debris (scroll with terrain)
        debris.forEach(rock => {
            rock.position.z += speed;
            rock.rotation.y += rock.userData.rotationSpeed * deltaTime; // Slow rotation

            // Reset debris when it passes camera
            if (rock.position.z > 20) {
                rock.position.z = rock.userData.baseZ - 200;
                rock.position.x = (Math.random() - 0.5) * 80;
            }
        });

        // Animate trees (scroll with terrain, billboards always face camera)
        /* TREE SCROLLING - DISABLED
        trees.forEach(tree => {
            tree.position.z += speed;

            // Reset tree when it passes camera
            if (tree.position.z > 20) {
                tree.position.z = tree.userData.baseZ - 200;
                tree.position.x = (Math.random() - 0.5) * 70;
            }
        });
        */

        // Update collision debris with physics (iterate backwards to safely remove)
        for (let i = collisionDebris.length - 1; i >= 0; i--) {
            const chunk = collisionDebris[i];
            chunk.userData.lifetime++;

            if (!chunk.userData.onGround) {
                // AIRBORNE PHASE: Apply physics until chunk hits ground
                chunk.position.add(chunk.userData.velocity);

                // Strong downward pull (like magnetism to ground)
                chunk.userData.velocity.y -= 0.025; // Stronger gravity - pulls chunks down fast

                // Dynamic tumbling with wobble (erratic realistic spin)
                chunk.userData.wobblePhase += chunk.userData.wobbleSpeed;
                const wobbleX = Math.sin(chunk.userData.wobblePhase) * 0.02;
                const wobbleY = Math.cos(chunk.userData.wobblePhase * 1.3) * 0.02;
                const wobbleZ = Math.sin(chunk.userData.wobblePhase * 0.7) * 0.02;

                // Apply multi-axis rotation with wobble for realistic tumbling
                chunk.rotation.x += chunk.userData.rotationVelocity.x + wobbleX;
                chunk.rotation.y += chunk.userData.rotationVelocity.y + wobbleY;
                chunk.rotation.z += chunk.userData.rotationVelocity.z + wobbleZ;

                // Air resistance - slight slowdown of rotation while airborne
                chunk.userData.rotationVelocity.multiplyScalar(0.995);

                // Check if chunk hit the ground
                if (chunk.position.y <= 0.3) {
                    chunk.userData.onGround = true;
                    chunk.position.y = 0.3; // Lock to ground level
                    chunk.userData.lifetime = 0; // Reset lifetime for ground phase

                    // Skid on impact - NO bouncing, debris stays on ground
                    chunk.userData.velocity.x *= 0.4; // Some sideways retained
                    chunk.userData.velocity.z *= 0.75; // Keep MOST forward momentum (skidding)
                    chunk.userData.velocity.y = 0; // LOCK to ground, no bounce

                    // Ground impact intensifies rotation (dramatic tumbling)
                    chunk.userData.rotationVelocity.multiplyScalar(0.7);

                    // Spawn dust cloud on impact (like spilled powder)
                    spawnDustCloud(
                        chunk.position.x,
                        chunk.position.y,
                        chunk.position.z,
                        chunk.userData.velocity.x,
                        chunk.userData.velocity.z
                    );
                }
            } else {
                // GROUND PHASE: Dramatic skidding and tumbling on landscape (no bouncing)

                // Apply velocities (no Y movement - stays on ground)
                chunk.position.x += chunk.userData.velocity.x;
                chunk.position.z += chunk.userData.velocity.z;
                chunk.position.y = 0.3; // FORCE to ground level (no bouncing)

                // VARIED tumbling based on chunk's unique characteristics
                chunk.userData.wobblePhase += chunk.userData.wobbleSpeed * 0.7;
                const wobbleBase = 0.03 * chunk.userData.wobbleIntensity; // Unique wobble strength

                // Different skid patterns create variety
                let groundWobbleX, groundWobbleY, groundWobbleZ;
                if (chunk.userData.skidPattern === 0) {
                    // Rolling pattern - smooth roll
                    groundWobbleX = Math.sin(chunk.userData.wobblePhase) * wobbleBase;
                    groundWobbleY = Math.cos(chunk.userData.wobblePhase * 2.0) * wobbleBase * 1.5;
                    groundWobbleZ = Math.sin(chunk.userData.wobblePhase * 0.5) * wobbleBase * 0.8;
                } else if (chunk.userData.skidPattern === 1) {
                    // Tumbling pattern - erratic tumble
                    groundWobbleX = Math.cos(chunk.userData.wobblePhase * 1.3) * wobbleBase * 1.8;
                    groundWobbleY = Math.sin(chunk.userData.wobblePhase * 1.7) * wobbleBase * 1.2;
                    groundWobbleZ = Math.cos(chunk.userData.wobblePhase * 0.9) * wobbleBase * 1.5;
                } else {
                    // Skidding pattern - mostly forward roll with slight wobble
                    groundWobbleX = Math.sin(chunk.userData.wobblePhase * 2.5) * wobbleBase * 0.6;
                    groundWobbleY = Math.cos(chunk.userData.wobblePhase * 3.0) * wobbleBase * 2.0;
                    groundWobbleZ = Math.sin(chunk.userData.wobblePhase * 0.3) * wobbleBase * 0.4;
                }

                // Enhanced ground tumbling with variety
                chunk.rotation.x += chunk.userData.rotationVelocity.x + groundWobbleX;
                chunk.rotation.y += chunk.userData.rotationVelocity.y + groundWobbleY;
                chunk.rotation.z += chunk.userData.rotationVelocity.z + groundWobbleZ;

                // VARIED friction and rotation decay per chunk (unique behavior)
                chunk.userData.velocity.x *= chunk.userData.frictionFactor;
                chunk.userData.velocity.z *= chunk.userData.frictionFactor;
                chunk.userData.rotationVelocity.multiplyScalar(chunk.userData.rotationDecay);

                // Realistic breakage: pieces get smaller as they skid/tumble (hitting ground)
                const currentScale = chunk.scale.x;
                const shrinkRate = 0.988; // Faster shrinking (more dramatic)
                const newScale = currentScale * shrinkRate;
                chunk.scale.set(newScale, newScale, newScale);
            }

            // Immediate cleanup when player passes debris (z > 5 means debris is behind/at camera)
            // Also remove if too far off screen or too small
            if (chunk.position.z > 5 || Math.abs(chunk.position.x) > 80 || chunk.scale.x < 0.3) {
                chunk.userData.active = false;
                chunk.visible = false;
                chunk.position.set(0, 0, -1000);
                chunk.material.opacity = 0.8; // Reset for next use
                collisionDebris.splice(i, 1);
            }
        }

        // Update dust particle clouds (iterate backwards to safely remove)
        for (let i = dustParticles.length - 1; i >= 0; i--) {
            const dustCloud = dustParticles[i];
            dustCloud.userData.lifetime++;

            const positions = dustCloud.geometry.attributes.position.array;

            // Animate each particle in the cloud
            for (let p = 0; p < dustParticlesPerCloud; p++) {
                const p3 = p * 3;
                const vel = dustCloud.userData.velocities[p];

                // Apply velocity to spread particles
                positions[p3] += vel.x;     // x
                positions[p3 + 2] += vel.z; // z (forward movement)

                // Friction - particles slow down as they spread
                vel.x *= 0.95;
                vel.z *= 0.95;
            }

            dustCloud.geometry.attributes.position.needsUpdate = true;

            // Fade out over lifetime
            const fadeProgress = dustCloud.userData.lifetime / dustCloud.userData.maxLifetime;
            dustCloud.material.opacity = 0.6 * (1 - fadeProgress); // Fade to 0

            // Remove when fully faded or passed by player
            if (dustCloud.userData.lifetime >= dustCloud.userData.maxLifetime ||
                positions[2] > 5) { // Check first particle's z position
                dustCloud.userData.active = false;
                dustCloud.visible = false;
                dustCloud.material.opacity = 0.6; // Reset
                dustParticles.splice(i, 1);
            }
        }

        // Invincibility pulsating yellow effect (like Mario)
        if (invincibilityActive) {
            // Check if invincibility expired
            if (Date.now() >= invincibilityEndTime) {
                invincibilityActive = false;
                paperMat.color.setHex(originalPlaneColor); // Revert to original teal
            } else {
                // Pulsate between yellow and original color
                invincibilityPulsePhase += 0.15; // Speed of pulsing
                const pulseValue = Math.sin(invincibilityPulsePhase) * 0.5 + 0.5; // 0 to 1

                // Blend between teal (0x008080) and yellow (0xffff00)
                const tealR = 0x00, tealG = 0x80, tealB = 0x80;
                const yellowR = 0xff, yellowG = 0xff, yellowB = 0x00;

                const r = Math.floor(tealR + (yellowR - tealR) * pulseValue);
                const g = Math.floor(tealG + (yellowG - tealG) * pulseValue);
                const b = Math.floor(tealB + (yellowB - tealB) * pulseValue);

                paperMat.color.setRGB(r / 255, g / 255, b / 255);
            }
        }

        // Check if coin magnet expired
        if (coinMagnetActive && Date.now() >= coinMagnetEndTime) {
            coinMagnetActive = false;
            abilities.coinMagnet.owned = false;
            crashMessage = 'COIN MAGNET EXPIRED';
            crashMessageTimer = 60;
        }

        // Check if lasers expired (legacy - keeping for compatibility)
        if (lasersActive && Date.now() >= lasersEndTime) {
            lasersActive = false;
            canShoot = false;
            abilities.lasers.owned = false;
            // Clean up existing lasers
            lasers.forEach(laser => scene.remove(laser));
            lasers.length = 0;
            // Show expiration message
            crashMessage = 'LASERS EXPIRED';
            crashMessageTimer = 60;
        }

        // Animate distant stars (twinkling effect + subtle altitude brightness)
        distantStars.forEach(star => {
            const twinkle = Math.sin(time * star.userData.twinkleSpeed + star.userData.twinkleOffset);
            const baseOpacity = star.userData.baseOpacity || 0.8;

            // Subtle altitude effect: stars get slightly brighter when climbing
            // curY ranges roughly 0.5 to 8, normalize to subtle 0.85-1.1 multiplier
            const altitudeFactor = 0.85 + ((curY - 0.5) / 7.5) * 0.25; // 0.85 to 1.1 - subtle

            star.material.opacity = (baseOpacity + (twinkle * 0.2)) * altitudeFactor;
        });

        // Controls with momentum (varies by plane type)
        // Speed-adaptive smoothing: increase smoothing at high speeds to reduce jittery movement
        const baseSmoothing = planeStats[currentPlaneType].smoothing;
        const currentSpeedRatio = totalSpeedMultiplier; // Includes boost effects
        // At 2x speed (boost), use 40% more smoothing for smoother control
        const adaptiveSmoothing = Math.min(baseSmoothing * (1.0 + (currentSpeedRatio - 1.0) * 0.4), 0.25);
        curX += (targetX - curX) * adaptiveSmoothing;
        curY += (targetY - curY) * adaptiveSmoothing;

        // Position-based camping detection (hovering in one spot)
        const distFromLastCheck = Math.sqrt(
            Math.pow(curX - lastCampCheckPosition.x, 2) +
            Math.pow(curY - lastCampCheckPosition.y, 2)
        );

        if (distFromLastCheck < campingPositionThreshold) {
            campingTimer++;
            if (campingTimer > campingDetectionThreshold && !campingDetected) {
                campingDetected = true;

                // Spawn alternating wall pattern to force movement
                // Create 2 wall sets that alternate high/low to push player to move
                for (let i = 0; i < 2; i++) {
                    const zPos = -150 - (i * 60);
                    const wallType = i % 2 === 0 ? 'high' : 'low';
                    const wall = getWallFromPool(wallType, zPos);
                    if (wall) walls.push(wall);
                }
            }
        } else {
            // Player moved significantly - reset
            campingTimer = 0;
            campingDetected = false;
            lastCampCheckPosition.x = curX;
            lastCampCheckPosition.y = curY;
        }

        // Anti-camping detection (backend only, no message)
        playerLane = getPlayerLane(curX);
        if (playerLane === lastPlayerLane) {
            timeInSameLane += 16.67; // Approximate ms per frame (60fps)
            if (timeInSameLane > campingThreshold && !antiCampingActive) {
                antiCampingActive = true;

                // Spawn a super tall building directly in player's lane to prevent camping
                const antiCampAvailable = getAvailableInstance('box');
                if (antiCampAvailable) {
                    const antiCampBuilding = antiCampAvailable.instance;
                    const index = antiCampAvailable.index;

                    antiCampBuilding.active = true;
                    antiCampBuilding.geometry = 'box';
                    antiCampBuilding.position.x = lanes[playerLane]; // Player's current lane
                    antiCampBuilding.scale.set(1, 2, 1); // Double height: 5 * 2 = 10 units tall
                    antiCampBuilding.height = 10;
                    antiCampBuilding.width = 1;
                    // Position at half the scaled height to keep grounded (geometry is 5 units, scaled by 2 = 10 units)
                    const groundedY = (5 * 2) / 2; // 5 units base * 2 scale / 2 = 5
                    antiCampBuilding.position.y = groundedY;
                    antiCampBuilding.position.z = -200; // Spawn further ahead for better visibility
                    antiCampBuilding.originalY = groundedY;
                    antiCampBuilding.originalScale = { x: 1, y: 2, z: 1 };
                    antiCampBuilding.opacity = 0.5;
                    antiCampBuilding.nearMissCredited = false;

                    updateInstanceMatrix(antiCampBuilding, boxInstancedMesh, index);
                }
            }
        } else {
            timeInSameLane = 0;
            antiCampingActive = false;
            lastPlayerLane = playerLane;
        }

        // Boundary camping detection removed - players are now hard-constrained to viewport
        // X: -8 to +8 (lane boundaries), Y: 0.5 to 5.5
        // No need to spawn anti-camping obstacles at boundaries

        // Calculate velocity for physics-based banking
        velocityX = curX - prevX;
        velocityY = curY - prevY;
        prevX = curX;
        prevY = curY;

        // Natural bobbing motion
        const bobY = Math.sin(time * 0.6) * 0.1;

        // Add lateral drift based on velocity (sway effect)
        const swayX = Math.sin(time * 1.2 + velocityX * 10) * Math.abs(velocityX) * 0.8;
        const swayY = Math.cos(time * 0.8) * 0.05;

        shipGroup.position.set(curX + swayX, curY + bobY + swayY, 3.5);

        // Update ground shadow position, scale, and opacity based on altitude
        groundShadow.position.x = curX + swayX;
        groundShadow.position.z = 3.5;
        // Scale: proportional to plane type, smaller when higher, larger when lower (altitude range: 0.5 to 5.5)
        const baseShadowSize = planeStats[currentPlaneType].shadowSize;
        const altitudeScale = 1.5 - ((curY - 0.5) * 0.2); // Shrinks as plane goes up
        const shadowScale = baseShadowSize * altitudeScale;
        groundShadow.scale.set(shadowScale, shadowScale, 1);
        // Opacity: fade out when higher (max 0.4 at ground level, min 0.1 at max altitude)
        groundShadowMat.opacity = Math.max(0.1, 0.5 - ((curY - 0.5) * 0.08));

        // Terrain altitude scaling - bidirectional parallax effect for game feel
        // Fly UP: terrain scales down (appears further away)
        // Fly DOWN: terrain scales up (appears closer/larger)
        const altitudeOffset = curY - 2.5; // Distance from default height (can be + or -)
        const terrainScale = 1 - (altitudeOffset * 0.04); // 4% scale change per unit
        // Scale X (width) and Z (height), keep Y at 1.0 (length along flight path after rotation)
        t1.scale.set(terrainScale, 1, terrainScale);
        t2.scale.set(terrainScale, 1, terrainScale);

        // Enhanced banking based on velocity (more arc/sway)
        let rollAngle = -velocityX * 8; // Roll based on horizontal velocity
        const pitchAngle = velocityY * 3 + (bobY * 0.1); // Pitch based on vertical velocity
        const yawSway = Math.sin(velocityX * 15) * Math.abs(velocityX) * 0.3; // Subtle yaw sway

        // BARREL ROLL ANIMATION (Star Fox style, optimized)
        if (barrelRollActive) {
            barrelRollProgress += planeStats[currentPlaneType].barrelRollSpeed;
            // Simplified easing calculation for better performance
            const t = barrelRollProgress;
            const easeProgress = t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t);
            rollAngle = 6.283185307179586 * easeProgress; // PI * 2 pre-calculated

            if (barrelRollProgress >= 1) {
                barrelRollActive = false;
                barrelRollProgress = 0;
            }
        }

        shipGroup.rotation.z = rollAngle;
        shipGroup.rotation.x = pitchAngle;
        shipGroup.rotation.y = yawSway;

        // Light follow
        engineLight.position.set(curX, curY, 5);
        engineLight.intensity = 10 + Math.random()*3;

        // Collision logic with varied buildings (simplified)
        shipBox.setFromObject(shipGroup);
        // Make collision more forgiving - shrink ship hitbox by 30%
        // Reuse temp vectors to avoid garbage collection
        shipBox.getSize(tempVec3_1);
        shipBox.getCenter(tempVec3_2);
        tempVec3_1.multiplyScalar(0.7);
        shipBox.setFromCenterAndSize(tempVec3_2, tempVec3_1);

        // Check if we're in a breather phase to skip building updates
        const isBreatherPhase = currentPhase === 'rings' ||
            currentPhase === 'breather_before_rings' ||
            currentPhase === 'breather_after_rings' ||
            currentPhase === 'walls';

        buildings.forEach((b, idx) => {
            if (!b.active) return; // Skip inactive instances

            // Get the mesh and instance index for this building
            const mesh = b.geometry === 'box' ? boxInstancedMesh :
                         b.geometry === 'pyramid' ? pyramidInstancedMesh :
                         cylinderInstancedMesh;
            const instanceIndex = buildingInstances[b.geometry].indexOf(b);

            // During breather phases, only hide buildings that haven't spawned yet (far back)
            // Let already-visible buildings pass naturally to avoid jarring disappearance
            if (isBreatherPhase) {
                if (b.position.z < -50) {
                    // Only hide buildings that are far back (not yet spawned)
                    b.active = false;
                    b.position.z = -500; // Keep them far back
                    updateInstanceMatrix(b, mesh, instanceIndex);
                    return; // Skip rest of logic for unspawned buildings
                }
                // Let visible/spawned buildings continue their natural movement
            }

            b.position.z += speed;
            // Apply altitude parallax scaling to buildings (multiply with original scale, don't replace!)
            if (b.originalScale) {
                b.scale.set(
                    b.originalScale.x * terrainScale,
                    b.originalScale.y * terrainScale,
                    b.originalScale.z * terrainScale
                );
            }
            // Scale Y position to keep buildings grounded (prevent floating)
            if (b.originalY !== undefined) {
                b.position.y = b.originalY * terrainScale;
            }

            // Update instance matrix with new position and scale
            updateInstanceMatrix(b, mesh, instanceIndex);

            // Gradual fade as buildings pass camera (smoother than instant toggle)
            if(b.position.z > 10) {
                // Start fading when approaching camera (z > 10)
                const fadeStart = 10;
                const fadeEnd = 20;
                const fadeProgress = Math.min((b.position.z - fadeStart) / (fadeEnd - fadeStart), 1);
                b.opacity = 1 - fadeProgress;
            } else {
                b.opacity = 1;
            }

            // Check if we need to spawn a new wave when building passes camera
            if(b.position.z > 20 && b.active) {
                // Check if we need to spawn a new wave (not during boss or low-intensity phases)
                const canSpawnBuildings = currentPhase === 'buildings' || currentPhase === 'mixed' || currentPhase === 'boss_gauntlet';

                // Don't spawn buildings during active boosts to prevent unfair collisions
                const hasActiveBoost = speedBoostActive || nearMissBoost > 0 || ringBoost > 0;

                if (!bossActive && canSpawnBuildings && !hasActiveBoost && (currentWave === null || waveProgress >= currentWave.buildings)) {
                    // Anti-camping: Force spawn in player's lane if they're camping
                    let patternName;
                    if (antiCampingActive) {
                        patternName = 'antiCamping';
                        antiCampingActive = false; // Reset after spawning punishment
                        timeInSameLane = 0; // Reset timer
                    } else if (currentPhase === 'boss_gauntlet') {
                        // BOSS GAUNTLET: Force only the most intense patterns with very little gaps
                        // Nearly unsustainable - constant dodging with minimal safe spaces
                        const bossPatterns = ['quad_simultaneous', 'wall', 'procedural', 'triple_simultaneous', 'double_wide'];
                        patternName = bossPatterns[Math.floor(seededRandom() * bossPatterns.length)];
                    } else {
                        // Normal wave pattern selection
                        patternName = getWavePattern(levelDifficulty);
                    }

                    currentWave = wavePatterns[patternName];
                    currentWavePositions = currentWave.getPositions(Math.floor(miles)); // Cache positions
                    waveProgress = 0;

                    // Apply difficulty scalar and warm-up to obstacle spacing (hidden system)
                    // Lower scalar = easier = more spacing; Higher scalar = harder = less spacing
                    const spacingMultiplier = (1 / difficultyScalar) * (inWarmup ? 1.3 : 1.0); // 30% more spacing in warm-up

                    // WAVE SPACING: How close waves spawn to each other
                    // Early game needs RAPID waves to create constant dodging action
                    let baseDistance;
                    if (currentPhase === 'boss_gauntlet') {
                        baseDistance = 12; // Boss gauntlet - RELENTLESS, nearly unsustainable
                    } else if (miles < 10) {
                        baseDistance = 20; // EARLY GAME (0-10mi) - RAPID waves for onboarding
                    } else if (miles < 20) {
                        baseDistance = 25; // Early (10-20mi) - still quick
                    } else if (miles < 50) {
                        baseDistance = 35; // Early-mid transition
                    } else {
                        baseDistance = 50; // Normal late game spacing
                    }
                    nextWaveDistance = b.position.z - (baseDistance * spacingMultiplier);

                    // If breather wave (no buildings), deactivate this instance
                    if (currentWave.buildings === 0) {
                        b.position.z = -400;
                        b.active = false;
                        updateInstanceMatrix(b, mesh, instanceIndex);
                        return; // Skip building spawn during breather
                    }
                }

                // Skip if no positions (breather wave)
                if (!currentWavePositions || currentWavePositions.length === 0) {
                    b.position.z = -400;
                    b.active = false;
                    updateInstanceMatrix(b, mesh, instanceIndex);
                    return;
                }

                // Get position from cached wave positions
                const position = currentWavePositions[waveProgress % currentWavePositions.length];

                // Recreate building with new random type and scale
                const buildingData = createBuildingData();

                // If geometry type changed, deactivate this instance and spawn new one
                if (buildingData.type !== b.geometry) {
                    b.active = false;
                    updateInstanceMatrix(b, mesh, instanceIndex);

                    // Try to get an instance of the new type
                    const newAvailable = getAvailableInstance(buildingData.type);
                    if (newAvailable) {
                        const newInstance = newAvailable.instance;
                        const newIndex = newAvailable.index;
                        const newMesh = buildingData.type === 'box' ? boxInstancedMesh :
                                       buildingData.type === 'pyramid' ? pyramidInstancedMesh :
                                       cylinderInstancedMesh;

                        // Setup new instance with respawn properties
                        newInstance.active = true;
                        newInstance.height = buildingData.height;

                        // Use width from procedural generation if available, otherwise random
                        const buildingWidth = position.width || 1;
                        newInstance.width = buildingWidth;

                        // Wide buildings (width=2) get extra X scale to span 2 lanes
                        const baseScale = seededRandom() * 0.4 + 0.6;
                        const scaleX = buildingWidth > 1 ? baseScale * 2.2 : baseScale;
                        const scaleY = buildingData.height / 5;
                        const scaleZ = seededRandom() * 0.8 + 0.6;
                        newInstance.scale.set(scaleX, scaleY, scaleZ);
                        newInstance.originalScale = { x: scaleX, y: scaleY, z: scaleZ };

                        // Progressive difficulty: buildings spawn closer as level increases
                        let spawnDistance = nextWaveDistance + position.offset;

                        // Use lane-based positioning from wave pattern with retry logic
                        let xPos;
                        let validPosition = false;
                        const maxAttempts = 8;

                        // Try to find valid X position (with minimum separation)
                        for (let attempt = 0; attempt < maxAttempts; attempt++) {
                            const tryLane = attempt === 0 ? position.lane : Math.floor(seededRandom() * lanes.length);
                            xPos = lanes[tryLane];

                            if (hasMinimumSeparation(xPos, spawnDistance, buildingWidth, newInstance)) {
                                validPosition = true;
                                break;
                            }
                        }

                        if (!validPosition) {
                            newInstance.position.z = -500;
                            newInstance.active = false;
                            waveProgress++;
                            updateInstanceMatrix(newInstance, newMesh, newIndex);
                            return;
                        }

                        // Prevent buildings from spawning too close in overlapping lanes
                        const minLaneSpacing = 15;
                        const thisWidth = buildingWidth;
                        const laneSpacing = 4;

                        for (let j = 0; j < buildings.length; j++) {
                            const other = buildings[j];
                            if (other !== newInstance && other.active) {
                                const otherWidth = other.width || 1;
                                const thisLaneMin = xPos;
                                const thisLaneMax = xPos + (thisWidth - 1) * laneSpacing;
                                const otherLaneMin = other.position.x;
                                const otherLaneMax = other.position.x + (otherWidth - 1) * laneSpacing;

                                const lanesOverlap = thisLaneMax >= otherLaneMin - 0.5 && thisLaneMin <= otherLaneMax + 0.5;

                                if (lanesOverlap) {
                                    const zDist = Math.abs(other.position.z - spawnDistance);
                                    if (zDist < minLaneSpacing) {
                                        spawnDistance = other.position.z - minLaneSpacing;
                                    }
                                }
                            }
                        }

                        // All geometries are centered (including cones), so position at height/2 for ground level
                        const baseY = buildingData.height / 2;
                        newInstance.originalY = baseY;
                        newInstance.position.set(xPos, baseY * terrainScale, spawnDistance);
                        newInstance.opacity = 1;
                        newInstance.nearMissCredited = false;

                        updateInstanceMatrix(newInstance, newMesh, newIndex);
                        waveProgress++;
                    }
                    return;
                }

                // Same geometry type - reuse this instance
                b.height = buildingData.height;

                const buildingWidth = position.width || 1;
                b.width = buildingWidth;

                const baseScale = seededRandom() * 0.4 + 0.6;
                const scaleX = buildingWidth > 1 ? baseScale * 2.2 : baseScale;
                const scaleY = buildingData.height / 5;
                const scaleZ = seededRandom() * 0.8 + 0.6;
                b.scale.set(scaleX, scaleY, scaleZ);
                b.originalScale = { x: scaleX, y: scaleY, z: scaleZ };

                let spawnDistance = nextWaveDistance + position.offset;

                let xPos;
                let validPosition = false;
                const maxAttempts = 8;

                for (let attempt = 0; attempt < maxAttempts; attempt++) {
                    const tryLane = attempt === 0 ? position.lane : Math.floor(seededRandom() * lanes.length);
                    xPos = lanes[tryLane];

                    if (hasMinimumSeparation(xPos, spawnDistance, buildingWidth, b)) {
                        validPosition = true;
                        break;
                    }
                }

                if (!validPosition) {
                    b.position.z = -500;
                    b.active = false;
                    waveProgress++;
                    updateInstanceMatrix(b, mesh, instanceIndex);
                    return;
                }

                // Prevent buildings from spawning too close in overlapping lanes
                const minLaneSpacing = 15;
                const thisWidth = buildingWidth;
                const laneSpacing = 4;

                for (let j = 0; j < buildings.length; j++) {
                    const other = buildings[j];
                    if (other !== b && other.active) {
                        const otherWidth = other.width || 1;
                        const thisLaneMin = xPos;
                        const thisLaneMax = xPos + (thisWidth - 1) * laneSpacing;
                        const otherLaneMin = other.position.x;
                        const otherLaneMax = other.position.x + (otherWidth - 1) * laneSpacing;

                        const lanesOverlap = thisLaneMax >= otherLaneMin - 0.5 && thisLaneMin <= otherLaneMax + 0.5;

                        if (lanesOverlap) {
                            const zDist = Math.abs(other.position.z - spawnDistance);
                            if (zDist < minLaneSpacing) {
                                spawnDistance = other.position.z - minLaneSpacing;
                            }
                        }
                    }
                }

                // All geometries are centered (including cones), so position at height/2 for ground level
                const baseY = buildingData.height / 2;
                b.originalY = baseY;
                b.position.set(xPos, baseY * terrainScale, spawnDistance);
                b.active = true;
                b.opacity = 1;
                b.nearMissCredited = false;

                updateInstanceMatrix(b, mesh, instanceIndex);
                waveProgress++;

                // Deactivate building after spawning new wave
                b.active = false;
            }

            // STRICT collision validation to prevent ghost hits
            // Only check buildings that are active, fully visible, and very close to player
            if(!b.active) {
                return; // Skip inactive buildings
            }

            // Validate position is not NaN (sanity check)
            if (isNaN(b.position.x) || isNaN(b.position.y) || isNaN(b.position.z)) {
                return;
            }

            // CRITICAL: Only check buildings in collision zone around player
            // Player is at z ≈ 3.5, so check buildings from -8 to +4 (tight range to prevent ghost hits)
            // This prevents collisions with buildings that are too far behind or ahead
            if(b.position.z > 4 || b.position.z < -8) {
                return; // Building outside collision zone
            }

            // Require building to be fully visible (opacity must be near 1.0)
            // Buildings fade starting at z=10, so this ensures no ghost hits from fading buildings
            if(b.opacity < 0.95) {
                return; // Building is fading or not fully visible
            }

            // Strict distance check: only check very close buildings
            const dx = b.position.x - curX;
            const dy = b.position.y - curY;
            const dz = b.position.z - 3.5;
            const distSq = dx * dx + dy * dy + dz * dz;
            const maxCollisionDistSq = 49; // ~7 units squared (much tighter)

            // Skip if too far away for collision
            if (distSq > maxCollisionDistSq) {
                return;
            }

            // Calculate bounding box manually for instanced mesh
            // All geometries are centered, so half extents are the same in all directions
            const halfWidth = (b.geometry === 'box' ? 1 : b.geometry === 'pyramid' ? 1 : 0.75) * b.scale.x;
            const halfHeight = 2.5 * b.scale.y; // Geometry is 5 units tall, half is 2.5
            const halfDepth = (b.geometry === 'box' ? 1 : b.geometry === 'pyramid' ? 1 : 0.75) * b.scale.z;

            b.box.min.set(
                b.position.x - halfWidth,
                b.position.y - halfHeight,
                b.position.z - halfDepth
            );
            b.box.max.set(
                b.position.x + halfWidth,
                b.position.y + halfHeight,
                b.position.z + halfDepth
            );

            // Make collision more forgiving - shrink all building hitboxes
            // Reuse temp vectors to avoid garbage collection
            b.box.getSize(tempVec3_1);
            b.box.getCenter(tempVec3_2);
            // Shrink collision box by 35% for pyramids (most forgiving), 25% for others
            const shrinkFactor = b.geometry === 'pyramid' ? 0.65 : 0.75;
            tempVec3_1.multiplyScalar(shrinkFactor);
            b.box.setFromCenterAndSize(tempVec3_2, tempVec3_1);

            // Track collision checks for debug metrics
            if (DEBUG_ENABLED) debugMetrics.performance.collisionChecks++;

            // Near-miss detection (close but not colliding) - optimized with squared distance
            if (!shipBox.intersectsBox(b.box) && !b.nearMissCredited) {
                // Only check when building is in the right Z range
                const zDiff = b.position.z - 3.5;
                if (zDiff > -3 && zDiff < 3) {
                    // Use squared distance to avoid expensive Math.sqrt
                    const dx = b.position.x - curX;
                    const dy = b.position.y - curY;
                    const distSq = dx * dx + dy * dy;

                    if (distSq < nearMissDistSq) {
                        // Apply near-miss boost!
                        nearMissBoost = Math.max(nearMissBoost, 0.3); // 30% speed boost
                        b.nearMissCredited = true; // Only credit once per building
                    }
                }
            }

            if(shipBox.intersectsBox(b.box)) {
                // Check grace period first
                if (!gracePeriodActive) {
                    // Spawn debris chunks from building collision (pass building for realistic break pattern)
                    spawnCollisionDebris(b.position.x, b.position.y, b.position.z, curX, curY, b);

                    b.position.z = -120;
                    b.active = false;
                    updateInstanceMatrix(b, mesh, instanceIndex);

                    // Invincibility: no damage, just show message
                    if (invincibilityActive) {
                        crashMessage = `INVINCIBLE!`;
                        crashMessageTimer = 40;
                    } else {
                        // Normal collision damage
                        collisionFlash = 0.5;

                        // Track collision for difficulty system (hidden)
                        difficultyMetrics.collisions.push({time: timestamp, happened: true});
                        difficultyMetrics.lastHitTime = timestamp;

                        // Shield mechanic: first hits damage shield, not health
                        if (shieldActive && shieldHits < maxShieldHits) {
                            shieldHits++;
                            uiControls.updateShieldBar(shieldActive, shieldHits);
                            crashMessage = `SHIELD HIT ${shieldHits}/${maxShieldHits}`;
                            crashMessageTimer = 50;

                            if (shieldHits >= maxShieldHits) {
                                shieldActive = false;
                                uiControls.updateShieldBar(shieldActive, shieldHits);
                                crashMessage = `SHIELD DOWN!`;
                            }
                        } else {
                            // Shield down - lose health or upgrades
                            if (currentHealth > 0) {
                                currentHealth--;
                                uiControls.updateHealthBar(currentHealth, maxHealth);
                                crashMessage = `HIT! ${currentHealth} HEARTS LEFT`;
                                crashMessageTimer = 60;

                                // Activate brief grace period to prevent rapid successive hits
                                gracePeriodActive = true;
                                gracePeriodEndTime = Date.now() + 500; // 0.5 second grace
                            }

                            // After health is depleted, trigger death
                            if (currentHealth <= 0) {
                                handleDeath();
                            }
                        }
                    }

                    // Update high score if current distance is higher
                    const currentMiles = Math.floor(miles);
                    if (currentMiles > highScore) {
                        highScore = currentMiles;
                        localStorage.setItem('paperPlaneHighScore', highScore.toString());
                    }
                }
            }
        });

        // Batch instance matrix updates (prevents multiple GPU uploads per frame)
        if (boxMatricesNeedUpdate) {
            boxInstancedMesh.instanceMatrix.needsUpdate = true;
            boxMatricesNeedUpdate = false;
        }
        if (pyramidMatricesNeedUpdate) {
            pyramidInstancedMesh.instanceMatrix.needsUpdate = true;
            pyramidMatricesNeedUpdate = false;
        }
        if (cylinderMatricesNeedUpdate) {
            cylinderInstancedMesh.instanceMatrix.needsUpdate = true;
            cylinderMatricesNeedUpdate = false;
        }

        // High/Low Wall update and collision logic
        // Only spawn walls during the 'walls' phase (and not during boss)
        if (currentPhase === 'walls' && !wallsSpawnedThisPhase && !bossActive) {
            // 30% chance to spawn Star Fox style barrier instead of normal walls
            const spawnBarrier = Math.random() < 0.3;

            if (spawnBarrier) {
                // Spawn 2-3 barrier walls with gaps (Star Fox style)
                const barrierCount = Math.floor(Math.random() * 2) + 2; // 2-3 barriers
                for (let i = 0; i < barrierCount; i++) {
                    const zPos = -180 - (i * 90); // Space them out
                    const gapConfig = getBarrierConfig();
                    const segments = spawnBarrierWithGaps(zPos, gapConfig);
                    barrierWalls.push(...segments);
                }
            } else {
                // Spawn normal 3-5 wall "sets" - sometimes single, sometimes both high+low
                const wallSetCount = Math.floor(Math.random() * 3) + 3; // 3-5 sets

                for (let i = 0; i < wallSetCount; i++) {
                    const zPos = -200 - (i * 70); // Wider spacing for better visibility
                    const bothWalls = Math.random() < 0.40; // 40% chance for both high AND low walls

                    if (bothWalls) {
                        // Spawn BOTH high and low from pool - player must stay centered
                        const highWall = getWallFromPool('high', zPos);
                        const lowWall = getWallFromPool('low', zPos);
                        if (highWall) walls.push(highWall);
                        if (lowWall) walls.push(lowWall);
                    } else {
                        // Spawn single wall from pool (50/50 high or low)
                        const wallType = Math.random() < 0.5 ? 'high' : 'low';
                        const wall = getWallFromPool(wallType, zPos);
                        if (wall) walls.push(wall);
                    }
                }
            }

            // Clear all buildings during wall phase
            buildings.forEach(b => {
                b.position.z = -500;
                b.visible = false;
            });

            wallsSpawnedThisPhase = true;
        }

        // Spawn barrier walls occasionally during buildings/mixed phases for added challenge
        if ((currentPhase === 'buildings' || currentPhase === 'mixed') && !bossActive) {
            // 5% chance per frame to spawn a barrier (creates occasional Star Fox moments)
            if (Math.random() < 0.0005 * deltaTime) {
                const zPos = -250; // Spawn far ahead for visibility
                const gapConfig = getBarrierConfig();
                const segments = spawnBarrierWithGaps(zPos, gapConfig);
                barrierWalls.push(...segments);
            }
        }

        // Optimized wall loop - iterate backwards to safely remove items
        for (let i = walls.length - 1; i >= 0; i--) {
            const wall = walls[i];
            wall.position.z += speed;
            // Apply altitude parallax scaling to walls (multiply with original scale)
            if (wall.userData.originalScale) {
                wall.scale.set(
                    wall.userData.originalScale.x * terrainScale,
                    wall.userData.originalScale.y * terrainScale,
                    wall.userData.originalScale.z * terrainScale
                );
            }
            // Scale Y position to keep walls properly positioned
            if (wall.userData.originalY !== undefined) {
                wall.position.y = wall.userData.originalY * terrainScale;
            }

            // Return wall to pool when it passes the player
            if (wall.position.z > 20) {
                wall.visible = false;
                wall.position.z = -1000;
                walls.splice(i, 1);
                continue;
            }

            // Only check collision when wall is close
            if (wall.position.z > -20 && wall.position.z < 15) {
                // Broad-phase culling: distance check before expensive Box3 operations
                const dx = wall.position.x - curX;
                const dy = wall.position.y - curY;
                const dz = wall.position.z - 3.5;
                const distSq = dx * dx + dy * dy + dz * dz;
                const maxCollisionDistSq = 100; // ~10 units squared

                // Skip if too far away for collision
                if (distSq > maxCollisionDistSq) {
                    continue;
                }

                wall.userData.box.setFromObject(wall);

                // Forgiving hitbox - shrink by 15%
                wall.userData.box.getSize(tempVec3_1);
                wall.userData.box.getCenter(tempVec3_2);
                tempVec3_1.multiplyScalar(0.85);
                wall.userData.box.setFromCenterAndSize(tempVec3_2, tempVec3_1);

                if (shipBox.intersectsBox(wall.userData.box)) {
                    // Check grace period
                    if (!gracePeriodActive) {
                        // Spawn debris chunks from wall collision (directional based on ship position)
                        spawnCollisionDebris(wall.position.x, wall.position.y, wall.position.z, curX, curY);

                        wall.visible = false;
                        wall.position.z = -1000;
                        walls.splice(i, 1);

                        // Invincibility: no damage, just show message
                        if (invincibilityActive) {
                            crashMessage = `INVINCIBLE!`;
                            crashMessageTimer = 40;
                        } else {
                            // Normal collision damage
                            collisionFlash = 0.5;

                            // Shield mechanic: first hits damage shield, not health
                            if (shieldActive && shieldHits < maxShieldHits) {
                                shieldHits++;
                                uiControls.updateShieldBar(shieldActive, shieldHits);
                                crashMessage = `SHIELD HIT ${shieldHits}/${maxShieldHits}`;
                                crashMessageTimer = 50;

                                if (shieldHits >= maxShieldHits) {
                                    shieldActive = false;
                                    uiControls.updateShieldBar(shieldActive, shieldHits);
                                    crashMessage = `SHIELD DOWN!`;
                                }
                            } else {
                                // Shield down - lose health or upgrades
                                if (currentHealth > 0) {
                                    currentHealth--;
                                    uiControls.updateHealthBar(currentHealth, maxHealth);
                                    crashMessage = `HIT! ${currentHealth} HEARTS LEFT`;
                                    crashMessageTimer = 50;

                                    // Activate brief grace period to prevent rapid successive hits
                                    gracePeriodActive = true;
                                    gracePeriodEndTime = Date.now() + 500; // 0.5 second grace
                                }

                                // After health is depleted, trigger death
                                if (currentHealth <= 0) {
                                    handleDeath();
                                }
                            }
                        }

                        break; // Exit loop after collision
                    }
                }
            }
        }

        // Barrier wall update and collision (Star Fox style - full coverage with gaps)
        for (let i = barrierWalls.length - 1; i >= 0; i--) {
            const barrier = barrierWalls[i];
            barrier.position.z += speed;

            // Apply altitude parallax scaling
            if (barrier.userData.originalScale) {
                barrier.scale.set(
                    barrier.userData.originalScale.x * terrainScale,
                    barrier.userData.originalScale.y * terrainScale,
                    barrier.userData.originalScale.z * terrainScale
                );
            }
            if (barrier.userData.originalY !== undefined) {
                barrier.position.y = barrier.userData.originalY * terrainScale;
            }

            // Return barrier to pool when it passes the player
            if (barrier.position.z > 20) {
                barrier.visible = false;
                barrier.position.z = -1000;
                barrierWalls.splice(i, 1);
                continue;
            }

            // Collision detection when barrier is close
            if (barrier.position.z > -20 && barrier.position.z < 15) {
                const dx = barrier.position.x - curX;
                const dy = barrier.position.y - curY;
                const dz = barrier.position.z - 3.5;
                const distSq = dx * dx + dy * dy + dz * dz;
                const maxCollisionDistSq = 100;

                if (distSq > maxCollisionDistSq) {
                    continue;
                }

                barrier.userData.box.setFromObject(barrier);

                // Forgiving hitbox - shrink by 15%
                barrier.userData.box.getSize(tempVec3_1);
                barrier.userData.box.getCenter(tempVec3_2);
                tempVec3_1.multiplyScalar(0.85);
                barrier.userData.box.setFromCenterAndSize(tempVec3_2, tempVec3_1);

                if (shipBox.intersectsBox(barrier.userData.box)) {
                    if (!gracePeriodActive) {
                        spawnCollisionDebris(barrier.position.x, barrier.position.y, barrier.position.z, curX, curY);

                        barrier.visible = false;
                        barrier.position.z = -1000;
                        barrierWalls.splice(i, 1);

                        if (invincibilityActive) {
                            crashMessage = `INVINCIBLE!`;
                            crashMessageTimer = 40;
                        } else {
                            collisionFlash = 0.5;

                            if (shieldActive && shieldHits < maxShieldHits) {
                                shieldHits++;
                                uiControls.updateShieldBar(shieldActive, shieldHits);
                                crashMessage = `SHIELD HIT ${shieldHits}/${maxShieldHits}`;
                                crashMessageTimer = 50;

                                if (shieldHits >= maxShieldHits) {
                                    shieldActive = false;
                                    uiControls.updateShieldBar(shieldActive, shieldHits);
                                    crashMessage = `SHIELD DOWN!`;
                                }
                            } else {
                                if (currentHealth > 0) {
                                    currentHealth--;
                                    uiControls.updateHealthBar(currentHealth, maxHealth);
                                    crashMessage = currentHealth > 0 ? `CRASH! ${currentHealth}♥` : 'CRASH!';
                                    crashMessageTimer = 50;

                                    activateGracePeriod();

                                    if (currentHealth === 0) {
                                        handleDeath();
                                    }
                                }
                            }

                            trackCollision(timestamp);
                        }

                        break;
                    }
                }
            }
        }

        // Ring collection logic - optimized backwards loop
        for (let i = rings.length - 1; i >= 0; i--) {
            const ring = rings[i];

            // Always move ring forward
            ring.position.z += speed;
            // Apply altitude parallax scaling to rings (multiply with original scale)
            if (ring.userData.originalScale) {
                ring.scale.set(
                    ring.userData.originalScale.x * terrainScale,
                    ring.userData.originalScale.y * terrainScale,
                    ring.userData.originalScale.z * terrainScale
                );
            }

            if (!ring.userData.collected) {
                ring.rotation.z += 0.02 * deltaTime; // Spin effect

                // Check if plane flies through ring - optimized with squared distance
                const zDiff = Math.abs(ring.position.z - 3.5);
                if (zDiff < 2) {
                    const dx = ring.position.x - curX;
                    const dy = ring.position.y - curY;
                    const distSq = dx * dx + dy * dy;
                    const ringRadiusSq = 3 * 3; // 9

                    if (distSq < ringRadiusSq) {
                        ring.userData.collected = true;
                        ring.userData.collectTime = Date.now(); // Track when collected
                        const points = ring.userData.points || 25;
                        score += points;

                        // Track ring hit for difficulty system (hidden)
                        difficultyMetrics.ringAttempts.push({time: timestamp, success: true});

                        // Show bonus in score display with fade effect
                        uiControls.elements.scoreBonusUI.innerText = `+${points}`;
                        uiControls.elements.scoreBonusUI.style.opacity = '1';
                        bonusFadeTimer = 90; // Show for ~1.5 seconds at 60fps
                        ring.material.color.setHex(0xffff00); // Flash yellow

                        // Apply ring boost - temporary speed boost!
                        ringBoost = Math.max(ringBoost, 0.5); // 0.5x speed multiplier
                    }
                }
            }

            // Return to pool if too far OR collected for >100ms
            if (ring.position.z > 20 || (ring.userData.collected && Date.now() - ring.userData.collectTime > 100)) {
                // Track ring miss for difficulty system (hidden) - only if not collected
                if (!ring.userData.collected && !ring.userData.missTracked) {
                    difficultyMetrics.ringAttempts.push({time: timestamp, success: false});
                    ring.userData.missTracked = true; // Track only once
                }

                ring.visible = false;
                ring.position.z = -1000;
                ring.material = ringMat; // Reset to green
                rings.splice(i, 1);
            }
        }

        // Shield pickup collection logic
        for (let i = shieldPickups.length - 1; i >= 0; i--) {
            const pickup = shieldPickups[i];

            // Move pickup forward
            pickup.position.z += speed;
            // Apply altitude parallax scaling to shield pickups (multiply with original scale)
            if (pickup.userData.originalScale) {
                pickup.scale.set(
                    pickup.userData.originalScale.x * terrainScale,
                    pickup.userData.originalScale.y * terrainScale,
                    pickup.userData.originalScale.z * terrainScale
                );
            }

            if (!pickup.userData.collected) {
                // Rotate pickup for visual effect
                pickup.rotation.y += 0.03 * deltaTime;
                pickup.rotation.x += 0.02 * deltaTime;

                // Check if plane collects pickup
                const dx = pickup.position.x - curX;
                const dy = pickup.position.y - curY;
                const dz = pickup.position.z - 3.5;
                const distSq = dx * dx + dy * dy + dz * dz;
                const collectRadiusSq = 2 * 2;

                if (distSq < collectRadiusSq) {
                    pickup.userData.collected = true;
                    // Restore shield
                    shieldActive = true;
                    shieldHits = 0;
                    uiControls.updateShieldBar(shieldActive, shieldHits);
                    crashMessage = 'SHIELD RESTORED!';
                    crashMessageTimer = 60;
                }
            }

            // Return to pool if too far or collected
            if (pickup.position.z > 20 || pickup.userData.collected) {
                pickup.visible = false;
                pickup.position.z = -1000;
                shieldPickups.splice(i, 1);
            }
        }

        // Wind gust collection and animation logic
        for (let i = windGusts.length - 1; i >= 0; i--) {
            const gust = windGusts[i];

            // Move gust forward
            gust.position.z += speed;

            if (!gust.userData.collected) {
                // Animate wind gust - @ symbol unfurling away from camera
                gust.userData.animationTime += 0.03 * deltaTime;
                gust.children.forEach((ring, idx) => {
                    // Rotate each ring at different speeds for spiral effect
                    const rotationSpeed = 0.025 + (idx * 0.01);
                    ring.rotation.z += rotationSpeed * deltaTime;

                    // Expanding/unfurling effect - rings expand outward and fade
                    const unfurlPhase = (gust.userData.animationTime + (idx * 0.5)) % 3;
                    const expansion = 0.8 + (unfurlPhase * 0.15); // Gradually expand
                    ring.scale.set(expansion, expansion, 1);

                    // Fade as they unfurl outward
                    ring.material.opacity = Math.max(0.2, 0.65 - (unfurlPhase * 0.15) - (idx * 0.1));
                });

                // Check if plane flies through gust
                const dx = gust.position.x - curX;
                const dy = gust.position.y - curY;
                const dz = gust.position.z - 3.5;
                const distSq = dx * dx + dy * dy + dz * dz;
                const collectRadiusSq = 3 * 3;

                if (distSq < collectRadiusSq) {
                    gust.userData.collected = true;
                    gust.userData.collectTime = Date.now();

                    // WIND BOOST - zoom ahead!
                    ringBoost = Math.max(ringBoost, 1.5); // Strong speed boost!

                    crashMessage = 'WIND BOOST!';
                    crashMessageTimer = 45;
                }
            }

            // Return to pool if too far or collected
            if (gust.position.z > 20 || (gust.userData.collected && Date.now() - gust.userData.collectTime > 150)) {
                gust.visible = false;
                gust.position.z = -1000;
                gust.userData.animationTime = 0;
                windGusts.splice(i, 1);
            }
        }

        // Coin collection logic - optimized backwards loop
        for (let i = coins.length - 1; i >= 0; i--) {
            const coin = coins[i];

            // Move coin forward with world
            coin.position.z += speed;
            // Apply altitude parallax scaling to coins (multiply with original scale)
            if (coin.userData.originalScale) {
                coin.scale.set(
                    coin.userData.originalScale.x * terrainScale,
                    coin.userData.originalScale.y * terrainScale,
                    coin.userData.originalScale.z * terrainScale
                );
            }

            if (!coin.userData.collected) {
                // Increment spin angle
                coin.userData.spinAngle += coin.userData.spinSpeed * deltaTime;

                // Face the camera (billboard effect)
                coin.lookAt(camera.position);

                // Reuse quaternions to prevent garbage collection
                coinLookAtQuat.copy(coin.quaternion);
                coinSpinQuat.setFromAxisAngle(coinZAxis, coin.userData.spinAngle);

                // Combine: lookAt * xRot * spinRot (reusing pre-created objects)
                coin.quaternion.copy(coinLookAtQuat).multiply(coinXRotQuat).multiply(coinSpinQuat);

                // Sheen effect - pulse opacity based on spin angle
                const sheenValue = Math.abs(Math.sin(coin.userData.spinAngle * 2)); // Rotation-based pulse
                coin.material.opacity = 0.6 + (sheenValue * 0.3); // Pulse between 0.6 and 0.9

                // Check if plane collects coin - simple distance check
                // Coin magnet increases collection radius
                const dx = coin.position.x - curX;
                const dy = coin.position.y - curY;
                const dz = coin.position.z - 3.5;
                const distSq = dx * dx + dy * dy + dz * dz;
                const baseRadiusSq = 1.5 * 1.5; // Normal collection radius
                const magnetRadiusSq = coinMagnetActive ? (coinMagnetRadius * coinMagnetRadius) : baseRadiusSq;

                if (distSq < magnetRadiusSq) {
                    coin.userData.collected = true;
                    score += 2; // 2 points per coin - small additive bonus

                    // Spawn sparkle particles at coin position
                    spawnCoinSparkles(coin.position.x, coin.position.y, coin.position.z);

                    // Show bonus in score display
                    // scoreDisplayUI.innerText = `SCORE: ${score}`; // Commented out - element doesn't exist
                    uiControls.elements.scoreBonusUI.innerText = `+2`;
                    uiControls.elements.scoreBonusUI.style.opacity = '1';
                    bonusFadeTimer = 60; // Show briefly
                }
            }

            // Return to pool if too far past camera or collected
            if (coin.position.z > 15 || coin.userData.collected) {
                coin.visible = false;
                coin.position.z = -1000;
                coin.userData.collected = false;
                coin.userData.spinAngle = 0; // Reset spin for next use
                coins.splice(i, 1);
            }
        }

        // Auto-shooting logic: fire at buildings and enemies directly in path
        if (canShoot) {
            let targetAhead = false;

            // Check for buildings directly in player's path
            for (let i = 0; i < buildings.length; i++) {
                const building = buildings[i];
                // Target only buildings within 60 units ahead and DIRECTLY in path (±2.5 units)
                if (building.position.z < 5 && building.position.z > -60 &&
                    Math.abs(building.position.x - curX) < 2.5) {
                    targetAhead = true;
                    break;
                }
            }

            // Enemy targeting removed (enemies no longer spawn)

            // Auto-fire if target detected (shootLaser handles fire rate limiting)
            if (targetAhead) {
                shootLaser();
            }
        }

        // Laser update logic - optimized backwards loop
        for (let i = lasers.length - 1; i >= 0; i--) {
            const laser = lasers[i];
            laser.position.z += laser.userData.velocity;

            // Remove if too far
            if (laser.position.z < -50) {
                scene.remove(laser);
                lasers.splice(i, 1);
            }
        }

        // Laser-building collision detection
        for (let i = lasers.length - 1; i >= 0; i--) {
            const laser = lasers[i];
            let laserRemoved = false;

            // Check collision with each building
            for (let j = buildings.length - 1; j >= 0; j--) {
                const building = buildings[j];

                // Skip inactive buildings or those too far away (prevents ghost collisions)
                if (!building.active || building.position.z < -50 || building.position.z > 15) continue;

                // Calculate bounding box manually for instanced mesh
                // All geometries are centered, so half extents are the same in all directions
                const halfWidth = (building.geometry === 'box' ? 1 : building.geometry === 'pyramid' ? 1 : 0.75) * building.scale.x;
                const halfHeight = 2.5 * building.scale.y; // Geometry is 5 units tall, half is 2.5
                const halfDepth = (building.geometry === 'box' ? 1 : building.geometry === 'pyramid' ? 1 : 0.75) * building.scale.z;

                building.box.min.set(
                    building.position.x - halfWidth,
                    building.position.y - halfHeight,
                    building.position.z - halfDepth
                );
                building.box.max.set(
                    building.position.x + halfWidth,
                    building.position.y + halfHeight,
                    building.position.z + halfDepth
                );

                // Check laser-building collision using tempBox
                tempBox.setFromObject(laser);
                if (tempBox.intersectsBox(building.box)) {
                    // Spawn debris at building location with laser impact
                    spawnCollisionDebris(
                        building.position.x,
                        building.position.y,
                        building.position.z,
                        laser.position.x,
                        laser.position.y,
                        building
                    );

                    // Add score bonus for destroying building with laser
                    score += 15;
                    // scoreDisplayUI.innerText = `SCORE: ${score}`; // Commented out - element doesn't exist

                    // Show bonus message
                    uiControls.elements.scoreBonusUI.innerText = '+15';
                    uiControls.elements.scoreBonusUI.style.opacity = '1';
                    bonusFadeTimer = 48; // ~800ms at 60fps

                    // Deactivate building instance
                    building.active = false;
                    building.position.z = -500;
                    const mesh = building.geometry === 'box' ? boxInstancedMesh :
                                 building.geometry === 'pyramid' ? pyramidInstancedMesh :
                                 cylinderInstancedMesh;
                    const instanceIndex = buildingInstances[building.geometry].indexOf(building);
                    updateInstanceMatrix(building, mesh, instanceIndex);

                    // Remove laser
                    scene.remove(laser);
                    lasers.splice(i, 1);
                    laserRemoved = true;
                    break; // Exit building loop since laser is destroyed
                }
            }

            if (laserRemoved) break; // Exit laser loop iteration
        }

        // Laser-wall collision detection
        for (let i = lasers.length - 1; i >= 0; i--) {
            const laser = lasers[i];
            let laserRemoved = false;

            // Check collision with each wall
            for (let j = walls.length - 1; j >= 0; j--) {
                const wall = walls[j];

                // Update wall collision box (pre-created during initialization)
                wall.userData.box.setFromObject(wall);

                // Check laser-wall collision using tempBox
                tempBox.setFromObject(laser);
                if (tempBox.intersectsBox(wall.userData.box)) {
                    // Spawn debris at wall location with laser impact
                    spawnCollisionDebris(
                        wall.position.x,
                        wall.position.y,
                        wall.position.z,
                        laser.position.x,
                        laser.position.y,
                        null // Walls don't pass structure object
                    );

                    // Add score bonus for destroying wall with laser
                    score += 10;

                    // Show bonus message
                    uiControls.elements.scoreBonusUI.innerText = '+10';
                    uiControls.elements.scoreBonusUI.style.opacity = '1';
                    bonusFadeTimer = 48; // ~800ms at 60fps

                    // Remove wall and laser
                    scene.remove(wall);
                    walls.splice(j, 1);
                    scene.remove(laser);
                    lasers.splice(i, 1);
                    laserRemoved = true;
                    break; // Exit wall loop since laser is destroyed
                }
            }

            if (laserRemoved) break; // Exit laser loop iteration
        }

        // Laser-barrier collision detection (Star Fox style)
        for (let i = lasers.length - 1; i >= 0; i--) {
            const laser = lasers[i];
            let laserRemoved = false;

            // Check collision with each barrier segment
            for (let j = barrierWalls.length - 1; j >= 0; j--) {
                const barrier = barrierWalls[j];

                // Update barrier collision box
                barrier.userData.box.setFromObject(barrier);

                // Check laser-barrier collision
                tempBox.setFromObject(laser);
                if (tempBox.intersectsBox(barrier.userData.box)) {
                    // Spawn debris at barrier location
                    spawnCollisionDebris(
                        barrier.position.x,
                        barrier.position.y,
                        barrier.position.z,
                        laser.position.x,
                        laser.position.y,
                        null
                    );

                    // Add score bonus for destroying barrier with laser
                    score += 12;

                    // Show bonus message
                    uiControls.elements.scoreBonusUI.innerText = '+12';
                    uiControls.elements.scoreBonusUI.style.opacity = '1';
                    bonusFadeTimer = 48;

                    // Remove barrier segment and laser
                    barrier.visible = false;
                    barrier.position.z = -1000;
                    barrierWalls.splice(j, 1);
                    scene.remove(laser);
                    lasers.splice(i, 1);
                    laserRemoved = true;
                    break;
                }
            }

            if (laserRemoved) break;
        }

        // Enemy system removed - lasers now destroy buildings/walls instead
        // (Enemy update logic commented out)

        // Spawn coins randomly in the environment (not too many at once)
        // Don't spawn during boss encounters
        // RESTRICTION: No coins before mile 15 (early game onboarding)
        if (miles >= 15 && Math.random() < 0.001 && coins.length < 6 && !bossActive) {
            const coin = getCoinFromPool();
            if (coin) {
                // X position: Only spawn in center 3 lanes (-4, 0, 4)
                const centerLanes = [-4, 0, 4];
                const coinX = centerLanes[Math.floor(Math.random() * centerLanes.length)];

                // Random Y heights - up high or down low
                const coinY = Math.random() < 0.5
                    ? (0.8 + Math.random() * 1.2)   // Low: 0.8-2.0
                    : (4.0 + Math.random() * 1.5);  // High: 4.0-5.5
                const coinZ = -250 - Math.random() * 50; // Spawn 250-300 units ahead for better visibility

                // Check if coin would overlap with any active building
                // Check if position is clear of all objects (buildings, rings, wind, etc.)
                if (isPositionClear(coinX, coinY, coinZ, 5)) {
                    coin.position.set(coinX, coinY, coinZ);
                    coin.rotation.y = Math.random() * Math.PI * 2; // Random initial rotation
                    coins.push(coin);
                }
            }
        }

        // Level progression (every 100 miles)
        if (newLevel > currentLevel) {
            currentLevel = newLevel;
            levelUpMessage = `LEVEL ${currentLevel}`;
            levelUpMessageTimer = 90; // Show for 1.5 seconds

            // Update terrain every 3 levels during breather phases (to avoid visual glitches)
            const isInBreatherPhase = currentPhase === 'breather_before_rings' ||
                                     currentPhase === 'breather_after_rings' ||
                                     currentPhase === 'rings' ||
                                     currentPhase === 'walls';

            if (currentLevel % 3 === 0 && currentLevel !== lastTerrainLevel && isInBreatherPhase) {
                updateTerrainForLevel(currentLevel);
                lastTerrainLevel = currentLevel;
            }
        }

        /* --- BOSS SPAWNING TRIGGER --- COMMENTED OUT - NEEDS REWORK
        // Boss spawning at 150 miles, then every 100 miles (250, 350, 450...)
        const currentMiles = Math.floor(miles);
        if (currentMiles >= 150 && (currentMiles === 150 || (currentMiles - 150) % 100 === 0) && bosses.length === 0) {
            spawnBoss();
        }
        END BOSS SPAWNING TRIGGER */

        // Try to spawn shield pickup periodically if player needs it
        if (Math.random() < 0.01) { // 1% chance per frame when conditions are met
            trySpawnShieldPickup();
        }

        // Try to spawn wind gusts during breather/ring moments (rare) OR buildings (very rare)
        // RESTRICTION: No wind gusts before mile 15 (early game onboarding)
        const isBreatherMoment = currentPhase === 'rings' ||
            currentPhase === 'breather' ||
            currentPhase === 'breather_before_rings' ||
            currentPhase === 'breather_after_rings';

        const isHighIntensityPhase = currentPhase === 'buildings' || currentPhase === 'walls';

        // Breather moments: 0.3% chance, High intensity (buildings/walls): 0.05% chance (rare bonus)
        const windGustChance = isBreatherMoment ? 0.003 : (isHighIntensityPhase ? 0.0005 : 0);

        // Only spawn wind gusts after mile 15 AND if chance triggers
        if (miles >= 15 && windGusts.length === 0 && Math.random() < windGustChance) {
            // Breather: sometimes 2-3 gusts, High intensity: always just 1 (rare bonus)
            const gustCount = isBreatherMoment && Math.random() < 0.3 ? (Math.floor(Math.random() * 2) + 2) : 1;

            for (let i = 0; i < gustCount; i++) {
                const gust = getWindGustFromPool();
                if (gust) {
                    // Spawn in safe lane, mid-height, spaced apart
                    const gustX = (Math.random() - 0.5) * 6;
                    const gustY = Math.random() * 2 + 2.5;
                    const gustZ = -120 - (i * 60);

                    // Only spawn if position is clear
                    if (isPositionClear(gustX, gustY, gustZ, 6)) {
                        gust.position.set(gustX, gustY, gustZ);
                        windGusts.push(gust);
                    }
                }
            }
        }

        // Rare ring spawn during WALL phase only (not buildings) - bonus reward
        // RESTRICTION: No rings before mile 15 (early game onboarding)
        const isWallPhase = currentPhase === 'walls';
        if (miles >= 15 && isWallPhase && rings.length === 0 && !bossActive && Math.random() < 0.0008) {
            // Very rare: single ring as bonus during walls
            const ring = getRingFromPool();
            if (ring) {
                // 10% chance for rare fuchsia ring
                const isFuchsia = Math.random() < 0.1;
                ring.material = isFuchsia ? fuchsiaRingMat : ringMat;

                const ringX = (Math.random() - 0.5) * 8;
                const ringY = Math.random() * 2 + 2;
                const ringZ = -200;

                // Only spawn if position is clear
                if (isPositionClear(ringX, ringY, ringZ, 6)) {
                    ring.position.set(ringX, ringY, ringZ);
                    ring.userData.points = isFuchsia ? 50 : 25;
                    rings.push(ring);
                }
            }
        }

        // Ring spawning before checkpoints - spawn 5 miles before each checkpoint (not during boss)
        const milesUntilCheckpoint = nextCheckpoint - miles;
        if (milesUntilCheckpoint <= 5 && milesUntilCheckpoint > 0 && !ringsSpawnedForCheckpoint && rings.length === 0 && !bossActive) {
            // During building phases: only 1 ring. Other phases: 2-3 rings
            const isBuildingPhase = currentPhase === 'buildings' || currentPhase === 'boss_gauntlet';
            const ringCount = isBuildingPhase ? 1 : (Math.floor(Math.random() * 2) + 2); // 1 ring for buildings, 2-3 for others

            for (let i = 0; i < ringCount; i++) {
                // 10% chance for rare fuchsia ring (50 bonus)
                const isFuchsia = Math.random() < 0.1;
                const ring = getRingFromPool();

                if (ring) {
                    ring.material = isFuchsia ? fuchsiaRingMat : ringMat;

                    const ringX = (Math.random() - 0.5) * 8;
                    const ringY = Math.random() * 2 + 2;
                    const ringZ = -150 - (i * 50);

                    // Only spawn if position is clear
                    if (isPositionClear(ringX, ringY, ringZ, 6)) {
                        ring.position.set(ringX, ringY, ringZ);
                        ring.userData.points = isFuchsia ? 50 : 25;
                        rings.push(ring);
                    }
                }
            }

            // Clear all buildings and walls during ring collection
            buildings.forEach(b => {
                b.position.z = -500;
                b.visible = false;
            });
            // Return all active walls to pool
            walls.forEach(w => {
                w.visible = false;
                w.position.z = -1000;
            });
            walls.length = 0; // Clear walls array

            ringsSpawnedForCheckpoint = true;
        }

        // Checkpoint system - spawn gate at checkpoint
        if (miles >= nextCheckpoint && gates.length === 0 && !checkpointActive) {
            createCheckpointGate();
        }

        // Update gates - optimized backwards loop
        for (let i = gates.length - 1; i >= 0; i--) {
            const gate = gates[i];
            gate.position.z += speed;
            gate.rotation.z += 0.01 * deltaTime; // Slow rotation

            // Check if player passed through gate
            if (Math.abs(gate.position.z - 3.5) < 3 && !gate.userData.passed) {
                gate.userData.passed = true;
                showCheckpointUI(Math.floor(miles));

                // Consistent checkpoint distances every 25 miles
                const checkpointDistance = 25;
                nextCheckpoint += checkpointDistance;
                ringsSpawnedForCheckpoint = false; // Reset for next checkpoint

                // Activate 3-second grace period
                gracePeriodActive = true;
                gracePeriodEndTime = Date.now() + 3000;
            }

            // Remove gate if too far
            if (gate.position.z > 20) {
                scene.remove(gate);
                gates.splice(i, 1);
            }
        }

        // Update Christmas snowflakes (seasonal)
        for (let i = 0; i < snowflakes.length; i++) {
            const snow = snowflakes[i];

            // Fall down
            snow.position.y -= snow.userData.fallSpeed * deltaTime;

            // Gentle horizontal drift
            snow.position.x += snow.userData.driftSpeed * deltaTime;

            // Gentle rotation
            snow.rotation.z += snow.userData.rotationSpeed * deltaTime;

            // Billboard effect - face camera
            snow.lookAt(camera.position);

            // Reset when falls below view
            if (snow.position.y < -2) {
                snow.position.y = Math.random() * 5 + 15; // Reset to top
                snow.position.x = (Math.random() - 0.5) * 40; // New random X
            }
        }

        // Phase system: Smart phase selection with intensity balancing
        const currentTime = Date.now();
        const phaseComplete = (currentTime - phaseStartTime >= phaseDuration) && allPhaseItemsCollected();

        if (phaseComplete && !bossActive) {
            // Select next phase using smart algorithm (pass current miles for difficulty adjustments)
            const nextPhaseData = selectNextPhase(Math.floor(miles));

            currentPhase = nextPhaseData.phase;
            phaseDuration = nextPhaseData.duration;
            phaseStartTime = currentTime;

            // Reset all phase flags
            ringsSpawnedThisPhase = false;
            wallsSpawnedThisPhase = false;
            coinsSpawnedThisPhase = false;
            mixedSpawnedThisPhase = false;
            bonusSpawnedThisPhase = false;
            breatherSetup = false;
        }

        // COINS PHASE - Spawn scattered coins
        if (currentPhase === 'coins' && !coinsSpawnedThisPhase && !bossActive) {
            const coinCount = Math.floor(Math.random() * 7) + 12; // 12-18 coins

            for (let i = 0; i < coinCount; i++) {
                const coin = getCoinFromPool();
                if (coin) {
                    const lanes = [-3, -1.5, 0, 1.5, 3];
                    const lane = lanes[Math.floor(Math.random() * lanes.length)];
                    const yPos = 1 + Math.random() * 5; // Various heights
                    const zSpacing = 300 / coinCount; // Spread over distance

                    coin.position.set(lane, yPos, -250 - (i * zSpacing));
                    coins.push(coin);
                }
            }

            // Clear buildings during coin phase
            buildings.forEach(b => {
                b.position.z = -500;
                b.visible = false;
            });

            coinsSpawnedThisPhase = true;
        }

        // BONUS PHASE - Coin run + wind gusts combo
        if (currentPhase === 'bonus' && !bonusSpawnedThisPhase && !bossActive) {
            // 6-8 coins in a line
            const coinCount = Math.floor(Math.random() * 3) + 6;
            const startZ = -250;
            const spacing = 18;

            for (let i = 0; i < coinCount; i++) {
                const coin = getCoinFromPool();
                if (coin) {
                    const lanes = [-2, 0, 2];
                    const lane = lanes[Math.floor(Math.random() * lanes.length)];
                    coin.position.set(lane, 2 + Math.random() * 2, startZ - (i * spacing));
                    coins.push(coin);
                }
            }

            // 2-3 wind gusts between coins
            const gustCount = Math.floor(Math.random() * 2) + 2;
            for (let i = 0; i < gustCount; i++) {
                const gust = getWindGustFromPool();
                if (gust) {
                    const gustZ = startZ - (coinCount * spacing * 0.3 * (i + 1));
                    gust.position.set(0, 3, gustZ);
                    gust.visible = true;
                    windGusts.push(gust);
                }
            }

            // Clear buildings during bonus phase
            buildings.forEach(b => {
                b.position.z = -500;
                b.visible = false;
            });

            bonusSpawnedThisPhase = true;
        }

        // BREATHER PHASE - Just flying with minimal obstacles
        if (currentPhase === 'breather' && !breatherSetup && !bossActive) {
            // Spawn 1-2 optional rings far apart
            if (Math.random() < 0.5) {
                const ring1 = new THREE.Mesh(ringGeometry, ringMat);
                ring1.position.set((Math.random() - 0.5) * 8, Math.random() * 2 + 2, -180);
                ring1.rotation.x = 0;
                ring1.rotation.y = 0;
                ring1.userData.collected = false;
                ring1.userData.points = 25;
                ring1.userData.originalScale = { x: 1, y: 1, z: 1 };
                scene.add(ring1);
                rings.push(ring1);

                if (Math.random() < 0.3) {
                    const ring2 = new THREE.Mesh(ringGeometry, ringMat);
                    ring2.position.set((Math.random() - 0.5) * 8, Math.random() * 2 + 3, -280);
                    ring2.rotation.x = 0;
                    ring2.rotation.y = 0;
                    ring2.userData.collected = false;
                    ring2.userData.points = 25;
                    ring2.userData.originalScale = { x: 1, y: 1, z: 1 };
                    scene.add(ring2);
                    rings.push(ring2);
                }
            }

            // Clear ALL obstacles for breather (buildings, walls, coins)
            buildings.forEach(b => {
                b.position.z = -500;
                b.visible = false;
            });

            // Clear walls
            walls.forEach(w => {
                w.visible = false;
                w.position.z = -1000;
            });
            walls.length = 0;

            // Clear coins
            coins.forEach(c => {
                c.visible = false;
                c.position.z = -1000;
            });
            coins.length = 0;

            breatherSetup = true;
        }

        // MIXED PHASE - Light buildings + scattered coins
        if (currentPhase === 'mixed' && !mixedSpawnedThisPhase && !bossActive) {
            // Spawn 6-8 coins scattered
            const coinCount = Math.floor(Math.random() * 3) + 6;
            for (let i = 0; i < coinCount; i++) {
                const coin = getCoinFromPool();
                if (coin) {
                    const lanes = [-3, -1.5, 0, 1.5, 3];
                    const lane = lanes[Math.floor(Math.random() * lanes.length)];
                    const yPos = 1 + Math.random() * 4;
                    const coinZ = -220 - (i * 30);

                    // CRITICAL: Check for overlaps since buildings also spawn in this phase
                    if (isPositionClear(lane, yPos, coinZ, 5)) {
                        coin.position.set(lane, yPos, coinZ);
                        coins.push(coin);
                    }
                }
            }

            // Buildings will spawn normally through wave system but at reduced density
            // The phase flag prevents too many from spawning
            mixedSpawnedThisPhase = true;
        }

        // RINGS PHASE - Spawn rings (ONLY ONCE per phase, not during boss)
        if (currentPhase === 'rings' && !ringsSpawnedThisPhase && !bossActive) {
            // SHORT ring runs: only 2-3 rings max
            const ringCount = Math.floor(Math.random() * 2) + 2; // 2-3 rings

            for (let i = 0; i < ringCount; i++) {
                // 10% chance for rare fuchsia ring (50 bonus)
                const isFuchsia = Math.random() < 0.1;
                const material = isFuchsia ? fuchsiaRingMat : ringMat;
                const ring = new THREE.Mesh(ringGeometry, material);

                const ringX = (Math.random() - 0.5) * 8;
                const ringY = Math.random() * 2 + 2;
                const ringZ = -250 - (i * 50);

                // Check for overlaps before spawning
                if (isPositionClear(ringX, ringY, ringZ, 6)) {
                    ring.position.set(ringX, ringY, ringZ);
                    ring.rotation.x = 0;
                    ring.rotation.y = 0;
                    ring.userData.collected = false;
                    ring.userData.missTracked = false; // For difficulty tracking
                    ring.userData.points = isFuchsia ? 50 : 25; // Track points for each ring
                    ring.userData.originalScale = { x: 1, y: 1, z: 1 }; // Store for parallax
                    scene.add(ring);
                    rings.push(ring);
                }
            }

            // Clear all buildings to create a building-free corridor
            buildings.forEach(b => {
                b.position.z = -500; // Move far back
                b.visible = false;
            });

            ringsSpawnedThisPhase = true; // Mark rings as spawned for this phase
        }

        /* --- BOSS UPDATE AND COLLISION LOGIC --- COMMENTED OUT - NEEDS REWORK
        // Boss update and collision logic
        for (let i = bosses.length - 1; i >= 0; i--) {
            const boss = bosses[i];

            // Move boss forward with world
            boss.position.z += speed;
            // Apply altitude parallax scaling to bosses (multiply with original scale)
            if (boss.userData.originalScale) {
                boss.scale.set(
                    boss.userData.originalScale.x * terrainScale,
                    boss.userData.originalScale.y * terrainScale,
                    boss.userData.originalScale.z * terrainScale
                );
            }

            // Rotate the boss (direction determined at spawn)
            boss.rotation.z += boss.userData.rotationSpeed * deltaTime;

            // Update collision box
            boss.userData.box.setFromObject(boss);

            // Check collision with player
            if (boss.position.z > -50 && boss.position.z < 15) {
                // Broad-phase culling: distance check before expensive Box3 operations
                const dx = boss.position.x - curX;
                const dy = boss.position.y - curY;
                const dz = boss.position.z - 3.5;
                const distSq = dx * dx + dy * dy + dz * dz;
                const maxCollisionDistSq = 100; // ~10 units squared

                // Only check Box3 intersection if within range
                if (distSq <= maxCollisionDistSq) {
                    // Check collision against individual blades (not the whole group)
                    // This allows flying through gaps between blades
                    let hitBlade = false;

                    // Boss has children: [0] = axle, [1-4] = blades
                    for (let j = 1; j < boss.children.length; j++) {
                        const blade = boss.children[j];

                        // Create temporary box for this blade
                        const bladeBox = new THREE.Box3().setFromObject(blade);

                        if (shipBox.intersectsBox(bladeBox)) {
                            hitBlade = true;
                            break;
                        }
                    }

                    if (hitBlade) {
                        // Hit a blade - take damage
                        if (!gracePeriodActive && !invincibilityActive) {
                            collisionFlash = 0.5;

                            // Boss collision - moderate damage
                            const pointsLost = 25;
                            score = Math.max(0, score - pointsLost);

                            crashMessage = `BOSS HIT -${pointsLost}`;
                            crashMessageTimer = 60;
                        }
                    } else if (boss.position.z > -5 && boss.position.z < 5 && !boss.userData.dodged) {
                        // Flew through the gap! Reward skillful flying
                        score += 50;
                        levelUpMessage = 'BLADE GAP +50!';
                        levelUpMessageTimer = 60;
                        boss.userData.dodged = true; // Only reward once per boss
                    }
                }
            }

            // Remove boss if too far past camera
            if (boss.position.z > 30) {
                boss.userData.active = false;
                boss.visible = false;
                boss.position.z = -400;
                bosses.splice(i, 1);

                // Increment defeated counter
                bossesDefeated++;

                // Spawn next boss if we haven't reached the total
                if (bossesDefeated < totalBossesPerEncounter) {
                    // Wait a bit before spawning next boss
                    setTimeout(() => spawnNextBoss(), 1000);
                } else {
                    // All bosses defeated - re-enable normal spawning
                    bossActive = false;
                }
            }
        }
        END BOSS UPDATE AND COLLISION LOGIC */

        // Phase transitions now handled by smart phase selection algorithm above

        // Check grace period expiration
        if (gracePeriodActive && Date.now() >= gracePeriodEndTime) {
            gracePeriodActive = false;
        }

        // Grace period visual effect: pulse and transparency
        // Only change material.transparent when state changes to avoid shader recompilation
        if (gracePeriodActive !== previousGracePeriodActive) {
            if (gracePeriodActive) {
                mainMesh.material.transparent = true;
                wireMesh.material.transparent = true;
            } else {
                mainMesh.material.transparent = false;
                mainMesh.material.opacity = 1.0;
                wireMesh.material.opacity = 1.0;
                shadowMesh.material.opacity = 0.3;
            }
            previousGracePeriodActive = gracePeriodActive;
        }

        // Update opacity for pulse effect (only when grace period is active)
        if (gracePeriodActive) {
            const pulse = Math.sin(time * 10) * 0.3 + 0.7;
            mainMesh.material.opacity = pulse;
            wireMesh.material.opacity = pulse;
            shadowMesh.material.opacity = pulse * 0.3;
        }

        // Update sparkle particles
        for (let i = sparkles.length - 1; i >= 0; i--) {
            const sparkle = sparkles[i];
            sparkle.userData.life--;

            // Move sparkle with velocity
            sparkle.position.x += sparkle.userData.velocity.x;
            sparkle.position.y += sparkle.userData.velocity.y;
            sparkle.position.z += sparkle.userData.velocity.z;

            // Move forward with world
            sparkle.position.z += speed;

            // Fade out based on life remaining
            const lifeRatio = sparkle.userData.life / sparkle.userData.maxLife;
            sparkle.material.opacity = lifeRatio;

            // Scale down as it fades
            const scale = 0.5 + (lifeRatio * 0.5);
            sparkle.scale.set(scale, scale, scale);

            // Billboard effect - always face camera
            sparkle.lookAt(camera.position);

            // Remove if life expired
            if (sparkle.userData.life <= 0) {
                scene.remove(sparkle);
                sparkles.splice(i, 1);
            }
        }

        // Message timers
        if (crashMessageTimer > 0) crashMessageTimer--;
        if (levelUpMessageTimer > 0) levelUpMessageTimer--;

        // Bonus fade timer
        if (bonusFadeTimer > 0) {
            bonusFadeTimer--;
        }

        // Collision Glitch FX (RED) - only during collision
        if (collisionFlash > 0) {
            collisionFlash -= 0.05;
            if (collisionFlash <= 0) {
                // Collision ended - reset to normal
                renderer.setClearColor(0x000000, 1);
                terrainMat.color.setHex(0x00ffff);
                wireMat.color.setHex(0x00ffff);
            } else {
                // Still flashing - use reusable color object
                tempColor.setRGB(collisionFlash * 0.4, 0, 0);
                renderer.setClearColor(tempColor, 1);
                terrainMat.color.setHex(0xff0033);
                wireMat.color.setHex(0xff0033);
                shipGroup.position.x += (Math.random() - 0.5) * collisionFlash * 0.3;
            }
        }

        const distMiles = Math.floor(miles);

        // Update UI (throttled - only on value changes)
        updateUI({
            score,
            highScore,
            currentLevel,
            distMiles,
            crashMessage,
            crashMessageTimer,
            levelUpMessage,
            levelUpMessageTimer,
            bonusFadeTimer,
            elements: uiControls.elements
        });

        // Update debug overlay at end of frame (all variables now defined)
        if (DEBUG_ENABLED && debugOverlay) {
            const fpsColor = debugMetrics.fps >= 60 ? '#00ff00' : debugMetrics.fps >= 30 ? '#ffff00' : '#ff0000';
            debugOverlay.innerHTML = `
                <div style="font-weight: bold; margin-bottom: 4px;">DEBUG INFO</div>
                <div style="color: ${fpsColor}">FPS: ${debugMetrics.fps.toFixed(1)}</div>
                <div>Frame Time: ${debugMetrics.avgFrameTime.toFixed(2)}ms</div>
                <div style="margin-top: 4px;">Position: X${curX.toFixed(1)} Y${curY.toFixed(1)} Z3.5</div>
                <div>Speed: ${(speed * 60).toFixed(1)} u/s</div>
                <div>Miles: ${miles.toFixed(2)}</div>
                <div style="margin-top: 4px;">Phase: ${currentPhase}</div>
                <div>Difficulty: ${(difficultyScalar * 100).toFixed(0)}%</div>
                <div style="margin-top: 4px;">Active Objects: ${debugMetrics.performance.activeObjects}</div>
                <div>Collision Checks: ${debugMetrics.performance.collisionChecks}/frame</div>
            `;
            // Only log once per second to avoid spam
            if (debugMetrics.frameCount % 60 === 0) {
                console.log('Debug overlay updated. Display:', debugOverlay.style.display, 'DEBUG_ENABLED:', DEBUG_ENABLED);
            }
        }

        renderer.render(scene, camera);
    }

    // Render initial frozen frame for start screen background
    renderer.render(scene, camera);
