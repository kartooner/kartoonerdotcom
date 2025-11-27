// Templates modal functionality
(function() {
    let currentTemplatePanel = null;
    let currentTemplateType = null;

    const templatesMenu = document.getElementById('templatesMenu');
    const closeTemplatesBtn = document.getElementById('closeTemplatesBtn');
    const templatesList = document.getElementById('templatesList');
    const snippetsOverlay = document.getElementById('snippetsOverlay');

    window.openTemplatesModal = function(panel, type) {
        console.log('Opening templates modal for:', panel, type);

        currentTemplatePanel = panel;
        currentTemplateType = type || 'starters';

        const panelNames = { html: 'HTML', css: 'CSS', js: 'JavaScript' };
        const typeNames = { starters: 'Starter', testing: 'Testing' };

        // Update modal title
        templatesMenu.querySelector('.snippets-menu-header span').textContent =
            panelNames[panel] + ' ' + typeNames[currentTemplateType] + ' Templates';

        templatesMenu.style.display = 'block';
        snippetsOverlay.style.display = 'block';
        renderTemplates(panel, currentTemplateType);

        // Close panel settings menus
        document.getElementById('htmlSettingsMenu').classList.remove('active');
        document.getElementById('cssSettingsMenu').classList.remove('active');
        document.getElementById('jsSettingsMenu').classList.remove('active');
    };

    window.closeTemplatesModal = function() {
        templatesMenu.style.display = 'none';
        snippetsOverlay.style.display = 'none';
    };

    function renderTemplates(panel, type) {
        const templates = window.PANEL_TEMPLATES[panel][type];

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

    window.loadPanelTemplate = function(panel, type, index) {
        const template = window.PANEL_TEMPLATES[panel][type][index];
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
