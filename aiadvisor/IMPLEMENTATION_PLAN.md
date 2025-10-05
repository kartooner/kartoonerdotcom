# Comprehensive OOUX Workflow Implementation Plan

## Executive Summary

This plan addresses two critical issues:
1. **Pattern Detection Issues** - Some templates have incorrect concept text that causes wrong pattern matching
2. **Generic OOUX Workflows** - Currently all templates of the same pattern type get identical workflows, but each of the 47 templates needs its own specific OOUX workflow

---

## PART 1: PATTERN DETECTION FIXES

### Current Problem
The pattern detector (D:\Github\kartoonerdotcom\aiadvisor\js\logic\detect.js) uses keyword matching on concept text. Some templates have concepts with wrong trigger keywords.

### Critical Issues Found

#### Issue #1: Smart Field Autofill (Line 8)
- **Current Concept**: "Auto-fill form fields using historical data and patterns"
- **Current Pattern Match**: autoApproval (matches "Auto" keyword)
- **Correct Pattern**: predictiveIntelligence
- **Fix**: Change concept to: "Predict and suggest form field values based on historical data and patterns"

#### Issue #2: Auto-Approval Workflow (Line 32)
- **Current Concept**: "Auto-approve requests based on policy compliance and risk assessment"
- **Current Pattern Match**: autoApproval ✓ (CORRECT)
- **No Change Needed**

#### Issue #3: Anomaly Detection & Correction (Line 40)
- **Current Concept**: "Detect anomalies in transaction data and suggest corrections"
- **Current Pattern Match**: anomalyDetection ✓ (CORRECT)
- **No Change Needed**

#### Issue #4: Data Validation Assistant (Line 16)
- **Current Concept**: "Validate data entries and flag likely errors before submission"
- **Current Pattern Match**: anomalyDetection (matches "flag")
- **Correct Pattern**: anomalyDetection ✓ (ACTUALLY CORRECT)
- **No Change Needed**

#### Issue #5: Simple Text Classification (Line 24)
- **Current Concept**: "Classify text entries into predefined categories"
- **Current Pattern Match**: intelligentScoring (matches "classify")
- **Correct Pattern**: intelligentScoring ✓ (CORRECT - classification IS a scoring/routing pattern)
- **No Change Needed**

#### Issue #6: Resource Optimization (Line 112)
- **Current Concept**: "Optimize resource allocation using historical data"
- **Current Pattern Match**: resourceOptimization ✓ (CORRECT)
- **No Change Needed**

### ALL CONCEPT TEXT FIXES REQUIRED

Only **ONE** fix is needed:

**File**: D:\Github\kartoonerdotcom\aiadvisor\js\config\templates.js

**Line 8** (Smart Field Autofill concept):
```javascript
// BEFORE:
concept: 'Auto-fill form fields using historical data and patterns',

// AFTER:
concept: 'Predict and suggest form field values based on historical data and patterns',
```

---

## PART 2: TEMPLATE-SPECIFIC OOUX WORKFLOWS

### Current Problem
The workflow-generator.js creates workflows based ONLY on pattern type. All templates that match the same pattern get identical OOUX workflows.

**Example**:
- "PTO Auto-Approval" and "Loan Auto-Approval" both match autoApproval pattern
- Both get the exact same generic workflow
- They should have completely different objects and steps

### Solution Architecture

**Option A: Template Slug Mapping (RECOMMENDED)**
Create a new file that maps each template slug to its specific OOUX workflow.

**Option B: Modify workflow-generator.js**
Add template-specific logic inside the generator functions.

**Recommendation**: Option A is cleaner, more maintainable, and follows separation of concerns.

---

## PART 3: CUSTOM OOUX WORKFLOWS BY TEMPLATE

### Template Analysis - All 47 Templates Categorized

#### GENERIC TEMPLATES (16)

| Slug | Pattern | Custom Objects Needed |
|------|---------|----------------------|
| smart-field-autofill | predictiveIntelligence | formField, userProfile, historicalEntry, prediction |
| data-validation-assistant | anomalyDetection | formField, validationRule, errorFlag, correction |
| simple-text-classification | intelligentScoring | textEntry, category, classificationRule, confidence |
| auto-approval-workflow | autoApproval | request, policy, riskScore, approval |
| anomaly-detection-correction | anomalyDetection | transaction, baseline, anomaly, correction |
| intelligent-scoring-routing | intelligentScoring | item, scoreFactor, score, routingRule |
| predictive-intelligence-dashboard | predictiveIntelligence | dataSource, prediction, alert, insight |
| unified-entity-intelligence | unifiedEntityView | entity, dataSource, aggregation, insight |
| organization-profile-intelligence | unifiedEntityView | organization, contract, relationship, metric |
| cross-system-orchestration | crossSystemWorkflow | workflow, system, task, dependency |
| natural-language-qa | naturalLanguageQA | question, intent, answer, confidence |
| intelligent-search-discovery | intelligentSearch | query, searchResult, ranking, filter |
| what-if-impact-analysis | impactAnalysis | scenario, entity, impact, recommendation |
| resource-optimization | resourceOptimization | resource, constraint, demand, schedule |
| real-time-data-processing | realTimeProcessing | dataStream, validation, alert, action |
| smart-data-aggregation | smartAggregation | item, aggregationRule, batch, summary |

#### HCM TEMPLATES (16)

| Slug | Pattern | Custom Objects Needed |
|------|---------|----------------------|
| employee-directory-search | intelligentSearch | employee, searchQuery, skill, department |
| time-entry-suggestions | predictiveIntelligence | employee, timeEntry, schedule, prediction |
| job-requisition-routing | autoApproval | jobReq, approver, department, workflow |
| performance-review-auto-routing | autoApproval | review, employee, manager, escalation |
| benefits-enrollment-errors | anomalyDetection | employee, benefitPlan, enrollment, error |
| candidate-quality-scoring | intelligentScoring | candidate, resume, jobReq, scoreCard |
| turnover-prediction | predictiveIntelligence | employee, riskFactor, prediction, retentionAction |
| employee-360-view | unifiedEntityView | employee, timeData, payrollData, benefitsData |
| department-intelligence-profile | unifiedEntityView | department, employee, metric, trend |
| new-hire-onboarding | crossSystemWorkflow | newHire, task, system, dependency |
| hr-chatbot | naturalLanguageQA | question, employee, answer, hrPolicy |
| people-search | intelligentSearch | employee, searchQuery, document, policy |
| compensation-change-impact | impactAnalysis | employee, salaryChange, budget, impact |
| ai-interview-scheduling | resourceOptimization | candidate, interviewer, timeSlot, schedule |
| open-enrollment-processing | realTimeProcessing | employee, election, validation, confirmation |
| learning-path-recommendations | predictiveIntelligence | employee, skill, course, learningPath |
| pto-auto-approval | autoApproval | ptoRequest, employee, coverage, approval |
| missing-punch-detection | anomalyDetection | timeEntry, schedule, gap, suggestion |
| timecard-anomaly-scoring | intelligentScoring | timecard, employee, anomaly, score |
| overtime-prediction | predictiveIntelligence | employee, schedule, overtimeTrend, alert |
| ai-schedule-generation | resourceOptimization | employee, shift, demand, schedule |
| payroll-lock-validation | realTimeProcessing | timecard, validation, payroll, lock |

#### FINANCE TEMPLATES (15)

| Slug | Pattern | Custom Objects Needed |
|------|---------|----------------------|
| transaction-categorization | intelligentScoring | transaction, merchant, category, rule |
| receipt-data-extraction | anomalyDetection | receipt, field, extraction, validation |
| payment-amount-validation | anomalyDetection | payment, baseline, outlier, flag |
| loan-auto-approval | autoApproval | loanApp, creditScore, riskAssessment, approval |
| fraud-detection | anomalyDetection | transaction, pattern, fraudScore, alert |
| credit-risk-scoring | intelligentScoring | loanApp, creditFactor, riskScore, tier |
| credit-risk-forecasting | predictiveIntelligence | portfolio, riskMetric, forecast, recommendation |
| customer-360 | unifiedEntityView | customer, account, transaction, interaction |
| company-profile-intelligence | unifiedEntityView | company, account, creditFacility, riskProfile |
| account-closure-workflow | crossSystemWorkflow | account, linkedAccount, closure, task |
| banking-chatbot | naturalLanguageQA | question, customer, account, answer |
| financial-search | intelligentSearch | query, transaction, account, document |
| interest-rate-impact | impactAnalysis | portfolio, rateChange, impact, strategy |
| portfolio-optimization | resourceOptimization | asset, riskProfile, allocation, rebalance |
| real-time-trading | realTimeProcessing | order, validation, execution, confirmation |
| statement-consolidation | smartAggregation | transaction, period, statement, summary |

---

## PART 4: DETAILED CUSTOM OOUX WORKFLOWS (10 EXAMPLES)

### Example 1: Smart Field Autofill (generic/smart-field-autofill)

**Pattern**: predictiveIntelligence

**Objects**:
- **formField**: The input field being filled
  - Core: fieldName, fieldType, currentValue, placeholder
  - Actions: focus, blur, acceptSuggestion, rejectSuggestion
- **userProfile**: User's profile data
  - Core: userId, preferences, commonValues, history
  - Actions: viewProfile, updatePreferences
- **historicalEntry**: Past form submissions
  - Core: submissionDate, fieldValues, context, frequency
  - Actions: viewHistory, analyze
- **prediction**: AI-generated suggestion
  - Core: suggestedValue, confidence, reasoning, alternatives
  - Actions: accept, reject, modify, learn

**Workflow Steps**:
1. User focuses on form field → System activates prediction
2. AI queries user profile and historical entries
3. AI analyzes patterns in past submissions for this field
4. AI generates prediction with confidence score
5. System displays suggestion inline (if confidence > 85%)
6. User accepts/modifies/ignores suggestion
7. AI learns from user's choice to improve future predictions

**AI Touchpoints**:
- Analyzes user's historical form submissions
- Identifies most frequent values by field and context
- Considers current session context (other field values)
- Predicts likely value with confidence scoring
- Adapts to user acceptance/rejection patterns
- Handles edge cases (new users, rare fields)

---

### Example 2: Time Entry Suggestions (hcm/time-entry-suggestions)

**Pattern**: predictiveIntelligence

**Objects**:
- **employee**: The employee submitting time
  - Core: employeeId, name, department, role
  - Actions: viewProfile, viewSchedule
- **timeEntry**: Time entry record
  - Core: date, hours, project, costCenter, status
  - Actions: create, edit, submit, approve
- **schedule**: Employee's work schedule
  - Core: shiftPattern, startTime, endTime, daysWorked
  - Actions: view, compare
- **shift**: Individual shift assignment
  - Core: date, location, department, expectedHours
  - Actions: view, validate
- **prediction**: Suggested time entry
  - Core: suggestedHours, suggestedProject, confidence, reasoning
  - Actions: accept, modify, reject

**Workflow Steps**:
1. Employee opens timesheet for the week
2. AI analyzes employee's schedule and shift assignments
3. AI compares schedule to historical time entry patterns
4. AI predicts time entries for each scheduled shift
5. System pre-fills timesheet with suggestions
6. Employee reviews, modifies, and confirms
7. AI learns from modifications to improve accuracy

**AI Touchpoints**:
- Matches employee schedule to expected work days
- Analyzes historical time entry patterns (projects, cost centers)
- Detects regular patterns (e.g., always 8hrs on Monday)
- Considers recent changes (new project assignments)
- Handles shift differentials and overtime patterns
- Learns from employee corrections

---

### Example 3: PTO Auto-Approval (hcm/pto-auto-approval)

**Pattern**: autoApproval

**Objects**:
- **ptoRequest**: Time-off request
  - Core: employee, dateRange, ptoType, hours, reason
  - Actions: submit, approve, deny, modify
- **employee**: Requesting employee
  - Core: employeeId, name, department, manager, ptoBalance
  - Actions: viewProfile, checkBalance
- **coverage**: Team coverage analysis
  - Core: department, date, requiredStaff, availableStaff, criticalLevel
  - Actions: analyze, viewTeam
- **approval**: Approval decision
  - Core: status, approver, confidence, reasoning, autoDecision
  - Actions: approve, deny, escalate

**Workflow Steps**:
1. Employee submits PTO request
2. AI validates PTO balance and accrual rules
3. AI analyzes team coverage for requested dates
4. AI checks blackout dates and business-critical periods
5. AI calculates approval confidence based on all factors
6. System auto-approves (if confidence > 90% AND no coverage issues)
7. System escalates to manager (if coverage concerns OR low confidence)
8. Employee receives instant approval or pending notification
9. AI learns from manager overrides

**AI Touchpoints**:
- Validates PTO balance sufficiency
- Checks accrual rules and eligibility
- Analyzes team coverage and staffing requirements
- Identifies blackout dates and peak business periods
- Considers employee seniority and request history
- Calculates confidence score for auto-approval
- Routes edge cases with full context to manager
- Learns from manager approval/denial patterns

---

### Example 4: Fraud Detection (finance/fraud-detection)

**Pattern**: anomalyDetection

**Objects**:
- **transaction**: Financial transaction
  - Core: accountId, amount, merchant, location, timestamp, status
  - Actions: view, flag, block, reverse
- **pattern**: Normal behavior pattern
  - Core: typicalAmount, typicalMerchant, typicalLocation, typicalFrequency
  - Actions: analyze, compare
- **fraudScore**: Fraud risk assessment
  - Core: score, confidence, indicators, severity
  - Actions: review, escalate
- **alert**: Fraud alert
  - Core: transactionId, fraudType, action, notification
  - Actions: investigate, resolve, dismiss

**Workflow Steps**:
1. Transaction occurs in real-time
2. AI compares to customer's normal behavior patterns
3. AI analyzes location, amount, merchant, velocity
4. AI calculates fraud probability score
5. System blocks transaction (if score > 90%)
6. System alerts customer for verification (if score 60-90%)
7. System processes normally (if score < 60%)
8. Customer confirms legitimate/fraudulent
9. AI learns from customer feedback

**AI Touchpoints**:
- Monitors transaction patterns for unusual behavior
- Detects location anomalies and impossible sequences
- Analyzes velocity patterns (frequency, amount, timing)
- Identifies merchant category deviations
- Compares to known fraud patterns
- Calculates fraud probability with confidence
- Blocks high-risk transactions instantly
- Learns from confirmed fraud and false positives

---

### Example 5: Employee 360 View (hcm/employee-360-view)

**Pattern**: unifiedEntityView

**Objects**:
- **employee**: Core employee record
  - Core: employeeId, name, department, manager, status
  - Actions: view, edit, export
- **employeeProfile**: Unified aggregated view
  - Core: employeeId, aggregatedData, timeline, healthScore
  - Actions: explore, analyze, export
- **timeData**: Time & attendance data
  - Core: hours, attendance, overtime, pto
  - Actions: viewHistory, analyzePatterns
- **payrollData**: Compensation data
  - Core: salary, bonuses, deductions, history
  - Actions: viewDetails, compareMarket
- **benefitsData**: Benefits enrollment
  - Core: plans, elections, dependents, costs
  - Actions: viewCoverage, analyzeUsage
- **performanceData**: Performance reviews
  - Core: ratings, goals, feedback, trajectory
  - Actions: viewHistory, trackProgress
- **hrInsight**: AI-generated insights
  - Core: type, severity, recommendation, confidence
  - Actions: review, act, dismiss

**Workflow Steps**:
1. Manager searches for employee
2. System queries Time, Payroll, Benefits, Performance systems
3. AI aggregates employee data across all HR systems
4. AI analyzes attendance patterns, performance trends, benefit usage
5. AI generates employee health score and turnover risk
6. System renders unified profile with interactive timeline
7. Manager explores time history, compensation, reviews
8. AI provides retention recommendations and development suggestions

**AI Touchpoints**:
- Aggregates data from 5+ HR systems in real-time
- Calculates employee health score (engagement, performance, attendance)
- Maps manager relationships and team structure
- Identifies patterns in time-off and overtime
- Detects anomalies in attendance or performance
- Predicts turnover risk based on behavioral signals
- Surfaces compensation equity analysis
- Generates natural language career summary

---

### Example 6: Loan Auto-Approval (finance/loan-auto-approval)

**Pattern**: autoApproval

**Objects**:
- **loanApp**: Loan application
  - Core: applicantId, loanType, amount, term, purpose
  - Actions: submit, review, approve, deny
- **creditScore**: Credit assessment
  - Core: score, history, utilization, inquiries
  - Actions: view, analyze
- **riskAssessment**: Risk evaluation
  - Core: defaultProbability, debtToIncome, collateralValue, ltvRatio
  - Actions: calculate, review
- **approval**: Approval decision
  - Core: status, confidence, reasoning, approver
  - Actions: approve, deny, counteroffer

**Workflow Steps**:
1. Customer submits loan application
2. AI validates credit score and income documentation
3. AI analyzes debt-to-income ratio and payment history
4. AI assesses collateral value and loan-to-value ratio
5. AI reviews employment stability and income sources
6. AI calculates default probability and risk score
7. System auto-approves (if amount < $50K AND risk score < 20)
8. System routes to underwriter (if high risk OR high amount)
9. Customer receives instant decision or pending notification
10. AI learns from underwriter decisions

**AI Touchpoints**:
- Validates credit score and income verification
- Analyzes debt-to-income and payment history
- Assesses collateral value and LTV ratio
- Reviews employment stability
- Evaluates market conditions and risk factors
- Compares to similar approved/denied applications
- Calculates default probability
- Routes high-risk to senior underwriter
- Learns from underwriter decisions

---

### Example 7: New Hire Onboarding (hcm/new-hire-onboarding)

**Pattern**: crossSystemWorkflow

**Objects**:
- **newHire**: New employee being onboarded
  - Core: name, startDate, role, location, manager
  - Actions: view, edit, notify
- **task**: Onboarding task
  - Core: taskType, system, owner, status, dueDate
  - Actions: assign, complete, escalate
- **system**: Connected system requiring setup
  - Core: systemName, type, status, dependencies
  - Actions: provision, verify, notify
- **dependency**: Task dependency
  - Core: taskId, dependsOn, blocker, status
  - Actions: track, resolve
- **workflow**: Overall onboarding workflow
  - Core: newHireId, progress, blockers, timeline
  - Actions: monitor, escalate, complete

**Workflow Steps**:
1. HR initiates new hire onboarding workflow
2. AI analyzes role, location, start date to determine requirements
3. AI identifies all required systems and access levels
4. AI calculates impact: IT provisioning, benefits, payroll
5. AI generates sequenced task list with dependencies
6. System routes approvals to HR manager and IT manager
7. System creates employee record in HRIS (once approved)
8. System enrolls in benefits with default elections
9. System creates IT accounts (email, apps, hardware)
10. System sets up payroll with tax forms
11. System requests facilities access (badge, parking)
12. AI monitors completion and identifies blockers
13. System sends progress updates to hiring manager
14. System generates Day 1 welcome packet

**AI Touchpoints**:
- Analyzes job role for required systems and access
- Identifies benefits eligibility by employment type
- Calculates payroll requirements (tax, frequency)
- Determines IT provisioning (hardware, software, security)
- Maps facilities requirements (location, access)
- Sequences tasks based on dependencies
- Validates prerequisites before advancing
- Tracks completion across systems
- Identifies blockers and escalates delays
- Learns from past onboardings to optimize

---

### Example 8: What-If Impact Analysis (generic/what-if-impact-analysis)

**Pattern**: impactAnalysis

**Objects**:
- **scenario**: What-if scenario being analyzed
  - Core: scenarioType, description, parameters, assumptions
  - Actions: define, analyze, compare
- **entity**: Entity being changed
  - Core: entityId, type, currentState, relationships
  - Actions: view, modify, simulate
- **impact**: Calculated impact
  - Core: impactType, magnitude, affectedEntities, timeline
  - Actions: view, quantify, visualize
- **recommendation**: Mitigation strategy
  - Core: action, expectedOutcome, cost, timeline
  - Actions: review, plan, execute

**Workflow Steps**:
1. User initiates scenario analysis (e.g., "What if we close this location?")
2. AI identifies all affected systems and entities
3. AI analyzes direct impacts (employees, assets, customers)
4. AI traces cascading effects (2nd and 3rd order impacts)
5. AI quantifies risks and costs (financial, operational, reputational)
6. AI generates mitigation strategies with expected outcomes
7. System presents comprehensive impact report with visualizations
8. User reviews scenarios and plans next steps

**AI Touchpoints**:
- Maps entity relationships and dependencies
- Identifies direct impacts across systems
- Predicts cascading effects (2nd and 3rd order)
- Quantifies financial impacts
- Models timeline for transitions
- Assesses risks by category
- Generates mitigation recommendations
- Compares multiple scenarios
- Provides confidence scores for predictions

---

### Example 9: AI Interview Scheduling (hcm/ai-interview-scheduling)

**Pattern**: resourceOptimization

**Objects**:
- **candidate**: Job candidate
  - Core: candidateId, name, jobReq, availability, preferences
  - Actions: view, notify, schedule
- **interviewer**: Interviewer panel member
  - Core: employeeId, role, expertise, calendar, preferences
  - Actions: view, assign, notify
- **timeSlot**: Potential interview time
  - Core: date, time, duration, location, conflicts
  - Actions: check, reserve, confirm
- **schedule**: Generated interview schedule
  - Core: candidateId, interviewers, timeSlots, location, status
  - Actions: generate, modify, confirm, cancel

**Workflow Steps**:
1. Recruiter initiates interview scheduling for candidate
2. AI gathers interviewer availability from calendars
3. AI analyzes candidate availability preferences
4. AI considers interviewer expertise match to role
5. AI optimizes schedule to minimize conflicts and gaps
6. AI applies constraints (time zones, room availability)
7. System generates optimal schedule with alternatives
8. Recruiter reviews and selects best option
9. System sends invitations to all participants
10. AI learns from modifications to improve future scheduling

**AI Touchpoints**:
- Queries interviewer calendars in real-time
- Analyzes candidate availability and preferences
- Matches interviewer expertise to role requirements
- Optimizes for minimal scheduling conflicts
- Considers time zones and location preferences
- Applies constraints (no back-to-back, lunch breaks)
- Generates multiple optimal solutions
- Learns from recruiter selections

---

### Example 10: Portfolio Optimization (finance/portfolio-optimization)

**Pattern**: resourceOptimization

**Objects**:
- **asset**: Investment asset
  - Core: assetId, type, quantity, value, riskRating
  - Actions: buy, sell, hold, rebalance
- **riskProfile**: Investor risk profile
  - Core: riskTolerance, horizon, goals, constraints
  - Actions: view, update, analyze
- **allocation**: Asset allocation
  - Core: assetType, percentage, targetRange, currentValue
  - Actions: view, adjust, rebalance
- **rebalance**: Rebalancing recommendation
  - Core: currentAllocation, targetAllocation, trades, expectedOutcome
  - Actions: review, execute, schedule

**Workflow Steps**:
1. User initiates portfolio optimization
2. System gathers current holdings and market data
3. AI analyzes historical performance and risk metrics
4. AI considers investor risk profile and goals
5. AI predicts future returns under different allocations
6. AI applies constraints (tax efficiency, transaction costs)
7. AI generates optimal allocation with expected outcomes
8. System presents rebalancing plan with trade recommendations
9. User reviews and executes trades
10. AI tracks performance to refine future optimizations

**AI Touchpoints**:
- Analyzes historical performance and volatility
- Predicts future returns by asset class
- Optimizes for risk-adjusted returns
- Considers investor goals and constraints
- Factors in tax implications and costs
- Generates multiple allocation scenarios
- Provides expected outcome ranges
- Learns from market conditions and outcomes

---

## PART 5: IMPLEMENTATION APPROACH

### Recommended File Structure

Create a new file: `D:\Github\kartoonerdotcom\aiadvisor\js\config\template-workflows.js`

This file will contain a mapping object:
```javascript
const TEMPLATE_WORKFLOWS = {
  'smart-field-autofill': {
    objects: [ /* specific objects */ ],
    flow: [ /* specific workflow steps */ ],
    aiTouchpoints: [ /* specific AI capabilities */ ],
    configurationNeeds: [ /* specific settings */ ]
  },
  // ... all 47 templates
};
```

### Modification to workflow-generator.js

Add a check at the beginning of `generateWorkflow()`:
```javascript
function generateWorkflow(concept, patternKey, objects, industry = 'generic', templateSlug = null) {
    // Check for template-specific workflow first
    if (templateSlug && TEMPLATE_WORKFLOWS[templateSlug]) {
        return TEMPLATE_WORKFLOWS[templateSlug];
    }

    // Fall back to pattern-based generation
    // ... existing code
}
```

### Benefits of This Approach

1. **Separation of Concerns**: Template-specific workflows are separate from pattern generation logic
2. **Maintainability**: Easy to update individual template workflows
3. **Scalability**: Can add new templates without modifying core generator
4. **Backward Compatibility**: Existing pattern-based generation still works as fallback
5. **Testing**: Each template workflow can be tested independently

---

## PART 6: COMPLETE CONCEPT TEXT FIXES

### Summary
Only **1 concept text change** is needed across all 47 templates.

**File**: `D:\Github\kartoonerdotcom\aiadvisor\js\config\templates.js`

**Line 8**: Change
```javascript
concept: 'Auto-fill form fields using historical data and patterns',
```
To:
```javascript
concept: 'Predict and suggest form field values based on historical data and patterns',
```

All other templates have correct pattern detection.

---

## PART 7: NEXT STEPS

1. **Fix the 1 concept text issue** in templates.js (line 8)
2. **Create template-workflows.js** with all 47 custom OOUX workflows
3. **Modify workflow-generator.js** to check for template-specific workflows first
4. **Test each template** to ensure correct pattern detection and workflow generation
5. **Document the new system** for future template additions

---

## CONCLUSION

This implementation plan provides:
- ✅ Complete analysis of all 47 templates
- ✅ Identification of pattern detection issues (1 fix needed)
- ✅ Architecture for template-specific OOUX workflows
- ✅ 10 detailed custom OOUX workflow examples
- ✅ Clear implementation approach
- ✅ Backward-compatible solution

The solution ensures every template gets unique, contextual OOUX workflows while maintaining the flexibility of pattern-based generation as a fallback.
