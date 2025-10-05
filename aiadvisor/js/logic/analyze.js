// Main Analysis Function
// Determines AI type, interaction model, and generates complete analysis

function analyzeProject(concept, industry = 'generic', templateSlug = null) {
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
    const oouxWorkflow = generateWorkflow(concept, detectedPattern, relevantObjects, industry, templateSlug);

    // Generate User Research & Validation guidance
    const userResearch = {
        testingApproach: visibility === 'co-pilot'
            ? 'Wizard of Oz testing - simulate AI responses with humans to validate interaction patterns before building'
            : 'A/B test AI vs. manual workflow to measure impact on task completion and user satisfaction',
        validationQuestions: [
            'Does the AI actually solve a real user pain point, or is it a solution looking for a problem?',
            'Can users understand what the AI is doing and why?',
            'Do users trust the AI recommendations enough to act on them?',
            visibility === 'co-pilot'
                ? 'Is the back-and-forth with AI helpful or frustrating for users?'
                : 'Do users feel in control even when AI is making decisions?'
        ],
        successMetrics: [
            'Task completion rate with vs. without AI assistance',
            'Time to complete task (faster isn\'t always better if trust decreases)',
            'User confidence in decisions made with AI help',
            'Error rate - are users making fewer mistakes with AI?',
            'Adoption rate - what % of users actually use the AI feature?'
        ]
    };

    // Generate Ethical & Bias considerations
    const ethical = {
        biasRisks: aiType.includes('LLM')
            ? [
                'LLMs can perpetuate biases from training data - particularly around gender, race, and cultural assumptions',
                'Prompt engineering choices can introduce unintended bias',
                'May favor certain communication styles over others (formal vs. casual, verbose vs. concise)'
              ]
            : [
                'Training data may not represent all user segments equally',
                'Historical patterns can encode past discrimination (e.g., biased hiring or lending decisions)',
                'Model may perform worse for underrepresented groups'
              ],
        fairnessConsiderations: [
            'Who benefits from this AI automation, and who might be harmed?',
            'Are we applying the same standards and thresholds across all user groups?',
            'How do we ensure the AI doesn\'t discriminate based on protected characteristics?',
            visibility === 'backstage'
                ? 'Users can\'t see AI decisions - how do we audit for fairness?'
                : 'How do we explain AI reasoning in a way that reveals potential bias?'
        ],
        transparency: [
            'Be explicit when AI is making or influencing decisions',
            'Provide clear explanation of how AI reached its conclusion',
            'Show confidence levels so users can calibrate trust appropriately',
            'Maintain audit logs of AI decisions for accountability'
        ]
    };

    // Generate Error & Edge Case guidance
    const errorHandling = {
        lowConfidenceScenarios: [
            `When AI confidence < 70%: Flag for human review rather than auto-processing`,
            `When AI confidence 70-85%: Show AI suggestion but make human approval required`,
            `When AI confidence > 85%: ${visibility === 'backstage' ? 'Can auto-process but log for monitoring' : 'Present as primary recommendation'}`,
            'Always show confidence score to users so they can calibrate trust'
        ],
        edgeCases: [
            'Missing or incomplete input data - how does AI handle gaps?',
            'Data that contradicts AI training patterns - outliers and exceptions',
            lower.includes('fraud') || lower.includes('risk')
                ? 'False positives - how do we minimize incorrectly flagging legitimate users?'
                : 'Ambiguous requests that could have multiple valid interpretations',
            aiType.includes('LLM')
                ? 'Hallucinations - AI generating plausible but incorrect information'
                : 'Model drift - AI accuracy degrading as patterns change over time'
        ],
        failureRecovery: [
            'Human override: Always allow users to reject or modify AI decisions',
            'Graceful degradation: If AI service is down, fall back to manual workflow',
            'Clear error messages: Tell users what went wrong and what to do next',
            'Escalation path: Route complex cases to human experts when AI is uncertain',
            'Learn from failures: Track when users override AI to improve the model'
        ]
    };

    // Generate Accessibility guidance
    const accessibility = {
        screenReaders: [
            'AI-generated content must have proper ARIA labels and semantic HTML',
            'Confidence scores should be announced (e.g., "AI suggestion, 85% confidence")',
            'Loading states: Announce when AI is processing vs. when results are ready',
            'Dynamic updates: Use ARIA live regions when AI updates content in real-time'
        ],
        alternativeInteractions: [
            'Keyboard navigation: All AI features must work without a mouse',
            'Voice input: Consider voice alternatives for text-based AI interactions',
            visibility === 'co-pilot'
                ? 'Provide text alternatives for visual AI outputs (charts, diagrams, etc.)'
                : 'Ensure AI results are consumable in multiple formats',
            'Opt-out option: Some users may not want AI assistance - provide manual alternatives'
        ],
        cognitiveAccessibility: [
            'Use plain language - avoid technical jargon when explaining AI decisions',
            'Progressive disclosure - don\'t overwhelm users with all AI details at once',
            'Consistent patterns - AI interactions should follow familiar UI patterns',
            'Clear causality - help users understand cause-effect of AI recommendations'
        ],
        inclusiveDesign: [
            'Test with users of diverse abilities - cognitive, visual, motor, auditory',
            'Consider low-literacy users - AI explanations should be understandable to all',
            'Account for cognitive load - AI should reduce mental effort, not increase it',
            'Respect user preferences - remember and honor accessibility settings'
        ]
    };

    // Generate AI Confidence Scoring guidance
    const confidenceScoring = {
        whatIsConfidence: 'AI confidence scores indicate how certain the model is about its prediction or recommendation. A score of 95% means the AI is very confident, while 50% means it\'s essentially guessing.',
        whenToShow: [
            `Always show confidence for ${visibility === 'co-pilot' ? 'recommendations and suggestions' : 'automated decisions that affect users'}`,
            'Surface confidence prominently when asking users to take action',
            'Use visual indicators (colors, icons) in addition to percentages',
            'Provide context: "95% confident based on 500 similar cases"'
        ],
        howToDisplay: [
            'Low confidence (< 70%): Red/warning - "AI is uncertain, human review required"',
            'Medium confidence (70-85%): Yellow/caution - "AI suggests X, please verify"',
            'High confidence (> 85%): Green/success - "AI recommends X with high confidence"',
            'Show not just the score, but what it means for the user\'s decision'
        ],
        actionableGuidance: [
            'Low confidence: Route to human expert, don\'t auto-process',
            'Medium confidence: Show AI suggestion but require human confirmation',
            'High confidence: ' + (visibility === 'backstage'
                ? 'Can auto-process but maintain audit trail'
                : 'Present as primary option with ability to explore alternatives'),
            'Confidence bands: Define thresholds based on business risk tolerance',
            'Explain why confidence is low: "Missing data about X" or "Unusual pattern detected"'
        ],
        calibration: [
            'Monitor accuracy vs. confidence - is a 90% confident prediction actually right 90% of the time?',
            'Adjust thresholds based on real-world performance data',
            'Consider cost of errors: False positive vs. false negative implications',
            'Update confidence thresholds as the model improves over time'
        ]
    };

    // Generate Executive Summary
    const executiveSummary = {
        whatItDoes: visibility === 'co-pilot'
            ? `An AI assistant that helps ${concept.toLowerCase()}, working alongside users to suggest actions and provide insights`
            : `An AI system that helps ${concept.toLowerCase()}, working behind the scenes to automate decisions and surface results`,
        primaryBenefit: visibility === 'co-pilot'
            ? 'Augments human decision-making with AI suggestions, reducing cognitive load while maintaining user control'
            : lower.includes('auto') && lower.includes('approv')
                ? 'Automates routine approvals, freeing up time for complex cases requiring human judgment'
                : lower.includes('detect') || lower.includes('fraud') || lower.includes('anomal')
                    ? 'Catches errors and anomalies in real-time before they become costly problems'
                    : lower.includes('predict') || lower.includes('forecast')
                        ? 'Provides early warnings and predictions to enable proactive decision-making'
                        : lower.includes('360') || lower.includes('unified')
                            ? 'Consolidates fragmented data into a single intelligent view, eliminating system-hopping'
                            : 'Reduces manual effort and increases accuracy through intelligent automation',
        biggestRisk: aiType.includes('LLM')
            ? 'AI hallucinations could generate plausible but incorrect information - requires human review for critical decisions'
            : visibility === 'co-pilot'
                ? 'Users may over-rely on AI suggestions without applying critical thinking - need to show confidence levels and encourage verification'
                : lower.includes('fraud') || lower.includes('detect')
                    ? 'False positives could flag legitimate activity - need careful threshold tuning and easy override paths'
                    : lower.includes('auto') && lower.includes('approv')
                        ? 'Errors in automated decisions could have significant impact - require audit trails and human escalation for edge cases'
                        : 'Model accuracy may degrade over time as patterns change - establish monitoring and retraining schedules',
        nextStep: 'Review the recommended design principles below, then work with your team to validate this approach with real users before building'
    };

    // Generate Action Plan
    const actionPlan = [
        {
            step: 1,
            action: `Review the ${recommended.length} recommended design principles`,
            detail: 'These principles will guide your UX and technical decisions'
        },
        {
            step: 2,
            action: aiType.includes('LLM')
                ? 'Choose your LLM provider and set up prompt engineering infrastructure'
                : `Set up ${aiType} model training pipeline and data collection`,
            detail: 'Critical infrastructure decisions should happen early'
        },
        {
            step: 3,
            action: visibility === 'co-pilot'
                ? 'Conduct Wizard of Oz testing to validate the AI interaction patterns'
                : 'Run A/B tests comparing AI-assisted vs. manual workflows',
            detail: 'Validate your approach with real users before full development'
        },
        {
            step: 4,
            action: `Address the ${risks.length} identified risks in your design and implementation plan`,
            detail: 'Each risk has a suggested mitigation strategy - incorporate these early'
        },
        {
            step: 5,
            action: 'Define success metrics and establish monitoring dashboards',
            detail: 'Track AI accuracy, user adoption, and business impact from day one'
        }
    ];

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
        detectedPattern: WORKFLOW_PATTERNS[detectedPattern]?.name || 'Generic Workflow',
        userResearch,
        ethical,
        errorHandling,
        accessibility,
        confidenceScoring,
        executiveSummary,
        actionPlan
    };

    // Calculate complexity score
    result.complexity = calculateComplexity(concept, result);

    return result;
}