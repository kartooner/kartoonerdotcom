// AI Decision Framework - "Should we use AI here?"
// Helps product designers and PMs determine if AI is the right solution

const AI_DECISION_FRAMEWORK = {
    // Core evaluation criteria
    criteria: [
        {
            id: 'problem_fit',
            category: 'Problem Fit',
            question: 'Is this problem well-suited for AI?',
            description: 'AI works best for pattern recognition, predictions, and complex decision-making - not simple rule-based logic.',
            checklistItems: [
                {
                    text: 'The problem involves patterns, predictions, or complex decisions',
                    goodSign: 'Predicting customer churn, classifying support tickets, detecting anomalies',
                    badSign: 'Simple calculations, basic if/then rules, deterministic workflows'
                },
                {
                    text: 'Rule-based systems would be too complex or brittle',
                    goodSign: 'Fraud detection with hundreds of factors and evolving patterns',
                    badSign: 'Approving requests based on 3-4 clear policy rules'
                },
                {
                    text: 'Human experts can do this task but it\'s time-consuming',
                    goodSign: 'Reviewing documents, categorizing items, finding similar cases',
                    badSign: 'Tasks that humans also struggle with or can\'t do consistently'
                },
                {
                    text: 'The problem requires understanding context or nuance',
                    goodSign: 'Understanding customer intent, analyzing sentiment, extracting information from text',
                    badSign: 'Simple keyword matching, exact matching, basic sorting'
                }
            ],
            resources: [
                { title: 'When to Use AI vs Rules', url: 'https://hbr.org/2018/04/a-simple-tool-to-start-making-decisions-with-the-help-of-ai', type: 'article' }
            ]
        },
        {
            id: 'data_availability',
            category: 'Data Readiness',
            question: 'Do you have the data needed to train and run AI?',
            description: 'AI quality depends entirely on data quality and quantity. No data = no AI.',
            checklistItems: [
                {
                    text: 'You have historical data (typically 1000s-10000s of examples)',
                    goodSign: '10,000+ past transactions, 5,000+ labeled support tickets',
                    badSign: 'Less than 100 examples, starting from scratch',
                    criticalRisk: true
                },
                {
                    text: 'Data is labeled or outcomes are known (for supervised learning)',
                    goodSign: 'Historical approvals/denials, past fraud cases, categorized documents',
                    badSign: 'Unlabeled data requiring expensive manual annotation'
                },
                {
                    text: 'Data quality is good (accurate, complete, consistent)',
                    goodSign: 'Clean, validated data with few missing values',
                    badSign: 'Messy, inconsistent, lots of missing or incorrect data',
                    criticalRisk: true
                },
                {
                    text: 'Data is representative and unbiased',
                    goodSign: 'Diverse data covering all scenarios and user groups',
                    badSign: 'Biased historical data that perpetuates unfair outcomes',
                    criticalRisk: true
                },
                {
                    text: 'You can access and use this data legally and ethically',
                    goodSign: 'Data you own, with proper consent and privacy protections',
                    badSign: 'Sensitive data without clear legal rights or user consent',
                    criticalRisk: true
                }
            ],
            resources: [
                { title: 'Data Preparation for ML', url: 'https://developers.google.com/machine-learning/data-prep', type: 'guide' },
                { title: 'Data Quality Checklist', url: 'https://www.datacamp.com/tutorial/data-quality', type: 'article' }
            ]
        },
        {
            id: 'impact_value',
            category: 'Business Value',
            question: 'Will AI deliver meaningful value?',
            description: 'AI should solve real problems and create measurable value - not just be "cool tech".',
            checklistItems: [
                {
                    text: 'There\'s a clear, measurable benefit',
                    goodSign: 'Reduce support costs by 30%, increase conversion by 15%, save 10 hours/week',
                    badSign: 'Vague benefits like "better experience" without metrics'
                },
                {
                    text: 'The problem is significant enough to justify the investment',
                    goodSign: 'High-volume, high-cost, or high-risk process',
                    badSign: 'Rare edge case, low-impact process'
                },
                {
                    text: 'Current solution has clear pain points',
                    goodSign: 'Manual process taking hours, high error rates, customer complaints',
                    badSign: 'Current solution works fine, no clear problems'
                },
                {
                    text: 'Value exceeds cost of building and maintaining AI',
                    goodSign: 'ROI positive within 12 months',
                    badSign: 'Expensive AI solution for minimal incremental value'
                }
            ],
            resources: [
                { title: 'Measuring AI ROI', url: 'https://www.mckinsey.com/capabilities/quantumblack/our-insights/getting-to-know-and-manage-your-biggest-ai-risk', type: 'article' }
            ]
        },
        {
            id: 'risk_tolerance',
            category: 'Risk & Trust',
            question: 'Can you handle AI being wrong sometimes?',
            description: 'AI is probabilistic - it will make mistakes. High-stakes decisions need human oversight.',
            checklistItems: [
                {
                    text: 'Errors are tolerable or can be caught',
                    goodSign: 'Suggestions with human review, low-stakes decisions, multiple validation steps',
                    badSign: 'Life-critical decisions, legal liability, irreversible actions',
                    criticalRisk: true
                },
                {
                    text: 'You have a human-in-the-loop fallback',
                    goodSign: 'AI recommends, human approves; AI flags, human investigates',
                    badSign: 'Fully automated with no human oversight option'
                },
                {
                    text: 'You can explain AI decisions to users',
                    goodSign: 'Transparent factors, clear reasoning, explainable AI techniques',
                    badSign: 'Black box decisions affecting people\'s lives or livelihoods'
                },
                {
                    text: 'False positives and false negatives are acceptable',
                    goodSign: 'Over-flagging for fraud review (inconvenience), missing some spam (minor annoyance)',
                    badSign: 'Missing cancer diagnosis, wrongly rejecting loan applications',
                    criticalRisk: true
                }
            ],
            resources: [
                { title: 'AI Risk Management', url: 'https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.100-1.pdf', type: 'framework' },
                { title: 'Human-in-the-Loop AI', url: 'https://arxiv.org/abs/2108.00941', type: 'paper' }
            ]
        },
        {
            id: 'team_capability',
            category: 'Team & Resources',
            question: 'Do you have the team and resources?',
            description: 'AI requires specialized skills and ongoing maintenance - not a one-time build.',
            checklistItems: [
                {
                    text: 'You have or can hire ML/AI expertise',
                    goodSign: 'ML engineers, data scientists on team or budget to hire',
                    badSign: 'No AI experience and no plan to acquire it'
                },
                {
                    text: 'You have infrastructure to deploy and monitor AI',
                    goodSign: 'Cloud infrastructure, MLOps pipeline, monitoring tools',
                    badSign: 'No deployment plan, no infrastructure'
                },
                {
                    text: 'You can maintain and update the model over time',
                    goodSign: 'Ongoing budget for retraining, monitoring, improvements',
                    badSign: 'Build-once-and-forget mindset'
                },
                {
                    text: 'Timeline allows for experimentation and iteration',
                    goodSign: '3-6+ month runway, expectation of multiple iterations',
                    badSign: 'Need production-ready AI in 2 weeks'
                }
            ],
            resources: [
                { title: 'Building ML Teams', url: 'https://hbr.org/2020/10/building-the-ai-powered-organization', type: 'article' }
            ]
        },
        {
            id: 'alternatives',
            category: 'Alternatives',
            question: 'Have you considered simpler alternatives?',
            description: 'Start simple. Rule-based systems, better UX, or process changes often work better than AI.',
            checklistItems: [
                {
                    text: 'Rule-based logic won\'t solve it',
                    goodSign: 'Too many factors, complex patterns, evolving conditions',
                    badSign: 'Clear rules like "if balance > 1000 then approve"'
                },
                {
                    text: 'Better UX or process design won\'t solve it',
                    goodSign: 'Problem is computational complexity, not usability',
                    badSign: 'Problem is confusing interface or unclear workflow'
                },
                {
                    text: 'Off-the-shelf tools won\'t work',
                    goodSign: 'Unique use case requiring custom solution',
                    badSign: 'Common problem with existing SaaS solutions'
                },
                {
                    text: 'You\'ve validated the need with users',
                    goodSign: 'User research shows clear need for AI capabilities',
                    badSign: 'Assumption that users want AI without validation'
                }
            ],
            resources: [
                { title: 'When Not to Use AI', url: 'https://www.oreilly.com/radar/what-machine-learning-will-and-wont-do-for-your-business/', type: 'article' }
            ]
        }
    ],

    // Scoring guidance
    scoring: {
        description: 'Evaluate each checklist item. Count critical risks and overall readiness.',
        levels: [
            {
                level: 'green',
                label: 'Good fit for AI',
                description: 'Most criteria met, no critical risks. Proceed with AI solution.',
                minChecked: 0.8, // 80%+ items checked
                maxCriticalRisks: 0
            },
            {
                level: 'yellow',
                label: 'Proceed with caution',
                description: 'Some gaps or risks. Address concerns before proceeding.',
                minChecked: 0.5,
                maxCriticalRisks: 1
            },
            {
                level: 'red',
                label: 'AI not recommended',
                description: 'Significant gaps or multiple critical risks. Consider alternatives.',
                minChecked: 0,
                maxCriticalRisks: 999
            }
        ]
    },

    // Next steps based on assessment
    recommendations: {
        green: {
            title: 'AI looks like a good fit! 🎉',
            nextSteps: [
                'Define success metrics and how you\'ll measure them',
                'Start with an MVP focused on one specific use case',
                'Plan for data collection and model training',
                'Design human-in-the-loop workflows for oversight',
                'Create a monitoring and maintenance plan'
            ]
        },
        yellow: {
            title: 'Address these concerns before proceeding ⚠️',
            nextSteps: [
                'Fill data gaps - collect more data or improve quality',
                'Start with a smaller scope or pilot project',
                'Plan for human oversight and error handling',
                'Validate business value with stakeholders',
                'Build team capabilities or secure AI expertise'
            ]
        },
        red: {
            title: 'Consider alternatives to AI 🛑',
            nextSteps: [
                'Explore rule-based solutions or better UX',
                'Investigate off-the-shelf tools or services',
                'Address fundamental data or risk issues first',
                'Start with data collection to enable AI in the future',
                'Validate the problem is worth solving at all'
            ]
        }
    }
};

// Calculate readiness score
function assessAIReadiness(checkedItems, totalItems, criticalRiskCount) {
    const percentChecked = totalItems > 0 ? checkedItems / totalItems : 0;

    if (criticalRiskCount >= 2) {
        return 'red';
    } else if (criticalRiskCount === 1 || percentChecked < 0.6) {
        return 'yellow';
    } else if (percentChecked >= 0.8) {
        return 'green';
    } else {
        return 'yellow';
    }
}
