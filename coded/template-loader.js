// Templates modal functionality with lazy loading
(function() {
    let currentTemplatePanel = null;
    let currentTemplateType = null;

    // Cache for loaded templates
    const templateCache = {
        html: null,
        css: null,
        js: null
    };

    const templatesMenu = document.getElementById('templatesMenu');
    const closeTemplatesBtn = document.getElementById('closeTemplatesBtn');
    const templatesList = document.getElementById('templatesList');
    const snippetsOverlay = document.getElementById('snippetsOverlay');

    // Dynamically load templates for a specific panel
    async function loadTemplatesForPanel(panel) {
        if (templateCache[panel]) {
            return templateCache[panel];
        }

        try {
            const module = await import(`/coded/templates/${panel}-templates.js`);
            const templateKey = panel.toUpperCase() + '_TEMPLATES';
            templateCache[panel] = module[templateKey];
            return templateCache[panel];
        } catch (error) {
            console.error(`Failed to load ${panel} templates:`, error);
            return null;
        }
    }

    window.openTemplatesModal = async function(panel, type) {
        console.log('Opening templates modal for:', panel, type);

        currentTemplatePanel = panel;
        currentTemplateType = type || 'starters';

        const panelNames = { html: 'HTML', css: 'CSS', js: 'JavaScript' };
        const typeNames = { starters: 'starter', testing: 'testing' };

        // Update modal title
        templatesMenu.querySelector('.snippets-menu-header span').textContent =
            panelNames[panel] + ' ' + typeNames[currentTemplateType] + ' templates';

        templatesMenu.style.display = 'block';
        snippetsOverlay.style.display = 'block';

        // Show loading state
        templatesList.innerHTML = '<div class="empty-state"><div class="empty-state-text">Loading templates...</div></div>';

        // Load and render templates
        await renderTemplates(panel, currentTemplateType);

        // Close panel settings menus
        document.getElementById('htmlSettingsMenu').classList.remove('active');
        document.getElementById('cssSettingsMenu').classList.remove('active');
        document.getElementById('jsSettingsMenu').classList.remove('active');
    };

    window.closeTemplatesModal = function() {
        templatesMenu.style.display = 'none';
        snippetsOverlay.style.display = 'none';
    };

    async function renderTemplates(panel, type) {
        const panelTemplates = await loadTemplatesForPanel(panel);

        if (!panelTemplates) {
            templatesList.innerHTML = '<div class="empty-state"><div class="empty-state-text">Failed to load templates</div></div>';
            return;
        }

        const templates = panelTemplates[type];

        if (!templates || templates.length === 0) {
            templatesList.innerHTML = '<div class="empty-state"><div class="empty-state-text">No templates available</div></div>';
            return;
        }

        templatesList.innerHTML = templates.map(function(template, index) {
            return '<div class="library-item" onclick="loadPanelTemplate(\'' + panel + '\', \'' + type + '\', ' + index + ')" style="cursor: pointer;">' +
                '<div>' +
                '<span class="library-name">' + template.name + '</span>' +
                '<div style="font-size: 0.85rem; color: var(--secondary-color); margin-top: 0.25rem;">' +
                template.description +
                '</div>' +
                '</div>' +
                '</div>';
        }).join('');
    }

    window.loadPanelTemplate = async function(panel, type, index) {
        const panelTemplates = await loadTemplatesForPanel(panel);
        if (!panelTemplates) return;

        const template = panelTemplates[type][index];
        if (!template) return;

        let editor, highlight, lineNumbers, language;
        const htmlEditor = document.getElementById('htmlEditor');
        const cssEditor = document.getElementById('cssEditor');
        const jsEditor = document.getElementById('jsEditor');

        if (panel === 'html') {
            editor = htmlEditor;
            language = 'markup';
        } else if (panel === 'css') {
            editor = cssEditor;
            language = 'css';
        } else if (panel === 'js') {
            editor = jsEditor;
            language = 'javascript';
        }

        // Check if editor has existing content
        if (editor.value.trim().length > 0) {
            const panelName = panel.toUpperCase();
            const confirmed = confirm(
                'You have existing code in the ' + panelName + ' panel.\n\n' +
                'Loading this template will replace your current code.\n\n' +
                'Are you sure you want to continue?'
            );

            if (!confirmed) {
                return; // User cancelled, don't load template
            }
        }

        // Load template content
        editor.value = template.content;
        editor.dispatchEvent(new Event('input'));

        // Close modal
        window.closeTemplatesModal();
    };

    // Event listeners
    document.addEventListener('DOMContentLoaded', function() {
        const htmlTemplatesBtn = document.getElementById('htmlTemplatesBtn');
        const htmlTestTemplatesBtn = document.getElementById('htmlTestTemplatesBtn');
        const cssTemplatesBtn = document.getElementById('cssTemplatesBtn');
        const cssTestTemplatesBtn = document.getElementById('cssTestTemplatesBtn');
        const jsTemplatesBtn = document.getElementById('jsTemplatesBtn');

        if (htmlTemplatesBtn) {
            htmlTemplatesBtn.addEventListener('click', function() {
                window.openTemplatesModal('html', 'starters');
            });
        }
        if (htmlTestTemplatesBtn) {
            htmlTestTemplatesBtn.addEventListener('click', function() {
                window.openTemplatesModal('html', 'testing');
            });
        }
        if (cssTemplatesBtn) {
            cssTemplatesBtn.addEventListener('click', function() {
                window.openTemplatesModal('css', 'starters');
            });
        }
        if (cssTestTemplatesBtn) {
            cssTestTemplatesBtn.addEventListener('click', function() {
                window.openTemplatesModal('css', 'testing');
            });
        }
        if (jsTemplatesBtn) {
            jsTemplatesBtn.addEventListener('click', function() {
                window.openTemplatesModal('js', 'starters');
            });
        }
        if (closeTemplatesBtn) {
            closeTemplatesBtn.addEventListener('click', window.closeTemplatesModal);
        }
    });
})();
