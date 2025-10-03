// Generic Workflow Generator
// Generates OOUX workflows from detected patterns

function generateWorkflow(concept, patternKey, objects, industry = 'generic') {
    const workflow = {
        objects: [],
        flow: [],
        aiTouchpoints: [],
        configurationNeeds: []
    };

    // Populate objects from detected relevant objects
    objects.forEach(objKey => {
        if (GENERIC_OBJECTS[objKey]) {
            workflow.objects.push({
                ...GENERIC_OBJECTS[objKey],
                key: objKey
            });
        }
    });

    // Generate workflow based on pattern
    switch(patternKey) {
        case 'autoApproval':
            return generateAutoApprovalWorkflow(concept, objects, industry);
        case 'anomalyDetection':
            return generateAnomalyDetectionWorkflow(concept, objects, industry);
        case 'intelligentScoring':
            return generateIntelligentScoringWorkflow(concept, objects, industry);
        case 'predictiveIntelligence':
            return generatePredictiveIntelligenceWorkflow(concept, objects, industry);
        case 'unifiedEntityView':
            return generateUnifiedEntityViewWorkflow(concept, objects, industry);
        case 'crossSystemWorkflow':
            return generateCrossSystemWorkflowWorkflow(concept, objects, industry);
        case 'naturalLanguageQA':
            return generateNaturalLanguageQAWorkflow(concept, objects, industry);
        case 'intelligentSearch':
            return generateIntelligentSearchWorkflow(concept, objects, industry);
        case 'impactAnalysis':
            return generateImpactAnalysisWorkflow(concept, objects, industry);
        case 'resourceOptimization':
            return generateResourceOptimizationWorkflow(concept, objects, industry);
        case 'realTimeProcessing':
            return generateRealTimeProcessingWorkflow(concept, objects, industry);
        case 'smartAggregation':
            return generateSmartAggregationWorkflow(concept, objects, industry);
        default:
            return generateGenericWorkflow(concept, objects, industry);
    }
}

// Helper: Get domain-specific context
function getDomainContext(industry, pattern) {
    if (industry === 'hcm' && typeof HCM_DOMAIN !== 'undefined' && HCM_DOMAIN.workflowExamples[pattern]) {
        return HCM_DOMAIN.workflowExamples[pattern];
    }
    if (industry === 'finance' && typeof FINANCE_DOMAIN !== 'undefined' && FINANCE_DOMAIN.workflowExamples[pattern]) {
        return FINANCE_DOMAIN.workflowExamples[pattern];
    }
    return null;
}

// Auto-Approval Pattern
function generateAutoApprovalWorkflow(concept, objects, industry = 'generic') {
    // Extract context from concept
    const lower = concept.toLowerCase();
    const domainContext = getDomainContext(industry, 'autoApproval');

    // Use domain-specific context if available
    let requestType, criteria, notification;

    if (industry === 'hcm') {
        requestType = domainContext ? 'PTO request' :
                     (lower.includes('pto') || lower.includes('time off') ? 'PTO request' : 'time-off request');
        criteria = domainContext ? domainContext.criteria : 'balance check, blackout dates, team coverage';
        notification = 'employee';
    } else if (industry === 'finance') {
        requestType = domainContext ? 'loan application' :
                     (lower.includes('loan') ? 'loan application' : 'claim');
        criteria = domainContext ? domainContext.criteria : 'credit score, debt-to-income ratio, loan amount';
        notification = lower.includes('applicant') ? 'applicant' : 'customer';
    } else {
        // Generic fallback
        requestType = lower.includes('pto') || lower.includes('time off') ? 'time-off request' :
                       lower.includes('loan') ? 'loan application' :
                       lower.includes('expense') ? 'expense request' :
                       lower.includes('review') ? 'performance review' :
                       lower.includes('claim') ? 'claim submission' : 'request';

        criteria = lower.includes('coverage') ? 'team coverage and blackout dates' :
                    lower.includes('credit') || lower.includes('risk') ? 'credit score and risk factors' :
                    lower.includes('threshold') || lower.includes('amount') ? 'amount thresholds and business rules' :
                    lower.includes('rating') ? 'rating levels and policy compliance' :
                    'policy rules and risk assessment';

        notification = lower.includes('employee') ? 'employee' :
                        lower.includes('customer') ? 'customer' :
                        lower.includes('applicant') ? 'applicant' : 'requester';
    }

    // Build domain-specific AI touchpoints
    let aiTouchpoints;
    if (industry === 'hcm') {
        aiTouchpoints = [
            'Validates PTO balance and accrual rules',
            'Checks team coverage and staffing requirements',
            'Analyzes blackout dates and business critical periods',
            'Reviews historical approval patterns for similar requests',
            'Assesses impact on department coverage and operations',
            'Considers employee tenure, role criticality, and request history',
            'Calculates auto-approval confidence based on policy compliance',
            'Routes edge cases to manager with full context and recommendation',
            'Learns from manager overrides to refine approval logic'
        ];
    } else if (industry === 'finance') {
        aiTouchpoints = [
            'Validates credit score and income documentation',
            'Analyzes debt-to-income ratio and payment history',
            'Assesses collateral value and loan-to-value ratio',
            'Reviews employment stability and income sources',
            'Evaluates market conditions and risk factors',
            'Compares to approved/denied applications with similar profiles',
            'Calculates default probability and risk score',
            'Routes high-risk applications to senior underwriter',
            'Learns from underwriter decisions to improve scoring accuracy'
        ];
    } else {
        aiTouchpoints = [
            'Validates against policy rules and business constraints',
            'Analyzes historical approval patterns for similar requests',
            'Assesses risk factors (amount, impact, compliance)',
            'Calculates confidence score for auto-approval decision',
            'Considers requester history and reliability',
            'Evaluates business context (timing, capacity, budget)',
            'Routes based on confidence threshold and risk profile',
            'Learns from reviewer corrections to improve accuracy'
        ];
    }

    return {
        objects: objects.map(key => GENERIC_OBJECTS[key]).filter(Boolean),
        flow: [
            { step: 1, actor: 'User', action: `Submits ${requestType}`, object: 'request' },
            { step: 2, actor: 'System', action: 'Validates completeness and eligibility', object: 'request' },
            { step: 3, actor: 'AI', action: `Evaluates against ${criteria}`, object: 'request', confidence: true },
            { step: 4, actor: 'AI', action: 'Calculates risk score and confidence level', object: 'approval', branches: true },
            { step: '4a', actor: 'System', action: 'Auto-approves and updates systems', object: 'approval', condition: 'confidence > threshold AND risk < limit' },
            { step: '4b', actor: 'System', action: 'Routes to manager/reviewer for decision', object: 'approval', condition: 'confidence ≤ threshold OR risk ≥ limit' },
            { step: 5, actor: 'System', action: `Notifies ${notification} of decision with reasoning`, object: 'request' }
        ],
        aiTouchpoints,
        configurationNeeds: [
            { setting: 'Auto-Approval Confidence', description: 'Minimum confidence threshold to auto-approve', default: '90%' },
            { setting: 'Risk Limits', description: 'Maximum acceptable risk scores for auto-approval', default: 'Low for financial, medium for operational' },
            { setting: 'Policy Rules', description: 'Business rules that must be satisfied', default: 'Company-defined policies' },
            { setting: 'Escalation Rules', description: 'When to require additional approval', default: 'High value or high risk items' },
            { setting: 'Review SLA', description: 'Hours before auto-escalation if not reviewed', default: '24 hours' }
        ]
    };
}

// Anomaly Detection Pattern
function generateAnomalyDetectionWorkflow(concept, objects, industry = 'generic') {
    const lower = concept.toLowerCase();
    const domainContext = getDomainContext(industry, 'anomalyDetection');

    let dataType, anomalyType, correctionAction;

    if (industry === 'hcm') {
        dataType = domainContext ? 'time entries' : 'timecards';
        anomalyType = domainContext ? domainContext.detection : 'missing punches and schedule deviations';
        correctionAction = 'Suggests fix based on employee schedule history';
    } else if (industry === 'finance') {
        dataType = domainContext ? 'transactions' : 'transactions';
        anomalyType = domainContext ? domainContext.detection : 'unusual spending patterns, location anomalies, velocity checks';
        correctionAction = 'Flags for fraud investigation and review';
    } else {
        // Generic fallback
        dataType = lower.includes('timecard') || lower.includes('punch') || lower.includes('time') ? 'timecards' :
                        lower.includes('transaction') || lower.includes('fraud') ? 'transactions' :
                        lower.includes('enrollment') || lower.includes('benefit') ? 'enrollment data' :
                        lower.includes('claim') ? 'claims' :
                        lower.includes('inventory') ? 'inventory records' : 'data records';

        anomalyType = lower.includes('missing') || lower.includes('punch') ? 'missing entries and gaps' :
                           lower.includes('fraud') ? 'fraudulent patterns' :
                           lower.includes('error') ? 'data errors and inconsistencies' :
                           lower.includes('discrepanc') ? 'discrepancies' : 'unusual patterns';

        correctionAction = lower.includes('punch') || lower.includes('time') ? 'Suggests fix based on schedule history' :
                                lower.includes('enrollment') ? 'Recommends correction before deadline' :
                                lower.includes('fraud') ? 'Flags for fraud investigation' :
                                'Generates suggested correction based on context';
    }

    // Build domain-specific AI touchpoints
    let aiTouchpoints;
    if (industry === 'hcm') {
        aiTouchpoints = [
            'Compares clock-in/out times to employee schedule and shift patterns',
            'Identifies missing punches, late arrivals, early departures',
            'Detects unusual overtime hours or consecutive shifts',
            'Analyzes meal break compliance and rest period violations',
            'Generates suggested corrections based on historical patterns',
            'Assesses impact on payroll and labor compliance',
            'Flags potential time theft or policy violations',
            'Learns from manager corrections to reduce false positives',
            'Adapts to seasonal patterns and schedule changes'
        ];
    } else if (industry === 'finance') {
        aiTouchpoints = [
            'Monitors transaction patterns for unusual spending behavior',
            'Detects location anomalies and impossible transaction sequences',
            'Analyzes velocity patterns (frequency, amount, timing)',
            'Identifies merchant category deviations from normal behavior',
            'Compares to known fraud patterns and risk indicators',
            'Calculates fraud probability score with confidence level',
            'Blocks high-risk transactions and alerts customer',
            'Learns from confirmed fraud and false positive feedback',
            'Adapts to customer life events and legitimate pattern changes'
        ];
    } else {
        aiTouchpoints = [
            'Compares current data to historical baselines and patterns',
            'Identifies statistical outliers and unusual deviations',
            'Analyzes context to distinguish anomalies from valid variations',
            'Generates suggested corrections based on similar cases',
            'Assesses severity and potential impact of anomaly',
            'Provides explanation of what makes this anomalous',
            'Learns from user corrections to reduce false positives',
            'Adapts detection sensitivity based on feedback'
        ];
    }

    return {
        objects: objects.map(key => GENERIC_OBJECTS[key]).filter(Boolean),
        flow: [
            { step: 1, actor: 'System', action: `Continuously monitors ${dataType}`, object: 'transaction' },
            { step: 2, actor: 'AI', action: `Detects ${anomalyType} using pattern analysis`, object: 'transaction', confidence: true },
            { step: 3, actor: 'AI', action: correctionAction, object: 'anomaly' },
            { step: 4, actor: 'System', action: 'Creates anomaly record with context and severity', object: 'anomaly' },
            { step: 5, actor: 'System', action: 'Routes based on severity and confidence', object: 'anomaly', branches: true },
            { step: '5a', actor: 'System', action: 'Auto-corrects and logs change', object: 'transaction', condition: 'confidence > 95% AND low impact' },
            { step: '5b', actor: 'System', action: 'Flags for manager/admin review', object: 'anomaly', condition: 'medium severity' },
            { step: '5c', actor: 'System', action: 'Alerts stakeholders and blocks processing', object: 'anomaly', condition: 'high severity' },
            { step: 6, actor: 'User', action: 'Reviews details and resolves or overrides', object: 'anomaly' }
        ],
        aiTouchpoints,
        configurationNeeds: [
            { setting: 'Detection Threshold', description: 'Sensitivity for flagging anomalies', default: 'Medium - balance false positives vs. misses' },
            { setting: 'Confidence Threshold', description: 'Minimum confidence to auto-correct', default: '95%' },
            { setting: 'Historical Lookback', description: 'Time period for baseline comparison', default: '90 days' },
            { setting: 'Severity Levels', description: 'Thresholds for low/medium/high severity', default: 'Impact-based classification' },
            { setting: 'Auto-Correction Rules', description: 'What AI can fix automatically', default: 'Low-impact, high-confidence only' }
        ]
    };
}

// Intelligent Scoring Pattern
function generateIntelligentScoringWorkflow(concept, objects, industry = 'generic') {
    const lower = concept.toLowerCase();
    const domainContext = getDomainContext(industry, 'intelligentScoring');

    let itemType, scoreFactors, lowAction, highAction;

    if (industry === 'hcm') {
        itemType = domainContext ? domainContext.entity : 'timecards';
        scoreFactors = domainContext ? domainContext.factors : 'time variance, overtime, policy violations, pattern breaks';
        lowAction = 'Auto-processes to payroll';
        highAction = 'Blocks and alerts manager for review';
    } else if (industry === 'finance') {
        itemType = domainContext ? domainContext.entity : 'credit applications';
        scoreFactors = domainContext ? domainContext.factors : 'credit history, income stability, debt ratios, market conditions';
        lowAction = 'Auto-approves application';
        highAction = 'Declines or routes to senior underwriter';
    } else {
        // Generic fallback
        itemType = lower.includes('timecard') ? 'timecards' :
                        lower.includes('candidate') || lower.includes('applicant') ? 'job candidates' :
                        lower.includes('credit') || lower.includes('loan') ? 'credit applications' :
                        lower.includes('risk') || lower.includes('patient') ? 'risk profiles' :
                        lower.includes('return') ? 'return requests' : 'items';

        scoreFactors = lower.includes('timecard') ? 'variance, patterns, anomalies, policy compliance' :
                            lower.includes('candidate') ? 'skills match, experience, qualifications' :
                            lower.includes('credit') ? 'credit history, income, debt ratio, collateral' :
                            lower.includes('risk') ? 'historical data, behavioral patterns, external factors' :
                            'configurable risk and quality factors';

        lowAction = lower.includes('credit') ? 'Auto-approves application' :
                         lower.includes('candidate') ? 'Routes to hiring manager' :
                         lower.includes('timecard') ? 'Auto-processes to payroll' : 'Auto-processes';

        highAction = lower.includes('fraud') || lower.includes('return') ? 'Blocks and flags for fraud review' :
                          lower.includes('credit') ? 'Declines application with explanation' :
                          lower.includes('timecard') ? 'Blocks and alerts manager' : 'Escalates for senior review';
    }

    // Build domain-specific AI touchpoints
    let aiTouchpoints;
    if (industry === 'hcm') {
        aiTouchpoints = [
            'Calculates timecard risk score across multiple dimensions',
            'Analyzes time variance from scheduled hours',
            'Detects excessive overtime and consecutive work days',
            'Identifies pattern breaks from normal employee behavior',
            'Checks policy compliance (breaks, shifts, pay codes)',
            'Compares to department and peer group benchmarks',
            'Generates insights by category (cost, compliance, fraud risk)',
            'Routes high-risk items for manager review before payroll',
            'Learns optimal scoring weights from manager feedback'
        ];
    } else if (industry === 'finance') {
        aiTouchpoints = [
            'Calculates credit risk score using multiple data sources',
            'Analyzes credit history, payment patterns, and utilization',
            'Evaluates income stability and debt-to-income ratios',
            'Assesses collateral value and loan-to-value ratios',
            'Incorporates market conditions and economic indicators',
            'Compares to similar approved/denied applications',
            'Generates default probability and expected loss estimates',
            'Routes applications to appropriate approval tier',
            'Learns from underwriter decisions to refine scoring model'
        ];
    } else {
        aiTouchpoints = [
            'Calculates weighted scores across configurable factors',
            'Factors may include: variance, compliance, patterns, history',
            'Generates categorized insights (cost risk, compliance, quality)',
            'Provides drill-down details for each score component',
            'Compares scores to peer benchmarks and thresholds',
            'Learns optimal weights from historical outcomes',
            'Adapts scoring based on changing business conditions'
        ];
    }

    return {
        objects: objects.map(key => GENERIC_OBJECTS[key]).filter(Boolean),
        flow: [
            { step: 1, actor: 'System', action: `Receives ${itemType} for risk scoring`, object: 'transaction' },
            { step: 2, actor: 'AI', action: `Calculates weighted score across: ${scoreFactors}`, object: 'transaction', confidence: true },
            { step: 3, actor: 'AI', action: 'Generates detailed breakdown and insight summary', object: 'insight' },
            { step: 4, actor: 'System', action: 'Routes based on risk score and confidence', object: 'transaction', branches: true },
            { step: '4a', actor: 'System', action: lowAction, object: 'transaction', condition: 'score < low threshold' },
            { step: '4b', actor: 'System', action: 'Flags for manager/reviewer with score details', object: 'insight', condition: 'low ≤ score < high' },
            { step: '4c', actor: 'System', action: highAction, object: 'insight', condition: 'score ≥ high threshold' },
            { step: 5, actor: 'System', action: 'Updates dashboard with scoring trends and insights', object: 'insight' }
        ],
        aiTouchpoints,
        configurationNeeds: [
            { setting: 'Score Weights', description: 'Weight for each scoring factor', default: 'Balanced across all factors' },
            { setting: 'Low Threshold', description: 'Score below which to auto-process', default: '20 points' },
            { setting: 'High Threshold', description: 'Score above which to block/escalate', default: '80 points' },
            { setting: 'Insight Categories', description: 'Types of insights to generate', default: 'All (cost, compliance, quality)' },
            { setting: 'Output Format', description: 'How to present scores and insights', default: 'Dashboard + email digest' }
        ]
    };
}

// Predictive Intelligence Pattern
function generatePredictiveIntelligenceWorkflow(concept, objects, industry = 'generic') {
    const lower = concept.toLowerCase();
    const domainContext = getDomainContext(industry, 'predictiveIntelligence');

    let predictionType, recommendations, criticalTrigger;

    if (industry === 'hcm') {
        predictionType = domainContext ? 'employee turnover risk' : 'employee turnover risk';
        recommendations = domainContext ? 'Suggests targeted retention actions (compensation, development, engagement)' :
                         'Recommends staffing adjustments and scheduling changes';
        criticalTrigger = 'High-value employee at >70% flight risk';
    } else if (industry === 'finance') {
        predictionType = domainContext ? 'credit risk and default probability' : 'credit risk and default probability';
        recommendations = domainContext ? domainContext.insights :
                         'Proposes portfolio adjustments and hedging strategies';
        criticalTrigger = 'Portfolio risk spike or concentration risk detected';
    } else {
        // Generic fallback
        predictionType = lower.includes('turnover') || lower.includes('attrition') ? 'employee turnover risk' :
                              lower.includes('overtime') ? 'overtime trends and costs' :
                              lower.includes('credit') || lower.includes('risk') ? 'credit risk and default probability' :
                              lower.includes('readmission') || lower.includes('patient') ? 'patient readmission risk' :
                              lower.includes('stockout') || lower.includes('inventory') ? 'inventory stockout probability' :
                              'future outcomes and risks';

        recommendations = lower.includes('turnover') ? 'Suggests targeted retention actions (comp, development, engagement)' :
                               lower.includes('overtime') ? 'Recommends staffing adjustments and scheduling changes' :
                               lower.includes('credit') ? 'Proposes portfolio adjustments and hedging strategies' :
                               lower.includes('patient') ? 'Plans preventive care interventions and follow-ups' :
                               lower.includes('inventory') ? 'Optimizes reordering and allocation across locations' :
                               'Generates actionable recommendations with expected impact';

        criticalTrigger = lower.includes('turnover') ? 'High-value employee at >70% flight risk' :
                               lower.includes('overtime') ? 'Projected to exceed budget by >15%' :
                               lower.includes('credit') ? 'Portfolio risk spike detected' :
                               lower.includes('patient') ? '90-day readmission risk >50%' :
                               'Critical threshold exceeded';
    }

    // Build domain-specific AI touchpoints
    let aiTouchpoints;
    if (industry === 'hcm') {
        aiTouchpoints = [
            'Analyzes employee engagement, performance, and tenure data',
            'Detects behavioral changes and early warning signals',
            'Predicts turnover risk by employee segment and role',
            'Identifies key contributors and high-flight-risk employees',
            'Generates targeted retention recommendations (compensation, development)',
            'Calculates ROI of retention actions vs. replacement costs',
            'Monitors overtime trends and predicts budget impact',
            'Tracks effectiveness of interventions to refine predictions',
            'Adapts to organizational changes and market conditions'
        ];
    } else if (industry === 'finance') {
        aiTouchpoints = [
            'Monitors portfolio composition and concentration risks',
            'Analyzes macroeconomic indicators and market trends',
            'Predicts default probability across loan segments',
            'Identifies early warning signals in payment behavior',
            'Calculates expected losses and capital requirements',
            'Generates portfolio rebalancing recommendations',
            'Evaluates impact of interest rate and market changes',
            'Tracks prediction accuracy and model performance',
            'Adapts to changing market conditions and regulations'
        ];
    } else {
        aiTouchpoints = [
            'Cross-domain pattern detection across all data sources',
            'Time-series analysis to identify trends and trajectories',
            'Predictive modeling for future states and outcomes',
            'Anomaly identification with root cause analysis',
            'Impact quantification (cost, risk, opportunity)',
            'Recommendation generation with expected outcomes',
            'Priority scoring based on urgency and impact',
            'Continuous learning from user feedback and outcomes'
        ];
    }

    return {
        objects: objects.map(key => GENERIC_OBJECTS[key]).filter(Boolean),
        flow: [
            { step: 1, actor: 'System', action: 'Continuously monitors employee, operational, and performance data', object: 'intelligenceHub' },
            { step: 2, actor: 'AI', action: `Analyzes historical patterns to detect early warning signals`, object: 'insight', confidence: true },
            { step: 3, actor: 'AI', action: `Predicts ${predictionType} with confidence scoring`, object: 'insight' },
            { step: 4, actor: 'AI', action: recommendations, object: 'insight', confidence: true },
            { step: 5, actor: 'System', action: 'Routes based on risk severity and urgency', object: 'insight', branches: true },
            { step: '5a', actor: 'System', action: 'Sends critical alert to leadership with immediate action plan', object: 'insight', condition: criticalTrigger },
            { step: '5b', actor: 'System', action: 'Dashboard notification to managers with recommended actions', object: 'insight', condition: 'severity = warning' },
            { step: '5c', actor: 'System', action: 'Logs insight for reporting and trend analysis', object: 'insight', condition: 'severity = info' },
            { step: 6, actor: 'User', action: 'Reviews predictions and takes preventive action', object: 'insight' },
            { step: 7, actor: 'AI', action: 'Tracks outcome of actions to improve future predictions', object: 'intelligenceHub' }
        ],
        aiTouchpoints,
        configurationNeeds: [
            { setting: 'Alert Thresholds', description: 'Sensitivity for each severity level', default: 'Critical: immediate risk, Warning: potential issue' },
            { setting: 'Notification Channels', description: 'How to deliver alerts', default: 'Critical: all channels, Warning: dashboard + email' },
            { setting: 'Prediction Horizon', description: 'How far ahead to forecast', default: '30-90 days' },
            { setting: 'Historical Baseline', description: 'Time period for comparison', default: '12 months rolling' },
            { setting: 'Learning Rate', description: 'Speed of AI adaptation', default: 'Medium - balance stability with responsiveness' }
        ]
    };
}

// Unified Entity View Pattern
function generateUnifiedEntityViewWorkflow(concept, objects, industry = 'generic') {
    const domainContext = getDomainContext(industry, 'unifiedView');

    let entityType, systems;
    if (industry === 'hcm') {
        entityType = domainContext ? domainContext.entity : 'Employee';
        systems = domainContext ? domainContext.systems : 'Time, Payroll, Benefits, Performance';
    } else if (industry === 'finance') {
        entityType = domainContext ? domainContext.entity : 'Customer';
        systems = domainContext ? domainContext.systems : 'Banking, Lending, Investments, Cards';
    } else {
        entityType = 'Entity';
        systems = 'All connected systems';
    }

    return {
        objects: objects.map(key => GENERIC_OBJECTS[key]).filter(Boolean),
        flow: [
            { step: 1, actor: 'User', action: 'Searches for entity', object: 'intelligenceHub' },
            { step: 2, actor: 'System', action: 'Queries all connected systems', object: 'profile' },
            { step: 3, actor: 'AI', action: 'Aggregates cross-system data', object: 'profile', confidence: true },
            { step: 4, actor: 'AI', action: 'Analyzes patterns and relationships', object: 'profile' },
            { step: 5, actor: 'AI', action: 'Generates insights and health scores', object: 'insight', confidence: true },
            { step: 6, actor: 'System', action: 'Renders unified profile view', object: 'profile' },
            { step: 7, actor: 'User', action: 'Explores connections and timeline', object: 'profile' },
            { step: 8, actor: 'AI', action: 'Provides contextual recommendations', object: 'insight' }
        ],
        aiTouchpoints: [
            'Aggregates data from all connected systems in real-time',
            'Calculates health scores across multiple dimensions',
            'Maps relationships and dependencies across entities',
            'Identifies patterns in behavior and history',
            'Detects anomalies and concerning trends',
            'Generates predictive insights and risk indicators',
            'Surfaces impact analysis and recommendations',
            'Provides natural language summaries of complex relationships'
        ],
        configurationNeeds: [
            { setting: 'Data Refresh Rate', description: 'How often to update intelligence', default: 'Real-time for critical, hourly for analytics' },
            { setting: 'Insight Sensitivity', description: 'Threshold for generating alerts', default: 'Medium - balance noise with coverage' },
            { setting: 'Privacy Controls', description: 'Data visibility by role', default: 'Role-based with audit logging' },
            { setting: 'System Integration', description: 'Which systems to include', default: 'All connected systems' },
            { setting: 'AI Confidence', description: 'Minimum confidence for predictions', default: '75% for insights, 90% for actions' }
        ]
    };
}

// Cross-System Workflow Pattern
function generateCrossSystemWorkflowWorkflow(concept, objects, industry = 'generic') {
    return {
        objects: objects.map(key => GENERIC_OBJECTS[key]).filter(Boolean),
        flow: [
            { step: 1, actor: 'User', action: 'Initiates workflow', object: 'workflow' },
            { step: 2, actor: 'AI', action: 'Analyzes current state', object: 'entity', confidence: true },
            { step: 3, actor: 'AI', action: 'Calculates multi-system impact', object: 'workflow' },
            { step: 4, actor: 'System', action: 'Routes for approvals', object: 'approval', branches: true },
            { step: '4a', actor: 'System', action: 'Updates System A', object: 'workflow', condition: 'approved' },
            { step: '4b', actor: 'System', action: 'Updates System B', object: 'workflow', condition: 'approved' },
            { step: '4c', actor: 'System', action: 'Triggers downstream actions', object: 'workflow', condition: 'approved' },
            { step: 5, actor: 'AI', action: 'Generates task list', object: 'workflow' },
            { step: 6, actor: 'System', action: 'Orchestrates updates', object: 'workflow' },
            { step: 7, actor: 'AI', action: 'Monitors completion', object: 'workflow' },
            { step: 8, actor: 'System', action: 'Notifies stakeholders', object: 'workflow' }
        ],
        aiTouchpoints: [
            'Evaluates readiness and prerequisites across systems',
            'Validates against policies and business rules',
            'Calculates impact across all connected systems',
            'Identifies dependencies and sequencing requirements',
            'Generates comprehensive task orchestration plan',
            'Tracks completion status in real-time',
            'Handles failures with rollback capabilities',
            'Recommends optimal timing and execution strategy'
        ],
        configurationNeeds: [
            { setting: 'Approval Chain', description: 'Required approvers by complexity', default: 'Manager for simple, +Senior leader for complex' },
            { setting: 'Impact Threshold', description: 'When to flag high-impact workflows', default: 'Affects 3+ systems OR 10+ entities' },
            { setting: 'Task Automation', description: 'What executes automatically vs. manual', default: 'System updates auto, notifications manual' },
            { setting: 'Notification Rules', description: 'Who gets notified when', default: 'Stakeholders at each stage' },
            { setting: 'Rollback Policy', description: 'How to handle failures', default: 'Auto-rollback with admin alert' }
        ]
    };
}

// Natural Language Q&A Pattern
function generateNaturalLanguageQAWorkflow(concept, objects, industry = 'generic') {
    const domainContext = getDomainContext(industry, 'naturalLanguageQA');

    let capabilities;
    if (industry === 'hcm') {
        capabilities = domainContext ? domainContext.capabilities : 'Pay inquiries, PTO balance, benefits, policies';
    } else if (industry === 'finance') {
        capabilities = domainContext ? domainContext.capabilities : 'Balance inquiries, transaction history, payment scheduling';
    } else {
        capabilities = 'General information retrieval';
    }

    return {
        objects: objects.map(key => GENERIC_OBJECTS[key]).filter(Boolean),
        flow: [
            { step: 1, actor: 'User', action: 'Asks question', object: 'intelligenceHub' },
            { step: 2, actor: 'AI', action: 'Parses intent and entities', object: 'intelligenceHub' },
            { step: 3, actor: 'AI', action: 'Determines data sources', object: 'intelligenceHub' },
            { step: 4, actor: 'System', action: 'Queries relevant systems', object: 'entity' },
            { step: 5, actor: 'AI', action: 'Synthesizes answer', object: 'intelligenceHub', confidence: true },
            { step: 6, actor: 'System', action: 'Routes by confidence', object: 'intelligenceHub', branches: true },
            { step: '6a', actor: 'System', action: 'Provides direct answer', object: 'intelligenceHub', condition: 'confidence > 90%' },
            { step: '6b', actor: 'System', action: 'Asks clarifying questions', object: 'intelligenceHub', condition: 'confidence 60-90%' },
            { step: '6c', actor: 'System', action: 'Escalates to human', object: 'intelligenceHub', condition: 'confidence < 60%' },
            { step: 7, actor: 'AI', action: 'Suggests follow-ups', object: 'intelligenceHub' }
        ],
        aiTouchpoints: [
            'Natural language understanding of user questions',
            'Intent classification and entity extraction',
            'Context awareness across conversation history',
            'Multi-turn dialogue with clarifications',
            'Data retrieval from appropriate systems',
            'Answer generation with citations',
            'Confidence scoring for quality control',
            'Learning from user feedback and corrections'
        ],
        configurationNeeds: [
            { setting: 'Confidence Threshold', description: 'Minimum confidence for direct answers', default: '85% for facts, 95% for policy' },
            { setting: 'Escalation Rules', description: 'When to route to human support', default: 'Low confidence OR sensitive topics' },
            { setting: 'Context Window', description: 'Messages to remember', default: 'Last 10 messages' },
            { setting: 'Response Style', description: 'Tone and formality', default: 'Friendly but professional' },
            { setting: 'Citation Rules', description: 'When to show sources', default: 'Always for policy, optional for facts' }
        ]
    };
}

// Intelligent Search Pattern
function generateIntelligentSearchWorkflow(concept, objects, industry = 'generic') {
    return {
        objects: objects.map(key => GENERIC_OBJECTS[key]).filter(Boolean),
        flow: [
            { step: 1, actor: 'User', action: 'Enters search query', object: 'intelligenceHub' },
            { step: 2, actor: 'AI', action: 'Parses intent', object: 'intelligenceHub' },
            { step: 3, actor: 'System', action: 'Searches all systems', object: 'entity' },
            { step: 4, actor: 'AI', action: 'Ranks by relevance', object: 'intelligenceHub', confidence: true },
            { step: 5, actor: 'AI', action: 'Groups by type', object: 'intelligenceHub' },
            { step: 6, actor: 'System', action: 'Renders results', object: 'intelligenceHub' },
            { step: 7, actor: 'AI', action: 'Suggests related items', object: 'intelligenceHub' },
            { step: 8, actor: 'User', action: 'Explores results', object: 'entity' }
        ],
        aiTouchpoints: [
            'Natural language query understanding',
            'Entity recognition and type detection',
            'Cross-system indexing and search',
            'Contextual ranking based on user role and history',
            'Relationship discovery between results',
            'Semantic search beyond keywords',
            'Personalization of result priorities',
            'Learning from click-through behavior'
        ],
        configurationNeeds: [
            { setting: 'Search Scope', description: 'Which systems to include', default: 'All connected systems' },
            { setting: 'Privacy Filtering', description: 'Access control by role', default: 'Role-based with audit trail' },
            { setting: 'Result Ranking', description: 'How to prioritize results', default: 'Relevance + recency + context' },
            { setting: 'Result Grouping', description: 'How to organize results', default: 'By entity type' },
            { setting: 'Search History', description: 'Remember recent searches', default: 'Last 20 per user' }
        ]
    };
}

// Impact Analysis Pattern
function generateImpactAnalysisWorkflow(concept, objects, industry = 'generic') {
    const domainContext = getDomainContext(industry, 'impactAnalysis');

    let scenario, analysis;
    if (industry === 'hcm') {
        scenario = domainContext ? 'employee departure or organizational change' : 'organizational change';
        analysis = 'Impact on projects, coverage, knowledge transfer, morale';
    } else if (industry === 'finance') {
        scenario = domainContext ? domainContext.analysis : 'market change or policy update';
        analysis = domainContext ? domainContext.analysis : 'P&L impact, risk exposure, customer retention';
    } else {
        scenario = 'change or decision';
        analysis = 'Financial and operational impacts';
    }

    return {
        objects: objects.map(key => GENERIC_OBJECTS[key]).filter(Boolean),
        flow: [
            { step: 1, actor: 'User', action: 'Initiates scenario analysis', object: 'workflow' },
            { step: 2, actor: 'AI', action: 'Identifies affected systems', object: 'entity' },
            { step: 3, actor: 'AI', action: 'Analyzes direct impacts', object: 'insight', confidence: true },
            { step: 4, actor: 'AI', action: 'Traces cascading effects', object: 'insight' },
            { step: 5, actor: 'AI', action: 'Quantifies risks and costs', object: 'insight', confidence: true },
            { step: 6, actor: 'AI', action: 'Generates mitigation strategies', object: 'insight' },
            { step: 7, actor: 'System', action: 'Presents impact report', object: 'workflow' },
            { step: 8, actor: 'User', action: 'Reviews and plans', object: 'workflow' }
        ],
        aiTouchpoints: [
            'Entity relationship mapping and dependency analysis',
            'Direct impact identification across systems',
            'Cascading effect prediction (2nd and 3rd order)',
            'Financial quantification of impacts',
            'Timeline modeling for transitions',
            'Risk assessment and scoring',
            'Mitigation strategy recommendations',
            'Scenario comparison and optimization'
        ],
        configurationNeeds: [
            { setting: 'Analysis Depth', description: 'Degrees of separation to analyze', default: '3 levels (direct, secondary, tertiary)' },
            { setting: 'Cost Modeling', description: 'Which costs to include', default: 'All direct and indirect costs' },
            { setting: 'Risk Scoring', description: 'How to weight risk factors', default: 'Balanced across impact types' },
            { setting: 'Timeframe', description: 'Planning horizon', default: '6 months forward' },
            { setting: 'Comparison Baseline', description: 'What to compare against', default: 'Historical averages' }
        ]
    };
}

// Resource Optimization Pattern
function generateResourceOptimizationWorkflow(concept, objects, industry = 'generic') {
    return {
        objects: objects.map(key => GENERIC_OBJECTS[key]).filter(Boolean),
        flow: [
            { step: 1, actor: 'User', action: 'Initiates optimization', object: 'schedule' },
            { step: 2, actor: 'System', action: 'Gathers historical data', object: 'transaction' },
            { step: 3, actor: 'AI', action: 'Analyzes patterns', object: 'transaction' },
            { step: 4, actor: 'AI', action: 'Predicts requirements', object: 'schedule', confidence: true },
            { step: 5, actor: 'AI', action: 'Generates optimal plan', object: 'schedule' },
            { step: 6, actor: 'AI', action: 'Applies constraints', object: 'schedule' },
            { step: 7, actor: 'System', action: 'Presents draft plan', object: 'schedule' },
            { step: 8, actor: 'User', action: 'Reviews and adjusts', object: 'schedule' },
            { step: 9, actor: 'System', action: 'Publishes final plan', object: 'schedule' }
        ],
        aiTouchpoints: [
            'Analyzes historical demand patterns',
            'Identifies peak periods and variations',
            'Considers preferences and constraints',
            'Factors in skills and requirements',
            'Optimizes for multiple objectives (cost, coverage, satisfaction)',
            'Ensures compliance with rules and policies',
            'Learns from adjustments to improve future plans'
        ],
        configurationNeeds: [
            { setting: 'Historical Window', description: 'Time period to analyze', default: '12 months' },
            { setting: 'Optimization Goal', description: 'Primary objective', default: 'Balanced (cost + coverage + satisfaction)' },
            { setting: 'Constraints', description: 'Rules to enforce', default: 'Business policies and regulations' },
            { setting: 'Flexibility', description: 'Weight given to preferences', default: '30%' },
            { setting: 'Update Frequency', description: 'How often to regenerate', default: 'Weekly or on-demand' }
        ]
    };
}

// Real-Time Processing Pattern
function generateRealTimeProcessingWorkflow(concept, objects, industry = 'generic') {
    return {
        objects: objects.map(key => GENERIC_OBJECTS[key]).filter(Boolean),
        flow: [
            { step: 1, actor: 'System', action: 'Monitors cutoff time', object: 'transaction' },
            { step: 2, actor: 'System', action: 'Triggers processing', object: 'transaction' },
            { step: 3, actor: 'AI', action: 'Validates all data', object: 'transaction', confidence: true },
            { step: 4, actor: 'AI', action: 'Flags issues', object: 'anomaly' },
            { step: 5, actor: 'System', action: 'Routes flagged items', object: 'anomaly', branches: true },
            { step: '5a', actor: 'System', action: 'Auto-corrects minor issues', object: 'transaction', condition: 'high confidence' },
            { step: '5b', actor: 'System', action: 'Alerts for review', object: 'anomaly', condition: 'requires decision' },
            { step: 6, actor: 'AI', action: 'Generates summary', object: 'transaction' },
            { step: 7, actor: 'System', action: 'Sends to downstream system', object: 'transaction' },
            { step: 8, actor: 'System', action: 'Locks processed data', object: 'transaction' }
        ],
        aiTouchpoints: [
            'Validates completeness and accuracy',
            'Checks for anomalies and exceptions',
            'Calculates aggregations and totals',
            'Applies business rules and transformations',
            'Generates summary reports',
            'Flags discrepancies and issues',
            'Provides confidence scores for corrections'
        ],
        configurationNeeds: [
            { setting: 'Processing Time', description: 'When to trigger processing', default: 'Daily at specified cutoff' },
            { setting: 'Auto-Correction Rules', description: 'What AI can fix', default: 'Minor formatting only' },
            { setting: 'Validation Rules', description: 'Required checks', default: 'All completeness and compliance checks' },
            { setting: 'Summary Format', description: 'Report structure', default: 'By category + exceptions' },
            { setting: 'Exception Handling', description: 'Process for flagged items', default: 'Review required before processing' }
        ]
    };
}

// Smart Aggregation Pattern
function generateSmartAggregationWorkflow(concept, objects, industry = 'generic') {
    return {
        objects: objects.map(key => GENERIC_OBJECTS[key]).filter(Boolean),
        flow: [
            { step: 1, actor: 'System', action: 'Identifies items to aggregate', object: 'transaction' },
            { step: 2, actor: 'AI', action: 'Determines aggregation strategy', object: 'transaction', confidence: true },
            { step: 3, actor: 'System', action: 'Routes based on rules', object: 'transaction', branches: true },
            { step: '3a', actor: 'System', action: 'Aggregates with existing', object: 'transaction', condition: 'eligible for combination' },
            { step: '3b', actor: 'System', action: 'Creates separate item', object: 'transaction', condition: 'must be separate' },
            { step: 4, actor: 'AI', action: 'Validates aggregation', object: 'transaction', confidence: true },
            { step: 5, actor: 'AI', action: 'Checks for duplicates', object: 'anomaly' },
            { step: 6, actor: 'System', action: 'Calculates impact', object: 'transaction' },
            { step: 7, actor: 'System', action: 'Generates summary', object: 'transaction' },
            { step: 8, actor: 'System', action: 'Sends for processing', object: 'transaction' }
        ],
        aiTouchpoints: [
            'Identifies eligible items for aggregation',
            'Determines optimal aggregation strategy',
            'Validates aggregation logic and amounts',
            'Checks for duplicate entries',
            'Calculates net impact of aggregation',
            'Ensures compliance with timing rules',
            'Flags high-value items for review'
        ],
        configurationNeeds: [
            { setting: 'Aggregation Strategy', description: 'Default behavior', default: 'Combine when eligible' },
            { setting: 'Eligibility Window', description: 'Time period to consider for combining', default: 'Current processing period' },
            { setting: 'Approval Threshold', description: 'Value requiring manual approval', default: 'Organization-defined limit' },
            { setting: 'Duplicate Detection', description: 'Lookback period', default: '90 days' },
            { setting: 'Timing Rules', description: 'Deadline for aggregation vs. separate', default: 'Based on processing cutoff' }
        ]
    };
}

// Generic fallback
function generateGenericWorkflow(concept, objects, industry = 'generic') {
    return {
        objects: objects.map(key => GENERIC_OBJECTS[key]).filter(Boolean),
        flow: [
            { step: 1, actor: 'User', action: 'Initiates action', object: objects[0] || 'entity' },
            { step: 2, actor: 'System', action: 'Gathers context', object: objects[0] || 'entity' },
            { step: 3, actor: 'AI', action: 'Analyzes and processes', object: objects[0] || 'entity', confidence: true },
            { step: 4, actor: 'AI', action: 'Generates recommendation', object: 'insight' },
            { step: 5, actor: 'System', action: 'Presents to user', object: 'insight' },
            { step: 6, actor: 'User', action: 'Reviews and decides', object: objects[0] || 'entity' }
        ],
        aiTouchpoints: [
            'Analyzes patterns in historical data',
            'Applies business rules and policies',
            'Generates insights and recommendations',
            'Provides confidence scoring',
            'Enables user override and feedback',
            'Learns from user actions'
        ],
        configurationNeeds: [
            { setting: 'Confidence Threshold', description: 'Minimum confidence for AI actions', default: '85%' },
            { setting: 'Notification Rules', description: 'Who gets notified when', default: 'Standard notification policy' },
            { setting: 'Approval Chain', description: 'Required approvers', default: 'Manager approval' }
        ]
    };
}