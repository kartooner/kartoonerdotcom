/**
 * WonderzNet - Castle Adventure Game
 * A text adventure hidden in a 1990s web directory
 */

(function () {
    // DOM Elements
    const form = document.getElementById('searchForm');
    const input = document.getElementById('q');
    const titleEl = document.getElementById('resultsTitle');
    const bodyEl = document.getElementById('resultsBody');
    const resultsSection = document.querySelector('.results');
    const searchTitle = document.getElementById('searchTitle');
    const searchLabel = document.getElementById('searchLabel');
    const searchButton = document.getElementById('searchButton');
    const searchHelp = document.getElementById('searchHelp');
    const srAnnouncements = document.getElementById('srAnnouncements');
    const voiceControls = document.getElementById('voiceControls');
    const micBtn = document.getElementById('micBtn');
    const speechToggle = document.getElementById('speechToggle');

    // Speech State
    const speechState = {
        listening: false,
        narrating: false
    };

    /**
     * Announce text to screen readers using ARIA live region
     */
    function announce(message) {
        if (srAnnouncements) {
            srAnnouncements.textContent = '';
            // Timeout ensures SR detects the change
            setTimeout(() => {
                srAnnouncements.textContent = message;
            }, 50);
        }

        // Text-to-Speech Narration
        if (speechState.narrating && window.speechSynthesis) {
            window.speechSynthesis.cancel(); // Stop current speech
            const utterance = new SpeechSynthesisUtterance(message.replace(/<[^>]*>/g, '')); // Strip HTML
            utterance.rate = 0.9;
            utterance.pitch = 0.8; // Eerie 90s vibes
            window.speechSynthesis.speak(utterance);
        }
    }

    /**
     * Typewriter effect for terminal text
     */
    let typingTimer = null;
    let bootTimer = null;
    function typeWriter(el, html, speed = 10, onComplete = null) {
        // Clear any existing typing
        if (typingTimer) clearTimeout(typingTimer);

        // Respect reduced motion preference
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) {
            el.innerHTML = html;
            if (onComplete) onComplete();
            return;
        }

        el.innerHTML = '';
        let i = 0;

        function type() {
            if (i < html.length) {
                // Check for HTML tags
                if (html[i] === '<') {
                    const tagEnd = html.indexOf('>', i);
                    if (tagEnd !== -1) {
                        el.innerHTML += html.substring(i, tagEnd + 1);
                        i = tagEnd + 1;
                    } else {
                        el.innerHTML += html[i];
                        i++;
                    }
                } else {
                    el.innerHTML += html[i];
                    i++;
                }
                typingTimer = setTimeout(type, speed);
            } else {
                if (onComplete) onComplete();
            }
        }
        type();
    }

    // Text Adventure Game State
    const game = {
        active: false,
        location: 'field',
        inventory: []
    };

    // Room objects and their current states
    const world = {
        deepForest: {
            hasLantern: true,
            isDark: true
        }
    };

    // Room descriptions
    const rooms = {
        field: {
            description: () => `You are standing in an open, grassy field. The wind is blowing against you, icy cold. Your skin is starting to feel numbness creeping in.<br><br>Directly to the north, you see the silhouette of a stone structure at the edge of the woods.`,
            exits: { north: 'clearing' }
        },
        clearing: {
            description: () => {
                let desc = "You are in a small clearing at the edge of the forest. An old, busted stone well sits in the center of the patch.";
                if (world.deepForest.hasLantern) {
                    desc += " Looking closely into the well, you see an old <strong>lantern</strong> resting on a ledge.";
                }
                if (world.deepForest.isDark) {
                    desc += "<br><br>The forest to the east is incredibly dense and pitch black.";
                } else {
                    desc += "<br><br>Your lantern illuminates a path leading east into the deep woods.";
                }
                desc += "<br><br>The open field lies to the south.";
                return desc;
            },
            exits: {
                south: 'field',
                east: 'deep_forest'
            }
        },
        deep_forest: {
            description: () => `You push into the deep woods, your lantern cutting through the gloom. Ancient trees tower above you, their gnarled branches reaching out like fingers. You've truly entered the forest now.<br><br>The path goes back west to the clearing.`,
            exits: { west: 'clearing' }
        }
    };

    /**
     * Attach click handlers to any .game-action links currently in the body
     */
    function attachActionHandlers() {
        bodyEl.querySelectorAll('.game-action').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const dir = link.getAttribute('data-direction');
                const action = link.getAttribute('data-action');
                if (action === 'quit') {
                    quitGame();
                } else if (action) {
                    handleCommand(action);
                } else if (dir) {
                    handleCommand(dir);
                }
            });
        });
    }

    /**
     * Display the current room with available exits
     */
    function showRoom(commandEcho = '') {
        const room = rooms[game.location];
        const description = typeof room.description === 'function' ? room.description() : room.description;

        // Keep header clean during game
        titleEl.textContent = '';

        // Build list of available directions
        const dirLabels = {
            north: 'Go north',
            south: 'Go south',
            east: 'Go east',
            west: 'Go west'
        };

        const echoHtml = commandEcho ? `<div style="border-bottom: 1px solid #1a1a1a; margin-bottom: 12px; padding-bottom: 4px; color: #00aa00; font-weight: bold;">> ${commandEcho}</div>` : '';

        let optionsHtml = '<div style="margin-top:20px;"><strong>What next?</strong><ol style="margin:8px 0 0; padding-left:20px;">';
        let actionsList = ['Look at your surroundings'];

        // Build options
        optionsHtml += `<li><a href="#" class="game-action" data-action="look">Look at your surroundings</a></li>`;
        if (game.location === 'clearing' && world.deepForest.hasLantern) {
            optionsHtml += `<li><a href="#" class="game-action" data-action="take lantern">Take lantern</a></li>`;
            actionsList.push('Take lantern');
        }
        if (game.location === 'clearing' && world.deepForest.isDark && game.inventory.includes('a lantern')) {
            optionsHtml += `<li><a href="#" class="game-action" data-action="use lantern">Use lantern</a></li>`;
            actionsList.push('Use lantern');
        }
        for (const dir of ['north', 'east', 'south', 'west']) {
            if (room.exits[dir]) {
                optionsHtml += `<li><a href="#" class="game-action" data-direction="${dir}">${dirLabels[dir]}</a></li>`;
                actionsList.push(dirLabels[dir]);
            }
        }
        optionsHtml += '<li><a href="#" class="game-action" data-action="quit">Quit</a></li>';
        optionsHtml += '</ol></div>';
        actionsList.push('Quit');

        // Create elements for instant vs typed content
        bodyEl.innerHTML = '';
        if (echoHtml) {
            const echoContainer = document.createElement('div');
            echoContainer.innerHTML = echoHtml;
            bodyEl.appendChild(echoContainer);
        }

        const narrativeContainer = document.createElement('div');
        bodyEl.appendChild(narrativeContainer);

        // Type only the narrative description
        typeWriter(narrativeContainer, description, 10, () => {
            const optionsContainer = document.createElement('div');
            optionsContainer.innerHTML = optionsHtml;
            bodyEl.appendChild(optionsContainer);
            attachActionHandlers();
        });

        // Announce
        const cleanDesc = description.replace(/<[^>]*>/g, ' ');
        announce(`You are at: ${cleanDesc}. Available actions: ${actionsList.join(', ')}.`);
    }

    function showBootSequence() {
        const logo = `<pre style="margin:0; line-height:1.0;">
   _____ _____ _____ _____ __    _____ 
  |     |  _  |   __|_   _|  |  |   __|
  |   --|     |__   | | | |  |__|   __|
  |_____|__|__|_____| |_| |_____|_____|
                                        
  _____ ____  _   _ _____ _   _ _____ _   _ _____ _____ 
 |  _  |    \\| | | |   __| \\ | |_   _| | | | __  |   __|
 |     |  |  | | | |   __| . \\|  | | | | | |    -|   __|
 |__|__|____/ \\_/  |_____|_|\\_|  |_| |_____|__|__|_____|

</pre>`;
        const bootText = `<div style="margin-top:12px;">CASTLE ADVENTURE SYSTEM v1.0<br>
Copyright (c) 1997 WonderzNet Interactive<br><br>
Loading world data...<br>
Ready.<br><br>
<span style="color:#00ff00; font-weight:bold;" class="terminal-cursor">Type a command or click to begin</span></div>`;

        const startFromBoot = () => {
            showRoom();
            bodyEl.removeEventListener('click', startFromBoot);
        };

        // Inject logo instantly to prevent ASCII drift, then type the boot lines
        bodyEl.innerHTML = logo;
        const statusEl = document.createElement('div');
        bodyEl.appendChild(statusEl);

        typeWriter(statusEl, bootText, 10, () => {
            bodyEl.addEventListener('click', startFromBoot);
        });
        announce("Castle Adventure System Online. Type a command or click to begin.");
    }

    /**
     * Quit the game and restore normal search interface
     */
    function quitGame() {
        game.active = false;
        game.location = 'field';
        document.body.classList.remove('game-active');
        resultsSection.classList.remove('visible');
        voiceControls.style.display = 'none';

        // Restore original labels
        searchTitle.textContent = 'Search';
        searchLabel.textContent = 'Search the index';
        searchButton.textContent = 'Search';
        searchHelp.textContent = 'Type a keyword and press Enter.';

        // Reset game state
        world.deepForest.hasLantern = true;
        world.deepForest.isDark = true;
        game.inventory = [];

        if (typingTimer) {
            clearTimeout(typingTimer);
            typingTimer = null;
        }

        if (bootTimer) {
            clearTimeout(bootTimer);
            bootTimer = null;
        }

        titleEl.style.display = ''; // Restore the "Results" header
        titleEl.textContent = 'Results';
        bodyEl.innerHTML = '';
        announce("Game exited. Returned to search mode.");
    }

    /**
     * Handle user commands (both search and game)
     */
    function handleCommand(cmd) {
        const command = cmd.toLowerCase().trim();

        // Start the game with "start"
        if (!game.active && command === 'start') {
            game.active = true;
            game.location = 'field';
            resultsSection.classList.add('visible');
            document.body.classList.add('game-active');
            voiceControls.style.display = 'flex';

            // Transform labels to game mode
            searchTitle.textContent = 'The Castle Adventure';
            searchLabel.textContent = 'Command prompt';
            searchButton.textContent = 'Send';
            searchHelp.textContent = 'Type a command and press Enter (or click a link below).';

            titleEl.style.display = 'none'; // Completely hide the "Results" header bar
            announce("The Castle Adventure has started. Mode changed to Terminal.");
            showBootSequence();
            return;
        }

        // If game not active, show normal search behavior
        if (!game.active) {
            if (!command) {
                resultsSection.classList.remove('visible');
                titleEl.textContent = 'Results';
                bodyEl.textContent = '';
            } else {
                resultsSection.classList.add('visible');
                titleEl.textContent = `Results for "${cmd}"`;
                bodyEl.innerHTML = `No results found for <strong>${escapeHtml(cmd)}</strong>.`;
            }
            return;
        }

        // Game is active - handle adventure commands
        const room = rooms[game.location];

        if (command === 'look' || command === 'l') {
            showRoom('look');
            return;
        }

        // Talk/Say commands
        if (command.startsWith('say ') || command.startsWith('talk ') || command.startsWith('"')) {
            let speech = command.replace('say ', '').replace('talk ', '').replace('"', '').trim();
            if (!speech) {
                const msg = "You open your mouth to speak, but no words come out.";
                showRoom(`say<br><br>${msg}`);
                announce(msg);
                return;
            }
            const msg = `You say: "${speech}". Your voice carries across the empty landscape, but there is no one here to answer.`;
            showRoom(`say ${speech}<br><br>${msg}`);
            announce(msg);
            return;
        }

        // Use commands
        if (command.startsWith('use ')) {
            const item = command.replace('use ', '').trim();
            if (item === 'lantern') {
                if (game.inventory.includes('a lantern')) {
                    if (game.location === 'clearing') {
                        if (world.deepForest.isDark) {
                            world.deepForest.isDark = false;
                            const msg = "You strike a match and light the lantern. Its warm glow pierces the darkness, revealing the way into the forest to the east!";
                            showRoom(`use lantern<br><br>${msg}`);
                            announce(msg);
                        } else {
                            const msg = "The lantern is already lit, casting a steady glow around the well.";
                            showRoom(`use lantern<br><br>${msg}`);
                            announce(msg);
                        }
                    } else {
                        const msg = "You light the lantern, but it doesn't reveal anything new here.";
                        showRoom(`use lantern<br><br>${msg}`);
                        announce(msg);
                    }
                } else {
                    const msg = "You aren't carrying a lantern.";
                    showRoom(`use lantern<br><br>${msg}`);
                    announce(msg);
                }
            } else {
                const msg = `You don't know how to use the ${item}.`;
                showRoom(`use ${item}<br><br>${msg}`);
                announce(msg);
            }
            return;
        }

        // Take commands
        if (command.startsWith('take ') || command.startsWith('get ')) {
            const item = command.replace('take ', '').replace('get ', '').trim();
            if (item === 'lantern') {
                if (game.location === 'clearing') {
                    if (world.deepForest.hasLantern) {
                        world.deepForest.hasLantern = false;
                        game.inventory.push('a lantern');
                        const msg = "You reach into the busted well and retrieve the old lantern. It's dusty but seems functional. You add it to your inventory.";
                        showRoom(`take lantern<br><br>${msg}`);
                        announce(msg);
                    } else {
                        const msg = "The well is empty save for some moss and shattered stones.";
                        showRoom(`take lantern<br><br>${msg}`);
                        announce(msg);
                    }
                } else {
                    const msg = "You don't see a lantern here.";
                    showRoom(`take lantern<br><br>${msg}`);
                    announce(msg);
                }
            } else {
                const msg = `You can't take the ${item}.`;
                showRoom(`take ${item}<br><br>${msg}`);
                announce(msg);
            }
            return;
        }

        // Inventory
        if (command === 'inventory' || command === 'i' || command === 'inv') {
            const items = game.inventory.length > 0 ? game.inventory.join(', ') : 'nothing';
            const msg = `You are carrying: ${items}.`;
            showRoom(`inventory<br><br>${msg}`);
            announce(msg);
            return;
        }

        // Movement
        const directions = {
            n: 'north', north: 'north',
            s: 'south', south: 'south',
            e: 'east', east: 'east',
            w: 'west', west: 'west'
        };

        const dir = directions[command];
        if (dir && room.exits[dir]) {
            // Block eastern movement from clearing if it's still dark
            if (game.location === 'clearing' && dir === 'east' && world.deepForest.isDark) {
                const msg = "You try to head east, but the forest quickly becomes a solid wall of absolute darkness. Without a powerful light source, you'd be lost in a matter of seconds.";
                showRoom(`${dir}<br><br>${msg}`);
                announce("It's too dark to continue east.");
                return;
            }

            game.location = room.exits[dir];
            showRoom(dir);
            return;
        }

        if (dir && !room.exits[dir]) {
            const msg = "You can't go that way.";
            showRoom(`${dir}<br><br>${msg}`);
            return;
        }

        // Quit command
        if (command === 'quit' || command === 'q' || command === 'exit') {
            quitGame();
            return;
        }

        // Help command
        if (command === 'help' || command === '?') {
            titleEl.textContent = '';
            const echo = `<div style="border-bottom: 1px solid #1a1a1a; margin-bottom: 12px; padding-bottom: 4px; color: #00aa00; font-weight: bold;">> help</div>`;
            bodyEl.innerHTML = echo + `<strong>Commands:</strong><br>look - examine your surroundings<br>north/south/east/west (or n/s/e/w) - move in a direction<br>take [item] - pick up an object<br>use [item] - use an item in your inventory<br>inventory (or i) - see what you are carrying<br>quit - exit the game<br>help - show this message`;
            return;
        }

        // --- Easter Eggs ---
        const easterEggs = {
            'xyzzy': "A hollow voice says 'Plugh'.",
            'jump': "You leap into the air. For a fleeting second, you feel lighter than the cold wind. You land with a soft thud.",
            'dance': "You dance like no one is watching. Which is true, because no one is watching.",
            'sing': "You belt out a tune from 1997. Your voice echoes through the empty landscape.",
            'scream': "You scream at the top of your lungs! The sound is swallowed by the trees, but you feel better.",
            'hello': "Hello yourself, adventurer.",
            'hi': "Greetings.",
            'who am i': "You are an explorer in a world of pixels and memories.",
            'sleep': "Now is not the time for rest. The castle awaits.",
            'version': "Castle Adventure System v1.0.1 (Experimental Voice Build)"
        };

        if (easterEggs[command]) {
            const msg = easterEggs[command];
            showRoom(`${command}<br><br>${msg}`);
            announce(msg);
            return;
        }

        // Unknown command
        titleEl.textContent = '';
        const understoodMsg = `I don't understand "${cmd}". Type "help" for commands.`;
        bodyEl.innerHTML = `<div style="border-bottom: 1px solid #1a1a1a; margin-bottom: 12px; padding-bottom: 4px; color: #00aa00; font-weight: bold;">> ${cmd}</div>` + understoodMsg;
        announce(understoodMsg);
    }

    /**
     * Escape HTML to prevent XSS
     */
    function escapeHtml(str) {
        return str.replace(/[&<>"']/g, (c) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[c]));
    }

    // Form submission handler
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const raw = (input.value || '').trim();
        handleCommand(raw);
        input.value = '';
        input.focus();
    });

    // ESC key to quit game
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && game.active) {
            e.preventDefault();
            quitGame();
            input.focus();
        }
    });

    /**
     * SPEECH RECOGNITION (Input)
     */
    if (micBtn) {
        micBtn.addEventListener('click', () => {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) {
                alert("Voice recognition not supported in your browser.");
                return;
            }

            if (speechState.listening) return;

            const recognition = new SpeechRecognition();
            recognition.lang = 'en-US';
            recognition.interimResults = false;

            recognition.onstart = () => {
                speechState.listening = true;
                micBtn.textContent = '🛑 Listening...';
                micBtn.classList.add('active');
            };

            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                input.value = transcript;
                handleCommand(transcript);
            };

            recognition.onend = () => {
                speechState.listening = false;
                micBtn.textContent = '🎤 Voice Input';
                micBtn.classList.remove('active');
            };

            recognition.start();
        });
    }

    /**
     * SPEECH SYNTHESIS (Output Toggle)
     */
    if (speechToggle) {
        speechToggle.addEventListener('click', () => {
            speechState.narrating = !speechState.narrating;
            speechToggle.textContent = speechState.narrating ? '🔊 Speech: On' : '🔈 Speech: Off';
            speechToggle.classList.toggle('active');

            if (!speechState.narrating && window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
        });
    }
})();
