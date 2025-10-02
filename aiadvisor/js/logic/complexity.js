// Complexity Scoring System
// Calculates implementation complexity based on multiple factors

function calculateComplexity(concept, analysis) {
    let score = 0;
    let factors = [];

    const lower = concept.toLowerCase();

    // Factor 1: AI Type (20 points max)
    if (analysis.aiType === 'LLM') {
        score += 15;
        factors.push({ factor: 'LLM Implementation', impact: 'High', points: 15 });
    } else {
        score += 8;
        factors.push({ factor: 'ML Implementation', impact: 'Medium', points: 8 });
    }

    // Factor 2: User Interaction Model (15 points max)
    if (analysis.visibility === 'co-pilot') {
        score += 12;
        factors.push({ factor: 'Co-Pilot UI/UX', impact: 'High', points: 12 });
    } else {
        score += 6;
        factors.push({ factor: 'Backstage Processing', impact: 'Medium', points: 6 });
    }

    // Factor 3: Cross-System Integration (15 points max)
    if (lower.includes('unified') || lower.includes('cross-domain') || lower.includes('360') ||
        lower.includes('across all') || lower.includes('multi-system')) {
        score += 15;
        factors.push({ factor: 'Cross-System Integration', impact: 'High', points: 15 });
    } else if (lower.includes('across') || lower.includes('multiple')) {
        score += 8;
        factors.push({ factor: 'Multi-Source Data', impact: 'Medium', points: 8 });
    }

    // Factor 4: Real-time Requirements (15 points max)
    if (lower.includes('real-time') || lower.includes('instant') || lower.includes('immediate')) {
        score += 15;
        factors.push({ factor: 'Real-Time Processing', impact: 'High', points: 15 });
    } else if (lower.includes('monitor') || lower.includes('detect') || lower.includes('alert')) {
        score += 8;
        factors.push({ factor: 'Continuous Monitoring', impact: 'Medium', points: 8 });
    }

    // Factor 5: Workflow Complexity (15 points max)
    const workflowSteps = analysis.oouxWorkflow?.flow?.length || 0;
    if (workflowSteps > 8) {
        score += 15;
        factors.push({ factor: `Complex Workflow (${workflowSteps} steps)`, impact: 'High', points: 15 });
    } else if (workflowSteps > 5) {
        score += 10;
        factors.push({ factor: `Multi-Step Workflow (${workflowSteps} steps)`, impact: 'Medium', points: 10 });
    } else if (workflowSteps > 0) {
        score += 5;
        factors.push({ factor: `Simple Workflow (${workflowSteps} steps)`, impact: 'Low', points: 5 });
    }

    // Factor 6: Data Volume (10 points max)
    if (lower.includes('all') || lower.includes('every') || lower.includes('entire')) {
        score += 10;
        factors.push({ factor: 'High Data Volume', impact: 'High', points: 10 });
    } else if (lower.includes('historical') || lower.includes('past')) {
        score += 6;
        factors.push({ factor: 'Historical Data Analysis', impact: 'Medium', points: 6 });
    }

    // Factor 7: Predictive/Advanced Features (10 points max)
    if (lower.includes('predict') || lower.includes('forecast') || lower.includes('recommend')) {
        score += 10;
        factors.push({ factor: 'Predictive Analytics', impact: 'High', points: 10 });
    }

    // Factor 8: Number of Risks (max 10 points based on risk count)
    const riskCount = analysis.risks?.length || 0;
    const riskPoints = Math.min(riskCount * 2, 10);
    if (riskPoints > 0) {
        score += riskPoints;
        factors.push({ factor: `${riskCount} Risk Factors`, impact: riskCount > 4 ? 'High' : 'Medium', points: riskPoints });
    }

    // Normalize to 100 scale
    const maxPossibleScore = 110; // Theoretical max if all factors apply
    const normalizedScore = Math.min(Math.round((score / maxPossibleScore) * 100), 100);

    // Determine complexity level and effort estimate
    let level, effort, description;
    if (normalizedScore <= 30) {
        level = 'Low';
        effort = '2-4 weeks';
        description = 'Straightforward implementation with standard patterns';
    } else if (normalizedScore <= 60) {
        level = 'Medium';
        effort = '1-3 months';
        description = 'Moderate complexity requiring careful design and testing';
    } else {
        level = 'High';
        effort = '3-6 months';
        description = 'Complex project requiring significant planning and resources';
    }

    return {
        score: normalizedScore,
        level,
        effort,
        description,
        factors: factors.sort((a, b) => b.points - a.points) // Sort by impact
    };
}
