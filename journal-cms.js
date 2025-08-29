#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const JOURNAL_FILE = path.join(__dirname, 'journal-entries.json');
const STORIES_DIR = path.join(__dirname, 'stories');
const ENTRY_DIR = path.join(__dirname, 'entry');
const JOURNAL_DIR = path.join(__dirname, 'journal');
const JOURNAL_HTML = path.join(JOURNAL_DIR, 'index.html');
const ARCHIVE_HTML = path.join(__dirname, 'archive.html');

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
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }).format(new Date(date));
}

function convertMarkdownToHtml(markdown) {
    let html = markdown.replace(/\r\n/g, '\n'); // Normalize line endings
    
    // Split into blocks by double newlines
    const blocks = html.split('\n\n').filter(block => block.trim() !== '');
    const convertedBlocks = [];
    
    for (let block of blocks) {
        const lines = block.split('\n');
        
        // Check if it's a blockquote block
        if (lines.every(line => line.trim().startsWith('>'))) {
            const quoteLines = lines.map(line => line.replace(/^>\s*/, ''));
            const sourceMatch = quoteLines[quoteLines.length - 1].match(/^— (.+)$/);
            
            if (sourceMatch) {
                const quote = quoteLines.slice(0, -1).join(' ');
                const source = sourceMatch[1];
                convertedBlocks.push(`<blockquote><p>${quote}</p><p class="source">${source}</p></blockquote>`);
            } else {
                const quote = quoteLines.join(' ');
                convertedBlocks.push(`<blockquote><p>${quote}</p></blockquote>`);
            }
            continue;
        }
        
        // Check if it's an unordered list block
        if (lines.every(line => line.trim().startsWith('-'))) {
            const items = lines.map(line => `<li>${line.replace(/^-\s*/, '')}</li>`).join('');
            convertedBlocks.push(`<ul>${items}</ul>`);
            continue;
        }
        
        // Check if it's an ordered list block
        if (lines.every(line => line.trim().match(/^\d+\.\s/))) {
            const items = lines.map(line => `<li>${line.replace(/^\d+\.\s*/, '')}</li>`).join('');
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
            
            if (h4Match) {
                convertedBlocks.push(`<h4>${h4Match[1]}</h4>`);
                continue;
            } else if (h3Match) {
                convertedBlocks.push(`<h3>${h3Match[1]}</h3>`);
                continue;
            } else if (h2Match) {
                convertedBlocks.push(`<h2>${h2Match[1]}</h2>`);
                continue;
            } else if (h1Match) {
                convertedBlocks.push(`<h1>${h1Match[1]}</h1>`);
                continue;
            }
        }
        
        // Regular paragraph
        convertedBlocks.push(`<p>${block.replace(/\n/g, ' ')}</p>`);
    }
    
    return convertedBlocks.join('\n\n');
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
            `<img src="${img}" alt="Journal entry image" />`).join('\n            ') : '';

        const template = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${entry.title} - Erik's Journal</title>
    <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/style.css">
    <link rel="stylesheet" href="https://early.webawesome.com/webawesome@3.0.0-alpha.2/dist/themes/default.css" />
    <script type="module" src="https://early.webawesome.com/webawesome@3.0.0-alpha.2/dist/webawesome.loader.js"></script>
    <style>
        body {
            background: var(--bg-color);
            max-width: 800px;
            margin: 0 auto;
        }
        
        h1, h2, h3 {
            color: var(--text-color);
        }

        .entry img {
            margin: 1em 0;
            width: 100%;
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
            font-size: 0.9rem;
        }

        .entry-title {
            font-family: var(--font-secondary);
            font-size: 2.8rem;
            line-height: 1em;
            margin-bottom: 10px;
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
            color: var(--skills-color);
            font-style: italic;
            margin-bottom: 20px;
        }

        .entry-content {
            color: var(--skills-color);
            line-height: 1.6;
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
        
        .home-link {
            text-align: center;
            margin-top: 20px;
        }
        
        .home-link a {
            color: var(--skills-color);
            text-decoration: none;
            font-size: 0.9rem;
            transition: color 0.3s ease;
        }
        
        .home-link a:hover {
            color: var(--accent-color);
        }

        .feed-links {
            text-align: center;
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .feed-links a {
            color: var(--skills-color);
            text-decoration: none;
            font-size: 0.8rem;
            margin: 0 10px;
            transition: color 0.3s ease;
        }

        .feed-links a:hover {
            color: var(--accent-color);
        }
    </style>
</head>
<body>
    <!-- Theme Toggle -->
    <button id="theme-toggle" class="theme-toggle" aria-label="Toggle theme" aria-pressed="false">
        <span class="theme-toggle-icon">🌙</span>
        <span class="theme-toggle-text">Dark mode</span>
    </button>

    <div class="entry-header">
        <h1 class="logo"><a href="/journal">← Back to Journal</a></h1>
        <div class="entry-date">${formatDate(entry.date)}</div>
        <h1 class="entry-title">${entry.title}</h1>
        <div class="entry-byline">by Erik Sagen</div>
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
        <wa-button href="/archive.html" class="view-all">View all posts</wa-button>
    </div>
    <div class="home-link">
        <a href="/">← Back to Home</a>
        <div class="feed-links">
            <a href="/journal-atom.xml">Atom Feed</a>
            <a href="/journal-feed.xml">RSS Feed</a>
        </div>
    </div>
    
    <script src="/theme-toggle.js"></script>
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
        .slice(0, 3); // Show latest 3 posts

    const recentEntries = journal.entries
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(3, 7) // Next 4 posts for archive section
        .map(entry => `
        <div class="recent-post">
            <a href="/entry/${entry.id}.html">${entry.title}</a>
            <p class="post-date">${formatDate(entry.date)}</p>
        </div>`).join('');

    const postsHtml = entries.map(entry => {
        const contentHtml = convertMarkdownToHtml(entry.content);
        const subtitleHtml = entry.subtitle ? `<h3>${entry.subtitle}</h3>` : '';
        const imagesHtml = entry.images ? entry.images.map(img => 
            `<img src="${img}" alt="Journal entry image" />`).join('\n            ') : '';

        return `
    <div class="post">
        <div class="post-date"><a href="/entry/${entry.id}.html">#</a> &bull; ${formatDate(entry.date)}</div>
        <h2 class="post-title"><a href="/entry/${entry.id}.html">${entry.title}</a></h2>
        <div class="post-byline">by Erik Sagen</div>
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
    <link rel="stylesheet" href="/style.css">
    <link rel="stylesheet" href="https://early.webawesome.com/webawesome@3.0.0-alpha.2/dist/themes/default.css" />
    <script type="module" src="https://early.webawesome.com/webawesome@3.0.0-alpha.2/dist/webawesome.loader.js"></script>
    <style>

        body {
            background: var(--bg-color);
            max-width: 800px;
            margin: 0 auto;
        }
        
        h1, h2, h3 {
            color: var(--text-color);
        }

        .post img {
            margin: 1em 0;
            width: 100%;
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

        .post-byline {
            color: var(--skills-color);
            font-size: 1rem;
            margin-bottom: 15px;
            font-style: italic;
        }

        .post-content {
            margin-bottom: 20px;
            color: var(--skills-color);
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
        }

        .recent-post {
            margin-bottom: 20px;
        }

        .recent-post a {
            font-size: 1.4rem;
            color: var(--text-color);
            text-decoration: none;
            position: relative;
            padding-left: 0;
            transition: all 0.3s ease;
            display: inline-block;
        }

        .recent-post a:hover,
        .recent-post a:focus {
            color: var(--accent-color);
            padding-left: 10px;
            text-decoration: none;
        }

        .recent-post a::before {
            content: "→";
            position: absolute;
            left: -20px;
            opacity: 0;
            transition: all 0.3s ease;
        }

        .recent-post a:hover::before,
        .recent-post a:focus::before {
            left: 0;
            opacity: 1;
        }

        footer {
            display: flex;
            justify-content: center;
            margin-bottom: 2.5rem; /* 40px */
        }

        .home-link {
            text-align: center;
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .home-link a {
            color: var(--skills-color);
            text-decoration: none;
            font-size: 0.9rem;
            transition: color 0.3s ease;
        }

        .home-link a:hover {
            color: var(--accent-color);
        }

        .feed-links {
            text-align: center;
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .feed-links a {
            color: var(--skills-color);
            text-decoration: none;
            font-size: 0.8rem;
            margin: 0 10px;
            transition: color 0.3s ease;
        }

        .feed-links a:hover {
            color: var(--accent-color);
        }

    </style>
</head>
<body>
    <!-- Theme Toggle -->
    <button id="theme-toggle" class="theme-toggle" aria-label="Toggle theme" aria-pressed="false">
        <span class="theme-toggle-icon">🌙</span>
        <span class="theme-toggle-text">Dark mode</span>
    </button>

    <h1 class="logo">Journal</h1>
    <hr class="divider" />

    ${postsHtml}

    <hr class="divider" />

    <div class="recent-posts">
        ${recentEntries}
        <footer>
            <wa-button href="/archive.html" class="view-all">View all posts</wa-button>
        </footer>
    </div>
    
    <div class="home-link">
        <a href="/">← Back to Home</a>
        <div class="feed-links">
            <a href="/journal-atom.xml">Atom Feed</a>
            <a href="/journal-feed.xml">RSS Feed</a>
        </div>
    </div>
    
    <script src="/theme-toggle.js"></script>
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
    const entriesByYear = journal.entries
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .reduce((acc, entry) => {
            const year = new Date(entry.date).getFullYear();
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
                <h3><a href="entry/${entry.id}.html">${entry.title}</a></h3>
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
    <link rel="stylesheet" href="style.css">
    <link rel="stylesheet" href="https://early.webawesome.com/webawesome@3.0.0-alpha.2/dist/themes/default.css" />
    <script type="module" src="https://early.webawesome.com/webawesome@3.0.0-alpha.2/dist/webawesome.loader.js"></script>
    <style>
        body {
            background: var(--bg-color);
            max-width: 800px;
            margin: 0 auto;
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
            font-size: 0.9rem;
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
    
    <!-- Theme Toggle -->
    <button id="theme-toggle" class="theme-toggle" aria-label="Toggle theme" aria-pressed="false">
        <span class="theme-toggle-icon">🌙</span>
        <span class="theme-toggle-text">Dark mode</span>
    </button>

    <main id="main-content" tabindex="-1">
        <h1 class="logo">Archive</h1>
        <hr class="divider" />

        ${yearsHtml}

        <div style="text-align: center; margin: 40px 0;">
            <a href="journal" style="color: var(--accent-color); text-decoration: none;">← Back to Journal</a>
        </div>
    </main>
    
    <script src="/theme-toggle.js"></script>
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
      <pubDate>${new Date(entry.date).toUTCString()}</pubDate>
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
    <published>${new Date(entry.date).toISOString()}</published>
    <updated>${new Date(entry.date).toISOString()}</updated>
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