// Script to add missing templates back to html-templates.js and js-templates.js
const fs = require('fs');
const path = require('path');

// Read current HTML templates
const htmlTemplatesPath = path.join(__dirname, '..', 'coded', 'templates', 'html-templates.js');
let htmlContent = fs.readFileSync(htmlTemplatesPath, 'utf8');

// Read current JS templates
const jsTemplatesPath = path.join(__dirname, '..', 'coded', 'templates', 'js-templates.js');
let jsContent = fs.readFileSync(jsTemplatesPath, 'utf8');

// Parse JSON from the export statements
const htmlMatch = htmlContent.match(/export const HTML_TEMPLATES = ([\s\S]+);/);
const htmlTemplates = JSON.parse(htmlMatch[1]);

const jsMatch = jsContent.match(/export const JS_TEMPLATES = ([\s\S]+);/);
const jsTemplates = JSON.parse(jsMatch[1]);

// New HTML templates to add
const newHtmlTemplates = [
    {
        "name": "User Profile",
        "description": "CRM-style user profile with avatar and details",
        "content": "<div class=\"container\">\\n  <article class=\"card\" aria-labelledby=\"profile-heading\">\\n    <header style=\"display: flex; align-items: center; gap: 1.5rem; margin-bottom: 2rem;\">\\n      <img src=\"https://via.placeholder.com/100\" alt=\"Profile picture of Sarah Johnson\" style=\"width: 100px; height: 100px; border-radius: 50%; object-fit: cover;\">\\n      <div>\\n        <h1 id=\"profile-heading\" style=\"margin-bottom: 0.25rem;\">Sarah Johnson</h1>\\n        <p style=\"color: var(--text-muted); margin: 0;\">Senior Product Manager</p>\\n        <p style=\"color: var(--text-muted); margin: 0; font-size: 0.875rem;\">Member since January 2024</p>\\n      </div>\\n    </header>\\n\\n    <section aria-labelledby=\"contact-heading\">\\n      <h2 id=\"contact-heading\">Contact information</h2>\\n      <dl style=\"display: grid; grid-template-columns: 120px 1fr; gap: 0.5rem 1rem; margin-bottom: 2rem;\">\\n        <dt style=\"font-weight: 500;\">Email:</dt>\\n        <dd style=\"margin: 0;\"><a href=\"mailto:sarah.johnson@example.com\">sarah.johnson@example.com</a></dd>\\n        \\n        <dt style=\"font-weight: 500;\">Phone:</dt>\\n        <dd style=\"margin: 0;\"><a href=\"tel:+15551234567\">+1 (555) 123-4567</a></dd>\\n        \\n        <dt style=\"font-weight: 500;\">Location:</dt>\\n        <dd style=\"margin: 0;\">San Francisco, CA</dd>\\n        \\n        <dt style=\"font-weight: 500;\">Department:</dt>\\n        <dd style=\"margin: 0;\">Product Development</dd>\\n      </dl>\\n    </section>\\n\\n    <section aria-labelledby=\"activity-heading\">\\n      <h2 id=\"activity-heading\">Recent activity</h2>\\n      <ul style=\"list-style: none; padding: 0;\">\\n        <li style=\"padding: 0.75rem 0; border-bottom: 1px solid var(--border);\">\\n          <time datetime=\"2025-01-15\" style=\"color: var(--text-muted); font-size: 0.875rem;\">Jan 15, 2025</time>\\n          <p style=\"margin: 0.25rem 0 0;\">Updated project roadmap for Q1</p>\\n        </li>\\n        <li style=\"padding: 0.75rem 0; border-bottom: 1px solid var(--border);\">\\n          <time datetime=\"2025-01-12\" style=\"color: var(--text-muted); font-size: 0.875rem;\">Jan 12, 2025</time>\\n          <p style=\"margin: 0.25rem 0 0;\">Completed user research interviews</p>\\n        </li>\\n        <li style=\"padding: 0.75rem 0;\">\\n          <time datetime=\"2025-01-08\" style=\"color: var(--text-muted); font-size: 0.875rem;\">Jan 8, 2025</time>\\n          <p style=\"margin: 0.25rem 0 0;\">Joined the product design team meeting</p>\\n        </li>\\n      </ul>\\n    </section>\\n\\n    <footer style=\"margin-top: 2rem; padding-top: 1rem; border-top: 1px solid var(--border);\">\\n      <button class=\"btn\">Edit profile</button>\\n      <button class=\"btn btn-secondary\" style=\"margin-left: 0.5rem;\">View full history</button>\\n    </footer>\\n  </article>\\n</div>"
    }
];

// Add new templates to starters array
htmlTemplates.starters.push(...newHtmlTemplates);

// Write updated HTML templates back
fs.writeFileSync(
    htmlTemplatesPath,
    `// HTML starter and testing templates\\nexport const HTML_TEMPLATES = ${JSON.stringify(htmlTemplates, null, 4)};\\n`,
    'utf8'
);

console.log('✅ Added 1 HTML template (User Profile)');
console.log('Note: Remaining 9 templates will be added in next batch');
