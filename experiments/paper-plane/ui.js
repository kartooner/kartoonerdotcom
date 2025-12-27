// UI Module - All DOM and UI-related code
// Handles menus, overlays, HUD updates, and button interactions

let gameStarted = false;
let isPaused = false;
let wasPlayingBeforeInstructions = false;

// Track previous orientation for auto-pause
let previousOrientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';

// Track last dimensions for resize optimization
let lastWidth = window.innerWidth;
let lastHeight = window.innerHeight;

// Last updated values for change detection (optimization)
let lastScore = null;
let lastHighScore = null;
let lastLevel = null;
let lastHealth = null;
let lastShieldState = null;
let lastShieldHits = null;
let lastDistMiles = null;

/**
 * Initialize UI - Set up all DOM elements and event listeners
 * @param {Object} callbacks - Callbacks from game.js
 * @returns {Object} - UI control functions
 */
export function initUI(callbacks) {
    const {
        onPlayClick,
        onPauseClick,
        onHowToPlayClick,
        onCloseInstructions,
        onCheckpointSkip,
        onAbilityPurchase,
        onResize,
        getAnimationRunning
    } = callbacks;

    // DOM element references
    const container = document.getElementById('footer-canvas');
    const scoreUI = document.getElementById('score-text');
    const highScoreUI = document.getElementById('high-score');
    const levelUI = document.getElementById('level-text');
    const healthBarUI = document.getElementById('health-bar');
    const shieldBarUI = document.getElementById('shield-bar');
    const scoreDisplayUI = document.getElementById('score-display');
    const scoreBonusUI = document.getElementById('score-bonus');
    const centerMessageUI = document.getElementById('center-message');

    // Overlay elements
    const playOverlay = document.getElementById('play-overlay');
    const pauseButton = document.getElementById('pause-button');
    const playButton = document.getElementById('play-button');
    const howToPlayButton = document.getElementById('how-to-play-button');
    const howToPlayBottomButton = document.getElementById('how-to-play-bottom');
    const instructionsOverlay = document.getElementById('instructions-overlay');
    const closeInstructionsX = document.getElementById('close-instructions-x');
    const checkpointOverlay = document.getElementById('checkpoint-overlay');

    // Play button functionality
    playButton.addEventListener('click', (e) => {
        e.stopPropagation();
        gameStarted = true;
        playOverlay.classList.add('hidden');
        pauseButton.style.display = 'block';
        howToPlayBottomButton.style.display = 'inline-block';
        onPlayClick();
    });

    // How to play button (from start screen)
    howToPlayButton.addEventListener('click', (e) => {
        e.stopPropagation();
        playOverlay.classList.add('hidden');
        instructionsOverlay.classList.add('active');
    });

    // Bottom "How to Play" button (during gameplay)
    howToPlayBottomButton.addEventListener('click', () => {
        wasPlayingBeforeInstructions = gameStarted && !isPaused;
        if (wasPlayingBeforeInstructions) {
            isPaused = true;
            pauseButton.innerText = 'RESUME';
            onPauseClick(true);
        }
        instructionsOverlay.classList.add('active');
    });

    // Close instructions handler
    function closeInstructionsHandler() {
        instructionsOverlay.classList.remove('active');
        if (!gameStarted) {
            playOverlay.classList.remove('hidden');
        } else if (wasPlayingBeforeInstructions) {
            isPaused = false;
            pauseButton.innerText = 'PAUSE';
            wasPlayingBeforeInstructions = false;
            onCloseInstructions();
        }
    }
    closeInstructionsX.addEventListener('click', closeInstructionsHandler);

    // Pause button functionality
    pauseButton.addEventListener('click', () => {
        isPaused = !isPaused;
        pauseButton.innerText = isPaused ? 'RESUME' : 'PAUSE';
        onPauseClick(isPaused);
    });

    // Skip checkpoint button
    document.getElementById('skip-checkpoint').addEventListener('click', () => {
        closeCheckpointUI(onCheckpointSkip);
    });

    // Fullscreen functionality (desktop only)
    const fullscreenHint = document.getElementById('fullscreen-hint');
    const fullscreenButtonGame = document.getElementById('fullscreen-button-game');
    const gameContainer = document.getElementById('game-container');
    let isFullscreen = false;

    // Check if Fullscreen API is supported
    const fullscreenSupported = document.fullscreenEnabled ||
                                document.webkitFullscreenEnabled ||
                                document.mozFullScreenEnabled ||
                                document.msFullscreenEnabled;

    // Show fullscreen hint and button on desktop if supported
    if (fullscreenSupported && window.innerWidth >= 768) {
        fullscreenHint.style.display = 'block';
        fullscreenButtonGame.style.display = 'block';
    }

    function toggleFullscreen() {
        const elem = gameContainer;

        if (!isFullscreen) {
            // Enter fullscreen
            if (elem.requestFullscreen) {
                elem.requestFullscreen();
            } else if (elem.webkitRequestFullscreen) {
                elem.webkitRequestFullscreen();
            } else if (elem.mozRequestFullScreen) {
                elem.mozRequestFullScreen();
            } else if (elem.msRequestFullscreen) {
                elem.msRequestFullscreen();
            }
            isFullscreen = true;
            fullscreenButtonGame.innerText = 'EXIT FULL SCREEN';
            showFeedbackMessage('FULL SCREEN ON');
        } else {
            // Exit fullscreen
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
            isFullscreen = false;
            fullscreenButtonGame.innerText = 'FULL SCREEN';
            showFeedbackMessage('FULL SCREEN OFF');
        }

        // Trigger resize logic after toggle
        setTimeout(() => {
            onResize(window.innerHeight > window.innerWidth, window.innerWidth < 768);
        }, 100);
    }

    // Listen for fullscreen change events (to sync state if user exits with ESC)
    document.addEventListener('fullscreenchange', () => {
        isFullscreen = !!document.fullscreenElement;
        fullscreenButtonGame.innerText = isFullscreen ? 'EXIT FULL SCREEN' : 'FULL SCREEN';
    });
    document.addEventListener('webkitfullscreenchange', () => {
        isFullscreen = !!document.webkitFullscreenElement;
        fullscreenButtonGame.innerText = isFullscreen ? 'EXIT FULL SCREEN' : 'FULL SCREEN';
    });
    document.addEventListener('mozfullscreenchange', () => {
        isFullscreen = !!document.mozFullScreenElement;
        fullscreenButtonGame.innerText = isFullscreen ? 'EXIT FULL SCREEN' : 'FULL SCREEN';
    });
    document.addEventListener('msfullscreenchange', () => {
        isFullscreen = !!document.msFullscreenElement;
        fullscreenButtonGame.innerText = isFullscreen ? 'EXIT FULL SCREEN' : 'FULL SCREEN';
    });

    // Fullscreen button event listener
    if (fullscreenSupported) {
        fullscreenButtonGame.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFullscreen();
        });
    }

    // Show brief feedback message
    function showFeedbackMessage(message) {
        centerMessageUI.innerText = message;
        centerMessageUI.style.opacity = '1';
        setTimeout(() => {
            centerMessageUI.style.opacity = '0';
        }, 1000);
    }

    // Resize handler with dimension change detection
    window.addEventListener('resize', () => {
        const currentWidth = window.innerWidth;
        const currentHeight = window.innerHeight;

        // Skip if dimensions haven't actually changed
        if (currentWidth === lastWidth && currentHeight === lastHeight) {
            return;
        }

        lastWidth = currentWidth;
        lastHeight = currentHeight;

        const isPortraitNow = currentHeight > currentWidth;
        const isMobileNow = currentWidth < 768;
        const currentOrientation = isPortraitNow ? 'portrait' : 'landscape';

        // Auto-pause on orientation change (mobile only)
        if (isMobileNow && currentOrientation !== previousOrientation && gameStarted && !isPaused) {
            isPaused = true;
            pauseButton.innerText = 'RESUME';
            onPauseClick(true);
        }
        previousOrientation = currentOrientation;

        onResize(isPortraitNow, isMobileNow);
    });

    // Return UI control functions
    return {
        updateHealthBar: (currentHealth, maxHealth) => {
            // Only update if changed
            if (lastHealth === currentHealth) return;
            lastHealth = currentHealth;

            const hearts = [];
            for (let i = 0; i < maxHealth; i++) {
                if (i < currentHealth) {
                    hearts.push('♥');
                } else {
                    hearts.push('♡');
                }
            }
            healthBarUI.innerText = hearts.join(' ');
        },

        updateShieldBar: (shieldActive, shieldHits) => {
            // Only update if changed
            if (lastShieldState === shieldActive && lastShieldHits === shieldHits) return;
            lastShieldState = shieldActive;
            lastShieldHits = shieldHits;

            if (!shieldActive) {
                shieldBarUI.style.opacity = '0';
            } else {
                shieldBarUI.style.opacity = '0.9';
                if (shieldHits === 0) {
                    shieldBarUI.innerText = '[ | | ]';
                } else if (shieldHits === 1) {
                    shieldBarUI.innerText = '[ | ]';
                } else {
                    shieldBarUI.innerText = '[ ]';
                }
            }
        },

        showCheckpointUI: (state, abilities) => {
            showCheckpointUI(state, abilities, onAbilityPurchase);
        },

        closeCheckpointUI: () => {
            closeCheckpointUI();
        },

        toggleFullscreen: () => {
            if (fullscreenSupported) {
                toggleFullscreen();
            }
        },

        getGameState: () => ({
            gameStarted,
            isPaused
        }),

        elements: {
            scoreUI,
            highScoreUI,
            levelUI,
            scoreDisplayUI,
            scoreBonusUI,
            centerMessageUI,
            pauseButton
        }
    };
}

/**
 * Update UI elements based on game state (throttled)
 * Call this on value changes or at ~10fps
 * @param {Object} state - Current game state
 */
export function updateUI(state) {
    const {
        score,
        highScore,
        currentLevel,
        distMiles,
        crashMessage,
        crashMessageTimer,
        levelUpMessage,
        levelUpMessageTimer,
        bonusFadeTimer,
        elements
    } = state;

    // Update score (only if changed)
    if (lastScore !== score) {
        lastScore = score;
        elements.scoreDisplayUI.innerText = `SCORE: ${score}`;
    }

    // Update high score (only if changed)
    if (lastHighScore !== highScore) {
        lastHighScore = highScore;
        elements.highScoreUI.innerText = `BEST: ${highScore}mi`;
    }

    // Update level (only if changed)
    if (lastLevel !== currentLevel) {
        lastLevel = currentLevel;
        elements.levelUI.innerText = `LEVEL ${currentLevel}`;
    }

    // Update miles (only if changed)
    if (lastDistMiles !== distMiles) {
        lastDistMiles = distMiles;
        elements.scoreUI.innerText = `${distMiles}mi`;
    }

    // Update center message
    if (crashMessageTimer > 0) {
        elements.centerMessageUI.innerText = `💥 ${crashMessage} 💥`;
        elements.centerMessageUI.style.opacity = '1';
    } else if (levelUpMessageTimer > 0) {
        elements.centerMessageUI.innerText = `⚡ ${levelUpMessage} ⚡`;
        elements.centerMessageUI.style.opacity = '1';
    } else {
        elements.centerMessageUI.style.opacity = '0';
    }

    // Update bonus fade
    if (bonusFadeTimer === 0) {
        elements.scoreBonusUI.style.opacity = '0';
    }
}

/**
 * Show checkpoint UI overlay
 * @param {Object} state - Game state at checkpoint
 * @param {Object} abilities - Available abilities
 * @param {Function} onPurchase - Callback when ability is purchased
 */
function showCheckpointUI(state, abilities, onPurchase) {
    const {
        score,
        isFirstCheckpoint
    } = state;

    const checkpointOverlay = document.getElementById('checkpoint-overlay');
    const checkpointTitle = document.getElementById('checkpoint-title');
    const checkpointSubtitle = document.getElementById('checkpoint-subtitle');
    const checkpointWarning = document.getElementById('checkpoint-warning');
    const abilitiesContainer = document.getElementById('abilities-container');

    checkpointTitle.innerText = '= Checkpoint reached =';
    checkpointSubtitle.innerHTML = `Balance: ${score}<br><br>Please choose an upgrade:`;
    checkpointWarning.innerText = '(3-4 hits will remove your upgrade)';

    abilitiesContainer.innerHTML = '';

    // First checkpoint: Always show Plane Color (free)
    // Subsequent checkpoints: Show 2 random abilities
    let selectedAbilities;
    if (isFirstCheckpoint) {
        selectedAbilities = ['randomColor'];
    } else {
        const abilityKeys = Object.keys(abilities);
        const shuffled = abilityKeys.sort(() => 0.5 - Math.random());
        selectedAbilities = shuffled.slice(0, 2);
    }

    // Check if player can afford at least one ability
    const canAffordAny = isFirstCheckpoint || selectedAbilities.some(key => {
        const isCosmetic = key === 'randomColor' || key === 'changeShape';
        return (isCosmetic || !abilities[key].owned) && score >= abilities[key].cost;
    });

    if (!canAffordAny && selectedAbilities.every(key => {
        const isCosmetic = key === 'randomColor' || key === 'changeShape';
        return abilities[key].owned && !isCosmetic;
    })) {
        // All non-cosmetic abilities owned and can't afford cosmetics
        return;
    }

    // Create ability cards
    selectedAbilities.forEach(key => {
        const ability = abilities[key];
        const card = document.createElement('div');
        card.className = 'ability-card';

        const isCosmetic = key === 'randomColor' || key === 'changeShape';
        const canAfford = isFirstCheckpoint ? !ability.owned : (score >= ability.cost && (isCosmetic || !ability.owned));

        if (!canAfford || (ability.owned && !isCosmetic)) {
            card.classList.add('disabled');
        }

        const statusIcon = (ability.owned && !isCosmetic) ? '■' : (canAfford ? '□' : '×');
        const costText = (ability.owned && !isCosmetic) ? 'ACQUIRED' : (isFirstCheckpoint && !ability.owned ? 'FREE' : `${ability.cost} PTS`);

        card.innerHTML = `
            <div class="ability-inner">
                <div class="ability-name">${statusIcon} ${ability.name}</div>
                <div class="ability-description">${ability.description}</div>
                <div class="ability-cost">${costText}</div>
            </div>
        `;

        if (canAfford) {
            card.addEventListener('click', () => onPurchase(key));
        }

        abilitiesContainer.appendChild(card);
    });

    checkpointOverlay.classList.add('active');
}

/**
 * Close checkpoint UI
 * @param {Function} onClose - Optional callback when closed
 */
function closeCheckpointUI(onClose) {
    const checkpointOverlay = document.getElementById('checkpoint-overlay');
    checkpointOverlay.classList.remove('active');
    if (onClose) {
        onClose();
    }
}
