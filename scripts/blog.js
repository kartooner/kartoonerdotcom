#!/usr/bin/env node

/**
 * Streamlined Blog Builder for kartooner.com
 * Handles story processing, HTML generation, RSS feeds, and auto-rebuild
 * Usage: node blog.js [build|watch|sync]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const JOURNAL_FILE = path.join(__dirname, '..', 'journal-entries.json');
const STORIES_DIR = path.join(__dirname, '..', 'stories');
const CONTENT_FILE = path.join(__dirname, '..', 'content.json');

class BlogBuilder {
    constructor() {
        this.buildTimeout = null;
        this.isBuilding = false;
    }

    // Main build function - consolidates all build tasks
    async build() {
        if (this.isBuilding) return;
        this.isBuilding = true;

        try {
            console.log('🔨 Building blog...');
            
            // Step 1: Sync stories from /stories to journal entries
            console.log('📖 Syncing stories...');
            this.syncStories();
            
            // Step 2: Ensure all journal entry pages have proper image sizing
            console.log('🖼️ Ensuring proper image sizing in journal entries...');
            this.ensureImageSizing();
            
            // Step 3: Generate RSS feeds if generate-rss.js exists
            if (fs.existsSync('js/generate-rss.js')) {
                console.log('📡 Generating RSS feeds...');
                execSync('node js/generate-rss.js', { stdio: 'pipe' });
            }
            
            console.log('✅ Build complete!');
        } catch (error) {
            console.error('❌ Build failed:', error.message);
        } finally {
            this.isBuilding = false;
        }
    }

    // Debounced build to prevent rapid rebuilds
    debouncedBuild() {
        clearTimeout(this.buildTimeout);
        this.buildTimeout = setTimeout(() => {
            this.build();
        }, 1000);
    }

    // Watch /stories directory for changes
    watch() {
        console.log('👀 Watching /stories directory for changes...');
        console.log('🚀 Auto-rebuild enabled - add or modify stories to trigger rebuild');
        console.log('📡 Press Ctrl+C to stop\n');

        // Initial build
        this.build();

        // Watch stories directory
        if (fs.existsSync(STORIES_DIR)) {
            fs.watch(STORIES_DIR, { recursive: true }, (eventType, filename) => {
                if (filename && filename.endsWith('.txt')) {
                    console.log(`📝 Story changed: ${filename}`);
                    this.debouncedBuild();
                }
            });
        }

        // Also watch content.json for RSS regeneration
        if (fs.existsSync(CONTENT_FILE)) {
            fs.watchFile(CONTENT_FILE, { interval: 1000 }, (curr, prev) => {
                if (curr.mtime !== prev.mtime) {
                    console.log('📝 Content.json changed, regenerating RSS...');
                    this.debouncedBuild();
                }
            });
        }

        // Handle graceful shutdown
        process.on('SIGINT', () => {
            console.log('\n🛑 Stopping blog watcher...');
            if (fs.existsSync(CONTENT_FILE)) {
                fs.unwatchFile(CONTENT_FILE);
            }
            console.log('👋 Blog watcher stopped. Goodbye!');
            process.exit(0);
        });

        // Keep process alive
        process.stdin.resume();
    }

    // Sync stories (simplified version of journal-cms.js sync)
    syncStories() {
        // Use existing journal-cms.js sync functionality
        execSync('node scripts/journal-cms.js sync', { stdio: 'pipe' });
    }

    // Quick sync without full build
    sync() {
        console.log('🔄 Quick sync...');
        this.syncStories();
        console.log('✅ Sync complete!');
    }

    // Clean up journal entry files (remove inline styles, rely on global CSS)
    ensureImageSizing() {
        const entryDir = path.join(__dirname, '..', 'entry');
        if (!fs.existsSync(entryDir)) return;

        const entryFiles = fs.readdirSync(entryDir).filter(file => file.endsWith('.html'));
        
        for (const file of entryFiles) {
            const filePath = path.join(entryDir, file);
            let content = fs.readFileSync(filePath, 'utf8');
            
            // Remove inline styles from img tags (rely on global CSS instead)
            content = content.replace(
                /<img([^>]*?)style="[^"]*?"([^>]*?)>/g,
                '<img$1$2>'
            );
            
            // Remove any remaining inline image CSS blocks
            content = content.replace(
                /\s*\.(?:entry|post) img \{[^}]*\}\s*/g,
                ''
            );
            
            fs.writeFileSync(filePath, content, 'utf8');
        }
        
        console.log(`🖼️ Cleaned up ${entryFiles.length} entry files (removed inline styles)`);
    }
}

// CLI handling
const command = process.argv[2] || 'build';
const builder = new BlogBuilder();

switch (command) {
    case 'watch':
        builder.watch();
        break;
    case 'sync':
        builder.sync();
        break;
    case 'build':
    default:
        builder.build();
        break;
}