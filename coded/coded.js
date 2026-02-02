        // Get DOM elements
        const htmlEditor = document.getElementById('htmlEditor');
        const cssEditor = document.getElementById('cssEditor');
        const jsEditor = document.getElementById('jsEditor');
        const htmlHighlight = document.getElementById('htmlHighlight');
        const cssHighlight = document.getElementById('cssHighlight');
        const jsHighlight = document.getElementById('jsHighlight');
        const htmlLineNumbers = document.getElementById('htmlLineNumbers');
        const cssLineNumbers = document.getElementById('cssLineNumbers');
        const jsLineNumbers = document.getElementById('jsLineNumbers');
        const preview = document.getElementById('preview');
        const runBtn = document.getElementById('runBtn');
        const clearBtn = document.getElementById('clearBtn');
        const exportBtn = document.getElementById('exportBtn');
        const shareBtn = document.getElementById('shareBtn');
        const autoRunToggle = document.getElementById('autoRunToggle');
        const moreOptionsBtn = document.getElementById('moreOptionsBtn');
        const moreOptionsMenu = document.getElementById('moreOptionsMenu');
        const saveSnippetMenuBtn = document.getElementById('saveSnippetMenuBtn');
        const snippetsMenuBtn = document.getElementById('snippetsMenuBtn');

        // Panel-specific settings
        const htmlSettingsBtn = document.getElementById('htmlSettingsBtn');
        const htmlSettingsMenu = document.getElementById('htmlSettingsMenu');
        const htmlLibrariesBtn = document.getElementById('htmlLibrariesBtn');
        const htmlWrapToggle = document.getElementById('htmlWrapToggle');
        const htmlWrapCheckbox = document.getElementById('htmlWrapCheckbox');

        const cssSettingsBtn = document.getElementById('cssSettingsBtn');
        const cssSettingsMenu = document.getElementById('cssSettingsMenu');
        const cssLibrariesBtn = document.getElementById('cssLibrariesBtn');
        const cssWrapToggle = document.getElementById('cssWrapToggle');
        const cssWrapCheckbox = document.getElementById('cssWrapCheckbox');
        const cssResetBtn = document.getElementById('cssResetBtn');
        const cssResetStatus = document.getElementById('cssResetStatus');

        const jsSettingsBtn = document.getElementById('jsSettingsBtn');
        const jsSettingsMenu = document.getElementById('jsSettingsMenu');
        const jsLibrariesBtn = document.getElementById('jsLibrariesBtn');
        const jsWrapToggle = document.getElementById('jsWrapToggle');
        const jsWrapCheckbox = document.getElementById('jsWrapCheckbox');
        const snippetsMenu = document.getElementById('snippetsMenu');
        const librariesMenu = document.getElementById('librariesMenu');
        const snippetsOverlay = document.getElementById('snippetsOverlay');
        const closeSnippetsBtn = document.getElementById('closeSnippetsBtn');
        const closeLibrariesBtn = document.getElementById('closeLibrariesBtn');
        const snippetsList = document.getElementById('snippetsList');
        const popularLibraries = document.getElementById('popularLibraries');
        const addedLibrariesList = document.getElementById('addedLibrariesList');
        const customCdnInput = document.getElementById('customCdnInput');
        const addCustomCdnBtn = document.getElementById('addCustomCdnBtn');
        const resizer = document.getElementById('resizer');
        const editorsSection = document.querySelector('.editors');
        const previewSection = document.querySelector('.preview-section');
        const container = document.querySelector('.container');
        const shareModeBanner = document.getElementById('shareModeBanner');
        const startFreshBtn = document.getElementById('startFreshBtn');
        const toggleConsoleBtn = document.getElementById('toggleConsoleBtn');
        const consolePanel = document.getElementById('consolePanel');
        const consoleOutput = document.getElementById('consoleOutput');
        const clearConsoleBtn = document.getElementById('clearConsoleBtn');
        const settingsBtn = document.getElementById('settingsBtn');
        const settingsMenu = document.getElementById('settingsMenu');
        const closeSettingsBtn = document.getElementById('closeSettingsBtn');
        const fontSizeSlider = document.getElementById('fontSizeSlider');
        const fontSizeValue = document.getElementById('fontSizeValue');
        const layoutHorizontalBtn = document.getElementById('layoutHorizontalBtn');
        const layoutVerticalBtn = document.getElementById('layoutVerticalBtn');
        const themeDarkBtn = document.getElementById('themeDarkBtn');
        const themeLightBtn = document.getElementById('themeLightBtn');
        const syntaxOnBtn = document.getElementById('syntaxOnBtn');
        const syntaxOffBtn = document.getElementById('syntaxOffBtn');
        const findReplacePanel = document.getElementById('findReplacePanel');
        const closeFindReplaceBtn = document.getElementById('closeFindReplaceBtn');
        const findInput = document.getElementById('findInput');
        const replaceInput = document.getElementById('replaceInput');
        const findPrevBtn = document.getElementById('findPrevBtn');
        const findNextBtn = document.getElementById('findNextBtn');
        const replaceBtn = document.getElementById('replaceBtn');
        const replaceAllBtn = document.getElementById('replaceAllBtn');
        const findResultsText = document.getElementById('findResultsText');

        let autoRunEnabled = localStorage.getItem('coded-autorun') !== 'false'; // Default to true
        let autoRunTimeout = null;
        let wordWrapEnabled = {
            html: localStorage.getItem('coded-wordwrap-html') !== null ? localStorage.getItem('coded-wordwrap-html') === 'true' : true,
            css: localStorage.getItem('coded-wordwrap-css') !== null ? localStorage.getItem('coded-wordwrap-css') === 'true' : true,
            js: localStorage.getItem('coded-wordwrap-js') !== null ? localStorage.getItem('coded-wordwrap-js') === 'true' : true
        };
        let cssResetType = localStorage.getItem('coded-css-reset') || 'none'; // 'none', 'normalize', 'reset'
        let isShareMode = false; // Track if we're in share mode

        // Focus trap utility for modals
        const activeFocusTraps = new Map();

        window.enableFocusTrap = function enableFocusTrap(modalElement, firstFocusElement = null) {
            // Get all focusable elements within the modal
            const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
            const focusableElements = modalElement.querySelectorAll(focusableSelector);

            if (focusableElements.length === 0) return null;

            const firstElement = firstFocusElement || focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            // Store the element that had focus before the modal opened
            const previouslyFocusedElement = document.activeElement;

            // Focus the first element
            setTimeout(() => firstElement.focus(), 50);

            // Create the trap handler
            function trapFocus(e) {
                if (e.key === 'Tab') {
                    if (e.shiftKey) {
                        // Shift + Tab: moving backwards
                        if (document.activeElement === firstElement) {
                            e.preventDefault();
                            lastElement.focus();
                        }
                    } else {
                        // Tab: moving forwards
                        if (document.activeElement === lastElement) {
                            e.preventDefault();
                            firstElement.focus();
                        }
                    }
                }
            }

            // Add event listener
            modalElement.addEventListener('keydown', trapFocus);

            // Store trap info for cleanup
            const trapInfo = {
                element: modalElement,
                handler: trapFocus,
                previouslyFocusedElement: previouslyFocusedElement
            };
            activeFocusTraps.set(modalElement, trapInfo);

            return trapInfo;
        };

        window.disableFocusTrap = function disableFocusTrap(modalElement) {
            const trapInfo = activeFocusTraps.get(modalElement);
            if (trapInfo) {
                // Remove event listener
                trapInfo.element.removeEventListener('keydown', trapInfo.handler);

                // Restore focus to previously focused element
                if (trapInfo.previouslyFocusedElement && trapInfo.previouslyFocusedElement.focus) {
                    setTimeout(() => trapInfo.previouslyFocusedElement.focus(), 50);
                }

                // Remove from active traps
                activeFocusTraps.delete(modalElement);
            }
        };

        // Screen reader announcement utility
        window.announceToScreenReader = function(message, priority = 'polite') {
            const announcement = document.createElement('div');
            announcement.setAttribute('role', 'status');
            announcement.setAttribute('aria-live', priority); // 'polite' or 'assertive'
            announcement.className = 'sr-only';
            announcement.textContent = message;
            document.body.appendChild(announcement);

            // Remove after announcement (give screen readers time to read it)
            setTimeout(() => {
                if (announcement.parentNode) {
                    announcement.parentNode.removeChild(announcement);
                }
            }, 1000);
        };

        // Debounced auto-run (waits 500ms after last keystroke)
        function debouncedAutoRun() {
            if (!autoRunEnabled) return;

            clearTimeout(autoRunTimeout);
            autoRunTimeout = setTimeout(() => {
                runCode();
            }, 500); // Wait 500ms after user stops typing - faster feedback
        }

        // Syntax highlighting with Prism
        function highlightEditor(editor, highlight, language) {
            // Check if syntax highlighting is disabled
            if (!syntaxHighlightingEnabled) {
                highlight.innerHTML = '';
                syncScroll(editor, highlight);
                return;
            }

            const code = editor.value;
            if (code) {
                const highlighted = Prism.highlight(code, Prism.languages[language], language);
                // Use a simple div wrapper instead of pre/code to avoid spacing issues
                highlight.innerHTML = `<div class="highlight-content">${highlighted}</div>`;
            } else {
                highlight.innerHTML = '';
            }
            syncScroll(editor, highlight);
        }

        // Performance: Debounced syntax highlighting
        let highlightTimeouts = { html: null, css: null, js: null };
        function debouncedHighlight(editor, highlight, language, editorType) {
            clearTimeout(highlightTimeouts[editorType]);
            highlightTimeouts[editorType] = setTimeout(() => {
                highlightEditor(editor, highlight, language);
            }, 150); // Highlight after 150ms of inactivity
        }

        // Sync scroll between editor and highlight
        function syncScroll(editor, highlight) {
            highlight.scrollTop = editor.scrollTop;
            highlight.scrollLeft = editor.scrollLeft;
        }

        // Enhanced sync with requestAnimationFrame for better cursor positioning
        function syncScrollRaf(editor, highlight) {
            requestAnimationFrame(() => {
                highlight.scrollTop = editor.scrollTop;
                highlight.scrollLeft = editor.scrollLeft;
            });
        }

        // Update line numbers
        function updateLineNumbers(editor, lineNumbersElement) {
            const lines = editor.value.split('\n').length;
            const numbers = [];
            for (let i = 1; i <= lines; i++) {
                numbers.push(i);
            }
            lineNumbersElement.textContent = numbers.join('\n');

            // Sync scroll
            lineNumbersElement.scrollTop = editor.scrollTop;
        }

        // Sync line numbers scroll with editor
        function syncLineNumbersScroll(editor, lineNumbersElement) {
            lineNumbersElement.scrollTop = editor.scrollTop;
        }

        // Snippets management
        function getSnippets() {
            const snippets = localStorage.getItem('coded-snippets');
            return snippets ? JSON.parse(snippets) : [];
        }

        function saveSnippets(snippets) {
            localStorage.setItem('coded-snippets', JSON.stringify(snippets));
        }

        function saveCurrentSnippet() {
            // Check if there's any code to save
            const hasCode = htmlEditor.value.trim() || cssEditor.value.trim() || jsEditor.value.trim();
            if (!hasCode) {
                alert('Cannot save an empty snippet. Please add some code first!');
                return;
            }

            const name = prompt('Enter a name for this snippet:');
            if (!name || !name.trim()) {
                return;
            }

            const snippets = getSnippets();
            const trimmedName = name.trim();

            // Check if snippet with this name already exists
            const existingSnippet = snippets.find(s => s.name === trimmedName);

            if (existingSnippet) {
                // Name exists - check if content is identical
                const isIdentical =
                    existingSnippet.html === htmlEditor.value &&
                    existingSnippet.css === cssEditor.value &&
                    existingSnippet.js === jsEditor.value;

                if (isIdentical) {
                    // Same name, same content - nothing to save
                    alert(`No changes detected. The snippet "${trimmedName}" already contains this code.`);
                    return;
                } else {
                    // Same name, different content - ask to overwrite
                    const overwrite = confirm(`A snippet named "${trimmedName}" already exists. Overwrite it?`);
                    if (!overwrite) {
                        return; // User cancelled
                    }

                    // Update existing snippet
                    existingSnippet.html = htmlEditor.value;
                    existingSnippet.css = cssEditor.value;
                    existingSnippet.js = jsEditor.value;
                    existingSnippet.timestamp = new Date().toISOString();

                    saveSnippets(snippets);
                    alert(`Snippet "${trimmedName}" updated!`);
                    moreOptionsMenu.classList.remove('active');
                }
            } else {
                // New snippet name - save as new
                const snippet = {
                    id: Date.now(),
                    name: trimmedName,
                    html: htmlEditor.value,
                    css: cssEditor.value,
                    js: jsEditor.value,
                    timestamp: new Date().toISOString()
                };

                snippets.push(snippet);
                saveSnippets(snippets);
                alert(`Snippet "${trimmedName}" saved!`);
                moreOptionsMenu.classList.remove('active');
            }
        }

        function loadSnippet(id) {
            const snippets = getSnippets();
            const snippet = snippets.find(s => s.id === id);
            if (snippet) {
                htmlEditor.value = snippet.html;
                cssEditor.value = snippet.css;
                jsEditor.value = snippet.js;

                highlightEditor(htmlEditor, htmlHighlight, 'markup');
                highlightEditor(cssEditor, cssHighlight, 'css');
                highlightEditor(jsEditor, jsHighlight, 'javascript');

                // Clear all added libraries when loading a snippet
                saveAddedLibraries([]);
                renderLibraries(currentLibraryCategory);

                // Announce to screen readers
                window.announceToScreenReader(`Loaded snippet: ${snippet.name}`);

                saveCode();
                runCode();
                closeSnippetsModal();
            }
        }

        function deleteSnippet(id) {
            if (!confirm('Delete this snippet?')) return;
            const snippets = getSnippets().filter(s => s.id !== id);
            saveSnippets(snippets);
            renderSnippets();
        }

        function renderSnippets() {
            const snippets = getSnippets();
            if (snippets.length === 0) {
                snippetsList.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">📂</div>
                        <div class="empty-state-text">
                            No saved snippets yet.<br>
                            Save your first snippet from the menu!
                        </div>
                    </div>
                `;
                return;
            }

            snippetsList.innerHTML = snippets.map(snippet => `
                <div class="snippet-item" role="group" aria-label="${snippet.name}">
                    <div class="snippet-name" onclick="loadSnippet(${snippet.id})"
                         onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();loadSnippet(${snippet.id})}"
                         tabindex="0" role="button" aria-label="Load snippet ${snippet.name}">${snippet.name}</div>
                    <div class="snippet-actions">
                        <span class="snippet-delete" onclick="deleteSnippet(${snippet.id})"
                              onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();deleteSnippet(${snippet.id})}"
                              tabindex="0" role="button" aria-label="Delete snippet ${snippet.name}">Delete</span>
                    </div>
                </div>
            `).join('');
        }

        // Make functions global for onclick handlers
        window.loadSnippet = loadSnippet;
        window.deleteSnippet = deleteSnippet;

        // Libraries management - organized by category
        const POPULAR_LIBS = {
            html: [
                { name: 'Marked (Markdown)', url: 'https://cdn.jsdelivr.net/npm/marked/marked.min.js', type: 'js' },
                { name: 'DOMPurify', url: 'https://cdn.jsdelivr.net/npm/dompurify@3.0.6/dist/purify.min.js', type: 'js' },
                { name: 'Showdown (Markdown)', url: 'https://cdn.jsdelivr.net/npm/showdown@2.1.0/dist/showdown.min.js', type: 'js' }
            ],
            css: [
                { name: 'Bootstrap CSS', url: 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css', type: 'css' },
                { name: 'Tailwind CSS', url: 'https://cdn.tailwindcss.com', type: 'js' },
                { name: 'Font Awesome', url: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css', type: 'css' },
                { name: 'Animate.css', url: 'https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css', type: 'css' },
                { name: 'Bulma CSS', url: 'https://cdn.jsdelivr.net/npm/bulma@0.9.4/css/bulma.min.css', type: 'css' },
                { name: 'Foundation CSS', url: 'https://cdn.jsdelivr.net/npm/foundation-sites@6.8.1/dist/css/foundation.min.css', type: 'css' },
                { name: 'Picnic CSS', url: 'https://cdn.jsdelivr.net/npm/picnic@7.1.0/picnic.min.css', type: 'css' },
                { name: 'Water.css', url: 'https://cdn.jsdelivr.net/npm/water.css@2/out/water.min.css', type: 'css' },
                { name: 'Destyled', url: 'https://cdn.jsdelivr.net/npm/destyled@1.0.0/css/destyled.min.css', type: 'css' },
                { name: 'Material Icons', url: 'https://fonts.googleapis.com/icon?family=Material+Icons', type: 'css' }
            ],
            js: [
                { name: 'jQuery', url: 'https://code.jquery.com/jquery-3.7.1.min.js', type: 'js' },
                { name: 'React', url: 'https://unpkg.com/react@18/umd/react.production.min.js', type: 'js' },
                { name: 'React DOM', url: 'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js', type: 'js' },
                { name: 'Vue 3', url: 'https://unpkg.com/vue@3/dist/vue.global.js', type: 'js' },
                { name: 'Bootstrap JS', url: 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js', type: 'js' },
                { name: 'Foundation JS', url: 'https://cdn.jsdelivr.net/npm/foundation-sites@6.8.1/dist/js/foundation.min.js', type: 'js' },
                { name: 'Lodash', url: 'https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js', type: 'js' },
                { name: 'Axios', url: 'https://cdn.jsdelivr.net/npm/axios@1.6.2/dist/axios.min.js', type: 'js' },
                { name: 'GSAP', url: 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.4/gsap.min.js', type: 'js' },
                { name: 'Three.js', url: 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js', type: 'js' },
                { name: 'Chart.js', url: 'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js', type: 'js' },
                { name: 'Moment.js', url: 'https://cdn.jsdelivr.net/npm/moment@2.29.4/moment.min.js', type: 'js' }
            ]
        };

        function getAddedLibraries() {
            const libs = localStorage.getItem('coded-libraries');
            return libs ? JSON.parse(libs) : [];
        }

        function saveAddedLibraries(libs) {
            localStorage.setItem('coded-libraries', JSON.stringify(libs));
        }

        function addLibrary(name, url, type) {
            const libs = getAddedLibraries();
            if (libs.find(l => l.url === url)) {
                alert('This library is already added!');
                return;
            }

            libs.push({ name, url, type });
            saveAddedLibraries(libs);
            renderLibraries(currentLibraryCategory);
            saveCode(); // Trigger save to update preview
        }

        let currentLibraryCategory = 'js'; // Default category for library modal

        function removeLibrary(url) {
            const libs = getAddedLibraries().filter(l => l.url !== url);
            saveAddedLibraries(libs);
            renderLibraries(currentLibraryCategory);
            saveCode();
        }

        function renderLibraries(category) {
            const added = getAddedLibraries();
            const categoryLibs = POPULAR_LIBS[category] || [];

            // Render popular libraries for this category
            popularLibraries.innerHTML = categoryLibs.map(lib => {
                const isAdded = added.find(l => l.url === lib.url);
                return `
                    <div class="library-item ${isAdded ? 'added' : ''}"
                         ${isAdded ? '' : `onclick="addLibrary('${lib.name}', '${lib.url}', '${lib.type}')"
                         onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();addLibrary('${lib.name}', '${lib.url}', '${lib.type}')}"
                         tabindex="0" role="button" aria-label="Add ${lib.name} library"`}>
                        <div>
                            <span class="library-name">${lib.name}</span>
                            <span class="library-version">${lib.type.toUpperCase()}</span>
                        </div>
                        ${isAdded ? '<span style="color: var(--accent-color);">✓ Added</span>' : ''}
                    </div>
                `;
            }).join('');

            // Render added libraries (all, not filtered by category)
            if (added.length === 0) {
                addedLibrariesList.innerHTML = '<div class="empty-state-text" style="text-align: center; padding: 1rem; color: var(--secondary-color);">No libraries added yet</div>';
            } else {
                addedLibrariesList.innerHTML = added.map(lib => `
                    <div class="library-item" role="group" aria-label="${lib.name}">
                        <div>
                            <span class="library-name">${lib.name}</span>
                            <span class="library-version">${lib.type.toUpperCase()}</span>
                        </div>
                        <span class="library-remove" onclick="removeLibrary('${lib.url}')"
                              onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();removeLibrary('${lib.url}')}"
                              tabindex="0" role="button" aria-label="Remove ${lib.name} library">Remove</span>
                    </div>
                `).join('');
            }
        }

        // Make functions global
        window.addLibrary = addLibrary;
        window.removeLibrary = removeLibrary;

        // Libraries modal
        function openLibrariesModal(category) {
            currentLibraryCategory = category; // Store current category

            const categoryNames = {
                html: 'HTML',
                css: 'CSS',
                js: 'JavaScript'
            };

            // Update modal title
            librariesMenu.querySelector('.snippets-menu-header span').textContent = `Add ${categoryNames[category]} libraries`;

            librariesMenu.style.display = 'block';
            snippetsOverlay.style.display = 'block';
            renderLibraries(category);

            // Close panel menus
            htmlSettingsMenu.classList.remove('active');
            cssSettingsMenu.classList.remove('active');
            jsSettingsMenu.classList.remove('active');

            enableFocusTrap(librariesMenu);
        }

        function closeLibrariesModal() {
            disableFocusTrap(librariesMenu);
            librariesMenu.style.display = 'none';
            snippetsOverlay.style.display = 'none';
        }

        htmlLibrariesBtn.addEventListener('click', () => openLibrariesModal('html'));
        cssLibrariesBtn.addEventListener('click', () => openLibrariesModal('css'));
        jsLibrariesBtn.addEventListener('click', () => openLibrariesModal('js'));
        closeLibrariesBtn.addEventListener('click', closeLibrariesModal);

        // Add custom CDN
        addCustomCdnBtn.addEventListener('click', () => {
            const url = customCdnInput.value.trim();
            if (!url) {
                alert('Please enter a CDN URL');
                return;
            }

            const type = url.endsWith('.css') ? 'css' : 'js';
            const name = prompt('Enter a name for this library:');
            if (!name) return;

            addLibrary(name.trim(), url, type);
            customCdnInput.value = '';
        });

        // More options menu toggle
        moreOptionsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            moreOptionsMenu.classList.toggle('active');
        });

        // Panel settings menu toggles
        htmlSettingsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            htmlSettingsMenu.classList.toggle('active');
            cssSettingsMenu.classList.remove('active');
            jsSettingsMenu.classList.remove('active');
        });

        cssSettingsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            cssSettingsMenu.classList.toggle('active');
            htmlSettingsMenu.classList.remove('active');
            jsSettingsMenu.classList.remove('active');
        });

        jsSettingsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            jsSettingsMenu.classList.toggle('active');
            htmlSettingsMenu.classList.remove('active');
            cssSettingsMenu.classList.remove('active');
        });

        // Close menus when clicking outside
        document.addEventListener('click', (e) => {
            if (!moreOptionsMenu.contains(e.target) && e.target !== moreOptionsBtn) {
                moreOptionsMenu.classList.remove('active');
            }
            if (!htmlSettingsMenu.contains(e.target) && e.target !== htmlSettingsBtn) {
                htmlSettingsMenu.classList.remove('active');
            }
            if (!cssSettingsMenu.contains(e.target) && e.target !== cssSettingsBtn) {
                cssSettingsMenu.classList.remove('active');
            }
            if (!jsSettingsMenu.contains(e.target) && e.target !== jsSettingsBtn) {
                jsSettingsMenu.classList.remove('active');
            }
        });

        // Snippets modal toggle
        function openSnippetsModal() {
            snippetsMenu.style.display = 'block';
            snippetsOverlay.style.display = 'block';
            renderSnippets();
            moreOptionsMenu.classList.remove('active');
            enableFocusTrap(snippetsMenu);
        }

        function closeSnippetsModal() {
            disableFocusTrap(snippetsMenu);
            snippetsMenu.style.display = 'none';
            snippetsOverlay.style.display = 'none';
        }

        // Word wrap toggle - panel-specific
        function updateWordWrap(panel) {
            const panelMap = {
                html: { editor: htmlEditor, highlight: htmlHighlight, checkbox: htmlWrapCheckbox },
                css: { editor: cssEditor, highlight: cssHighlight, checkbox: cssWrapCheckbox },
                js: { editor: jsEditor, highlight: jsHighlight, checkbox: jsWrapCheckbox }
            };

            const { editor, highlight, checkbox } = panelMap[panel];

            if (wordWrapEnabled[panel]) {
                editor.classList.add('wrap-enabled');
                highlight.classList.add('wrap-enabled');
                checkbox.checked = true;
            } else {
                editor.classList.remove('wrap-enabled');
                highlight.classList.remove('wrap-enabled');
                checkbox.checked = false;
            }

            localStorage.setItem(`coded-wordwrap-${panel}`, wordWrapEnabled[panel]);
        }

        // Word wrap checkbox change handlers
        htmlWrapCheckbox.addEventListener('change', () => {
            wordWrapEnabled.html = htmlWrapCheckbox.checked;
            updateWordWrap('html');
        });

        cssWrapCheckbox.addEventListener('change', () => {
            wordWrapEnabled.css = cssWrapCheckbox.checked;
            updateWordWrap('css');
        });

        jsWrapCheckbox.addEventListener('change', () => {
            wordWrapEnabled.js = jsWrapCheckbox.checked;
            updateWordWrap('js');
        });

        // Code formatting functions
        function formatHTML(code) {
            let formatted = '';
            let indent = 0;
            const tab = '  ';

            // Remove extra whitespace
            code = code.replace(/>\s+</g, '><').trim();

            // Split by tags
            const tokens = code.split(/(<[^>]+>)/g).filter(token => token.length > 0);

            tokens.forEach(token => {
                if (token.match(/^<\//)) {
                    // Closing tag - decrease indent before adding
                    indent = Math.max(0, indent - 1);
                    formatted += tab.repeat(indent) + token + '\n';
                } else if (token.match(/^<[^/][^>]*[^/]>$/)) {
                    // Opening tag (not self-closing)
                    formatted += tab.repeat(indent) + token + '\n';
                    indent++;
                } else if (token.match(/^<[^>]+\/>$/)) {
                    // Self-closing tag
                    formatted += tab.repeat(indent) + token + '\n';
                } else if (token.trim().length > 0) {
                    // Text content
                    formatted += tab.repeat(indent) + token.trim() + '\n';
                }
            });

            return formatted.trim();
        }

        function formatCSS(code) {
            let formatted = '';
            let indent = 0;
            const tab = '  ';

            // Remove all existing formatting
            code = code.replace(/\s+/g, ' ').trim();

            // Split into tokens
            const tokens = code.split(/([\{\};])/g);

            tokens.forEach(token => {
                token = token.trim();
                if (!token) return;

                if (token === '{') {
                    formatted += ' {\n';
                    indent++;
                } else if (token === '}') {
                    indent = Math.max(0, indent - 1);
                    formatted += '\n' + tab.repeat(indent) + '}\n\n';
                } else if (token === ';') {
                    formatted += ';\n';
                } else {
                    // Selector or property
                    if (indent === 0) {
                        // Selector
                        formatted += tab.repeat(indent) + token;
                    } else {
                        // Property
                        formatted += tab.repeat(indent) + token;
                    }
                }
            });

            return formatted.trim();
        }

        function formatJS(code) {
            let formatted = '';
            let indent = 0;
            const tab = '  ';
            const lines = code.split('\n');

            lines.forEach(line => {
                const trimmed = line.trim();
                if (trimmed.endsWith('}') || trimmed.startsWith('}')) indent = Math.max(0, indent - 1);
                formatted += tab.repeat(indent) + trimmed + '\n';
                if (trimmed.endsWith('{')) indent++;
            });

            return formatted.trim();
        }

        // Format button handlers
        const htmlFormatBtn = document.getElementById('htmlFormatBtn');
        const cssFormatBtn = document.getElementById('cssFormatBtn');
        const jsFormatBtn = document.getElementById('jsFormatBtn');

        htmlFormatBtn.addEventListener('click', () => {
            htmlEditor.value = formatHTML(htmlEditor.value);
            highlightEditor(htmlEditor, htmlHighlight, 'markup');
            updateLineNumbers(htmlEditor, htmlLineNumbers);
            saveCode();
            htmlSettingsMenu.classList.remove('active');
        });

        cssFormatBtn.addEventListener('click', () => {
            cssEditor.value = formatCSS(cssEditor.value);
            highlightEditor(cssEditor, cssHighlight, 'css');
            updateLineNumbers(cssEditor, cssLineNumbers);
            saveCode();
            cssSettingsMenu.classList.remove('active');
        });

        jsFormatBtn.addEventListener('click', () => {
            jsEditor.value = formatJS(jsEditor.value);
            highlightEditor(jsEditor, jsHighlight, 'javascript');
            updateLineNumbers(jsEditor, jsLineNumbers);
            saveCode();
            jsSettingsMenu.classList.remove('active');
        });

        // CSS Reset/Normalize toggle
        const CSS_NORMALIZE = `/*! normalize.css v8.0.1 | MIT License | github.com/necolas/normalize.css */html{line-height:1.15;-webkit-text-size-adjust:100%}body{margin:0}main{display:block}h1{font-size:2em;margin:.67em 0}hr{box-sizing:content-box;height:0;overflow:visible}pre{font-family:monospace,monospace;font-size:1em}a{background-color:transparent}abbr[title]{border-bottom:none;text-decoration:underline;text-decoration:underline dotted}b,strong{font-weight:bolder}code,kbd,samp{font-family:monospace,monospace;font-size:1em}small{font-size:80%}sub,sup{font-size:75%;line-height:0;position:relative;vertical-align:baseline}sub{bottom:-.25em}sup{top:-.5em}img{border-style:none}button,input,optgroup,select,textarea{font-family:inherit;font-size:100%;line-height:1.15;margin:0}button,input{overflow:visible}button,select{text-transform:none}[type=button],[type=reset],[type=submit],button{-webkit-appearance:button}[type=button]::-moz-focus-inner,[type=reset]::-moz-focus-inner,[type=submit]::-moz-focus-inner,button::-moz-focus-inner{border-style:none;padding:0}[type=button]:-moz-focusring,[type=reset]:-moz-focusring,[type=submit]:-moz-focusring,button:-moz-focusring{outline:1px dotted ButtonText}fieldset{padding:.35em .75em .625em}legend{box-sizing:border-box;color:inherit;display:table;max-width:100%;padding:0;white-space:normal}progress{vertical-align:baseline}textarea{overflow:auto}[type=checkbox],[type=radio]{box-sizing:border-box;padding:0}[type=number]::-webkit-inner-spin-button,[type=number]::-webkit-outer-spin-button{height:auto}[type=search]{-webkit-appearance:textfield;outline-offset:-2px}[type=search]::-webkit-search-decoration{-webkit-appearance:none}::-webkit-file-upload-button{-webkit-appearance:button;font:inherit}details{display:block}summary{display:list-item}template{display:none}[hidden]{display:none}`;

        const CSS_RESET = `/* CSS Reset */html,body,div,span,applet,object,iframe,h1,h2,h3,h4,h5,h6,p,blockquote,pre,a,abbr,acronym,address,big,cite,code,del,dfn,em,img,ins,kbd,q,s,samp,small,strike,strong,sub,sup,tt,var,b,u,i,center,dl,dt,dd,ol,ul,li,fieldset,form,label,legend,table,caption,tbody,tfoot,thead,tr,th,td,article,aside,canvas,details,embed,figure,figcaption,footer,header,hgroup,menu,nav,output,ruby,section,summary,time,mark,audio,video{margin:0;padding:0;border:0;font-size:100%;font:inherit;vertical-align:baseline}article,aside,details,figcaption,figure,footer,header,hgroup,menu,nav,section{display:block}body{line-height:1}ol,ul{list-style:none}blockquote,q{quotes:none}blockquote:before,blockquote:after,q:before,q:after{content:'';content:none}table{border-collapse:collapse;border-spacing:0}`;

        function getCssResetCode() {
            if (cssResetType === 'normalize') return CSS_NORMALIZE;
            if (cssResetType === 'reset') return CSS_RESET;
            return '';
        }

        cssResetBtn.addEventListener('click', () => {
            // Cycle through: none -> normalize -> reset -> none
            if (cssResetType === 'none') {
                cssResetType = 'normalize';
            } else if (cssResetType === 'normalize') {
                cssResetType = 'reset';
            } else {
                cssResetType = 'none';
            }

            cssResetStatus.textContent = cssResetType === 'none' ? 'None' :
                                         cssResetType === 'normalize' ? 'Normalize' : 'Reset';
            localStorage.setItem('coded-css-reset', cssResetType);

            // Re-run code to apply the reset
            if (htmlEditor.value || cssEditor.value || jsEditor.value) {
                runCode();
            }
        });

        saveSnippetMenuBtn.addEventListener('click', () => {
            saveCurrentSnippet();
        });

        snippetsMenuBtn.addEventListener('click', openSnippetsModal);
        closeSnippetsBtn.addEventListener('click', closeSnippetsModal);

        // Universal overlay click handler - closes whichever modal is open
        snippetsOverlay.addEventListener('click', () => {
            if (snippetsMenu.style.display === 'block') {
                closeSnippetsModal();
            } else if (librariesMenu.style.display === 'block') {
                closeLibrariesModal();
            } else if (settingsMenu.style.display === 'block') {
                closeSettingsModal();
            } else if (window.closeTemplatesModal && document.getElementById('templatesMenu').style.display === 'block') {
                window.closeTemplatesModal();
            }
        });

        // Load saved code from localStorage
        function loadCode() {
            const savedHTML = localStorage.getItem('coded-html') || '';
            const savedCSS = localStorage.getItem('coded-css') || '';
            const savedJS = localStorage.getItem('coded-js') || '';

            htmlEditor.value = savedHTML;
            cssEditor.value = savedCSS;
            jsEditor.value = savedJS;

            // Update highlights and line numbers
            highlightEditor(htmlEditor, htmlHighlight, 'markup');
            highlightEditor(cssEditor, cssHighlight, 'css');
            highlightEditor(jsEditor, jsHighlight, 'javascript');

            updateLineNumbers(htmlEditor, htmlLineNumbers);
            updateLineNumbers(cssEditor, cssLineNumbers);
            updateLineNumbers(jsEditor, jsLineNumbers);

            // Run on load if there's saved code
            if (savedHTML || savedCSS || savedJS) {
                runCode();
            }
        }

        // Performance: Debounced localStorage writes
        let saveTimeout = null;
        function saveCode() {
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => {
                localStorage.setItem('coded-html', htmlEditor.value);
                localStorage.setItem('coded-css', cssEditor.value);
                localStorage.setItem('coded-js', jsEditor.value);
            }, 1000); // Save after 1 second of inactivity
        }

        // Add event listeners for live highlighting and auto-save
        htmlEditor.addEventListener('input', () => {
            highlightEditor(htmlEditor, htmlHighlight, 'markup');
            updateLineNumbers(htmlEditor, htmlLineNumbers);
            saveCode();
            debouncedAutoRun();
        });
        htmlEditor.addEventListener('scroll', () => {
            syncScroll(htmlEditor, htmlHighlight);
            syncLineNumbersScroll(htmlEditor, htmlLineNumbers);
        }, { passive: true });

        // Sync on click to ensure cursor positioning is accurate
        htmlEditor.addEventListener('click', () => {
            syncScroll(htmlEditor, htmlHighlight);
            syncScrollRaf(htmlEditor, htmlHighlight);
        });
        htmlEditor.addEventListener('focus', () => {
            syncScrollRaf(htmlEditor, htmlHighlight);
        });
        htmlEditor.addEventListener('keyup', () => {
            syncScrollRaf(htmlEditor, htmlHighlight);
        });
        htmlEditor.addEventListener('select', () => {
            syncScrollRaf(htmlEditor, htmlHighlight);
        });

        cssEditor.addEventListener('input', () => {
            highlightEditor(cssEditor, cssHighlight, 'css');
            updateLineNumbers(cssEditor, cssLineNumbers);
            saveCode();
            debouncedAutoRun();
        });
        cssEditor.addEventListener('scroll', () => {
            syncScroll(cssEditor, cssHighlight);
            syncLineNumbersScroll(cssEditor, cssLineNumbers);
        }, { passive: true });

        // Sync on click to ensure cursor positioning is accurate
        cssEditor.addEventListener('click', () => {
            syncScroll(cssEditor, cssHighlight);
            syncScrollRaf(cssEditor, cssHighlight);
        });
        cssEditor.addEventListener('focus', () => {
            syncScrollRaf(cssEditor, cssHighlight);
        });
        cssEditor.addEventListener('keyup', () => {
            syncScrollRaf(cssEditor, cssHighlight);
        });
        cssEditor.addEventListener('select', () => {
            syncScrollRaf(cssEditor, cssHighlight);
        });

        jsEditor.addEventListener('input', () => {
            highlightEditor(jsEditor, jsHighlight, 'javascript');
            updateLineNumbers(jsEditor, jsLineNumbers);
            saveCode();
            debouncedAutoRun();
        });
        jsEditor.addEventListener('scroll', () => {
            syncScroll(jsEditor, jsHighlight);
            syncLineNumbersScroll(jsEditor, jsLineNumbers);
        }, { passive: true });

        // Sync on click to ensure cursor positioning is accurate
        jsEditor.addEventListener('click', () => {
            syncScroll(jsEditor, jsHighlight);
            syncScrollRaf(jsEditor, jsHighlight);
        });
        jsEditor.addEventListener('focus', () => {
            syncScrollRaf(jsEditor, jsHighlight);
        });
        jsEditor.addEventListener('keyup', () => {
            syncScrollRaf(jsEditor, jsHighlight);
        });
        jsEditor.addEventListener('select', () => {
            syncScrollRaf(jsEditor, jsHighlight);
        });

        // Wait for fonts to load, then sync everything
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(() => {
                setTimeout(() => {
                    syncScroll(htmlEditor, htmlHighlight);
                    syncScroll(cssEditor, cssHighlight);
                    syncScroll(jsEditor, jsHighlight);
                }, 100);
            });
        }

        // Tab trapping state
        let tabTrappingEnabled = {
            html: false,
            css: false,
            js: false
        };

        // HTML tag auto-completion
        function handleTagCompletion(e, editor) {
            if (e.key === '>' && editor === htmlEditor) {
                const cursorPos = editor.selectionStart;
                const textBefore = editor.value.substring(0, cursorPos);
                const tagMatch = textBefore.match(/<([a-zA-Z][a-zA-Z0-9]*)[^>]*$/);

                if (tagMatch && tagMatch[1]) {
                    const tagName = tagMatch[1];
                    const selfClosingTags = ['img', 'br', 'hr', 'input', 'meta', 'link', 'area', 'base', 'col', 'embed', 'source', 'track', 'wbr'];

                    if (!selfClosingTags.includes(tagName.toLowerCase())) {
                        const closingTag = `</${tagName}>`;
                        const textAfter = editor.value.substring(cursorPos);
                        editor.value = textBefore + '>' + closingTag + textAfter;
                        editor.selectionStart = editor.selectionEnd = cursorPos + 1;
                        e.preventDefault();
                        editor.dispatchEvent(new Event('input'));
                    }
                }
            }
        }

        // Enhanced tab and escape key handling
        function handleEditorKeys(e, editorName) {
            const editor = e.target;
            const editorContent = editor.closest('.editor-content');

            // HTML tag auto-completion
            handleTagCompletion(e, editor);

            // Enable tab trapping on first interaction
            if (!tabTrappingEnabled[editorName] && e.key !== 'Tab') {
                tabTrappingEnabled[editorName] = true;
                editorContent.classList.add('tab-trapped');
            }

            // Tab key - indent
            if (e.key === 'Tab') {
                e.preventDefault();
                const start = editor.selectionStart;
                const end = editor.selectionEnd;

                if (e.shiftKey) {
                    // Shift+Tab - outdent
                    const lineStart = editor.value.lastIndexOf('\n', start - 1) + 1;
                    const beforeCursor = editor.value.substring(lineStart, start);
                    if (beforeCursor.startsWith('  ')) {
                        editor.value = editor.value.substring(0, lineStart) +
                                      editor.value.substring(lineStart + 2);
                        editor.selectionStart = editor.selectionEnd = start - 2;
                    }
                } else {
                    // Tab - indent
                    editor.value = editor.value.substring(0, start) + '  ' + editor.value.substring(end);
                    editor.selectionStart = editor.selectionEnd = start + 2;
                }

                editor.dispatchEvent(new Event('input'));

                // Enable tab trapping
                if (!tabTrappingEnabled[editorName]) {
                    tabTrappingEnabled[editorName] = true;
                    editorContent.classList.add('tab-trapped');
                }
            }

            // Escape key - disable tab trapping and blur
            if (e.key === 'Escape') {
                tabTrappingEnabled[editorName] = false;
                editorContent.classList.remove('tab-trapped');
                editor.blur();

                // Announce to screen readers
                const announcement = document.createElement('div');
                announcement.setAttribute('role', 'status');
                announcement.setAttribute('aria-live', 'polite');
                announcement.className = 'sr-only';
                announcement.textContent = 'Editor exited. Tab key will now navigate between elements.';
                document.body.appendChild(announcement);
                setTimeout(() => announcement.remove(), 1000);
            }
        }

        // Focus handlers to show/hide tab trap indicator
        function handleEditorFocus(editorName) {
            return function(e) {
                const editorContent = e.target.closest('.editor-content');
                if (tabTrappingEnabled[editorName]) {
                    editorContent.classList.add('tab-trapped');
                }
            };
        }

        function handleEditorBlur(editorName) {
            return function(e) {
                const editorContent = e.target.closest('.editor-content');
                // Only remove if not tab trapped, or after a delay to prevent flicker
                setTimeout(() => {
                    if (document.activeElement !== e.target) {
                        editorContent.classList.remove('tab-trapped');
                    }
                }, 100);
            };
        }

        htmlEditor.addEventListener('keydown', (e) => handleEditorKeys(e, 'html'));
        htmlEditor.addEventListener('focus', handleEditorFocus('html'));
        htmlEditor.addEventListener('blur', handleEditorBlur('html'));

        cssEditor.addEventListener('keydown', (e) => handleEditorKeys(e, 'css'));
        cssEditor.addEventListener('focus', handleEditorFocus('css'));
        cssEditor.addEventListener('blur', handleEditorBlur('css'));

        jsEditor.addEventListener('keydown', (e) => handleEditorKeys(e, 'js'));
        jsEditor.addEventListener('focus', handleEditorFocus('js'));
        jsEditor.addEventListener('blur', handleEditorBlur('js'));

        // Console functionality
        let consoleVisible = localStorage.getItem('coded-console-visible') === 'true';

        function toggleConsole() {
            consoleVisible = !consoleVisible;
            if (consoleVisible) {
                consolePanel.classList.add('active');
                toggleConsoleBtn.style.background = 'var(--accent-color)';
                toggleConsoleBtn.style.color = 'var(--bg-color)';
                toggleConsoleBtn.setAttribute('aria-expanded', 'true');
            } else {
                consolePanel.classList.remove('active');
                toggleConsoleBtn.style.background = '';
                toggleConsoleBtn.style.color = '';
                toggleConsoleBtn.setAttribute('aria-expanded', 'false');
            }
            localStorage.setItem('coded-console-visible', consoleVisible);
        }

        function addConsoleMessage(type, args) {
            const message = document.createElement('div');
            message.className = `console-message ${type}`;

            const formatted = args.map(arg => {
                if (typeof arg === 'object') {
                    try {
                        return JSON.stringify(arg, null, 2);
                    } catch (e) {
                        return String(arg);
                    }
                }
                return String(arg);
            }).join(' ');

            message.textContent = formatted;
            consoleOutput.appendChild(message);
            consoleOutput.scrollTop = consoleOutput.scrollHeight;
        }

        function clearConsole() {
            consoleOutput.innerHTML = '';
        }

        // Run code in preview
        function runCode() {
            const html = htmlEditor.value;
            const css = cssEditor.value;
            const js = jsEditor.value;
            const libraries = getAddedLibraries();
            const cssReset = getCssResetCode();

            // Build library tags
            const cssLibs = libraries.filter(l => l.type === 'css').map(l => `<link rel="stylesheet" href="${l.url}">`).join('\n    ');
            const jsLibs = libraries.filter(l => l.type === 'js').map(l => `<script src="${l.url}"><\/script>`).join('\n    ');

            const previewDoc = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    ${cssLibs}
    <style>
        ${cssReset}
        ${css}
    </style>
</head>
<body>
    ${html}
    ${jsLibs}
    <script>
        // Intercept console methods
        (function() {
            const originalLog = console.log;
            const originalError = console.error;
            const originalWarn = console.warn;
            const originalInfo = console.info;

            console.log = function(...args) {
                originalLog.apply(console, args);
                window.parent.postMessage({ type: 'console', method: 'log', args: args }, '*');
            };

            console.error = function(...args) {
                originalError.apply(console, args);
                window.parent.postMessage({ type: 'console', method: 'error', args: args }, '*');
            };

            console.warn = function(...args) {
                originalWarn.apply(console, args);
                window.parent.postMessage({ type: 'console', method: 'warn', args: args }, '*');
            };

            console.info = function(...args) {
                originalInfo.apply(console, args);
                window.parent.postMessage({ type: 'console', method: 'info', args: args }, '*');
            };

            // Catch errors
            window.onerror = function(msg, url, lineNo, columnNo, error) {
                console.error('Error:', msg, 'at line', lineNo);
                return false;
            };

            window.addEventListener('unhandledrejection', function(event) {
                console.error('Unhandled Promise Rejection:', event.reason);
            });
        })();

        try {
            ${js}
        } catch (error) {
            console.error('JavaScript Error:', error.message);
        }
    <\/script>
</body>
</html>
            `;

            // Write to iframe
            const previewFrame = preview.contentDocument || preview.contentWindow.document;
            previewFrame.open();
            previewFrame.write(previewDoc);
            previewFrame.close();

            // Announce to screen readers
            window.announceToScreenReader('Code executed successfully');
        }

        // Listen for console messages from iframe
        window.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'console') {
                addConsoleMessage(event.data.method, event.data.args);
            }
        });

        // Console button event listeners
        toggleConsoleBtn.addEventListener('click', toggleConsole);
        clearConsoleBtn.addEventListener('click', clearConsole);

        // Initialize console visibility
        if (consoleVisible) {
            consolePanel.classList.add('active');
            toggleConsoleBtn.style.background = 'var(--accent-color)';
            toggleConsoleBtn.style.color = 'var(--bg-color)';
            toggleConsoleBtn.setAttribute('aria-expanded', 'true');
        }

        // Settings functionality
        let currentFontSize = parseInt(localStorage.getItem('coded-font-size')) || 14;
        let currentLayout = localStorage.getItem('coded-layout') || 'horizontal';
        let currentTheme = localStorage.getItem('coded-theme') || 'dark';
        let syntaxHighlightingEnabled = localStorage.getItem('coded-syntax-highlighting') !== 'false';

        function openSettingsModal() {
            settingsMenu.style.display = 'block';
            snippetsOverlay.style.display = 'block';
            moreOptionsMenu.classList.remove('active');
            enableFocusTrap(settingsMenu);
        }

        function closeSettingsModal() {
            disableFocusTrap(settingsMenu);
            settingsMenu.style.display = 'none';
            snippetsOverlay.style.display = 'none';
        }

        function updateFontSize(size) {
            currentFontSize = size;
            document.querySelectorAll('.editor, .editor-highlight code, .line-numbers').forEach(el => {
                el.style.fontSize = `${size}px`;
            });
            if (fontSizeValue) fontSizeValue.textContent = `${size}px`;
            if (fontSizeSlider) fontSizeSlider.value = size;
            localStorage.setItem('coded-font-size', size);
        }

        function setLayout(layout) {
            currentLayout = layout;
            if (layout === 'vertical') {
                editorsSection.classList.add('vertical-layout');
                layoutVerticalBtn.classList.add('active');
                layoutVerticalBtn.style.background = 'var(--accent-color)';
                layoutVerticalBtn.style.color = 'var(--bg-color)';
                layoutVerticalBtn.style.borderColor = 'var(--accent-color)';
                layoutHorizontalBtn.classList.remove('active');
                layoutHorizontalBtn.style.background = 'none';
                layoutHorizontalBtn.style.color = 'var(--secondary-color)';
                layoutHorizontalBtn.style.borderColor = 'var(--editor-border)';
            } else {
                editorsSection.classList.remove('vertical-layout');
                layoutHorizontalBtn.classList.add('active');
                layoutHorizontalBtn.style.background = 'var(--accent-color)';
                layoutHorizontalBtn.style.color = 'var(--bg-color)';
                layoutHorizontalBtn.style.borderColor = 'var(--accent-color)';
                layoutVerticalBtn.classList.remove('active');
                layoutVerticalBtn.style.background = 'none';
                layoutVerticalBtn.style.color = 'var(--secondary-color)';
                layoutVerticalBtn.style.borderColor = 'var(--editor-border)';
            }
            localStorage.setItem('coded-layout', layout);
        }

        function setTheme(theme) {
            currentTheme = theme;
            if (theme === 'light') {
                document.body.classList.add('light-theme');
                themeLightBtn.classList.add('active');
                themeLightBtn.style.background = 'var(--accent-color)';
                themeLightBtn.style.color = 'var(--bg-color)';
                themeLightBtn.style.borderColor = 'var(--accent-color)';
                themeDarkBtn.classList.remove('active');
                themeDarkBtn.style.background = 'none';
                themeDarkBtn.style.color = 'var(--secondary-color)';
                themeDarkBtn.style.borderColor = 'var(--editor-border)';
            } else {
                document.body.classList.remove('light-theme');
                themeDarkBtn.classList.add('active');
                themeDarkBtn.style.background = 'var(--accent-color)';
                themeDarkBtn.style.color = 'var(--bg-color)';
                themeDarkBtn.style.borderColor = 'var(--accent-color)';
                themeLightBtn.classList.remove('active');
                themeLightBtn.style.background = 'none';
                themeLightBtn.style.color = 'var(--secondary-color)';
                themeLightBtn.style.borderColor = 'var(--editor-border)';
            }
            localStorage.setItem('coded-theme', theme);
        }

        function setSyntaxHighlighting(enabled) {
            syntaxHighlightingEnabled = enabled;
            if (enabled) {
                syntaxOnBtn.classList.add('active');
                syntaxOnBtn.style.background = 'var(--accent-color)';
                syntaxOnBtn.style.color = 'var(--bg-color)';
                syntaxOnBtn.style.borderColor = 'var(--accent-color)';
                syntaxOffBtn.classList.remove('active');
                syntaxOffBtn.style.background = 'none';
                syntaxOffBtn.style.color = 'var(--secondary-color)';
                syntaxOffBtn.style.borderColor = 'var(--editor-border)';
                // Remove plain-text class to make text transparent again
                htmlEditor.classList.remove('plain-text');
                cssEditor.classList.remove('plain-text');
                jsEditor.classList.remove('plain-text');
                // Re-highlight all editors
                highlightEditor(htmlEditor, htmlHighlight, 'markup');
                highlightEditor(cssEditor, cssHighlight, 'css');
                highlightEditor(jsEditor, jsHighlight, 'javascript');
            } else {
                syntaxOffBtn.classList.add('active');
                syntaxOffBtn.style.background = 'var(--accent-color)';
                syntaxOffBtn.style.color = 'var(--bg-color)';
                syntaxOffBtn.style.borderColor = 'var(--accent-color)';
                syntaxOnBtn.classList.remove('active');
                syntaxOnBtn.style.background = 'none';
                syntaxOnBtn.style.color = 'var(--secondary-color)';
                syntaxOnBtn.style.borderColor = 'var(--editor-border)';
                // Add plain-text class to make text visible
                htmlEditor.classList.add('plain-text');
                cssEditor.classList.add('plain-text');
                jsEditor.classList.add('plain-text');
                // Clear all highlighting
                htmlHighlight.innerHTML = '';
                cssHighlight.innerHTML = '';
                jsHighlight.innerHTML = '';
            }
            localStorage.setItem('coded-syntax-highlighting', enabled);
        }

        // Settings event listeners
        settingsBtn.addEventListener('click', openSettingsModal);
        closeSettingsBtn.addEventListener('click', closeSettingsModal);

        if (fontSizeSlider) {
            fontSizeSlider.addEventListener('input', (e) => {
                updateFontSize(parseInt(e.target.value));
            });
        }

        layoutHorizontalBtn.addEventListener('click', () => {
            setLayout('horizontal');
        });

        layoutVerticalBtn.addEventListener('click', () => {
            setLayout('vertical');
        });

        themeDarkBtn.addEventListener('click', () => {
            setTheme('dark');
        });

        themeLightBtn.addEventListener('click', () => {
            setTheme('light');
        });

        syntaxOnBtn.addEventListener('click', () => {
            setSyntaxHighlighting(true);
        });

        syntaxOffBtn.addEventListener('click', () => {
            setSyntaxHighlighting(false);
        });

        // Initialize settings
        updateFontSize(currentFontSize);
        setLayout(currentLayout);
        setTheme(currentTheme);
        setSyntaxHighlighting(syntaxHighlightingEnabled);

        // Find/Replace functionality
        let currentFindEditor = null;
        let lastSearchTerm = '';
        let lastSearchIndex = -1;

        function getActiveEditor() {
            // Return the last focused editor, defaulting to HTML editor
            if (document.activeElement === htmlEditor) return htmlEditor;
            if (document.activeElement === cssEditor) return cssEditor;
            if (document.activeElement === jsEditor) return jsEditor;
            return currentFindEditor || htmlEditor;
        }

        function openFindReplace() {
            findReplacePanel.style.display = 'block';
            currentFindEditor = getActiveEditor();
            enableFocusTrap(findReplacePanel, findInput);
            findInput.focus();
            findInput.select();
        }

        function closeFindReplace() {
            disableFocusTrap(findReplacePanel);
            findReplacePanel.style.display = 'none';
            if (currentFindEditor) {
                currentFindEditor.focus();
            }
        }

        function findNext() {
            const searchTerm = findInput.value;
            if (!searchTerm) {
                findResultsText.textContent = 'Enter search term';
                return;
            }

            const editor = getActiveEditor();
            const content = editor.value;
            const startPos = (lastSearchTerm === searchTerm && lastSearchIndex !== -1)
                ? lastSearchIndex + searchTerm.length
                : 0;

            const index = content.indexOf(searchTerm, startPos);

            if (index !== -1) {
                editor.focus();
                editor.setSelectionRange(index, index + searchTerm.length);
                editor.scrollTop = editor.scrollHeight * (index / content.length) - editor.clientHeight / 2;

                lastSearchTerm = searchTerm;
                lastSearchIndex = index;

                const occurrences = (content.match(new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
                const currentOccurrence = (content.substring(0, index).match(new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length + 1;
                findResultsText.textContent = `${currentOccurrence} of ${occurrences}`;
            } else if (startPos > 0) {
                // Wrap around
                lastSearchIndex = -1;
                findNext();
            } else {
                findResultsText.textContent = 'Not found';
                lastSearchIndex = -1;
            }
        }

        function findPrev() {
            const searchTerm = findInput.value;
            if (!searchTerm) {
                findResultsText.textContent = 'Enter search term';
                return;
            }

            const editor = getActiveEditor();
            const content = editor.value;
            const startPos = lastSearchIndex !== -1 ? lastSearchIndex - 1 : content.length;

            const index = content.lastIndexOf(searchTerm, startPos);

            if (index !== -1) {
                editor.focus();
                editor.setSelectionRange(index, index + searchTerm.length);
                editor.scrollTop = editor.scrollHeight * (index / content.length) - editor.clientHeight / 2;

                lastSearchTerm = searchTerm;
                lastSearchIndex = index;

                const occurrences = (content.match(new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
                const currentOccurrence = (content.substring(0, index).match(new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length + 1;
                findResultsText.textContent = `${currentOccurrence} of ${occurrences}`;
            } else if (startPos < content.length) {
                // Wrap around
                lastSearchIndex = content.length + 1;
                findPrev();
            } else {
                findResultsText.textContent = 'Not found';
                lastSearchIndex = -1;
            }
        }

        function replaceOne() {
            const searchTerm = findInput.value;
            const replacement = replaceInput.value;
            if (!searchTerm) return;

            const editor = getActiveEditor();
            const selStart = editor.selectionStart;
            const selEnd = editor.selectionEnd;
            const selectedText = editor.value.substring(selStart, selEnd);

            if (selectedText === searchTerm) {
                editor.value = editor.value.substring(0, selStart) + replacement + editor.value.substring(selEnd);
                editor.setSelectionRange(selStart, selStart + replacement.length);

                // Trigger updates
                editor.dispatchEvent(new Event('input'));

                // Find next occurrence
                setTimeout(() => findNext(), 50);
            } else {
                findNext();
            }
        }

        function replaceAll() {
            const searchTerm = findInput.value;
            const replacement = replaceInput.value;
            if (!searchTerm) return;

            const editor = getActiveEditor();
            const escapedSearch = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(escapedSearch, 'g');
            const count = (editor.value.match(regex) || []).length;

            if (count > 0) {
                editor.value = editor.value.replace(regex, replacement);

                // Trigger updates
                editor.dispatchEvent(new Event('input'));

                findResultsText.textContent = `Replaced ${count} occurrence${count > 1 ? 's' : ''}`;
                lastSearchIndex = -1;
            } else {
                findResultsText.textContent = 'Not found';
            }
        }

        // Find/Replace event listeners
        closeFindReplaceBtn.addEventListener('click', closeFindReplace);
        findNextBtn.addEventListener('click', findNext);
        findPrevBtn.addEventListener('click', findPrev);
        replaceBtn.addEventListener('click', replaceOne);
        replaceAllBtn.addEventListener('click', replaceAll);

        findInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (e.shiftKey) {
                    findPrev();
                } else {
                    findNext();
                }
            } else if (e.key === 'Escape') {
                closeFindReplace();
            }
        });

        replaceInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                replaceOne();
            } else if (e.key === 'Escape') {
                closeFindReplace();
            }
        });

        // Reset search when input changes
        findInput.addEventListener('input', () => {
            lastSearchIndex = -1;
            lastSearchTerm = '';
        });

        // Clear all code
        function clearAll() {
            if (confirm('Are you sure you want to clear all code?')) {
                htmlEditor.value = '';
                cssEditor.value = '';
                jsEditor.value = '';
                htmlHighlight.innerHTML = '';
                cssHighlight.innerHTML = '';
                jsHighlight.innerHTML = '';
                localStorage.removeItem('coded-html');
                localStorage.removeItem('coded-css');
                localStorage.removeItem('coded-js');

                // Clear preview
                const previewFrame = preview.contentDocument || preview.contentWindow.document;
                previewFrame.open();
                previewFrame.write('<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body></body></html>');
                previewFrame.close();
            }
        }

        // Export code as HTML file
        function exportCode() {
            const html = htmlEditor.value;
            const css = cssEditor.value;
            const js = jsEditor.value;

            const exportDoc = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Coded Export</title>
    <style>
${css}
    </style>
</head>
<body>
${html}
    <script>
${js}
    <\/script>
</body>
</html>`;

            // Create blob and download
            const blob = new Blob([exportDoc], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'coded-export.html';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }

        // Share code as .coded file
        function shareCode() {
            const html = htmlEditor.value;
            const css = cssEditor.value;
            const js = jsEditor.value;

            // Check if there's any code to share
            if (!html && !css && !js) {
                alert('Add some code first before sharing!');
                return;
            }

            // Prompt for a filename
            const name = prompt('Give your share a name (e.g., "Accessible Panel Demo"):');
            if (!name || !name.trim()) {
                return;
            }

            try {
                // Create share data
                const shareData = {
                    name: name.trim(),
                    html: html,
                    css: css,
                    js: js,
                    created: new Date().toISOString(),
                    version: '1.0'
                };

                // Convert to JSON and create a Blob
                const jsonString = JSON.stringify(shareData, null, 2);
                const blob = new Blob([jsonString], { type: 'application/json' });

                // Create download link
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;

                // Sanitize filename
                const filename = name.trim().replace(/[^a-z0-9]/gi, '-').toLowerCase();
                a.download = `${filename}.coded`;

                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                alert(`Share file "${filename}.coded" downloaded!\n\nYou can share this file with anyone. They can drag & drop it into Coded to load your code.`);
                moreOptionsMenu.classList.remove('active');
            } catch (e) {
                console.error('Share error:', e);
                alert('Failed to create share file. Please try again.');
            }
        }

        // Load code from URL parameter
        function loadFromUrl() {
            const urlParams = new URLSearchParams(window.location.search);
            const shareId = urlParams.get('share');

            if (!shareId) {
                return; // No share parameter, skip
            }

            // Fetch from backend
            fetch(`/api/share?id=${encodeURIComponent(shareId)}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Share not found');
                    }
                    return response.json();
                })
                .then(data => {
                    // Load the code
                    htmlEditor.value = data.html || '';
                    cssEditor.value = data.css || '';
                    jsEditor.value = data.js || '';

                    // Update highlights
                    highlightEditor(htmlEditor, htmlHighlight, 'markup');
                    highlightEditor(cssEditor, cssHighlight, 'css');
                    highlightEditor(jsEditor, jsHighlight, 'javascript');

                    // Run the code
                    runCode();

                    // Enter share mode
                    isShareMode = true;
                    shareModeBanner.classList.add('active');
                    document.body.classList.add('share-mode');

                    // Update banner text to show it's shared code
                    const bannerInfo = shareModeBanner.querySelector('.share-mode-info');
                    if (bannerInfo) {
                        bannerInfo.innerHTML = `<span style="font-size: 1.2rem;">🔗</span><span><strong>Loaded shared code</strong> — Make edits and save as needed</span>`;
                    }

                    // Announce to screen readers
                    if (window.announceToScreenReader) {
                        window.announceToScreenReader('Loaded shared code from URL');
                    }

                    // Clean URL (remove share parameter) but keep share mode active
                    window.history.replaceState({}, document.title, window.location.pathname);
                })
                .catch(e => {
                    console.error('Failed to load shared code:', e);
                    alert('Failed to load shared code. The share may not exist or the server may be unavailable.');
                });
        }

        // Update share link (creates new share URL with current code)
        function updateShareLink() {
            shareCode(); // Reuse the share function
        }

        // Exit share mode and start fresh
        function startFresh() {
            if (confirm('Start fresh? This will clear all code and exit share mode.')) {
                // Clear all code
                htmlEditor.value = '';
                cssEditor.value = '';
                jsEditor.value = '';
                htmlHighlight.innerHTML = '';
                cssHighlight.innerHTML = '';
                jsHighlight.innerHTML = '';

                // Clear preview
                const previewFrame = preview.contentDocument || preview.contentWindow.document;
                previewFrame.open();
                previewFrame.write('<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body></body></html>');
                previewFrame.close();

                // Exit share mode
                isShareMode = false;
                shareModeBanner.classList.remove('active');
                document.body.classList.remove('share-mode');

                // Don't save to localStorage - truly fresh start
            }
        }

        // Auto-run toggle
        autoRunToggle.checked = autoRunEnabled;
        autoRunToggle.addEventListener('change', (e) => {
            autoRunEnabled = e.target.checked;
            localStorage.setItem('coded-autorun', autoRunEnabled);
        });

        // Panel resizing
        let isResizing = false;
        let startY = 0;
        let startEditorHeight = 0;
        let currentEditorPercent = null;

        function startResize(clientY) {
            isResizing = true;
            startY = clientY;
            startEditorHeight = editorsSection.offsetHeight;
            resizer.classList.add('resizing');
            document.body.classList.add('resizing');
            document.body.style.cursor = 'row-resize';

            // Force a layout calculation before starting to ensure smooth resize
            editorsSection.offsetHeight;
            previewSection.offsetHeight;
        }

        function handleResize(clientY) {
            if (!isResizing) return;

            const deltaY = clientY - startY;
            const containerHeight = container.offsetHeight;
            const newEditorHeight = startEditorHeight + deltaY;
            const minHeight = 150;
            const maxHeight = containerHeight - 150;

            if (newEditorHeight >= minHeight && newEditorHeight <= maxHeight) {
                const editorPercent = (newEditorHeight / containerHeight) * 100;
                currentEditorPercent = editorPercent;
                editorsSection.style.height = `${editorPercent}%`;
                previewSection.style.flex = 'unset';
                previewSection.style.height = `calc(${100 - editorPercent}% - 4px)`;
            }
        }

        function endResize() {
            if (isResizing) {
                isResizing = false;
                resizer.classList.remove('resizing');
                document.body.classList.remove('resizing');
                document.body.style.cursor = '';

                // Save the resize state
                if (currentEditorPercent !== null) {
                    localStorage.setItem('coded-panel-height', currentEditorPercent);
                }

                // Sync all editors after resize to ensure cursor positioning is accurate
                syncScroll(htmlEditor, htmlHighlight);
                syncScroll(cssEditor, cssHighlight);
                syncScroll(jsEditor, jsHighlight);
            }
        }

        function resetPanelSizes() {
            // Clear inline styles to let CSS take over
            editorsSection.style.height = '';
            previewSection.style.flex = '';
            previewSection.style.height = '';
            currentEditorPercent = null;
            localStorage.removeItem('coded-panel-height');

            // Sync all editors after reset to ensure cursor positioning is accurate
            setTimeout(() => {
                syncScroll(htmlEditor, htmlHighlight);
                syncScroll(cssEditor, cssHighlight);
                syncScroll(jsEditor, jsHighlight);
            }, 10);
        }

        function applyStoredPanelSize() {
            const stored = localStorage.getItem('coded-panel-height');
            if (stored) {
                const percent = parseFloat(stored);
                editorsSection.style.height = `${percent}%`;
                previewSection.style.flex = 'unset';
                previewSection.style.height = `calc(${100 - percent}% - 4px)`;
                currentEditorPercent = percent;
            }
        }

        // Mouse events
        resizer.addEventListener('mousedown', (e) => {
            e.preventDefault();
            startResize(e.clientY);
        });

        // Double-click to reset to default size
        resizer.addEventListener('dblclick', () => {
            resetPanelSizes();
        });

        document.addEventListener('mousemove', (e) => {
            if (isResizing) {
                e.preventDefault();
                handleResize(e.clientY);
            }
        });

        document.addEventListener('mouseup', (e) => {
            e.preventDefault();
            endResize();
        });

        // Stop resizing if mouse leaves the window
        document.addEventListener('mouseleave', () => {
            endResize();
        });

        // Also stop if focus is lost
        window.addEventListener('blur', () => {
            endResize();
        });

        // Touch events for mobile/tablet
        resizer.addEventListener('touchstart', (e) => {
            e.preventDefault();
            startResize(e.touches[0].clientY);
        });

        document.addEventListener('touchmove', (e) => {
            if (isResizing) {
                e.preventDefault();
                handleResize(e.touches[0].clientY);
            }
        }, { passive: false });

        document.addEventListener('touchend', () => {
            endResize();
        });

        document.addEventListener('touchcancel', () => {
            endResize();
        });

        // Reset panel sizes on window resize to prevent breakpoint issues
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                // Only reset if viewport width changed significantly (breakpoint change)
                const viewportWidth = window.innerWidth;
                const lastWidth = parseInt(localStorage.getItem('coded-viewport-width') || '0');

                if (Math.abs(viewportWidth - lastWidth) > 100) {
                    resetPanelSizes();
                    localStorage.setItem('coded-viewport-width', viewportWidth);
                } else if (currentEditorPercent !== null) {
                    // Recalculate percentages if minor resize
                    const containerHeight = container.offsetHeight;
                    const currentHeight = editorsSection.offsetHeight;
                    const newPercent = (currentHeight / containerHeight) * 100;
                    editorsSection.style.height = `${newPercent}%`;
                    previewSection.style.height = `calc(${100 - newPercent}% - 4px)`;
                }

                // Sync all editors after window resize to ensure cursor positioning is accurate
                syncScroll(htmlEditor, htmlHighlight);
                syncScroll(cssEditor, cssHighlight);
                syncScroll(jsEditor, jsHighlight);
            }, 250);
        });

        // Responsive preview functionality
        const deviceButtons = document.querySelectorAll('.device-btn');
        const previewViewport = document.getElementById('previewViewport');
        const viewportSize = document.getElementById('viewportSize');
        const viewportResizeHandle = document.getElementById('viewportResizeHandle');
        const previewFrame = document.getElementById('preview');

        let currentViewportWidth = '100%';
        let isResizingViewport = false;
        let viewportStartX = 0;
        let viewportStartWidth = 0;

        function setViewportWidth(width) {
            currentViewportWidth = String(width);

            if (width === '100%' || width === 100) {
                previewViewport.classList.remove('constrained');
                previewFrame.style.width = '100%';
                previewFrame.style.maxWidth = 'none';
                viewportSize.textContent = '100%';
            } else {
                previewViewport.classList.add('constrained');
                const widthPx = typeof width === 'number' ? width : parseInt(width);
                previewFrame.style.width = widthPx + 'px';
                previewFrame.style.maxWidth = widthPx + 'px';
                viewportSize.textContent = widthPx + 'px';
            }

            localStorage.setItem('coded-viewport-width', currentViewportWidth);
        }

        // Device button click handlers
        deviceButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                // Remove active class and update aria-pressed for all buttons
                deviceButtons.forEach(b => {
                    b.classList.remove('active');
                    b.setAttribute('aria-pressed', 'false');
                });
                // Add active class and update aria-pressed for clicked button
                this.classList.add('active');
                this.setAttribute('aria-pressed', 'true');
                // Get width and apply
                const width = this.getAttribute('data-width');
                setViewportWidth(width);
            });
        });

        // Viewport resize handle
        if (viewportResizeHandle) {
            viewportResizeHandle.addEventListener('mousedown', (e) => {
                isResizingViewport = true;
                viewportStartX = e.clientX;
                viewportStartWidth = parseInt(previewFrame.style.width) || 375;
                document.body.style.cursor = 'ew-resize';
                document.body.style.userSelect = 'none';
            });
        }

        document.addEventListener('mousemove', (e) => {
            if (!isResizingViewport) return;

            const deltaX = e.clientX - viewportStartX;
            const newWidth = Math.max(320, Math.min(viewportStartWidth + deltaX, previewViewport.offsetWidth - 32));

            previewFrame.style.width = newWidth + 'px';
            previewFrame.style.maxWidth = newWidth + 'px';
            viewportSize.textContent = newWidth + 'px';
            currentViewportWidth = newWidth;
        });

        document.addEventListener('mouseup', () => {
            if (isResizingViewport) {
                isResizingViewport = false;
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
                localStorage.setItem('coded-viewport-width', currentViewportWidth);

                // Update active button state
                deviceButtons.forEach(b => b.classList.remove('active'));
            }
        });

        // Load saved viewport width
        const savedViewportWidth = localStorage.getItem('coded-viewport-width');
        if (savedViewportWidth && savedViewportWidth !== '100%') {
            setViewportWidth(savedViewportWidth);
            let matchFound = false;
            deviceButtons.forEach(b => {
                if (b.getAttribute('data-width') === savedViewportWidth) {
                    b.classList.add('active');
                    matchFound = true;
                } else {
                    b.classList.remove('active');
                }
            });
            // If no match found, activate Desktop button as default
            if (!matchFound && deviceButtons[0]) {
                deviceButtons[0].classList.add('active');
            }
        }

        // Event listeners
        runBtn.addEventListener('click', runCode);
        clearBtn.addEventListener('click', clearAll);
        exportBtn.addEventListener('click', exportCode);
        shareBtn.addEventListener('click', shareCode);
        startFreshBtn.addEventListener('click', startFresh);

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Cmd/Ctrl + F to open find/replace
            if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
                e.preventDefault();
                openFindReplace();
            }
            // Cmd/Ctrl + Enter to run
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                runCode();
            }
            // Cmd/Ctrl + S to save (already auto-saving, but prevent browser save dialog)
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault();
                saveCode();
            }
            // Cmd/Ctrl + E to export
            if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
                e.preventDefault();
                exportCode();
            }
        });

        // Auto-run toggle initialization
        autoRunToggle.checked = autoRunEnabled;

        // Initialize word wrap for each panel
        updateWordWrap('html');
        updateWordWrap('css');
        updateWordWrap('js');

        // Initialize CSS reset status
        cssResetStatus.textContent = cssResetType === 'none' ? 'None' :
                                     cssResetType === 'normalize' ? 'Normalize' : 'Reset';

        // Apply stored panel size
        applyStoredPanelSize();

        // Check for shared code in URL first, then load from localStorage
        loadFromUrl();

        // Only load from localStorage if there was no share parameter
        const urlParams = new URLSearchParams(window.location.search);
        if (!urlParams.get('share')) {
            loadCode();
        }

        // Load .coded file function
        function loadCodedFile(file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const shareData = JSON.parse(e.target.result);

                    // Validate the file structure
                    if (!shareData.version || (!shareData.html && !shareData.css && !shareData.js)) {
                        alert('Invalid .coded file format.');
                        return;
                    }

                    // Load the code
                    htmlEditor.value = shareData.html || '';
                    cssEditor.value = shareData.css || '';
                    jsEditor.value = shareData.js || '';

                    // Update highlights
                    highlightEditor(htmlEditor, htmlHighlight, 'markup');
                    highlightEditor(cssEditor, cssHighlight, 'css');
                    highlightEditor(jsEditor, jsHighlight, 'javascript');

                    // Run the code
                    runCode();

                    // Show banner to indicate file was loaded
                    isShareMode = true;
                    shareModeBanner.classList.add('active');
                    document.body.classList.add('share-mode');

                    // Update banner text to show file name
                    const bannerInfo = shareModeBanner.querySelector('.share-mode-info');
                    if (bannerInfo) {
                        bannerInfo.innerHTML = `<span>📁 Loaded file: <strong>${shareData.name || 'Untitled.coded'}</strong></span>`;
                    }

                    // Announce to screen readers
                    if (window.announceToScreenReader) {
                        window.announceToScreenReader(`Loaded file: ${shareData.name || 'Untitled'}`);
                    }
                } catch (err) {
                    console.error('Error loading .coded file:', err);
                    alert('Failed to load .coded file. The file may be corrupted.');
                }
            };
            reader.readAsText(file);
        }

        // Add "Load .coded File" menu option
        const loadCodedFileBtn = document.createElement('div');
        loadCodedFileBtn.className = 'more-option-item';
        loadCodedFileBtn.id = 'loadCodedFileBtn';
        loadCodedFileBtn.innerHTML = 'Load .coded File';
        loadCodedFileBtn.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.coded';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    loadCodedFile(file);
                }
            };
            input.click();
            moreOptionsMenu.classList.remove('active');
        });

        // Insert after "Save .coded File" button in menu
        if (shareBtn && shareBtn.parentNode) {
            shareBtn.parentNode.insertBefore(loadCodedFileBtn, shareBtn.nextSibling);
        }

        // Accessibility: Keyboard navigation for dropdown menus
        function addMenuKeyboardNavigation(menuElement) {
            const menuItems = Array.from(menuElement.querySelectorAll('.more-option-item'));
            let currentIndex = -1;

            function focusItem(index) {
                if (index >= 0 && index < menuItems.length) {
                    menuItems[currentIndex]?.classList.remove('keyboard-focused');
                    currentIndex = index;
                    menuItems[currentIndex].classList.add('keyboard-focused');
                    menuItems[currentIndex].focus();
                }
            }

            menuElement.addEventListener('keydown', (e) => {
                if (!menuElement.classList.contains('active') && menuElement.style.display !== 'block') {
                    return;
                }

                switch(e.key) {
                    case 'ArrowDown':
                        e.preventDefault();
                        if (currentIndex < menuItems.length - 1) {
                            focusItem(currentIndex + 1);
                        } else {
                            focusItem(0); // Wrap to first
                        }
                        break;
                    case 'ArrowUp':
                        e.preventDefault();
                        if (currentIndex > 0) {
                            focusItem(currentIndex - 1);
                        } else {
                            focusItem(menuItems.length - 1); // Wrap to last
                        }
                        break;
                    case 'Home':
                        e.preventDefault();
                        focusItem(0);
                        break;
                    case 'End':
                        e.preventDefault();
                        focusItem(menuItems.length - 1);
                        break;
                    case 'Escape':
                        e.preventDefault();
                        menuElement.classList.remove('active');
                        if (menuElement === moreOptionsMenu) {
                            moreOptionsBtn.focus();
                        }
                        break;
                }
            });

            // Focus first item when menu opens
            const observer = new MutationObserver(() => {
                if (menuElement.classList.contains('active')) {
                    setTimeout(() => focusItem(0), 50);
                } else {
                    currentIndex = -1;
                    menuItems.forEach(item => item.classList.remove('keyboard-focused'));
                }
            });
            observer.observe(menuElement, { attributes: true, attributeFilter: ['class'] });
        }

        // Make menu items focusable and add keyboard support
        document.querySelectorAll('.more-option-item').forEach(item => {
            item.setAttribute('tabindex', '0');
            item.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();

                    // Check if this menu item contains a checkbox (toggle switch)
                    const checkbox = item.querySelector('input[type="checkbox"]');
                    if (checkbox) {
                        // Toggle the checkbox
                        checkbox.checked = !checkbox.checked;
                        // Trigger change event so the app responds
                        checkbox.dispatchEvent(new Event('change', { bubbles: true }));
                    } else {
                        // Regular menu item - click it
                        item.click();
                    }
                }
            });
        });

        // Add keyboard navigation to menus
        addMenuKeyboardNavigation(moreOptionsMenu);
        addMenuKeyboardNavigation(htmlSettingsMenu);
        addMenuKeyboardNavigation(cssSettingsMenu);
        addMenuKeyboardNavigation(jsSettingsMenu);

        // Keyboard navigation for modal items (snippets and libraries)
        function makeModalItemsKeyboardAccessible(containerElement) {
            const items = containerElement.querySelectorAll('.snippet-item, .library-item:not(.added)');
            items.forEach((item, index) => {
                item.setAttribute('tabindex', '0');
                item.setAttribute('role', 'button');

                item.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        item.click();
                    }
                    // Arrow key navigation
                    else if (e.key === 'ArrowDown' && index < items.length - 1) {
                        e.preventDefault();
                        items[index + 1].focus();
                    }
                    else if (e.key === 'ArrowUp' && index > 0) {
                        e.preventDefault();
                        items[index - 1].focus();
                    }
                    else if (e.key === 'Home') {
                        e.preventDefault();
                        items[0].focus();
                    }
                    else if (e.key === 'End') {
                        e.preventDefault();
                        items[items.length - 1].focus();
                    }
                });
            });
        }

        // Observe when modals open and make their items keyboard accessible
        const modalObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'style') {
                    const modal = mutation.target;
                    if (modal.style.display === 'block') {
                        setTimeout(() => {
                            makeModalItemsKeyboardAccessible(modal);
                            // Focus first item
                            const firstItem = modal.querySelector('.snippet-item, .library-item:not(.added)');
                            if (firstItem) firstItem.focus();
                        }, 100);
                    }
                }
            });
        });

        // Watch modals for changes
        if (snippetsMenu) modalObserver.observe(snippetsMenu, { attributes: true });
        if (librariesMenu) modalObserver.observe(librariesMenu, { attributes: true });

        // Accessibility: Add keyboard support (Enter/Space) for elements with role="button"
        document.querySelectorAll('[role="button"]').forEach(element => {
            element.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    element.click();
                }
            });
        });

        // Mobile editor tabs
        const mobileEditorTabs = document.querySelectorAll('.mobile-editor-tab');
        const editorPanels = {
            html: document.getElementById('htmlPanel'),
            css: document.getElementById('cssPanel'),
            js: document.getElementById('jsPanel')
        };

        function switchMobileTab(panelName) {
            // Update tab states and tabindex (ADA compliance - roving tabindex)
            mobileEditorTabs.forEach(tab => {
                const isActive = tab.dataset.panel === panelName;
                tab.classList.toggle('active', isActive);
                tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
                tab.setAttribute('tabindex', isActive ? '0' : '-1');
            });

            // Update panel visibility
            Object.entries(editorPanels).forEach(([name, panel]) => {
                if (panel) {
                    panel.classList.toggle('mobile-active', name === panelName);
                }
            });

            // Announce tab change to screen readers
            if (window.announceToScreenReader) {
                const tabNames = { html: 'HTML', css: 'CSS', js: 'JavaScript' };
                window.announceToScreenReader(`${tabNames[panelName]} editor selected`);
            }
        }

        mobileEditorTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                switchMobileTab(tab.dataset.panel);
            });

            // Keyboard navigation for tabs (ADA compliance)
            tab.addEventListener('keydown', (e) => {
                const tabs = Array.from(mobileEditorTabs);
                const currentIndex = tabs.indexOf(tab);
                let nextIndex;

                switch (e.key) {
                    case 'ArrowLeft':
                    case 'ArrowUp':
                        e.preventDefault();
                        nextIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
                        tabs[nextIndex].focus();
                        switchMobileTab(tabs[nextIndex].dataset.panel);
                        break;
                    case 'ArrowRight':
                    case 'ArrowDown':
                        e.preventDefault();
                        nextIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
                        tabs[nextIndex].focus();
                        switchMobileTab(tabs[nextIndex].dataset.panel);
                        break;
                    case 'Home':
                        e.preventDefault();
                        tabs[0].focus();
                        switchMobileTab(tabs[0].dataset.panel);
                        break;
                    case 'End':
                        e.preventDefault();
                        tabs[tabs.length - 1].focus();
                        switchMobileTab(tabs[tabs.length - 1].dataset.panel);
                        break;
                }
            });
        });

        // Handle window resize - ensure proper panel visibility
        let lastWidth = window.innerWidth;
        window.addEventListener('resize', () => {
            const currentWidth = window.innerWidth;

            // Transitioning from desktop to mobile
            if (lastWidth > 768 && currentWidth <= 768) {
                // Make sure HTML panel is visible by default on mobile
                const activeTab = document.querySelector('.mobile-editor-tab.active');
                if (activeTab) {
                    switchMobileTab(activeTab.dataset.panel);
                } else {
                    switchMobileTab('html');
                }
            }

            lastWidth = currentWidth;
        });
