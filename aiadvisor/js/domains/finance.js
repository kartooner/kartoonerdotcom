// Finance Domain Plugin (Optional)
// Load this file to add Finance-specific terminology and examples

const FINANCE_DOMAIN = {
    name: 'Finance',
    description: 'Banking, lending, investments, payments, risk management',

    // Finance-specific objects that extend generic ones
    objects: {
        account: {
            name: 'Account',
            extends: 'entity',
            coreContent: ['Account Number', 'Account Type', 'Customer', 'Balance', 'Status'],
            metadata: ['Open Date', 'Last Activity', 'Branch', 'Product Type'],
            actions: ['View Details', 'View Transactions', 'Update Info', 'Set Alerts', 'Close Account']
        },
        transaction: {
            name: 'Transaction',
            extends: 'transaction',
            coreContent: ['Account', 'Date/Time', 'Amount', 'Type', 'Description', 'Merchant'],
            metadata: ['Status', 'Category', 'Reference ID', 'Location', 'Fraud Score'],
            actions: ['View Details', 'Categorize', 'Flag Fraud', 'Dispute', 'Export']
        },
        loanApplication: {
            name: 'Loan Application',
            extends: 'request',
            coreContent: ['Applicant', 'Loan Type', 'Amount', 'Term', 'Purpose'],
            metadata: ['Status', 'Submission Date', 'Credit Score', 'Risk Rating', 'Underwriter'],
            actions: ['Submit', 'Review', 'Approve', 'Deny', 'Request More Info', 'Counter Offer']
        },
        claim: {
            name: 'Claim',
            extends: 'request',
            coreContent: ['Policy Holder', 'Claim Type', 'Amount', 'Date of Loss', 'Description'],
            metadata: ['Status', 'Filed Date', 'Adjuster', 'Priority', 'Fraud Score'],
            actions: ['Submit', 'Review', 'Approve', 'Deny', 'Request Documentation', 'Investigate']
        },
        payment: {
            name: 'Payment',
            extends: 'transaction',
            coreContent: ['Payer', 'Payee', 'Amount', 'Date', 'Method', 'Status'],
            metadata: ['Confirmation Number', 'Scheduled Date', 'Recurring', 'Currency'],
            actions: ['Schedule', 'Process', 'Cancel', 'Reverse', 'Track Status']
        },
        portfolio: {
            name: 'Portfolio',
            extends: 'profile',
            coreContent: ['Customer', 'Total Value', 'Asset Allocation', 'Performance', 'Risk Profile'],
            metadata: ['Last Rebalance', 'Return YTD', 'Advisor', 'Strategy'],
            actions: ['View Holdings', 'Rebalance', 'Analyze Risk', 'Generate Report', 'Set Goals']
        },
        fraudAlert: {
            name: 'Fraud Alert',
            extends: 'anomaly',
            coreContent: ['Account', 'Transaction', 'Fraud Type', 'Risk Score', 'Description'],
            metadata: ['Detected Date', 'AI Confidence', 'Status', 'Investigator', 'Resolution'],
            actions: ['Review', 'Block Card', 'Contact Customer', 'Close Alert', 'Escalate']
        }
    },

    // Finance-specific workflow examples
    workflowExamples: {
        autoApproval: {
            title: 'Auto-Approve Loan Applications',
            query: 'Auto-approve loan applications under threshold with low risk score',
            entity: 'Loan Application',
            criteria: 'Credit score, debt-to-income ratio, loan amount, employment history, collateral'
        },
        anomalyDetection: {
            title: 'Fraud Detection',
            query: 'Detect fraudulent transactions and flag for review',
            entity: 'Transaction',
            detection: 'Unusual spending patterns, location anomalies, velocity checks, merchant risk'
        },
        intelligentScoring: {
            title: 'Credit Risk Scoring',
            query: 'Score credit applications and route by approval tier',
            entity: 'Loan Application',
            factors: 'Credit history, income stability, debt ratios, market conditions, collateral value'
        },
        predictiveIntelligence: {
            title: 'Credit Risk Forecasting',
            query: 'Forecast credit risk and recommend portfolio adjustments',
            entity: 'Portfolio',
            insights: 'Default probability, market risk, concentration risk, regulatory compliance'
        },
        unifiedView: {
            title: 'Customer 360 View',
            query: 'View customer across accounts, transactions, interactions',
            entity: 'Account',
            systems: 'Banking, Lending, Investments, Cards, Customer Service, CRM'
        },
        naturalLanguageQA: {
            title: 'Banking Assistant',
            query: 'Answer customer questions about accounts, balances, transactions',
            entity: 'Account',
            capabilities: 'Balance inquiries, transaction history, payment scheduling, product info'
        },
        impactAnalysis: {
            title: 'Interest Rate Impact',
            query: 'Analyze impact of interest rate change on portfolio',
            entity: 'Portfolio',
            analysis: 'P&L impact, risk exposure, customer retention, regulatory implications'
        }
    },

    // Terminology mapping (generic → Finance)
    terminology: {
        'entity': 'account',
        'transaction': 'transaction',
        'request': 'application',
        'approval': 'underwriter approval',
        'anomaly': 'fraud alert',
        'profile': 'customer profile'
    }
};

// If this domain is loaded, merge its objects with GENERIC_OBJECTS
if (typeof GENERIC_OBJECTS !== 'undefined') {
    // Add Finance objects while keeping generic ones
    Object.assign(GENERIC_OBJECTS, FINANCE_DOMAIN.objects);
}

console.log('Finance Domain Plugin Loaded');
