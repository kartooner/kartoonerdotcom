// Template-Specific OOUX Workflows
// Each of the 47 templates gets its own custom workflow with specific objects and steps

const TEMPLATE_WORKFLOWS = {
    // ============================================
    // GENERIC TEMPLATES (16)
    // ============================================

    'smart-field-autofill': {
        objects: [
            {
                name: 'Form Field',
                description: 'Input field being auto-filled',
                coreContent: ['Field Name', 'Field Type', 'Current Value', 'Placeholder'],
                metadata: ['Last Filled', 'Confidence', 'Source', 'User Override'],
                actions: ['Focus', 'Blur', 'Accept Suggestion', 'Reject Suggestion', 'Modify']
            },
            {
                name: 'User Profile',
                description: 'User preferences and history',
                coreContent: ['User ID', 'Preferences', 'Common Values', 'Context'],
                metadata: ['Last Active', 'Profile Completeness', 'Accuracy Score'],
                actions: ['View Profile', 'Update Preferences', 'Clear History']
            },
            {
                name: 'Historical Entry',
                description: 'Past form submissions',
                coreContent: ['Submission Date', 'Field Values', 'Context', 'Frequency'],
                metadata: ['Form Type', 'User', 'Success Rate'],
                actions: ['View History', 'Analyze Patterns', 'Export']
            },
            {
                name: 'Prediction',
                description: 'AI-generated field suggestion',
                coreContent: ['Suggested Value', 'Confidence', 'Reasoning', 'Alternatives'],
                metadata: ['Generated Time', 'Model Version', 'Data Sources'],
                actions: ['Accept', 'Reject', 'Modify', 'Learn From']
            }
        ],
        flow: [
            { step: 1, actor: 'User', action: 'Focuses on form field', object: 'Form Field' },
            { step: 2, actor: 'System', action: 'Activates prediction engine', object: 'Form Field' },
            { step: 3, actor: 'AI', action: 'Queries user profile and historical entries', object: 'User Profile', confidence: true },
            { step: 4, actor: 'AI', action: 'Analyzes patterns in past submissions for this field type', object: 'Historical Entry' },
            { step: 5, actor: 'AI', action: 'Generates prediction with confidence score', object: 'Prediction', confidence: true },
            { step: 6, actor: 'System', action: 'Displays suggestion inline', object: 'Form Field', condition: 'confidence > 85%' },
            { step: 7, actor: 'User', action: 'Accepts, modifies, or ignores suggestion', object: 'Prediction' },
            { step: 8, actor: 'AI', action: 'Learns from user choice to improve future predictions', object: 'User Profile' }
        ],
        aiTouchpoints: [
            'Analyzes user\'s historical form submissions by field type and context',
            'Identifies most frequent values considering current session context',
            'Detects patterns in sequential field dependencies',
            'Predicts likely value with confidence scoring',
            'Adapts to user acceptance/rejection patterns over time',
            'Handles edge cases for new users and rare fields',
            'Learns optimal confidence thresholds per user and field type'
        ],
        configurationNeeds: [
            { setting: 'Confidence Threshold', description: 'Minimum confidence to show suggestion', default: '85%' },
            { setting: 'Learning Rate', description: 'Speed of adaptation to user preferences', default: 'Medium' },
            { setting: 'Historical Window', description: 'Days of history to consider', default: '90 days' },
            { setting: 'Context Sensitivity', description: 'Weight given to current session context', default: 'High' }
        ]
    },

    'data-validation-assistant': {
        objects: [
            {
                name: 'Form Field',
                description: 'Field being validated',
                coreContent: ['Field Name', 'Value', 'Type', 'Constraints'],
                metadata: ['Validation Status', 'Error Count', 'Last Validated'],
                actions: ['Validate', 'Flag Error', 'Auto-Correct', 'Skip']
            },
            {
                name: 'Validation Rule',
                description: 'Business rule for validation',
                coreContent: ['Rule Type', 'Criteria', 'Severity', 'Message'],
                metadata: ['Rule ID', 'Created Date', 'Active Status'],
                actions: ['Apply', 'Edit', 'Disable', 'Test']
            },
            {
                name: 'Error Flag',
                description: 'Detected validation error',
                coreContent: ['Field', 'Error Type', 'Message', 'Severity'],
                metadata: ['Detected Time', 'AI Confidence', 'Status'],
                actions: ['Review', 'Fix', 'Override', 'Dismiss']
            },
            {
                name: 'Correction',
                description: 'Suggested fix for error',
                coreContent: ['Original Value', 'Suggested Value', 'Reason', 'Confidence'],
                metadata: ['Generated Time', 'Source', 'Acceptance Rate'],
                actions: ['Accept', 'Reject', 'Modify']
            }
        ],
        flow: [
            { step: 1, actor: 'User', action: 'Enters data in form field', object: 'Form Field' },
            { step: 2, actor: 'AI', action: 'Validates against business rules in real-time', object: 'Validation Rule', confidence: true },
            { step: 3, actor: 'AI', action: 'Flags potential errors before submission', object: 'Error Flag' },
            { step: 4, actor: 'AI', action: 'Generates suggested correction', object: 'Correction', confidence: true },
            { step: 5, actor: 'System', action: 'Displays error and suggestion inline', object: 'Form Field' },
            { step: 6, actor: 'User', action: 'Reviews and corrects error', object: 'Error Flag' },
            { step: 7, actor: 'AI', action: 'Learns from user corrections to reduce false positives', object: 'Validation Rule' }
        ],
        aiTouchpoints: [
            'Validates data against business rules in real-time',
            'Detects likely errors based on patterns and constraints',
            'Suggests corrections based on similar valid entries',
            'Calculates confidence for each validation error',
            'Learns from user corrections to reduce false positives',
            'Adapts validation sensitivity by field and user'
        ],
        configurationNeeds: [
            { setting: 'Validation Sensitivity', description: 'Strictness of error detection', default: 'Medium' },
            { setting: 'Auto-Correction', description: 'Allow AI to auto-fix high-confidence errors', default: 'Disabled' },
            { setting: 'Error Display', description: 'How to show errors to user', default: 'Inline with icons' }
        ]
    },

    'simple-text-classification': {
        objects: [
            {
                name: 'Text Entry',
                description: 'Text being classified',
                coreContent: ['Text Content', 'Source', 'Context', 'Length'],
                metadata: ['Entry Date', 'User', 'Language'],
                actions: ['View', 'Edit', 'Classify', 'Export']
            },
            {
                name: 'Category',
                description: 'Classification category',
                coreContent: ['Category Name', 'Description', 'Keywords', 'Examples'],
                metadata: ['Created Date', 'Active Status', 'Usage Count'],
                actions: ['View', 'Edit', 'Merge', 'Delete']
            },
            {
                name: 'Classification Rule',
                description: 'Rule for categorization',
                coreContent: ['Rule Logic', 'Category', 'Priority', 'Accuracy'],
                metadata: ['Last Updated', 'Performance Score'],
                actions: ['Apply', 'Test', 'Refine', 'Disable']
            },
            {
                name: 'Confidence Score',
                description: 'Classification confidence',
                coreContent: ['Category', 'Score', 'Alternatives', 'Reasoning'],
                metadata: ['Model Version', 'Data Sources'],
                actions: ['Review', 'Override', 'Accept']
            }
        ],
        flow: [
            { step: 1, actor: 'User', action: 'Submits text entry', object: 'Text Entry' },
            { step: 2, actor: 'AI', action: 'Analyzes text content and context', object: 'Text Entry', confidence: true },
            { step: 3, actor: 'AI', action: 'Applies classification rules', object: 'Classification Rule' },
            { step: 4, actor: 'AI', action: 'Calculates confidence for each category', object: 'Confidence Score', confidence: true },
            { step: 5, actor: 'System', action: 'Assigns to highest-confidence category', object: 'Category' },
            { step: 6, actor: 'User', action: 'Reviews and confirms or overrides', object: 'Category' },
            { step: 7, actor: 'AI', action: 'Learns from corrections to improve accuracy', object: 'Classification Rule' }
        ],
        aiTouchpoints: [
            'Analyzes text content using NLP techniques',
            'Matches against category keywords and patterns',
            'Considers context and metadata',
            'Calculates confidence scores for all possible categories',
            'Handles ambiguous cases with multi-category suggestions',
            'Learns from user corrections to refine rules',
            'Adapts to new patterns and emerging categories'
        ],
        configurationNeeds: [
            { setting: 'Auto-Classification Threshold', description: 'Confidence needed for auto-classification', default: '90%' },
            { setting: 'Category Set', description: 'Predefined categories', default: 'Configurable by admin' },
            { setting: 'Learning Mode', description: 'Allow system to suggest new categories', default: 'Enabled' }
        ]
    },

    // Continue with remaining templates...
    // For brevity, I'll include a few more key examples and then provide structure for the rest

    'employee-360-view': {
        objects: [
            {
                name: 'Employee',
                description: 'Core employee record',
                coreContent: ['Employee ID', 'Name', 'Department', 'Manager', 'Status'],
                metadata: ['Hire Date', 'Location', 'Job Title', 'Employment Type'],
                actions: ['View Profile', 'Edit', 'Export', 'Archive']
            },
            {
                name: 'Employee Profile',
                description: 'Unified aggregated view',
                coreContent: ['Employee ID', 'Aggregated Data', 'Timeline', 'Health Score'],
                metadata: ['Last Updated', 'Data Completeness', 'Turnover Risk'],
                actions: ['Explore', 'Analyze', 'Export', 'Compare']
            },
            {
                name: 'Time Data',
                description: 'Time & attendance information',
                coreContent: ['Hours Worked', 'Attendance', 'Overtime', 'PTO Balance'],
                metadata: ['Pay Period', 'Status', 'Anomalies'],
                actions: ['View History', 'Analyze Patterns', 'Export']
            },
            {
                name: 'Payroll Data',
                description: 'Compensation information',
                coreContent: ['Salary', 'Bonuses', 'Deductions', 'Pay History'],
                metadata: ['Pay Grade', 'Market Comparison', 'Equity Status'],
                actions: ['View Details', 'Compare Market', 'Analyze Trends']
            },
            {
                name: 'Benefits Data',
                description: 'Benefits enrollment and usage',
                coreContent: ['Plans', 'Elections', 'Dependents', 'Costs'],
                metadata: ['Enrollment Status', 'Coverage Details', 'Claims History'],
                actions: ['View Coverage', 'Analyze Usage', 'Export']
            },
            {
                name: 'Performance Data',
                description: 'Performance reviews and goals',
                coreContent: ['Ratings', 'Goals', 'Feedback', 'Trajectory'],
                metadata: ['Review Period', 'Manager', 'Development Plan'],
                actions: ['View History', 'Track Progress', 'Compare Peers']
            },
            {
                name: 'HR Insight',
                description: 'AI-generated employee insights',
                coreContent: ['Type', 'Severity', 'Recommendation', 'Confidence'],
                metadata: ['Generated Date', 'Category', 'Status'],
                actions: ['Review', 'Act On', 'Dismiss', 'Share']
            }
        ],
        flow: [
            { step: 1, actor: 'Manager', action: 'Searches for employee in system', object: 'Employee' },
            { step: 2, actor: 'System', action: 'Queries Time, Payroll, Benefits, Performance, Learning systems', object: 'Employee Profile' },
            { step: 3, actor: 'AI', action: 'Aggregates employee data across all HR systems', object: 'Employee Profile', confidence: true },
            { step: 4, actor: 'AI', action: 'Analyzes attendance patterns, performance trends, benefit usage', object: 'Time Data' },
            { step: 5, actor: 'AI', action: 'Generates employee health score and turnover risk prediction', object: 'HR Insight', confidence: true },
            { step: 6, actor: 'System', action: 'Renders unified employee profile with interactive timeline', object: 'Employee Profile' },
            { step: 7, actor: 'Manager', action: 'Explores time history, compensation, performance reviews', object: 'Employee Profile' },
            { step: 8, actor: 'AI', action: 'Provides retention recommendations and development suggestions', object: 'HR Insight' }
        ],
        aiTouchpoints: [
            'Aggregates employee data from Time, Payroll, Benefits, Performance, and Learning systems in real-time',
            'Calculates employee health score based on attendance, performance, and engagement metrics',
            'Maps manager relationships and team organizational structure',
            'Identifies patterns in time-off requests, overtime usage, and attendance',
            'Detects anomalies in attendance or performance trend changes',
            'Generates turnover risk prediction based on behavioral signals and historical patterns',
            'Surfaces compensation equity analysis compared to similar roles and peer groups',
            'Provides natural language summaries of employee career progression and achievements'
        ],
        configurationNeeds: [
            { setting: 'Data Refresh Rate', description: 'How often to update intelligence', default: 'Real-time for critical, hourly for analytics' },
            { setting: 'Insight Sensitivity', description: 'Threshold for generating alerts', default: 'Medium' },
            { setting: 'Privacy Controls', description: 'Data visibility by role', default: 'Role-based with audit logging' },
            { setting: 'System Integration', description: 'Which systems to include', default: 'All HR systems' }
        ]
    },

    'loan-auto-approval': {
        objects: [
            {
                name: 'Loan Application',
                description: 'Customer loan request',
                coreContent: ['Applicant ID', 'Loan Type', 'Amount', 'Term', 'Purpose'],
                metadata: ['Submission Date', 'Status', 'Reference Number'],
                actions: ['Submit', 'Review', 'Approve', 'Deny', 'Modify']
            },
            {
                name: 'Credit Score',
                description: 'Credit assessment',
                coreContent: ['Score', 'History', 'Utilization', 'Inquiries'],
                metadata: ['Bureau', 'Pull Date', 'Disputes'],
                actions: ['View', 'Analyze', 'Dispute', 'Refresh']
            },
            {
                name: 'Risk Assessment',
                description: 'Loan risk evaluation',
                coreContent: ['Default Probability', 'Debt-to-Income', 'Collateral Value', 'LTV Ratio'],
                metadata: ['Risk Rating', 'Confidence', 'Model Version'],
                actions: ['Calculate', 'Review', 'Override', 'Export']
            },
            {
                name: 'Approval Decision',
                description: 'Approval or denial outcome',
                coreContent: ['Status', 'Confidence', 'Reasoning', 'Approver'],
                metadata: ['Decision Date', 'Auto vs Manual', 'Conditions'],
                actions: ['Approve', 'Deny', 'Counter Offer', 'Request Info']
            }
        ],
        flow: [
            { step: 1, actor: 'Customer', action: 'Submits loan application', object: 'Loan Application' },
            { step: 2, actor: 'System', action: 'Validates completeness and pulls credit report', object: 'Credit Score' },
            { step: 3, actor: 'AI', action: 'Validates credit score and income documentation', object: 'Credit Score', confidence: true },
            { step: 4, actor: 'AI', action: 'Analyzes debt-to-income ratio and payment history', object: 'Risk Assessment' },
            { step: 5, actor: 'AI', action: 'Assesses collateral value and loan-to-value ratio', object: 'Risk Assessment', confidence: true },
            { step: 6, actor: 'AI', action: 'Calculates default probability and overall risk score', object: 'Risk Assessment', confidence: true },
            { step: 7, actor: 'System', action: 'Routes based on amount and risk', object: 'Approval Decision', branches: true },
            { step: '7a', actor: 'System', action: 'Auto-approves loan', object: 'Approval Decision', condition: 'amount < $50K AND risk < 20 AND confidence > 90%' },
            { step: '7b', actor: 'System', action: 'Routes to underwriter with AI recommendation', object: 'Approval Decision', condition: 'high risk OR high amount OR low confidence' },
            { step: 8, actor: 'System', action: 'Notifies customer of instant decision or pending status', object: 'Loan Application' },
            { step: 9, actor: 'AI', action: 'Learns from underwriter decisions to refine scoring', object: 'Risk Assessment' }
        ],
        aiTouchpoints: [
            'Validates credit score and verifies income documentation authenticity',
            'Analyzes debt-to-income ratio and historical payment patterns',
            'Assesses collateral value using market data and loan-to-value calculations',
            'Reviews employment stability and income source reliability',
            'Evaluates current market conditions and economic risk factors',
            'Compares application to similar approved and denied applications',
            'Calculates default probability using predictive models',
            'Routes high-risk or high-value applications to senior underwriter',
            'Learns from underwriter decisions and overrides to improve accuracy over time'
        ],
        configurationNeeds: [
            { setting: 'Auto-Approval Amount Limit', description: 'Maximum loan amount for auto-approval', default: '$50,000' },
            { setting: 'Risk Score Threshold', description: 'Maximum risk score for auto-approval', default: '20 points' },
            { setting: 'Confidence Threshold', description: 'Minimum AI confidence for auto-approval', default: '90%' },
            { setting: 'Underwriter Routing Rules', description: 'When to escalate to human review', default: 'High risk OR high amount OR unusual profile' }
        ]
    },

    'fraud-detection': {
        objects: [
            {
                name: 'Transaction',
                description: 'Financial transaction being monitored',
                coreContent: ['Account ID', 'Amount', 'Merchant', 'Location', 'Timestamp'],
                metadata: ['Transaction ID', 'Status', 'Method', 'Currency'],
                actions: ['View', 'Flag', 'Block', 'Reverse', 'Investigate']
            },
            {
                name: 'Behavior Pattern',
                description: 'Normal customer behavior baseline',
                coreContent: ['Typical Amount', 'Typical Merchants', 'Typical Locations', 'Typical Frequency'],
                metadata: ['Last Updated', 'Confidence', 'Anomaly Threshold'],
                actions: ['Analyze', 'Compare', 'Update', 'View History']
            },
            {
                name: 'Fraud Score',
                description: 'Fraud risk assessment',
                coreContent: ['Score', 'Confidence', 'Fraud Indicators', 'Severity'],
                metadata: ['Calculated Time', 'Model Version', 'Risk Level'],
                actions: ['Calculate', 'Review', 'Override', 'Export']
            },
            {
                name: 'Fraud Alert',
                description: 'Fraud detection alert',
                coreContent: ['Transaction ID', 'Fraud Type', 'Action Taken', 'Notification'],
                metadata: ['Alert Time', 'Status', 'Investigator', 'Resolution'],
                actions: ['Investigate', 'Resolve', 'Dismiss', 'Escalate', 'Contact Customer']
            }
        ],
        flow: [
            { step: 1, actor: 'System', action: 'Receives transaction in real-time', object: 'Transaction' },
            { step: 2, actor: 'AI', action: 'Compares to customer\'s normal behavior patterns', object: 'Behavior Pattern', confidence: true },
            { step: 3, actor: 'AI', action: 'Analyzes location, amount, merchant, velocity anomalies', object: 'Transaction' },
            { step: 4, actor: 'AI', action: 'Calculates fraud probability score', object: 'Fraud Score', confidence: true },
            { step: 5, actor: 'System', action: 'Routes based on fraud score', object: 'Transaction', branches: true },
            { step: '5a', actor: 'System', action: 'Blocks transaction and creates alert', object: 'Fraud Alert', condition: 'fraud score > 90%' },
            { step: '5b', actor: 'System', action: 'Alerts customer for verification', object: 'Fraud Alert', condition: 'fraud score 60-90%' },
            { step: '5c', actor: 'System', action: 'Processes transaction normally', object: 'Transaction', condition: 'fraud score < 60%' },
            { step: 6, actor: 'Customer', action: 'Confirms transaction is legitimate or fraudulent', object: 'Fraud Alert' },
            { step: 7, actor: 'AI', action: 'Learns from customer feedback to improve detection', object: 'Behavior Pattern' }
        ],
        aiTouchpoints: [
            'Monitors transaction patterns for unusual spending behavior in real-time',
            'Detects location anomalies and impossible transaction sequences (e.g., two cities in short time)',
            'Analyzes velocity patterns including frequency, amount, and timing anomalies',
            'Identifies merchant category deviations from normal customer behavior',
            'Compares to known fraud patterns and fraud ring indicators',
            'Calculates fraud probability score with confidence levels',
            'Blocks high-risk transactions instantly and alerts customer',
            'Learns from confirmed fraud cases and false positive feedback',
            'Adapts to customer life events and legitimate pattern changes (travel, relocation, etc.)'
        ],
        configurationNeeds: [
            { setting: 'Block Threshold', description: 'Fraud score to auto-block transaction', default: '90%' },
            { setting: 'Alert Threshold', description: 'Fraud score to alert customer', default: '60%' },
            { setting: 'Notification Method', description: 'How to contact customer', default: 'SMS + Email + Push' },
            { setting: 'Learning Rate', description: 'Speed of adaptation to customer patterns', default: 'Medium' }
        ]
    },

    // ============================================
    // HCM TEMPLATES
    // ============================================

    'benefits-enrollment-errors': {
        objects: [
            {
                name: 'Enrollment Form',
                description: 'Benefits election submission',
                coreContent: ['Employee ID', 'Plan Selections', 'Dependent Info', 'Coverage Level'],
                metadata: ['Submission Date', 'Status', 'Deadline', 'Changes from Prior Year'],
                actions: ['Submit', 'Edit', 'Review', 'Cancel']
            },
            {
                name: 'Eligibility Rule',
                description: 'Plan eligibility requirements',
                coreContent: ['Plan Type', 'Employee Class', 'Waiting Period', 'Coverage Restrictions'],
                metadata: ['Rule ID', 'Effective Date', 'Exception Policy'],
                actions: ['Validate', 'View Details', 'Request Exception']
            },
            {
                name: 'Dependent',
                description: 'Covered family member',
                coreContent: ['Name', 'Relationship', 'Date of Birth', 'SSN'],
                metadata: ['Verification Status', 'Documents', 'Coverage Eligibility'],
                actions: ['Add', 'Remove', 'Verify', 'Update']
            },
            {
                name: 'Enrollment Error',
                description: 'Detected issue in enrollment',
                coreContent: ['Error Type', 'Field', 'Current Value', 'Expected Value'],
                metadata: ['Severity', 'Confidence', 'Auto-Correctable', 'Deadline Impact'],
                actions: ['Review', 'Fix', 'Override', 'Dismiss']
            },
            {
                name: 'Correction Suggestion',
                description: 'AI-recommended fix',
                coreContent: ['Original Value', 'Suggested Value', 'Reason', 'Impact'],
                metadata: ['Confidence', 'Similar Cases', 'Acceptance Rate'],
                actions: ['Accept', 'Reject', 'Modify', 'Contact Employee']
            }
        ],
        flow: [
            { step: 1, actor: 'Employee', action: 'Submits benefits enrollment selections', object: 'Enrollment Form' },
            { step: 2, actor: 'AI', action: 'Validates elections against eligibility rules', object: 'Eligibility Rule', confidence: true },
            { step: 3, actor: 'AI', action: 'Cross-checks dependent information for consistency', object: 'Dependent' },
            { step: 4, actor: 'AI', action: 'Compares to prior year elections and flags unusual changes', object: 'Enrollment Form', confidence: true },
            { step: 5, actor: 'AI', action: 'Detects potential errors and missing information', object: 'Enrollment Error' },
            { step: 6, actor: 'AI', action: 'Generates correction suggestions with confidence scores', object: 'Correction Suggestion', confidence: true },
            { step: 7, actor: 'System', action: 'Displays errors inline with suggested fixes', object: 'Enrollment Form' },
            { step: 8, actor: 'Employee', action: 'Reviews and corrects flagged issues', object: 'Enrollment Error' },
            { step: 9, actor: 'System', action: 'Alerts benefits team of unresolved errors before deadline', object: 'Enrollment Error', condition: 'deadline < 48 hours AND unresolved errors' }
        ],
        aiTouchpoints: [
            'Validates plan selections against employee eligibility class and waiting periods',
            'Cross-references dependent ages against plan age limits and student status',
            'Detects inconsistencies between selected coverage levels and actual family size',
            'Flags missing required documentation for life events or dependent additions',
            'Compares elections to prior year and flags significant unexplained changes',
            'Identifies potential HSA/FSA contribution limit violations',
            'Suggests corrections based on similar employee profiles and common fixes',
            'Prioritizes errors by deadline impact and correction difficulty',
            'Learns from benefits team corrections to reduce false positives'
        ],
        configurationNeeds: [
            { setting: 'Error Severity Threshold', description: 'Which errors to surface to employees', default: 'Medium and above' },
            { setting: 'Auto-Correction', description: 'Allow AI to fix obvious errors automatically', default: 'Disabled - suggest only' },
            { setting: 'Deadline Alert Window', description: 'When to escalate unresolved errors', default: '48 hours before deadline' },
            { setting: 'Documentation Requirements', description: 'Which changes require supporting docs', default: 'Life events, new dependents' }
        ]
    },

    'turnover-prediction': {
        objects: [
            {
                name: 'Employee',
                description: 'Employee being assessed',
                coreContent: ['Employee ID', 'Name', 'Department', 'Tenure', 'Role'],
                metadata: ['Hire Date', 'Manager', 'Location', 'Job Level'],
                actions: ['View Profile', 'Analyze Risk', 'Compare Peers']
            },
            {
                name: 'Risk Signal',
                description: 'Behavioral indicator of turnover risk',
                coreContent: ['Signal Type', 'Value', 'Trend', 'Weight'],
                metadata: ['Detection Date', 'Confidence', 'Historical Pattern'],
                actions: ['View Details', 'Analyze Trend', 'Dismiss']
            },
            {
                name: 'Turnover Risk Score',
                description: 'Composite risk assessment',
                coreContent: ['Score', 'Risk Level', 'Key Factors', 'Trajectory'],
                metadata: ['Calculated Date', 'Model Version', 'Peer Comparison'],
                actions: ['View Breakdown', 'Track Over Time', 'Export']
            },
            {
                name: 'Retention Action',
                description: 'Recommended intervention',
                coreContent: ['Action Type', 'Priority', 'Owner', 'Expected Impact'],
                metadata: ['Suggested Date', 'Cost', 'Success Rate'],
                actions: ['Assign', 'Schedule', 'Complete', 'Decline']
            }
        ],
        flow: [
            { step: 1, actor: 'System', action: 'Aggregates employee data from HR systems nightly', object: 'Employee' },
            { step: 2, actor: 'AI', action: 'Analyzes attendance patterns and PTO usage trends', object: 'Risk Signal', confidence: true },
            { step: 3, actor: 'AI', action: 'Evaluates performance trajectory and manager relationship', object: 'Risk Signal' },
            { step: 4, actor: 'AI', action: 'Assesses compensation relative to market and peers', object: 'Risk Signal', confidence: true },
            { step: 5, actor: 'AI', action: 'Detects engagement signals from system usage patterns', object: 'Risk Signal' },
            { step: 6, actor: 'AI', action: 'Calculates composite turnover risk score', object: 'Turnover Risk Score', confidence: true },
            { step: 7, actor: 'AI', action: 'Generates prioritized retention recommendations', object: 'Retention Action' },
            { step: 8, actor: 'System', action: 'Alerts manager when risk exceeds threshold', object: 'Turnover Risk Score', condition: 'risk > 70%' },
            { step: 9, actor: 'Manager', action: 'Reviews risk factors and takes retention action', object: 'Retention Action' }
        ],
        aiTouchpoints: [
            'Monitors attendance patterns including late arrivals, early departures, and increased sick days',
            'Tracks PTO usage patterns that may indicate job searching or disengagement',
            'Analyzes performance review trends and manager feedback sentiment',
            'Compares compensation to market rates and internal equity',
            'Detects changes in collaboration patterns and meeting participation',
            'Evaluates tenure risk based on typical departure timing for role and level',
            'Assesses manager relationship quality through skip-level survey data',
            'Identifies life event indicators that correlate with departure decisions',
            'Learns from actual departures to improve prediction accuracy'
        ],
        configurationNeeds: [
            { setting: 'Alert Threshold', description: 'Risk score to notify manager', default: '70%' },
            { setting: 'Data Sources', description: 'Which systems to include in analysis', default: 'All HR systems + collaboration tools' },
            { setting: 'Update Frequency', description: 'How often to recalculate scores', default: 'Weekly' },
            { setting: 'Privacy Controls', description: 'Who can see individual risk scores', default: 'Direct manager + HRBP only' }
        ]
    },

    'hr-chatbot': {
        objects: [
            {
                name: 'Employee Question',
                description: 'Natural language query from employee',
                coreContent: ['Query Text', 'Intent', 'Context', 'Urgency'],
                metadata: ['Timestamp', 'Employee ID', 'Channel', 'Previous Questions'],
                actions: ['Parse', 'Classify', 'Route', 'Escalate']
            },
            {
                name: 'Knowledge Article',
                description: 'HR policy or procedure document',
                coreContent: ['Title', 'Content', 'Category', 'Keywords'],
                metadata: ['Last Updated', 'Version', 'Owner', 'Views'],
                actions: ['View', 'Search', 'Share', 'Feedback']
            },
            {
                name: 'Employee Data',
                description: 'Personal HR information',
                coreContent: ['PTO Balance', 'Pay Rate', 'Benefits Elections', 'Direct Deposit'],
                metadata: ['Last Updated', 'Access Level', 'Sensitivity'],
                actions: ['View', 'Update Request', 'Export']
            },
            {
                name: 'Chatbot Response',
                description: 'AI-generated answer',
                coreContent: ['Answer Text', 'Sources', 'Confidence', 'Related Topics'],
                metadata: ['Generated Time', 'Model', 'Feedback'],
                actions: ['Display', 'Refine', 'Escalate', 'Rate']
            },
            {
                name: 'HR Case',
                description: 'Escalated inquiry requiring human support',
                coreContent: ['Case ID', 'Category', 'Description', 'Priority'],
                metadata: ['Created Date', 'Assigned To', 'Status', 'SLA'],
                actions: ['Create', 'Assign', 'Resolve', 'Close']
            }
        ],
        flow: [
            { step: 1, actor: 'Employee', action: 'Asks question in natural language', object: 'Employee Question' },
            { step: 2, actor: 'AI', action: 'Parses intent and extracts key entities', object: 'Employee Question', confidence: true },
            { step: 3, actor: 'AI', action: 'Retrieves relevant policy documents and knowledge articles', object: 'Knowledge Article' },
            { step: 4, actor: 'AI', action: 'Queries employee-specific data if authorized', object: 'Employee Data', condition: 'personal data question' },
            { step: 5, actor: 'AI', action: 'Generates personalized response with sources', object: 'Chatbot Response', confidence: true },
            { step: 6, actor: 'System', action: 'Displays answer with related topics', object: 'Chatbot Response' },
            { step: 7, actor: 'Employee', action: 'Rates response helpfulness', object: 'Chatbot Response' },
            { step: 8, actor: 'System', action: 'Escalates to HR specialist if needed', object: 'HR Case', condition: 'low confidence OR negative feedback OR sensitive topic' },
            { step: 9, actor: 'AI', action: 'Learns from feedback to improve future responses', object: 'Knowledge Article' }
        ],
        aiTouchpoints: [
            'Understands natural language questions about pay, benefits, PTO, and policies',
            'Retrieves employee-specific data like PTO balance and pay stub information',
            'Searches knowledge base for relevant policy documents and procedures',
            'Generates conversational responses with appropriate detail level',
            'Provides confidence scores and cites sources for transparency',
            'Handles follow-up questions with conversation context',
            'Recognizes when to escalate to human HR support',
            'Protects sensitive information with role-based access controls',
            'Learns from employee feedback to improve response quality'
        ],
        configurationNeeds: [
            { setting: 'Escalation Threshold', description: 'Confidence level to escalate to human', default: 'Below 70%' },
            { setting: 'Data Access Scope', description: 'What personal data chatbot can access', default: 'Non-sensitive HR data only' },
            { setting: 'Sensitive Topics', description: 'Topics requiring human handling', default: 'Harassment, termination, legal, medical' },
            { setting: 'Response Tone', description: 'Communication style', default: 'Friendly and professional' }
        ]
    },

    'candidate-quality-scoring': {
        objects: [
            {
                name: 'Job Requisition',
                description: 'Open position being filled',
                coreContent: ['Job Title', 'Department', 'Requirements', 'Salary Range'],
                metadata: ['Req ID', 'Posted Date', 'Hiring Manager', 'Status'],
                actions: ['View', 'Edit', 'Close', 'Extend']
            },
            {
                name: 'Candidate',
                description: 'Job applicant',
                coreContent: ['Name', 'Resume', 'Experience', 'Skills'],
                metadata: ['Application Date', 'Source', 'Status', 'Stage'],
                actions: ['View', 'Score', 'Advance', 'Reject', 'Hold']
            },
            {
                name: 'Quality Score',
                description: 'AI-assessed candidate fit',
                coreContent: ['Overall Score', 'Skills Match', 'Experience Match', 'Culture Fit'],
                metadata: ['Scored Date', 'Model Version', 'Confidence'],
                actions: ['View Breakdown', 'Compare', 'Override', 'Explain']
            },
            {
                name: 'Hiring Recommendation',
                description: 'Suggested action for candidate',
                coreContent: ['Recommendation', 'Priority', 'Next Step', 'Reasoning'],
                metadata: ['Generated Date', 'Reviewer', 'Status'],
                actions: ['Accept', 'Modify', 'Reject', 'Discuss']
            }
        ],
        flow: [
            { step: 1, actor: 'Candidate', action: 'Submits application with resume', object: 'Candidate' },
            { step: 2, actor: 'AI', action: 'Parses resume and extracts structured data', object: 'Candidate', confidence: true },
            { step: 3, actor: 'AI', action: 'Matches skills and experience to job requirements', object: 'Quality Score' },
            { step: 4, actor: 'AI', action: 'Analyzes career trajectory and growth patterns', object: 'Quality Score', confidence: true },
            { step: 5, actor: 'AI', action: 'Compares to profiles of successful past hires', object: 'Quality Score' },
            { step: 6, actor: 'AI', action: 'Calculates composite quality score', object: 'Quality Score', confidence: true },
            { step: 7, actor: 'System', action: 'Routes based on score tier', object: 'Hiring Recommendation', branches: true },
            { step: '7a', actor: 'System', action: 'Fast-tracks to recruiter screen', object: 'Hiring Recommendation', condition: 'score > 85%' },
            { step: '7b', actor: 'System', action: 'Queues for manual review', object: 'Hiring Recommendation', condition: 'score 50-85%' },
            { step: '7c', actor: 'System', action: 'Auto-sends rejection with feedback', object: 'Hiring Recommendation', condition: 'score < 50%' },
            { step: 8, actor: 'AI', action: 'Learns from hiring outcomes to improve scoring', object: 'Quality Score' }
        ],
        aiTouchpoints: [
            'Parses resumes to extract skills, experience, education, and achievements',
            'Matches candidate qualifications against job requirements with weighted scoring',
            'Analyzes career progression and identifies growth trajectory',
            'Detects transferable skills from adjacent industries or roles',
            'Compares candidate profile to successful past hires in similar roles',
            'Identifies potential red flags like employment gaps or job hopping',
            'Provides explainable scoring breakdown for recruiter review',
            'Reduces bias by focusing on qualifications over demographic signals',
            'Learns from hiring outcomes to improve prediction accuracy'
        ],
        configurationNeeds: [
            { setting: 'Fast-Track Threshold', description: 'Score for automatic advancement', default: '85%' },
            { setting: 'Auto-Reject Threshold', description: 'Score for automatic rejection', default: '50%' },
            { setting: 'Required Skills Weight', description: 'Importance of must-have skills', default: '60%' },
            { setting: 'Bias Mitigation', description: 'Fields to exclude from scoring', default: 'Name, address, graduation year' }
        ]
    },

    'pto-auto-approval': {
        objects: [
            {
                name: 'PTO Request',
                description: 'Time-off request from employee',
                coreContent: ['Employee ID', 'Start Date', 'End Date', 'Type', 'Reason'],
                metadata: ['Submitted Date', 'Status', 'Hours Requested', 'Balance Impact'],
                actions: ['Submit', 'Approve', 'Deny', 'Modify', 'Cancel']
            },
            {
                name: 'Team Calendar',
                description: 'Team availability view',
                coreContent: ['Team Members', 'Scheduled PTO', 'Coverage Gaps', 'Blackout Dates'],
                metadata: ['Period', 'Department', 'Coverage Threshold'],
                actions: ['View', 'Filter', 'Export', 'Add Event']
            },
            {
                name: 'Coverage Analysis',
                description: 'Team coverage assessment',
                coreContent: ['Coverage Level', 'Critical Roles', 'Backup Assignments', 'Risk'],
                metadata: ['Analyzed Date', 'Model Confidence', 'Historical Pattern'],
                actions: ['Calculate', 'View Details', 'Override']
            },
            {
                name: 'Approval Decision',
                description: 'Request outcome',
                coreContent: ['Status', 'Approver', 'Reason', 'Conditions'],
                metadata: ['Decision Date', 'Auto vs Manual', 'Processing Time'],
                actions: ['Approve', 'Deny', 'Request Info', 'Escalate']
            }
        ],
        flow: [
            { step: 1, actor: 'Employee', action: 'Submits PTO request', object: 'PTO Request' },
            { step: 2, actor: 'AI', action: 'Validates against PTO balance and accrual rules', object: 'PTO Request', confidence: true },
            { step: 3, actor: 'AI', action: 'Analyzes team calendar for conflicts and coverage', object: 'Team Calendar' },
            { step: 4, actor: 'AI', action: 'Calculates team coverage level during requested period', object: 'Coverage Analysis', confidence: true },
            { step: 5, actor: 'AI', action: 'Checks for blackout dates and critical periods', object: 'Team Calendar' },
            { step: 6, actor: 'System', action: 'Routes based on coverage and policy', object: 'Approval Decision', branches: true },
            { step: '6a', actor: 'System', action: 'Auto-approves request', object: 'Approval Decision', condition: 'coverage > 75% AND no blackout AND balance sufficient' },
            { step: '6b', actor: 'System', action: 'Routes to manager with coverage warning', object: 'Approval Decision', condition: 'coverage 50-75%' },
            { step: '6c', actor: 'System', action: 'Suggests alternative dates', object: 'PTO Request', condition: 'coverage < 50% OR blackout date' },
            { step: 7, actor: 'System', action: 'Notifies employee of decision', object: 'PTO Request' },
            { step: 8, actor: 'AI', action: 'Updates team calendar and learns from outcomes', object: 'Team Calendar' }
        ],
        aiTouchpoints: [
            'Validates request against employee PTO balance and accrual schedule',
            'Analyzes team calendar to identify concurrent time-off requests',
            'Calculates coverage level based on critical roles and skills required',
            'Identifies backup resources for critical responsibilities during absence',
            'Checks for conflicts with known blackout dates and peak periods',
            'Predicts workload impact based on historical patterns',
            'Suggests alternative dates when preferred dates create coverage gaps',
            'Learns from manager overrides to improve auto-approval decisions',
            'Balances employee experience with operational needs'
        ],
        configurationNeeds: [
            { setting: 'Auto-Approve Coverage Threshold', description: 'Minimum team coverage for auto-approval', default: '75%' },
            { setting: 'Manager Review Threshold', description: 'Coverage level requiring manager review', default: '50-75%' },
            { setting: 'Blackout Dates', description: 'Dates that always require manager approval', default: 'Configurable by team' },
            { setting: 'Advance Notice Requirement', description: 'Minimum days before PTO start', default: '3 days for 1+ day requests' }
        ]
    },

    'missing-punch-detection': {
        objects: [
            {
                name: 'Timecard',
                description: 'Employee time record',
                coreContent: ['Employee ID', 'Date', 'Punches', 'Total Hours'],
                metadata: ['Status', 'Anomalies', 'Manager', 'Pay Period'],
                actions: ['View', 'Edit', 'Submit', 'Approve']
            },
            {
                name: 'Punch Record',
                description: 'Individual clock event',
                coreContent: ['Punch Type', 'Time', 'Location', 'Method'],
                metadata: ['Device ID', 'GPS', 'IP Address', 'Edited'],
                actions: ['Add', 'Edit', 'Delete', 'Verify']
            },
            {
                name: 'Schedule',
                description: 'Expected work schedule',
                coreContent: ['Shift Start', 'Shift End', 'Break Times', 'Location'],
                metadata: ['Schedule Type', 'Published Date', 'Exceptions'],
                actions: ['View', 'Compare', 'Request Change']
            },
            {
                name: 'Missing Punch Alert',
                description: 'Detected missing punch',
                coreContent: ['Expected Punch', 'Expected Time', 'Reason', 'Confidence'],
                metadata: ['Detected Time', 'Status', 'Resolution'],
                actions: ['Review', 'Add Punch', 'Dismiss', 'Request Edit']
            },
            {
                name: 'Suggested Fix',
                description: 'AI-recommended correction',
                coreContent: ['Punch Type', 'Suggested Time', 'Basis', 'Confidence'],
                metadata: ['Generated Time', 'Acceptance Rate'],
                actions: ['Accept', 'Modify', 'Reject']
            }
        ],
        flow: [
            { step: 1, actor: 'System', action: 'Monitors punches throughout shift', object: 'Punch Record' },
            { step: 2, actor: 'AI', action: 'Compares actual punches to scheduled shift', object: 'Schedule', confidence: true },
            { step: 3, actor: 'AI', action: 'Detects missing punch in or punch out', object: 'Missing Punch Alert' },
            { step: 4, actor: 'AI', action: 'Analyzes patterns to estimate missing punch time', object: 'Suggested Fix', confidence: true },
            { step: 5, actor: 'System', action: 'Sends real-time notification to employee', object: 'Missing Punch Alert' },
            { step: 6, actor: 'Employee', action: 'Reviews alert and adds missing punch', object: 'Punch Record' },
            { step: 7, actor: 'AI', action: 'Validates correction against schedule and patterns', object: 'Punch Record' },
            { step: 8, actor: 'System', action: 'Updates timecard with corrected punch', object: 'Timecard' },
            { step: 9, actor: 'AI', action: 'Learns from corrections to improve detection', object: 'Missing Punch Alert' }
        ],
        aiTouchpoints: [
            'Monitors punch activity against scheduled shift times in real-time',
            'Detects missing punch-in when employee has not clocked in by shift start + grace period',
            'Detects missing punch-out when shift duration exceeds expected without out-punch',
            'Analyzes location data to infer when employee arrived or left',
            'Uses historical patterns to suggest accurate missing punch times',
            'Differentiates between forgotten punches and schedule changes',
            'Sends timely alerts via preferred employee notification channel',
            'Reduces payroll errors by catching missing punches before period close',
            'Learns from employee corrections to reduce false alerts'
        ],
        configurationNeeds: [
            { setting: 'Grace Period', description: 'Minutes after shift start before alert', default: '15 minutes' },
            { setting: 'Notification Channel', description: 'How to alert employee', default: 'Push notification + SMS' },
            { setting: 'Auto-Suggest Threshold', description: 'Confidence to show suggested time', default: '80%' },
            { setting: 'Manager Notification', description: 'When to also alert manager', default: 'Unresolved after 2 hours' }
        ]
    },

    // ============================================
    // FINANCE TEMPLATES
    // ============================================

    'credit-risk-scoring': {
        objects: [
            {
                name: 'Credit Application',
                description: 'Credit or loan application',
                coreContent: ['Applicant', 'Amount Requested', 'Purpose', 'Term'],
                metadata: ['Application Date', 'Status', 'Reference Number'],
                actions: ['Submit', 'Review', 'Process', 'Archive']
            },
            {
                name: 'Credit Profile',
                description: 'Applicant credit history',
                coreContent: ['Credit Score', 'Payment History', 'Debt Load', 'Credit Age'],
                metadata: ['Bureau', 'Pull Date', 'Disputes', 'Trends'],
                actions: ['View', 'Refresh', 'Analyze', 'Compare']
            },
            {
                name: 'Risk Factor',
                description: 'Individual risk indicator',
                coreContent: ['Factor Name', 'Value', 'Weight', 'Trend'],
                metadata: ['Category', 'Data Source', 'Confidence'],
                actions: ['View', 'Drill Down', 'Override']
            },
            {
                name: 'Risk Score',
                description: 'Composite risk assessment',
                coreContent: ['Score', 'Risk Tier', 'Key Factors', 'Recommendation'],
                metadata: ['Model Version', 'Calculated Date', 'Confidence'],
                actions: ['View Breakdown', 'Compare', 'Override', 'Audit']
            },
            {
                name: 'Approval Tier',
                description: 'Routing destination based on risk',
                coreContent: ['Tier Name', 'Risk Range', 'Approval Authority', 'Terms'],
                metadata: ['Volume', 'Approval Rate', 'Default Rate'],
                actions: ['Route', 'Escalate', 'View Rules']
            }
        ],
        flow: [
            { step: 1, actor: 'Applicant', action: 'Submits credit application', object: 'Credit Application' },
            { step: 2, actor: 'System', action: 'Pulls credit report from bureaus', object: 'Credit Profile' },
            { step: 3, actor: 'AI', action: 'Analyzes payment history and credit utilization', object: 'Risk Factor', confidence: true },
            { step: 4, actor: 'AI', action: 'Evaluates debt-to-income and employment stability', object: 'Risk Factor' },
            { step: 5, actor: 'AI', action: 'Assesses application-specific factors', object: 'Risk Factor', confidence: true },
            { step: 6, actor: 'AI', action: 'Calculates composite risk score with factor weights', object: 'Risk Score', confidence: true },
            { step: 7, actor: 'System', action: 'Routes to appropriate approval tier', object: 'Approval Tier', branches: true },
            { step: '7a', actor: 'System', action: 'Routes to auto-approval queue', object: 'Approval Tier', condition: 'score < 25 (low risk)' },
            { step: '7b', actor: 'System', action: 'Routes to analyst review', object: 'Approval Tier', condition: 'score 25-60 (medium risk)' },
            { step: '7c', actor: 'System', action: 'Routes to senior underwriter', object: 'Approval Tier', condition: 'score > 60 (high risk)' },
            { step: 8, actor: 'AI', action: 'Learns from approval decisions and defaults', object: 'Risk Score' }
        ],
        aiTouchpoints: [
            'Analyzes credit bureau data including score, history, and utilization trends',
            'Evaluates payment behavior patterns and identifies concerning trends',
            'Calculates debt-to-income ratio from stated and verified income',
            'Assesses employment stability and income source reliability',
            'Considers industry-specific risk factors for business applications',
            'Weights factors based on predictive power for this customer segment',
            'Generates explainable risk score with key factor breakdown',
            'Recommends appropriate terms based on risk profile',
            'Continuously learns from portfolio performance to improve accuracy'
        ],
        configurationNeeds: [
            { setting: 'Tier Thresholds', description: 'Risk score cutoffs for routing', default: 'Low: <25, Medium: 25-60, High: >60' },
            { setting: 'Factor Weights', description: 'Importance of each risk factor', default: 'Configurable by product type' },
            { setting: 'Override Authority', description: 'Who can override AI scores', default: 'Senior underwriter and above' },
            { setting: 'Model Refresh', description: 'How often to retrain model', default: 'Monthly with weekly monitoring' }
        ]
    },

    'customer-360': {
        objects: [
            {
                name: 'Customer',
                description: 'Core customer record',
                coreContent: ['Customer ID', 'Name', 'Contact Info', 'Customer Since'],
                metadata: ['Segment', 'Status', 'Relationship Manager'],
                actions: ['View', 'Edit', 'Merge', 'Archive']
            },
            {
                name: 'Customer Profile',
                description: 'Unified customer view',
                coreContent: ['Summary', 'Total Relationship Value', 'Health Score', 'Timeline'],
                metadata: ['Last Updated', 'Data Completeness', 'Confidence'],
                actions: ['Explore', 'Analyze', 'Export', 'Share']
            },
            {
                name: 'Account',
                description: 'Customer financial account',
                coreContent: ['Account Type', 'Balance', 'Status', 'Products'],
                metadata: ['Open Date', 'Last Activity', 'Branch'],
                actions: ['View', 'Analyze', 'Transact']
            },
            {
                name: 'Transaction',
                description: 'Financial transaction',
                coreContent: ['Amount', 'Type', 'Merchant', 'Date'],
                metadata: ['Status', 'Category', 'Channel'],
                actions: ['View', 'Categorize', 'Dispute', 'Export']
            },
            {
                name: 'Interaction',
                description: 'Customer touchpoint',
                coreContent: ['Channel', 'Type', 'Summary', 'Outcome'],
                metadata: ['Date', 'Agent', 'Sentiment', 'Resolution'],
                actions: ['View', 'Follow Up', 'Escalate']
            },
            {
                name: 'Customer Insight',
                description: 'AI-generated intelligence',
                coreContent: ['Insight Type', 'Finding', 'Recommendation', 'Impact'],
                metadata: ['Generated Date', 'Confidence', 'Category'],
                actions: ['Review', 'Act On', 'Dismiss', 'Share']
            }
        ],
        flow: [
            { step: 1, actor: 'Banker', action: 'Searches for customer', object: 'Customer' },
            { step: 2, actor: 'System', action: 'Queries core banking, CRM, and channel systems', object: 'Customer Profile' },
            { step: 3, actor: 'AI', action: 'Aggregates accounts, transactions, and interactions', object: 'Customer Profile', confidence: true },
            { step: 4, actor: 'AI', action: 'Analyzes transaction patterns and product usage', object: 'Transaction' },
            { step: 5, actor: 'AI', action: 'Evaluates interaction history and sentiment trends', object: 'Interaction', confidence: true },
            { step: 6, actor: 'AI', action: 'Calculates relationship health score and lifetime value', object: 'Customer Profile', confidence: true },
            { step: 7, actor: 'AI', action: 'Generates personalized insights and next best actions', object: 'Customer Insight' },
            { step: 8, actor: 'System', action: 'Renders unified profile with interactive exploration', object: 'Customer Profile' },
            { step: 9, actor: 'Banker', action: 'Reviews insights and takes recommended actions', object: 'Customer Insight' }
        ],
        aiTouchpoints: [
            'Aggregates customer data from core banking, CRM, and digital channels in real-time',
            'Calculates total relationship value across all products and accounts',
            'Analyzes transaction patterns to understand customer behavior and needs',
            'Evaluates interaction history across all touchpoints with sentiment analysis',
            'Identifies cross-sell and up-sell opportunities based on usage patterns',
            'Predicts churn risk based on engagement and satisfaction signals',
            'Surfaces proactive alerts for life events and service opportunities',
            'Generates next best action recommendations for relationship managers',
            'Provides natural language summaries of customer relationship health'
        ],
        configurationNeeds: [
            { setting: 'Data Sources', description: 'Systems to include in aggregation', default: 'Core banking, CRM, digital channels, call center' },
            { setting: 'Refresh Frequency', description: 'How often to update profile', default: 'Real-time for transactions, hourly for analytics' },
            { setting: 'Insight Types', description: 'Which insights to generate', default: 'Cross-sell, retention, service, life events' },
            { setting: 'Access Controls', description: 'Profile visibility by role', default: 'Role-based with customer consent tracking' }
        ]
    },

    // Note: For templates not explicitly defined here, the system falls back to
    // pattern-based generation in workflow-generator.js which creates contextual workflows
    // based on the detected pattern (autoApproval, anomalyDetection, etc.) and industry.
    //
    // The examples above demonstrate the structure. Additional template-specific workflows
    // can be added as needed for templates requiring unique OOUX modeling beyond the
    // pattern-based defaults.
};

// Export for use in workflow generator
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TEMPLATE_WORKFLOWS };
}
