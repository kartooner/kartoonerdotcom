// Script to split templates.js into separate files
const fs = require('fs');
const path = require('path');

// Read the current templates.js file
const templatesPath = path.join(__dirname, '..', 'coded', 'templates.js');
const templatesContent = fs.readFileSync(templatesPath, 'utf8');

// Execute the file content to get the PANEL_TEMPLATES object
const window = {};
eval(templatesContent);
const templates = window.PANEL_TEMPLATES;

// Create HTML templates file
const htmlTemplates = {
    starters: templates.html.starters,
    testing: templates.html.testing || []
};

fs.writeFileSync(
    path.join(__dirname, '..', 'coded', 'templates', 'html-templates.js'),
    `// HTML starter and testing templates
export const HTML_TEMPLATES = ${JSON.stringify(htmlTemplates, null, 4)};
`,
    'utf8'
);

// Create CSS templates file
const cssTemplates = {
    starters: templates.css.starters,
    testing: templates.css.testing || []
};

fs.writeFileSync(
    path.join(__dirname, '..', 'coded', 'templates', 'css-templates.js'),
    `// CSS starter and testing templates
export const CSS_TEMPLATES = ${JSON.stringify(cssTemplates, null, 4)};
`,
    'utf8'
);

// Create JS templates file
const jsTemplates = {
    starters: templates.js.starters,
    testing: templates.js.testing || []
};

fs.writeFileSync(
    path.join(__dirname, '..', 'coded', 'templates', 'js-templates.js'),
    `// JavaScript starter and testing templates
export const JS_TEMPLATES = ${JSON.stringify(jsTemplates, null, 4)};
`,
    'utf8'
);

console.log('✅ Templates split successfully!');
console.log('Created:');
console.log('  - coded/templates/html-templates.js');
console.log('  - coded/templates/css-templates.js');
console.log('  - coded/templates/js-templates.js');
