const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const contentFilePath = path.join(__dirname, '..', 'content.json');

console.log('🔍 Watching content.json for changes...');
console.log('📁 File path:', contentFilePath);
console.log('✨ RSS feed will be regenerated automatically when content.json is updated');
console.log('📡 Press Ctrl+C to stop watching\n');

// Debounce function to prevent multiple rapid regenerations
let regenerationTimeout;
function debounceRegeneration() {
    clearTimeout(regenerationTimeout);
    regenerationTimeout = setTimeout(() => {
        try {
            console.log('📝 Content changed, regenerating RSS feed...');
            execSync('node js/generate-rss.js', { stdio: 'inherit' });
            console.log('✅ RSS feed updated successfully!\n');
        } catch (error) {
            console.error('❌ Error regenerating RSS feed:', error.message);
        }
    }, 1000); // Wait 1 second after last change
}

// Watch the content.json file for changes
fs.watchFile(contentFilePath, { interval: 1000 }, (curr, prev) => {
    if (curr.mtime !== prev.mtime) {
        debounceRegeneration();
    }
});

// Generate initial RSS feed
try {
    console.log('🚀 Generating initial RSS feed...');
    execSync('node generate-rss.js', { stdio: 'inherit' });
    console.log('✅ Initial RSS feed generated!\n');
} catch (error) {
    console.error('❌ Error generating initial RSS feed:', error.message);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Stopping file watcher...');
    fs.unwatchFile(contentFilePath);
    console.log('👋 File watcher stopped. Goodbye!');
    process.exit(0);
});