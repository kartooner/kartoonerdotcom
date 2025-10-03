// AI/ML Glossary - Educational resource for product designers
// Provides clear definitions and helpful resources for common AI/ML terms

const AI_GLOSSARY = {
    // Core AI Concepts
    'ai': {
        term: 'AI (Artificial Intelligence)',
        shortDefinition: 'Computer systems that perform tasks typically requiring human intelligence',
        fullDefinition: 'Artificial Intelligence refers to computer systems designed to perform tasks that typically require human intelligence, such as visual perception, speech recognition, decision-making, and language translation.',
        whenToUse: 'Use AI when you need systems to learn from data, recognize patterns, make predictions, or automate complex decision-making.',
        examples: ['Spam detection in email', 'Face recognition in photos', 'Product recommendations', 'Voice assistants'],
        resources: [
            { title: 'AI Basics for Product Managers', url: 'https://www.productplan.com/learn/ai-for-product-managers/', type: 'article' },
            { title: 'Google\'s AI Guide', url: 'https://ai.google/education/', type: 'course' }
        ]
    },
    'ml': {
        term: 'ML (Machine Learning)',
        shortDefinition: 'Systems that learn and improve from experience without being explicitly programmed',
        fullDefinition: 'Machine Learning is a subset of AI where systems learn patterns from data rather than following explicit programming rules. The more data the system sees, the better it gets at making predictions or decisions.',
        whenToUse: 'Use ML when you have historical data and need to predict outcomes, classify items, or find patterns that are too complex for rule-based systems.',
        examples: ['Email spam filters that learn from user behavior', 'Credit scoring models', 'Product recommendations based on purchase history', 'Fraud detection'],
        resources: [
            { title: 'Machine Learning for Product Managers', url: 'https://www.coursera.org/learn/machine-learning-for-product-managers', type: 'course' },
            { title: 'ML Crash Course', url: 'https://developers.google.com/machine-learning/crash-course', type: 'course' }
        ]
    },
    'llm': {
        term: 'LLM (Large Language Model)',
        shortDefinition: 'AI models trained on vast amounts of text to understand and generate human-like language',
        fullDefinition: 'Large Language Models are neural networks trained on massive text datasets that can understand context, answer questions, generate text, summarize content, and perform language-related tasks with human-like quality.',
        whenToUse: 'Use LLMs for natural language tasks: chatbots, content generation, summarization, translation, question answering, or extracting information from unstructured text.',
        examples: ['ChatGPT for customer support', 'Document summarization', 'Writing assistance', 'Intent classification in user queries'],
        resources: [
            { title: 'Introduction to LLMs', url: 'https://www.anthropic.com/index/introducing-claude', type: 'article' },
            { title: 'LLM Practical Guide', url: 'https://github.com/openai/openai-cookbook', type: 'documentation' }
        ]
    },
    'nlp': {
        term: 'NLP (Natural Language Processing)',
        shortDefinition: 'AI that helps computers understand, interpret, and generate human language',
        fullDefinition: 'Natural Language Processing combines linguistics and machine learning to enable computers to understand, interpret, and respond to human language in a valuable way.',
        whenToUse: 'Use NLP when working with text or speech: sentiment analysis, chatbots, voice commands, text classification, or extracting structured data from documents.',
        examples: ['Sentiment analysis of customer reviews', 'Chatbot intent recognition', 'Auto-categorizing support tickets', 'Voice-to-text transcription'],
        resources: [
            { title: 'NLP Overview', url: 'https://www.ibm.com/topics/natural-language-processing', type: 'article' }
        ]
    },
    'supervised_learning': {
        term: 'Supervised Learning',
        shortDefinition: 'ML approach where models learn from labeled example data',
        fullDefinition: 'Supervised learning uses labeled training data (input-output pairs) to teach models to make predictions. Like teaching a child with flashcards - you show examples with correct answers until they learn the pattern.',
        whenToUse: 'Use when you have historical data with known outcomes: spam/not spam labels, approved/rejected decisions, fraud/legitimate transactions.',
        examples: ['Email spam detection (trained on labeled spam/ham emails)', 'Loan approval (trained on historical approve/deny decisions)', 'Image classification'],
        resources: [
            { title: 'Supervised Learning Explained', url: 'https://developers.google.com/machine-learning/crash-course/supervised-learning', type: 'article' }
        ]
    },
    'unsupervised_learning': {
        term: 'Unsupervised Learning',
        shortDefinition: 'ML approach where models find patterns in data without labeled examples',
        fullDefinition: 'Unsupervised learning finds hidden patterns or groupings in data without predefined labels. Like organizing a messy closet by finding natural categories without being told what goes where.',
        whenToUse: 'Use for discovering patterns, customer segmentation, anomaly detection, or when you don\'t have labeled training data.',
        examples: ['Customer segmentation for marketing', 'Anomaly detection in system logs', 'Topic clustering in documents', 'Recommendation systems'],
        resources: [
            { title: 'Unsupervised Learning Guide', url: 'https://www.ibm.com/topics/unsupervised-learning', type: 'article' }
        ]
    },
    'training_data': {
        term: 'Training Data',
        shortDefinition: 'Historical data used to teach ML models',
        fullDefinition: 'Training data is the dataset used to teach machine learning models. Quality and quantity of training data directly impacts model performance - garbage in, garbage out.',
        whenToUse: 'You need training data before building any ML system. Plan for data collection, cleaning, and labeling early in the project.',
        examples: ['Historical loan applications with approve/deny outcomes', 'Labeled images for object detection', 'Past customer support tickets with resolutions'],
        resources: [
            { title: 'Data for ML', url: 'https://developers.google.com/machine-learning/data-prep', type: 'guide' }
        ]
    },
    'model': {
        term: 'Model',
        shortDefinition: 'The trained AI system that makes predictions or decisions',
        fullDefinition: 'A model is the mathematical representation of patterns learned from training data. Think of it as the "brain" that takes inputs and produces predictions or classifications.',
        whenToUse: 'After training on your data, the model is what you deploy to production to make real-time predictions.',
        examples: ['A spam detection model that evaluates new emails', 'A credit scoring model that evaluates loan applications', 'A recommendation model that suggests products'],
        resources: []
    },
    'inference': {
        term: 'Inference',
        shortDefinition: 'Using a trained model to make predictions on new data',
        fullDefinition: 'Inference is the process of using a trained model to make predictions or decisions on new, unseen data. This is the "production" phase where your model does real work.',
        whenToUse: 'After training and testing your model, inference happens every time the model is used in your product.',
        examples: ['Running a spam check on an incoming email', 'Generating a credit score for a new applicant', 'Suggesting next product to buy'],
        resources: []
    },
    'accuracy': {
        term: 'Accuracy',
        shortDefinition: 'How often the model makes correct predictions',
        fullDefinition: 'Accuracy measures the percentage of predictions that are correct. However, accuracy alone can be misleading - a 99% accurate fraud detector that never catches fraud is useless.',
        whenToUse: 'Use accuracy as one metric, but also consider precision, recall, and false positive/negative rates depending on your use case.',
        examples: ['95% accuracy in spam detection', '90% accuracy in credit risk prediction'],
        resources: [
            { title: 'Model Evaluation Metrics', url: 'https://developers.google.com/machine-learning/crash-course/classification', type: 'guide' }
        ]
    },
    'bias': {
        term: 'Bias',
        shortDefinition: 'Systematic errors or unfair outcomes in AI predictions',
        fullDefinition: 'Bias occurs when AI systems make systematically unfair predictions, often reflecting biases in training data. This is a critical ethical concern in AI product design.',
        whenToUse: 'Always evaluate for bias, especially in systems affecting people (hiring, lending, healthcare). Diverse training data and fairness testing are essential.',
        examples: ['Hiring AI favoring certain demographics', 'Facial recognition performing worse on certain ethnicities', 'Credit scoring disadvantaging certain groups'],
        resources: [
            { title: 'AI Fairness', url: 'https://developers.google.com/machine-learning/fairness-overview', type: 'guide' },
            { title: 'Responsible AI', url: 'https://www.microsoft.com/en-us/ai/responsible-ai', type: 'framework' }
        ]
    },
    'prompt': {
        term: 'Prompt',
        shortDefinition: 'Instructions or questions given to an LLM to generate responses',
        fullDefinition: 'A prompt is the input text you provide to a Large Language Model. Well-crafted prompts significantly impact output quality - this is called "prompt engineering".',
        whenToUse: 'Every interaction with an LLM requires a prompt. Good prompts are clear, specific, and include context and examples.',
        examples: ['Summarize this customer review in one sentence', 'Extract the invoice number, date, and total from this text', 'Classify this support ticket as technical, billing, or general'],
        resources: [
            { title: 'Prompt Engineering Guide', url: 'https://www.promptingguide.ai/', type: 'guide' },
            { title: 'OpenAI Best Practices', url: 'https://platform.openai.com/docs/guides/prompt-engineering', type: 'documentation' }
        ]
    },
    'fine_tuning': {
        term: 'Fine-tuning',
        shortDefinition: 'Customizing a pre-trained model with your specific data',
        fullDefinition: 'Fine-tuning takes a pre-trained model and trains it further on your specific data to improve performance for your use case. More cost-effective than training from scratch.',
        whenToUse: 'Use when general-purpose models don\'t perform well enough on your specific task and you have domain-specific training data.',
        examples: ['Fine-tuning GPT for legal document analysis', 'Customizing a classification model for your product categories'],
        resources: [
            { title: 'Fine-tuning Guide', url: 'https://platform.openai.com/docs/guides/fine-tuning', type: 'guide' }
        ]
    },
    'embedding': {
        term: 'Embedding',
        shortDefinition: 'Numerical representation of text, images, or data that captures meaning',
        fullDefinition: 'Embeddings convert text or other data into vectors (lists of numbers) that capture semantic meaning. Similar items have similar embeddings, enabling search and comparison.',
        whenToUse: 'Use for semantic search, similarity matching, recommendation systems, or as input to ML models.',
        examples: ['Finding similar products based on descriptions', 'Semantic search across documentation', 'Grouping similar customer inquiries'],
        resources: [
            { title: 'Understanding Embeddings', url: 'https://platform.openai.com/docs/guides/embeddings', type: 'guide' }
        ]
    }
};

// Get glossary terms that appear in a piece of text
function findGlossaryTermsInText(text) {
    const lowerText = text.toLowerCase();
    const foundTerms = [];

    const termMap = {
        'machine learning': 'ml',
        'ml': 'ml',
        'large language model': 'llm',
        'llm': 'llm',
        'llms': 'llm',
        'natural language': 'nlp',
        'nlp': 'nlp',
        'supervised learning': 'supervised_learning',
        'unsupervised learning': 'unsupervised_learning',
        'training data': 'training_data',
        'ai model': 'model',
        'model': 'model',
        'inference': 'inference',
        'accuracy': 'accuracy',
        'bias': 'bias',
        'prompt': 'prompt',
        'fine-tuning': 'fine_tuning',
        'embedding': 'embedding',
        'ai': 'ai',
        'artificial intelligence': 'ai'
    };

    Object.entries(termMap).forEach(([searchTerm, key]) => {
        if (lowerText.includes(searchTerm) && !foundTerms.find(t => t.key === key)) {
            foundTerms.push({
                key,
                ...AI_GLOSSARY[key]
            });
        }
    });

    return foundTerms;
}

// Highlight glossary terms in text with dotted underline and tooltip
function highlightGlossaryTerms(text, onTermClick) {
    if (!text) return text;

    // Terms to highlight (order matters - longer phrases first to avoid partial matches)
    const termPatterns = [
        { pattern: /\b(Large Language Model|LLM)s?\b/gi, key: 'llm' },
        { pattern: /\b(Machine Learning|ML)\b/gi, key: 'ml' },
        { pattern: /\b(Natural Language Processing|NLP)\b/gi, key: 'nlp' },
        { pattern: /\b(Supervised Learning)\b/gi, key: 'supervised_learning' },
        { pattern: /\b(Unsupervised Learning)\b/gi, key: 'unsupervised_learning' },
        { pattern: /\b(Training Data)\b/gi, key: 'training_data' },
        { pattern: /\b(AI Model)s?\b/gi, key: 'model' },
        { pattern: /\b(Inference)\b/gi, key: 'inference' },
        { pattern: /\b(Accuracy)\b/gi, key: 'accuracy' },
        { pattern: /\b(Bias|Biased)\b/gi, key: 'bias' },
        { pattern: /\b(Prompt|Prompts)\b/gi, key: 'prompt' },
        { pattern: /\b(Fine-tuning|Fine-tune)\b/gi, key: 'fine_tuning' },
        { pattern: /\b(Embedding|Embeddings)\b/gi, key: 'embedding' },
        { pattern: /\b(AI)\b/gi, key: 'ai' }
    ];

    let result = text;
    const replacements = [];

    // Find all matches and their positions
    termPatterns.forEach(({ pattern, key }) => {
        const matches = [...text.matchAll(pattern)];
        matches.forEach(match => {
            replacements.push({
                start: match.index,
                end: match.index + match[0].length,
                text: match[0],
                key: key
            });
        });
    });

    // Sort by position (reverse order so we can replace from end to start)
    replacements.sort((a, b) => b.start - a.start);

    // Remove overlapping replacements (keep the first one found)
    const filtered = [];
    replacements.forEach(item => {
        const overlaps = filtered.some(existing =>
            (item.start >= existing.start && item.start < existing.end) ||
            (item.end > existing.start && item.end <= existing.end)
        );
        if (!overlaps) {
            filtered.push(item);
        }
    });

    // Apply replacements
    filtered.forEach(({ start, end, text, key }) => {
        const before = result.substring(0, start);
        const after = result.substring(end);
        const glossaryTerm = AI_GLOSSARY[key];

        if (glossaryTerm) {
            // Create a unique marker that we'll replace in React
            result = before + `<GLOSSARY:${key}:${text}>` + after;
        }
    });

    return result;
}
