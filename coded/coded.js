// Template definitions
const STARTER_TEMPLATES = {
    'blank': {
        html: '',
        css: '',
        js: ''
    },
    'html-shell': {
        html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
</head>
<body>
  <header>
    <h1>Welcome</h1>
  </header>

  <main>
    <p>Start building something amazing!</p>
  </main>

  <footer>
    <p>&copy; 2024</p>
  </footer>
</body>
</html>`,
        css: `body {
  font-family: system-ui, -apple-system, sans-serif;
  line-height: 1.6;
  margin: 0;
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

header {
  background: #f4f4f4;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 2rem;
}

h1 {
  margin: 0;
  color: #333;
}

main {
  padding: 2rem 0;
}

footer {
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid #ddd;
  color: #666;
}`,
        js: ''
    },
    'simple-table': {
        html: `<div class="container">
  <h2>Employee Directory</h2>

  <table>
    <thead>
      <tr>
        <th>Name</th>
        <th>Position</th>
        <th>Department</th>
        <th>Email</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Alice Johnson</td>
        <td>Engineer</td>
        <td>Engineering</td>
        <td>alice@example.com</td>
      </tr>
      <tr>
        <td>Bob Smith</td>
        <td>Designer</td>
        <td>Design</td>
        <td>bob@example.com</td>
      </tr>
      <tr>
        <td>Carol Davis</td>
        <td>Manager</td>
        <td>Operations</td>
        <td>carol@example.com</td>
      </tr>
      <tr>
        <td>David Wilson</td>
        <td>Analyst</td>
        <td>Finance</td>
        <td>david@example.com</td>
      </tr>
    </tbody>
  </table>
</div>`,
        css: `body {
  font-family: system-ui, -apple-system, sans-serif;
  padding: 2rem;
  background: #f5f5f5;
}

.container {
  max-width: 1000px;
  margin: 0 auto;
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

h2 {
  margin-top: 0;
  color: #333;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1.5rem;
}

thead {
  background: #4a90e2;
  color: white;
}

th {
  padding: 12px;
  text-align: left;
  font-weight: 600;
}

td {
  padding: 12px;
  border-bottom: 1px solid #e0e0e0;
}

tbody tr:hover {
  background: #f8f9fa;
}

tbody tr:last-child td {
  border-bottom: none;
}`,
        js: ''
    },
    'item-list': {
        html: `<div class="container">
  <h2>Product Showcase</h2>

  <div class="item-grid">
    <div class="item-card">
      <div class="item-icon">📱</div>
      <h3>Smartphone</h3>
      <p>Latest model with amazing features</p>
      <span class="price">$999</span>
    </div>

    <div class="item-card">
      <div class="item-icon">💻</div>
      <h3>Laptop</h3>
      <p>Powerful and lightweight</p>
      <span class="price">$1,299</span>
    </div>

    <div class="item-card">
      <div class="item-icon">🎧</div>
      <h3>Headphones</h3>
      <p>Premium sound quality</p>
      <span class="price">$299</span>
    </div>

    <div class="item-card">
      <div class="item-icon">⌚</div>
      <h3>Smartwatch</h3>
      <p>Track your fitness goals</p>
      <span class="price">$399</span>
    </div>

    <div class="item-card">
      <div class="item-icon">📷</div>
      <h3>Camera</h3>
      <p>Capture stunning photos</p>
      <span class="price">$799</span>
    </div>

    <div class="item-card">
      <div class="item-icon">🖥️</div>
      <h3>Monitor</h3>
      <p>Crystal clear display</p>
      <span class="price">$449</span>
    </div>
  </div>
</div>`,
        css: `body {
  font-family: system-ui, -apple-system, sans-serif;
  padding: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

h2 {
  color: white;
  text-align: center;
  font-size: 2.5rem;
  margin-bottom: 3rem;
  text-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.item-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
}

.item-card {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.item-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 24px rgba(0,0,0,0.15);
}

.item-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

h3 {
  margin: 0.5rem 0;
  color: #333;
  font-size: 1.5rem;
}

p {
  color: #666;
  margin: 0.5rem 0 1rem;
}

.price {
  display: inline-block;
  background: #667eea;
  color: white;
  padding: 0.5rem 1.5rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 1.1rem;
}`,
        js: ''
    },
    'editable-grid': {
        html: `<div class="container">
  <h2>Task Manager</h2>

  <div class="controls">
    <button id="addTaskBtn">+ Add Task</button>
  </div>

  <div class="grid" id="taskGrid">
    <div class="grid-header">
      <div>Task</div>
      <div>Status</div>
      <div>Priority</div>
      <div>Action</div>
    </div>
  </div>
</div>`,
        css: `body {
  font-family: system-ui, -apple-system, sans-serif;
  padding: 2rem;
  background: #f0f2f5;
}

.container {
  max-width: 1000px;
  margin: 0 auto;
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

h2 {
  margin-top: 0;
  color: #333;
}

.controls {
  margin-bottom: 1.5rem;
}

button {
  background: #4a90e2;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: background 0.2s;
}

button:hover {
  background: #357abd;
}

button.delete {
  background: #e74c3c;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
}

button.delete:hover {
  background: #c0392b;
}

.grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 120px;
  gap: 1px;
  background: #ddd;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
}

.grid-header {
  display: contents;
  font-weight: 600;
}

.grid-header > div {
  background: #f8f9fa;
  padding: 1rem;
  font-weight: 600;
  color: #333;
}

.grid-row {
  display: contents;
}

.grid-row > div {
  background: white;
  padding: 1rem;
  display: flex;
  align-items: center;
}

.grid-row input,
.grid-row select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.95rem;
}

.grid-row input:focus,
.grid-row select:focus {
  outline: none;
  border-color: #4a90e2;
}`,
        js: `let taskCount = 0;

function addTask(task = '', status = 'todo', priority = 'medium') {
  taskCount++;
  const grid = document.getElementById('taskGrid');

  const row = document.createElement('div');
  row.className = 'grid-row';
  row.id = \`task-\${taskCount}\`;

  row.innerHTML = \`
    <div><input type="text" value="\${task}" placeholder="Enter task..."></div>
    <div>
      <select>
        <option value="todo" \${status === 'todo' ? 'selected' : ''}>To Do</option>
        <option value="in-progress" \${status === 'in-progress' ? 'selected' : ''}>In Progress</option>
        <option value="done" \${status === 'done' ? 'selected' : ''}>Done</option>
      </select>
    </div>
    <div>
      <select>
        <option value="low" \${priority === 'low' ? 'selected' : ''}>Low</option>
        <option value="medium" \${priority === 'medium' ? 'selected' : ''}>Medium</option>
        <option value="high" \${priority === 'high' ? 'selected' : ''}>High</option>
      </select>
    </div>
    <div>
      <button class="delete" onclick="deleteTask('task-\${taskCount}')">Delete</button>
    </div>
  \`;

  grid.appendChild(row);
}

function deleteTask(taskId) {
  const task = document.getElementById(taskId);
  if (task && confirm('Delete this task?')) {
    task.remove();
  }
}

// Initialize with a couple of sample tasks
addTask('Design homepage mockup', 'in-progress', 'high');
addTask('Review pull requests', 'todo', 'medium');
addTask('Update documentation', 'todo', 'low');

// Add task button
document.getElementById('addTaskBtn').addEventListener('click', () => {
  addTask();
});`
    }
};

// Template selection logic
function initializeTemplateSelector() {
    const templateSelector = document.getElementById('templateSelector');
    const templateCards = document.querySelectorAll('.template-card');

    // Check if we should show template selector
    // Only show if there's no saved code and no URL share parameter
    const hasSavedCode = localStorage.getItem('coded-html') ||
                        localStorage.getItem('coded-css') ||
                        localStorage.getItem('coded-js');
    const urlParams = new URLSearchParams(window.location.search);
    const hasShareParam = urlParams.get('share');

    if (hasSavedCode || hasShareParam) {
        // Hide template selector immediately if there's saved code or a share link
        templateSelector.classList.add('hidden');
    }

    // Add click handlers to template cards
    templateCards.forEach(card => {
        card.addEventListener('click', () => {
            const templateKey = card.dataset.template;
            loadTemplate(templateKey);
            // Hide template selector
            templateSelector.classList.add('hidden');
        });
    });
}

function loadTemplate(templateKey) {
    const template = STARTER_TEMPLATES[templateKey];
    if (!template) return;

    // Load template into editors
    htmlEditor.value = template.html;
    cssEditor.value = template.css;
    jsEditor.value = template.js;

    // Update highlights and line numbers
    highlightEditor(htmlEditor, htmlHighlight, 'markup');
    highlightEditor(cssEditor, cssHighlight, 'css');
    highlightEditor(jsEditor, jsHighlight, 'javascript');

    updateLineNumbers(htmlEditor, htmlLineNumbers);
    updateLineNumbers(cssEditor, cssLineNumbers);
    updateLineNumbers(jsEditor, jsLineNumbers);

    // Save and run
    saveCode();
    if (template.html || template.css || template.js) {
        runCode();
    }
}

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
const htmlWrapStatus = document.getElementById('htmlWrapStatus');

const cssSettingsBtn = document.getElementById('cssSettingsBtn');
const cssSettingsMenu = document.getElementById('cssSettingsMenu');
const cssLibrariesBtn = document.getElementById('cssLibrariesBtn');
const cssWrapToggle = document.getElementById('cssWrapToggle');
const cssWrapStatus = document.getElementById('cssWrapStatus');
const cssResetBtn = document.getElementById('cssResetBtn');
const cssResetStatus = document.getElementById('cssResetStatus');

const jsSettingsBtn = document.getElementById('jsSettingsBtn');
const jsSettingsMenu = document.getElementById('jsSettingsMenu');
const jsLibrariesBtn = document.getElementById('jsLibrariesBtn');
const jsWrapToggle = document.getElementById('jsWrapToggle');
const jsWrapStatus = document.getElementById('jsWrapStatus');
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
const updateShareBtn = document.getElementById('updateShareBtn');
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
const findReplacePanel = document.getElementById('findReplacePanel');
const closeFindReplaceBtn = document.getElementById('closeFindReplaceBtn');
const findInput = document.getElementById('findInput');
const replaceInput = document.getElementById('replaceInput');
const findPrevBtn = document.getElementById('findPrevBtn');
const findNextBtn = document.getElementById('findNextBtn');
const replaceBtn = document.getElementById('replaceBtn');
const replaceAllBtn = document.getElementById('replaceAllBtn');
const findResultsText = document.getElementById('findResultsText');

let autoRunEnabled = localStorage.getItem('coded-autorun') === 'true';
let autoRunTimeout = null;
let wordWrapEnabled = {
    html: localStorage.getItem('coded-wordwrap-html') !== null ? localStorage.getItem('coded-wordwrap-html') === 'true' : true,
    css: localStorage.getItem('coded-wordwrap-css') !== null ? localStorage.getItem('coded-wordwrap-css') === 'true' : true,
    js: localStorage.getItem('coded-wordwrap-js') !== null ? localStorage.getItem('coded-wordwrap-js') === 'true' : true
};
let cssResetType = localStorage.getItem('coded-css-reset') || 'none'; // 'none', 'normalize', 'reset'
let isShareMode = false; // Track if we're in share mode

// Debounced auto-run (waits 800ms after last keystroke)
function debouncedAutoRun() {
    if (!autoRunEnabled) return;

    clearTimeout(autoRunTimeout);
    autoRunTimeout = setTimeout(() => {
        runCode();
    }, 800); // Wait 800ms after user stops typing
}

// Syntax highlighting with Prism
function highlightEditor(editor, highlight, language) {
    const code = editor.value;
    if (code) {
        const highlighted = Prism.highlight(code, Prism.languages[language], language);
        highlight.innerHTML = \`<pre><code class="language-\${language}">\${highlighted}</code></pre>\`;
    } else {
        highlight.innerHTML = '';
    }
    syncScroll(editor, highlight);
}

// Sync scroll between editor and highlight
function syncScroll(editor, highlight) {
    highlight.scrollTop = editor.scrollTop;
    highlight.scrollLeft = editor.scrollLeft;
}

// Update line numbers
function updateLineNumbers(editor, lineNumbersElement) {
    const lines = editor.value.split('\\n').length;
    const numbers = [];
    for (let i = 1; i <= lines; i++) {
        numbers.push(i);
    }
    lineNumbersElement.textContent = numbers.join('\\n');

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

    const snippet = {
        id: Date.now(),
        name: name.trim(),
        html: htmlEditor.value,
        css: cssEditor.value,
        js: jsEditor.value,
        timestamp: new Date().toISOString()
    };

    const snippets = getSnippets();
    snippets.push(snippet);
    saveSnippets(snippets);

    // Show confirmation
    alert(\`Snippet "\${name.trim()}" saved!\`);
    moreOptionsMenu.classList.remove('active');
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
        snippetsList.innerHTML = \`
            <div class="empty-state">
                <div class="empty-state-icon">📂</div>
                <div class="empty-state-text">
                    No saved snippets yet.<br>
                    Save your first snippet from the menu!
                </div>
            </div>
        \`;
        return;
    }

    snippetsList.innerHTML = snippets.map(snippet => \`
        <div class="snippet-item">
            <div class="snippet-name" onclick="loadSnippet(\${snippet.id})">\${snippet.name}</div>
            <div class="snippet-actions">
                <span class="snippet-delete" onclick="deleteSnippet(\${snippet.id})">Delete</span>
            </div>
        </div>
    \`).join('');
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
        return \`
            <div class="library-item \${isAdded ? 'added' : ''}" onclick="\${isAdded ? '' : \`addLibrary('\${lib.name}', '\${lib.url}', '\${lib.type}')\`}">
                <div>
                    <span class="library-name">\${lib.name}</span>
                    <span class="library-version">\${lib.type.toUpperCase()}</span>
                </div>
                \${isAdded ? '<span style="color: var(--accent-color);">✓ Added</span>' : ''}
            </div>
        \`;
    }).join('');

    // Render added libraries (all, not filtered by category)
    if (added.length === 0) {
        addedLibrariesList.innerHTML = '<div class="empty-state-text" style="text-align: center; padding: 1rem; color: var(--secondary-color);">No libraries added yet</div>';
    } else {
        addedLibrariesList.innerHTML = added.map(lib => \`
            <div class="library-item">
                <div>
                    <span class="library-name">\${lib.name}</span>
                    <span class="library-version">\${lib.type.toUpperCase()}</span>
                </div>
                <span class="library-remove" onclick="removeLibrary('\${lib.url}')">Remove</span>
            </div>
        \`).join('');
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
    librariesMenu.querySelector('.snippets-menu-header span').textContent = \`Add \${categoryNames[category]} Libraries\`;

    librariesMenu.style.display = 'block';
    snippetsOverlay.style.display = 'block';
    renderLibraries(category);

    // Close panel menus
    htmlSettingsMenu.classList.remove('active');
    cssSettingsMenu.classList.remove('active');
    jsSettingsMenu.classList.remove('active');
}

function closeLibrariesModal() {
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
}

function closeSnippetsModal() {
    snippetsMenu.style.display = 'none';
    snippetsOverlay.style.display = 'none';
}

// Word wrap toggle - panel-specific
function updateWordWrap(panel) {
    const panelMap = {
        html: { editor: htmlEditor, highlight: htmlHighlight, status: htmlWrapStatus },
        css: { editor: cssEditor, highlight: cssHighlight, status: cssWrapStatus },
        js: { editor: jsEditor, highlight: jsHighlight, status: jsWrapStatus }
    };

    const { editor, highlight, status } = panelMap[panel];

    if (wordWrapEnabled[panel]) {
        editor.classList.add('wrap-enabled');
        highlight.classList.add('wrap-enabled');
        status.textContent = 'On';
    } else {
        editor.classList.remove('wrap-enabled');
        highlight.classList.remove('wrap-enabled');
        status.textContent = 'Off';
    }

    localStorage.setItem(\`coded-wordwrap-\${panel}\`, wordWrapEnabled[panel]);
}

htmlWrapToggle.addEventListener('click', () => {
    wordWrapEnabled.html = !wordWrapEnabled.html;
    updateWordWrap('html');
});

cssWrapToggle.addEventListener('click', () => {
    wordWrapEnabled.css = !wordWrapEnabled.css;
    updateWordWrap('css');
});

jsWrapToggle.addEventListener('click', () => {
    wordWrapEnabled.js = !wordWrapEnabled.js;
    updateWordWrap('js');
});

// CSS Reset/Normalize toggle
const CSS_NORMALIZE = \`/*! normalize.css v8.0.1 | MIT License | github.com/necolas/normalize.css */html{line-height:1.15;-webkit-text-size-adjust:100%}body{margin:0}main{display:block}h1{font-size:2em;margin:.67em 0}hr{box-sizing:content-box;height:0;overflow:visible}pre{font-family:monospace,monospace;font-size:1em}a{background-color:transparent}abbr[title]{border-bottom:none;text-decoration:underline;text-decoration:underline dotted}b,strong{font-weight:bolder}code,kbd,samp{font-family:monospace,monospace;font-size:1em}small{font-size:80%}sub,sup{font-size:75%;line-height:0;position:relative;vertical-align:baseline}sub{bottom:-.25em}sup{top:-.5em}img{border-style:none}button,input,optgroup,select,textarea{font-family:inherit;font-size:100%;line-height:1.15;margin:0}button,input{overflow:visible}button,select{text-transform:none}[type=button],[type=reset],[type=submit],button{-webkit-appearance:button}[type=button]::-moz-focus-inner,[type=reset]::-moz-focus-inner,[type=submit]::-moz-focus-inner,button::-moz-focus-inner{border-style:none;padding:0}[type=button]:-moz-focusring,[type=reset]:-moz-focusring,[type=submit]:-moz-focusring,button:-moz-focusring{outline:1px dotted ButtonText}fieldset{padding:.35em .75em .625em}legend{box-sizing:border-box;color:inherit;display:table;max-width:100%;padding:0;white-space:normal}progress{vertical-align:baseline}textarea{overflow:auto}[type=checkbox],[type=radio]{box-sizing:border-box;padding:0}[type=number]::-webkit-inner-spin-button,[type=number]::-webkit-outer-spin-button{height:auto}[type=search]{-webkit-appearance:textfield;outline-offset:-2px}[type=search]::-webkit-search-decoration{-webkit-appearance:none}::-webkit-file-upload-button{-webkit-appearance:button;font:inherit}details{display:block}summary{display:list-item}template{display:none}[hidden]{display:none}\`;

const CSS_RESET = \`/* CSS Reset */html,body,div,span,applet,object,iframe,h1,h2,h3,h4,h5,h6,p,blockquote,pre,a,abbr,acronym,address,big,cite,code,del,dfn,em,img,ins,kbd,q,s,samp,small,strike,strong,sub,sup,tt,var,b,u,i,center,dl,dt,dd,ol,ul,li,fieldset,form,label,legend,table,caption,tbody,tfoot,thead,tr,th,td,article,aside,canvas,details,embed,figure,figcaption,footer,header,hgroup,menu,nav,output,ruby,section,summary,time,mark,audio,video{margin:0;padding:0;border:0;font-size:100%;font:inherit;vertical-align:baseline}article,aside,details,figcaption,figure,footer,header,hgroup,menu,nav,section{display:block}body{line-height:1}ol,ul{list-style:none}blockquote,q{quotes:none}blockquote:before,blockquote:after,q:before,q:after{content:'';content:none}table{border-collapse:collapse;border-spacing:0}\`;

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
snippetsOverlay.addEventListener('click', closeSnippetsModal);

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

// Save code to localStorage
function saveCode() {
    localStorage.setItem('coded-html', htmlEditor.value);
    localStorage.setItem('coded-css', cssEditor.value);
    localStorage.setItem('coded-js', jsEditor.value);
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
});

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
                const closingTag = \`</\${tagName}>\`;
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
            const lineStart = editor.value.lastIndexOf('\\n', start - 1) + 1;
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
    } else {
        consolePanel.classList.remove('active');
        toggleConsoleBtn.style.background = '';
        toggleConsoleBtn.style.color = '';
    }
    localStorage.setItem('coded-console-visible', consoleVisible);
}

function addConsoleMessage(type, args) {
    const message = document.createElement('div');
    message.className = \`console-message \${type}\`;

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
    const cssLibs = libraries.filter(l => l.type === 'css').map(l => \`<link rel="stylesheet" href="\${l.url}">\`).join('\\n    ');
    const jsLibs = libraries.filter(l => l.type === 'js').map(l => \`<script src="\${l.url}"></script>\`).join('\\n    ');

    const previewDoc = \`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    \${cssLibs}
    <style>
        \${cssReset}
        \${css}
    </style>
</head>
<body>
    \${html}
    \${jsLibs}
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
            \${js}
        } catch (error) {
            console.error('JavaScript Error:', error.message);
        }
    </script>
</body>
</html>
            \`;

    // Write to iframe
    const previewFrame = preview.contentDocument || preview.contentWindow.document;
    previewFrame.open();
    previewFrame.write(previewDoc);
    previewFrame.close();
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
}

// Settings functionality
let currentFontSize = parseInt(localStorage.getItem('coded-font-size')) || 14;
let currentLayout = localStorage.getItem('coded-layout') || 'horizontal';

function openSettingsModal() {
    settingsMenu.style.display = 'block';
    snippetsOverlay.style.display = 'block';
    moreOptionsMenu.classList.remove('active');
}

function closeSettingsModal() {
    settingsMenu.style.display = 'none';
    snippetsOverlay.style.display = 'none';
}

function updateFontSize(size) {
    currentFontSize = size;
    document.querySelectorAll('.editor, .editor-highlight code, .line-numbers').forEach(el => {
        el.style.fontSize = \`\${size}px\`;
    });
    fontSizeValue.textContent = \`\${size}px\`;
    fontSizeSlider.value = size;
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

// Settings event listeners
settingsBtn.addEventListener('click', openSettingsModal);
closeSettingsBtn.addEventListener('click', closeSettingsModal);

fontSizeSlider.addEventListener('input', (e) => {
    updateFontSize(parseInt(e.target.value));
});

layoutHorizontalBtn.addEventListener('click', () => {
    setLayout('horizontal');
});

layoutVerticalBtn.addEventListener('click', () => {
    setLayout('vertical');
});

// Initialize settings
updateFontSize(currentFontSize);
setLayout(currentLayout);

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
    findInput.focus();
    findInput.select();
}

function closeFindReplace() {
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

        const occurrences = (content.match(new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\\\$&'), 'g')) || []).length;
        const currentOccurrence = (content.substring(0, index).match(new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\\\$&'), 'g')) || []).length + 1;
        findResultsText.textContent = \`\${currentOccurrence} of \${occurrences}\`;
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

        const occurrences = (content.match(new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\\\$&'), 'g')) || []).length;
        const currentOccurrence = (content.substring(0, index).match(new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\\\$&'), 'g')) || []).length + 1;
        findResultsText.textContent = \`\${currentOccurrence} of \${occurrences}\`;
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
    const escapedSearch = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\\\$&');
    const regex = new RegExp(escapedSearch, 'g');
    const count = (editor.value.match(regex) || []).length;

    if (count > 0) {
        editor.value = editor.value.replace(regex, replacement);

        // Trigger updates
        editor.dispatchEvent(new Event('input'));

        findResultsText.textContent = \`Replaced \${count} occurrence\${count > 1 ? 's' : ''}\`;
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

        // Show template selector again
        const templateSelector = document.getElementById('templateSelector');
        if (templateSelector) {
            templateSelector.classList.remove('hidden');
        }

        // Close more options menu
        moreOptionsMenu.classList.remove('active');
    }
}

// Export code as HTML file
function exportCode() {
    const html = htmlEditor.value;
    const css = cssEditor.value;
    const js = jsEditor.value;

    const exportDoc = \`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Coded Export</title>
    <style>
\${css}
    </style>
</head>
<body>
\${html}
    <script>
\${js}
    </script>
</body>
</html>\`;

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
    fetch(\`/api/share?id=\${encodeURIComponent(shareId)}\`)
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

        // Show template selector again
        const templateSelector = document.getElementById('templateSelector');
        if (templateSelector) {
            templateSelector.classList.remove('hidden');
        }

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
        editorsSection.style.height = \`\${editorPercent}%\`;
        previewSection.style.flex = 'unset';
        previewSection.style.height = \`calc(\${100 - editorPercent}% - 4px)\`;
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
    }
}

function resetPanelSizes() {
    // Clear inline styles to let CSS take over
    editorsSection.style.height = '';
    previewSection.style.flex = '';
    previewSection.style.height = '';
    currentEditorPercent = null;
    localStorage.removeItem('coded-panel-height');
}

function applyStoredPanelSize() {
    const stored = localStorage.getItem('coded-panel-height');
    if (stored) {
        const percent = parseFloat(stored);
        editorsSection.style.height = \`\${percent}%\`;
        previewSection.style.flex = 'unset';
        previewSection.style.height = \`calc(\${100 - percent}% - 4px)\`;
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
            editorsSection.style.height = \`\${newPercent}%\`;
            previewSection.style.height = \`calc(\${100 - newPercent}% - 4px)\`;
        }
    }, 250);
});

// Event listeners
runBtn.addEventListener('click', runCode);
clearBtn.addEventListener('click', clearAll);
exportBtn.addEventListener('click', exportCode);
shareBtn.addEventListener('click', shareCode);
updateShareBtn.addEventListener('click', updateShareLink);
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

            alert(\`Loaded: \${shareData.name || 'Untitled'}\`);
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
loadCodedFileBtn.innerHTML = '📂 Load .coded File';
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

// Insert after "Share Link" button in menu
if (shareBtn && shareBtn.parentNode) {
    shareBtn.parentNode.insertBefore(loadCodedFileBtn, shareBtn.nextSibling);
}

initializeTemplateSelector();
// Learning Panel functionality - Panel-specific
const htmlLearnBtn = document.getElementById('htmlLearnBtn');
const cssLearnBtn = document.getElementById('cssLearnBtn');
const jsLearnBtn = document.getElementById('jsLearnBtn');
const learnPanel = document.getElementById('learnPanel');
const learnPanelClose = document.getElementById('learnPanelClose');
const learnPanelContent = document.getElementById('learnPanelContent');
let currentLearnPanel = null;

// Educational content organized by panel
const PANEL_LESSONS = {
    'html': {
        title: 'HTML Fundamentals',
        sections: [
            {
                title: 'Document Structure',
                content: 'Every HTML page needs a <!DOCTYPE html> declaration, <html>, <head>, and <body> tags. This creates the foundation.',
                why: 'Browsers use DOCTYPE to determine rendering mode. Without it, you get "quirks mode" which causes layout inconsistencies.'
            },
            {
                title: 'Meta Tags',
                content: '<code>&lt;meta charset="UTF-8"&gt;</code> handles character encoding. <code>&lt;meta name="viewport"&gt;</code> makes sites responsive on mobile.',
                why: 'UTF-8 supports all languages. The viewport tag prevents mobile browsers from zooming out to desktop width by default.'
            },
            {
                title: 'Semantic HTML',
                content: 'Use tags like <code>&lt;header&gt;</code>, <code>&lt;main&gt;</code>, <code>&lt;article&gt;</code>, <code>&lt;nav&gt;</code>, and <code>&lt;footer&gt;</code> instead of generic <code>&lt;div&gt;</code> tags.',
                why: 'Screen readers use semantic tags to help users navigate. Search engines also use them to understand your content structure better.'
            },
            {
                title: 'Accessibility',
                content: 'Always include <code>alt</code> attributes on images, use <code>label</code> elements for form inputs, and structure headings hierarchically (h1→h2→h3).',
                why: '15% of the global population has some form of disability. Accessible HTML ensures everyone can use your site.'
            }
        ]
    },
    'css': {
        title: 'CSS Techniques',
        sections: [
            {
                title: 'Box Model',
                content: 'Every element has content, padding, border, and margin. Use <code>box-sizing: border-box</code> to include padding/border in width calculations.',
                why: 'Without border-box, a 200px wide div with 20px padding becomes 240px wide, breaking layouts.'
            },
            {
                title: 'Flexbox & Grid',
                content: '<code>display: flex</code> arranges items in one dimension (row or column). <code>display: grid</code> handles two-dimensional layouts.',
                why: 'These replace old float-based layouts. Grid is perfect for page structure, flex is ideal for component alignment.'
            },
            {
                title: 'CSS Variables',
                content: 'Define reusable values with <code>--variable-name: value</code> in <code>:root</code>, then use with <code>var(--variable-name)</code>.',
                why: 'Change your entire color scheme by updating one variable instead of searching/replacing hundreds of values.'
            },
            {
                title: 'Responsive Design',
                content: 'Use <code>@media</code> queries to apply different styles at different screen sizes. Mobile-first approach starts small and scales up.',
                why: 'Over 60% of web traffic is mobile. Responsive design ensures your site works everywhere.'
            },
            {
                title: 'CSS Transitions',
                content: '<code>transition: property duration easing</code> smoothly animates changes. Great for hover effects.',
                why: 'Sudden changes feel jarring. Transitions create smooth, professional-feeling interfaces that guide user attention.'
            }
        ]
    },
    'js': {
        title: 'JavaScript Essentials',
        sections: [
            {
                title: 'DOM Manipulation',
                content: 'Use <code>document.querySelector()</code> to find elements, <code>createElement()</code> to make new ones, <code>appendChild()</code> to add them.',
                why: 'This lets you update pages dynamically without reloading. Creates modern, app-like experiences.'
            },
            {
                title: 'Event Listeners',
                content: '<code>element.addEventListener("click", function)</code> runs code when users interact. Remove with <code>removeEventListener()</code>.',
                why: 'This is how you make pages interactive. Click buttons, submit forms, respond to keyboard input - all through events.'
            },
            {
                title: 'Template Literals',
                content: 'Backticks <code>`</code> create strings with embedded expressions: <code>`Hello ${name}`</code>. Multi-line support built-in.',
                why: 'Cleaner than string concatenation. Compare <code>`<div>${x}</div>`</code> to <code>"<div>" + x + "</div>"</code>.'
            },
            {
                title: 'Array Methods',
                content: '<code>.map()</code> transforms arrays, <code>.filter()</code> selects items, <code>.reduce()</code> combines values. Pure functions, no mutation.',
                why: 'These replace manual loops and make code more readable. Functional programming reduces bugs.'
            },
            {
                title: 'Async/Await',
                content: '<code>async function</code> lets you use <code>await</code> to pause for Promises. Makes asynchronous code look synchronous.',
                why: 'Callback hell is unreadable. Async/await makes API calls and database queries easy to follow.'
            }
        ]
    }
};

function showLearnPanel(panelType) {
    currentLearnPanel = panelType;
    const lesson = PANEL_LESSONS[panelType];

    if (!lesson) return;

    // Update panel content
    let html = `<h2 style="color: var(--accent-color); margin-bottom: 1.5rem;">${lesson.title}</h2>`;

    lesson.sections.forEach(section => {
        html += `
            <div class="learn-section">
                <h4>${section.title}</h4>
                <p>${section.content}</p>
                <div class="learn-why">
                    <strong>💡 Why it matters:</strong>
                    <p style="margin: 0;">${section.why}</p>
                </div>
            </div>
        `;
    });

    learnPanelContent.innerHTML = html;
    learnPanel.classList.add('active');

    // Close panel settings menus
    document.getElementById('htmlSettingsMenu').classList.remove('active');
    document.getElementById('cssSettingsMenu').classList.remove('active');
    document.getElementById('jsSettingsMenu').classList.remove('active');
}

function closeLearnPanel() {
    learnPanel.classList.remove('active');
    currentLearnPanel = null;
}

// Event listeners for each panel's learn button
if (htmlLearnBtn) {
    htmlLearnBtn.addEventListener('click', () => showLearnPanel('html'));
}
if (cssLearnBtn) {
    cssLearnBtn.addEventListener('click', () => showLearnPanel('css'));
}
if (jsLearnBtn) {
    jsLearnBtn.addEventListener('click', () => showLearnPanel('js'));
}
if (learnPanelClose) {
    learnPanelClose.addEventListener('click', closeLearnPanel);
}

// Initialize template selector
initializeTemplateSelector();
