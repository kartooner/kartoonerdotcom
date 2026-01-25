// Generic Workflow Patterns (Domain-Agnostic)
// These patterns work across any industry

const WORKFLOW_PATTERNS = {
    autoApproval: {
        name: 'Auto-Approval Workflow',
        description: 'Automatically approve or route requests based on AI evaluation of policy rules and risk',
        triggerKeywords: ['auto', 'approv', 'automatic'],
        applicableTo: ['Requests', 'Applications', 'Submissions', 'Claims'],
        humanInTheLoop: 'Required when confidence score is below threshold, for high-value requests, exceptions to policy, or when AI flags uncertainty. Manager approval for edge cases.',
        examples: {
            generic: 'Auto-approve requests based on policy compliance and risk assessment',
            hcm: 'Auto-approve PTO requests with team coverage validation',
            finance: 'Auto-approve loan applications under threshold with low risk score',
            healthcare: 'Auto-approve prescription refills for stable patients',
            retail: 'Auto-approve returns under $50 with valid receipt'
        }
    },

    anomalyDetection: {
        name: 'Anomaly Detection & Correction',
        description: 'Detect unusual patterns or data issues and suggest corrections',
        triggerKeywords: ['detect', 'anomal', 'missing', 'flag', 'error'],
        applicableTo: ['Transactions', 'Records', 'Data', 'Entries'],
        humanInTheLoop: 'Human review required for all flagged anomalies before corrections are applied. Critical anomalies should escalate to domain experts for verification.',
        examples: {
            generic: 'Detect anomalies in transaction data and suggest corrections',
            hcm: 'Detect missing time punches and suggest fixes based on schedule',
            finance: 'Detect fraudulent transactions and flag for review',
            healthcare: 'Detect medication errors and alert before dispensing',
            retail: 'Detect inventory discrepancies and trigger reconciliation'
        }
    },

    intelligentScoring: {
        name: 'Intelligent Scoring & Routing',
        description: 'Score entities based on multiple factors and route by threshold',
        triggerKeywords: ['score', 'insight', 'rating', 'classify'],
        applicableTo: ['Applications', 'Submissions', 'Requests', 'Records'],
        humanInTheLoop: 'Experts should review borderline scores and validate high-stakes decisions. Periodic audits of scoring fairness and accuracy recommended.',
        examples: {
            generic: 'Score and route items based on configurable risk factors',
            hcm: 'Score timecards for anomalies and route by risk threshold',
            finance: 'Score credit applications and route by approval tier',
            healthcare: 'Score patient risk and prioritize care interventions',
            retail: 'Score customer returns for fraud likelihood'
        }
    },

    predictiveIntelligence: {
        name: 'Predictive Intelligence Dashboard',
        description: 'Continuously monitor data and generate proactive insights and alerts',
        triggerKeywords: ['predict', 'forecast', 'alert', 'insight', 'dashboard', 'proactive'],
        applicableTo: ['Trends', 'Risks', 'Opportunities', 'Issues'],
        humanInTheLoop: 'Humans validate predictions before taking action, especially for interventions. Leadership review for strategic decisions based on forecasts.',
        examples: {
            generic: 'Generate predictive alerts across all business data',
            hcm: 'Predict employee turnover risk and suggest retention actions',
            finance: 'Forecast credit risk and recommend portfolio adjustments',
            healthcare: 'Predict patient readmission risk and plan interventions',
            retail: 'Predict inventory stockouts and optimize reordering'
        }
    },

    unifiedEntityView: {
        name: 'Unified Entity Intelligence',
        description: 'Aggregate cross-system data into a single intelligent view with insights',
        triggerKeywords: ['unified', 'everything about', 'complete view', '360', 'vantage'],
        applicableTo: ['People', 'Customers', 'Accounts', 'Products', 'Assets'],
        humanInTheLoop: 'Users verify AI-generated insights and can flag incorrect correlations. Data stewards review and correct cross-system data conflicts.',
        examples: {
            generic: 'Show complete intelligent view of any entity across all systems',
            hcm: 'View employee across time, payroll, benefits, performance',
            finance: 'View customer across accounts, transactions, interactions',
            healthcare: 'View patient across visits, treatments, prescriptions, billing',
            retail: 'View customer across orders, returns, support, loyalty'
        }
    },

    crossSystemWorkflow: {
        name: 'Cross-System Orchestration',
        description: 'Orchestrate complex workflows that span multiple systems with impact analysis',
        triggerKeywords: ['cross-domain', 'workflow', 'orchestrat', 'multi-system', 'process'],
        applicableTo: ['State Changes', 'Lifecycle Events', 'Complex Processes'],
        humanInTheLoop: 'Human approval gates at each major system boundary. Impact analysis must be reviewed before execution. Rollback decisions require human authorization.',
        examples: {
            generic: 'Orchestrate multi-system workflows with impact analysis',
            hcm: 'Process employee promotion across HR, payroll, IT, facilities',
            finance: 'Process account closure across all related systems',
            healthcare: 'Coordinate care transition across providers and systems',
            retail: 'Process order fulfillment across inventory, shipping, billing'
        }
    },

    naturalLanguageQA: {
        name: 'Natural Language Q&A',
        description: 'Answer user questions in natural language with confidence scoring',
        triggerKeywords: ['question', 'ask', 'chat', 'conversational', 'natural language'],
        applicableTo: ['Support', 'Self-Service', 'Information Retrieval'],
        humanInTheLoop: 'Escalate to human agents when confidence is low or question is complex. Human review of AI responses for sensitive topics. Feedback loop to improve AI answers.',
        examples: {
            generic: 'Answer user questions about their data in natural language',
            hcm: 'Answer employee questions about pay, benefits, PTO',
            finance: 'Answer customer questions about accounts, balances, transactions',
            healthcare: 'Answer patient questions about appointments, prescriptions, bills',
            retail: 'Answer customer questions about orders, returns, products'
        }
    },

    intelligentSearch: {
        name: 'Intelligent Search & Discovery',
        description: 'Search across all systems with semantic understanding and contextual ranking',
        triggerKeywords: ['search', 'find', 'discover', 'global', 'lookup'],
        applicableTo: ['Data', 'Documents', 'Entities', 'Records'],
        humanInTheLoop: 'Users provide relevance feedback to improve ranking. Administrators configure access controls and sensitive data visibility.',
        examples: {
            generic: 'Search intelligently across all systems and data types',
            hcm: 'Search employees, time records, policies, documents',
            finance: 'Search transactions, accounts, customers, documents',
            healthcare: 'Search patients, claims, providers, clinical notes',
            retail: 'Search products, orders, customers, inventory'
        }
    },

    impactAnalysis: {
        name: 'What-If Impact Analysis',
        description: 'Analyze cascading impacts of potential changes before they happen',
        triggerKeywords: ['impact', 'what if', 'scenario', 'analysis', 'consequence'],
        applicableTo: ['Changes', 'Decisions', 'Events', 'Scenarios'],
        humanInTheLoop: 'All impact analyses must be reviewed by domain experts before decisions. Critical impacts require leadership sign-off. Human judgment for intangible factors.',
        examples: {
            generic: 'Analyze impact of changes before executing them',
            hcm: 'Analyze impact if key employee leaves',
            finance: 'Analyze impact of interest rate change on portfolio',
            healthcare: 'Analyze impact of provider departure on patient care',
            retail: 'Analyze impact of supplier change on inventory'
        }
    },

    resourceOptimization: {
        name: 'Resource Optimization',
        description: 'Generate optimal resource allocation based on historical patterns and constraints',
        triggerKeywords: ['schedul', 'optimiz', 'allocat', 'generat', 'plan'],
        applicableTo: ['Schedules', 'Resources', 'Capacity', 'Allocation'],
        humanInTheLoop: 'Managers review and approve AI-generated schedules before publishing. Employees can request adjustments. Human override for special circumstances.',
        examples: {
            generic: 'Optimize resource allocation using historical data',
            hcm: 'Generate employee schedules from past demand patterns',
            finance: 'Optimize portfolio allocation based on risk profiles',
            healthcare: 'Optimize staff scheduling for patient volume patterns',
            retail: 'Optimize inventory allocation across store locations'
        }
    },

    realTimeProcessing: {
        name: 'Real-Time Data Processing',
        description: 'Process and validate data in real-time with automated actions',
        triggerKeywords: ['real-time', 'lock', 'process', 'validate', 'cutoff'],
        applicableTo: ['Transactions', 'Data Feeds', 'Time-Sensitive Processes'],
        humanInTheLoop: 'Alerts to humans for validation failures requiring intervention. Override capabilities for time-critical exceptions. Post-processing audit by humans.',
        examples: {
            generic: 'Process and validate data streams in real-time',
            hcm: 'Lock timecards at cutoff and send validated data to payroll',
            finance: 'Process trading orders with real-time validation',
            healthcare: 'Validate insurance claims in real-time at submission',
            retail: 'Process orders in real-time with inventory validation'
        }
    },

    smartAggregation: {
        name: 'Smart Data Aggregation',
        description: 'Intelligently aggregate and route data based on business rules',
        triggerKeywords: ['aggregat', 'consolidat', 'merge', 'append', 'combine'],
        applicableTo: ['Data', 'Transactions', 'Records', 'Reports'],
        humanInTheLoop: 'Review aggregation logic for complex merges. Approval for aggregations affecting financial or compliance data. Exception handling for conflicts.',
        examples: {
            generic: 'Aggregate data intelligently based on business rules',
            hcm: 'Append adjustments to active paychecks vs creating separate',
            finance: 'Consolidate transactions into monthly statements',
            healthcare: 'Aggregate claims into single billing statements',
            retail: 'Consolidate orders for combined shipping'
        }
    }
};

// Generic objects that work across all domains
const GENERIC_OBJECTS = {
    entity: {
        name: 'Entity',
        description: 'Primary business object (person, customer, product, etc.)',
        coreContent: ['ID', 'Name', 'Type', 'Status'],
        metadata: ['Created Date', 'Modified Date', 'Owner', 'Version'],
        actions: ['View', 'Edit', 'Delete', 'Archive', 'Export'],
        relationships: [
            { type: 'has-many', target: 'transaction', description: 'Entity has multiple transactions' },
            { type: 'has-many', target: 'request', description: 'Entity can make multiple requests' }
        ]
    },
    request: {
        name: 'Request',
        description: 'Any type of submission requiring approval',
        coreContent: ['Requestor', 'Type', 'Details', 'Amount/Duration'],
        metadata: ['Status', 'Submission Date', 'Approver', 'Priority'],
        actions: ['Submit', 'Approve', 'Deny', 'Modify', 'Cancel', 'View History'],
        relationships: [
            { type: 'belongs-to', target: 'entity', description: 'Request is made by an entity' },
            { type: 'has-one', target: 'approval', description: 'Request has one approval decision' }
        ]
    },
    transaction: {
        name: 'Transaction',
        description: 'Any business transaction or data entry',
        coreContent: ['Entity', 'Date', 'Amount', 'Type', 'Description'],
        metadata: ['Status', 'Processed By', 'Category', 'Reference ID'],
        actions: ['View', 'Edit', 'Flag', 'Reverse', 'Export'],
        relationships: [
            { type: 'belongs-to', target: 'entity', description: 'Transaction belongs to an entity' },
            { type: 'has-many', target: 'anomaly', description: 'Transaction may have anomalies detected' }
        ]
    },
    anomaly: {
        name: 'Anomaly',
        description: 'Detected issue or unusual pattern',
        coreContent: ['Type', 'Description', 'Affected Object', 'Severity'],
        metadata: ['Detected Date', 'AI Confidence', 'Status', 'Assigned To'],
        actions: ['Review', 'Resolve', 'Escalate', 'Dismiss', 'Add Note'],
        relationships: [
            { type: 'belongs-to', target: 'transaction', description: 'Anomaly detected in a transaction' },
            { type: 'has-one', target: 'insight', description: 'Anomaly generates AI insight' }
        ]
    },
    approval: {
        name: 'Approval',
        description: 'Approval workflow and decision tracking',
        coreContent: ['Request Type', 'Requestor', 'Status', 'Decision'],
        metadata: ['Due Date', 'Approver', 'Approval Chain', 'Decision Date'],
        actions: ['Approve', 'Deny', 'Delegate', 'Request More Info', 'View Context'],
        relationships: [
            { type: 'belongs-to', target: 'request', description: 'Approval is for a request' },
            { type: 'belongs-to', target: 'entity', description: 'Approval assigned to approver (entity)' }
        ]
    },
    intelligenceHub: {
        name: 'Intelligence Hub',
        description: 'Central intelligence interface',
        coreContent: ['Entity Type', 'Key Metrics', 'Insights', 'Relationships'],
        metadata: ['Last Updated', 'Data Freshness', 'Confidence Score', 'Source Systems'],
        actions: ['Search', 'Explore', 'Ask Question', 'View Connections', 'Get Recommendations'],
        relationships: [
            { type: 'has-many', target: 'profile', description: 'Hub aggregates multiple profiles' },
            { type: 'has-many', target: 'insight', description: 'Hub generates many insights' }
        ]
    },
    insight: {
        name: 'Insight',
        description: 'AI-generated insight or recommendation',
        coreContent: ['Type', 'Severity', 'Description', 'Recommendation'],
        metadata: ['Generated Date', 'AI Confidence', 'Domain', 'Status'],
        actions: ['Review', 'Act On', 'Dismiss', 'Share', 'Track'],
        relationships: [
            { type: 'belongs-to', target: 'intelligenceHub', description: 'Insight generated by hub' },
            { type: 'relates-to', target: 'entity', description: 'Insight about an entity' }
        ]
    },
    workflow: {
        name: 'Workflow',
        description: 'Cross-system workflow orchestration',
        coreContent: ['Type', 'Impacted Systems', 'Impact Analysis', 'Tasks'],
        metadata: ['Status', 'Initiated By', 'Completion %', 'Dependencies'],
        actions: ['Initiate', 'Review Impact', 'Approve', 'Execute', 'Track Progress'],
        relationships: [
            { type: 'has-many', target: 'approval', description: 'Workflow requires multiple approvals' },
            { type: 'relates-to', target: 'entity', description: 'Workflow affects entities' }
        ]
    },
    profile: {
        name: 'Profile',
        description: 'Unified entity profile across systems',
        coreContent: ['Entity Type', 'Core Data', 'Cross-References', 'Activity Timeline'],
        metadata: ['Entity ID', 'Last Activity', 'Data Completeness', 'Health Score'],
        actions: ['View Details', 'See Connections', 'Track Changes', 'Export', 'Compare'],
        relationships: [
            { type: 'belongs-to', target: 'entity', description: 'Profile represents an entity' },
            { type: 'has-many', target: 'transaction', description: 'Profile shows transaction history' },
            { type: 'has-many', target: 'insight', description: 'Profile includes AI insights' }
        ]
    },
    schedule: {
        name: 'Schedule',
        description: 'Resource allocation and scheduling',
        coreContent: ['Date Range', 'Resource Assignments', 'Details', 'Coverage'],
        metadata: ['Status', 'Created By', 'Published Date', 'Version'],
        actions: ['Generate', 'Edit', 'Publish', 'Copy', 'Optimize', 'View Coverage'],
        relationships: [
            { type: 'has-many', target: 'entity', description: 'Schedule assigns multiple entities (resources)' }
        ]
    }
};