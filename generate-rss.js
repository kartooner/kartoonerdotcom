const fs = require('fs');
const path = require('path');

function escapeXml(text) {
    if (typeof text !== 'string') return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function generateRSSFeed() {
    try {
        // Read content.json
        const contentPath = path.join(__dirname, 'content.json');
        const content = JSON.parse(fs.readFileSync(contentPath, 'utf8'));
        
        const siteUrl = 'https://kartooner.com';
        const currentDate = new Date().toUTCString();
        
        let rssItems = [];
        
        // Add recent links as RSS items
        if (content.recentLinks && Array.isArray(content.recentLinks)) {
            content.recentLinks.forEach(link => {
                rssItems.push(`
        <item>
            <title>${escapeXml(link.title || 'Recent Link')}</title>
            <link>${escapeXml(link.url || '')}</link>
            <description>${escapeXml(link.description || '')}</description>
            <category>Recent Links</category>
            <pubDate>${currentDate}</pubDate>
            <guid>${escapeXml(link.url || '')}</guid>
        </item>`);
            });
        }
        
        // Add currently reading book as RSS item
        if (content.currentlyReading) {
            const book = content.currentlyReading;
            rssItems.push(`
        <item>
            <title>Currently Reading: ${escapeXml(book.title || 'Unknown Book')}</title>
            <link>${escapeXml(book.url || '')}</link>
            <description>Erik is currently reading "${escapeXml(book.title || '')}" by ${escapeXml(book.author || 'Unknown Author')}. ${escapeXml(book.review || '')}</description>
            <category>Currently Reading</category>
            <pubDate>${currentDate}</pubDate>
            <guid>currently-reading-${escapeXml((book.title || '').toLowerCase().replace(/\s+/g, '-'))}</guid>
        </item>`);
        }
        
        const rssContent = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
    <channel>
        <title>Erik's Links &amp; Reading</title>
        <link>${siteUrl}</link>
        <description>Recent links and currently reading from Erik Sagen</description>
        <language>en-US</language>
        <lastBuildDate>${currentDate}</lastBuildDate>
        <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml"/>
        ${rssItems.join('')}
    </channel>
</rss>`;
        
        // Write RSS file
        const rssPath = path.join(__dirname, 'feed.xml');
        fs.writeFileSync(rssPath, rssContent, 'utf8');
        
        console.log('RSS feed generated successfully at feed.xml');
        console.log(`Generated ${rssItems.length} items`);
        
    } catch (error) {
        console.error('Error generating RSS feed:', error);
        process.exit(1);
    }
}

// Run the generator
generateRSSFeed();