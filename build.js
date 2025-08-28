#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('📝 Building Journal...\n');

try {
    // Sync stories from /stories folder
    console.log('🔄 Syncing stories from /stories folder...');
    execSync('node journal-cms.js sync', { stdio: 'inherit' });
    
    console.log('\n✅ Build complete! Files generated:');
    console.log('   - journal/index.html');
    console.log('   - archive.html'); 
    console.log('   - journal-feed.xml');
    console.log('   - journal-entries.json');
    
    // Check if we're in a git repository
    try {
        execSync('git rev-parse --git-dir', { stdio: 'ignore' });
        console.log('\n🔍 Git repository detected. To commit changes:');
        console.log('   git add .');
        console.log('   git commit -m "Update journal entries"');
        console.log('   git push');
    } catch (e) {
        // Not a git repo, that's fine
    }
    
} catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
}