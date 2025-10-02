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

    const handleAnalyze = () => {
        const result = analyzeProject(concept);
        setAnalysis(result);
        setSelectedPrinciples(result.recommended);
    };

    const togglePrinciple = (key) => {
        setSelectedPrinciples(prev => 
            prev.includes(key) 
                ? prev.filter(p => p !== key)
                : [...prev, key]
        );
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
                            Project Concept
                        </label>
                        <textarea
                            value={concept}
                            onChange={(e) => setConcept(e.target.value)}
                            placeholder='E.g., "Auto-approve requests based on policy rules" or "Detect anomalies in transaction data"'
                            className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                        />
                    </div>
                    
                    <button
                        onClick={handleAnalyze}
                        disabled={!concept.trim()}
                        className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                        Analyze Project
                    </button>
                </div>

                {/* Results Section */}
                {analysis && (
                    <div className="space-y-6">
                        {/* AI Type & Interaction */}
                        <div className="grid md:grid-cols-2 gap-6">
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
                        </div>

                        {/* Detected Pattern */}
                        <div className="bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
                            <h3 className="text-lg font-semibold mb-2">Detected Workflow Pattern</h3>
                            <p className="text-xl font-bold">{analysis.detectedPattern}</p>
                        </div>

                        {/* OOUX Workflow - Simplified for space */}
                        {analysis.oouxWorkflow && analysis.oouxWorkflow.objects.length > 0 && (
                            <div className="bg-white rounded-lg shadow-lg p-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                    <Icon name="Box" />
                                    <span className="ml-2">OOUX Workflow</span>
                                </h3>

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

                                {/* Workflow Steps */}
                                <div className="mb-6">
                                    <h4 className="font-semibold text-gray-700 mb-3 flex items-center">
                                        <Icon name="GitBranch" />
                                        <span className="ml-2">Workflow Steps</span>
                                    </h4>
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
                            </div>
                        )}

                        {/* Recommended Principles */}
                        <div className="bg-white rounded-lg shadow-lg p-6">
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

                        {/* Technical, Risks, etc. - Condensed */}
                        <div className="grid md:grid-cols-2 gap-6">
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
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                <Icon name="AlertCircle" />
                                <span className="ml-2">Risks & Mitigations</span>
                            </h3>
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
                        </div>

                        {/* Examples */}
                        {analysis.examples.length > 0 && (
                            <div className="bg-white rounded-lg shadow-lg p-6">
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
                )}
            </div>
        </div>
    );
};