// Pre-built Template Examples - All 12 Universal Patterns
const TEMPLATES = {
    generic: [
        {
            title: 'Auto-Approval Workflow',
            slug: 'auto-approval-workflow',
            description: 'Automatically approve or route requests based on AI evaluation of policy rules and risk',
            concept: 'Auto-approve requests based on policy compliance and risk assessment',
            complexity: 'medium',
            icon: 'CheckCircle'
        },
        {
            title: 'Anomaly Detection & Correction',
            slug: 'anomaly-detection-correction',
            description: 'Detect unusual patterns or data issues and suggest corrections',
            concept: 'Detect anomalies in transaction data and suggest corrections',
            complexity: 'medium',
            icon: 'AlertCircle'
        },
        {
            title: 'Intelligent Scoring & Routing',
            slug: 'intelligent-scoring-routing',
            description: 'Score entities based on multiple factors and route by threshold',
            concept: 'Score and route items based on configurable risk factors',
            complexity: 'medium',
            icon: 'Brain'
        },
        {
            title: 'Predictive Intelligence Dashboard',
            slug: 'predictive-intelligence-dashboard',
            description: 'Continuously monitor data and generate proactive insights and alerts',
            concept: 'Generate predictive alerts across all business data',
            complexity: 'high',
            icon: 'Lightbulb'
        },
        {
            title: 'Unified Entity Intelligence',
            slug: 'unified-entity-intelligence',
            description: 'Aggregate cross-system data into a single intelligent view with insights',
            concept: 'Show complete intelligent view of any entity across all systems',
            complexity: 'high',
            icon: 'Users'
        },
        {
            title: 'Organization Profile Intelligence',
            slug: 'organization-profile-intelligence',
            description: 'Unified view of organization across all business relationships',
            concept: 'Unified 360 view of organization across contracts, interactions, transactions, contacts, performance metrics',
            complexity: 'high',
            icon: 'Building'
        },
        {
            title: 'Cross-System Orchestration',
            slug: 'cross-system-orchestration',
            description: 'Orchestrate complex workflows that span multiple systems with impact analysis',
            concept: 'Orchestrate multi-system workflows with impact analysis',
            complexity: 'high',
            icon: 'GitBranch'
        },
        {
            title: 'Natural Language Q&A',
            slug: 'natural-language-qa',
            description: 'Answer user questions in natural language with confidence scoring',
            concept: 'Answer user questions about their data in natural language',
            complexity: 'high',
            icon: 'Brain'
        },
        {
            title: 'Intelligent Search & Discovery',
            slug: 'intelligent-search-discovery',
            description: 'Search across all systems with semantic understanding and contextual ranking',
            concept: 'Search intelligently across all systems and data types',
            complexity: 'high',
            icon: 'Lightbulb'
        },
        {
            title: 'What-If Impact Analysis',
            slug: 'what-if-impact-analysis',
            description: 'Analyze cascading impacts of potential changes before they happen',
            concept: 'Analyze impact of changes before executing them',
            complexity: 'high',
            icon: 'AlertCircle'
        },
        {
            title: 'Resource Optimization',
            slug: 'resource-optimization',
            description: 'Generate optimal resource allocation based on historical patterns and constraints',
            concept: 'Optimize resource allocation using historical data',
            complexity: 'medium',
            icon: 'Wrench'
        },
        {
            title: 'Real-Time Data Processing',
            slug: 'real-time-data-processing',
            description: 'Process and validate data in real-time with automated actions',
            concept: 'Process and validate data streams in real-time',
            complexity: 'high',
            icon: 'AlertCircle'
        },
        {
            title: 'Smart Data Aggregation',
            slug: 'smart-data-aggregation',
            description: 'Intelligently aggregate and route data based on business rules',
            concept: 'Aggregate data intelligently based on business rules',
            complexity: 'medium',
            icon: 'Box'
        }
    ],
    hcm: [
        {
            title: 'Performance Review Auto-Routing',
            slug: 'performance-review-auto-routing',
            description: 'Auto-approve or escalate performance reviews',
            concept: 'Auto-approve performance reviews based on rating thresholds and escalate concerning ones',
            complexity: 'medium',
            icon: 'CheckCircle'
        },
        {
            title: 'Benefits Enrollment Errors',
            slug: 'benefits-enrollment-errors',
            description: 'Detect enrollment issues and suggest corrections',
            concept: 'Detect benefits enrollment errors and suggest corrections before deadline',
            complexity: 'medium',
            icon: 'AlertCircle'
        },
        {
            title: 'Candidate Quality Scoring',
            slug: 'candidate-quality-scoring',
            description: 'Score applicants and route by fit',
            concept: 'Score job candidates based on resume and route by match quality',
            complexity: 'medium',
            icon: 'Brain'
        },
        {
            title: 'Turnover Prediction',
            slug: 'turnover-prediction',
            description: 'Predict and prevent employee attrition',
            concept: 'Predict employee turnover risk and suggest retention actions',
            complexity: 'high',
            icon: 'Lightbulb'
        },
        {
            title: 'Employee 360 View',
            slug: 'employee-360-view',
            description: 'Unified view across all HR systems',
            concept: 'Unified 360 view of employee across time, payroll, benefits, performance',
            complexity: 'high',
            icon: 'Users'
        },
        {
            title: 'Department Intelligence Profile',
            slug: 'department-intelligence-profile',
            description: 'Unified view of department across workforce metrics and operations',
            concept: 'Unified 360 view of department across headcount, performance, costs, time-off, turnover risk',
            complexity: 'high',
            icon: 'Building'
        },
        {
            title: 'New Hire Onboarding',
            slug: 'new-hire-onboarding',
            description: 'Orchestrate onboarding across HR, IT, facilities',
            concept: 'Process new hire onboarding across HR, IT, payroll, facilities',
            complexity: 'high',
            icon: 'GitBranch'
        },
        {
            title: 'HR Chatbot',
            slug: 'hr-chatbot',
            description: 'Answer employee questions about pay, benefits, policies',
            concept: 'Answer employee questions about pay, benefits, PTO',
            complexity: 'high',
            icon: 'Brain'
        },
        {
            title: 'People Search',
            slug: 'people-search',
            description: 'Search employees, org charts, skills, documents',
            concept: 'Search employees, time records, policies, documents',
            complexity: 'high',
            icon: 'Lightbulb'
        },
        {
            title: 'Compensation Change Impact',
            slug: 'compensation-change-impact',
            description: 'Analyze budget impact of salary adjustments',
            concept: 'Analyze budget impact if we give department 3% raises',
            complexity: 'high',
            icon: 'AlertCircle'
        },
        {
            title: 'AI Interview Scheduling',
            slug: 'ai-interview-scheduling',
            description: 'Optimize interview schedules across panel',
            concept: 'Generate interview schedules based on interviewer availability and candidate preferences',
            complexity: 'medium',
            icon: 'Wrench'
        },
        {
            title: 'Open Enrollment Processing',
            slug: 'open-enrollment-processing',
            description: 'Process enrollment changes in real-time',
            concept: 'Process benefits elections in real-time with eligibility validation',
            complexity: 'high',
            icon: 'AlertCircle'
        },
        {
            title: 'Learning Path Recommendations',
            slug: 'learning-path-recommendations',
            description: 'Aggregate training based on role and skills gaps',
            concept: 'Recommend personalized learning paths based on role and career goals',
            complexity: 'medium',
            icon: 'Box'
        },
        {
            title: 'PTO Auto-Approval',
            slug: 'pto-auto-approval',
            description: 'Auto-approve time-off with coverage validation',
            concept: 'Auto-approve PTO requests with team coverage validation',
            complexity: 'medium',
            icon: 'CheckCircle'
        },
        {
            title: 'Missing Punch Detection',
            slug: 'missing-punch-detection',
            description: 'Find and fix missing time entries',
            concept: 'Detect missing time punches and suggest fixes based on schedule',
            complexity: 'medium',
            icon: 'AlertCircle'
        },
        {
            title: 'Timecard Anomaly Scoring',
            slug: 'timecard-anomaly-scoring',
            description: 'Score timecards for unusual patterns',
            concept: 'Score timecards for anomalies and route by risk threshold',
            complexity: 'medium',
            icon: 'Brain'
        },
        {
            title: 'Overtime Prediction',
            slug: 'overtime-prediction',
            description: 'Forecast overtime costs and alert managers',
            concept: 'Predict overtime trends and alert managers to take action',
            complexity: 'high',
            icon: 'Lightbulb'
        },
        {
            title: 'AI Schedule Generation',
            slug: 'ai-schedule-generation',
            description: 'Generate schedules from past demand patterns',
            concept: 'Generate employee schedules from past demand patterns',
            complexity: 'medium',
            icon: 'Wrench'
        },
        {
            title: 'Payroll Lock & Validation',
            slug: 'payroll-lock-validation',
            description: 'Lock timecards and validate before payroll',
            concept: 'Lock timecards at cutoff and send validated data to payroll',
            complexity: 'high',
            icon: 'AlertCircle'
        }
    ],
    finance: [
        {
            title: 'Loan Auto-Approval',
            slug: 'loan-auto-approval',
            description: 'Automated lending decisions',
            concept: 'Auto-approve loan applications under threshold with low risk score',
            complexity: 'medium',
            icon: 'CheckCircle'
        },
        {
            title: 'Fraud Detection',
            slug: 'fraud-detection',
            description: 'Real-time transaction monitoring',
            concept: 'Detect fraudulent transactions and flag for review',
            complexity: 'high',
            icon: 'AlertCircle'
        },
        {
            title: 'Credit Risk Scoring',
            slug: 'credit-risk-scoring',
            description: 'Multi-factor risk assessment',
            concept: 'Score credit applications and route by approval tier',
            complexity: 'medium',
            icon: 'Brain'
        },
        {
            title: 'Credit Risk Forecasting',
            slug: 'credit-risk-forecasting',
            description: 'Predict and prevent portfolio risk',
            concept: 'Forecast credit risk and recommend portfolio adjustments',
            complexity: 'high',
            icon: 'Lightbulb'
        },
        {
            title: 'Customer 360',
            slug: 'customer-360',
            description: 'Complete customer financial view',
            concept: 'Unified 360 view of customer across accounts, transactions, interactions',
            complexity: 'high',
            icon: 'Users'
        },
        {
            title: 'Company Profile Intelligence',
            slug: 'company-profile-intelligence',
            description: 'Unified view of business customer across all financial relationships',
            concept: 'Unified 360 view of company across accounts, credit facilities, transactions, contacts, risk profile',
            complexity: 'high',
            icon: 'Building'
        },
        {
            title: 'Account Closure Workflow',
            slug: 'account-closure-workflow',
            description: 'Process closure across all related systems',
            concept: 'Process account closure across all related systems',
            complexity: 'high',
            icon: 'GitBranch'
        },
        {
            title: 'Banking Chatbot',
            slug: 'banking-chatbot',
            description: 'Answer questions about accounts, balances, transactions',
            concept: 'Answer customer questions about accounts, balances, transactions',
            complexity: 'high',
            icon: 'Brain'
        },
        {
            title: 'Financial Search',
            slug: 'financial-search',
            description: 'Search transactions, accounts, customers, documents',
            concept: 'Search transactions, accounts, customers, documents',
            complexity: 'high',
            icon: 'Lightbulb'
        },
        {
            title: 'Interest Rate Impact',
            slug: 'interest-rate-impact',
            description: 'Analyze impact of rate change on portfolio',
            concept: 'Analyze impact of interest rate change on portfolio',
            complexity: 'high',
            icon: 'AlertCircle'
        },
        {
            title: 'Portfolio Optimization',
            slug: 'portfolio-optimization',
            description: 'Optimize allocation based on risk profiles',
            concept: 'Optimize portfolio allocation based on risk profiles',
            complexity: 'medium',
            icon: 'Wrench'
        },
        {
            title: 'Real-Time Trading',
            slug: 'real-time-trading',
            description: 'Process orders with real-time validation',
            concept: 'Process trading orders with real-time validation',
            complexity: 'high',
            icon: 'AlertCircle'
        },
        {
            title: 'Statement Consolidation',
            slug: 'statement-consolidation',
            description: 'Consolidate transactions into monthly statements',
            concept: 'Consolidate transactions into monthly statements',
            complexity: 'medium',
            icon: 'Box'
        }
    ]
};
