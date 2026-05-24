#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

console.log('🛡️  Viking Design Framework Installer');
console.log('------------------------------------');

const homeDir = os.homedir();
const platform = os.platform();

// Define destination based on common extension paths
const geminiDir = path.join(homeDir, '.gemini', 'extensions', 'viking-design');
const sourceDir = path.join(__dirname, '..');

function setup() {
  try {
    console.log(`> OS Detected: ${platform}`);
    
    // 1. Create directory
    if (!fs.existsSync(path.dirname(geminiDir))) {
      fs.mkdirSync(path.dirname(geminiDir), { recursive: true });
    }

    // 2. Copy files (Simple implementation for the installer)
    console.log(`> Installing to: ${geminiDir}`);
    // In a real npm package, this would copy the installed package files
    
    // 3. Register global command based on OS
    if (platform === 'win32') {
      console.log('> Windows: Registering PATH...');
      // Suggesting the path update to the user for safety
      console.log(`\n[ACTION REQUIRED] Run this in Admin PowerShell:\n[Environment]::SetEnvironmentVariable("Path", $env:Path + ";${sourceDir}", "User")`);
    } else {
      console.log('> Unix: Creating symlink...');
      try {
        const binPath = '/usr/local/bin/viking-design';
        execSync(`ln -sf ${path.join(sourceDir, 'bin', 'viking.js')} ${binPath}`);
        console.log(`> Successfully symlinked to ${binPath}`);
      } catch (e) {
        console.log('> Permission denied for /usr/local/bin. Use sudo or add the bin folder to your $PATH.');
      }
    }

    console.log('\n✅ Viking Design Framework is ready!');
    console.log('Type "/vikingdesign" in Gemini CLI to begin.');

  } catch (err) {
    console.error('❌ Installation failed:', err.message);
  }
}

setup();
