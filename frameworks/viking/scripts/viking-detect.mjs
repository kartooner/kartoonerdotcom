/**
 * Eye of Mimir: Viking Design Slop Detector
 * Deterministic detection of design anti-patterns.
 */

import fs from 'node:fs';
import path from 'node:path';

const RULES = [
  {
    name: 'Generic AI Purple Gradient',
    regex: /linear-gradient\(.*#(?:8b5cf6|a855f7|d946ef).*#(?:3b82f6|6366f1).*\)/gi,
    message: 'REJECT: Found generic AI-marketing purple/blue gradient. Use functional, brand-aware colors instead.'
  },
  {
    name: 'Bouncy Animation',
    regex: /transition:.*(?:bounce|elastic|cubic-bezier\(.*0\..*1\..*\))/gi,
    message: 'REJECT: Viking law forbids bouncy easing. Use exponential ease-out (ease-out-expo) for resilient motion.'
  },
  {
    name: 'Side-Stripe Accents',
    regex: /border-(?:left|right):\s*[2-9]px/gi,
    message: 'REJECT: Side-stripe borders > 1px are banned. Use full borders or background tints.'
  },
  {
    name: 'Gradient Text',
    regex: /background-clip:\s*text/gi,
    message: 'REJECT: Gradient text is decorative slop. Use single solid colors and font-weight for emphasis.'
  },
  {
    name: 'Excessive Inter Usage',
    regex: /font-family:.*['"]?Inter['"]?/gi,
    message: 'NOTICE: Overused font "Inter" detected. Verify if "Geist" or a high-character alternative is more Viking-appropriate.'
  }
];

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const violations = [];

  for (const rule of RULES) {
    if (rule.regex.test(content)) {
      violations.push({
        file: filePath,
        rule: rule.name,
        message: rule.message
      });
    }
  }

  return violations;
}

function run() {
  const files = process.argv.slice(2);
  let allViolations = [];

  for (const file of files) {
    if (fs.existsSync(file) && fs.statSync(file).isFile()) {
      allViolations = allViolations.concat(scanFile(file));
    }
  }

  if (allViolations.length > 0) {
    console.log('🛡️  EYE OF MIMIR: Design Slop Detected');
    console.log('------------------------------------');
    allViolations.forEach(v => {
      console.log(`[${v.rule}] ${v.file}: ${v.message}`);
    });
    process.exit(1);
  } else {
    console.log('✅ No design slop detected. The Council is pleased.');
  }
}

run();
