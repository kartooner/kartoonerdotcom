const { minify } = require('terser');
const { transformSync } = require('@babel/core');
const fs = require('fs');
const path = require('path');

const jsDir = path.join(__dirname, '../aiadvisor/js');
const outputDir = path.join(__dirname, '../aiadvisor/js-min');

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function minifyFile(filePath, relativePath) {
  let code = fs.readFileSync(filePath, 'utf8');

  try {
    // Check if file contains JSX (basic check for React syntax)
    const hasJSX = code.includes('React') || /<[A-Z]/.test(code) || /\s<\w+/.test(code);

    // Transform JSX to regular JS first if needed
    if (hasJSX) {
      const transformed = transformSync(code, {
        presets: ['@babel/preset-react'],
        filename: filePath
      });
      code = transformed.code;
    }

    const result = await minify(code, {
      compress: {
        dead_code: true,
        drop_console: false,
        drop_debugger: true,
        keep_classnames: false,
        keep_fargs: true,
        keep_fnames: false,
        keep_infinity: true
      },
      mangle: {
        toplevel: false
      },
      output: {
        comments: false
      },
      ecma: 2020
    });

    const outputPath = path.join(outputDir, relativePath);
    const outputDirPath = path.dirname(outputPath);

    if (!fs.existsSync(outputDirPath)) {
      fs.mkdirSync(outputDirPath, { recursive: true });
    }

    fs.writeFileSync(outputPath, result.code);
    console.log(`✓ Minified: ${relativePath}`);
  } catch (error) {
    console.error(`✗ Error minifying ${relativePath}:`, error.message);
    // Copy original file if minification fails
    const outputPath = path.join(outputDir, relativePath);
    const outputDirPath = path.dirname(outputPath);
    if (!fs.existsSync(outputDirPath)) {
      fs.mkdirSync(outputDirPath, { recursive: true });
    }
    fs.copyFileSync(filePath, outputPath);
    console.log(`  → Copied original file instead`);
  }
}

function getAllJsFiles(dir, baseDir = dir) {
  const files = [];
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...getAllJsFiles(fullPath, baseDir));
    } else if (item.endsWith('.js')) {
      files.push({
        fullPath,
        relativePath: path.relative(baseDir, fullPath)
      });
    }
  }

  return files;
}

async function minifyAll() {
  console.log('Starting minification of aiadvisor JS files...\n');

  const files = getAllJsFiles(jsDir);

  for (const file of files) {
    await minifyFile(file.fullPath, file.relativePath);
  }

  console.log('\n✓ Minification complete!');
  console.log(`Output directory: ${outputDir}`);
}

minifyAll().catch(console.error);
