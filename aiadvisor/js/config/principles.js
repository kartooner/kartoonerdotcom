// Carnegie Mellon Design Principles
const PRINCIPLES = {
    'control-choice': {
        name: 'Control and Choice',
        focus: 'People steer, AI helps',
        tips: ['Let people override AI', 'Give undo', 'Add simple controls'],
        icon: 'Users'
    },
    'uncertainty': {
        name: 'Uncertainty',
        focus: 'Show limits and paths to recover',
        tips: ['Use hints like "not sure"', 'Give options', 'Add warnings'],
        icon: 'AlertCircle'
    },
    'clear-limits': {
        name: 'Clear Limits',
        focus: 'Be honest about scope',
        tips: ['Say what it can do', 'Add quick help', 'Design around strengths'],
        icon: 'CheckCircle'
    },
    'history': {
        name: 'History',
        focus: 'Keep the past close',
        tips: ['Show recent items', 'Save versions', 'Make it easy to pick up work'],
        icon: 'Wrench'
    },
    'flexible-flow': {
        name: 'Flexible Flow',
        focus: 'Avoid one path only',
        tips: ['Support different ways to work', 'Let people switch tasks', 'Allow branching'],
        icon: 'Brain'
    },
    'exploration': {
        name: 'Exploration',
        focus: 'Support play and remix',
        tips: ['Let people annotate', 'Compare options', 'Try forks'],
        icon: 'Lightbulb'
    },
    'trust-clarity': {
        name: 'Trust and Clarity',
        focus: 'Explain choices',
        tips: ['Show why AI suggested something', 'Let detail show on demand'],
        icon: 'CheckCircle'
    },
    'errors': {
        name: 'Errors',
        focus: 'Catch and recover',
        tips: ['Validate early', 'Give warnings', 'Allow small adjustments'],
        icon: 'AlertCircle'
    },
    'memory': {
        name: 'Memory',
        focus: 'Manage what AI remembers',
        tips: ['Show memory', 'Let people reset or edit', 'Drop old or weak info'],
        icon: 'Brain'
    }
};