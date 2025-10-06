# AI Project Advisor

A tool that maps out AI-powered workflows, explaining how they work, how hard they are to build, and what designers and engineers should plan for.

## 🎯 What This Tool Does

Start with your industry and a common workflow. This tool:
- Maps out the AI behind it
- Explains technical complexity
- Shows OOUX (Object-Oriented UX) workflows
- Provides implementation guidance for designers and engineers

**Live Demo**: Password-protected at `/aiadvisor/`

---

## 🏗️ Architecture Overview

### Core Components

```
aiadvisor/
├── index.html              # Password login page
├── app.html                # Main application (post-login)
├── login.js               # Authentication logic with session management
├── login.css              # Login page styles
├── styles.css             # Main app styles
├── js/
│   ├── config/           # Configuration files
│   │   ├── icons.js      # Icon definitions
│   │   ├── principles.js # AI principles
│   │   ├── workflow-patterns.js  # 12 universal patterns
│   │   ├── templates.js  # 47 pre-built templates
│   │   ├── template-workflows.js # Custom OOUX workflows
│   │   ├── touchpoint-details.js
│   │   ├── risk-explanations.js
│   │   ├── glossary.js
│   │   └── decision-framework.js
│   ├── logic/            # Business logic
│   │   ├── detect.js     # Pattern detection
│   │   ├── workflow-generator.js
│   │   ├── complexity.js
│   │   └── analyze.js
│   ├── components/       # React components
│   │   └── app.js        # Main React app
│   ├── domains/          # Domain-specific extensions
│   │   ├── hcm.js        # Human Capital Management
│   │   └── finance.js    # Financial Services
│   └── main.js           # App initialization
└── dist/
    └── bundle.js         # Webpack bundle (optional)
```

---

## 🔐 Authentication System

### Password Protection
- **Login Page**: `/aiadvisor/` or `/aiadvisor/index.html`
- **Password**: SHA-256 hashed (see login.js to set your own)
- **Session Duration**: 30 minutes
- **Storage**: sessionStorage (expires on browser close)

### How It Works
1. User enters password at `/aiadvisor/`
2. Password is hashed using SHA-256 via Web Crypto API
3. Hash is compared to stored hash: `6b07f7ecaf72ae5acc240e02e23768cf390ab7291d7743c182b1eb701597ba51`
4. On success: Sets `aiadvisor_auth` and `aiadvisor_auth_time` in sessionStorage
5. Redirects to `/aiadvisor/app.html`
6. Every page load checks if session is valid (< 30 minutes old)
7. Expired sessions redirect back to login

### Changing the Password

Edit `\kartoonerdotcom\aiadvisor\login.js`:
```javascript
// Generate new hash:
// echo -n "newpassword" | sha256sum

const correctPasswordHash = 'your-new-hash-here';
```

### Adjusting Session Timeout

Change `1800000` (30 minutes in milliseconds) in two files:
- `\kartoonerdotcom\aiadvisor\login.js`
- `\kartoonerdotcom\aiadvisor\app.html`

---

## 🧠 How the AI Analysis Works

### 1. Pattern Detection (`detect.js`)

The system uses **12 Universal Workflow Patterns** to categorize AI features:

| Pattern | Trigger Keywords | Use Cases |
|---------|-----------------|-----------|
| `autoApproval` | auto, approv, automatic | PTO approval, loan approval |
| `anomalyDetection` | detect, anomal, missing, flag, error | Fraud detection, data validation |
| `intelligentScoring` | score, insight, rating, classify | Credit scoring, candidate ranking |
| `predictiveIntelligence` | predict, forecast, alert, insight | Turnover prediction, demand forecasting |
| `unifiedEntityView` | unified, 360, vantage, complete view | Customer 360, employee profile |
| `crossSystemWorkflow` | workflow, orchestrat, multi-system | Onboarding, account closure |
| `naturalLanguageQA` | question, ask, chat, conversational | HR chatbot, banking assistant |
| `intelligentSearch` | search, find, discover, lookup | Employee directory, document search |
| `impactAnalysis` | impact, what if, scenario, analysis | Compensation changes, rate impacts |
| `resourceOptimization` | schedul, optimiz, allocat, plan | Shift scheduling, portfolio optimization |
| `realTimeProcessing` | real-time, lock, process, validate | Payroll lock, trading execution |
| `smartAggregation` | aggregat, consolidat, merge, combine | Statement generation, batch processing |

**Detection Algorithm**:
```javascript
function detectWorkflowPattern(concept) {
  const text = concept.toLowerCase();

  // Check each pattern's trigger keywords
  for (const [patternKey, pattern] of Object.entries(WORKFLOW_PATTERNS)) {
    for (const keyword of pattern.triggerKeywords) {
      if (text.includes(keyword)) {
        return patternKey; // First match wins
      }
    }
  }

  return 'intelligentScoring'; // Default fallback
}
```

### 2. Template System (`templates.js`)

**47 Pre-built Templates** across three categories:

- **Generic (16)**: Smart field autofill, data validation, text classification
- **HCM (16)**: Employee search, time entry, performance routing, turnover prediction
- **Finance (15)**: Transaction categorization, fraud detection, loan approval

Each template includes:
```javascript
{
  title: 'Smart Field Autofill',
  slug: 'smart-field-autofill',
  concept: 'Predict and suggest form field values based on historical data',
  category: 'generic',
  icon: '⚡',
  complexity: 'Medium',
  description: '...'
}
```

### 3. OOUX Workflow Generation (`workflow-generator.js`)

Generates **Object-Oriented UX workflows** with:

**Objects**: Core entities with content, metadata, and actions
```javascript
{
  name: 'Form Field',
  coreContent: ['fieldName', 'fieldType', 'currentValue'],
  metadata: ['lastFilled', 'confidence', 'source'],
  actions: ['focus', 'blur', 'acceptSuggestion']
}
```

**Flow**: Step-by-step user and AI interactions
```javascript
{
  step: 1,
  actor: 'User',
  action: 'Focuses on form field',
  object: 'Form Field'
}
```

**AI Touchpoints**: Specific AI capabilities
```javascript
[
  'Analyzes user historical form submissions',
  'Identifies most frequent values by field',
  'Predicts likely value with confidence scoring'
]
```

### 4. Custom Workflows (`template-workflows.js`)

For enhanced accuracy, specific templates have **custom OOUX workflows**:

```javascript
const TEMPLATE_WORKFLOWS = {
  'smart-field-autofill': {
    objects: [/* specific objects */],
    flow: [/* specific steps */],
    aiTouchpoints: [/* specific capabilities */],
    configurationNeeds: [/* specific settings */]
  }
  // ... more templates
};
```

**Workflow Priority**:
1. Check for template-specific workflow (if `templateSlug` provided)
2. Fall back to pattern-based generation
3. Use pattern's universal workflow structure

---

## 🎨 Adding Your Own Templates

### Step 1: Add Template to `templates.js`

```javascript
const GENERIC_TEMPLATES = [
  // ... existing templates
  {
    title: 'Your Template Name',
    slug: 'your-template-slug',
    concept: 'Description with pattern trigger keywords',
    category: 'generic', // or 'hcm' or 'finance'
    icon: '🔥',
    complexity: 'Medium', // Low, Medium, High
    description: 'Detailed explanation of the AI feature',
    commonIn: ['SaaS', 'E-commerce'],
    examples: ['Example 1', 'Example 2']
  }
];
```

**Important**: Include trigger keywords from your intended pattern in the `concept` field.

### Step 2: (Optional) Add Custom OOUX Workflow

Create entry in `template-workflows.js`:

```javascript
const TEMPLATE_WORKFLOWS = {
  'your-template-slug': {
    objects: [
      {
        name: 'Your Object',
        description: 'What this object represents',
        coreContent: ['field1', 'field2'],
        metadata: ['createdDate', 'status'],
        actions: ['create', 'update', 'delete']
      }
    ],
    flow: [
      {
        step: 1,
        actor: 'User',
        action: 'Does something',
        object: 'Your Object'
      }
    ],
    aiTouchpoints: [
      'AI capability 1',
      'AI capability 2'
    ],
    configurationNeeds: [
      {
        setting: 'Setting Name',
        description: 'What it controls',
        default: 'Default value'
      }
    ]
  }
};
```

### Step 3: Test Pattern Detection

```javascript
const concept = 'Your concept text';
const pattern = detectWorkflowPattern(concept);
console.log('Detected pattern:', pattern);
```

Ensure it matches your intended pattern. If not, adjust trigger keywords in the concept.

---

## 🔧 Customization Guide

### Adding New Workflow Patterns

Edit `workflow-patterns.js`:

```javascript
const WORKFLOW_PATTERNS = {
  yourNewPattern: {
    name: 'Your Pattern Name',
    description: 'What this pattern does',
    triggerKeywords: ['keyword1', 'keyword2', 'keyword3'],
    commonObjects: ['object1', 'object2'],
    complexity: 'Medium',
    // ... additional properties
  }
};
```

### Adding Domain-Specific Objects

Create a new file like `domains/retail.js`:

```javascript
if (typeof GENERIC_OBJECTS !== 'undefined') {
  Object.assign(GENERIC_OBJECTS, {
    product: {
      name: 'Product',
      extends: 'entity',
      coreContent: ['SKU', 'Name', 'Price', 'Inventory'],
      metadata: ['Category', 'Supplier', 'LastRestocked'],
      actions: ['View', 'Add to Cart', 'Track Inventory']
    },
    // ... more objects
  });
}
```

Load it in `app.html`:
```html
<script type="text/babel" src="/aiadvisor/js/domains/retail.js"></script>
```

### Styling Customization

Edit `styles.css` for global styles or modify Tailwind classes in `app.js`.

---

## 🚀 Deployment

### Local Development

```bash
# Start local server
node server.js

# Access at http://localhost:3000/aiadvisor/
```

### Production Deployment

1. **Upload files** to your web server
2. **Update `.htaccess`**: Remove aiadvisor block (allow access)
3. **Keep `robots.txt`**: Blocks search engine crawling
   ```
   User-agent: *
   Disallow: /aiadvisor/
   ```
4. **Test authentication**: Verify password login works
5. **Check session expiry**: Confirm 30-minute timeout

### Optional: Build Bundle

For faster loading, compile to bundle.js:

```bash
npm run bundle:aiadvisor
```

Update `app.html` to use bundle instead of individual files.

---

## 📚 Resources Used

### Frameworks & Libraries
- **React 18.2.0**: UI components
- **Tailwind CSS**: Utility-first styling
- **Babel Standalone**: JSX transpilation

### Methodologies
- **OOUX (Object-Oriented UX)**: Workflow design methodology
  - [Learn OOUX](https://www.ooux.com/)
  - Objects, Core Content, Metadata, Actions
  - User flows and system interactions

### Build Tools
- **Webpack 5**: Module bundling
- **Babel**: ES6+ transpilation
- **Terser**: JavaScript minification

---

## 🐛 Troubleshooting

### Pattern Detection Issues

**Problem**: Template gets wrong pattern

**Solution**:
1. Check `concept` text in `templates.js`
2. Verify it contains trigger keywords for intended pattern
3. Remove keywords from unintended patterns
4. Consult trigger keyword table above

**Debug**:
```javascript
const concept = 'Your concept text';
const pattern = detectWorkflowPattern(concept);
console.log('Detected:', pattern);
```

### Custom Workflow Not Loading

**Problem**: Template uses generic workflow instead of custom

**Solution**:
1. Verify `template-workflows.js` is loaded in `app.html`
2. Check slug matches exactly in both files
3. Ensure `TEMPLATE_WORKFLOWS` object is defined
4. Verify workflow-generator receives `templateSlug` parameter

**Debug**:
```javascript
console.log('Template slug:', templateSlug);
console.log('TEMPLATE_WORKFLOWS:', TEMPLATE_WORKFLOWS);
```

### Authentication Issues

**Problem**: Password not working

**Solution**:
1. Clear browser sessionStorage
2. Verify hash matches in `login.js`
3. Check browser console for errors
4. Try incognito mode

**Debug**:
```javascript
// In browser console after entering password:
const password = 'greatscott';
crypto.subtle.digest('SHA-256', new TextEncoder().encode(password))
  .then(hash => console.log(Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0')).join('')));
```

### Session Expiring Too Quickly

**Problem**: Session expires unexpectedly

**Solution**:
1. Check timeout value in `login.js` and `app.html`
2. Verify both use same timeout (1800000 = 30 min)
3. Ensure clock is in sync

---

## 📋 Code Change Requirements

For detailed implementation guidance, see:
- `CODE_CHANGES_REQUIRED.md` - Step-by-step code modifications
- `IMPLEMENTATION_PLAN.md` - Comprehensive architecture details

### Quick Reference: Adding Template-Specific Workflows

1. **Fix concept text** (if needed) in `templates.js`
2. **Create custom workflow** in `template-workflows.js`
3. **Modify workflow-generator.js**:
   ```javascript
   function generateWorkflow(concept, patternKey, objects, industry, templateSlug) {
     if (templateSlug && TEMPLATE_WORKFLOWS[templateSlug]) {
       return TEMPLATE_WORKFLOWS[templateSlug];
     }
     // ... existing pattern-based generation
   }
   ```
4. **Pass templateSlug** when calling generateWorkflow
5. **Load template-workflows.js** in `app.html`

---

## 🤝 Contributing

Want to add templates or improve the tool?

1. Fork the repository
2. Add your templates to appropriate category
3. Create custom OOUX workflows if needed
4. Test pattern detection thoroughly
5. Update documentation
6. Submit pull request

---

## 📄 License

MIT License - Feel free to use, modify, and distribute.

---

## 🎓 Learning Resources

### OOUX (Object-Oriented UX)
- Official Site: https://www.ooux.com/
- ORCA Process: Objects → Relationships → CTAs → Attributes
- Nested Object Matrix methodology

### AI Workflow Patterns
- Pattern recognition in AI features
- Universal workflow structures
- Domain-specific adaptations

### React + Babel
- React without build step (Babel Standalone)
- JSX in-browser transpilation
- Component-based architecture

---

## 🆘 Support

For questions or issues:
1. Check this README
2. Review `CODE_CHANGES_REQUIRED.md`
3. Inspect browser console for errors
4. Verify all files are loaded correctly

---

Built with ⚡ by [Your Name]

*"Where we're going, we don't need roads..."*
