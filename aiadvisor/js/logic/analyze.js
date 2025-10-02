// Main Analysis Function
// Determines AI type, interaction model, and generates complete analysis

function analyzeProject(concept, industry = 'generic') {
    const lower = concept.toLowerCase();
    
    // Determine AI Type
    let aiType = 'ML';
    let aiTypeReason = 'Pattern recognition and classification';
    
    if (lower.includes('chat') || lower.includes('conversation') || lower.includes('question') || 
        lower.includes('answer') || lower.includes('natural language') || lower.includes('explain text') ||
        lower.includes('generate text') || lower.includes('write') || lower.includes('summariz')) {
        aiType = 'LLM';
        aiTypeReason = 'Natural language understanding and generation needed';
    }

    // Determine User Interaction Model
    let visibility = 'backstage';
    let visibilityReason = 'AI works behind scenes, surfaces results';
    
    if (lower.includes('chat') || lower.includes('assistant') || lower.includes('copilot') || 
        lower.includes('conversational') || lower.includes('explore') || lower.includes('dashboard') || 
        lower.includes('view') || lower.includes('ask') ||
        (lower.includes('intelligent') && (lower.includes('vantage') || lower.includes('hub')))) {
        visibility = 'co-pilot';
        visibilityReason = 'Direct user interaction and collaboration';
    }

    // Recommend Design Principles
    const recommended = ['control-choice', 'trust-clarity'];
    
    if (aiType === 'LLM' || visibility === 'co-pilot') {
        recommended.push('uncertainty', 'clear-limits');
    }
    if (lower.includes('history') || lower.includes('track') || lower.includes('version')) {
        recommended.push('history');
    }
    if (lower.includes('explore') || lower.includes('option') || lower.includes('compare')) {
        recommended.push('exploration');
    }
    if (lower.includes('complex') || lower.includes('workflow') || lower.includes('process')) {
        recommended.push('flexible-flow');
    }
    if (lower.includes('error') || lower.includes('mistake') || lower.includes('fix')) {
        recommended.push('errors');
    }
    if (lower.includes('remember') || lower.includes('learn') || lower.includes('personalize')) {
        recommended.push('memory');
    }

    // Generate Baseline Workflow Description
    const workflow = visibility === 'backstage' ? [
        'Input → AI processes → Surface results',
        'Add confidence scores where relevant',
        'Let users accept/reject AI suggestions',
        'Log actions for audit trail'
    ] : [
        'User initiates → AI suggests → User refines',
        'Show AI reasoning inline',
        'Provide alternatives when possible',
        'Allow iterative back-and-forth',
        'Save interaction history'
    ];

    // Generate Technical Considerations
    const technical = [];
    
    if (aiType === 'LLM') {
        technical.push('Consider prompt engineering and context management');
        technical.push('Implement rate limiting and cost controls');
        technical.push('Plan for response streaming for better UX');
        technical.push('Design fallback responses for failures');
    } else {
        technical.push('Define training data requirements and quality metrics');
        technical.push('Set confidence thresholds for auto-action vs flagging');
        technical.push('Plan model retraining cadence');
        technical.push('Monitor for data drift');
    }
    
    technical.push('Build telemetry to track AI accuracy and user corrections');
    technical.push('Design graceful degradation when AI is unavailable');

    // Generate Trust Cues
    const trustCues = [
        'Show confidence levels (e.g., "High confidence", "Uncertain")',
        'Explain why AI made this suggestion',
        'Highlight what data AI used in its decision',
        'Make it easy to undo or override AI actions',
        'Show when human review is recommended'
    ];

    // Generate Risks & Mitigations
    const risks = [];
    
    if (aiType === 'LLM') {
        risks.push(
            { risk: 'Hallucinations or incorrect information', mitigation: 'Always require human review for critical decisions; show sources' },
            { risk: 'Unpredictable outputs and edge cases', mitigation: 'Extensive testing with diverse inputs; clear fallback messaging' },
            { risk: 'Cost and latency concerns', mitigation: 'Set usage limits; implement caching; optimize prompts' }
        );
    } else {
        risks.push(
            { risk: 'Model accuracy degrades over time', mitigation: 'Monitor performance metrics; establish retraining schedule' },
            { risk: 'Bias in training data', mitigation: 'Audit training data; test across diverse scenarios; allow user feedback' }
        );
    }
    
    if (visibility === 'co-pilot') {
        risks.push(
            { risk: 'Users may over-rely on AI suggestions', mitigation: 'Show confidence levels; encourage critical thinking; make override easy' },
            { risk: 'Learning curve for new interaction patterns', mitigation: 'Provide onboarding; use familiar UI patterns; offer help' }
        );
    } else {
        risks.push(
            { risk: 'Users may not notice when AI is wrong', mitigation: 'Surface AI decisions clearly; add review step for critical actions' },
            { risk: 'False positives create alert fatigue', mitigation: 'Tune thresholds carefully; let users adjust sensitivity' }
        );
    }
    
    risks.push({ risk: 'Privacy and data security concerns', mitigation: 'Document what data AI accesses; ensure compliance; provide transparency' });
    
    if (lower.includes('approval') || lower.includes('decision') || lower.includes('financial')) {
        risks.push({ risk: 'High stakes: errors could have significant impact', mitigation: 'Require human approval for high-value actions; extensive logging' });
    }

    // Generate Examples
    const examples = [];
    const pattern = detectWorkflowPattern(concept);
    if (WORKFLOW_PATTERNS[pattern]) {
        const patternExamples = WORKFLOW_PATTERNS[pattern].examples;
        if (patternExamples) {
            // Show selected industry first if not generic
            if (industry !== 'generic' && patternExamples[industry]) {
                examples.push({
                    area: industry.toUpperCase() + ' Example',
                    use: patternExamples[industry],
                    type: aiType
                });
            }

            // Always show generic example
            examples.push({
                area: 'Generic Example',
                use: patternExamples.generic,
                type: aiType
            });

            // Show other industries if generic is selected
            if (industry === 'generic') {
                if (patternExamples.hcm) {
                    examples.push({
                        area: 'HCM Example',
                        use: patternExamples.hcm,
                        type: aiType
                    });
                }
                if (patternExamples.finance) {
                    examples.push({
                        area: 'Finance Example',
                        use: patternExamples.finance,
                        type: aiType
                    });
                }
                if (patternExamples.healthcare) {
                    examples.push({
                        area: 'Healthcare Example',
                        use: patternExamples.healthcare,
                        type: aiType
                    });
                }
                if (patternExamples.retail) {
                    examples.push({
                        area: 'Retail Example',
                        use: patternExamples.retail,
                        type: aiType
                    });
                }
            }
        }
    }

    // Detect Objects and Pattern
    const relevantObjects = detectRelevantObjects(concept);
    const detectedPattern = detectWorkflowPattern(concept);

    // Generate OOUX Workflow
    const oouxWorkflow = generateWorkflow(concept, detectedPattern, relevantObjects);

    // Create initial result
    const result = {
        aiType,
        aiTypeReason,
        visibility,
        visibilityReason,
        recommended,
        workflow,
        technical,
        trustCues,
        risks,
        examples,
        oouxWorkflow,
        detectedPattern: WORKFLOW_PATTERNS[detectedPattern]?.name || 'Generic Workflow'
    };

    // Calculate complexity score
    result.complexity = calculateComplexity(concept, result);

    return result;
}