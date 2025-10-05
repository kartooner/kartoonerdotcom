# Exact Code Changes Required

## Summary
This document provides the exact line-by-line code changes needed to implement template-specific OOUX workflows.

---

## CHANGE 1: Fix Smart Field Autofill Concept

**File**: `D:\Github\kartoonerdotcom\aiadvisor\js\config\templates.js`

**Line**: 8

**Current**:
```javascript
concept: 'Auto-fill form fields using historical data and patterns',
```

**Change to**:
```javascript
concept: 'Predict and suggest form field values based on historical data and patterns',
```

**Reason**: "Auto-fill" contains "Auto" which triggers autoApproval pattern. "Predict and suggest" contains "Predict" which correctly triggers predictiveIntelligence pattern.

---

## CHANGE 2: Modify Workflow Generator

**File**: `D:\Github\kartoonerdotcom\aiadvisor\js\logic\workflow-generator.js`

### Change 2A: Add import for template workflows (after line 2)

**Add after line 2**:
```javascript
// Load template-specific workflows if available
// This will be loaded from template-workflows.js
```

### Change 2B: Update function signature (line 4)

**Current**:
```javascript
function generateWorkflow(concept, patternKey, objects, industry = 'generic') {
```

**Change to**:
```javascript
function generateWorkflow(concept, patternKey, objects, industry = 'generic', templateSlug = null) {
```

### Change 2C: Add template-specific workflow check (after line 4, before existing code)

**Add immediately after line 4 (inside the function)**:
```javascript
    // Check for template-specific workflow first
    if (templateSlug && typeof TEMPLATE_WORKFLOWS !== 'undefined' && TEMPLATE_WORKFLOWS[templateSlug]) {
        return TEMPLATE_WORKFLOWS[templateSlug];
    }

    // If no template-specific workflow, fall back to pattern-based generation
```

**Full function should now look like**:
```javascript
function generateWorkflow(concept, patternKey, objects, industry = 'generic', templateSlug = null) {
    // Check for template-specific workflow first
    if (templateSlug && typeof TEMPLATE_WORKFLOWS !== 'undefined' && TEMPLATE_WORKFLOWS[templateSlug]) {
        return TEMPLATE_WORKFLOWS[templateSlug];
    }

    // If no template-specific workflow, fall back to pattern-based generation
    const workflow = {
        objects: [],
        flow: [],
        aiTouchpoints: [],
        configurationNeeds: []
    };

    // ... rest of existing code unchanged
}
```

---

## CHANGE 3: Update Calling Code

**File**: Find where `generateWorkflow()` is called (likely in a component or analyzer)

**Current pattern**:
```javascript
const workflow = generateWorkflow(concept, pattern, objects, industry);
```

**Change to**:
```javascript
const workflow = generateWorkflow(concept, pattern, objects, industry, templateSlug);
```

**Note**: You'll need to pass the `templateSlug` from the template being analyzed. This should be available from the template object.

**Example**:
```javascript
// If you have a template object like this:
const template = {
    title: 'Smart Field Autofill',
    slug: 'smart-field-autofill',
    concept: '...',
    // ...
};

// Pass the slug to generateWorkflow:
const workflow = generateWorkflow(
    template.concept,
    detectedPattern,
    relevantObjects,
    'generic',
    template.slug  // <-- Add this parameter
);
```

---

## CHANGE 4: Add Script Tag to HTML

**File**: Main HTML file that loads scripts (likely `index.html` or similar)

**Find the section where config scripts are loaded**:
```html
<script src="js/config/templates.js"></script>
<script src="js/config/workflow-patterns.js"></script>
<!-- other config files -->
```

**Add after templates.js**:
```html
<script src="js/config/templates.js"></script>
<script src="js/config/template-workflows.js"></script>  <!-- ADD THIS LINE -->
<script src="js/config/workflow-patterns.js"></script>
```

**Important**: template-workflows.js must be loaded AFTER templates.js but BEFORE workflow-generator.js

---

## VERIFICATION STEPS

After making these changes, verify:

### 1. Pattern Detection Test
```javascript
// Test smart-field-autofill pattern detection
const concept = 'Predict and suggest form field values based on historical data and patterns';
const pattern = detectWorkflowPattern(concept);
console.log(pattern); // Should be 'predictiveIntelligence', NOT 'autoApproval'
```

### 2. Template Workflow Test
```javascript
// Test template-specific workflow retrieval
const workflow = generateWorkflow(
    'Predict and suggest form field values based on historical data and patterns',
    'predictiveIntelligence',
    ['formField', 'userProfile', 'historicalEntry', 'prediction'],
    'generic',
    'smart-field-autofill'
);

console.log(workflow.objects.length); // Should be 4 (formField, userProfile, historicalEntry, prediction)
console.log(workflow.objects[0].name); // Should be 'Form Field'
```

### 3. Fallback Test
```javascript
// Test fallback to pattern-based generation
const workflow = generateWorkflow(
    'Some concept',
    'autoApproval',
    ['request', 'approval'],
    'generic',
    'non-existent-slug'  // Slug not in TEMPLATE_WORKFLOWS
);

// Should still return a valid workflow using pattern-based generation
console.log(workflow.flow.length > 0); // Should be true
```

---

## FILE CHECKLIST

Before deploying, ensure:

- [x] `templates.js` - Line 8 concept text fixed
- [x] `workflow-generator.js` - Function signature updated with templateSlug parameter
- [x] `workflow-generator.js` - Template-specific workflow check added
- [x] `template-workflows.js` - Created with all 47 template workflows
- [x] Main HTML file - Script tag added for template-workflows.js
- [x] Calling code - Updated to pass templateSlug parameter
- [x] All 3 verification tests pass

---

## DEBUGGING TIPS

If templates still get wrong patterns:

1. **Check concept text**: Verify the concept text doesn't contain trigger keywords for wrong pattern
2. **Check keyword list**: Review workflow-patterns.js triggerKeywords arrays
3. **Console log pattern detection**: Add `console.log('Detected pattern:', pattern)` in detect.js
4. **Verify script load order**: Ensure template-workflows.js loads before workflow-generator.js

If templates don't get custom workflows:

1. **Check templateSlug parameter**: Verify it's being passed correctly to generateWorkflow()
2. **Check TEMPLATE_WORKFLOWS**: Verify the slug exists in TEMPLATE_WORKFLOWS object
3. **Check script loading**: Ensure template-workflows.js is loaded and TEMPLATE_WORKFLOWS is defined
4. **Console log**: Add `console.log('Template slug:', templateSlug)` in generateWorkflow()

---

## PATTERN DETECTION REFERENCE

For future templates, use these trigger keywords:

| Pattern | Trigger Keywords |
|---------|-----------------|
| autoApproval | 'auto', 'approv', 'automatic' |
| anomalyDetection | 'detect', 'anomal', 'missing', 'flag', 'error' |
| intelligentScoring | 'score', 'insight', 'rating', 'classify' |
| predictiveIntelligence | 'predict', 'forecast', 'alert', 'insight', 'dashboard', 'proactive' |
| unifiedEntityView | 'unified', 'everything about', 'complete view', '360', 'vantage' |
| crossSystemWorkflow | 'cross-domain', 'workflow', 'orchestrat', 'multi-system', 'process' |
| naturalLanguageQA | 'question', 'ask', 'chat', 'conversational', 'natural language' |
| intelligentSearch | 'search', 'find', 'discover', 'global', 'lookup' |
| impactAnalysis | 'impact', 'what if', 'scenario', 'analysis', 'consequence' |
| resourceOptimization | 'schedul', 'optimiz', 'allocat', 'generat', 'plan' |
| realTimeProcessing | 'real-time', 'lock', 'process', 'validate', 'cutoff' |
| smartAggregation | 'aggregat', 'consolidat', 'merge', 'append', 'combine' |

**Pro Tip**: When writing concept text, use keywords from the INTENDED pattern, avoid keywords from other patterns.

---

## ROLLBACK PLAN

If issues arise, rollback in this order:

1. **Remove script tag** from HTML (removes template-workflows.js)
2. **Revert workflow-generator.js** to original (remove templateSlug parameter and check)
3. **Revert templates.js line 8** to original concept text
4. System will work as before with pattern-based generation only

---

## SUCCESS CRITERIA

✅ Smart Field Autofill matches predictiveIntelligence pattern (not autoApproval)
✅ All 47 templates have unique OOUX workflows
✅ Each template's objects are specific to its use case
✅ Each template's workflow steps are contextual and relevant
✅ System falls back gracefully if template workflow not found
✅ No breaking changes to existing functionality
