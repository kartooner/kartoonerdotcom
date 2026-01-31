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

function generateAtomFeed() {
  try {
    // Read content.json
    const contentPath = path.join(__dirname, '..', 'data', 'content.json');
    const content = JSON.parse(fs.readFileSync(contentPath, 'utf8'));

    const siteUrl = 'https://kartooner.com';
    const currentDate = new Date().toUTCString();

    let atomEntries = [];

    // Add recent links as Atom entries
    if (content.recentLinks && Array.isArray(content.recentLinks)) {
      content.recentLinks.forEach(link => {
        atomEntries.push(`
  <entry xml:lang="en">
    <title><![CDATA[${link.title || 'Recent Link'}]]></title>
    <published>${new Date().toISOString()}</published>
    <updated>${new Date().toISOString()}</updated>
    <link href="${escapeXml(link.url || '')}" type="text/html" />
    <id>${escapeXml(link.url || '')}</id>
    <author>
      <name><![CDATA[Erik Sagen]]></name>
    </author>
    <category term="Recent Links" />
    <content type="html"><![CDATA[${link.description || ''}]]></content>
  </entry>`);
      });
    }

    // Add archived links by month/year
    if (content.archives && typeof content.archives === 'object') {
      Object.entries(content.archives).forEach(([yearMonth, archivedLinks]) => {
        if (Array.isArray(archivedLinks)) {
          archivedLinks.forEach(link => {
            // Use link's date if available, otherwise parse from yearMonth
            let itemDate = currentDate;
            if (link.date) {
              itemDate = new Date(link.date).toUTCString();
            } else {
              // Try to parse yearMonth (e.g., "2024-08" -> August 2024)
              const [year, month] = yearMonth.split('-');
              if (year && month) {
                itemDate = new Date(parseInt(year), parseInt(month) - 1, 1).toUTCString();
              }
            }

            atomEntries.push(`
  <entry xml:lang="en">
    <title><![CDATA[${link.title || 'Archived Link'}]]></title>
    <published>${new Date(itemDate).toISOString()}</published>
    <updated>${new Date(itemDate).toISOString()}</updated>
    <link href="${escapeXml(link.url || '')}" type="text/html" />
    <id>${escapeXml(link.url || '')}-${yearMonth}</id>
    <author>
      <name><![CDATA[Erik Sagen]]></name>
    </author>
    <category term="Archives - ${yearMonth}" />
    <content type="html"><![CDATA[${link.description || ''}]]></content>
  </entry>`);
          });
        }
      });
    }

    // Add currently reading book as Atom entry
    if (content.currentlyReading) {
      const book = content.currentlyReading;
      atomEntries.push(`
  <entry xml:lang="en">
    <title><![CDATA[Currently Reading: ${book.title || 'Unknown Book'}]]></title>
    <published>${new Date().toISOString()}</published>
    <updated>${new Date().toISOString()}</updated>
    <link href="${escapeXml(book.url || '')}" type="text/html" />
    <id>currently-reading-${escapeXml((book.title || '').toLowerCase().replace(/\s+/g, '-'))}</id>
    <author>
      <name><![CDATA[Erik Sagen]]></name>
    </author>
    <category term="Currently Reading" />
    <content type="html"><![CDATA[Erik is currently reading "${book.title || ''}" by ${book.author || 'Unknown Author'}. ${book.review || ''}]]></content>
  </entry>`);
    }

    const atomContent = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="en">
  <title><![CDATA[Erik's Links & Reading]]></title>
  <subtitle><![CDATA[Recent links and currently reading from Erik Sagen]]></subtitle>
  <link href="${siteUrl}/atom.xml" rel="self" type="application/atom+xml" />
  <link href="${siteUrl}" />
  <generator uri="${siteUrl}">Erik's Site</generator>
  <updated>${new Date().toISOString()}</updated>
  <id>${siteUrl}/atom.xml</id>
  ${atomEntries.join('')}
</feed>`;

    // Write Atom file
    const atomPath = path.join(__dirname, '..', 'atom.xml');
    fs.writeFileSync(atomPath, atomContent, 'utf8');

    console.log('Atom feed generated successfully at atom.xml');
    console.log(`Generated ${atomEntries.length} entries`);

  } catch (error) {
    console.error('Error generating Atom feed:', error);
    process.exit(1);
  }
}

// Run the generator
generateAtomFeed();