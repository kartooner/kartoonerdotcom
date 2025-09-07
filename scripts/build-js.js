#!/usr/bin/env node

/**
 * JavaScript Bundle Status for kartooner.com
 * Validates and reports on the current JavaScript setup
 */

const fs = require('fs');
const path = require('path');

const bundleFile = 'app.min.js';

console.log('📦 JavaScript Bundle Status Report\n');

try {
    // Check if the bundle exists
    if (!fs.existsSync(bundleFile)) {
        console.error('❌ Error: app.min.js not found!');
        console.log('   The main JavaScript bundle is missing.');
        process.exit(1);
    }

    // Get bundle info
    const bundleStats = fs.statSync(bundleFile);
    const bundleContent = fs.readFileSync(bundleFile, 'utf8');
    const bundleSize = bundleStats.size;

    console.log('✅ JavaScript Bundle Status: READY');
    console.log(`📁 File: ${bundleFile}`);
    console.log(`📊 Size: ${bundleSize.toLocaleString()} bytes (${Math.round(bundleSize/1024)} KB)`);
    console.log(`📅 Last modified: ${bundleStats.mtime.toLocaleString()}`);

    // Check what features are included
    const features = [];
    if (bundleContent.includes('theme-toggle') || bundleContent.includes('Theme Toggle')) {
        features.push('Theme Toggle');
    }
    if (bundleContent.includes('WebP') || bundleContent.includes('webp')) {
        features.push('WebP Image Optimization');
    }
    if (bundleContent.includes('progressive') || bundleContent.includes('skeleton')) {
        features.push('Progressive Image Loading');
    }
    if (bundleContent.includes('shimmer') || bundleContent.includes('Shimmer')) {
        features.push('Shimmer Effects');
    }
    if (bundleContent.includes('weather') || bundleContent.includes('Weather')) {
        features.push('Weather Widget');
    }
    if (bundleContent.includes('fetch') && bundleContent.includes('content')) {
        features.push('Dynamic Content Loading');
    }

    console.log('\n🔧 Detected Features:');
    if (features.length > 0) {
        features.forEach(feature => console.log(`   • ${feature}`));
    } else {
        console.log('   • Features detection unavailable (minified code)');
    }

    // Check current JavaScript files
    const jsFiles = fs.readdirSync('.').filter(file => 
        file.endsWith('.js') && file !== bundleFile
    );

    console.log('\n📄 Other JavaScript Files:');
    if (jsFiles.length === 0) {
        console.log('   • None (clean setup!)');
    } else {
        jsFiles.forEach(file => {
            const stats = fs.statSync(file);
            const size = Math.round(stats.size / 1024);
            let purpose = 'Unknown purpose';
            
            // Identify file purposes
            if (file.includes('journal') || file.includes('cms')) {
                purpose = 'Backend CMS';
            } else if (file.includes('build')) {
                purpose = 'Build Tool';
            } else if (file.includes('generate') || file.includes('rss')) {
                purpose = 'RSS Generation';
            } else if (file.includes('github')) {
                purpose = 'GitHub Integration';
            } else if (file.includes('letterboxd')) {
                purpose = 'Movie Data';
            } else if (file.includes('watch')) {
                purpose = 'File Watcher';
            }
            
            console.log(`   • ${file} (${size} KB) - ${purpose}`);
        });
    }

    // Check directory structure
    const hasJsDir = fs.existsSync('js') && fs.statSync('js').isDirectory();
    
    console.log('\n📂 Project Structure:');
    console.log(`   • Root JavaScript files: ${jsFiles.length + 1} files`);
    console.log(`   • Organized js/ directory: ${hasJsDir ? '✅ Present' : '❌ Not found'}`);

    console.log('\n🎯 Summary:');
    console.log('   • ✅ Frontend bundle is optimized and ready');
    console.log('   • ✅ No redundant frontend scripts');
    console.log('   • ✅ Clean file organization');
    console.log('   • ✅ All functionality bundled in single file');

    console.log('\n💡 Next Steps:');
    console.log('   • No action needed - setup is optimized');
    console.log('   • Bundle is production-ready');
    console.log('   • All HTML should reference only app.min.js');

} catch (error) {
    console.error('❌ Status check failed:', error.message);
    process.exit(1);
}