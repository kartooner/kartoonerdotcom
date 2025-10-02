// React Component - Main App
// NOTE: This uses React from global scope (loaded via CDN in index.html)

const { useState } = React;

const Icon = ({ name }) => {
    const IconComponent = Icons[name];
    return IconComponent ? <IconComponent /> : null;
};

const AIProjectAdvisor = () => {
    const [concept, setConcept] = useState('');
    const [analysis, setAnalysis] = useState(null);
    const [selectedPrinciples, setSelectedPrinciples] = useState([]);
    const [industry, setIndustry] = useState('generic');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [showTemplates, setShowTemplates] = useState(true);
    const [collapsed, setCollapsed] = useState({
        ooux: false,
        principles: false,
        technical: false,
        risks: false,
        examples: false
    });

    // Get placeholder based on selected industry
    const getPlaceholder = () => {
        const examples = {
            generic: 'E.g., "Auto-approve requests based on policy rules" or "Detect anomalies in transaction data"',
            hcm: 'E.g., "Auto-approve PTO requests with team coverage validation" or "Detect missing time punches and suggest fixes"',
            finance: 'E.g., "Auto-approve loan applications under threshold" or "Detect fraudulent transactions and flag for review"',
            healthcare: 'E.g., "Auto-approve prescription refills for stable patients" or "Predict patient readmission risk"',
            retail: 'E.g., "Auto-approve returns under $50 with valid receipt" or "Predict inventory stockouts and optimize reordering"'
        };
        return examples[industry] || examples.generic;
    };

    const handleAnalyze = () => {
        setIsAnalyzing(true);
        setShowTemplates(false);
        // Simulate async analysis with a short delay for UX
        setTimeout(() => {
            const result = analyzeProject(concept, industry);
            setAnalysis(result);
            setSelectedPrinciples(result.recommended);
            setIsAnalyzing(false);
        }, 500);
    };

    const handleEditConcept = () => {
        setAnalysis(null);
        setIsAnalyzing(false);
        setShowTemplates(true);
    };

    const handleTemplateClick = (template) => {
        setConcept(template.concept);
        setShowTemplates(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const toggleSection = (section) => {
        setCollapsed(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const copyToClipboard = (text, label = 'Content') => {
        navigator.clipboard.writeText(text).then(() => {
            alert(`${label} copied to clipboard!`);
        });
    };

    const togglePrinciple = (key) => {
        setSelectedPrinciples(prev =>
            prev.includes(key)
                ? prev.filter(p => p !== key)
                : [...prev, key]
        );
    };

    const scrollToSection = (sectionId) => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
            <div className="max-w-5xl mx-auto">
                {/* Input Section */}
                <div className="bg-white rounded-lg shadow-xl p-8 mb-6">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">AI Project Advisor</h1>
                    <p className="text-gray-600 mb-6">
                        Design intelligent AI workflows for any industry with OOUX and CMU design principles
                    </p>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Industry
                        </label>
                        <select
                            value={industry}
                            onChange={(e) => setIndustry(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                            <option value="generic">Generic (Domain Agnostic)</option>
                            <option value="hcm">Human Capital Management</option>
                            <option value="finance">Finance</option>
                            <option value="healthcare">Healthcare (Coming Soon)</option>
                            <option value="retail">Retail (Coming Soon)</option>
                        </select>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Project Concept
                        </label>
                        <textarea
                            value={concept}
                            onChange={(e) => setConcept(e.target.value)}
                            placeholder={getPlaceholder()}
                            className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                        />
                    </div>
                    
                    <button
                        onClick={handleAnalyze}
                        disabled={!concept.trim() || isAnalyzing}
                        className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                    >
                        {isAnalyzing ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Analyzing...
                            </>
                        ) : 'Analyze Project'}
                    </button>
                </div>

                {/* Templates Gallery */}
                {!analysis && showTemplates && TEMPLATES[industry] && (
                    <div className="bg-white rounded-lg shadow-xl p-8 mb-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">Quick Start Templates</h2>
                                <p className="text-sm text-gray-600 mt-1">Click any template to analyze</p>
                            </div>
                            <button
                                onClick={() => setShowTemplates(false)}
                                className="text-sm text-gray-500 hover:text-gray-700"
                            >
                                Hide
                            </button>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {TEMPLATES[industry].map((template, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleTemplateClick(template)}
                                    className="text-left p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all group"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <Icon name={template.icon} />
                                        <span className={`text-xs px-2 py-1 rounded ${
                                            template.complexity === 'low' ? 'bg-green-100 text-green-700' :
                                            template.complexity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-red-100 text-red-700'
                                        }`}>
                                            {template.complexity}
                                        </span>
                                    </div>
                                    <h3 className="font-semibold text-gray-800 mb-1 group-hover:text-indigo-600">{template.title}</h3>
                                    <p className="text-xs text-gray-600">{template.description}</p>
                                </button>
                            ))}
                        </div>
                        {!TEMPLATES[industry] || TEMPLATES[industry].length === 0 ? (
                            <p className="text-center text-gray-500 py-8">No templates available for this industry yet.</p>
                        ) : null}
                    </div>
                )}

                {!analysis && !showTemplates && (
                    <div className="text-center mb-6">
                        <button
                            onClick={() => setShowTemplates(true)}
                            className="text-sm text-indigo-600 hover:text-indigo-700 underline"
                        >
                            Show Templates
                        </button>
                    </div>
                )}

                {/* Results Section */}
                {analysis && (
                    <>
                        {/* Results Header with Context */}
                        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Analysis for:</span>
                                        <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">{industry === 'generic' ? 'Generic' : industry.toUpperCase()}</span>
                                    </div>
                                    <p className="text-gray-700 italic">"{concept}"</p>
                                </div>
                                <button
                                    onClick={handleEditConcept}
                                    className="ml-4 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    New Analysis
                                </button>
                            </div>
                        </div>

                        {/* Jump Navigation */}
                        <div className="sticky top-0 z-10 bg-white shadow-md rounded-lg mb-6 p-4">
                            <div className="flex flex-wrap gap-2 items-center justify-center">
                                <span className="text-sm font-medium text-gray-600 mr-2">Jump to:</span>
                                <button onClick={() => scrollToSection('overview')} className="px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition-colors">Overview</button>
                                <button onClick={() => scrollToSection('ooux')} className="px-3 py-1 text-sm bg-cyan-100 text-cyan-700 rounded hover:bg-cyan-200 transition-colors">OOUX Workflow</button>
                                <button onClick={() => scrollToSection('principles')} className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors">Design Principles</button>
                                <button onClick={() => scrollToSection('technical')} className="px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors">Technical</button>
                                <button onClick={() => scrollToSection('risks')} className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors">Risks</button>
                                <button onClick={() => scrollToSection('examples')} className="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors">Examples</button>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* AI Type, Interaction & Complexity */}
                            <div id="overview" className="grid md:grid-cols-3 gap-6">
                            <div className="bg-white rounded-lg shadow-lg p-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                                    <Icon name="Brain" />
                                    <span className="ml-2">AI Type</span>
                                </h3>
                                <div className="bg-indigo-50 rounded-lg p-4">
                                    <div className="text-2xl font-bold text-indigo-600 mb-2">{analysis.aiType}</div>
                                    <p className="text-sm text-gray-600">{analysis.aiTypeReason}</p>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow-lg p-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                                    <Icon name="Users" />
                                    <span className="ml-2">User Interaction</span>
                                </h3>
                                <div className="bg-purple-50 rounded-lg p-4">
                                    <div className="text-2xl font-bold text-purple-600 mb-2 capitalize">{analysis.visibility}</div>
                                    <p className="text-sm text-gray-600">{analysis.visibilityReason}</p>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow-lg p-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                                    <Icon name="Wrench" />
                                    <span className="ml-2">Complexity</span>
                                </h3>
                                <div className={`rounded-lg p-4 ${
                                    analysis.complexity.level === 'Low' ? 'bg-green-50' :
                                    analysis.complexity.level === 'Medium' ? 'bg-yellow-50' :
                                    'bg-red-50'
                                }`}>
                                    <div className="flex items-baseline gap-2 mb-2">
                                        <div className={`text-2xl font-bold ${
                                            analysis.complexity.level === 'Low' ? 'text-green-600' :
                                            analysis.complexity.level === 'Medium' ? 'text-yellow-600' :
                                            'text-red-600'
                                        }`}>{analysis.complexity.level}</div>
                                        <div className="text-sm text-gray-600">({analysis.complexity.score}/100)</div>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-1">{analysis.complexity.description}</p>
                                    <p className="text-xs text-gray-500">Est. effort: {analysis.complexity.effort}</p>
                                </div>
                            </div>
                        </div>

                        {/* Detected Pattern */}
                        <div className="bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
                            <h3 className="text-lg font-semibold mb-2">Detected Workflow Pattern</h3>
                            <p className="text-xl font-bold">{analysis.detectedPattern}</p>
                        </div>

                        {/* OOUX Workflow - Simplified for space */}
                        {analysis.oouxWorkflow && analysis.oouxWorkflow.objects.length > 0 && (
                            <div id="ooux" className="bg-white rounded-lg shadow-lg p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                                        <Icon name="Box" />
                                        <span className="ml-2">OOUX Workflow</span>
                                    </h3>
                                    <button
                                        onClick={() => toggleSection('ooux')}
                                        className="text-sm text-gray-600 hover:text-gray-800 font-medium"
                                    >
                                        {collapsed.ooux ? 'Expand' : 'Collapse'}
                                    </button>
                                </div>

                                {!collapsed.ooux && (
                                    <>

                                {/* Objects */}
                                <div className="mb-6">
                                    <h4 className="font-semibold text-gray-700 mb-3">Key Objects</h4>
                                    <div className="grid md:grid-cols-3 gap-3">
                                        {analysis.oouxWorkflow.objects.slice(0, 6).map((obj, idx) => (
                                            <div key={idx} className="border border-cyan-200 rounded p-3 bg-cyan-50">
                                                <h5 className="font-bold text-gray-800 text-sm">{obj.name}</h5>
                                                <p className="text-xs text-gray-600 mt-1">{obj.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Visual Workflow Diagram */}
                                <div className="mb-6">
                                    <h4 className="font-semibold text-gray-700 mb-3">Visual Workflow</h4>
                                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 overflow-x-auto">
                                        <div className="flex items-center gap-2 min-w-max">
                                            {analysis.oouxWorkflow.flow.slice(0, 8).map((step, idx) => (
                                                <React.Fragment key={idx}>
                                                    <div className={`flex flex-col items-center ${step.condition ? 'opacity-70' : ''}`}>
                                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xs font-bold ${
                                                            step.actor === 'AI' ? 'bg-indigo-500 text-white' :
                                                            step.actor === 'User' ? 'bg-green-500 text-white' :
                                                            'bg-gray-500 text-white'
                                                        }`}>
                                                            {step.step}
                                                        </div>
                                                        <div className="text-xs mt-1 text-center max-w-20 font-medium">{step.actor}</div>
                                                    </div>
                                                    {idx < analysis.oouxWorkflow.flow.slice(0, 8).length - 1 && (
                                                        <div className="text-gray-400 text-xl">→</div>
                                                    )}
                                                </React.Fragment>
                                            ))}
                                            {analysis.oouxWorkflow.flow.length > 8 && (
                                                <div className="text-gray-500 text-sm">+{analysis.oouxWorkflow.flow.length - 8} more</div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Workflow Steps */}
                                <div className="mb-6">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="font-semibold text-gray-700 flex items-center">
                                            <Icon name="GitBranch" />
                                            <span className="ml-2">Workflow Steps</span>
                                        </h4>
                                        <button
                                            onClick={() => copyToClipboard(
                                                analysis.oouxWorkflow.flow.map(s => `${s.step}. ${s.actor}: ${s.action}${s.condition ? ` (if ${s.condition})` : ''}`).join('\n'),
                                                'Workflow steps'
                                            )}
                                            className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                        >
                                            Copy Steps
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        {analysis.oouxWorkflow.flow.map((step, idx) => (
                                            <div key={idx} className={`flex items-start text-sm ${step.condition ? 'ml-8' : ''}`}>
                                                <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mr-3 ${
                                                    step.actor === 'AI' ? 'bg-indigo-100 text-indigo-700' :
                                                    step.actor === 'User' ? 'bg-green-100 text-green-700' :
                                                    'bg-gray-100 text-gray-700'
                                                }`}>
                                                    {step.step}
                                                </div>
                                                <div className="flex-1">
                                                    <span className="font-semibold">{step.actor}</span>
                                                    <span className="text-gray-600"> {step.action}</span>
                                                    {step.condition && <div className="text-xs text-gray-500 italic mt-1">if {step.condition}</div>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* AI Touchpoints */}
                                <div className="mb-6">
                                    <h4 className="font-semibold text-gray-700 mb-3">AI Touchpoints</h4>
                                    <ul className="space-y-1">
                                        {analysis.oouxWorkflow.aiTouchpoints.map((point, idx) => (
                                            <li key={idx} className="flex items-start text-sm text-gray-700">
                                                <span className="text-indigo-500 mr-2 mt-0.5">⚡</span>
                                                {point}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Configuration Needs */}
                                {analysis.oouxWorkflow.configurationNeeds && (
                                    <div>
                                        <h4 className="font-semibold text-gray-700 mb-3">Configuration Needs</h4>
                                        <div className="space-y-3">
                                            {analysis.oouxWorkflow.configurationNeeds.map((config, idx) => (
                                                <div key={idx} className="bg-purple-50 border-l-4 border-purple-400 p-3 rounded-r">
                                                    <div className="flex items-start justify-between mb-1">
                                                        <h5 className="font-semibold text-gray-800 text-sm">{config.setting}</h5>
                                                        <span className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded ml-2 whitespace-nowrap">
                                                            {config.default}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-700">{config.description}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                    </>
                                )}
                            </div>
                        )}

                        {/* Recommended Principles */}
                        <div id="principles" className="bg-white rounded-lg shadow-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                <Icon name="CheckCircle" />
                                <span className="ml-2">Recommended Design Principles</span>
                            </h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Click to add or remove from your focus
                            </p>
                            <div className="grid md:grid-cols-3 gap-4">
                                {Object.entries(PRINCIPLES).map(([key, principle]) => {
                                    const isSelected = selectedPrinciples.includes(key);
                                    const isRecommended = analysis.recommended.includes(key);
                                    
                                    return (
                                        <button
                                            key={key}
                                            onClick={() => togglePrinciple(key)}
                                            className={`text-left p-4 rounded-lg border-2 transition-all ${
                                                isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white hover:border-gray-300'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <Icon name={principle.icon} />
                                                {isRecommended && (
                                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                                        Recommended
                                                    </span>
                                                )}
                                            </div>
                                            <h4 className="font-semibold text-gray-800 text-sm mb-1">{principle.name}</h4>
                                            <p className="text-xs text-gray-600">{principle.focus}</p>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Selected Principles Details */}
                        {selectedPrinciples.length > 0 && (
                            <div className="bg-white rounded-lg shadow-lg p-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                    Your Focus Principles ({selectedPrinciples.length})
                                </h3>
                                <div className="space-y-4">
                                    {selectedPrinciples.map(key => {
                                        const principle = PRINCIPLES[key];
                                        return (
                                            <div key={key} className="border-l-4 border-indigo-500 pl-4 py-2">
                                                <h4 className="font-semibold text-gray-800 mb-2">{principle.name}</h4>
                                                <p className="text-sm text-gray-600 mb-2 italic">{principle.focus}</p>
                                                <ul className="space-y-1">
                                                    {principle.tips.map((tip, idx) => (
                                                        <li key={idx} className="text-sm text-gray-700 flex items-start">
                                                            <span className="text-indigo-500 mr-2">•</span>
                                                            {tip}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Complexity Breakdown */}
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                <Icon name="Wrench" />
                                <span className="ml-2">Complexity Breakdown</span>
                            </h3>
                            <div className="space-y-2">
                                {analysis.complexity.factors.map((factor, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                        <div className="flex items-center gap-3">
                                            <span className={`w-2 h-2 rounded-full ${
                                                factor.impact === 'High' ? 'bg-red-500' :
                                                factor.impact === 'Medium' ? 'bg-yellow-500' :
                                                'bg-green-500'
                                            }`}></span>
                                            <span className="text-sm font-medium text-gray-700">{factor.factor}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs px-2 py-1 rounded ${
                                                factor.impact === 'High' ? 'bg-red-100 text-red-700' :
                                                factor.impact === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-green-100 text-green-700'
                                            }`}>
                                                {factor.impact}
                                            </span>
                                            <span className="text-sm font-bold text-gray-600">+{factor.points}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Technical, Risks, etc. - Condensed */}
                        <div id="technical" className="grid md:grid-cols-2 gap-6">
                            <div className="bg-white rounded-lg shadow-lg p-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-3">Technical Considerations</h3>
                                <ul className="space-y-2">
                                    {analysis.technical.map((item, idx) => (
                                        <li key={idx} className="flex items-start text-sm text-gray-700">
                                            <span className="text-orange-500 mr-2">▸</span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="bg-white rounded-lg shadow-lg p-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-3">Trust Cues</h3>
                                <ul className="space-y-2">
                                    {analysis.trustCues.map((cue, idx) => (
                                        <li key={idx} className="flex items-start text-sm text-gray-700">
                                            <span className="text-green-500 mr-2">✓</span>
                                            {cue}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Risks */}
                        <div id="risks" className="bg-white rounded-lg shadow-lg p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                                    <Icon name="AlertCircle" />
                                    <span className="ml-2">Risks & Mitigations</span>
                                </h3>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => copyToClipboard(
                                            analysis.risks.map(r => `Risk: ${r.risk}\nMitigation: ${r.mitigation}`).join('\n\n'),
                                            'Risks & Mitigations'
                                        )}
                                        className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                    >
                                        Copy All
                                    </button>
                                    <button
                                        onClick={() => toggleSection('risks')}
                                        className="text-sm text-gray-600 hover:text-gray-800 font-medium"
                                    >
                                        {collapsed.risks ? 'Expand' : 'Collapse'}
                                    </button>
                                </div>
                            </div>
                            {!collapsed.risks && (
                            <div className="space-y-3">
                                {analysis.risks.map((item, idx) => (
                                    <div key={idx} className="border-l-4 border-red-400 pl-4 py-2 bg-red-50 rounded-r">
                                        <h4 className="font-semibold text-gray-800 text-sm mb-1">{item.risk}</h4>
                                        <p className="text-xs text-gray-700">
                                            <span className="font-medium">Mitigation:</span> {item.mitigation}
                                        </p>
                                    </div>
                                ))}
                            </div>
                            )}
                        </div>

                        {/* Examples */}
                        {analysis.examples.length > 0 && (
                            <div id="examples" className="bg-white rounded-lg shadow-lg p-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Examples Across Industries</h3>
                                <div className="space-y-3">
                                    {analysis.examples.map((example, idx) => (
                                        <div key={idx} className="bg-yellow-50 rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="font-semibold text-gray-800">{example.area}</h4>
                                                <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded">
                                                    {example.type}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-700">{example.use}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};