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
            description: 'Employee record across all HR systems',
            coreContent: ['Name', 'Employee ID', 'Department', 'Job Title', 'Manager'],
            metadata: ['Hire Date', 'Status', 'Location', 'Employment Type'],
            actions: ['View Profile', 'Edit Details', 'View History', 'Assign Manager'],
            relationships: [
                { type: 'has-many', target: 'timeEntry', description: 'Employee has time entries' },
                { type: 'has-many', target: 'ptoRequest', description: 'Employee has PTO requests' },
                { type: 'belongs-to', target: 'department', description: 'Employee belongs to department' },
                { type: 'reports-to', target: 'employee', description: 'Employee reports to manager' }
            ]
        },
        timeEntry: {
            name: 'Time Entry',
            extends: 'transaction',
            description: 'Employee time tracking record',
            coreContent: ['Employee', 'Date', 'Hours', 'Project/Task'],
            metadata: ['Status', 'Submission Time', 'Approver', 'Cost Center'],
            actions: ['Submit', 'Edit', 'Approve', 'Reject', 'Flag Anomaly'],
            relationships: [
                { type: 'belongs-to', target: 'employee', description: 'Time entry belongs to employee' }
            ]
        },
        ptoRequest: {
            name: 'PTO Request',
            extends: 'request',
            description: 'Employee time-off request',
            coreContent: ['Requestor', 'Date Range', 'PTO Type', 'Hours/Days'],
            metadata: ['Status', 'Submission Date', 'Approver', 'Balance Impact'],
            actions: ['Submit', 'Approve', 'Deny', 'Modify', 'Cancel'],
            relationships: [
                { type: 'belongs-to', target: 'employee', description: 'Request belongs to employee' }
            ]
        },
        payrollRun: {
            name: 'Payroll Run',
            extends: 'transaction',
            description: 'Payroll processing batch',
            coreContent: ['Pay Period', 'Employee Count', 'Total Amount', 'Status'],
            metadata: ['Run Date', 'Processor', 'Bank File Status'],
            actions: ['Preview', 'Validate', 'Flag Issues', 'Approve', 'Process'],
            relationships: [
                { type: 'has-many', target: 'timeEntry', description: 'Payroll run includes time entries' }
            ]
        },
        employeeProfile: {
            name: 'Employee Profile',
            extends: 'profile',
            description: 'Unified employee view across Time, Payroll, Benefits, Performance, and Learning systems',
            coreContent: ['Employee ID', 'Core Info', 'System Data', 'Activity Timeline', 'Health Score'],
            metadata: ['Last Updated', 'Data Completeness', 'Turnover Risk', 'Performance Trend'],
            actions: ['View Details', 'See Time History', 'Track Performance', 'Export Report', 'Analyze Trends'],
            relationships: [
                { type: 'belongs-to', target: 'employee', description: 'Profile represents employee' },
                { type: 'has-many', target: 'timeEntry', description: 'Profile shows time history' },
                { type: 'has-many', target: 'hrInsight', description: 'Profile includes AI insights' }
            ]
        },
        hrInsight: {
            name: 'HR Insight',
            extends: 'insight',
            description: 'AI-generated insight about employee health, turnover risk, or workforce trends',
            coreContent: ['Type', 'Severity', 'Employee/Team', 'Recommendation'],
            metadata: ['Generated Date', 'AI Confidence', 'Category', 'Status'],
            actions: ['Review', 'Take Action', 'Dismiss', 'Share with Manager', 'Track Outcome'],
            relationships: [
                { type: 'relates-to', target: 'employee', description: 'Insight about employee' },
                { type: 'belongs-to', target: 'employeeProfile', description: 'Insight shown in profile' }
            ]
        },
        department: {
            name: 'Department',
            description: 'Organizational unit or team',
            coreContent: ['Name', 'Department Code', 'Manager', 'Cost Center'],
            metadata: ['Created Date', 'Status', 'Location', 'Budget'],
            actions: ['View Team', 'See Org Chart', 'View Metrics', 'Export'],
            relationships: [
                { type: 'has-many', target: 'employee', description: 'Department has employees' }
            ]
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