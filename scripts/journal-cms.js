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

// Calculate reading time from content
function calculateReadingTime(content) {
    // Remove HTML tags and markdown syntax for accurate word count
    const plainText = content
        .replace(/<[^>]+>/g, ' ')           // Remove HTML tags
        .replace(/```[\s\S]*?```/g, ' ')    // Remove code blocks
        .replace(/`[^`]+`/g, ' ')           // Remove inline code
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Convert [text](url) to text
        .replace(/[#*_~`]/g, ' ')           // Remove markdown symbols
        .replace(/\s+/g, ' ')               // Normalize whitespace
        .trim();

    // Count words
    const wordCount = plainText.split(/\s+/).filter(word => word.length > 0).length;

    // Average reading speed: 200-250 words per minute
    // Using 225 as middle ground
    const wordsPerMinute = 225;
    const minutes = Math.ceil(wordCount / wordsPerMinute);

    // Return formatted string
    if (minutes === 1) {
        return '1 min read';
    }
    return `${minutes} min read`;
}

// Helper function to create URL-safe IDs from heading text
function createHeadingId(text) {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-')      // Replace spaces with hyphens
        .replace(/-+/g, '-')       // Replace multiple hyphens with single
        .trim();
}

// Generate table of contents HTML
function generateTableOfContents(h2Headings) {
    if (!h2Headings || h2Headings.length < 3) {
        return '';
    }

    const tocItems = h2Headings.map(heading =>
        `<li><a href="#${heading.id}">${heading.text}</a></li>`
    ).join('\n                    ');

    const tocOptions = h2Headings.map(heading =>
        `<option value="${heading.id}">${heading.text}</option>`
    ).join('\n                    ');

    return `
        <nav class="table-of-contents collapsed" aria-label="Table of Contents" id="toc">
            <!-- Desktop version: collapsible jump list -->
            <div class="toc-desktop">
                <button class="toc-toggle" aria-expanded="false" aria-controls="toc-content">
                    <span class="toc-toggle-icon">▼</span>
                    <span class="toc-toggle-text">Jump to section</span>
                </button>
                <div class="toc-content" id="toc-content">
                    <ul class="toc-list">
                        ${tocItems}
                    </ul>
                </div>
            </div>

            <!-- Mobile version: collapsible dropdown -->
            <div class="toc-mobile">
                <button class="toc-mobile-toggle" aria-expanded="false" aria-controls="toc-mobile-content">
                    <span class="toc-mobile-toggle-icon">▼</span>
                    <span class="toc-mobile-toggle-text">Jump to section</span>
                </button>
                <div class="toc-mobile-content" id="toc-mobile-content">
                    <select id="toc-select" class="toc-select">
                        <option value="">Choose a section...</option>
                        ${tocOptions}
                    </select>
                </div>
            </div>
        </nav>
    `;
}

// Extract preview from content (first 2 paragraphs)
function getContentPreview(htmlContent) {
    // Match paragraphs
    const paragraphRegex = /<p>.*?<\/p>/gs;
    const paragraphs = htmlContent.match(paragraphRegex) || [];

    // If 3 or fewer paragraphs, it's short - return full content
    if (paragraphs.length <= 3) {
        return { preview: htmlContent, isLong: false };
    }

    // Return first 2 paragraphs as preview
    const preview = paragraphs.slice(0, 2).join('\n\n');
    return { preview, isLong: true };
}

// Extract a short snippet for recent posts (first 1-2 sentences)
function getSnippet(htmlContent) {
    // Remove HTML tags to get plain text
    const plainText = htmlContent.replace(/<[^>]+>/g, '');

    // Split by sentence endings
    const sentences = plainText.split(/[.!?]+\s+/);

    // Get first 1-2 sentences, max ~150 chars
    let snippet = sentences[0];
    if (snippet.length < 100 && sentences[1]) {
        snippet += '. ' + sentences[1];
    }

    // Truncate if still too long and add ellipsis
    if (snippet.length > 150) {
        snippet = snippet.substring(0, 150).trim() + '...';
    } else {
        snippet += '.';
    }

    return snippet;
}

function convertMarkdownToHtml(markdown, trackH2s = false) {
    let html = markdown.replace(/\r\n/g, '\n'); // Normalize line endings

    // Split into blocks by double newlines
    const blocks = html.split('\n\n').filter(block => block.trim() !== '');
    const convertedBlocks = [];
    const h2Headings = []; // Track H2 headings for table of contents
    
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
                const headingText = h2Match[1];
                const headingId = createHeadingId(headingText);
                convertedBlocks.push(`<h2 id="${headingId}">${processInlineMarkdown(headingText)}</h2>`);
                if (trackH2s) {
                    h2Headings.push({ text: headingText, id: headingId });
                }
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

    const outputHtml = convertedBlocks.join('\n\n');

    if (trackH2s) {
        return { html: outputHtml, h2Headings };
    }
    return outputHtml;
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
        // Check if this is a longform post
        const isLongform = entry.tags && entry.tags.includes('longform');

        const { html: contentHtml, h2Headings } = convertMarkdownToHtml(entry.content, true);
        const tocHtml = isLongform ? generateTableOfContents(h2Headings) : '';
        const subtitleHtml = entry.subtitle ? `<h2>${entry.subtitle}</h2>` : '';
        const readingTime = calculateReadingTime(entry.content);
        const imagesHtml = entry.images ? entry.images.map(img =>
            `<img src="${img}" alt="Illustration accompanying the journal entry" data-progressive loading="lazy" />`).join('\n            ') : '';

        // Generate "Tagged with" section with clickable tags
        const tagsHtml = entry.tags && entry.tags.length > 0 ? `
        <div class="tags-section">
            <h3>Tagged with</h3>
            <div class="tags-list">
                ${entry.tags.map(tag => `<a href="/journal?tag=${encodeURIComponent(tag)}" class="tag">#${tag}</a>`).join('\n                ')}
            </div>
        </div>` : '';

        // Find related posts based on shared tags
        const relatedPosts = journal.entries
            .filter(e => e.id !== entry.id && e.tags && e.tags.length > 0) // Exclude current entry
            .map(e => {
                const sharedTags = e.tags.filter(tag => entry.tags && entry.tags.includes(tag));
                return { entry: e, sharedCount: sharedTags.length };
            })
            .filter(item => item.sharedCount > 0) // Only entries with at least 1 shared tag
            .sort((a, b) => b.sharedCount - a.sharedCount) // Sort by most shared tags
            .slice(0, 3); // Get top 3

        const relatedPostsHtml = relatedPosts.length > 0 ? `
        <div class="related-posts-section">
            <h3>Related posts</h3>
            <div class="related-posts-list">
                ${relatedPosts.map(item => `
                <div class="related-post-item">
                    <h4><a href="/entry/${item.entry.id}.html">${item.entry.title}</a></h4>
                    <p class="related-post-excerpt">${item.entry.excerpt}</p>
                </div>`).join('\n                ')}
            </div>
        </div>` : '';

        const template = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${entry.title} - Erik's Journal</title>
    <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;700&display=swap" rel="stylesheet">
    <link id="pixelify-font" href="https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" disabled>
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.1/css/all.min.css" integrity="sha512-5Hs3dF2AEPkpNAR7UiOHba+lRSJNeM2ECkwxUIxC1Q/FLycGTbNapWXB4tP889k5T5Ju8fs4b1P5z/iB4nMfSQ==" crossorigin="anonymous" referrerpolicy="no-referrer" />
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

        /* Image styling */
        .entry-content img {
            width: 100%;
            height: 400px;
            object-fit: cover;
            object-position: center;
            margin: 0 0 2rem 0;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        [data-theme="dark"] .entry-content img {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        @media (max-width: 768px) {
            .entry-content img {
                height: 250px;
            }
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

        /* Book recommendation at end */
        .entry-content > hr:last-of-type {
            margin: 3rem 0 2rem 0;
        }

        .entry-content > hr:last-of-type ~ p {
            margin-top: 0;
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

        /* Tags Section */
        .tags-section {
            margin: 2rem 0;
            padding: 1.5rem;
            background: rgba(var(--accent-rgb), 0.05);
            border-radius: 8px;
            border-left: 3px solid var(--accent-color);
        }

        .tags-section h3 {
            font-family: var(--font-secondary);
            font-size: 1.2rem;
            color: var(--heading-color);
            margin: 0 0 1rem 0;
        }

        .tags-list {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
        }

        .tag {
            display: inline-block;
            padding: 0.375rem 0.875rem;
            background: var(--accent-color);
            color: white;
            border-radius: 20px;
            font-size: 0.875rem;
            font-weight: 500;
            transition: all 0.2s ease;
        }

        .tag:hover {
            transform: translateY(-2px);
            box-shadow: 0 2px 8px rgba(var(--accent-rgb), 0.3);
        }

        /* Related Posts Section */
        .related-posts-section {
            margin: 2rem 0;
        }

        .related-posts-section h3 {
            font-family: var(--font-secondary);
            font-size: 1.5rem;
            color: var(--heading-color);
            margin: 0 0 1.5rem 0;
        }

        .related-posts-list {
            display: grid;
            grid-template-columns: 1fr;
            gap: 1.25rem;
        }

        .related-post-item {
            padding: 1.25rem;
            background: rgba(var(--accent-rgb), 0.05);
            border-radius: 8px;
            border-left: 3px solid var(--accent-color);
            transition: all 0.3s ease;
        }

        .related-post-item:hover {
            background: rgba(var(--accent-rgb), 0.08);
            transform: translateX(4px);
        }

        .related-post-item h4 {
            margin: 0 0 0.5rem 0;
            font-size: 1.25rem;
            font-family: var(--font-secondary);
        }

        .related-post-item h4 a {
            color: var(--text-color);
            text-decoration: none;
            transition: color 0.2s ease;
        }

        .related-post-item h4 a:hover {
            color: var(--accent-color);
        }

        .related-post-excerpt {
            color: var(--text-color);
            font-size: 0.95rem;
            line-height: 1.5;
            margin: 0;
        }

        @media (min-width: 768px) {
            .related-posts-list {
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            }
        }

        /* Table of Contents - Floating on right */
        .table-of-contents {
            position: fixed;
            top: 6rem;
            right: 2rem;
            background: rgba(var(--accent-rgb), 0.08);
            border-radius: 8px;
            border-left: 4px solid var(--accent-color);
            z-index: 100;
            max-width: 280px;
        }

        .toc-toggle {
            background: transparent;
            border: none;
            cursor: pointer;
            padding: 1rem 1.25rem;
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: flex-start;
            font-family: var(--font-secondary);
            font-size: 1rem;
            font-weight: 700;
            color: var(--heading-color);
            transition: all 0.2s ease;
        }

        .toc-toggle:hover {
            color: var(--accent-color);
        }

        .toc-toggle-icon {
            transition: transform 0.3s ease;
            font-size: 0.8rem;
            margin-right: 0.5rem;
        }

        .table-of-contents.collapsed .toc-toggle-icon {
            transform: rotate(-90deg);
        }

        .toc-content {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.3s ease;
            padding: 0 1.25rem;
        }

        .table-of-contents:not(.collapsed) .toc-content {
            max-height: 500px;
            padding: 0 1.25rem 1.25rem;
        }

        .toc-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }

        .toc-list li {
            margin-bottom: 0.625rem;
        }

        .toc-list a {
            color: var(--text-color);
            text-decoration: none;
            font-size: 0.875rem;
            line-height: 1.4;
            transition: all 0.2s ease;
            display: inline-block;
            padding-left: 1rem;
            position: relative;
        }

        .toc-list a:before {
            content: "→";
            position: absolute;
            left: 0;
            color: var(--accent-color);
            transition: transform 0.2s ease;
            font-size: 0.875rem;
        }

        .toc-list a:hover,
        .toc-list a:focus {
            color: var(--accent-color);
            transform: translateX(4px);
            outline: 2px solid var(--accent-color);
            outline-offset: 2px;
        }

        .toc-list a:hover:before {
            transform: translateX(4px);
        }

        /* Mobile TOC (collapsible dropdown) */
        .toc-mobile {
            display: none;
        }

        .toc-mobile-toggle {
            background: transparent;
            border: none;
            cursor: pointer;
            padding: 1rem 1.25rem;
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: flex-start;
            font-family: var(--font-secondary);
            font-size: 1rem;
            font-weight: 700;
            color: var(--heading-color);
            transition: all 0.2s ease;
        }

        .toc-mobile-toggle:hover {
            color: var(--accent-color);
        }

        .toc-mobile-toggle-icon {
            transition: transform 0.3s ease;
            font-size: 0.8rem;
            margin-right: 0.5rem;
        }

        .toc-mobile.collapsed .toc-mobile-toggle-icon {
            transform: rotate(-90deg);
        }

        .toc-mobile-content {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.3s ease;
            padding: 0 1.25rem;
        }

        .toc-mobile:not(.collapsed) .toc-mobile-content {
            max-height: 300px;
            padding: 0 1.25rem 1.25rem;
        }

        .toc-select {
            width: 100%;
            padding: 1rem 2.5rem 1rem 1.25rem;
            font-size: 1rem;
            font-family: var(--font-primary);
            color: var(--text-color);
            background: var(--bg-color);
            border: 2px solid var(--accent-color);
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s ease;
            appearance: none;
            -webkit-appearance: none;
            -moz-appearance: none;
            background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 6L11 1' stroke='%23FF6B6B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-position: right 1rem center;
            background-size: 12px;
        }

        .toc-select:focus {
            outline: none;
            box-shadow: 0 0 0 3px rgba(var(--accent-rgb), 0.2);
        }

        .toc-select option {
            padding: 0.75rem;
        }

        /* Responsive: Show dropdown on mobile/tablet at top of content */
        @media (max-width: 1024px) {
            .table-of-contents {
                position: static;
                max-width: 100%;
                margin: 0 0 2rem 0;
                right: auto;
            }

            .toc-desktop {
                display: none;
            }

            .toc-mobile {
                display: block;
            }
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
    <script type="application/ld+json">
        {
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": "${entry.title.replace(/"/g, '\\"')}",
            "datePublished": "${entry.date}",
            "author": {
                "@type": "Person",
                "name": "Erik Sagen",
                "url": "https://www.kartooner.com"
            },
            "publisher": {
                "@type": "Person",
                "name": "Erik Sagen"
            },
            "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": "https://www.kartooner.com/entry/${entry.id}.html"
            },
            "description": "${(entry.excerpt || '').replace(/"/g, '\\"')}"
        }
    </script>
</head>
<body>
    <!-- Skip Navigation Link -->
    <a href="#main-content" class="skip-link">Skip to main content</a>

    <!-- Navigation placeholder - loaded dynamically -->
    <div id="navigation-placeholder"></div>

    <!-- Theme Toggle placeholder - loaded dynamically -->
    <div id="theme-toggle-placeholder"></div>

    <div class="entry-container">
        <div class="entry-header" id="main-content">
            <div class="entry-date"># &bull; ${formatDate(entry.date)} &bull; ${readingTime} &bull; Erik Sagen</div>
            <h1 class="entry-title">${entry.title}</h1>
            ${entry.subtitle ? `<div class="entry-subtitle">${entry.subtitle}</div>` : ''}
        </div>

${tocHtml}
        <div class="entry">
            <div class="entry-content">
                ${imagesHtml}${contentHtml}
            </div>
        </div>

${tagsHtml}

${relatedPostsHtml}

        <hr class="divider" />

        <div class="navigation">
            <a href="/archive" class="view-all">View all posts</a>
        </div>
    </div>

    <!-- Footer placeholder - loaded dynamically -->
    <div id="footer-placeholder"></div>

    <script src="/navigation-loader.js"></script>
    <script src="/theme-toggle-loader.js"></script>
    <script src="/footer-loader.js"></script>
    <script src="/app.min.js"></script>
    <script src="/seasonal-loader.js" defer></script>
    <script>
        // Table of Contents toggle (desktop)
        const tocToggle = document.querySelector('.toc-toggle');
        const toc = document.getElementById('toc');
        if (tocToggle && toc) {
            tocToggle.addEventListener('click', function() {
                const isCollapsed = toc.classList.toggle('collapsed');
                this.setAttribute('aria-expanded', !isCollapsed);
            });
        }

        // Table of Contents mobile toggle
        const tocMobileToggle = document.querySelector('.toc-mobile-toggle');
        const tocMobile = document.querySelector('.toc-mobile');
        if (tocMobileToggle && tocMobile) {
            // Start collapsed on mobile
            tocMobile.classList.add('collapsed');

            tocMobileToggle.addEventListener('click', function() {
                const isCollapsed = tocMobile.classList.toggle('collapsed');
                this.setAttribute('aria-expanded', !isCollapsed);
            });
        }

        // Table of Contents dropdown navigation (mobile)
        const tocSelect = document.getElementById('toc-select');
        if (tocSelect) {
            tocSelect.addEventListener('change', function() {
                const targetId = this.value;
                if (targetId) {
                    const targetElement = document.getElementById(targetId);
                    if (targetElement) {
                        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        // Reset the select after navigation
                        setTimeout(() => {
                            this.selectedIndex = 0;
                        }, 300);
                    }
                }
            });
        }
    </script>
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
        .map(entry => {
            const contentHtml = convertMarkdownToHtml(entry.content);
            const snippet = getSnippet(contentHtml);
            return `
                <div class="recent-post-item">
                    <h3 class="recent-post-title"><a href="/entry/${entry.id}.html">${entry.title}</a></h3>
                    <p class="recent-post-snippet">${snippet}</p>
                    <a href="/entry/${entry.id}.html" class="recent-post-link">Read more →</a>
                </div>`;
        }).join('\n                ');

    const postsHtml = entries.map(entry => {
        const contentHtml = convertMarkdownToHtml(entry.content);
        const { preview, isLong } = getContentPreview(contentHtml);
        const subtitleHtml = entry.subtitle ? `<div class="post-subtitle">${entry.subtitle}</div>` : '';
        const readingTime = calculateReadingTime(entry.content);

        const readMoreLink = isLong ? `<p class="read-more"><a href="/entry/${entry.id}.html">Read full post →</a></p>` : '';

        return `
    <div class="post">
        <div class="post-date"><a href="/entry/${entry.id}.html">#</a> &bull; ${formatDate(entry.date)} &bull; ${readingTime} &bull; Erik Sagen</div>
        <h2 class="post-title"><a href="/entry/${entry.id}.html">${entry.title}</a></h2>
        ${subtitleHtml}
        <div class="post-content">
            ${preview}
            ${readMoreLink}
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
    <link id="pixelify-font" href="https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" disabled>
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.1/css/all.min.css" integrity="sha512-5Hs3dF2AEPkpNAR7UiOHba+lRSJNeM2ECkwxUIxC1Q/FLycGTbNapWXB4tP889k5T5Ju8fs4b1P5z/iB4nMfSQ==" crossorigin="anonymous" referrerpolicy="no-referrer" />
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

        .recent-posts-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 2rem;
            margin: 0;
        }

        .recent-post-item {
            background: rgba(var(--accent-rgb), 0.05);
            padding: 1.5rem;
            border-radius: 8px;
            border-left: 3px solid var(--accent-color);
            transition: all 0.3s ease;
        }

        .recent-post-item:hover {
            background: rgba(var(--accent-rgb), 0.08);
            transform: translateX(4px);
        }

        .recent-post-title {
            font-size: 1.5rem;
            margin: 0 0 0.75rem 0;
            color: var(--heading-color);
        }

        .recent-post-title a {
            color: var(--text-color);
            text-decoration: none;
            transition: color 0.2s ease;
        }

        .recent-post-title a:hover,
        .recent-post-title a:focus {
            color: var(--accent-color);
        }

        .recent-post-snippet {
            color: var(--text-color);
            font-family: var(--font-primary);
            font-size: 0.95rem;
            line-height: 1.6;
            margin: 0 0 1rem 0;
        }

        .recent-post-link {
            color: var(--accent-color);
            text-decoration: none;
            font-size: 0.9rem;
            font-weight: 700;
            transition: all 0.2s ease;
        }

        .recent-post-link:hover,
        .recent-post-link:focus {
            text-decoration: underline;
            transform: translateX(2px);
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

        /* Read more link styling */
        .read-more {
            margin-top: 1.5rem;
            font-size: 1rem;
        }

        .read-more a {
            color: var(--accent-color);
            text-decoration: none;
            font-weight: 700;
            transition: all 0.2s ease;
            display: inline-flex;
            align-items: center;
            gap: 0.25rem;
        }

        .read-more a:hover,
        .read-more a:focus {
            transform: translateX(4px);
            text-decoration: underline;
        }

    </style>
</head>
<body>
    <!-- Navigation placeholder - loaded dynamically -->
    <div id="navigation-placeholder"></div>

    <!-- Theme Toggle placeholder - loaded dynamically -->
    <div id="theme-toggle-placeholder"></div>

    <div class="journal-container animate-fade-in animate-main">
        <h1 class="logo animate-fade-in animate-header">Journal</h1>
        <hr class="divider animate-fade-in animate-header" />

        ${postsHtml}

        <hr class="divider animate-fade-in animate-main" />

        <div class="recent-posts animate-fade-in animate-footer">
            <h3>Recent posts</h3>

            <div class="recent-posts-grid">
                ${recentEntries}
            </div>

            <footer>
                <a href="/archive" class="view-all">View all posts</a>
            </footer>
        </div>
    </div>

    <!-- Footer placeholder - loaded dynamically -->
    <div id="footer-placeholder"></div>

    <script src="/navigation-loader.js"></script>
    <script src="/theme-toggle-loader.js"></script>
    <script src="/footer-loader.js"></script>
    <script src="/app.min.js"></script>
    <script src="/seasonal-loader.js" defer></script>
    <script src="/tag-filter.js" defer></script>
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
    <link id="pixelify-font" href="https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" disabled>
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.1/css/all.min.css" integrity="sha512-5Hs3dF2AEPkpNAR7UiOHba+lRSJNeM2ECkwxUIxC1Q/FLycGTbNapWXB4tP889k5T5Ju8fs4b1P5z/iB4nMfSQ==" crossorigin="anonymous" referrerpolicy="no-referrer" />
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

    <!-- Navigation placeholder - loaded dynamically -->
    <div id="navigation-placeholder"></div>

    <!-- Theme Toggle placeholder - loaded dynamically -->
    <div id="theme-toggle-placeholder"></div>

    <div class="archive-container">
        <main id="main-content" tabindex="-1">
            <h1 class="logo">Archive</h1>
            <hr class="divider" />

            ${yearsHtml}


        </main>
    </div>

    <!-- Footer placeholder - loaded dynamically -->
    <div id="footer-placeholder"></div>

    <script src="/navigation-loader.js"></script>
    <script src="/theme-toggle-loader.js"></script>
    <script src="/footer-loader.js"></script>
    <script src="/app.min.js"></script>
    <script src="/seasonal-loader.js" defer></script>
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
      <link>https://sagen.com/entry/${entry.id}.html</link>
      <guid>https://sagen.com/entry/${entry.id}.html</guid>
      <pubDate>${new Date(entry.date).getTime() ? new Date(entry.date).toUTCString() : new Date().toUTCString()}</pubDate>
      <description><![CDATA[${entry.excerpt}]]></description>
      <content:encoded><![CDATA[${contentHtml}]]></content:encoded>
    </item>`;
    }).join('');

    const rssContent = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Erik's Journal</title>
    <link>https://sagen.com</link>
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
    <link href="https://sagen.com/entry/${entry.id}.html" type="text/html" />
    <id>https://sagen.com/entry/${entry.id}.html</id>
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
  <link href="https://sagen.com/journal-atom.xml" rel="self" type="application/atom+xml" />
  <link href="https://sagen.com/journal" />
  <generator uri="https://sagen.com">Journal CMS</generator>
  <updated>${new Date().toISOString()}</updated>
  <id>https://sagen.com/journal-atom.xml</id>
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