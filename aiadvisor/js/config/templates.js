// Pre-built Template Examples - All 12 Universal Patterns
const TEMPLATES = {
    generic: [
        {
            title: 'Auto-Approval Workflow',
            description: 'Automatically approve or route requests based on AI evaluation of policy rules and risk',
            concept: 'Auto-approve requests based on policy compliance and risk assessment',
            complexity: 'medium',
            icon: 'CheckCircle'
        },
        {
            title: 'Anomaly Detection & Correction',
            description: 'Detect unusual patterns or data issues and suggest corrections',
            concept: 'Detect anomalies in transaction data and suggest corrections',
            complexity: 'medium',
            icon: 'AlertCircle'
        },
        {
            title: 'Intelligent Scoring & Routing',
            description: 'Score entities based on multiple factors and route by threshold',
            concept: 'Score and route items based on configurable risk factors',
            complexity: 'medium',
            icon: 'Brain'
        },
        {
            title: 'Predictive Intelligence Dashboard',
            description: 'Continuously monitor data and generate proactive insights and alerts',
            concept: 'Generate predictive alerts across all business data',
            complexity: 'high',
            icon: 'Lightbulb'
        },
        {
            title: 'Unified Entity Intelligence',
            description: 'Aggregate cross-system data into a single intelligent view with insights',
            concept: 'Show complete intelligent view of any entity across all systems',
            complexity: 'high',
            icon: 'Users'
        },
        {
            title: 'Cross-System Orchestration',
            description: 'Orchestrate complex workflows that span multiple systems with impact analysis',
            concept: 'Orchestrate multi-system workflows with impact analysis',
            complexity: 'high',
            icon: 'GitBranch'
        },
        {
            title: 'Natural Language Q&A',
            description: 'Answer user questions in natural language with confidence scoring',
            concept: 'Answer user questions about their data in natural language',
            complexity: 'high',
            icon: 'Brain'
        },
        {
            title: 'Intelligent Search & Discovery',
            description: 'Search across all systems with semantic understanding and contextual ranking',
            concept: 'Search intelligently across all systems and data types',
            complexity: 'high',
            icon: 'Lightbulb'
        },
        {
            title: 'What-If Impact Analysis',
            description: 'Analyze cascading impacts of potential changes before they happen',
            concept: 'Analyze impact of changes before executing them',
            complexity: 'high',
            icon: 'AlertCircle'
        },
        {
            title: 'Resource Optimization',
            description: 'Generate optimal resource allocation based on historical patterns and constraints',
            concept: 'Optimize resource allocation using historical data',
            complexity: 'medium',
            icon: 'Wrench'
        },
        {
            title: 'Real-Time Data Processing',
            description: 'Process and validate data in real-time with automated actions',
            concept: 'Process and validate data streams in real-time',
            complexity: 'high',
            icon: 'AlertCircle'
        },
        {
            title: 'Smart Data Aggregation',
            description: 'Intelligently aggregate and route data based on business rules',
            concept: 'Aggregate data intelligently based on business rules',
            complexity: 'medium',
            icon: 'Box'
        }
    ],
    hcm: [
        {
            title: 'PTO Auto-Approval',
            description: 'Auto-approve time-off with coverage validation',
            concept: 'Auto-approve PTO requests with team coverage validation',
            complexity: 'medium',
            icon: 'CheckCircle'
        },
        {
            title: 'Missing Punch Detection',
            description: 'Find and fix missing time entries',
            concept: 'Detect missing time punches and suggest fixes based on schedule',
            complexity: 'medium',
            icon: 'AlertCircle'
        },
        {
            title: 'Timecard Scoring',
            description: 'Score timecards for anomalies and route by risk',
            concept: 'Score timecards for anomalies and route by risk threshold',
            complexity: 'medium',
            icon: 'Brain'
        },
        {
            title: 'Turnover Prediction',
            description: 'Predict and prevent employee attrition',
            concept: 'Predict employee turnover risk and suggest retention actions',
            complexity: 'high',
            icon: 'Lightbulb'
        },
        {
            title: 'Employee 360 View',
            description: 'Unified view across all HR systems',
            concept: 'View employee across time, payroll, benefits, performance',
            complexity: 'high',
            icon: 'Users'
        },
        {
            title: 'Employee Promotion Workflow',
            description: 'Process promotion across HR, payroll, IT, facilities',
            concept: 'Process employee promotion across HR, payroll, IT, facilities',
            complexity: 'high',
            icon: 'GitBranch'
        },
        {
            title: 'HR Chatbot',
            description: 'Answer employee questions about pay, benefits, PTO',
            concept: 'Answer employee questions about pay, benefits, PTO',
            complexity: 'high',
            icon: 'Brain'
        },
        {
            title: 'Employee Search',
            description: 'Search employees, time records, policies, documents',
            concept: 'Search employees, time records, policies, documents',
            complexity: 'high',
            icon: 'Lightbulb'
        },
        {
            title: 'Employee Departure Impact',
            description: 'Analyze impact if key employee leaves',
            concept: 'Analyze impact if key employee leaves',
            complexity: 'high',
            icon: 'AlertCircle'
        },
        {
            title: 'AI Schedule Generation',
            description: 'Generate schedules from past demand patterns',
            concept: 'Generate employee schedules from past demand patterns',
            complexity: 'medium',
            icon: 'Wrench'
        },
        {
            title: 'Payroll Lock & Process',
            description: 'Lock timecards at cutoff and send to payroll',
            concept: 'Lock timecards at cutoff and send validated data to payroll',
            complexity: 'high',
            icon: 'AlertCircle'
        },
        {
            title: 'Smart Paycheck Adjustments',
            description: 'Append adjustments to active vs creating separate',
            concept: 'Append adjustments to active paychecks vs creating separate',
            complexity: 'medium',
            icon: 'Box'
        }
    ],
    finance: [
        {
            title: 'Loan Auto-Approval',
            description: 'Automated lending decisions',
            concept: 'Auto-approve loan applications under threshold with low risk score',
            complexity: 'medium',
            icon: 'CheckCircle'
        },
        {
            title: 'Fraud Detection',
            description: 'Real-time transaction monitoring',
            concept: 'Detect fraudulent transactions and flag for review',
            complexity: 'high',
            icon: 'AlertCircle'
        },
        {
            title: 'Credit Risk Scoring',
            description: 'Multi-factor risk assessment',
            concept: 'Score credit applications and route by approval tier',
            complexity: 'medium',
            icon: 'Brain'
        },
        {
            title: 'Credit Risk Forecasting',
            description: 'Predict and prevent portfolio risk',
            concept: 'Forecast credit risk and recommend portfolio adjustments',
            complexity: 'high',
            icon: 'Lightbulb'
        },
        {
            title: 'Customer 360',
            description: 'Complete customer financial view',
            concept: 'View customer across accounts, transactions, interactions',
            complexity: 'high',
            icon: 'Users'
        },
        {
            title: 'Account Closure Workflow',
            description: 'Process closure across all related systems',
            concept: 'Process account closure across all related systems',
            complexity: 'high',
            icon: 'GitBranch'
        },
        {
            title: 'Banking Chatbot',
            description: 'Answer questions about accounts, balances, transactions',
            concept: 'Answer customer questions about accounts, balances, transactions',
            complexity: 'high',
            icon: 'Brain'
        },
        {
            title: 'Financial Search',
            description: 'Search transactions, accounts, customers, documents',
            concept: 'Search transactions, accounts, customers, documents',
            complexity: 'high',
            icon: 'Lightbulb'
        },
        {
            title: 'Interest Rate Impact',
            description: 'Analyze impact of rate change on portfolio',
            concept: 'Analyze impact of interest rate change on portfolio',
            complexity: 'high',
            icon: 'AlertCircle'
        },
        {
            title: 'Portfolio Optimization',
            description: 'Optimize allocation based on risk profiles',
            concept: 'Optimize portfolio allocation based on risk profiles',
            complexity: 'medium',
            icon: 'Wrench'
        },
        {
            title: 'Real-Time Trading',
            description: 'Process orders with real-time validation',
            concept: 'Process trading orders with real-time validation',
            complexity: 'high',
            icon: 'AlertCircle'
        },
        {
            title: 'Statement Consolidation',
            description: 'Consolidate transactions into monthly statements',
            concept: 'Consolidate transactions into monthly statements',
            complexity: 'medium',
            icon: 'Box'
        }
    ]
};
