#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const JOURNAL_FILE = path.join(__dirname, '..', 'data', 'journal-entries.json');
const STORIES_DIR = path.join(__dirname, '..', 'stories');
const ENTRY_DIR = path.join(__dirname, '..', 'entry');
const JOURNAL_DIR = path.join(__dirname, '..', 'journal');
const JOURNAL_HTML = path.join(JOURNAL_DIR, 'index.html');
// Draft previews: built for local viewing only (git ignores this folder)
const DRAFTS_DIR = path.join(__dirname, '..', 'drafts');
const SITE_URL = 'https://www.kartooner.com';
// Link previews (LinkedIn, Slack, iMessage...) use a 1200x630 JPG made from an entry's
// first image by scripts/build-share-images.js; entries without images use the avatar
const SHARE_IMAGE = { width: 1200, height: 630 };
const shareImagePath = entry => entry.images && entry.images.length ? `/assets/share/${entry.id}.jpg` : null;

// Icons: Font Awesome Free 6.7.1 (CC BY 4.0) https://fontawesome.com/license/free
// Inline so they follow the text color and need nothing extra to load
const ICONS = {
    rss: '<svg class="icon glyph" viewBox="0 0 448 512" aria-hidden="true" focusable="false"><path d="M0 64C0 46.3 14.3 32 32 32c229.8 0 416 186.2 416 416c0 17.7-14.3 32-32 32s-32-14.3-32-32C384 253.6 226.4 96 32 96C14.3 96 0 81.7 0 64zM0 416a64 64 0 1 1 128 0A64 64 0 1 1 0 416zM32 160c159.1 0 288 128.9 288 288c0 17.7-14.3 32-32 32s-32-14.3-32-32c0-123.7-100.3-224-224-224c-17.7 0-32-14.3-32-32s14.3-32 32-32z"/></svg>',
    clock: '<svg class="icon glyph" viewBox="0 0 512 512" aria-hidden="true" focusable="false"><path d="M464 256A208 208 0 1 1 48 256a208 208 0 1 1 416 0zM0 256a256 256 0 1 0 512 0A256 256 0 1 0 0 256zM232 120V256c0 8 4 15.5 10.7 20l96 64c11 7.4 25.9 4.4 33.3-6.7s4.4-25.9-6.7-33.3L280 243.2V120c0-13.3-10.7-24-24-24s-24 10.7-24 24z"/></svg>',
    tag: '<svg class="icon glyph" viewBox="0 0 448 512" aria-hidden="true" focusable="false"><path d="M0 80V229.5c0 17 6.7 33.3 18.7 45.3l176 176c25 25 65.5 25 90.5 0L418.7 317.3c25-25 25-65.5 0-90.5l-176-176c-12-12-28.3-18.7-45.3-18.7H48C21.5 32 0 53.5 0 80zm112 32a32 32 0 1 1 0 64 32 32 0 1 1 0-64z"/></svg>'
};

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
                    case 'image alt':
                        // Separated with | since descriptions often have commas
                        metadata.imageAlts = value.split('|').map(alt => alt.trim());
                        break;
                    case 'draft':
                        metadata.draft = /^(true|yes)$/i.test(value);
                        break;
                    case 'image caption':
                        // Same | separator as Image alt, one caption per image
                        metadata.imageCaptions = value.split('|').map(caption => caption.trim());
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
            images: metadata.images,
            imageAlts: metadata.imageAlts,
            imageCaptions: metadata.imageCaptions,
            ...(metadata.draft && { draft: true })
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

        // Drafts stay out of the journal, feeds and saved JSON; they only get a preview page
        const drafts = entries.filter(entry => entry.draft);
        const journal = { entries: entries.filter(entry => !entry.draft) };

        // Save to JSON file for consistency
        saveJournal(journal);

        console.log(`Synced ${journal.entries.length} stories from /stories folder${drafts.length ? ` (plus ${drafts.length} draft${drafts.length === 1 ? '' : 's'})` : ''}`);
        return { ...journal, drafts };

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

    // Word count of full plain text
    const plainText = htmlContent.replace(/<[^>]+>/g, '');
    const wordCount = plainText.trim().split(/\s+/).length;

    // Short content: 3 or fewer paragraphs AND under 200 words
    if (paragraphs.length <= 3 && wordCount <= 200) {
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
    html = html.replace(/\n[ \t]+\n/g, '\n\n'); // Normalize whitespace-only lines to blank lines

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

// How wide entry images show: the text column, less its side padding on phones.
// build-images.js passes this on so phones download a smaller copy
const ENTRY_IMAGE_SIZES = '(max-width: 800px) calc(100vw - 56px), 730px';

// An entry image, wrapped in a <figure> when it has a caption. Feeds get an absolute
// src and none of the page's progressive-loading attributes
function entryImageHtml(entry, index, { eager = false, absolute = false } = {}) {
    const src = (absolute ? 'https://www.kartooner.com' : '') + entry.images[index];
    const alt = escapeHtml((entry.imageAlts && entry.imageAlts[index]) || 'Illustration accompanying the journal entry');
    const caption = entry.imageCaptions && entry.imageCaptions[index];
    const img = absolute
        ? `<img src="${src}" alt="${alt}" />`
        : `<img src="${src}" alt="${alt}" sizes="${ENTRY_IMAGE_SIZES}" data-progressive ${eager ? 'loading="eager" fetchpriority="high"' : 'loading="lazy"'} />`;
    return caption ? `<figure class="entry-figure">${img}<figcaption>${escapeHtml(caption)}</figcaption></figure>` : img;
}

// A story places one of its images in the body with a line of its own like [image 1],
// numbered from its Images list. Returns the html with those lines swapped for the
// images, and which images were placed
function placeEntryImages(html, entry, options = {}) {
    const placed = new Set();
    const images = entry.images || [];
    const result = html.replace(/<p>\[image (\d+)\]<\/p>/gi, (match, number) => {
        const index = Number(number) - 1;
        if (!images[index]) {
            console.warn(`${entry.id}: [image ${number}] has no matching entry in Images`);
            return '';
        }
        placed.add(index);
        return entryImageHtml(entry, index, options);
    });
    return { html: result, placed };
}

// Builds a page for each of `pages` (the published entries by default). A draft preview
// is built as if it were published: it gets related posts and older/newer links
// among the published entries, which never link back to it
function generateEntryPages(journal, { pages = journal.entries, dir = ENTRY_DIR } = {}) {
    // Create entry directory if it doesn't exist
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    pages.forEach(entry => {
        const others = journal.entries.filter(e => e.id !== entry.id);
        // Newest first, for the older/newer links at the bottom of each entry
        const chronological = others.concat(entry).sort((a, b) => new Date(b.date) - new Date(a.date));
        const position = chronological.findIndex(e => e.id === entry.id);
        const newer = chronological[position - 1];
        const older = chronological[position + 1];
        const pagerLink = (post, direction) => post ? `
            <a href="/entry/${post.id}.html" class="entry-pager-link entry-pager-${direction}" rel="${direction === 'older' ? 'prev' : 'next'}">
                <span class="entry-pager-label">${direction === 'older' ? '<span aria-hidden="true">&larr;</span> Older' : 'Newer <span aria-hidden="true">&rarr;</span>'}</span>
                <span class="entry-pager-title">${escapeHtml(post.title)}</span>
            </a>` : `
            <span class="entry-pager-link entry-pager-${direction}" aria-hidden="true"></span>`;
        const pagerHtml = older || newer ? `
        <nav class="entry-pager" aria-label="More posts">${pagerLink(older, 'older')}${pagerLink(newer, 'newer')}
        </nav>` : '';

        // Check if this is a longform post
        const isLongform = entry.tags && entry.tags.includes('longform');

        const { html: contentHtml, h2Headings } = convertMarkdownToHtml(entry.content, true);
        const tocHtml = isLongform ? generateTableOfContents(h2Headings) : '';
        const subtitleHtml = entry.subtitle ? `<h2>${entry.subtitle}</h2>` : '';
        const readingTime = calculateReadingTime(entry.content);
        // Images placed in the body with [image N] sit there; the rest open the entry.
        // The first opening image is usually the largest thing on screen, so it loads
        // right away at high priority; any others wait until they're scrolled near
        const { html: bodyHtml, placed } = placeEntryImages(contentHtml, entry);
        const imagesHtml = (entry.images || [])
            .map((img, index) => index)
            .filter(index => !placed.has(index))
            .map((index, position) => entryImageHtml(entry, index, { eager: position === 0 }))
            .join('\n            ');

        // Generate "Tagged with" section with clickable tags
        const tagsHtml = entry.tags && entry.tags.length > 0 ? `
        <div class="tags-section">
            <h2>${ICONS.tag}Tagged with</h2>
            <div class="tags-list">
                ${entry.tags.map(tag => `<a href="/journal?tag=${encodeURIComponent(tag)}" class="tag">#${tag}</a>`).join('\n                ')}
            </div>
        </div>` : '';

        // Find related posts based on shared tags
        const relatedPosts = others
            .filter(e => e.tags && e.tags.length > 0)
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
    <script>
        /* Apply the saved (or system) theme before first paint to avoid a flash */
        (function () {
            var theme;
            try { theme = localStorage.getItem('theme'); } catch (e) {}
            if (theme !== 'light' && theme !== 'dark') {
                theme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            }
            document.documentElement.setAttribute('data-theme', theme);
        })();
    </script>
    <title>${entry.title} - Erik's Journal</title>
${entry.draft ? `    <meta name="robots" content="noindex">
` : ''}${linkPreviewTags(entry)}
    <link rel="preload" href="/assets/fonts/Manrope-latin.woff2" as="font" type="font/woff2" crossorigin>
    <link id="pixelify-font" href="https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" disabled>
    <link rel="stylesheet" href="/css/style.css">
    <link rel="stylesheet" id="seasonal-themes" href="/css/seasonal-themes.css">
    <script src="/js/seasonal-loader.js"></script>
    <link rel="stylesheet" href="/css/entry.css">
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
            "description": "${(entry.excerpt || '').replace(/"/g, '\\"')}",
            "image": "${SITE_URL}${shareImagePath(entry) || '/assets/images/erik-avatar.jpg'}"
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

    <main class="entry-container">
${entry.draft ? `        <p class="entry-draft-notice"><strong>Draft preview.</strong> Not in the journal or feeds until <code>Draft: true</code> comes out of the story file.</p>
` : ''}        <header class="entry-header" id="main-content">
            <a href="/journal" class="entry-back"><span aria-hidden="true">&larr;</span>Back to Journal</a>
            <h1 class="entry-title">${entry.title}</h1>
            ${entry.subtitle ? `<p class="entry-subtitle page-intro">${entry.subtitle}</p>` : ''}
            <p class="entry-meta"><time datetime="${new Date(entry.date).toISOString().slice(0, 10)}">${formatDate(entry.date)}</time> &middot; ${ICONS.clock}${readingTime}</p>
        </header>

${tocHtml}
        <div class="entry">
            <div class="entry-content">
                ${imagesHtml}${bodyHtml}
            </div>
        </div>

${tagsHtml}

${relatedPostsHtml}

        <hr class="divider" />
${pagerHtml}

        <div class="navigation">
            <a href="/journal" class="view-all">View all posts</a>
        </div>
    </main>

    <!-- Footer placeholder - loaded dynamically -->
    <div id="footer-placeholder"></div>

    <script src="/js/navigation-loader.js"></script>
    <script src="/js/theme-toggle-loader.js"></script>
    <script src="/js/footer-loader.js"></script>
    <script src="/js/app.min.js"></script>
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
            const entryPath = path.join(dir, `${entry.id}.html`);
            fs.writeFileSync(entryPath, template, 'utf8');
        } catch (error) {
            console.error(`Error generating entry page for ${entry.id}:`, error.message);
        }
    });

    console.log(`Generated ${pages.length} ${dir === ENTRY_DIR ? 'individual entry' : 'draft preview'} page${pages.length === 1 ? '' : 's'}`);
}

// Draft previews go to /drafts/ (local only). An entry turned back into a draft
// loses its published page, so it isn't left live at its old address
function generateDraftPages(journal) {
    const drafts = journal.drafts || [];
    if (fs.existsSync(DRAFTS_DIR)) fs.rmSync(DRAFTS_DIR, { recursive: true });
    for (const draft of drafts) {
        const published = path.join(ENTRY_DIR, `${draft.id}.html`);
        if (fs.existsSync(published)) {
            fs.unlinkSync(published);
            console.log(`Unpublished ${draft.id} (now a draft)`);
        }
    }
    if (!drafts.length) return;
    generateEntryPages(journal, { pages: drafts, dir: DRAFTS_DIR });
    drafts.forEach(draft => console.log(`   Preview: /drafts/${draft.id}.html`));
}

// Title, description and image for link previews (LinkedIn, Slack, iMessage, ...)
function linkPreviewTags(entry) {
    const url = `${SITE_URL}/entry/${entry.id}.html`;
    const description = escapeHtml(entry.excerpt || '');
    const title = escapeHtml(entry.title);
    const image = shareImagePath(entry);
    const imageTags = image ? `
    <meta property="og:image" content="${SITE_URL}${image}">
    <meta property="og:image:width" content="${SHARE_IMAGE.width}">
    <meta property="og:image:height" content="${SHARE_IMAGE.height}">
    <meta property="og:image:alt" content="${escapeHtml((entry.imageAlts && entry.imageAlts[0]) || entry.title)}">
    <meta name="twitter:card" content="summary_large_image">` : `
    <meta property="og:image" content="${SITE_URL}/assets/images/erik-avatar.jpg">
    <meta name="twitter:card" content="summary">`;
    return `    <meta name="description" content="${description}">
    <meta name="author" content="Erik Sagen">
    <link rel="canonical" href="${url}">
    <link rel="alternate" type="application/rss+xml" title="Erik's Journal" href="/journal-feed.xml">
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="Erik Sagen">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:url" content="${url}">${imageTags}
    <meta property="article:published_time" content="${new Date(entry.date).toISOString()}">
    <meta property="article:author" content="Erik Sagen">${(entry.tags || []).map(tag => `
    <meta property="article:tag" content="${escapeHtml(tag)}">`).join('')}`;
}

function generateJournalHtml(journal) {
    // Create journal directory if it doesn't exist
    if (!fs.existsSync(JOURNAL_DIR)) {
        fs.mkdirSync(JOURNAL_DIR, { recursive: true });
    }

    // Every entry, newest first, grouped by year and then month
    const byYear = new Map();
    journal.entries
        .slice()
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .forEach(entry => {
            const date = new Date(entry.date);
            const year = date.getFullYear();
            const month = date.toLocaleDateString('en-US', { month: 'long' });
            if (!byYear.has(year)) byYear.set(year, new Map());
            const months = byYear.get(year);
            if (!months.has(month)) months.set(month, []);
            months.get(month).push(entry);
        });

    const snippetHtml = entry => {
        const date = new Date(entry.date);
        const isoDate = isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
        const tags = (entry.tags || []).map(tag => escapeHtml(tag.toLowerCase())).join(',');
        return `
                        <li class="journal-item" data-tags="${tags}">
                            <article class="journal-snippet">
                                <h4 class="journal-snippet-title"><a href="/entry/${entry.id}.html">${escapeHtml(entry.title)}</a></h4>
                                ${entry.excerpt ? `<p class="journal-snippet-excerpt">${escapeHtml(entry.excerpt)}</p>` : ''}
                                <p class="journal-snippet-meta"><time datetime="${isoDate}">${formatDate(entry.date)}</time> &middot; ${ICONS.clock}${calculateReadingTime(entry.content)}</p>
                            </article>
                        </li>`;
    };

    const archiveHtml = [...byYear].map(([year, months]) => `
        <section class="journal-year" aria-labelledby="year-${year}">
            <h2 class="journal-year-title" id="year-${year}">${year}</h2>
            ${[...months].map(([month, monthEntries]) => `
            <section class="journal-month" aria-labelledby="month-${year}-${month.toLowerCase()}">
                <h3 class="journal-month-title" id="month-${year}-${month.toLowerCase()}">${month} <span class="sr-only">${year}</span></h3>
                <ol class="journal-list">${monthEntries.map(snippetHtml).join('')}
                </ol>
            </section>`).join('')}
        </section>`).join('');

    const template = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script>
        /* Apply the saved (or system) theme before first paint to avoid a flash */
        (function () {
            var theme;
            try { theme = localStorage.getItem('theme'); } catch (e) {}
            if (theme !== 'light' && theme !== 'dark') {
                theme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            }
            document.documentElement.setAttribute('data-theme', theme);
        })();
    </script>
    <title>Journal</title>
    <meta name="description" content="Pieces of life, half-thoughts, and stories from Erik Sagen.">
    <link rel="canonical" href="${SITE_URL}/journal/">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="Erik Sagen">
    <meta property="og:title" content="Erik Sagen's Journal">
    <meta property="og:description" content="Pieces of life, half-thoughts, and stories from Erik Sagen.">
    <meta property="og:url" content="${SITE_URL}/journal/">
    <meta property="og:image" content="${SITE_URL}/assets/images/erik-avatar.jpg">
    <meta name="twitter:card" content="summary">
    <link rel="alternate" type="application/rss+xml" title="Erik's Journal" href="/journal-feed.xml">
    <link rel="preload" href="/assets/fonts/Manrope-latin.woff2" as="font" type="font/woff2" crossorigin>
    <link id="pixelify-font" href="https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" disabled>
    <link rel="stylesheet" href="/css/style.css">
    <link rel="stylesheet" id="seasonal-themes" href="/css/seasonal-themes.css">
    <script src="/js/seasonal-loader.js"></script>
    <link rel="stylesheet" href="/css/journal.css">
</head>
<body>
    <!-- Navigation placeholder - loaded dynamically -->
    <div id="navigation-placeholder"></div>

    <!-- Theme Toggle placeholder - loaded dynamically -->
    <div id="theme-toggle-placeholder"></div>

    <main class="journal-container animate-fade-in animate-main">
        <h1 class="logo animate-fade-in animate-header">Journal</h1>

        <p class="page-intro journal-intro">Sometimes I like to write things. Pieces of life, half-thoughts, stories I don't want to lose. If you like them, maybe sign up to the <a href="/journal-feed.xml">${ICONS.rss}RSS feed</a>.</p>

        <div class="journal-archive">${archiveHtml}
        </div>
    </main>

    <!-- Footer placeholder - loaded dynamically -->
    <div id="footer-placeholder"></div>

    <script src="/js/navigation-loader.js"></script>
    <script src="/js/theme-toggle-loader.js"></script>
    <script src="/js/footer-loader.js"></script>
    <script src="/js/app.min.js"></script>
    <script src="/js/tag-filter.js" defer></script>
</body>
</html>`;

    try {
        fs.writeFileSync(JOURNAL_HTML, template, 'utf8');
        console.log('Journal HTML generated successfully.');
    } catch (error) {
        console.error('Error generating blog HTML:', error.message);
    }
}

function generateRSSFeed(journal) {
    const entries = journal.entries
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 10); // Latest 10 entries

    const items = entries.map(entry => {
        const contentHtml = placeEntryImages(convertMarkdownToHtml(entry.content), entry, { absolute: true }).html;
        return `
    <item>
      <title><![CDATA[${entry.title}]]></title>
      <link>https://www.kartooner.com/entry/${entry.id}.html</link>
      <guid>https://www.kartooner.com/entry/${entry.id}.html</guid>
      <pubDate>${new Date(entry.date).getTime() ? new Date(entry.date).toUTCString() : new Date().toUTCString()}</pubDate>
      <description><![CDATA[${entry.excerpt}]]></description>
      <content:encoded><![CDATA[${contentHtml}]]></content:encoded>
    </item>`;
    }).join('');

    const rssContent = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Erik's Journal</title>
    <link>https://www.kartooner.com</link>
    <description>Personal journal entries from Erik Sagen</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <generator>Journal CMS</generator>
    ${items}
  </channel>
</rss>`;

    try {
        fs.writeFileSync(path.join(__dirname, '..', 'journal-feed.xml'), rssContent, 'utf8');
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
        const contentHtml = placeEntryImages(convertMarkdownToHtml(entry.content), entry, { absolute: true }).html;
        return `
  <entry xml:lang="en">
    <title><![CDATA[${entry.title}]]></title>
    <published>${new Date(entry.date).getTime() ? new Date(entry.date).toISOString() : new Date().toISOString()}</published>
    <updated>${new Date(entry.date).getTime() ? new Date(entry.date).toISOString() : new Date().toISOString()}</updated>
    <link href="https://www.kartooner.com/entry/${entry.id}.html" type="text/html" />
    <id>https://www.kartooner.com/entry/${entry.id}.html</id>
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
  <link href="https://www.kartooner.com/journal-atom.xml" rel="self" type="application/atom+xml" />
  <link href="https://www.kartooner.com/journal" />
  <generator uri="https://www.kartooner.com">Journal CMS</generator>
  <updated>${new Date().toISOString()}</updated>
  <id>https://www.kartooner.com/journal-atom.xml</id>
  ${atomEntries}
</feed>`;

    try {
        fs.writeFileSync(path.join(__dirname, '..', 'journal-atom.xml'), atomContent, 'utf8');
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
        generateEntryPages(journal);
    generateRSSFeed(journal);
    generateAtomFeed(journal);
    console.log('All files regenerated successfully!');
}

function syncFromStories() {
    const journal = syncStoriesFromFolder();
    generateJournalHtml(journal);
        generateEntryPages(journal);
    generateDraftPages(journal);
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
  Image alt: What image1 shows | What image2 shows
  
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