// Detect relevant objects and patterns from concept text (Generic)
function detectRelevantObjects(text) {
    const lower = text.toLowerCase();
    const relevant = [];
    
    // Pattern-based detection (domain-agnostic)
    
    // Requests & Approvals
    if (lower.includes('request') || lower.includes('application') || lower.includes('submission') || 
        lower.includes('approv') || lower.includes('apply')) {
        relevant.push('request', 'approval', 'entity');
    }
    
    // Transactions & Data
    if (lower.includes('transaction') || lower.includes('entry') || lower.includes('record') || 
        lower.includes('data') || lower.includes('process')) {
        relevant.push('transaction', 'entity');
    }
    
    // Anomalies & Issues
    if (lower.includes('anomal') || lower.includes('error') || lower.includes('flag') || 
        lower.includes('detect') || lower.includes('issue') || lower.includes('missing')) {
        relevant.push('anomaly', 'transaction');
    }
    
    // Scheduling & Resources
    if (lower.includes('schedul') || lower.includes('allocat') || lower.includes('resource') ||
        lower.includes('assign') || lower.includes('plan') || lower.includes('shift')) {
        relevant.push('schedule', 'entity');
    }

    // Time & Attendance specific
    if (lower.includes('clock') || lower.includes('punch') || lower.includes('reminder')) {
        relevant.push('clockEvent', 'schedule', 'entity');
    }

    if (lower.includes('shift') && (lower.includes('swap') || lower.includes('match'))) {
        relevant.push('shiftSwapRequest', 'shift', 'schedule', 'entity');
    }

    if (lower.includes('pto') && (lower.includes('balance') || lower.includes('accru') || lower.includes('forecast'))) {
        relevant.push('ptoBalance', 'ptoRequest', 'entity');
    }

    if (lower.includes('timecard') && (lower.includes('acknowledge') || lower.includes('review') || lower.includes('unusual'))) {
        relevant.push('timeEntry', 'entity', 'anomaly');
    }
    
    // Intelligence & Insights
    if (lower.includes('intelligent') || lower.includes('insight') || lower.includes('predict') || 
        lower.includes('vantage') || lower.includes('unified') || lower.includes('dashboard')) {
        relevant.push('intelligenceHub', 'profile', 'insight');
    }
    
    // Cross-system workflows
    if (lower.includes('cross-domain') || lower.includes('workflow') || lower.includes('orchestrat') || 
        lower.includes('multi-system') || lower.includes('process')) {
        relevant.push('workflow', 'approval');
    }
    
    // Search & Discovery
    if (lower.includes('search') || lower.includes('find') || lower.includes('discover') || 
        lower.includes('lookup') || lower.includes('query')) {
        relevant.push('intelligenceHub', 'profile');
    }
    
    // Questions & Chat
    if (lower.includes('question') || lower.includes('ask') || lower.includes('chat') || 
        lower.includes('conversational')) {
        relevant.push('intelligenceHub');
    }
    
    return [...new Set(relevant)];
}

// Detect which workflow pattern applies
function detectWorkflowPattern(text) {
    const lower = text.toLowerCase();
    
    // Check each pattern's trigger keywords
    for (const [key, pattern] of Object.entries(WORKFLOW_PATTERNS)) {
        const matches = pattern.triggerKeywords.some(keyword => lower.includes(keyword));
        if (matches) {
            return key;
        }
    }
    
    return 'generic'; // Fallback to generic pattern
}