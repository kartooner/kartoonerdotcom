#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// Route to the python orchestrator
const pythonScript = path.join(__dirname, '..', 'vikingdesign.py');
const args = process.argv.slice(2);

const child = spawn('python', [pythonScript, ...args], { stdio: 'inherit' });

child.on('error', (err) => {
  if (err.code === 'ENOENT') {
    console.error('❌ Error: Python not found. Please install Python to run the Viking Design Framework.');
  } else {
    console.error(`❌ Error: ${err.message}`);
  }
});
