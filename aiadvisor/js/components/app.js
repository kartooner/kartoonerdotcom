// React Component - Main App
// NOTE: This uses React from global scope (loaded via CDN in index.html)

const { useState, useEffect, useRef } = React;

const Icon = ({ name }) => {
    const IconComponent = Icons[name];
    return IconComponent ? <IconComponent /> : null;
};

// Focus Trap Hook for modals
const useFocusTrap = (isOpen) => {
    const containerRef = useRef(null);

    useEffect(() => {
        if (!isOpen || !containerRef.current) return;

        const container = containerRef.current;
        const focusableElements = container.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        // Focus first element when modal opens
        firstElement?.focus();

        const handleTab = (e) => {
            if (e.key !== 'Tab') return;

            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement?.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement?.focus();
                }
            }
        };

        container.addEventListener('keydown', handleTab);
        return () => container.removeEventListener('keydown', handleTab);
    }, [isOpen]);

    return containerRef;
};

// Component to render text with glossary term highlights
const GlossaryText = ({ text, onTermClick }) => {
    if (!text || typeof highlightGlossaryTerms === 'undefined') {
        return <>{text}</>;
    }

    const highlighted = highlightGlossaryTerms(text);
    const parts = highlighted.split(/(<GLOSSARY:[^>]+>)/g);

    return (
        <>
            {parts.map((part, idx) => {
                const match = part.match(/<GLOSSARY:([^:]+):([^>]+)>/);
                if (match) {
                    const [, key, termText] = match;
                    const glossaryTerm = typeof AI_GLOSSARY !== 'undefined' ? AI_GLOSSARY[key] : null;

                    return (
                        <span
                            key={idx}
                            className="border-b-2 border-dotted border-blue-500 cursor-help hover:bg-blue-50 transition-colors inline whitespace-nowrap"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onTermClick) onTermClick(key);
                            }}
                            title={glossaryTerm ? glossaryTerm.shortDefinition : ''}
                        >
                            {termText}
                        </span>
                    );
                }
                return <span key={idx}>{part}</span>;
            })}
        </>
    );
};

// Helper function to convert text to sentence case while preserving acronyms
const toSentenceCase = (text) => {
    if (!text) return text;

    // Common acronyms to preserve
    const acronyms = ['AI', 'HR', 'IT', 'API', 'UI', 'UX', 'CEO', 'CTO', 'VP', 'ATS', 'HRIS', 'PTO', 'FMLA', 'ROI', 'KPI', 'Q&A'];

    // Convert to lowercase first, then capitalize first letter
    let result = text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();

    // Restore acronyms
    acronyms.forEach(acronym => {
        const regex = new RegExp(`\\b${acronym}\\b`, 'gi');
        result = result.replace(regex, acronym);
    });

    return result;
};

const AIProjectAdvisor = () => {
    const [concept, setConcept] = useState('');
    const [workflowTitle, setWorkflowTitle] = useState('');
    const [currentSlug, setCurrentSlug] = useState('');
    const [currentPersona, setCurrentPersona] = useState(null);
    const [analysis, setAnalysis] = useState(null);
    const [selectedPrinciples, setSelectedPrinciples] = useState([]);
    const [industry, setIndustry] = useState('generic');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [showTemplates, setShowTemplates] = useState(true);
    const [showAllTemplates, setShowAllTemplates] = useState(false);
    const [collapsed, setCollapsed] = useState({
        ooux: false,
        principles: false,
        technical: false,
        risks: false,
        examples: false
    });
    const [showMethodology, setShowMethodology] = useState(false);
    const [selectedTouchpoint, setSelectedTouchpoint] = useState(null);
    const [showShareModal, setShowShareModal] = useState(false);
    const [showDecisionFramework, setShowDecisionFramework] = useState(false);
    const [showGlossary, setShowGlossary] = useState(false);
    const [selectedGlossaryTerm, setSelectedGlossaryTerm] = useState(null);
    const [pageTitle, setPageTitle] = useState('AI project advisor');
    const [showJumpMenu, setShowJumpMenu] = useState(false);
    const [activeSection, setActiveSection] = useState('overview');
    const [complexityFilter, setComplexityFilter] = useState('all');
    const [portfolioFilter, setPortfolioFilter] = useState('all');
    const [personaFilter, setPersonaFilter] = useState('all');
    const [navGroupsExpanded, setNavGroupsExpanded] = useState({
        essentials: true,
        implementation: true,
        design: true
    });
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [passwordError, setPasswordError] = useState(false);

    // Check for stored authentication on mount
    React.useEffect(() => {
        const auth = sessionStorage.getItem('aiadvisor_auth');
        if (auth === 'greatscott') {
            setIsAuthenticated(true);
        }
    }, []);

    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        if (passwordInput.toLowerCase() === 'greatscott') {
            setIsAuthenticated(true);
            sessionStorage.setItem('aiadvisor_auth', 'greatscott');
            setPasswordError(false);
        } else {
            setPasswordError(true);
            setPasswordInput('');
            // Shake animation
            setTimeout(() => setPasswordError(false), 500);
        }
    };

    // Focus traps for modals
    const touchpointModalRef = useFocusTrap(!!selectedTouchpoint);
    const methodologyModalRef = useFocusTrap(showMethodology);
    const glossaryModalRef = useFocusTrap(showGlossary);
    const frameworkModalRef = useFocusTrap(showDecisionFramework);

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

    // Load analysis from URL (clean path or query params) on mount
    React.useEffect(() => {
        const loadFromUrl = () => {
            const path = window.location.pathname;

            // Check if we're at the root /aiadvisor path or /aiadvisor/app.html
            if (path === '/aiadvisor' || path === '/aiadvisor/' || path === '/aiadvisor/app.html') {
                // Reset to clean state
                setAnalysis(null);
                setWorkflowTitle('');
                setCurrentSlug('');
                setIsAnalyzing(false);
                setShowTemplates(true);
                setShowAllTemplates(false);
                setPageTitle('AI project advisor');
                document.title = 'AI project advisor - Universal intelligence workflows';
                return;
            }

            // Match both /aiadvisor/industry/template AND /industry/template patterns
            const match = path.match(/^(?:\/aiadvisor)?\/([^\/]+)\/([^\/]+)\/?$/);

            if (match) {
                const [, industrySlug, templateSlug] = match;

                // Find the template by slug
                const templates = TEMPLATES[industrySlug];
                if (templates) {
                    const template = templates.find(t => t.slug === templateSlug);
                    if (template) {
                        // Update page title
                        document.title = `${template.title} - AI Project Advisor`;

                        setIndustry(industrySlug);
                        setConcept(template.concept);
                        setPageTitle(template.title);
                        setWorkflowTitle(template.title);
                        setCurrentSlug(template.slug);
                        setShowTemplates(false);
                        const result = analyzeProject(template.concept, industrySlug, template.slug);
                        setAnalysis(result);
                        setSelectedPrinciples(result.recommended);
                        return;
                    }
                }
            }

            // Fallback to old URL parsing for backwards compatibility
            const pathParts = window.location.pathname.split('/').filter(p => p);
            let sharedConcept = null;
            let sharedIndustry = null;

            // Check for clean URL format (last two segments)
            if (pathParts.length >= 2) {
                const potentialIndustry = pathParts[pathParts.length - 2];
                const potentialConcept = decodeURIComponent(pathParts[pathParts.length - 1]);

                // Validate industry is one we support
                if (['generic', 'hcm', 'finance', 'healthcare', 'retail'].includes(potentialIndustry)) {
                    sharedIndustry = potentialIndustry;
                    sharedConcept = potentialConcept;
                }
            }

            // Fallback to query params if clean URL not found
            if (!sharedConcept) {
                const params = new URLSearchParams(window.location.search);
                sharedConcept = params.get('concept');
                sharedIndustry = params.get('industry');
            }

            if (sharedConcept) {
                setConcept(sharedConcept);
                if (sharedIndustry) {
                    setIndustry(sharedIndustry);
                }
                // Auto-analyze after a short delay
                setTimeout(() => {
                    setIsAnalyzing(true);
                    setShowTemplates(false);
                    setTimeout(() => {
                        const result = analyzeProject(sharedConcept, sharedIndustry || 'generic', sharedSlug);
                        setAnalysis(result);
                        setSelectedPrinciples(result.recommended);
                        setIsAnalyzing(false);
                    }, 500);
                }, 100);
            }
        };

        // Load on mount
        loadFromUrl();

        // Handle browser back/forward buttons
        const handlePopState = () => {
            loadFromUrl();
        };

        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, []);

    // Track active section based on scroll position
    React.useEffect(() => {
        if (!analysis) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveSection(entry.target.id);
                    }
                });
            },
            {
                rootMargin: '-20% 0px -60% 0px',
                threshold: 0
            }
        );

        // Observe all section elements (in DOM order for correct highlighting)
        const sections = [
            'overview',
            'executive-summary',
            'ooux',
            'principles',
            'ai-type-detail',
            'user-interaction-detail',
            'complexity',
            'technical',
            'risks',
            'examples',
            'user-research',
            'ethical',
            'error-handling',
            'accessibility',
            'confidence-scoring',
            'action-plan'
        ];

        sections.forEach((id) => {
            const element = document.getElementById(id);
            if (element) {
                observer.observe(element);
            }
        });

        return () => {
            sections.forEach((id) => {
                const element = document.getElementById(id);
                if (element) {
                    observer.unobserve(element);
                }
            });
        };
    }, [analysis]);

    // Generate shareable URL with clean path
    const generateShareUrl = () => {
        // If we have a slug (from template), use it; otherwise encode the concept
        const urlSegment = currentSlug || encodeURIComponent(concept.trim());
        // Get the base path (everything before any existing industry/concept)
        let basePath = window.location.pathname;
        // Remove any trailing slash
        basePath = basePath.replace(/\/$/, '');
        // Remove any existing industry/concept path segments
        basePath = basePath.replace(/\/(generic|hcm|finance|healthcare|retail)\/[^\/]*$/, '');
        // Ensure basePath ends without a trailing slash for clean concatenation
        const cleanPath = `${basePath}/${industry}/${urlSegment}`;
        return `${window.location.origin}${cleanPath}`;
    };

    const handleShare = () => {
        const url = generateShareUrl();
        console.log('Sharing URL:', url); // Debug
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(url).then(() => {
                setShowShareModal(true);
                setTimeout(() => setShowShareModal(false), 3000);
            }).catch(err => {
                console.error('Failed to copy:', err);
                alert(`Copy this URL: ${url}`);
            });
        } else {
            // Fallback for browsers without clipboard API
            alert(`Copy this URL: ${url}`);
        }
    };

    const handleAnalyze = () => {
        setIsAnalyzing(true);
        setShowTemplates(false);
        // Simulate async analysis with a short delay for UX
        setTimeout(() => {
            const result = analyzeProject(concept, industry, null);
            setAnalysis(result);
            setSelectedPrinciples(result.recommended);
            setIsAnalyzing(false);
        }, 500);
    };

    const handleEditConcept = () => {
        window.history.pushState({}, '', '/aiadvisor/app.html');
        setAnalysis(null);
        setWorkflowTitle('');
        setCurrentSlug('');
        setIsAnalyzing(false);
        setShowTemplates(true);
        setShowAllTemplates(false);
        setPageTitle('AI project advisor');
        document.title = 'AI project advisor - Universal intelligence workflows';
    };

    const handleTemplateClick = (template) => {
        // Update URL to clean slug-based path
        const newUrl = `/aiadvisor/${industry}/${template.slug}`;
        window.history.pushState({}, '', newUrl);

        // Update page title
        document.title = `${template.title} - AI Project Advisor`;

        setConcept(template.concept);
        setWorkflowTitle(template.title);
        setCurrentSlug(template.slug);
        setCurrentPersona(template.persona || null);
        setShowTemplates(false);
        setIsAnalyzing(true);

        // Auto-analyze after setting the concept
        setTimeout(() => {
            const result = analyzeProject(template.concept, industry, template.slug);
            setAnalysis(result);
            setSelectedPrinciples(result.recommended);
            setPageTitle(template.title);
            setIsAnalyzing(false);
            // Scroll to results after analysis
            setTimeout(() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }, 100);
        }, 500);
    };

    const toggleSection = (section) => {
        setCollapsed(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const toggleNavGroup = (group) => {
        setNavGroupsExpanded(prev => ({
            ...prev,
            [group]: !prev[group]
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
            setActiveSection(sectionId);
            setShowJumpMenu(false); // Close mobile menu after selection
        }
    };

    // Password screen
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 flex items-center justify-center p-6">
                <div className="max-w-md w-full">
                    <div className="bg-white rounded-lg shadow-2xl p-8 transform transition-all">
                        <div className="text-center mb-8">
                            <div className="text-6xl mb-4">⚡</div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Project Advisor</h1>
                            <p className="text-gray-600">1.21 gigawatts of AI wisdom</p>
                        </div>

                        <form onSubmit={handlePasswordSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                    Enter password to access
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    value={passwordInput}
                                    onChange={(e) => setPasswordInput(e.target.value)}
                                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                                        passwordError ? 'border-red-500 animate-shake' : 'border-gray-300'
                                    }`}
                                    placeholder="Enter password"
                                    autoFocus
                                />
                                {passwordError && (
                                    <p className="mt-2 text-sm text-red-600 font-medium">
                                        ⚠️ Incorrect password. Try again!
                                    </p>
                                )}
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105 transition-all shadow-lg"
                            >
                                Access Advisor
                            </button>
                        </form>

                        <div className="mt-6 text-center">
                            <p className="text-sm text-gray-500 italic">
                                "Where we're going, we don't need roads..."
                            </p>
                        </div>
                    </div>
                </div>

                <style>{`
                    @keyframes shake {
                        0%, 100% { transform: translateX(0); }
                        10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
                        20%, 40%, 60%, 80% { transform: translateX(10px); }
                    }
                    .animate-shake {
                        animation: shake 0.5s;
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
            <a href="#main-content" className="skip-link">
                Skip to main content
            </a>

            {/* Full-width Header */}
            {!analysis && (
                <div className="bg-white shadow-md mb-4 sm:mb-6">
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
                        <div className="text-center">
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
                                <div className="text-4xl sm:text-5xl">⚡</div>
                                <div>
                                    <h1 id="input-heading" className="text-3xl sm:text-5xl font-bold text-gray-800">{pageTitle}</h1>
                                    <p className="text-xs sm:text-sm text-gray-600 italic mt-1">1.21 gigawatts of AI wisdom</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
                {/* Hero Description */}
                {!analysis && (
                    <div className="mb-4 sm:mb-6">
                        <p className="text-sm sm:text-base md:text-lg text-gray-700 mb-4 sm:mb-6 leading-relaxed">
                            Start with your industry and a common workflow. This tool then maps out the AI behind it; explaining how it works, how hard it is to build, and what designers and engineers should plan for.
                        </p>
                        <div className="bg-indigo-50 border-l-4 border-indigo-500 p-3 sm:p-4">
                            <p className="text-xs sm:text-sm text-gray-700">
                                <span className="font-semibold text-indigo-900">For designers:</span> This tool helps you understand the technical implications of AI features, anticipate UX challenges, and collaborate effectively with engineering teams.
                            </p>
                        </div>
                    </div>
                )}

                {/* Main Input Section */}
                {!analysis && (
                    <section aria-labelledby="input-heading" className="bg-white rounded-lg shadow-xl p-4 sm:p-6 md:p-8 mb-4 sm:mb-6">
                        <div className="text-sm font-semibold text-indigo-600 uppercase tracking-wide mb-2">Step 1</div>
                        <label htmlFor="industry-select" className="block text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
                            Choose your industry
                        </label>
                        <p className="text-base text-gray-600 mb-6">This tailors workflows, examples, and terminology to your domain</p>
                        <select
                            id="industry-select"
                            value={industry}
                            onChange={(e) => setIndustry(e.target.value)}
                            className="w-full pl-5 py-4 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white mb-6"
                            aria-label="Select industry for analysis"
                        >
                            <option value="generic">Generic (Domain Agnostic)</option>
                            <option value="hcm">Human Capital Management</option>
                            <option value="finance">Finance</option>
                            <option value="healthcare">Healthcare (Coming Soon)</option>
                            <option value="retail">Retail (Coming Soon)</option>
                        </select>

                        <div className="pt-6 border-t border-gray-200">
                            <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
                                <button
                                    onClick={() => setShowDecisionFramework(true)}
                                    className="text-sm text-purple-600 hover:text-purple-700 underline flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Should I use AI?
                                </button>
                                <span className="hidden sm:inline text-gray-400">•</span>
                                <button
                                    onClick={() => setShowGlossary(true)}
                                    className="text-sm text-blue-600 hover:text-blue-700 underline flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                    </svg>
                                    AI terms glossary
                                </button>
                            </div>
                        </div>
                    </section>
                )}

                {/* Templates Gallery */}
                {!analysis && TEMPLATES[industry] && (
                    <section aria-labelledby="templates-heading" className="bg-white rounded-lg shadow-xl p-4 sm:p-6 md:p-8 mb-4 sm:mb-6">
                        <div className="mb-6">
                            <div className="mb-4">
                                <div className="text-sm font-semibold text-indigo-600 uppercase tracking-wide mb-2">Step 2</div>
                                <h2 id="templates-heading" className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Start with a proven pattern</h2>
                                <p className="text-base text-gray-600 mt-1">Pre-built workflows based on common <GlossaryText text="AI" onTermClick={(key) => { setSelectedGlossaryTerm(key); setShowGlossary(true); }} /> use cases in {industry === 'generic' ? 'all industries' : industry === 'hcm' ? 'HR' : industry}</p>
                            </div>

                            {/* Filters - Full width below header */}
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <div className="flex items-center gap-2 mb-3">
                                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                    </svg>
                                    <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Filter workflows</span>
                                </div>
                                <div className={`grid gap-3 ${industry === 'hcm' ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'}`}>
                                    <div>
                                        <label htmlFor="complexity-filter" className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1.5">Complexity</label>
                                        <select
                                            id="complexity-filter"
                                            value={complexityFilter}
                                            onChange={(e) => setComplexityFilter(e.target.value)}
                                            className="w-full pl-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                                        >
                                            <option value="all">All complexities</option>
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                        </select>
                                    </div>

                                    {industry === 'hcm' && (
                                        <>
                                            <div>
                                                <label htmlFor="portfolio-filter" className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1.5">Portfolio</label>
                                                <select
                                                    id="portfolio-filter"
                                                    value={portfolioFilter}
                                                    onChange={(e) => setPortfolioFilter(e.target.value)}
                                                    className="w-full pl-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                                                >
                                                    <option value="all">All portfolios</option>
                                                    <option value="Core HR">Core HR</option>
                                                    <option value="Time & Attendance">Time & Attendance</option>
                                                    <option value="Payroll">Payroll</option>
                                                    <option value="Benefits">Benefits</option>
                                                    <option value="Recruiting">Recruiting</option>
                                                    <option value="Performance">Performance</option>
                                                    <option value="Compensation">Compensation</option>
                                                    <option value="Learning">Learning</option>
                                                    <option value="HR Analytics">HR Analytics</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label htmlFor="persona-filter" className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1.5">User perspective</label>
                                                <select
                                                    id="persona-filter"
                                                    value={personaFilter}
                                                    onChange={(e) => setPersonaFilter(e.target.value)}
                                                    className="w-full pl-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                                                >
                                                    <option value="all">All users</option>
                                                    <option value="Employee">Employee</option>
                                                    <option value="Admin">Admin/Manager</option>
                                                </select>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4" role="list">
                            {(() => {
                                const filtered = TEMPLATES[industry].filter(template => {
                                    const matchesComplexity = complexityFilter === 'all' || template.complexity === complexityFilter;
                                    const matchesPortfolio = portfolioFilter === 'all' || template.portfolio === portfolioFilter;
                                    const matchesPersona = personaFilter === 'all' || template.persona === personaFilter;
                                    return matchesComplexity && matchesPortfolio && matchesPersona;
                                });
                                return (showAllTemplates ? filtered : filtered.slice(0, 6)).map((template, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleTemplateClick(template)}
                                    className="text-left p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all group"
                                    role="listitem"
                                    aria-label={`${template.title}: ${template.description}. Complexity: ${template.complexity}. Click to analyze.`}
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
                                    <h3 className="font-semibold text-gray-800 mb-1 group-hover:text-indigo-600">{toSentenceCase(template.title)}</h3>
                                    <p className="text-xs text-gray-600">{template.description}</p>
                                </button>
                                ));
                            })()}
                        </div>
                        {(() => {
                            const filteredTemplates = TEMPLATES[industry].filter(template => {
                                const matchesComplexity = complexityFilter === 'all' || template.complexity === complexityFilter;
                                const matchesPortfolio = portfolioFilter === 'all' || template.portfolio === portfolioFilter;
                                const matchesPersona = personaFilter === 'all' || template.persona === personaFilter;
                                return matchesComplexity && matchesPortfolio && matchesPersona;
                            });
                            const hasMore = filteredTemplates.length > 6;

                            if (filteredTemplates.length === 0) {
                                return (
                                    <p className="text-center text-gray-500 py-8">
                                        No patterns match the selected complexity level.
                                    </p>
                                );
                            }

                            if (hasMore && !showAllTemplates) {
                                return (
                                    <div className="text-center mt-6">
                                        <button
                                            onClick={() => setShowAllTemplates(true)}
                                            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                                            aria-label={`Show ${filteredTemplates.length - 6} more workflow patterns`}
                                        >
                                            Show {filteredTemplates.length - 6} more patterns
                                        </button>
                                    </div>
                                );
                            }

                            if (hasMore && showAllTemplates) {
                                return (
                                    <div className="text-center mt-6">
                                        <button
                                            onClick={() => setShowAllTemplates(false)}
                                            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                                        >
                                            Show less
                                        </button>
                                    </div>
                                );
                            }

                            return null;
                        })()}
                    </section>
                )}

                {/* Results Section */}
                {analysis && (
                    <>
                        <div role="status" aria-live="polite" className="sr-only">
                            Analysis complete. Results are now displayed.
                        </div>

                        {/* Navigation */}
                        <div className="mb-6 flex items-center justify-between">
                            <button
                                onClick={handleEditConcept}
                                className="text-indigo-600 hover:text-indigo-700 font-medium inline-flex items-center gap-2"
                                aria-label="Go back to select a different workflow pattern"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                Back
                            </button>
                            <button
                                onClick={handleShare}
                                className="text-green-600 hover:text-green-700 font-medium inline-flex items-center gap-2"
                                aria-label="Copy shareable link to clipboard"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                </svg>
                                Share link
                            </button>
                        </div>

                        {/* Page Title for Analysis View */}
                        <div className="mb-6">
                            <div className="flex flex-wrap items-center gap-3 mb-3">
                                <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">{toSentenceCase(pageTitle)}</h1>
                                {currentPersona && (
                                    <span className={`text-xs sm:text-sm px-3 py-1 rounded-full font-semibold ${
                                        currentPersona === 'Employee' ? 'bg-blue-100 text-blue-700 border-2 border-blue-300' :
                                        currentPersona === 'Admin' ? 'bg-purple-100 text-purple-700 border-2 border-purple-300' :
                                        'bg-green-100 text-green-700 border-2 border-green-300'
                                    }`}>
                                        {currentPersona === 'Admin' ? 'Admin/Manager' : currentPersona}
                                    </span>
                                )}
                            </div>
                            {analysis.executiveSummary && analysis.executiveSummary.whatItDoes && (
                                <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                                    <GlossaryText
                                        text={analysis.executiveSummary.whatItDoes}
                                        onTermClick={(key) => { setSelectedGlossaryTerm(key); setShowGlossary(true); }}
                                    />
                                </p>
                            )}
                        </div>

                        {/* Consolidated Header: Analysis Info + Pattern + Jump Nav */}
                        <section id="main-content" aria-labelledby="results-heading" className="bg-white rounded-lg shadow-lg mb-6 overflow-hidden">
                            <h2 id="results-heading" className="sr-only">Analysis results</h2>

                            {/* Detected Pattern Banner */}
                            <div className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-4 py-4">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                    <div className="flex-1">
                                        <div className="text-xs sm:text-sm opacity-90 mb-1 uppercase tracking-wide">Detected Pattern</div>
                                        <div className="text-base sm:text-lg font-bold">{analysis.detectedPattern}</div>
                                    </div>
                                    <button
                                        onClick={() => setShowMethodology(true)}
                                        className="text-white hover:text-cyan-100 font-medium inline-flex items-center gap-2 text-sm sm:text-base"
                                        aria-label="Learn how the AI Project Advisor works"
                                    >
                                        <Icon name="Lightbulb" />
                                        <span className="hidden sm:inline">How does this work?</span>
                                        <span className="sm:hidden">How it works</span>
                                    </button>
                                </div>
                            </div>
                        </section>

                        {/* Mobile Jump Navigation Dropdown */}
                        <div className="lg:hidden mb-6">
                            <button
                                onClick={() => setShowJumpMenu(!showJumpMenu)}
                                className="w-full bg-white rounded-lg shadow-lg px-4 py-3 flex items-center justify-between text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                <span>Jump to section</span>
                                <svg className={`w-5 h-5 transition-transform ${showJumpMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            {showJumpMenu && (
                                <nav className="mt-2 bg-white rounded-lg shadow-lg overflow-hidden" aria-label="Mobile navigation to analysis sections">
                                    <div className="px-3 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">🎯 Strategy</div>
                                    <button onClick={() => { scrollToSection('overview'); setShowJumpMenu(false); }} className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-indigo-50 border-b border-gray-100">Overview</button>
                                    <button onClick={() => { scrollToSection('executive-summary'); setShowJumpMenu(false); }} className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-indigo-50 border-b border-gray-100">At-a-glance</button>
                                    <button onClick={() => { scrollToSection('ooux'); setShowJumpMenu(false); }} className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-cyan-50 border-b border-gray-100">Data & user flows</button>
                                    <button onClick={() => { scrollToSection('principles'); setShowJumpMenu(false); }} className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-purple-50 border-b border-gray-100">Design Principles</button>

                                    <div className="px-3 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">⚙️ Implementation</div>
                                    <button onClick={() => { scrollToSection('ai-type-detail'); setShowJumpMenu(false); }} className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-indigo-50 border-b border-gray-100">AI Type</button>
                                    <button onClick={() => { scrollToSection('user-interaction-detail'); setShowJumpMenu(false); }} className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-purple-50 border-b border-gray-100">User Interaction</button>
                                    <button onClick={() => { scrollToSection('complexity'); setShowJumpMenu(false); }} className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-yellow-50 border-b border-gray-100">Complexity</button>
                                    <button onClick={() => { scrollToSection('technical'); setShowJumpMenu(false); }} className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-orange-50 border-b border-gray-100">Technical</button>
                                    <button onClick={() => { scrollToSection('risks'); setShowJumpMenu(false); }} className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-red-50 border-b border-gray-100">Risks</button>
                                    <button onClick={() => { scrollToSection('examples'); setShowJumpMenu(false); }} className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-yellow-50 border-b border-gray-100">Examples</button>

                                    <div className="px-3 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">🎨 Design</div>
                                    <button onClick={() => { scrollToSection('user-research'); setShowJumpMenu(false); }} className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-purple-50 border-b border-gray-100">User Research</button>
                                    <button onClick={() => { scrollToSection('ethical'); setShowJumpMenu(false); }} className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-orange-50 border-b border-gray-100">Ethical & Bias</button>
                                    <button onClick={() => { scrollToSection('error-handling'); setShowJumpMenu(false); }} className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-yellow-50 border-b border-gray-100">Error Handling</button>
                                    <button onClick={() => { scrollToSection('accessibility'); setShowJumpMenu(false); }} className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-indigo-50 border-b border-gray-100">Accessibility</button>
                                    <button onClick={() => { scrollToSection('confidence-scoring'); setShowJumpMenu(false); }} className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-blue-50 border-b border-gray-100">Confidence Scoring</button>
                                    <button onClick={() => { scrollToSection('action-plan'); setShowJumpMenu(false); }} className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-green-50">Action Plan</button>
                                </nav>
                            )}
                        </div>

                        {/* Desktop: Floating Sidebar + Main Content */}
                        <div className="lg:flex lg:gap-6 lg:items-start">
                            {/* Floating Jump Navigation - Desktop Only */}
                            <nav aria-label="Desktop navigation to analysis sections" className="hidden lg:block lg:sticky lg:top-6 lg:w-48 flex-shrink-0">
                                <div className="bg-white rounded-lg shadow-lg p-4">
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">On this page</h3>
                                    <div className="space-y-2">

                                        {/* Strategy & Planning */}
                                        <div>
                                            <button
                                                onClick={() => toggleNavGroup('essentials')}
                                                className="w-full text-left px-2 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 rounded flex items-center justify-between"
                                            >
                                                <span>🎯 Strategy</span>
                                                <span className="text-gray-400">{navGroupsExpanded.essentials ? '−' : '+'}</span>
                                            </button>
                                            {navGroupsExpanded.essentials && (
                                                <div className="ml-2 mt-1 space-y-1">
                                                    <button onClick={() => scrollToSection('overview')} className={`w-full text-left px-3 py-1.5 text-sm rounded transition-colors ${activeSection === 'overview' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>Overview</button>
                                                    <button onClick={() => scrollToSection('executive-summary')} className={`w-full text-left px-3 py-1.5 text-sm rounded transition-colors ${activeSection === 'executive-summary' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>At-a-glance</button>
                                                    <button onClick={() => scrollToSection('ooux')} className={`w-full text-left px-3 py-1.5 text-sm rounded transition-colors ${activeSection === 'ooux' ? 'bg-cyan-50 text-cyan-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>Data & user flows</button>
                                                    <button onClick={() => scrollToSection('principles')} className={`w-full text-left px-3 py-1.5 text-sm rounded transition-colors ${activeSection === 'principles' ? 'bg-purple-50 text-purple-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>Design Principles</button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Implementation Details */}
                                        <div>
                                            <button
                                                onClick={() => toggleNavGroup('implementation')}
                                                className="w-full text-left px-2 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 rounded flex items-center justify-between"
                                            >
                                                <span>⚙️ Implementation</span>
                                                <span className="text-gray-400">{navGroupsExpanded.implementation ? '−' : '+'}</span>
                                            </button>
                                            {navGroupsExpanded.implementation && (
                                                <div className="ml-2 mt-1 space-y-1">
                                                    <button onClick={() => scrollToSection('ai-type-detail')} className={`w-full text-left px-3 py-1.5 text-sm rounded transition-colors ${activeSection === 'ai-type-detail' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>AI Type</button>
                                                    <button onClick={() => scrollToSection('user-interaction-detail')} className={`w-full text-left px-3 py-1.5 text-sm rounded transition-colors ${activeSection === 'user-interaction-detail' ? 'bg-purple-50 text-purple-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>User Interaction</button>
                                                    <button onClick={() => scrollToSection('complexity')} className={`w-full text-left px-3 py-1.5 text-sm rounded transition-colors ${activeSection === 'complexity' ? 'bg-yellow-50 text-yellow-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>Complexity</button>
                                                    <button onClick={() => scrollToSection('technical')} className={`w-full text-left px-3 py-1.5 text-sm rounded transition-colors ${activeSection === 'technical' ? 'bg-orange-50 text-orange-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>Technical</button>
                                                    <button onClick={() => scrollToSection('risks')} className={`w-full text-left px-3 py-1.5 text-sm rounded transition-colors ${activeSection === 'risks' ? 'bg-red-50 text-red-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>Risks</button>
                                                    <button onClick={() => scrollToSection('examples')} className={`w-full text-left px-3 py-1.5 text-sm rounded transition-colors ${activeSection === 'examples' ? 'bg-yellow-50 text-yellow-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>Examples</button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Design & Validation */}
                                        <div>
                                            <button
                                                onClick={() => toggleNavGroup('design')}
                                                className="w-full text-left px-2 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 rounded flex items-center justify-between"
                                            >
                                                <span>🎨 Design</span>
                                                <span className="text-gray-400">{navGroupsExpanded.design ? '−' : '+'}</span>
                                            </button>
                                            {navGroupsExpanded.design && (
                                                <div className="ml-2 mt-1 space-y-1">
                                                    <button onClick={() => scrollToSection('user-research')} className={`w-full text-left px-3 py-1.5 text-sm rounded transition-colors ${activeSection === 'user-research' ? 'bg-purple-50 text-purple-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>User Research</button>
                                                    <button onClick={() => scrollToSection('ethical')} className={`w-full text-left px-3 py-1.5 text-sm rounded transition-colors ${activeSection === 'ethical' ? 'bg-orange-50 text-orange-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>Ethical & Bias</button>
                                                    <button onClick={() => scrollToSection('error-handling')} className={`w-full text-left px-3 py-1.5 text-sm rounded transition-colors ${activeSection === 'error-handling' ? 'bg-yellow-50 text-yellow-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>Error Handling</button>
                                                    <button onClick={() => scrollToSection('accessibility')} className={`w-full text-left px-3 py-1.5 text-sm rounded transition-colors ${activeSection === 'accessibility' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>Accessibility</button>
                                                    <button onClick={() => scrollToSection('confidence-scoring')} className={`w-full text-left px-3 py-1.5 text-sm rounded transition-colors ${activeSection === 'confidence-scoring' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>Confidence Scoring</button>
                                                    <button onClick={() => scrollToSection('action-plan')} className={`w-full text-left px-3 py-1.5 text-sm rounded transition-colors ${activeSection === 'action-plan' ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>Action Plan</button>
                                                </div>
                                            )}
                                        </div>

                                    </div>
                                </div>
                            </nav>

                            {/* Main Content Area */}
                            <div className="flex-1 space-y-6 min-w-0">

                            {/* AI Type, Interaction & Complexity */}
                            <div id="overview" className="grid md:grid-cols-3 gap-6">
                            <button
                                onClick={() => scrollToSection('ai-type-detail')}
                                className="bg-white rounded-lg shadow-lg p-6 text-left hover:shadow-xl transition-shadow cursor-pointer"
                            >
                                <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center">
                                    <Icon name="Brain" />
                                    <span className="ml-2"><GlossaryText text="AI" onTermClick={(key) => { setSelectedGlossaryTerm(key); setShowGlossary(true); }} /> type</span>
                                </h3>
                                <div className="text-2xl font-bold text-indigo-600 mb-3">
                                    <GlossaryText
                                        text={analysis.aiType}
                                        onTermClick={(key) => { setSelectedGlossaryTerm(key); setShowGlossary(true); }}
                                    />
                                </div>
                                <p className="text-xs text-indigo-600 underline">
                                    View details
                                </p>
                            </button>

                            <button
                                onClick={() => scrollToSection('user-interaction-detail')}
                                className="bg-white rounded-lg shadow-lg p-6 text-left hover:shadow-xl transition-shadow cursor-pointer"
                            >
                                <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center">
                                    <Icon name="Users" />
                                    <span className="ml-2">User interaction</span>
                                </h3>
                                <div className="text-2xl font-bold text-purple-600 mb-3 capitalize">
                                    <GlossaryText
                                        text={analysis.visibility}
                                        onTermClick={(key) => { setSelectedGlossaryTerm(key); setShowGlossary(true); }}
                                    />
                                </div>
                                <p className="text-xs text-purple-600 underline">
                                    View details
                                </p>
                            </button>

                            <button
                                onClick={() => scrollToSection('complexity')}
                                className="bg-white rounded-lg shadow-lg p-6 text-left hover:shadow-xl transition-shadow cursor-pointer"
                            >
                                <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center">
                                    <Icon name="Wrench" />
                                    <span className="ml-2">Complexity</span>
                                </h3>
                                <div className="flex items-baseline gap-2 mb-3">
                                    <div className={`text-2xl font-bold ${
                                        analysis.complexity.level === 'Low' ? 'text-green-600' :
                                        analysis.complexity.level === 'Medium' ? 'text-yellow-600' :
                                        'text-red-600'
                                    }`}>{analysis.complexity.level}</div>
                                    <div className="text-sm text-gray-500">({analysis.complexity.score}/100)</div>
                                </div>
                                <p className={`text-xs underline ${
                                    analysis.complexity.level === 'Low' ? 'text-green-600' :
                                    analysis.complexity.level === 'Medium' ? 'text-yellow-600' :
                                    'text-red-600'
                                }`}>
                                    View breakdown
                                </p>
                            </button>
                        </div>

                        {/* At-a-glance Summary */}
                        {analysis.executiveSummary && (
                            <div id="executive-summary" className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg shadow-lg p-6 border-l-4 border-indigo-500 mb-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-gray-900 flex items-center">
                                        <Icon name="Lightbulb" />
                                        <span className="ml-2">At-a-glance</span>
                                    </h3>
                                    <button
                                        onClick={() => toggleSection('executive-summary')}
                                        className="text-sm text-gray-600 hover:text-gray-800 font-medium"
                                    >
                                        {collapsed['executive-summary'] ? 'Expand' : 'Collapse'}
                                    </button>
                                </div>
                                {!collapsed['executive-summary'] && (
                                <div className="space-y-4">
                                    <div className="bg-white bg-opacity-60 rounded p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-green-600 text-lg">✓</span>
                                            <span className="font-semibold text-gray-700">Why use this</span>
                                        </div>
                                        <span className="text-green-700 font-medium">
                                            <GlossaryText
                                                text={analysis.executiveSummary.primaryBenefit}
                                                onTermClick={(key) => { setSelectedGlossaryTerm(key); setShowGlossary(true); }}
                                            />
                                        </span>
                                    </div>
                                    <div className="bg-white bg-opacity-60 rounded p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-red-600 text-lg">⚠</span>
                                            <span className="font-semibold text-gray-700">Watch out for</span>
                                        </div>
                                        <span className="text-red-700">
                                            <GlossaryText
                                                text={analysis.executiveSummary.biggestRisk}
                                                onTermClick={(key) => { setSelectedGlossaryTerm(key); setShowGlossary(true); }}
                                            />
                                        </span>
                                    </div>
                                    <div className="bg-white bg-opacity-60 rounded p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-indigo-600 text-lg">→</span>
                                            <span className="font-semibold text-gray-700">What to do next</span>
                                        </div>
                                        <span className="text-indigo-700 font-medium">
                                            <GlossaryText
                                                text={analysis.executiveSummary.nextStep}
                                                onTermClick={(key) => { setSelectedGlossaryTerm(key); setShowGlossary(true); }}
                                            />
                                        </span>
                                    </div>
                                </div>
                                )}
                            </div>
                        )}

                        {/* OOUX Workflow - Simplified for space */}
                        {analysis.oouxWorkflow && analysis.oouxWorkflow.objects.length > 0 && (
                            <div id="ooux" className="bg-white rounded-lg shadow-lg p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-gray-800 flex items-center mb-2">
                                            <Icon name="Box" />
                                            <span className="ml-2">Data & user flows</span>
                                        </h3>
                                        <p className="text-sm text-gray-600">See what data structures you'll need and how users and AI interact with them</p>
                                    </div>
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
                                    <h4 className="font-semibold text-gray-700 mb-3">Key objects</h4>
                                    <p className="text-xs text-gray-600 mb-4">The core data structures in your system, organized by their attributes</p>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        {analysis.oouxWorkflow.objects.slice(0, 6).map((obj, idx) => (
                                            <div key={idx} className="bg-white border-2 border-gray-300 rounded-lg shadow-lg overflow-hidden">
                                                {/* Object Header */}
                                                <div className="bg-blue-500 px-4 py-3">
                                                    <h5 className="font-bold text-white text-base uppercase tracking-wide">{obj.name}</h5>
                                                    <p className="text-xs text-blue-50 mt-1">
                                                        {obj.description}
                                                    </p>
                                                </div>

                                                {/* Object Body */}
                                                <div className="p-4 space-y-2">
                                                    {/* Core Content */}
                                                    {obj.coreContent && obj.coreContent.length > 0 && (
                                                        <div className="bg-pink-50 border-l-4 border-pink-400 rounded p-3">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <span className="text-xs font-bold text-pink-700 uppercase tracking-wide">Core Content</span>
                                                            </div>
                                                            <ul className="space-y-1">
                                                                {obj.coreContent.slice(0, 6).map((content, i) => (
                                                                    <li key={i} className="text-xs text-gray-800 flex items-start">
                                                                        <span className="text-pink-500 mr-2 font-bold">•</span>
                                                                        <span>{content}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}

                                                    {/* Metadata */}
                                                    {obj.metadata && obj.metadata.length > 0 && (
                                                        <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded p-3">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <span className="text-xs font-bold text-yellow-800 uppercase tracking-wide">Metadata</span>
                                                            </div>
                                                            <ul className="space-y-1">
                                                                {obj.metadata.slice(0, 4).map((meta, i) => (
                                                                    <li key={i} className="text-xs text-gray-800 flex items-start">
                                                                        <span className="text-yellow-500 mr-2 font-bold">•</span>
                                                                        <span>{meta}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}

                                                    {/* Actions */}
                                                    {obj.actions && obj.actions.length > 0 && (
                                                        <div className="bg-green-50 border-l-4 border-green-400 rounded p-3">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <span className="text-xs font-bold text-green-700 uppercase tracking-wide">Actions</span>
                                                            </div>
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {obj.actions.slice(0, 6).map((action, i) => (
                                                                    <span key={i} className="text-xs bg-white text-green-800 px-2.5 py-1 rounded-full border-2 border-green-400 font-semibold shadow-sm">{action}</span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Relationships */}
                                                    {obj.relationships && obj.relationships.length > 0 && (
                                                        <div className="bg-purple-50 border-l-4 border-purple-400 rounded p-3">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <span className="text-xs font-bold text-purple-700 uppercase tracking-wide">Relationships</span>
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                {obj.relationships.map((rel, i) => (
                                                                    <div key={i} className="text-xs text-gray-800 flex items-center gap-1.5">
                                                                        <span className="text-purple-600 font-bold">→</span>
                                                                        <span className="font-medium text-purple-700 bg-white px-2 py-0.5 rounded border border-purple-300">{rel.type.replace(/-/g, ' ')}</span>
                                                                        <span className="text-gray-400">→</span>
                                                                        <span className="font-semibold text-gray-900">{rel.target}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Blended OOUX + Workflow Visualization */}
                                <div className="mb-6">
                                    <h4 className="font-semibold text-gray-700 mb-3">Object journey</h4>
                                    <p className="text-xs text-gray-600 mb-4">See how objects flow through the workflow, from creation to final state</p>
                                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 overflow-x-auto">
                                        <div className="flex items-start gap-3 min-w-max">
                                            {analysis.oouxWorkflow.flow.map((step, idx) => {
                                                // Find which object is being acted upon in this step
                                                const relatedObject = analysis.oouxWorkflow.objects.find(obj =>
                                                    step.action.toLowerCase().includes(obj.name.toLowerCase()) ||
                                                    step.touchpoint?.toLowerCase().includes(obj.name.toLowerCase())
                                                ) || analysis.oouxWorkflow.objects[idx % analysis.oouxWorkflow.objects.length];

                                                return (
                                                    <React.Fragment key={idx}>
                                                        <div className="flex flex-col items-center w-48">
                                                            {/* Step indicator */}
                                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold mb-2 ${
                                                                step.actor === 'AI' ? 'bg-indigo-500 text-white' :
                                                                step.actor === 'User' || step.actor === 'Employee' ? 'bg-green-500 text-white' :
                                                                step.actor === 'Manager' ? 'bg-purple-500 text-white' :
                                                                'bg-gray-500 text-white'
                                                            }`}>
                                                                {step.step}
                                                            </div>

                                                            {/* Object card */}
                                                            <div className="bg-white border-2 border-blue-200 rounded-lg p-3 w-full shadow-sm">
                                                                <div className="text-xs font-bold text-blue-700 mb-1 text-center">{relatedObject.name}</div>
                                                                <div className="text-xs text-gray-600 mb-2 text-center line-clamp-2">{step.action}</div>
                                                                {relatedObject.coreContent && relatedObject.coreContent.length > 0 && (
                                                                    <div className="border-t border-blue-100 pt-2 mt-2">
                                                                        <div className="flex items-center gap-1 mb-1">
                                                                            <div className="w-1 h-3 bg-pink-400 rounded"></div>
                                                                            <span className="text-xs font-semibold text-pink-700">Data</span>
                                                                        </div>
                                                                        <ul className="space-y-0.5">
                                                                            {relatedObject.coreContent.slice(0, 2).map((content, i) => (
                                                                                <li key={i} className="text-xs text-gray-700 flex items-start">
                                                                                    <span className="text-pink-500 mr-1 text-xs">•</span>
                                                                                    <span className="line-clamp-1">{content}</span>
                                                                                </li>
                                                                            ))}
                                                                        </ul>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Actor label */}
                                                            <div className="text-xs mt-2 font-medium text-gray-700">{step.actor}</div>
                                                        </div>

                                                        {idx < analysis.oouxWorkflow.flow.length - 1 && (
                                                            <div className="flex items-center pt-8">
                                                                <div className="text-blue-400 text-2xl">→</div>
                                                            </div>
                                                        )}
                                                    </React.Fragment>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* Visual Workflow Diagram */}
                                <div className="mb-6">
                                    <h4 className="font-semibold text-gray-700 mb-3">Visual workflow</h4>
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
                                            <span className="ml-2">Workflow steps</span>
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
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="font-semibold text-gray-700"><GlossaryText text="AI" onTermClick={(key) => { setSelectedGlossaryTerm(key); setShowGlossary(true); }} /> touchpoints</h4>
                                        <span className="text-xs text-gray-500 italic">Click to learn more</span>
                                    </div>
                                    <ul className="space-y-1">
                                        {analysis.oouxWorkflow.aiTouchpoints.map((point, idx) => {
                                            const details = findTouchpointDetails(point);
                                            const hasDetails = details !== null;

                                            return (
                                                <li key={idx}>
                                                    <button
                                                        onClick={() => hasDetails && setSelectedTouchpoint({ text: point, details })}
                                                        className={`w-full flex items-start text-sm text-left ${
                                                            hasDetails
                                                                ? 'text-gray-700 hover:bg-indigo-50 p-2 rounded transition-colors cursor-pointer'
                                                                : 'text-gray-700 p-2'
                                                        }`}
                                                        disabled={!hasDetails}
                                                    >
                                                        <span className="text-indigo-500 mr-2 mt-0.5 flex-shrink-0">⚡</span>
                                                        <span className="flex-1">
                                                            <GlossaryText
                                                                text={point}
                                                                onTermClick={(key) => {
                                                                    setSelectedGlossaryTerm(key);
                                                                    setShowGlossary(true);
                                                                }}
                                                            />
                                                        </span>
                                                        {hasDetails && (
                                                            <svg className="w-4 h-4 text-indigo-400 flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>

                                {/* Configuration Needs */}
                                {analysis.oouxWorkflow.configurationNeeds && (
                                    <div>
                                        <h4 className="font-semibold text-gray-700 mb-3">Configuration needs</h4>
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
                            <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
                                <Icon name="CheckCircle" />
                                <span className="ml-2">Recommended design principles</span>
                            </h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Carnegie Mellon's proven guidelines for human-AI interaction design. Click to add or remove from your focus.
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
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                                    Your focus principles ({selectedPrinciples.length})
                                </h3>
                                <p className="text-sm text-gray-600 mb-4">Detailed guidelines and actionable tips for implementing each selected principle in your design</p>
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

                        {/* AI Type Detail */}
                        <div id="ai-type-detail" className="bg-white rounded-lg shadow-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
                                <Icon name="Brain" />
                                <span className="ml-2"><GlossaryText text="AI" onTermClick={(key) => { setSelectedGlossaryTerm(key); setShowGlossary(true); }} /> type details</span>
                            </h3>
                            <p className="text-sm text-gray-600 mb-4">Deep dive into the AI technology and approach for this workflow</p>
                            <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 mb-4">
                                <div className="text-xl font-bold text-indigo-700 mb-2">
                                    <GlossaryText
                                        text={analysis.aiType}
                                        onTermClick={(key) => { setSelectedGlossaryTerm(key); setShowGlossary(true); }}
                                    />
                                </div>
                                <p className="text-sm text-gray-700 mb-3">
                                    <GlossaryText
                                        text={analysis.aiTypeReason}
                                        onTermClick={(key) => { setSelectedGlossaryTerm(key); setShowGlossary(true); }}
                                    />
                                </p>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <h4 className="font-semibold text-gray-800 text-sm mb-2">What this means for your team:</h4>
                                    <ul className="space-y-2 text-sm text-gray-700">
                                        {analysis.aiType.includes('LLM') && (
                                            <>
                                                <li className="flex items-start"><span className="text-indigo-500 mr-2">•</span>Requires access to LLM APIs (OpenAI, Anthropic, etc.) or self-hosted models</li>
                                                <li className="flex items-start"><span className="text-indigo-500 mr-2">•</span>Plan for prompt engineering and ongoing refinement of AI responses</li>
                                                <li className="flex items-start"><span className="text-indigo-500 mr-2">•</span>Higher token costs; budget for API usage at scale</li>
                                                <li className="flex items-start"><span className="text-indigo-500 mr-2">•</span>Consider data privacy and compliance when sending data to third-party APIs</li>
                                            </>
                                        )}
                                        {analysis.aiType.includes('ML') && !analysis.aiType.includes('LLM') && (
                                            <>
                                                <li className="flex items-start"><span className="text-indigo-500 mr-2">•</span>Requires labeled training data for model development</li>
                                                <li className="flex items-start"><span className="text-indigo-500 mr-2">•</span>Plan for model training, validation, and ongoing monitoring</li>
                                                <li className="flex items-start"><span className="text-indigo-500 mr-2">•</span>Lower ongoing costs than LLMs but higher upfront ML expertise needed</li>
                                                <li className="flex items-start"><span className="text-indigo-500 mr-2">•</span>Model performance degrades over time; plan for retraining pipeline</li>
                                            </>
                                        )}
                                        {analysis.aiType.includes('Rule-Based') && (
                                            <>
                                                <li className="flex items-start"><span className="text-indigo-500 mr-2">•</span>Faster to implement with clear business logic</li>
                                                <li className="flex items-start"><span className="text-indigo-500 mr-2">•</span>Combine fixed rules with ML to balance predictability and intelligence</li>
                                                <li className="flex items-start"><span className="text-indigo-500 mr-2">•</span>Easier to explain decisions to users and auditors</li>
                                                <li className="flex items-start"><span className="text-indigo-500 mr-2">•</span>Rules need regular review and updates as business policies change</li>
                                            </>
                                        )}
                                    </ul>
                                </div>
                                <div className="bg-gray-50 p-3 rounded">
                                    <h4 className="font-semibold text-gray-800 text-sm mb-2">Key questions for engineering:</h4>
                                    <ul className="space-y-1 text-xs text-gray-600">
                                        <li>• What data do we need to collect and how will we label it?</li>
                                        <li>• Where will the AI model run (cloud, on-premise, edge)?</li>
                                        <li>• How will we monitor model performance and accuracy over time?</li>
                                        <li>• What's our fallback plan if the AI service is unavailable?</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* User Interaction Detail */}
                        <div id="user-interaction-detail" className="bg-white rounded-lg shadow-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
                                <Icon name="Users" />
                                <span className="ml-2">User interaction details</span>
                            </h3>
                            <p className="text-sm text-gray-600 mb-4">How users experience and interact with the AI throughout the workflow</p>
                            <div className="bg-purple-50 border-l-4 border-purple-500 p-4 mb-4">
                                <div className="text-xl font-bold text-purple-700 mb-2 capitalize">
                                    <GlossaryText
                                        text={analysis.visibility}
                                        onTermClick={(key) => { setSelectedGlossaryTerm(key); setShowGlossary(true); }}
                                    />
                                </div>
                                <p className="text-sm text-gray-700 mb-3">
                                    <GlossaryText
                                        text={analysis.visibilityReason}
                                        onTermClick={(key) => { setSelectedGlossaryTerm(key); setShowGlossary(true); }}
                                    />
                                </p>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <h4 className="font-semibold text-gray-800 text-sm mb-2">UX design implications:</h4>
                                    <ul className="space-y-2 text-sm text-gray-700">
                                        {analysis.visibility === 'co-pilot' && (
                                            <>
                                                <li className="flex items-start"><span className="text-purple-500 mr-2">•</span>Design for iterative collaboration between user and AI</li>
                                                <li className="flex items-start"><span className="text-purple-500 mr-2">•</span>Show AI reasoning and confidence levels transparently</li>
                                                <li className="flex items-start"><span className="text-purple-500 mr-2">•</span>Provide easy ways to refine, reject, or modify AI suggestions</li>
                                                <li className="flex items-start"><span className="text-purple-500 mr-2">•</span>Save interaction history so users can revisit past decisions</li>
                                                <li className="flex items-start"><span className="text-purple-500 mr-2">•</span>Requires more complex UI with richer affordances for interaction</li>
                                            </>
                                        )}
                                        {analysis.visibility === 'backstage' && (
                                            <>
                                                <li className="flex items-start"><span className="text-purple-500 mr-2">•</span>Focus on clear presentation of AI-generated results</li>
                                                <li className="flex items-start"><span className="text-purple-500 mr-2">•</span>Provide simple accept/reject or approve/deny actions</li>
                                                <li className="flex items-start"><span className="text-purple-500 mr-2">•</span>Show confidence scores to help users trust (or question) results</li>
                                                <li className="flex items-start"><span className="text-purple-500 mr-2">•</span>Allow users to see "why" behind AI decisions when needed</li>
                                                <li className="flex items-start"><span className="text-purple-500 mr-2">•</span>Simpler UI; AI works in background and surfaces final output</li>
                                            </>
                                        )}
                                    </ul>
                                </div>
                                <div className="bg-gray-50 p-3 rounded">
                                    <h4 className="font-semibold text-gray-800 text-sm mb-2">Design considerations:</h4>
                                    <ul className="space-y-1 text-xs text-gray-600">
                                        <li>• How will users know when AI is working vs. when it's done?</li>
                                        <li>• What happens when AI confidence is low or results are ambiguous?</li>
                                        <li>• How do we handle errors or unexpected AI behavior gracefully?</li>
                                        <li>• What level of AI explainability do users need for their role?</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Complexity Breakdown */}
                        <div id="complexity" className="bg-white rounded-lg shadow-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
                                <Icon name="Wrench" />
                                <span className="ml-2">Complexity breakdown</span>
                            </h3>
                            <p className="text-sm text-gray-600 mb-1">Factors contributing to implementation complexity and development effort</p>
                            <p className="text-xs text-gray-500 mb-4 italic">Each factor adds points to the total complexity score (0-100). Higher scores indicate more complex implementations.</p>
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
                                            <span className="text-sm font-bold text-gray-600" title="Points added to complexity score">+{factor.points}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                                <p className="text-xs text-gray-700">
                                    <span className="font-semibold">Total Complexity Score: {analysis.complexity.score}/100</span> —
                                    {analysis.complexity.level === 'Low' && ' Simple implementation with standard tools and approaches'}
                                    {analysis.complexity.level === 'Medium' && ' Moderate complexity requiring careful planning and skilled resources'}
                                    {analysis.complexity.level === 'High' && ' Complex implementation requiring advanced expertise and significant resources'}
                                </p>
                            </div>
                        </div>

                        {/* Technical, Risks, etc. - Condensed */}
                        <div id="technical" className="grid md:grid-cols-2 gap-6">
                            <div className="bg-white rounded-lg shadow-lg p-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">What engineering needs</h3>
                                <p className="text-xs text-gray-500 mb-3">Key engineering requirements to discuss with your development team</p>
                                <ul className="space-y-2">
                                    {analysis.technical.map((item, idx) => (
                                        <li key={idx} className="flex items-start text-sm text-gray-700">
                                            <span className="text-orange-500 mr-2 flex-shrink-0">▸</span>
                                            <span className="flex-1">
                                                <GlossaryText
                                                    text={item}
                                                    onTermClick={(key) => { setSelectedGlossaryTerm(key); setShowGlossary(true); }}
                                                />
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="bg-white rounded-lg shadow-lg p-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">Trust cues</h3>
                                <p className="text-xs text-gray-500 mb-3">UI elements that build user confidence in AI-generated results</p>
                                <ul className="space-y-2">
                                    {analysis.trustCues.map((cue, idx) => (
                                        <li key={idx} className="flex items-start text-sm text-gray-700">
                                            <span className="text-green-500 mr-2 flex-shrink-0">✓</span>
                                            <span className="flex-1">
                                                <GlossaryText
                                                    text={cue}
                                                    onTermClick={(key) => { setSelectedGlossaryTerm(key); setShowGlossary(true); }}
                                                />
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Risks */}
                        <div id="risks" className="bg-white rounded-lg shadow-lg p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-gray-800 flex items-center mb-2">
                                        <Icon name="AlertCircle" />
                                        <span className="ml-2">Risks & mitigations</span>
                                    </h3>
                                    <p className="text-sm text-gray-600">Potential challenges and proven strategies to address them</p>
                                </div>
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
                            <div className="space-y-4">
                                {analysis.risks.map((item, idx) => {
                                    const riskExplanation = typeof getRiskExplanation !== 'undefined' ? getRiskExplanation(item.risk) : null;
                                    return (
                                        <div key={idx} className="border-l-4 border-red-400 pl-4 py-3 bg-red-50 rounded-r">
                                            <h4 className="font-semibold text-gray-800 text-sm mb-2">{item.risk}</h4>

                                            {riskExplanation && (
                                                <div className="mb-3 p-3 bg-white rounded border border-red-200">
                                                    <p className="text-xs text-gray-700 mb-2">
                                                        <span className="font-medium text-gray-900">What this means:</span>{' '}
                                                        <GlossaryText
                                                            text={riskExplanation.explanation}
                                                            onTermClick={(key) => {
                                                                setSelectedGlossaryTerm(key);
                                                                setShowGlossary(true);
                                                            }}
                                                        />
                                                    </p>
                                                    <div className="flex items-center gap-4 text-xs mb-2">
                                                        <span className={`font-medium px-2 py-1 rounded ${
                                                            riskExplanation.impact === 'Critical' ? 'bg-red-100 text-red-800' :
                                                            riskExplanation.impact === 'High' ? 'bg-orange-100 text-orange-800' :
                                                            riskExplanation.impact === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-blue-100 text-blue-800'
                                                        }`}>
                                                            Impact: {riskExplanation.impact}
                                                        </span>
                                                        <span className="text-gray-600">Category: {riskExplanation.category}</span>
                                                    </div>
                                                    <p className="text-xs text-gray-700">
                                                        <span className="font-medium">How to address:</span>{' '}
                                                        <GlossaryText
                                                            text={riskExplanation.mitigation}
                                                            onTermClick={(key) => {
                                                                setSelectedGlossaryTerm(key);
                                                                setShowGlossary(true);
                                                            }}
                                                        />
                                                    </p>
                                                </div>
                                            )}

                                            {!riskExplanation && (
                                                <p className="text-xs text-gray-700">
                                                    <span className="font-medium">How to address:</span> {item.mitigation}
                                                </p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            )}
                        </div>

                        {/* Business Metrics */}
                        {analysis.businessMetrics && analysis.businessMetrics.length > 0 && (
                            <div id="business-metrics" className="bg-white rounded-lg shadow-lg p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-gray-800 flex items-center mb-2">
                                            <Icon name="TrendingUp" />
                                            <span className="ml-2">Business metrics</span>
                                        </h3>
                                        <p className="text-sm text-gray-600">Expected success metrics based on industry benchmarks</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => copyToClipboard(
                                                analysis.businessMetrics.map(m => `${m.metric}: ${m.value} - ${m.description}`).join('\n'),
                                                'Business Metrics'
                                            )}
                                            className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                        >
                                            Copy All
                                        </button>
                                    </div>
                                </div>
                                <div className="grid md:grid-cols-3 gap-4">
                                    {analysis.businessMetrics.map((metric, idx) => (
                                        <div key={idx} className="border-l-4 border-green-400 pl-4 py-3 bg-green-50 rounded-r">
                                            <div className="text-2xl font-bold text-green-700 mb-1">{metric.value}</div>
                                            <h4 className="font-semibold text-gray-800 text-sm mb-1">{metric.metric}</h4>
                                            <p className="text-xs text-gray-600">{metric.description}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                                    <p className="text-xs text-gray-700">
                                        <span className="font-medium">Note:</span> These metrics are industry benchmarks based on successful AI implementations. Actual results will vary based on data quality, implementation approach, and organizational factors.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Examples */}
                        {analysis.examples.length > 0 && (
                            <div id="examples" className="bg-white rounded-lg shadow-lg p-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">Examples across industries</h3>
                                <p className="text-sm text-gray-600 mb-4">Real-world applications of this pattern in different domains</p>
                                <div className="space-y-3">
                                    {analysis.examples.map((example, idx) => (
                                        <div key={idx} className="bg-yellow-50 rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="font-semibold text-gray-800">{example.area}</h4>
                                                <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded">
                                                    <GlossaryText
                                                        text={example.type}
                                                        onTermClick={(key) => { setSelectedGlossaryTerm(key); setShowGlossary(true); }}
                                                    />
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-700">
                                                <GlossaryText
                                                    text={example.use}
                                                    onTermClick={(key) => { setSelectedGlossaryTerm(key); setShowGlossary(true); }}
                                                />
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Design-Focused Sections */}

                        {/* User Research & Validation */}
                        <div id="user-research" className="bg-white rounded-lg shadow-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
                                <Icon name="Users" />
                                <span className="ml-2">User research & validation</span>
                            </h3>
                            <p className="text-sm text-gray-600 mb-4">How to test and validate that AI actually improves the user experience</p>

                            <div className="space-y-4">
                                <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-r">
                                    <h4 className="font-semibold text-gray-800 text-sm mb-2">Testing Approach</h4>
                                    <p className="text-sm text-gray-700">{analysis.userResearch.testingApproach}</p>
                                </div>

                                <div>
                                    <h4 className="font-semibold text-gray-800 text-sm mb-2">Validation Questions</h4>
                                    <ul className="space-y-2">
                                        {analysis.userResearch.validationQuestions.map((question, idx) => (
                                            <li key={idx} className="flex items-start text-sm text-gray-700">
                                                <span className="text-purple-500 mr-2">•</span>
                                                {question}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div>
                                    <h4 className="font-semibold text-gray-800 text-sm mb-2">Success Metrics</h4>
                                    <ul className="space-y-2">
                                        {analysis.userResearch.successMetrics.map((metric, idx) => (
                                            <li key={idx} className="flex items-start text-sm text-gray-700">
                                                <span className="text-purple-500 mr-2">▸</span>
                                                {metric}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Ethical & Bias Considerations */}
                        <div id="ethical" className="bg-white rounded-lg shadow-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
                                <Icon name="AlertCircle" />
                                <span className="ml-2">Ethical & bias considerations</span>
                            </h3>
                            <p className="text-sm text-gray-600 mb-4">How to design responsibly and avoid perpetuating harm</p>

                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-semibold text-gray-800 text-sm mb-2">Bias Risks</h4>
                                    <ul className="space-y-2">
                                        {analysis.ethical.biasRisks.map((risk, idx) => (
                                            <li key={idx} className="flex items-start text-sm text-gray-700 bg-red-50 p-3 rounded">
                                                <span className="text-red-500 mr-2">⚠</span>
                                                {risk}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div>
                                    <h4 className="font-semibold text-gray-800 text-sm mb-2">Fairness Considerations</h4>
                                    <ul className="space-y-2">
                                        {analysis.ethical.fairnessConsiderations.map((consideration, idx) => (
                                            <li key={idx} className="flex items-start text-sm text-gray-700">
                                                <span className="text-orange-500 mr-2">•</span>
                                                {consideration}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r">
                                    <h4 className="font-semibold text-gray-800 text-sm mb-2">Transparency Requirements</h4>
                                    <ul className="space-y-2">
                                        {analysis.ethical.transparency.map((item, idx) => (
                                            <li key={idx} className="flex items-start text-sm text-gray-700">
                                                <span className="text-blue-500 mr-2">✓</span>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Error Handling & Edge Cases */}
                        <div id="error-handling" className="bg-white rounded-lg shadow-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
                                <Icon name="AlertCircle" />
                                <span className="ml-2">Error handling & edge cases</span>
                            </h3>
                            <p className="text-sm text-gray-600 mb-4">How to handle AI failures and uncertainty gracefully</p>

                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-semibold text-gray-800 text-sm mb-2">Low Confidence Scenarios</h4>
                                    <ul className="space-y-2">
                                        {analysis.errorHandling.lowConfidenceScenarios.map((scenario, idx) => (
                                            <li key={idx} className="flex items-start text-sm text-gray-700 bg-yellow-50 p-3 rounded">
                                                <span className="text-yellow-600 mr-2">⚡</span>
                                                {scenario}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div>
                                    <h4 className="font-semibold text-gray-800 text-sm mb-2">Edge Cases to Handle</h4>
                                    <ul className="space-y-2">
                                        {analysis.errorHandling.edgeCases.map((edge, idx) => (
                                            <li key={idx} className="flex items-start text-sm text-gray-700">
                                                <span className="text-orange-500 mr-2">▸</span>
                                                {edge}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r">
                                    <h4 className="font-semibold text-gray-800 text-sm mb-2">Failure Recovery Strategies</h4>
                                    <ul className="space-y-2">
                                        {analysis.errorHandling.failureRecovery.map((strategy, idx) => (
                                            <li key={idx} className="flex items-start text-sm text-gray-700">
                                                <span className="text-green-600 mr-2">✓</span>
                                                {strategy}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Accessibility */}
                        <div id="accessibility" className="bg-white rounded-lg shadow-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
                                <Icon name="Users" />
                                <span className="ml-2">Accessibility</span>
                            </h3>
                            <p className="text-sm text-gray-600 mb-4">Making AI features usable for everyone, regardless of ability</p>

                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-semibold text-gray-800 text-sm mb-2">Screen Reader Support</h4>
                                    <ul className="space-y-2">
                                        {analysis.accessibility.screenReaders.map((item, idx) => (
                                            <li key={idx} className="flex items-start text-sm text-gray-700">
                                                <span className="text-indigo-500 mr-2">▸</span>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div>
                                    <h4 className="font-semibold text-gray-800 text-sm mb-2">Alternative Interactions</h4>
                                    <ul className="space-y-2">
                                        {analysis.accessibility.alternativeInteractions.map((item, idx) => (
                                            <li key={idx} className="flex items-start text-sm text-gray-700">
                                                <span className="text-purple-500 mr-2">▸</span>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div>
                                    <h4 className="font-semibold text-gray-800 text-sm mb-2">Cognitive Accessibility</h4>
                                    <ul className="space-y-2">
                                        {analysis.accessibility.cognitiveAccessibility.map((item, idx) => (
                                            <li key={idx} className="flex items-start text-sm text-gray-700">
                                                <span className="text-cyan-500 mr-2">▸</span>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded-r">
                                    <h4 className="font-semibold text-gray-800 text-sm mb-2">Inclusive Design Principles</h4>
                                    <ul className="space-y-2">
                                        {analysis.accessibility.inclusiveDesign.map((item, idx) => (
                                            <li key={idx} className="flex items-start text-sm text-gray-700">
                                                <span className="text-indigo-600 mr-2">✓</span>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* AI Confidence Scoring */}
                        <div id="confidence-scoring" className="bg-white rounded-lg shadow-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
                                <Icon name="Brain" />
                                <span className="ml-2">AI confidence scoring</span>
                            </h3>
                            <p className="text-sm text-gray-600 mb-4">How to communicate AI certainty and help users calibrate trust</p>

                            <div className="space-y-4">
                                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r">
                                    <h4 className="font-semibold text-gray-800 text-sm mb-2">What is Confidence?</h4>
                                    <p className="text-sm text-gray-700">{analysis.confidenceScoring.whatIsConfidence}</p>
                                </div>

                                <div>
                                    <h4 className="font-semibold text-gray-800 text-sm mb-2">When to Show Confidence</h4>
                                    <ul className="space-y-2">
                                        {analysis.confidenceScoring.whenToShow.map((item, idx) => (
                                            <li key={idx} className="flex items-start text-sm text-gray-700">
                                                <span className="text-blue-500 mr-2">▸</span>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div>
                                    <h4 className="font-semibold text-gray-800 text-sm mb-2">How to Display Confidence</h4>
                                    <ul className="space-y-2">
                                        {analysis.confidenceScoring.howToDisplay.map((item, idx) => (
                                            <li key={idx} className="flex items-start text-sm text-gray-700 bg-gray-50 p-3 rounded">
                                                <span className="text-indigo-500 mr-2">📊</span>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div>
                                    <h4 className="font-semibold text-gray-800 text-sm mb-2">Actionable Guidance</h4>
                                    <ul className="space-y-2">
                                        {analysis.confidenceScoring.actionableGuidance.map((item, idx) => (
                                            <li key={idx} className="flex items-start text-sm text-gray-700">
                                                <span className="text-green-500 mr-2">✓</span>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-r">
                                    <h4 className="font-semibold text-gray-800 text-sm mb-2">Calibration & Monitoring</h4>
                                    <ul className="space-y-2">
                                        {analysis.confidenceScoring.calibration.map((item, idx) => (
                                            <li key={idx} className="flex items-start text-sm text-gray-700">
                                                <span className="text-purple-600 mr-2">📈</span>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Action Plan */}
                        {analysis.actionPlan && (
                            <div id="action-plan" className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg shadow-lg p-6 border-l-4 border-green-500 mt-6">
                                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                    <Icon name="CheckCircle" />
                                    <span className="ml-2">Your action plan</span>
                                </h3>
                                <p className="text-sm text-gray-600 mb-6">Key steps to move from analysis to implementation</p>
                                <ol className="space-y-4">
                                    {analysis.actionPlan.map((item, idx) => (
                                        <li key={idx} className="flex items-start bg-white bg-opacity-70 rounded-lg p-4">
                                            <span className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm mr-4">
                                                {item.step}
                                            </span>
                                            <div className="flex-1">
                                                <p className="font-semibold text-gray-900 mb-1">
                                                    <GlossaryText
                                                        text={item.action}
                                                        onTermClick={(key) => { setSelectedGlossaryTerm(key); setShowGlossary(true); }}
                                                    />
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    <GlossaryText
                                                        text={item.detail}
                                                        onTermClick={(key) => { setSelectedGlossaryTerm(key); setShowGlossary(true); }}
                                                    />
                                                </p>
                                            </div>
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        )}

                        </div>
                        {/* End Main Content Area */}
                        </div>
                        {/* End Desktop Flex Container */}
                    </>
                )}

                {/* AI Touchpoint Deep Dive Modal */}
                {selectedTouchpoint && (
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50 z-50"
                        onClick={() => setSelectedTouchpoint(null)}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="touchpoint-modal-title"
                    >
                        <div className="fixed inset-0 flex items-center justify-center p-4 sm:p-6">
                            <div
                                ref={touchpointModalRef}
                                className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-lg z-10">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-xs opacity-90 mb-1 uppercase tracking-wide">{selectedTouchpoint.details.category}</div>
                                            <h2 id="touchpoint-modal-title" className="text-2xl font-bold">{selectedTouchpoint.details.title}</h2>
                                        </div>
                                        <button
                                            onClick={() => setSelectedTouchpoint(null)}
                                            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
                                            aria-label="Close touchpoint details"
                                        >
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                <div className="p-6 space-y-6">
                                    <div>
                                        <h3 className="font-semibold text-gray-800 mb-2">Approach</h3>
                                        <p className="text-sm text-gray-700">
                                            <GlossaryText
                                                text={selectedTouchpoint.details.approach}
                                                onTermClick={(key) => { setSelectedGlossaryTerm(key); setShowGlossary(true); }}
                                            />
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="font-semibold text-gray-800 mb-2">AI Techniques</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedTouchpoint.details.aiTechniques.map((tech, idx) => (
                                                <span key={idx} className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
                                                    {tech}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="font-semibold text-gray-800 mb-2">Implementation</h3>
                                        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                            <div>
                                                <span className="font-medium text-green-700">Simple:</span>
                                                <span className="ml-2 text-sm text-gray-700">
                                                    <GlossaryText
                                                        text={selectedTouchpoint.details.implementation.simple}
                                                        onTermClick={(key) => { setSelectedGlossaryTerm(key); setShowGlossary(true); }}
                                                    />
                                                </span>
                                            </div>
                                            <div>
                                                <span className="font-medium text-orange-700">Advanced:</span>
                                                <span className="ml-2 text-sm text-gray-700">
                                                    <GlossaryText
                                                        text={selectedTouchpoint.details.implementation.advanced}
                                                        onTermClick={(key) => { setSelectedGlossaryTerm(key); setShowGlossary(true); }}
                                                    />
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="font-semibold text-gray-800 mb-2">Data Needed</h3>
                                        <ul className="space-y-1">
                                            {selectedTouchpoint.details.dataNeeded.map((item, idx) => (
                                                <li key={idx} className="flex items-start text-sm text-gray-700">
                                                    <span className="text-indigo-500 mr-2">•</span>
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div>
                                        <h3 className="font-semibold text-gray-800 mb-2">Recommended Services</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedTouchpoint.details.services.map((service, idx) => (
                                                <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-700 rounded text-sm border border-blue-200">
                                                    {service}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {selectedTouchpoint.details.example && (
                                        <div>
                                            <h3 className="font-semibold text-gray-800 mb-2">Code Example</h3>
                                            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs">
                                                <code>{selectedTouchpoint.details.example}</code>
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Share Confirmation Toast */}
                {showShareModal && (
                    <div className="fixed bottom-8 right-8 bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg z-50 animate-fade-in">
                        <div className="flex items-center gap-3">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <div>
                                <div className="font-semibold">Link Copied!</div>
                                <div className="text-sm opacity-90">Share this analysis with your team</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Methodology Explanation Modal - Available Always */}
                {showMethodology && (
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50"
                        style={{zIndex: 9999}}
                        onClick={() => setShowMethodology(false)}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="methodology-modal-title"
                    >
                        <div className="fixed inset-0 flex items-center justify-center p-4 sm:p-6">
                            <div
                                ref={methodologyModalRef}
                                className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 rounded-t-lg" style={{zIndex: 10}}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.477.859h4z" />
                                            </svg>
                                            <h2 id="methodology-modal-title" className="text-2xl font-bold">How this analysis works</h2>
                                        </div>
                                        <button
                                            onClick={() => setShowMethodology(false)}
                                            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
                                            aria-label="Close methodology explanation"
                                        >
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                <div className="p-6 space-y-6 text-sm text-gray-700">
                                    <div>
                                        <h3 className="font-semibold text-indigo-700 mb-3 text-lg">📊 Complexity Scoring</h3>
                                        <p className="mb-3">The complexity score (0-100) is calculated based on 8 factors:</p>
                                        <ul className="list-disc list-inside space-y-2 ml-2">
                                            <li><strong>AI Type:</strong> LLM implementations are more complex than traditional ML</li>
                                            <li><strong>User Interaction:</strong> Co-pilot UIs require more sophisticated design than backstage processing</li>
                                            <li><strong>Cross-System Integration:</strong> Multi-system workflows increase complexity significantly</li>
                                            <li><strong>Real-Time Requirements:</strong> Real-time processing adds infrastructure and performance challenges</li>
                                            <li><strong>Workflow Complexity:</strong> More workflow steps = more edge cases to handle</li>
                                            <li><strong>Data Volume:</strong> Historical or high-volume data analysis increases technical requirements</li>
                                            <li><strong>Predictive Features:</strong> Forecasting and recommendations require advanced ML capabilities</li>
                                            <li><strong>Risk Factors:</strong> More identified risks indicate higher project complexity</li>
                                        </ul>
                                    </div>

                                    <div className="border-t pt-6">
                                        <h3 className="font-semibold text-indigo-700 mb-3 text-lg">🎓 Carnegie Mellon Design Principles</h3>
                                        <p className="mb-3">Based on research from Carnegie Mellon University's Human-Computer Interaction Institute, these 9 principles guide human-AI interaction design:</p>
                                        <ul className="list-disc list-inside space-y-2 ml-2">
                                            <li><strong>Control & Choice:</strong> Users should maintain agency over AI actions</li>
                                            <li><strong>Uncertainty:</strong> Systems should communicate AI confidence and limitations</li>
                                            <li><strong>Clear Limits:</strong> Be transparent about what AI can and cannot do</li>
                                            <li><strong>History:</strong> Support access to past interactions and versions</li>
                                            <li><strong>Flexible Flow:</strong> Allow non-linear workflows and user preferences</li>
                                            <li><strong>Exploration:</strong> Enable users to try variations and compare options</li>
                                            <li><strong>Trust & Clarity:</strong> Explain AI reasoning and decisions</li>
                                            <li><strong>Errors:</strong> Design for graceful error handling and recovery</li>
                                            <li><strong>Memory:</strong> Manage what AI remembers and let users control it</li>
                                        </ul>
                                        <p className="mt-3 text-xs text-gray-600 italic bg-indigo-50 p-3 rounded">Principles are recommended based on your project's AI type, interaction model, and detected features.</p>
                                    </div>

                                    <div className="border-t pt-6">
                                        <h3 className="font-semibold text-indigo-700 mb-3 text-lg">🔄 Workflow Pattern Detection</h3>
                                        <p className="mb-3">The system identifies 1 of 12 universal AI workflow patterns:</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            <span>• Auto-Approval</span>
                                            <span>• Anomaly Detection</span>
                                            <span>• Intelligent Scoring</span>
                                            <span>• Predictive Intelligence</span>
                                            <span>• Unified Entity View</span>
                                            <span>• Cross-System Orchestration</span>
                                            <span>• Natural Language Q&A</span>
                                            <span>• Intelligent Search</span>
                                            <span>• Impact Analysis</span>
                                            <span>• Resource Optimization</span>
                                            <span>• Real-Time Processing</span>
                                            <span>• Smart Aggregation</span>
                                        </div>
                                        <p className="mt-3 text-xs text-gray-600 italic bg-indigo-50 p-3 rounded">Each pattern includes pre-built OOUX workflows, configuration needs, and domain-specific examples.</p>
                                    </div>

                                    <div className="border-t pt-6">
                                        <h3 className="font-semibold text-indigo-700 mb-3 text-lg">📦 OOUX (Object-Oriented UX)</h3>
                                        <p>Objects are defined with core content, metadata, actions, and relationships to create a complete system model following OOUX methodology.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Glossary Modal */}
                {showGlossary && (
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50"
                        style={{zIndex: 9999}}
                        onClick={() => {
                            setShowGlossary(false);
                            setSelectedGlossaryTerm(null);
                        }}
                        role="dialog"
                        aria-labelledby="glossary-title"
                    >
                        <div
                            ref={glossaryModalRef}
                            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-2xl w-11/12 max-w-4xl max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="sticky top-0 bg-blue-600 text-white px-6 py-4 rounded-t-lg flex justify-between items-center z-10">
                                <h2 id="glossary-title" className="text-2xl font-bold">AI & ML glossary</h2>
                                <button
                                    onClick={() => {
                                        setShowGlossary(false);
                                        setSelectedGlossaryTerm(null);
                                    }}
                                    className="text-white hover:bg-blue-700 rounded px-3 py-1"
                                    aria-label="Close glossary"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="p-6">
                                <p className="text-gray-600 mb-6">Essential AI and Machine Learning terms explained for product designers and non-technical users.</p>

                                {!selectedGlossaryTerm ? (
                                    <div className="grid gap-4">
                                        {typeof AI_GLOSSARY !== 'undefined' && Object.entries(AI_GLOSSARY).map(([key, term]) => (
                                            <div key={key} className="border border-gray-200 rounded-lg p-4 hover:border-blue-400 transition-colors">
                                                <h3 className="text-lg font-semibold text-blue-700 mb-2">{term.term}</h3>
                                                <p className="text-gray-700 mb-3">{term.shortDefinition}</p>
                                                <button
                                                    onClick={() => setSelectedGlossaryTerm(key)}
                                                    className="text-blue-600 hover:underline text-sm font-medium"
                                                >
                                                    Learn more →
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div>
                                        {typeof AI_GLOSSARY !== 'undefined' && AI_GLOSSARY[selectedGlossaryTerm] && (
                                            <>
                                                <button
                                                    onClick={() => setSelectedGlossaryTerm(null)}
                                                    className="text-blue-600 hover:underline mb-4 flex items-center gap-2"
                                                >
                                                    ← Back to all terms
                                                </button>

                                                <h3 className="text-2xl font-bold text-blue-700 mb-4">
                                                    {AI_GLOSSARY[selectedGlossaryTerm].term}
                                                </h3>

                                                <div className="bg-blue-50 border-l-4 border-blue-600 p-4 mb-4">
                                                    <p className="text-gray-800">{AI_GLOSSARY[selectedGlossaryTerm].fullDefinition}</p>
                                                </div>

                                                {AI_GLOSSARY[selectedGlossaryTerm].whenToUse && (
                                                    <div className="mb-4">
                                                        <h4 className="font-semibold text-gray-800 mb-2">When to use it:</h4>
                                                        <p className="text-gray-700">{AI_GLOSSARY[selectedGlossaryTerm].whenToUse}</p>
                                                    </div>
                                                )}

                                                {AI_GLOSSARY[selectedGlossaryTerm].examples && AI_GLOSSARY[selectedGlossaryTerm].examples.length > 0 && (
                                                    <div className="mb-4">
                                                        <h4 className="font-semibold text-gray-800 mb-2">Real-world examples:</h4>
                                                        <ul className="list-disc list-inside space-y-1 text-gray-700">
                                                            {AI_GLOSSARY[selectedGlossaryTerm].examples.map((example, idx) => (
                                                                <li key={idx}>{example}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {AI_GLOSSARY[selectedGlossaryTerm].resources && AI_GLOSSARY[selectedGlossaryTerm].resources.length > 0 && (
                                                    <div className="mb-4">
                                                        <h4 className="font-semibold text-gray-800 mb-2">Learning resources:</h4>
                                                        <div className="space-y-2">
                                                            {AI_GLOSSARY[selectedGlossaryTerm].resources.map((resource, idx) => (
                                                                <div key={idx} className="flex items-start gap-2">
                                                                    <span className="text-xs bg-gray-200 px-2 py-1 rounded">{resource.type}</span>
                                                                    <a
                                                                        href={resource.url}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="text-blue-600 hover:underline"
                                                                    >
                                                                        {resource.title}
                                                                    </a>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Decision Framework Modal */}
                {showDecisionFramework && (
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50"
                        style={{zIndex: 9999}}
                        onClick={() => setShowDecisionFramework(false)}
                        role="dialog"
                        aria-labelledby="framework-title"
                    >
                        <div
                            ref={frameworkModalRef}
                            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-2xl w-11/12 max-w-5xl max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="sticky top-0 bg-purple-600 text-white px-6 py-4 rounded-t-lg flex justify-between items-center z-10">
                                <h2 id="framework-title" className="text-2xl font-bold">Should I use AI?</h2>
                                <button
                                    onClick={() => setShowDecisionFramework(false)}
                                    className="text-white hover:bg-purple-700 rounded px-3 py-1"
                                    aria-label="Close decision framework"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="p-6">
                                <p className="text-gray-600 mb-6">Use this framework to assess whether AI is the right solution for your problem. Consider each category carefully.</p>

                                {typeof AI_DECISION_FRAMEWORK !== 'undefined' && AI_DECISION_FRAMEWORK.criteria && (
                                    <div className="space-y-6">
                                        {AI_DECISION_FRAMEWORK.criteria.map((criterion) => (
                                            <div key={criterion.id} className="border border-gray-200 rounded-lg p-5">
                                                <h3 className="text-lg font-bold text-purple-700 mb-2">{criterion.category}</h3>
                                                <p className="text-gray-700 mb-4 font-medium">{criterion.question}</p>

                                                <div className="space-y-3">
                                                    {criterion.checklistItems.map((item, idx) => (
                                                        <div key={idx} className={`p-3 rounded ${item.criticalRisk ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
                                                            <p className="font-medium text-gray-800 mb-2">
                                                                {item.criticalRisk && <span className="text-red-600 mr-2">⚠️</span>}
                                                                {item.text}
                                                            </p>
                                                            <div className="grid md:grid-cols-2 gap-3 text-sm mt-2">
                                                                <div className="flex gap-2">
                                                                    <span className="text-green-600 font-semibold">✓ Good sign:</span>
                                                                    <span className="text-gray-700">{item.goodSign}</span>
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    <span className="text-red-600 font-semibold">✗ Bad sign:</span>
                                                                    <span className="text-gray-700">{item.badSign}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {typeof AI_DECISION_FRAMEWORK !== 'undefined' && AI_DECISION_FRAMEWORK.recommendations && (
                                    <div className="mt-8 border-t pt-6">
                                        <h3 className="text-xl font-bold mb-4">How to interpret your assessment:</h3>
                                        <div className="space-y-4">
                                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                                <h4 className="font-bold text-green-800 mb-2">{AI_DECISION_FRAMEWORK.recommendations.green.title}</h4>
                                                <p className="text-gray-700 mb-2">{AI_DECISION_FRAMEWORK.recommendations.green.description}</p>
                                                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                                                    {AI_DECISION_FRAMEWORK.recommendations.green.nextSteps.map((step, idx) => (
                                                        <li key={idx}>{step}</li>
                                                    ))}
                                                </ul>
                                            </div>

                                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                                <h4 className="font-bold text-yellow-800 mb-2">{AI_DECISION_FRAMEWORK.recommendations.yellow.title}</h4>
                                                <p className="text-gray-700 mb-2">{AI_DECISION_FRAMEWORK.recommendations.yellow.description}</p>
                                                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                                                    {AI_DECISION_FRAMEWORK.recommendations.yellow.nextSteps.map((step, idx) => (
                                                        <li key={idx}>{step}</li>
                                                    ))}
                                                </ul>
                                            </div>

                                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                                <h4 className="font-bold text-red-800 mb-2">{AI_DECISION_FRAMEWORK.recommendations.red.title}</h4>
                                                <p className="text-gray-700 mb-2">{AI_DECISION_FRAMEWORK.recommendations.red.description}</p>
                                                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                                                    {AI_DECISION_FRAMEWORK.recommendations.red.nextSteps.map((step, idx) => (
                                                        <li key={idx}>{step}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};