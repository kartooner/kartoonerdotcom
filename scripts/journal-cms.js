#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const JOURNAL_FILE = path.join(__dirname, '..', 'journal-entries.json');
const STORIES_DIR = path.join(__dirname, '..', 'stories');
const ENTRY_DIR = path.join(__dirname, '..', 'entry');
const JOURNAL_DIR = path.join(__dirname, '..', 'journal');
const JOURNAL_HTML = path.join(JOURNAL_DIR, 'index.html');
const ARCHIVE_DIR = path.join(__dirname, '..', 'archive');
const ARCHIVE_HTML = path.join(ARCHIVE_DIR, 'index.html');

function loadJournal() {
    try {
        const content = fs.readFileSync(JOURNAL_FILE, 'utf8');
        return JSON.parse(content);
    } catch (error) {
        console.error('Error loading journal entries:', error.message);
        return { entries: [] };
    }
}

function saveJournal(journal) {
    try {
        fs.writeFileSync(JOURNAL_FILE, JSON.stringify(journal, null, 2), 'utf8');
        console.log('Journal entries saved successfully.');
    } catch (error) {
        console.error('Error saving journal entries:', error.message);
    }
}

function generateSlug(title) {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-');
}

function parseStoryFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        const metadata = {};
        let contentStart = 0;
        
        // Parse metadata from the beginning of the file
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line === '') {
                contentStart = i + 1;
                break;
            }
            
            const colonIndex = line.indexOf(':');
            if (colonIndex > 0) {
                const key = line.substring(0, colonIndex).trim().toLowerCase();
                const value = line.substring(colonIndex + 1).trim();
                
                switch (key) {
                    case 'title':
                        metadata.title = value;
                        break;
                    case 'subtitle':
                        metadata.subtitle = value;
                        break;
                    case 'date':
                        metadata.date = value;
                        break;
                    case 'tags':
                        metadata.tags = value.split(',').map(tag => tag.trim()).filter(tag => tag);
                        break;
                    case 'excerpt':
                        metadata.excerpt = value;
                        break;
                    case 'images':
                        metadata.images = value.split(',').map(img => img.trim()).filter(img => img);
                        break;
                }
            }
        }
        
        // Get the main content
        const mainContent = lines.slice(contentStart).join('\n').trim();
        
        // Generate ID from filename or title
        const filename = path.basename(filePath, '.txt');
        const id = filename.replace(/^\d{4}-\d{2}-\d{2}-/, '') || generateSlug(metadata.title || '');
        
        // Use excerpt or first 100 chars of content
        const excerpt = metadata.excerpt || mainContent.substring(0, 100) + '...';
        
        return {
            id,
            title: metadata.title || 'Untitled',
            subtitle: metadata.subtitle,
            date: metadata.date || new Date().toISOString(),
            content: mainContent,
            excerpt,
            tags: metadata.tags || [],
            images: metadata.images
        };
    } catch (error) {
        console.error(`Error parsing story file ${filePath}:`, error.message);
        return null;
    }
}

function syncStoriesFromFolder() {
    try {
        if (!fs.existsSync(STORIES_DIR)) {
            console.log('Stories directory does not exist. Creating it...');
            fs.mkdirSync(STORIES_DIR, { recursive: true });
            return { entries: [] };
        }
        
        const files = fs.readdirSync(STORIES_DIR)
            .filter(file => file.endsWith('.txt'))
            .sort((a, b) => b.localeCompare(a)); // Sort by filename (newest first due to date prefix)
        
        const entries = [];
        
        for (const file of files) {
            const filePath = path.join(STORIES_DIR, file);
            const entry = parseStoryFile(filePath);
            if (entry) {
                entries.push(entry);
            }
        }
        
        // Sort by date (newest first)
        entries.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        const journal = { entries };
        
        // Save to JSON file for consistency
        saveJournal(journal);
        
        console.log(`Synced ${entries.length} stories from /stories folder`);
        return journal;
        
    } catch (error) {
        console.error('Error syncing stories from folder:', error.message);
        return { entries: [] };
    }
}

function formatDate(date) {
    try {
        const parsedDate = new Date(date);
        if (isNaN(parsedDate.getTime())) {
            console.warn(`Invalid date value: ${date}`);
            return 'Invalid Date';
        }
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }).format(parsedDate);
    } catch (error) {
        console.warn(`Error formatting date ${date}:`, error.message);
        return 'Invalid Date';
    }
}

function convertMarkdownToHtml(markdown) {
    let html = markdown.replace(/\r\n/g, '\n'); // Normalize line endings
    
    // Split into blocks by double newlines
    const blocks = html.split('\n\n').filter(block => block.trim() !== '');
    const convertedBlocks = [];
    
    for (let block of blocks) {
        const lines = block.split('\n');
        
        // Check if it's a code block (fenced with ``` or indented)
        if ((lines[0].trim().startsWith('```') && lines[lines.length - 1].trim().startsWith('```')) ||
            lines.every(line => line.startsWith('    ') || line.trim() === '')) {
            
            if (lines[0].trim().startsWith('```')) {
                // Fenced code block
                const language = lines[0].replace('```', '').trim();
                const codeLines = lines.slice(1, -1);
                const code = codeLines.join('\n');
                convertedBlocks.push(`<pre><code class="language-${language || 'text'}">${escapeHtml(code)}</code></pre>`);
            } else {
                // Indented code block
                const code = lines.map(line => line.replace(/^    /, '')).join('\n');
                convertedBlocks.push(`<pre><code>${escapeHtml(code)}</code></pre>`);
            }
            continue;
        }
        
        // Check if it's a table (pipe-separated)
        if (lines.length >= 2 && lines.every(line => line.includes('|'))) {
            const headerRow = lines[0].split('|').map(cell => cell.trim()).filter(cell => cell);
            const separatorRow = lines[1];
            
            // Check if second row is separator (contains - and |)
            if (separatorRow.includes('-') && separatorRow.includes('|')) {
                const dataRows = lines.slice(2);
                
                let tableHtml = '<table><thead><tr>';
                headerRow.forEach(header => {
                    tableHtml += `<th>${processInlineMarkdown(header)}</th>`;
                });
                tableHtml += '</tr></thead><tbody>';
                
                dataRows.forEach(row => {
                    const cells = row.split('|').map(cell => cell.trim()).filter(cell => cell !== '');
                    if (cells.length > 0) {
                        tableHtml += '<tr>';
                        cells.forEach(cell => {
                            tableHtml += `<td>${processInlineMarkdown(cell)}</td>`;
                        });
                        tableHtml += '</tr>';
                    }
                });
                
                tableHtml += '</tbody></table>';
                convertedBlocks.push(tableHtml);
                continue;
            }
        }
        
        // Check if it's a blockquote block
        if (lines.every(line => line.trim().startsWith('>'))) {
            const quoteLines = lines.map(line => line.replace(/^>\s*/, ''));
            const sourceMatch = quoteLines[quoteLines.length - 1].match(/^— (.+)$/);
            
            if (sourceMatch) {
                const quote = processInlineMarkdown(quoteLines.slice(0, -1).join(' '));
                const source = processInlineMarkdown(sourceMatch[1]);
                convertedBlocks.push(`<blockquote><p>${quote}</p><p class="source">${source}</p></blockquote>`);
            } else {
                const quote = processInlineMarkdown(quoteLines.join(' '));
                convertedBlocks.push(`<blockquote><p>${quote}</p></blockquote>`);
            }
            continue;
        }
        
        // Check if it's an unordered list block (- or * or +)
        if (lines.every(line => line.trim().match(/^[-*+]\s/))) {
            const items = lines.map(line => {
                const content = line.replace(/^[-*+]\s*/, '');
                return `<li>${processInlineMarkdown(content)}</li>`;
            }).join('');
            convertedBlocks.push(`<ul>${items}</ul>`);
            continue;
        }
        
        // Check if it's an ordered list block
        if (lines.every(line => line.trim().match(/^\d+\.\s/))) {
            const items = lines.map(line => {
                const content = line.replace(/^\d+\.\s*/, '');
                return `<li>${processInlineMarkdown(content)}</li>`;
            }).join('');
            convertedBlocks.push(`<ol>${items}</ol>`);
            continue;
        }
        
        // Check if it's a heading (single line starting with #)
        if (lines.length === 1) {
            const line = lines[0].trim();
            const h1Match = line.match(/^# (.+)$/);
            const h2Match = line.match(/^## (.+)$/);
            const h3Match = line.match(/^### (.+)$/);
            const h4Match = line.match(/^#### (.+)$/);
            const h5Match = line.match(/^##### (.+)$/);
            const h6Match = line.match(/^###### (.+)$/);
            
            if (h6Match) {
                convertedBlocks.push(`<h6>${processInlineMarkdown(h6Match[1])}</h6>`);
                continue;
            } else if (h5Match) {
                convertedBlocks.push(`<h5>${processInlineMarkdown(h5Match[1])}</h5>`);
                continue;
            } else if (h4Match) {
                convertedBlocks.push(`<h4>${processInlineMarkdown(h4Match[1])}</h4>`);
                continue;
            } else if (h3Match) {
                convertedBlocks.push(`<h3>${processInlineMarkdown(h3Match[1])}</h3>`);
                continue;
            } else if (h2Match) {
                convertedBlocks.push(`<h2>${processInlineMarkdown(h2Match[1])}</h2>`);
                continue;
            } else if (h1Match) {
                convertedBlocks.push(`<h1>${processInlineMarkdown(h1Match[1])}</h1>`);
                continue;
            }
        }
        
        // Check if it's a horizontal rule
        if (lines.length === 1 && lines[0].trim().match(/^(-{3,}|\*{3,}|_{3,})$/)) {
            convertedBlocks.push('<hr>');
            continue;
        }
        
        // Regular paragraph
        const paragraphContent = block.replace(/\n/g, ' ');
        convertedBlocks.push(`<p>${processInlineMarkdown(paragraphContent)}</p>`);
    }
    
    return convertedBlocks.join('\n\n');
}

// Helper function to process inline markdown (bold, italic, links, code, etc.)
function processInlineMarkdown(text) {
    // Escape HTML first
    let processed = escapeHtml(text);
    
    // Process inline code first (so it's not affected by other formatting)
    processed = processed.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Process links [text](url)
    processed = processed.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    
    // Process bold **text** or __text__
    processed = processed.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    processed = processed.replace(/__([^_]+)__/g, '<strong>$1</strong>');
    
    // Process italic *text* or _text_ (but not inside words)
    processed = processed.replace(/(?<!\w)\*([^*]+)\*(?!\w)/g, '<em>$1</em>');
    processed = processed.replace(/(?<!\w)_([^_]+)_(?!\w)/g, '<em>$1</em>');
    
    // Process strikethrough ~~text~~
    processed = processed.replace(/~~([^~]+)~~/g, '<del>$1</del>');
    
    return processed;
}

// Helper function to escape HTML
function escapeHtml(text) {
    const div = { innerHTML: '' };
    div.textContent = text;
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function generateEntryPages(journal) {
    // Create entry directory if it doesn't exist
    if (!fs.existsSync(ENTRY_DIR)) {
        fs.mkdirSync(ENTRY_DIR, { recursive: true });
    }

    journal.entries.forEach(entry => {
        const contentHtml = convertMarkdownToHtml(entry.content);
        const subtitleHtml = entry.subtitle ? `<h2>${entry.subtitle}</h2>` : '';
        const imagesHtml = entry.images ? entry.images.map(img => 
            `<img src="${img}" alt="Illustration accompanying the journal entry" data-progressive loading="lazy" />`).join('\n            ') : '';

        const template = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${entry.title} - Erik's Journal</title>
    <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;700&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet">
    <link rel="stylesheet" href="/style.css">
    <style>
        .entry-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 0 2em;
        }
        
        h1, h2, h3 {
            color: var(--text-color);
        }


        .logo {
            text-align: center;
            font-family: var(--font-secondary);
            font-size: 3rem;
            color: var(--accent-color);
            margin-bottom: 20px;
        }
        
        .logo a {
            color: var(--accent-color);
            text-decoration: none;
            transition: color 0.3s ease;
        }
        
        .logo a:hover {
            color: var(--text-color);
        }
        
        .entry-header {
            margin-bottom: 20px;
        }

        .entry-date {
            color: var(--skills-color);
            margin-bottom: 10px;
            font-size: 1rem;
        }

        .entry-title {
            font-family: var(--font-secondary);
            font-size: 4.5rem;
            line-height: 0.95;
            margin-bottom: 15px;
            color: var(--heading-color);
        }
        
        .entry-byline {
            color: var(--skills-color);
            font-size: 1rem;
            margin-bottom: 15px;
            font-style: italic;
        }
        
        .entry-subtitle {
            font-family: var(--font-secondary);
            font-size: 1.2rem;
            color: var(--text-color);
            margin-bottom: 20px;
        }

        .entry-content {
            color: var(--text-color);
            line-height: 1.6;
        }
        
        .entry-content p:first-of-type {
            font-size: var(--text-lg);
            line-height: var(--leading-normal);
        }
        
        /* Code styling */
        .entry-content pre {
            background: rgba(0, 0, 0, 0.1);
            border-radius: 4px;
            padding: 1rem;
            overflow-x: auto;
            margin: 1rem 0;
        }
        
        [data-theme="dark"] .entry-content pre {
            background: rgba(255, 255, 255, 0.1);
        }
        
        .entry-content code {
            background: rgba(0, 0, 0, 0.1);
            padding: 0.2em 0.4em;
            border-radius: 3px;
            font-family: 'Courier New', Consolas, monospace;
            font-size: 0.9em;
        }
        
        [data-theme="dark"] .entry-content code {
            background: rgba(255, 255, 255, 0.1);
        }
        
        .entry-content pre code {
            background: none;
            padding: 0;
        }
        
        /* Table styling */
        .entry-content table {
            width: 100%;
            border-collapse: collapse;
            margin: 1rem 0;
            overflow-x: auto;
            display: block;
            white-space: nowrap;
        }
        
        .entry-content table thead {
            display: table-header-group;
        }
        
        .entry-content table tbody {
            display: table-row-group;
        }
        
        .entry-content table tr {
            display: table-row;
        }
        
        .entry-content table th,
        .entry-content table td {
            display: table-cell;
            border: 1px solid var(--skills-color);
            padding: 0.5rem;
            text-align: left;
            white-space: normal;
        }
        
        .entry-content table th {
            background: rgba(0, 0, 0, 0.1);
            font-weight: bold;
        }
        
        [data-theme="dark"] .entry-content table th {
            background: rgba(255, 255, 255, 0.1);
        }
        
        /* Links */
        .entry-content a {
            color: var(--accent-color);
            text-decoration: none;
            border-bottom: 1px solid transparent;
            transition: border-color 0.2s ease;
        }
        
        .entry-content a:hover {
            border-bottom-color: var(--accent-color);
        }
        
        blockquote p.source {
            font-family: var(--font-main);
            font-size: 1rem;
        }
        
        blockquote p.source::before {
            content: "— ";
        }
        
        .navigation {
            display: flex;
            justify-content: center;
            margin: 40px 0;
        }

        .view-all {
            color: var(--text-color) !important;
            text-decoration: none !important;
            padding: 0.5rem 1rem !important;
            border: 1px solid var(--tertiary-color) !important;
            border-radius: 4px !important;
            transition: all 0.3s ease !important;
            font-size: 1rem !important;
            background: none !important;
            display: inline-block !important;
        }

        .view-all:hover {
            color: var(--accent-color) !important;
            border-color: var(--accent-color) !important;
            transform: translateY(-2px) !important;
            background: none !important;
        }

        .info-section {
            background: rgba(var(--accent-rgb), 0.08);
            padding: 2rem;
            border-radius: 8px;
            margin: 2rem 0;
        }

        .info-section p {
            text-align: left;
            font-size: 1rem;
            color: var(--text-color-secondary, var(--skills-color));
            margin-bottom: 0.75rem;
            line-height: 1.4;
        }

        .info-section-row {
            display: flex;
            gap: 1.5rem;
        }

        .info-section a {
            color: var(--skills-color);
            text-decoration: none;
            font-size: 0.8rem;
            transition: color 0.3s ease;
            display: inline-flex;
            align-items: center;
            gap: 0.375rem;
        }

        .info-section a:hover {
            color: var(--accent-color);
        }

        .info-section .material-symbols-outlined {
            font-size: 1rem;
        }

        .info-section p .material-symbols-outlined {
            font-size: 1.1rem;
            margin-right: 0.5rem;
            vertical-align: text-bottom;
        }

        
        /* Responsive scaling for entry title */
        @media (max-width: 768px) {
            .entry-title {
                font-size: 3.5rem;
            }
        }
        
        @media (max-width: 500px) {
            .entry-title {
                font-size: 2.8rem;
            }
        }
    </style>
</head>
<body>
    <!-- Skip Navigation Link -->
    <a href="#main-content" class="skip-link">Skip to main content</a>
    
    <!-- Persistent Navigation -->
    <nav class="persistent-nav" aria-label="Site navigation">
        <!-- Mobile menu button -->
        <button class="mobile-menu-toggle" aria-label="Toggle navigation menu" aria-expanded="false">
            <span class="menu-text">Menu</span>
        </button>
        
        <!-- Navigation links -->
        <div class="nav-links">
            <button class="mobile-close-button" aria-label="Close navigation menu">
                <span class="close-text">×</span>
            </button>
            <a href="/">Home</a>
            <a href="/about">About</a>
            <a href="/journal" class="current" aria-current="page">Journal</a>
            <a href="/contact">Contact</a>
        </div>
    </nav>
    
    <!-- Theme Toggle -->
    <button id="theme-toggle" class="theme-toggle" aria-label="Toggle theme" aria-pressed="false">
        <span class="theme-toggle-icon">🌙</span>
        <span class="theme-toggle-text">Dark mode</span>
    </button>

    <div class="entry-container">
        <div class="entry-header" id="main-content">
            <div class="entry-date"># &bull; ${formatDate(entry.date)} &bull; Erik Sagen</div>
            <h1 class="entry-title">${entry.title}</h1>
            ${entry.subtitle ? `<div class="entry-subtitle">${entry.subtitle}</div>` : ''}
        </div>

        <div class="entry">
            <div class="entry-content">
                ${imagesHtml}
                ${contentHtml}
            </div>
        </div>

        <hr class="divider" />
        
        <div class="navigation">
            <a href="/archive" class="view-all">View all posts</a>
        </div>
        
        <div class="info-section">
            <p><span class="material-symbols-outlined">family_star</span> <strong>Have an RSS reader?</strong> Try grabbing a feed of your choice and you'll get the latest blog post from me when it's published:</p>
            <div class="info-section-row">
                <a href="/journal-atom.xml"><span class="material-symbols-outlined">rss_feed</span>Atom Feed</a>
                <a href="/journal-feed.xml"><span class="material-symbols-outlined">rss_feed</span>RSS Feed</a>
            </div>
        </div>
        
    </main>
</div>

<footer class="animate-fade-in animate-footer" role="contentinfo" aria-label="Site footer">
    <div class="footer-container">
        <div class="arcade-gif">
            <img src="img/erik-arcade.gif" loading="lazy" alt="Retro pixel art arcade cabinet with character playing" data-progressive />
        </div>

        <div class="webring" role="region" aria-label="CSS Joy Webring navigation">
            <strong>CSS Joy Webring</strong>
            <div class="webring-links">
                <a href="https://webri.ng/webring/cssjoy/previous?via=https://www.kartooner.com">Previous</a>
                <a href="https://webri.ng/webring/cssjoy/random?via=https://www.kartooner.com">Random</a>
                <a href="https://webri.ng/webring/cssjoy/next?via=https://www.kartooner.com">Next</a>
            </div>
        </div>

        <p class="changelog">&copy; 2025 Erik Sagen. Built with care in Rochester, NY <span id="weather"></span>. <a href="https://github.com/kartooner/kartoonerdotcom?tab=MIT-1-ov-file" target="_blank" rel="noopener noreferrer" aria-label="View the MIT license on Github, opens in a new tab">Code licensed under MIT</a>. <a href="/thanks">Special thanks</a>. <a href="/atom.xml" target="_blank" rel="noopener noreferrer" aria-label="Subscribe to RSS feed">RSS</a></p>
    </div>
</footer>
    
    <script src="/app.min.js"></script>
</body>
</html>`;

        try {
            const entryPath = path.join(ENTRY_DIR, `${entry.id}.html`);
            fs.writeFileSync(entryPath, template, 'utf8');
        } catch (error) {
            console.error(`Error generating entry page for ${entry.id}:`, error.message);
        }
    });

    console.log(`Generated ${journal.entries.length} individual entry pages`);
}

function generateJournalHtml(journal) {
    // Create journal directory if it doesn't exist
    if (!fs.existsSync(JOURNAL_DIR)) {
        fs.mkdirSync(JOURNAL_DIR, { recursive: true });
    }

    const entries = journal.entries
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 1); // Show only the latest post in full

    const recentEntries = journal.entries
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(1, 4) // Next 3 posts for compact list
        .map(entry => `
                <dt><a href="/entry/${entry.id}.html">${entry.title}</a></dt>
                <dd>${entry.subtitle || entry.excerpt}</dd>`).join('\n                ');

    const postsHtml = entries.map(entry => {
        const contentHtml = convertMarkdownToHtml(entry.content);
        const subtitleHtml = entry.subtitle ? `<div class="post-subtitle">${entry.subtitle}</div>` : '';
        const imagesHtml = entry.images ? entry.images.map(img => 
            `<img src="${img}" alt="Illustration accompanying the journal entry" data-progressive loading="lazy" />`).join('\n            ') : '';

        return `
    <div class="post">
        <div class="post-date"><a href="/entry/${entry.id}.html">#</a> &bull; ${formatDate(entry.date)} &bull; Erik Sagen</div>
        <h2 class="post-title"><a href="/entry/${entry.id}.html">${entry.title}</a></h2>
        ${subtitleHtml}
        <div class="post-content">
            ${imagesHtml}
            ${contentHtml}
        </div>
    </div>`;
    }).join('\n\n    <hr class="divider" />\n');

    const template = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Journal</title>
    <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;700&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet">
    <link rel="stylesheet" href="/style.css">
    <style>

        .journal-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 0 2em;
        }
        
        h1, h2, h3 {
            color: var(--text-color);
        }


        .logo {
            text-align: center;
            font-family: var(--font-secondary);
            font-size: 5rem;
            color: var(--accent-color);
        }

        .post {
            margin-bottom: 40px;
        }

        .post-date {
            color: var(--skills-color);
            margin-bottom: 10px;
        }

        .post-title {
            font-family: var(--font-secondary);
            font-size: 2.8rem;
            line-height: 1em;
            margin-bottom: 10px;
            color: var(--heading-color);
        }

        .post-title a {
            text-decoration: none;
            transition: all 0.3s ease;
            display: inline-block;
        }

        .post-title a:hover,
        .post-title a:focus {
            color: var(--accent-color);
            transform: translateX(5px);
        }

        
        .post-subtitle {
            font-family: var(--font-secondary);
            font-size: 1.2rem;
            color: var(--text-color);
            margin-bottom: 20px;
        }

        .post-content {
            margin-bottom: 20px;
            color: var(--text-color);
        }
        
        .post-content p:first-of-type {
            font-size: var(--text-lg);
            line-height: var(--leading-normal);
        }
        
        /* Code styling */
        .post-content pre {
            background: rgba(0, 0, 0, 0.1);
            border-radius: 4px;
            padding: 1rem;
            overflow-x: auto;
            margin: 1rem 0;
        }
        
        [data-theme="dark"] .post-content pre {
            background: rgba(255, 255, 255, 0.1);
        }
        
        .post-content code {
            background: rgba(0, 0, 0, 0.1);
            padding: 0.2em 0.4em;
            border-radius: 3px;
            font-family: 'Courier New', Consolas, monospace;
            font-size: 0.9em;
        }
        
        [data-theme="dark"] .post-content code {
            background: rgba(255, 255, 255, 0.1);
        }
        
        .post-content pre code {
            background: none;
            padding: 0;
        }
        
        /* Table styling */
        .post-content table {
            width: 100%;
            border-collapse: collapse;
            margin: 1rem 0;
            overflow-x: auto;
            display: block;
            white-space: nowrap;
        }
        
        .post-content table thead {
            display: table-header-group;
        }
        
        .post-content table tbody {
            display: table-row-group;
        }
        
        .post-content table tr {
            display: table-row;
        }
        
        .post-content table th,
        .post-content table td {
            display: table-cell;
            border: 1px solid var(--skills-color);
            padding: 0.5rem;
            text-align: left;
            white-space: normal;
        }
        
        .post-content table th {
            background: rgba(0, 0, 0, 0.1);
            font-weight: bold;
        }
        
        [data-theme="dark"] .post-content table th {
            background: rgba(255, 255, 255, 0.1);
        }
        
        /* Links */
        .post-content a {
            color: var(--accent-color);
            text-decoration: none;
            border-bottom: 1px solid transparent;
            transition: border-color 0.2s ease;
        }
        
        .post-content a:hover {
            border-bottom-color: var(--accent-color);
        }
        
        blockquote p.source {
            font-family: var(--font-main);
            font-size: 1rem;
        }
        
        blockquote p.source::before {
            content: "— ";
        }

        .recent-posts {
            font-family: var(--font-secondary);
            margin-top: 40px;
        }
        
        .recent-posts h3 {
            font-size: 2rem;
            color: var(--accent-color);
            margin-bottom: 30px;
        }

        .post-list {
            margin: 0;
            padding: 0;
        }
        
        .post-list dt {
            margin-bottom: 8px;
            margin-top: 25px;
        }
        
        .post-list dt:first-child {
            margin-top: 0;
        }
        
        .post-list dt a {
            font-size: 1.4rem;
            color: var(--text-color);
            text-decoration: none;
            transition: all 0.3s ease;
            display: inline-block;
            font-weight: 500;
        }

        .post-list dt a:hover,
        .post-list dt a:focus {
            color: var(--accent-color);
            text-decoration: none;
        }
        
        .post-list dd {
            color: var(--text-color);
            margin-left: 0;
            margin-bottom: 0;
            font-size: 1rem;
            line-height: 1.4;
        }

        footer {
            display: flex;
            justify-content: center;
            margin-bottom: 2.5rem; /* 40px */
            margin-top: 40px;
        }

        .view-all {
            color: var(--text-color) !important;
            text-decoration: none !important;
            padding: 0.5rem 1rem !important;
            border: 1px solid var(--tertiary-color) !important;
            border-radius: 4px !important;
            transition: all 0.3s ease !important;
            font-size: 1rem !important;
            background: none !important;
            display: inline-block !important;
        }

        .view-all:hover {
            color: var(--accent-color) !important;
            border-color: var(--accent-color) !important;
            transform: translateY(-2px) !important;
            background: none !important;
        }

        .info-section {
            background: rgba(var(--accent-rgb), 0.08);
            padding: 2rem;
            border-radius: 8px;
            margin: 2rem 0;
        }

        .info-section p {
            text-align: left;
            font-size: 1rem;
            color: var(--text-color-secondary, var(--skills-color));
            margin-bottom: 0.75rem;
            line-height: 1.4;
        }

        .info-section-row {
            display: flex;
            gap: 1.5rem;
        }

        .info-section a {
            color: var(--skills-color);
            text-decoration: none;
            font-size: 0.8rem;
            transition: color 0.3s ease;
            display: inline-flex;
            align-items: center;
            gap: 0.375rem;
        }

        .info-section a:hover {
            color: var(--accent-color);
        }

        .info-section .material-symbols-outlined {
            font-size: 1rem;
        }

        .info-section p .material-symbols-outlined {
            font-size: 1.1rem;
            margin-right: 0.5rem;
            vertical-align: text-bottom;
        }


    </style>
</head>
<body>
    <!-- Persistent Navigation -->
    <nav class="persistent-nav" aria-label="Site navigation">
        <!-- Mobile menu button -->
        <button class="mobile-menu-toggle" aria-label="Toggle navigation menu" aria-expanded="false">
            <span class="menu-text">Menu</span>
        </button>
        
        <!-- Navigation links -->
        <div class="nav-links">
            <button class="mobile-close-button" aria-label="Close navigation menu">
                <span class="close-text">×</span>
            </button>
            <a href="/">Home</a>
            <a href="/about">About</a>
            <a href="/journal" class="current" aria-current="page">Journal</a>
            <a href="/contact">Contact</a>
        </div>
    </nav>
    
    <!-- Theme Toggle -->
    <button id="theme-toggle" class="theme-toggle" aria-label="Toggle theme" aria-pressed="false">
        <span class="theme-toggle-icon">🌙</span>
        <span class="theme-toggle-text">Dark mode</span>
    </button>

    <div class="journal-container animate-fade-in animate-main">
        <h1 class="logo animate-fade-in animate-header">Journal</h1>
        <hr class="divider animate-fade-in animate-header" />

        ${postsHtml}

        <hr class="divider animate-fade-in animate-main" />

        <div class="recent-posts animate-fade-in animate-footer">
            <h3>Recent posts</h3>
            
            <dl class="post-list">
                ${recentEntries}
            </dl>
            
            <footer>
                <a href="/archive" class="view-all">View all posts</a>
            </footer>
        </div>
        
        <div class="feed-links animate-fade-in animate-footer">
            <p><span class="material-symbols-outlined">family_star</span> <strong>Have an RSS reader?</strong> Try grabbing a feed of your choice and you'll get the latest blog post from me when it's published:</p>
            <div class="info-section-row">
                <a href="/journal-atom.xml"><span class="material-symbols-outlined">rss_feed</span>Atom Feed</a>
                <a href="/journal-feed.xml"><span class="material-symbols-outlined">rss_feed</span>RSS Feed</a>
            </div>
        </div>
        
    </main>
</div>

<footer class="animate-fade-in animate-footer" role="contentinfo" aria-label="Site footer">
    <div class="footer-container">
        <div class="arcade-gif">
            <img src="img/erik-arcade.gif" loading="lazy" alt="Retro pixel art arcade cabinet with character playing" data-progressive />
        </div>

        <div class="webring" role="region" aria-label="CSS Joy Webring navigation">
            <strong>CSS Joy Webring</strong>
            <div class="webring-links">
                <a href="https://webri.ng/webring/cssjoy/previous?via=https://www.kartooner.com">Previous</a>
                <a href="https://webri.ng/webring/cssjoy/random?via=https://www.kartooner.com">Random</a>
                <a href="https://webri.ng/webring/cssjoy/next?via=https://www.kartooner.com">Next</a>
            </div>
        </div>

        <p class="changelog">&copy; 2025 Erik Sagen. Built with care in Rochester, NY <span id="weather"></span>. <a href="https://github.com/kartooner/kartoonerdotcom?tab=MIT-1-ov-file" target="_blank" rel="noopener noreferrer" aria-label="View the MIT license on Github, opens in a new tab">Code licensed under MIT</a>. <a href="/thanks">Special thanks</a>. <a href="/atom.xml" target="_blank" rel="noopener noreferrer" aria-label="Subscribe to RSS feed">RSS</a></p>
    </div>
</footer>
    
    <script src="/app.min.js"></script>
</body>
</html>`;

    try {
        fs.writeFileSync(JOURNAL_HTML, template, 'utf8');
        console.log('Journal HTML generated successfully.');
    } catch (error) {
        console.error('Error generating blog HTML:', error.message);
    }
}

function generateArchiveHtml(journal) {
    // Create archive directory if it doesn't exist
    if (!fs.existsSync(ARCHIVE_DIR)) {
        fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
    }

    const entriesByYear = journal.entries
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .reduce((acc, entry) => {
            const entryDate = new Date(entry.date);
            const year = entryDate.getTime() ? entryDate.getFullYear() : new Date().getFullYear();
            if (!acc[year]) acc[year] = [];
            acc[year].push(entry);
            return acc;
        }, {});

    const yearsHtml = Object.entries(entriesByYear)
        .sort(([a], [b]) => b - a)
        .map(([year, entries]) => {
            const entriesHtml = entries.map(entry => `
            <div class="archive-entry">
                <div class="entry-date">${formatDate(entry.date)}</div>
                <h3><a href="/entry/${entry.id}.html">${entry.title}</a></h3>
                <p class="entry-excerpt">${entry.excerpt}</p>
            </div>`).join('');

            return `
        <div class="year-section">
            <h2>${year}</h2>
            ${entriesHtml}
        </div>`;
        }).join('');

    const template = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Archive - Journal</title>
    <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;700&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet">
    <link rel="stylesheet" href="/style.css">
    <style>
        .archive-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 0 2em;
        }
        
        .logo {
            text-align: center;
            font-family: var(--font-secondary);
            font-size: 5rem;
            color: var(--accent-color);
        }
        
        .year-section {
            margin-bottom: 40px;
        }
        
        .year-section h2 {
            font-family: var(--font-secondary);
            font-size: 2.5rem;
            color: var(--accent-color);
            border-bottom: 2px solid var(--accent-color);
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        
        .archive-entry {
            margin-bottom: 30px;
            padding: 20px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        [data-theme="light"] .archive-entry {
            background: rgba(0, 0, 0, 0.03);
            border: 1px solid rgba(0, 0, 0, 0.1);
        }
        
        .entry-date {
            color: var(--skills-color);
            font-size: 1rem;
            margin-bottom: 5px;
        }
        
        .archive-entry h3 {
            margin: 0 0 10px 0;
        }
        
        .archive-entry h3 a {
            color: var(--heading-color);
            text-decoration: none;
            transition: color 0.3s ease;
        }
        
        .archive-entry h3 a:hover {
            color: var(--accent-color);
        }
        
        .entry-excerpt {
            color: var(--skills-color);
            line-height: 1.5;
            margin: 0;
        }
    </style>
</head>
<body>
    <!-- Skip Navigation Link -->
    <a href="#main-content" class="skip-link">Skip to main content</a>
    
    <!-- Persistent Navigation -->
    <nav class="persistent-nav" aria-label="Site navigation">
        <!-- Mobile menu button -->
        <button class="mobile-menu-toggle" aria-label="Toggle navigation menu" aria-expanded="false">
            <span class="menu-text">Menu</span>
        </button>
        
        <!-- Navigation links -->
        <div class="nav-links">
            <button class="mobile-close-button" aria-label="Close navigation menu">
                <span class="close-text">×</span>
            </button>
            <a href="/">Home</a>
            <a href="/about">About</a>
            <a href="/journal" class="current" aria-current="page">Journal</a>
            <a href="/contact">Contact</a>
        </div>
    </nav>
    
    <!-- Theme Toggle -->
    <button id="theme-toggle" class="theme-toggle" aria-label="Toggle theme" aria-pressed="false">
        <span class="theme-toggle-icon">🌙</span>
        <span class="theme-toggle-text">Dark mode</span>
    </button>

    <div class="archive-container">
        <main id="main-content" tabindex="-1">
            <h1 class="logo">Archive</h1>
            <hr class="divider" />

            ${yearsHtml}

            
            <footer class="animate-fade-in animate-footer" role="contentinfo" aria-label="Site footer">
                <div class="footer-container">
                    <div class="arcade-gif">
                        <img src="img/erik-arcade.gif" loading="lazy" alt="Retro pixel art arcade cabinet with character playing" data-progressive />
                    </div>

                    <div class="webring" role="region" aria-label="CSS Joy Webring navigation">
                        <strong>CSS Joy Webring</strong>
                        <div class="webring-links">
                            <a href="https://webri.ng/webring/cssjoy/previous?via=https://www.kartooner.com">Previous</a>
                            <a href="https://webri.ng/webring/cssjoy/random?via=https://www.kartooner.com">Random</a>
                            <a href="https://webri.ng/webring/cssjoy/next?via=https://www.kartooner.com">Next</a>
                        </div>
                    </div>

                    <p class="changelog">&copy; 2025 Erik Sagen. Built with care in Rochester, NY <span id="weather"></span>. <a href="https://github.com/kartooner/kartoonerdotcom?tab=MIT-1-ov-file" target="_blank" rel="noopener noreferrer" aria-label="View the MIT license on Github, opens in a new tab">Code licensed under MIT</a>. <a href="/thanks">Special thanks</a>. <a href="/atom.xml" target="_blank" rel="noopener noreferrer" aria-label="Subscribe to RSS feed">RSS</a></p>
                </div>
            </footer>
        </main>
    </div>
    
    <script src="/app.min.js"></script>
</body>
</html>`;

    try {
        fs.writeFileSync(ARCHIVE_HTML, template, 'utf8');
        console.log('Archive HTML generated successfully.');
    } catch (error) {
        console.error('Error generating archive HTML:', error.message);
    }
}

function generateRSSFeed(journal) {
    const entries = journal.entries
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 10); // Latest 10 entries

    const items = entries.map(entry => {
        const contentHtml = convertMarkdownToHtml(entry.content);
        return `
    <item>
      <title><![CDATA[${entry.title}]]></title>
      <link>https://kartooner.com/entry/${entry.id}.html</link>
      <guid>https://kartooner.com/entry/${entry.id}.html</guid>
      <pubDate>${new Date(entry.date).getTime() ? new Date(entry.date).toUTCString() : new Date().toUTCString()}</pubDate>
      <description><![CDATA[${entry.excerpt}]]></description>
      <content:encoded><![CDATA[${contentHtml}]]></content:encoded>
    </item>`;
    }).join('');

    const rssContent = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Erik's Journal</title>
    <link>https://kartooner.com</link>
    <description>Personal journal entries from Erik Sagen</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <generator>Journal CMS</generator>
    ${items}
  </channel>
</rss>`;

    try {
        fs.writeFileSync(path.join(__dirname, 'journal-feed.xml'), rssContent, 'utf8');
        console.log('RSS feed generated successfully.');
    } catch (error) {
        console.error('Error generating RSS feed:', error.message);
    }
}

function generateAtomFeed(journal) {
    const entries = journal.entries
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 10); // Latest 10 entries

    const atomEntries = entries.map(entry => {
        const contentHtml = convertMarkdownToHtml(entry.content);
        return `
  <entry xml:lang="en">
    <title><![CDATA[${entry.title}]]></title>
    <published>${new Date(entry.date).getTime() ? new Date(entry.date).toISOString() : new Date().toISOString()}</published>
    <updated>${new Date(entry.date).getTime() ? new Date(entry.date).toISOString() : new Date().toISOString()}</updated>
    <link href="https://kartooner.com/entry/${entry.id}.html" type="text/html" />
    <id>https://kartooner.com/entry/${entry.id}.html</id>
    <author>
      <name><![CDATA[Erik Sagen]]></name>
    </author>
    <category term="Journal" />
    <content type="html"><![CDATA[${contentHtml}]]></content>
  </entry>`;
    }).join('');

    const atomContent = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="en">
  <title><![CDATA[Erik's Journal]]></title>
  <subtitle><![CDATA[Personal journal entries from Erik Sagen]]></subtitle>
  <link href="https://kartooner.com/journal-atom.xml" rel="self" type="application/atom+xml" />
  <link href="https://kartooner.com/journal" />
  <generator uri="https://kartooner.com">Journal CMS</generator>
  <updated>${new Date().toISOString()}</updated>
  <id>https://kartooner.com/journal-atom.xml</id>
  ${atomEntries}
</feed>`;

    try {
        fs.writeFileSync(path.join(__dirname, 'journal-atom.xml'), atomContent, 'utf8');
        console.log('Atom feed generated successfully.');
    } catch (error) {
        console.error('Error generating Atom feed:', error.message);
    }
}

async function addEntry() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const question = (prompt) => new Promise(resolve => rl.question(prompt, resolve));

    try {
        console.log('\n--- Add New Journal Entry ---\n');
        
        const title = await question('Title: ');
        const subtitle = await question('Subtitle (optional): ');
        const content = await question('Content (markdown): ');
        const excerpt = await question('Excerpt (optional, will use first 100 chars if empty): ');
        const tags = await question('Tags (comma-separated): ');
        const images = await question('Image URLs (comma-separated, optional): ');

        const journal = loadJournal();
        const id = generateSlug(title);
        
        const newEntry = {
            id,
            title,
            date: new Date().toISOString(),
            content,
            excerpt: excerpt || content.substring(0, 100) + '...',
            tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag)
        };

        if (subtitle) newEntry.subtitle = subtitle;
        if (images) newEntry.images = images.split(',').map(img => img.trim()).filter(img => img);

        journal.entries.unshift(newEntry);
        
        saveJournal(journal);
        generateJournalHtml(journal);
        generateArchiveHtml(journal);
        generateEntryPages(journal);
        generateRSSFeed(journal);
        generateAtomFeed(journal);
        
        console.log(`\nEntry "${title}" added successfully!`);
        console.log(`ID: ${id}`);
        
    } catch (error) {
        console.error('Error adding entry:', error.message);
    } finally {
        rl.close();
    }
}

function regenerateAll() {
    const journal = loadJournal();
    generateJournalHtml(journal);
    generateArchiveHtml(journal);
    generateEntryPages(journal);
    generateRSSFeed(journal);
    generateAtomFeed(journal);
    console.log('All files regenerated successfully!');
}

function syncFromStories() {
    const journal = syncStoriesFromFolder();
    generateJournalHtml(journal);
    generateArchiveHtml(journal);
    generateEntryPages(journal);
    generateRSSFeed(journal);
    generateAtomFeed(journal);
    console.log('Stories synced and all files regenerated successfully!');
}

function listEntries() {
    const journal = loadJournal();
    console.log('\n--- Journal Entries ---\n');
    journal.entries
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .forEach((entry, index) => {
            console.log(`${index + 1}. ${entry.title}`);
            console.log(`   ID: ${entry.id}`);
            console.log(`   Date: ${formatDate(entry.date)}`);
            console.log(`   Tags: ${(entry.tags || []).join(', ')}`);
            console.log('');
        });
}

function showUsage() {
    console.log(`
Usage: node journal-cms.js <command>

Commands:
  add        Add a new journal entry (interactive)
  list       List all journal entries
  generate   Regenerate all HTML and RSS files from existing JSON
  sync       Sync stories from /stories folder to JSON and regenerate files
  help       Show this help message

Examples:
  node journal-cms.js add          # Interactive entry creation
  node journal-cms.js sync         # Parse /stories/*.txt files and build
  node journal-cms.js list         # Show all entries
  node journal-cms.js generate     # Rebuild from existing JSON

Story File Format (/stories/YYYY-MM-DD-title.txt):
  Title: Your Story Title
  Date: 2024-08-28T12:00:00Z
  Tags: tag1, tag2, tag3
  Excerpt: Brief description...
  Images: image1.jpg, image2.jpg
  
  Your story content goes here...
`);
}

// Main CLI handler
const command = process.argv[2];

switch (command) {
    case 'add':
        addEntry();
        break;
    case 'list':
        listEntries();
        break;
    case 'generate':
        regenerateAll();
        break;
    case 'sync':
        syncFromStories();
        break;
    case 'help':
    case '--help':
    case '-h':
        showUsage();
        break;
    default:
        console.log('Unknown command. Use "help" for usage information.');
        showUsage();
}