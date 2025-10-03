// Risk Explanations for AI Projects
// Provides clear, non-technical explanations of common AI implementation risks

const RISK_EXPLANATIONS = {
    // Data Quality Risks
    'Insufficient training data': {
        explanation: 'AI needs lots of examples to learn from - typically thousands or more. Without enough data, the AI will make poor predictions.',
        impact: 'High',
        mitigation: 'Start collecting data now, even if you can\'t build AI yet. Consider synthetic data generation or transfer learning from similar domains.',
        category: 'Data'
    },
    'Poor data quality': {
        explanation: 'If your training data has errors, is incomplete, or inconsistent, the AI will learn those flaws and make unreliable predictions.',
        impact: 'Critical',
        mitigation: 'Invest in data cleaning and validation before training. Set up data quality monitoring and regular audits.',
        category: 'Data'
    },
    'Biased historical data': {
        explanation: 'If past data reflects unfair biases (like hiring discrimination), the AI will learn and perpetuate those biases in its decisions.',
        impact: 'Critical',
        mitigation: 'Audit data for bias, ensure diverse training examples, implement fairness testing, and add human oversight for sensitive decisions.',
        category: 'Ethics'
    },
    'Data drift over time': {
        explanation: 'As your business changes, old training data becomes less relevant. The AI\'s accuracy will decline if not updated regularly.',
        impact: 'Medium',
        mitigation: 'Monitor AI performance continuously, set up automated alerts for accuracy drops, and retrain models regularly (monthly or quarterly).',
        category: 'Maintenance'
    },
    'Missing edge cases': {
        explanation: 'AI struggles with rare or unusual scenarios it hasn\'t seen before. These edge cases can cause wrong or unpredictable decisions.',
        impact: 'Medium',
        mitigation: 'Collect edge case examples, add human review for low-confidence predictions, and implement safe fallback logic.',
        category: 'Data'
    },

    // Model Performance Risks
    'Model underfitting': {
        explanation: 'The AI is too simple to capture important patterns in your data, leading to poor predictions across the board.',
        impact: 'High',
        mitigation: 'Use more sophisticated AI techniques, add more relevant features, or try different model architectures.',
        category: 'Technical'
    },
    'Model overfitting': {
        explanation: 'The AI memorizes training examples instead of learning general patterns. It performs well in testing but fails on real-world data.',
        impact: 'High',
        mitigation: 'Use more training data, simplify the model, add regularization techniques, or use cross-validation during development.',
        category: 'Technical'
    },
    'Low prediction confidence': {
        explanation: 'AI is uncertain about many of its predictions, meaning you\'ll need human review for most cases - reducing automation benefits.',
        impact: 'Medium',
        mitigation: 'Improve training data quality and quantity, add more relevant features, or adjust confidence thresholds based on risk tolerance.',
        category: 'Performance'
    },
    'High false positive rate': {
        explanation: 'AI incorrectly flags too many legitimate cases as problems (like marking good transactions as fraud). This creates extra work and user frustration.',
        impact: 'Medium',
        mitigation: 'Adjust decision thresholds, improve training data balance, add human review for borderline cases, or use ensemble methods.',
        category: 'Performance'
    },
    'High false negative rate': {
        explanation: 'AI misses too many actual problems (like missing fraudulent transactions). This can lead to financial loss or safety issues.',
        impact: 'High',
        mitigation: 'Adjust decision thresholds to be more sensitive, add additional validation rules, or implement multi-stage screening.',
        category: 'Performance'
    },

    // Integration & Technical Risks
    'Complex integration requirements': {
        explanation: 'Connecting AI to your existing systems may require significant technical work, custom APIs, or data pipeline development.',
        impact: 'Medium',
        mitigation: 'Start with pilot integration, use standard APIs where possible, budget for integration effort, and involve IT early in planning.',
        category: 'Technical'
    },
    'Real-time processing constraints': {
        explanation: 'AI may be too slow to make predictions fast enough for your use case (like needing instant fraud detection on transactions).',
        impact: 'High',
        mitigation: 'Optimize model performance, use faster algorithms, add caching, or implement async processing where acceptable.',
        category: 'Technical'
    },
    'Scalability limitations': {
        explanation: 'The AI system may work fine for current volume but struggle as your business grows, leading to slow performance or failures.',
        impact: 'Medium',
        mitigation: 'Design for scale from the start, use cloud-based services that auto-scale, load test before launch, and monitor performance.',
        category: 'Technical'
    },
    'Infrastructure costs': {
        explanation: 'Running AI in production requires significant computing resources, especially for large models or high volumes. Costs can be surprising.',
        impact: 'Medium',
        mitigation: 'Estimate costs early using cloud calculators, optimize models for efficiency, use spot instances, or consider simpler approaches.',
        category: 'Cost'
    },

    // Operational & Maintenance Risks
    'Model degradation': {
        explanation: 'AI accuracy naturally declines over time as business conditions change, requiring ongoing monitoring and retraining.',
        impact: 'High',
        mitigation: 'Set up automated performance monitoring, establish retraining schedules, and alert on accuracy drops.',
        category: 'Maintenance'
    },
    'Lack of explainability': {
        explanation: 'Complex AI models (like neural networks) can\'t easily explain why they made a decision, making it hard to debug or justify to users.',
        impact: 'Medium',
        mitigation: 'Use explainable AI techniques (SHAP, LIME), document key factors, or use simpler interpretable models for high-stakes decisions.',
        category: 'Governance'
    },
    'Regulatory compliance challenges': {
        explanation: 'AI decisions may need to comply with regulations (like GDPR, fair lending laws) requiring explainability, human review, or bias testing.',
        impact: 'Critical',
        mitigation: 'Involve legal early, document AI logic and training data, implement human review for regulated decisions, and conduct regular audits.',
        category: 'Compliance'
    },
    'Limited ML expertise on team': {
        explanation: 'Building and maintaining AI requires specialized skills. Without ML engineers or data scientists, you may struggle with implementation and troubleshooting.',
        impact: 'High',
        mitigation: 'Hire ML talent, use managed AI services (like AWS SageMaker), partner with consultants, or start with simpler rule-based systems.',
        category: 'Resources'
    },
    'Ongoing maintenance burden': {
        explanation: 'AI isn\'t "set it and forget it" - it needs continuous monitoring, retraining, debugging, and updates as your business evolves.',
        impact: 'Medium',
        mitigation: 'Budget for ongoing ML team support, automate monitoring and retraining where possible, and use MLOps tools.',
        category: 'Maintenance'
    },

    // User Experience & Adoption Risks
    'User distrust of AI decisions': {
        explanation: 'Users may not trust or accept AI recommendations, especially if they don\'t understand how decisions are made or have seen mistakes.',
        impact: 'Medium',
        mitigation: 'Explain AI decisions clearly, show confidence levels, allow human override, start with AI as assistant not decision-maker.',
        category: 'UX'
    },
    'Poor user experience': {
        explanation: 'AI that makes frequent mistakes, lacks explanation, or blocks users can create frustration and reduce adoption.',
        impact: 'Medium',
        mitigation: 'Design with user feedback loops, show AI reasoning, provide easy override, and test UX thoroughly before launch.',
        category: 'UX'
    },
    'Change management challenges': {
        explanation: 'People resist new technology, especially AI making decisions in their domain. Teams may work around the system or refuse to adopt it.',
        impact: 'High',
        mitigation: 'Involve users early in design, communicate benefits clearly, train thoroughly, start with low-risk use cases, and gather feedback.',
        category: 'Adoption'
    },

    // Ethical & Legal Risks
    'Discrimination or bias': {
        explanation: 'AI may make unfair decisions affecting protected groups (race, gender, age), exposing you to legal liability and reputational damage.',
        impact: 'Critical',
        mitigation: 'Test for bias across demographic groups, use diverse training data, implement fairness constraints, add human oversight for sensitive decisions.',
        category: 'Ethics'
    },
    'Privacy concerns': {
        explanation: 'AI may expose sensitive user data, violate privacy regulations, or enable surveillance that erodes user trust.',
        impact: 'High',
        mitigation: 'Minimize data collection, anonymize training data, comply with privacy regulations (GDPR, CCPA), and be transparent about data usage.',
        category: 'Privacy'
    },
    'Lack of accountability': {
        explanation: 'When AI makes mistakes, it\'s unclear who\'s responsible - the developer, the data provider, or the business. This creates legal and ethical issues.',
        impact: 'Medium',
        mitigation: 'Establish clear governance policies, document decision-making processes, maintain human oversight, and define escalation paths.',
        category: 'Governance'
    },
    'Misuse potential': {
        explanation: 'AI built for good purposes could be misused maliciously (like deepfakes, surveillance, or manipulation).',
        impact: 'High',
        mitigation: 'Consider misuse scenarios early, add safeguards and usage monitoring, implement access controls, and establish ethical guidelines.',
        category: 'Ethics'
    },

    // Business & Strategic Risks
    'Unclear ROI': {
        explanation: 'It\'s hard to predict if AI will deliver enough business value to justify the investment in development and maintenance.',
        impact: 'High',
        mitigation: 'Start with small pilot projects, define clear success metrics upfront, and measure business impact continuously.',
        category: 'Business'
    },
    'Overreliance on AI': {
        explanation: 'Humans may stop paying attention and blindly trust AI decisions, missing errors or important context that AI can\'t understand.',
        impact: 'High',
        mitigation: 'Design for human-in-the-loop, require periodic human review, train users to question AI, and maintain manual fallback processes.',
        category: 'Governance'
    },
    'Vendor lock-in': {
        explanation: 'Using proprietary AI services makes it hard and expensive to switch vendors later or bring capabilities in-house.',
        impact: 'Low',
        mitigation: 'Use open standards where possible, maintain data portability, document integrations, and avoid overly customized solutions.',
        category: 'Strategy'
    }
};

// Helper function to get explanation for a risk
function getRiskExplanation(riskText) {
    // Try exact match first
    if (RISK_EXPLANATIONS[riskText]) {
        return RISK_EXPLANATIONS[riskText];
    }

    // Try partial match (case insensitive)
    const lowerRisk = riskText.toLowerCase();
    for (const [key, value] of Object.entries(RISK_EXPLANATIONS)) {
        if (lowerRisk.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerRisk)) {
            return value;
        }
    }

    // Return null if no match found (don't show redundant generic text)
    return null;
}

// Group risks by category
function groupRisksByCategory(risks) {
    const grouped = {};
    risks.forEach(risk => {
        const explanation = getRiskExplanation(risk);
        const category = explanation.category;
        if (!grouped[category]) {
            grouped[category] = [];
        }
        grouped[category].push({
            risk,
            ...explanation
        });
    });
    return grouped;
}
