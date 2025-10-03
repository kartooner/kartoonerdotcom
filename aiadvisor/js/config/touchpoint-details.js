// AI Touchpoint Deep Dive Details
// Provides non-technical recommendations and approaches for common AI touchpoints

const TOUCHPOINT_DETAILS = {
    // Validation & Policy
    'policy_validation': {
        title: 'Policy & Business Rules Validation',
        category: 'Validation',
        aiTechniques: ['Rule Engine', 'Decision Trees', 'Constraint Programming'],
        approach: 'AI encodes your business policies as structured rules and automatically checks if incoming requests meet all requirements',
        implementation: {
            simple: 'Rule-based system with if-then logic - good for straightforward policies',
            advanced: 'Machine learning that learns from past approval decisions - adapts to complex scenarios'
        },
        dataNeeded: [
            'Your policy documentation and business rules written out',
            'Historical approval/rejection decisions to learn from',
            'Edge case examples and exceptions to handle'
        ],
        services: ['AWS Lambda + DynamoDB for rules', 'Azure Logic Apps', 'Google Cloud Functions'],
        realWorldExample: 'PTO request validation: AI checks employee PTO balance, blackout periods, minimum notice requirements, and team coverage before auto-approving or flagging for manager review.'
    },

    // Pattern Analysis
    'pattern_analysis': {
        title: 'Historical Pattern Analysis',
        category: 'Analysis',
        aiTechniques: ['Time Series Analysis', 'Clustering', 'Anomaly Detection'],
        approach: 'AI learns what "normal" looks like from your historical data, then flags unusual patterns or deviations',
        implementation: {
            simple: 'Statistical analysis comparing new data to historical averages and ranges',
            advanced: 'Deep learning models that understand complex seasonal patterns and trends'
        },
        dataNeeded: [
            'Historical data spanning 6-12 months minimum',
            'Examples labeled as normal vs. anomalous',
            'Context like time of year, user demographics, location'
        ],
        services: ['AWS SageMaker (Random Cut Forest)', 'Azure Anomaly Detector', 'Google Cloud AutoML'],
        realWorldExample: 'Expense report review: AI learns typical spending patterns for each role/department, then flags reports with unusual amounts, vendors, or timing for audit.'
    },

    // Confidence Scoring
    'confidence_scoring': {
        title: 'AI Confidence Calculation',
        category: 'Scoring',
        aiTechniques: ['Ensemble Methods', 'Probability Calibration', 'Uncertainty Quantification'],
        approach: 'AI tells you how certain it is about each prediction, so you know which decisions need human review',
        implementation: {
            simple: 'Scoring based on how many rules match and how strongly',
            advanced: 'Multiple AI models vote, and the system calibrates confidence based on past accuracy'
        },
        dataNeeded: [
            'Training data with known correct outcomes',
            'Historical accuracy tracking for different scenarios',
            'Information about which factors are most predictive'
        ],
        services: ['Scikit-learn', 'TensorFlow Probability', 'Custom ML pipelines'],
        realWorldExample: 'Resume screening: AI gives each candidate a match score AND a confidence level. High-confidence matches can auto-advance, low-confidence ones get human review.'
    },

    // Risk Assessment
    'risk_assessment': {
        title: 'Risk Factor Assessment',
        category: 'Scoring',
        aiTechniques: ['Logistic Regression', 'Gradient Boosting', 'Neural Networks'],
        approach: 'AI evaluates multiple risk factors and combines them into an overall risk score with explanations',
        implementation: {
            simple: 'Weighted scorecard where you define risk factors and their importance',
            advanced: 'Machine learning that discovers risk patterns from historical outcomes'
        },
        dataNeeded: [
            'Historical data with known outcomes (approved/denied, fraud/legitimate, etc.)',
            'Risk factor definitions you currently consider',
            'Cost/impact data for mistakes (false positives and negatives)'
        ],
        services: ['AWS SageMaker', 'Azure ML', 'Google Vertex AI', 'H2O.ai'],
        realWorldExample: 'Loan applications: AI considers credit score, debt-to-income ratio, employment history, and other factors to produce an approval recommendation with risk rating (low/medium/high).'
    },

    // NLP & Understanding
    'nlp_understanding': {
        title: 'Natural Language Understanding',
        category: 'LLM',
        aiTechniques: ['Large Language Models (LLMs)', 'Intent Classification', 'Entity Extraction'],
        approach: 'AI reads and understands text or voice input to extract intent, key information, and meaning',
        implementation: {
            simple: 'Keyword matching and template-based parsing for structured queries',
            advanced: 'Large Language Models (like GPT) that understand nuance and context'
        },
        dataNeeded: [
            'Example user questions or text inputs with what they mean',
            'Types of information you want to extract',
            'Domain-specific terms and their meanings'
        ],
        services: ['OpenAI GPT-4', 'Anthropic Claude', 'Azure OpenAI', 'Google PaLM'],
        realWorldExample: 'Support ticket routing: AI reads ticket description, understands if it\'s technical, billing, or general inquiry, extracts account info, and routes to right team with priority.'
    },

    // Recommendation Generation
    'recommendation_generation': {
        title: 'Actionable Recommendation Generation',
        category: 'Generation',
        aiTechniques: ['Reinforcement Learning', 'Collaborative Filtering', 'Causal Inference'],
        approach: 'AI generates specific, personalized recommendations based on analysis and what worked in similar situations',
        implementation: {
            simple: 'Rule-based recommendations from decision trees',
            advanced: 'AI that learns optimal recommendations from tracking outcomes over time'
        },
        dataNeeded: [
            'Historical actions taken and their results',
            'Context factors that influenced success',
            'Constraints (cost, time, feasibility)'
        ],
        services: ['AWS Personalize', 'Azure Personalizer', 'Google Recommendations AI'],
        realWorldExample: 'Employee retention: AI detects flight risk, then recommends specific actions (salary adjustment, development plan, role change) based on what successfully retained similar employees.'
    },

    // Learning & Adaptation
    'learning_feedback': {
        title: 'Learning from User Feedback',
        category: 'Learning',
        aiTechniques: ['Online Learning', 'Active Learning', 'Human-in-the-Loop'],
        approach: 'AI continuously improves by learning from user corrections, overrides, and actual outcomes',
        implementation: {
            simple: 'Log corrections and retrain the model weekly or monthly',
            advanced: 'Real-time learning where AI updates immediately from each correction'
        },
        dataNeeded: [
            'User corrections when they override AI decisions',
            'Actual outcomes (what really happened)',
            'Feedback ratings and comments from users'
        ],
        services: ['MLflow for tracking', 'Weights & Biases', 'Custom feedback loops'],
        realWorldExample: 'Timecard corrections: When managers correct AI-flagged time entries, the system learns from each correction. Over time, it gets better at knowing which patterns are actually errors vs. legitimate exceptions.'
    },

    // Predictive Modeling
    'predictive_modeling': {
        title: 'Future Outcome Prediction',
        category: 'Prediction',
        aiTechniques: ['Time Series Forecasting', 'Survival Analysis', 'Predictive Analytics'],
        approach: 'AI forecasts future events or trends based on historical patterns and current indicators',
        implementation: {
            simple: 'Trend analysis and moving averages for straightforward predictions',
            advanced: 'Deep learning models that capture complex patterns, seasonality, and external factors'
        },
        dataNeeded: [
            'Historical time series data (12+ months recommended)',
            'Outcome data (what actually happened)',
            'Leading indicators and external factors that influence outcomes'
        ],
        services: ['AWS Forecast', 'Azure ML', 'Facebook Prophet', 'TensorFlow'],
        realWorldExample: 'Employee turnover prediction: AI predicts which employees are likely to leave in next 3-6 months based on tenure, time since last raise, performance trends, manager changes, and market demand for their skills.'
    }
};

// Mapping of common touchpoint phrases to detail keys
const TOUCHPOINT_MATCHER = {
    'validates': 'policy_validation',
    'policy rules': 'policy_validation',
    'business rules': 'policy_validation',
    'compliance': 'policy_validation',

    'analyzes historical': 'pattern_analysis',
    'historical patterns': 'pattern_analysis',
    'baseline': 'pattern_analysis',
    'pattern analysis': 'pattern_analysis',

    'confidence': 'confidence_scoring',
    'certainty': 'confidence_scoring',
    'probability': 'confidence_scoring',

    'risk': 'risk_assessment',
    'assesses risk': 'risk_assessment',

    'natural language': 'nlp_understanding',
    'parses intent': 'nlp_understanding',
    'entity extraction': 'nlp_understanding',
    'understands': 'nlp_understanding',

    'recommendation': 'recommendation_generation',
    'suggests': 'recommendation_generation',
    'proposes': 'recommendation_generation',

    'learns from': 'learning_feedback',
    'feedback': 'learning_feedback',
    'corrections': 'learning_feedback',

    'predicts': 'predictive_modeling',
    'forecast': 'predictive_modeling',
    'prediction': 'predictive_modeling'
};

// Helper function to find relevant details for a touchpoint
function findTouchpointDetails(touchpointText) {
    const lower = touchpointText.toLowerCase();

    for (const [phrase, detailKey] of Object.entries(TOUCHPOINT_MATCHER)) {
        if (lower.includes(phrase)) {
            return TOUCHPOINT_DETAILS[detailKey];
        }
    }

    return null; // No specific details found
}
