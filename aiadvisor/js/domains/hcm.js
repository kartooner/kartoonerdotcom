// HCM Domain Plugin (Optional)
// Load this file to add HCM-specific terminology and examples

const HCM_DOMAIN = {
    name: 'Human Capital Management',
    description: 'Workforce management, time tracking, payroll, benefits',
    
    // HCM-specific objects that extend generic ones
    objects: {
        employee: {
            name: 'Employee',
            extends: 'entity',
            coreContent: ['Name', 'Employee ID', 'Department', 'Job Title', 'Manager'],
            metadata: ['Hire Date', 'Status', 'Location', 'Employment Type'],
            actions: ['View Profile', 'Edit Details', 'View History', 'Assign Manager']
        },
        timeEntry: {
            name: 'Time Entry',
            extends: 'transaction',
            coreContent: ['Employee', 'Date', 'Hours', 'Project/Task'],
            metadata: ['Status', 'Submission Time', 'Approver', 'Cost Center'],
            actions: ['Submit', 'Edit', 'Approve', 'Reject', 'Flag Anomaly']
        },
        ptoRequest: {
            name: 'PTO Request',
            extends: 'request',
            coreContent: ['Requestor', 'Date Range', 'PTO Type', 'Hours/Days'],
            metadata: ['Status', 'Submission Date', 'Approver', 'Balance Impact'],
            actions: ['Submit', 'Approve', 'Deny', 'Modify', 'Cancel']
        },
        payrollRun: {
            name: 'Payroll Run',
            extends: 'transaction',
            coreContent: ['Pay Period', 'Employee Count', 'Total Amount', 'Status'],
            metadata: ['Run Date', 'Processor', 'Bank File Status'],
            actions: ['Preview', 'Validate', 'Flag Issues', 'Approve', 'Process']
        }
    },
    
    // HCM-specific workflow examples
    workflowExamples: {
        autoApproval: {
            title: 'Auto-Approve PTO Requests',
            query: 'As an admin I want to auto-approve PTO requests with team coverage validation',
            entity: 'PTO Request',
            criteria: 'Balance check, blackout dates, team coverage, business impact'
        },
        anomalyDetection: {
            title: 'Missing Punch Detection',
            query: 'Detect missing time punches and suggest fixes based on employee schedule',
            entity: 'Time Entry',
            detection: 'Compare clock in/out patterns to expected schedule'
        },
        intelligentScoring: {
            title: 'Timecard Scoring',
            query: 'Score timecards for anomalies and route by risk threshold',
            entity: 'Time Entry',
            factors: 'Time variance, overtime, policy violations, pattern breaks'
        },
        unifiedView: {
            title: 'Employee 360 View',
            query: 'As an admin I want a unified intelligent view of an employee across all systems',
            entity: 'Employee',
            systems: 'Time, Payroll, Benefits, Performance, Learning'
        }
    },
    
    // Terminology mapping (generic → HCM)
    terminology: {
        'entity': 'employee',
        'transaction': 'time entry',
        'request': 'PTO request',
        'approval': 'manager approval',
        'schedule': 'work schedule'
    }
};

// If this domain is loaded, merge its objects with GENERIC_OBJECTS
if (typeof GENERIC_OBJECTS !== 'undefined') {
    // Add HCM objects while keeping generic ones
    Object.assign(GENERIC_OBJECTS, HCM_DOMAIN.objects);
}

console.log('HCM Domain Plugin Loaded');