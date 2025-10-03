// Main Analysis Function
// Determines AI type, interaction model, and generates complete analysis

function analyzeProject(concept, industry = 'generic') {
    const lower = concept.toLowerCase();

    // Determine AI Type (expanded beyond just ML/LLM)
    let aiType = 'Traditional ML';
    let aiTypeReason = 'Pattern recognition and classification from structured data';

    // LLM for natural language tasks
    if (lower.includes('chat') || lower.includes('conversation') || lower.includes('question') ||
        lower.includes('answer') || lower.includes('natural language') || lower.includes('explain text') ||
        lower.includes('generate text') || lower.includes('write') || lower.includes('summariz')) {
        aiType = 'LLM (Large Language Model)';
        aiTypeReason = 'Natural language understanding and generation needed';
    }
    // Computer Vision
    else if (lower.includes('image') || lower.includes('photo') || lower.includes('visual') ||
        lower.includes('video') || lower.includes('recognize') || lower.includes('detect face') ||
        lower.includes('ocr') || lower.includes('scan')) {
        aiType = 'Computer Vision';
        aiTypeReason = 'Visual pattern recognition and image analysis required';
    }
    // Time Series / Forecasting
    else if (lower.includes('forecast') || lower.includes('predict') || lower.includes('trend') ||
        lower.includes('time series') || lower.includes('seasonal')) {
        aiType = 'Time Series ML';
        aiTypeReason = 'Temporal pattern analysis and forecasting needed';
    }
    // Anomaly Detection specific
    else if (lower.includes('anomal') || lower.includes('outlier') || lower.includes('unusual') ||
        lower.includes('fraud')) {
        aiType = 'Anomaly Detection ML';
        aiTypeReason = 'Statistical deviation detection from normal patterns';
    }
    // Recommendation Systems
    else if (lower.includes('recommend') || lower.includes('suggest') || lower.includes('personalize') ||
        lower.includes('similar')) {
        aiType = 'Recommendation ML';
        aiTypeReason = 'Collaborative filtering and preference learning';
    }
    // Rule-based AI (simpler)
    else if (lower.includes('rule') || lower.includes('policy') || lower.includes('threshold') ||
        (lower.includes('auto') && lower.includes('approve'))) {
        aiType = 'Rule-Based AI + ML';
        aiTypeReason = 'Combines business rules with machine learning for decisions';
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

    if (aiType.includes('LLM') || visibility === 'co-pilot') {
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

    if (aiType.includes('LLM')) {
        technical.push('Consider prompt engineering and context management');
        technical.push('Implement rate limiting and cost controls');
        technical.push('Plan for response streaming for better UX');
        technical.push('Design fallback responses for failures');
    } else if (aiType.includes('Computer Vision')) {
        technical.push('Define image quality requirements and preprocessing needs');
        technical.push('Plan for model versioning and A/B testing visual models');
        technical.push('Consider edge cases (lighting, angles, obstructions)');
        technical.push('Implement confidence thresholds for human review');
    } else if (aiType.includes('Time Series')) {
        technical.push('Establish data collection frequency and granularity');
        technical.push('Account for seasonality and external factors');
        technical.push('Plan for model retraining as patterns evolve');
        technical.push('Define forecast horizon and confidence intervals');
    } else if (aiType.includes('Anomaly Detection')) {
        technical.push('Tune sensitivity to balance false positives vs missed anomalies');
        technical.push('Establish baseline "normal" behavior profiles');
        technical.push('Plan for adapting to legitimate pattern changes');
        technical.push('Design escalation paths for different anomaly severities');
    } else if (aiType.includes('Recommendation')) {
        technical.push('Handle cold start problem for new users/items');
        technical.push('Balance personalization with diversity and serendipity');
        technical.push('Implement feedback loops to improve recommendations');
        technical.push('Consider privacy implications of user profiling');
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

    if (aiType.includes('LLM')) {
        risks.push(
            { risk: 'Hallucinations or incorrect information', mitigation: 'Always require human review for critical decisions; show sources' },
            { risk: 'Unpredictable outputs and edge cases', mitigation: 'Extensive testing with diverse inputs; clear fallback messaging' },
            { risk: 'Cost and latency concerns', mitigation: 'Set usage limits; implement caching; optimize prompts' }
        );
    } else if (aiType.includes('Computer Vision')) {
        risks.push(
            { risk: 'Poor performance in varied conditions (lighting, angles)', mitigation: 'Train on diverse image sets; provide guidance for optimal capture' },
            { risk: 'Privacy concerns with image/video processing', mitigation: 'Implement data retention policies; anonymize where possible; get consent' },
            { risk: 'Bias in facial or object recognition', mitigation: 'Test across diverse populations; audit for fairness; allow manual override' }
        );
    } else if (aiType.includes('Time Series') || aiType.includes('Recommendation') || aiType.includes('Anomaly')) {
        risks.push(
            { risk: 'Model accuracy degrades over time', mitigation: 'Monitor performance metrics; establish retraining schedule' },
            { risk: 'Bias in training data', mitigation: 'Audit training data; test across diverse scenarios; allow user feedback' }
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
    const oouxWorkflow = generateWorkflow(concept, detectedPattern, relevantObjects, industry);

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