// ===== NEUROSPACE v2.1 FINAL =====
let state = {
  users: {},
  currentUser: null,
  spaces: [],
  currentSpaceId: null,
  nodes: {},
  edges: {},
  theme: 'cyber',
  accentColor: '#00f5ff',
  language: 'uk',
  subscriptionPlan: 'basic',
  tool: 'select',
  selectedNodeId: null,
  connectSource: null,
  view: { x: 0, y: 0, scale: 1 },
  dragging: null,
  panning: false,
  panStart: null,
  nodeIdCounter: 1,
  edgeIdCounter: 1,
  spaceIdCounter: 1,
};

const NODE_COLORS = [
  { bg: '#0d2040', dot: '#00f5ff', label: 'Синий' },
  { bg: '#1a0a2e', dot: '#7b2fff', label: 'Фиолетовый' },
  { bg: '#200a14', dot: '#ff006e', label: 'Розовый' },
  { bg: '#0a1f14', dot: '#00ff88', label: 'Зелёный' },
  { bg: '#1f130a', dot: '#ff9500', label: 'Оранжевый' },
  { bg: '#1f1a0a', dot: '#ffe600', label: 'Жёлтый' },
];

const EMOJIS = ['🧠','⚡','🌐','🔮','💡','🚀','🔬','🎯','🌊','🔥','💎','🌌','📊','🎨'];
const COLORS = ['#00f5ff','#ff006e','#7b2fff','#00ff88','#ff9500','#ff3366','#00bfff','#ff6b00','#ffe600'];
const NODE_TYPES = {
  idea: { label: 'Idea', short: 'ID', color: '#00f5ff' },
  task: { label: 'Task', short: 'TK', color: '#00ff88' },
  question: { label: 'Question', short: 'Q', color: '#ffe600' },
  resource: { label: 'Resource', short: 'RS', color: '#00bfff' },
  decision: { label: 'Decision', short: 'DC', color: '#ff006e' }
};
const SPACE_TEMPLATES = {
  blank: {
    name: 'Blank',
    desc: 'Clean space with no starter nodes.',
    nodes: [],
    edges: []
  },
  project: {
    name: 'Project',
    desc: 'Plan scope, milestones, risks and next actions.',
    nodes: [
      { title: 'Project goal', desc: 'What outcome should this space create?', type: 'idea', x: 120, y: 120, colorIdx: 0, tags: 'goal, project' },
      { title: 'Milestones', desc: 'Main checkpoints and delivery stages.', type: 'task', x: 380, y: 70, colorIdx: 3, tags: 'plan' },
      { title: 'Risks', desc: 'What could slow this down?', type: 'question', x: 380, y: 220, colorIdx: 5, tags: 'risk' },
      { title: 'Next action', desc: 'The first concrete step.', type: 'task', x: 650, y: 145, colorIdx: 4, tags: 'next' }
    ],
    edges: [[0, 1], [0, 2], [1, 3]]
  },
  study: {
    name: 'Study',
    desc: 'Structure a topic into concepts, questions and resources.',
    nodes: [
      { title: 'Core topic', desc: 'The subject you want to understand.', type: 'idea', x: 120, y: 130, colorIdx: 0, tags: 'study' },
      { title: 'Key concepts', desc: 'Terms and principles to master.', type: 'resource', x: 390, y: 70, colorIdx: 2, tags: 'concepts' },
      { title: 'Open questions', desc: 'What is unclear right now?', type: 'question', x: 390, y: 220, colorIdx: 5, tags: 'questions' },
      { title: 'Practice tasks', desc: 'Exercises or examples to solve.', type: 'task', x: 650, y: 145, colorIdx: 3, tags: 'practice' }
    ],
    edges: [[0, 1], [0, 2], [1, 3]]
  },
  startup: {
    name: 'Startup',
    desc: 'Map customer, problem, offer and validation.',
    nodes: [
      { title: 'Customer segment', desc: 'Who has the pain?', type: 'idea', x: 110, y: 110, colorIdx: 0, tags: 'customer' },
      { title: 'Problem', desc: 'What expensive problem exists?', type: 'question', x: 360, y: 60, colorIdx: 2, tags: 'problem' },
      { title: 'Offer', desc: 'What promise do we make?', type: 'decision', x: 360, y: 215, colorIdx: 1, tags: 'offer' },
      { title: 'Validation test', desc: 'Smallest test to run this week.', type: 'task', x: 620, y: 135, colorIdx: 3, tags: 'mvp, test' }
    ],
    edges: [[0, 1], [1, 2], [2, 3]]
  },
  book: {
    name: 'Book',
    desc: 'Organize chapters, themes, references and decisions.',
    nodes: [
      { title: 'Thesis', desc: 'The central idea of the book.', type: 'idea', x: 120, y: 130, colorIdx: 0, tags: 'book' },
      { title: 'Chapters', desc: 'Main structure and sequence.', type: 'resource', x: 390, y: 70, colorIdx: 2, tags: 'chapters' },
      { title: 'References', desc: 'Sources, quotes and material.', type: 'resource', x: 390, y: 220, colorIdx: 4, tags: 'sources' },
      { title: 'Editorial decisions', desc: 'Tone, scope and cuts.', type: 'decision', x: 650, y: 145, colorIdx: 1, tags: 'decisions' }
    ],
    edges: [[0, 1], [0, 2], [1, 3]]
  },
  goals: {
    name: 'Personal Goals',
    desc: 'Track outcomes, habits, blockers and review loops.',
    nodes: [
      { title: 'North star', desc: 'The larger direction.', type: 'idea', x: 120, y: 130, colorIdx: 0, tags: 'goals' },
      { title: 'Habits', desc: 'Repeated actions that compound.', type: 'task', x: 390, y: 70, colorIdx: 3, tags: 'habits' },
      { title: 'Blockers', desc: 'What usually gets in the way?', type: 'question', x: 390, y: 220, colorIdx: 5, tags: 'blockers' },
      { title: 'Weekly review', desc: 'Check progress and adjust.', type: 'task', x: 650, y: 145, colorIdx: 4, tags: 'review' }
    ],
    edges: [[0, 1], [0, 2], [1, 3]]
  }
};

const SPACE_TEMPLATE_I18N = {
  en: {},
  uk: {
    blank: { name: 'Порожній', desc: 'Чистий простір без стартових вузлів.', nodes: [] },
    project: {
      name: 'Проєкт',
      desc: 'Сплануй обсяг, етапи, ризики та наступні дії.',
      nodes: [
        { title: 'Мета проєкту', desc: 'Який результат має створити цей простір?', tags: 'мета, проєкт' },
        { title: 'Етапи', desc: 'Головні контрольні точки та стадії доставки.', tags: 'план' },
        { title: 'Ризики', desc: 'Що може сповільнити рух?', tags: 'ризик' },
        { title: 'Наступна дія', desc: 'Перший конкретний крок.', tags: 'наступне' }
      ]
    },
    study: {
      name: 'Навчання',
      desc: 'Розклади тему на концепти, питання та ресурси.',
      nodes: [
        { title: 'Основна тема', desc: 'Предмет, який ти хочеш зрозуміти.', tags: 'навчання' },
        { title: 'Ключові концепти', desc: 'Терміни та принципи, які потрібно опанувати.', tags: 'концепти' },
        { title: 'Відкриті питання', desc: 'Що зараз залишається незрозумілим?', tags: 'питання' },
        { title: 'Практичні задачі', desc: 'Вправи або приклади для розв’язання.', tags: 'практика' }
      ]
    },
    startup: {
      name: 'Стартап',
      desc: 'Зістав клієнта, проблему, пропозицію та перевірку.',
      nodes: [
        { title: 'Сегмент клієнтів', desc: 'У кого є цей біль?', tags: 'клієнт' },
        { title: 'Проблема', desc: 'Яка дорога проблема існує?', tags: 'проблема' },
        { title: 'Пропозиція', desc: 'Яку обіцянку ми даємо?', tags: 'пропозиція' },
        { title: 'Перевірка гіпотези', desc: 'Найменший тест, який можна провести цього тижня.', tags: 'mvp, тест' }
      ]
    },
    book: {
      name: 'Книга',
      desc: 'Організуй розділи, теми, джерела та рішення.',
      nodes: [
        { title: 'Теза', desc: 'Центральна ідея книги.', tags: 'книга' },
        { title: 'Розділи', desc: 'Основна структура та послідовність.', tags: 'розділи' },
        { title: 'Джерела', desc: 'Матеріали, цитати та посилання.', tags: 'джерела' },
        { title: 'Редакційні рішення', desc: 'Тон, обсяг і скорочення.', tags: 'рішення' }
      ]
    },
    goals: {
      name: 'Особисті цілі',
      desc: 'Відстежуй результати, звички, блокери та цикли перегляду.',
      nodes: [
        { title: 'Головний напрям', desc: 'Більший вектор руху.', tags: 'цілі' },
        { title: 'Звички', desc: 'Повторювані дії, що накопичують ефект.', tags: 'звички' },
        { title: 'Блокери', desc: 'Що зазвичай заважає?', tags: 'блокери' },
        { title: 'Тижневий перегляд', desc: 'Перевірити прогрес і скоригувати план.', tags: 'перегляд' }
      ]
    }
  },
  ru: {
    blank: { name: 'Пустой', desc: 'Чистое пространство без стартовых узлов.', nodes: [] },
    project: {
      name: 'Проект',
      desc: 'Спланируйте объем, этапы, риски и следующие действия.',
      nodes: [
        { title: 'Цель проекта', desc: 'Какой результат должно создать это пространство?', tags: 'цель, проект' },
        { title: 'Этапы', desc: 'Главные контрольные точки и стадии доставки.', tags: 'план' },
        { title: 'Риски', desc: 'Что может замедлить движение?', tags: 'риск' },
        { title: 'Следующее действие', desc: 'Первый конкретный шаг.', tags: 'следующее' }
      ]
    },
    study: {
      name: 'Обучение',
      desc: 'Разложите тему на концепты, вопросы и ресурсы.',
      nodes: [
        { title: 'Основная тема', desc: 'Предмет, который вы хотите понять.', tags: 'обучение' },
        { title: 'Ключевые концепты', desc: 'Термины и принципы, которые нужно освоить.', tags: 'концепты' },
        { title: 'Открытые вопросы', desc: 'Что сейчас остается непонятным?', tags: 'вопросы' },
        { title: 'Практические задачи', desc: 'Упражнения или примеры для решения.', tags: 'практика' }
      ]
    },
    startup: {
      name: 'Стартап',
      desc: 'Сопоставьте клиента, проблему, предложение и проверку.',
      nodes: [
        { title: 'Сегмент клиентов', desc: 'У кого есть эта боль?', tags: 'клиент' },
        { title: 'Проблема', desc: 'Какая дорогая проблема существует?', tags: 'проблема' },
        { title: 'Предложение', desc: 'Какое обещание мы даем?', tags: 'предложение' },
        { title: 'Проверка гипотезы', desc: 'Самый маленький тест на эту неделю.', tags: 'mvp, тест' }
      ]
    },
    book: {
      name: 'Книга',
      desc: 'Организуйте главы, темы, источники и решения.',
      nodes: [
        { title: 'Тезис', desc: 'Центральная идея книги.', tags: 'книга' },
        { title: 'Главы', desc: 'Основная структура и последовательность.', tags: 'главы' },
        { title: 'Источники', desc: 'Материалы, цитаты и ссылки.', tags: 'источники' },
        { title: 'Редакционные решения', desc: 'Тон, объем и сокращения.', tags: 'решения' }
      ]
    },
    goals: {
      name: 'Личные цели',
      desc: 'Отслеживайте результаты, привычки, блокеры и циклы обзора.',
      nodes: [
        { title: 'Главное направление', desc: 'Больший вектор движения.', tags: 'цели' },
        { title: 'Привычки', desc: 'Повторяющиеся действия, которые дают накопительный эффект.', tags: 'привычки' },
        { title: 'Блокеры', desc: 'Что обычно мешает?', tags: 'блокеры' },
        { title: 'Еженедельный обзор', desc: 'Проверить прогресс и скорректировать план.', tags: 'обзор' }
      ]
    }
  }
};
const SUBSCRIPTION_PLANS = {
  basic: {
    id: 'basic',
    name: 'Basic',
    price: '$0',
    tagline: 'Personal local graph starter',
    limits: { spaces: 3, nodes: 80, links: 120 },
    features: ['Local storage', 'Quick Capture', 'Manual JSON export', 'Suggested links preview'],
    note: 'Best for testing ideas and small personal maps.'
  },
  plus: {
    id: 'plus',
    name: 'Plus',
    price: '$3.99/mo',
    tagline: 'Cheap plan for active note builders',
    limits: { spaces: 25, nodes: 2000, links: 5000 },
    features: ['More spaces and nodes', 'Advanced hub stats', 'Theme presets', 'Backup reminders', 'Friends waitlist access'],
    note: 'Enough for students, solo projects and a serious second brain.'
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: '$9.99/mo',
    tagline: 'Large knowledge systems and future collaboration',
    limits: { spaces: null, nodes: null, links: null },
    features: ['High graph limits', 'Priority AI analysis', 'Version history concept', 'Shared spaces when Friends opens', 'Export packs'],
    note: 'For heavy research, product work and multi-project knowledge bases.'
  }
};

const PLAN_I18N = {
  en: {},
  uk: {
    basic: {
      tagline: 'Стартовий локальний граф для себе',
      features: ['Локальне збереження', 'Швидке додавання', 'Ручний JSON-експорт', 'Прев’ю запропонованих зв’язків'],
      note: 'Найкраще для тестування ідей і невеликих особистих мап.'
    },
    plus: {
      tagline: 'Доступний план для активних нотаток',
      features: ['Більше просторів і вузлів', 'Розширена статистика хабу', 'Пресети тем', 'Нагадування про бекапи', 'Доступ до черги друзів'],
      note: 'Достатньо для навчання, сольних проєктів і серйозної другої пам’яті.'
    },
    pro: {
      tagline: 'Великі системи знань і майбутня співпраця',
      features: ['Високі ліміти графа', 'Пріоритетний AI-аналіз', 'Концепт історії версій', 'Спільні простори після відкриття друзів', 'Пакети експорту'],
      note: 'Для глибоких досліджень, продуктової роботи та багатопроєктних баз знань.'
    }
  },
  ru: {
    basic: {
      tagline: 'Стартовый локальный граф для себя',
      features: ['Локальное хранение', 'Быстрое добавление', 'Ручной JSON-экспорт', 'Превью предложенных связей'],
      note: 'Лучше всего для проверки идей и небольших личных карт.'
    },
    plus: {
      tagline: 'Недорогой план для активных заметок',
      features: ['Больше пространств и узлов', 'Расширенная статистика хаба', 'Пресеты тем', 'Напоминания о бэкапах', 'Доступ к очереди друзей'],
      note: 'Достаточно для учебы, сольных проектов и серьезной второй памяти.'
    },
    pro: {
      tagline: 'Большие системы знаний и будущая совместная работа',
      features: ['Высокие лимиты графа', 'Приоритетный AI-анализ', 'Концепт истории версий', 'Общие пространства после открытия друзей', 'Пакеты экспорта'],
      note: 'Для глубоких исследований, продуктовой работы и многопроектных баз знаний.'
    }
  }
};

const DEMO_I18N = {
  en: {
    spaceName: 'My first project',
    nodes: [
      { title: 'Main idea', desc: 'Central concept of the project', tags: 'project, idea' },
      { title: 'Direction A', desc: 'First direction of development', tags: 'development' },
      { title: 'Direction B', desc: 'Second direction of development', tags: 'development' },
      { title: 'Concrete step', desc: 'What should be done first', tags: 'task, urgent' }
    ]
  },
  uk: {
    spaceName: 'Мій перший проєкт',
    nodes: [
      { title: 'Головна ідея', desc: 'Центральна концепція проєкту', tags: 'проєкт, ідея' },
      { title: 'Напрям A', desc: 'Перший напрям розвитку', tags: 'розвиток' },
      { title: 'Напрям B', desc: 'Другий напрям розвитку', tags: 'розвиток' },
      { title: 'Конкретний крок', desc: 'Що потрібно зробити насамперед', tags: 'задача, терміново' }
    ]
  },
  ru: {
    spaceName: 'Мой первый проект',
    nodes: [
      { title: 'Главная идея', desc: 'Центральная концепция проекта', tags: 'проект, идея' },
      { title: 'Направление A', desc: 'Первое направление развития', tags: 'развитие' },
      { title: 'Направление B', desc: 'Второе направление развития', tags: 'развитие' },
      { title: 'Конкретный шаг', desc: 'Что нужно сделать в первую очередь', tags: 'задача, срочно' }
    ]
  }
};
let newSpaceEmoji = '🧠';
let newSpaceColor = '#00f5ff';
let newSpaceTemplate = 'blank';

const I18N = {
  en: {
    login: 'Login', register: 'Register', identifier: 'Identifier', accessCode: 'Access code',
    nickname: 'Nickname', accessMin: 'minimum 6 characters', enterSystem: 'ENTER SYSTEM',
    createAccount: 'CREATE ACCOUNT', logout: 'LOG OUT', plans: 'Plans', friends: 'Friends',
    export: 'Export', settings: 'Settings', commandCenter: 'Command Center', mySpaces: 'My Spaces',
    newSpace: 'New Space', searchSpaces: 'Search spaces...', findFriends: 'Find Friends',
    locked: 'Locked', space: 'Space', searchNodes: 'Search nodes...', quickCapture: 'Quick Capture',
    quickPlaceholder: 'One thought per line...', capture: '+ CAPTURE', suggestedLinks: 'Suggested Links',
    suggestEmpty: 'Select a node to see smart link ideas', tools: 'Tools', actions: 'Actions',
    stats: 'Statistics', select: 'Select', addNode: 'Add node', connect: 'Connect',
    duplicate: 'Duplicate', focusNode: 'Focus node', autoLayout: 'Auto layout', fitView: 'Fit view',
    isolated: 'Find isolated', smartLinks: 'Smart Links', delete: 'Delete', exportJson: 'Export JSON',
    importJson: 'Import JSON', aiAssistant: 'AI Assistant', nodes: 'Nodes', links: 'Links',
    density: 'Density', plan: 'Plan', usage: 'Usage', connectionMode: 'CONNECT MODE - choose target node',
    analyzingNodes: 'Analyzing nodes...', aiPrompt: 'Open the AI assistant from the sidebar to analyze this graph.',
    nodeEditor: 'Node Editor', title: 'Title', titlePlaceholder: 'Thought name...', description: 'Description',
    descPlaceholder: 'Detailed description...', tags: 'Tags (comma separated)', tagsPlaceholder: 'idea, project, important',
    nodeType: 'Node type', color: 'Color', connectedNodes: 'Connected nodes', save: 'SAVE', close: 'CLOSE',
    appearance: 'Appearance', profile: 'Profile', data: 'Data', about: 'About', backHub: 'BACK TO HUB',
    commandPalette: 'Command Palette', commandPlaceholder: 'Type a command...', language: 'Language',
    languageSub: 'Choose the interface language', english: 'English', ukrainian: 'Ukrainian', russian: 'Russian',
    theme: 'Theme', accentColor: 'Accent color', interfaceControl: 'Interface control deck',
    cleanHubTitle: 'Clean command center', cleanHubCopy: 'Spaces use monograms, density bars and compact status labels instead of emoji-heavy cards.',
    suggestionsTitle: 'Context suggestions', suggestionsCopy: 'Selected nodes suggest nearby or semantically similar links from your local graph.',
    profileTitle: 'User Profile', identitySub: 'Identity and workspace signature', dataTitle: 'Data Management',
    dataSub: 'Local storage, backups and portability', exportBackup: 'Export full backup', importBackup: 'Import backup',
    storageNote: 'Storage: localStorage. Data stays in this browser until you export or clear it.',
    backupTitle: 'Portable memory file', backupCopy: 'Export users, spaces, nodes, links, theme and accent as one JSON file.',
    restoreTitle: 'Manual restore point', restoreCopy: 'Use Git for code checkpoints and JSON backups for your graph content.',
    friendsTitle: 'Friends Search', friendsSub: 'Closed social layer preview',
    friendsLockedTitle: 'Collaborator discovery is staged for later',
    friendsLockedCopy: 'This future section can search people by shared tags, graph overlap, public spaces and invite links. For now it is visible as a product direction, not an active network feature.',
    aboutSub: 'Digital memory expander v2.1', aboutCopy: 'Created for visualizing and connecting ideas. All data is stored locally in your browser.',
    local: 'Local', openGraph: 'Open graph', managePlan: 'Manage plan', startClean: 'Start a clean knowledge graph',
    template: 'Template', visualTone: 'Visual tone', create: 'Create', cancel: 'Cancel',
    currentPlan: 'Current plan', selectPreview: 'Select preview', nodesUsed: 'nodes used', spaces: 'spaces',
    prototypeBilling: 'Prototype billing only: selecting a plan changes local limits and UI state. No payment is made.',
    lockedModule: 'Locked module', friendsModalTitle: 'Find people by shared ideas',
    friendsModalCopy: 'This section is reserved for profiles, shared spaces, invitations and collaborator discovery. The button is live, but the social layer is intentionally closed for now.',
    openSettings: 'Open Settings', noCommands: 'No matching commands', noSuggestions: 'No strong suggestions yet',
    linkButton: 'Link', edit: 'EDIT', subnode: '+SUB', addLink: '+LINK', del: 'DEL',
    spaceCreated: 'Space created', enterName: 'Enter a name', deleteSpaceConfirm: 'Delete this space and all its nodes?',
    spaceDeleted: 'Space deleted', profileSaved: 'Profile saved', themeChanged: 'Theme changed',
    accentChanged: 'Accent color changed', languageChanged: 'Language changed', backupSaved: 'Full backup saved',
    imported: 'Data imported', fileError: 'File error', replaceData: 'Replace all data? Current data will be lost.',
    aiLoading: 'Analyzing graph...', aiNoNodes: 'No nodes to analyze.', smartDone: 'Done',
    smartStopped: 'Smart Links stopped', linkLimit: 'Plan link limit reached', duplicated: 'Node duplicated',
    requires: 'requires', limitReached: 'limit reached', downloaded: 'Code is downloading...',
    welcomeBack: 'Welcome back', accountCreated: 'Account created. Welcome', fillFields: 'Fill in all fields',
    wrongLogin: 'Wrong identifier or access code', userExists: 'A user with this email already exists',
    typeIdea: 'Idea', typeTask: 'Task', typeQuestion: 'Question', typeResource: 'Resource', typeDecision: 'Decision',
    profileModalTitle: 'Profile', profileSpaces: 'Spaces', profileNodes: 'Nodes',
    matchByTags: 'Match by tags', inviteToSpaces: 'Invite to spaces', sharedGraphRooms: 'Shared graph rooms',
    hubMode: 'Hub mode', graphMemory: 'Graph memory', backup: 'Backup', safety: 'Safety',
    match: 'Match', invite: 'Invite', sync: 'Sync',
    similarInterestsTags: 'Similar interests and tags', sharedGraphSpaces: 'Shared graph spaces',
    optionalProfileDiscovery: 'Optional profile discovery',
    deleteLinkConfirm: 'Delete this link?', aiLocalTitle: 'AI assistant (local)',
    aiContextReady: 'Graph context is ready for an external AI.', aiContextTitle: 'Knowledge graph', tagsNone: 'none',
    aiIdea1: 'Group related nodes into a separate cluster to make the map easier to scan.',
    aiIdea2: 'One important node has few links. Add intermediate tasks or context nodes around it.',
    aiIdea3: 'The graph is forming several directions. Consider turning mature clusters into separate spaces.',
    aiIdea4: 'Add priority tags to urgent nodes so filtering and search stay useful.'
  },
  uk: {
    login: 'Вхід', register: 'Реєстрація', identifier: 'Ідентифікатор', accessCode: 'Код доступу',
    nickname: 'Нікнейм', accessMin: 'мінімум 6 символів', enterSystem: 'УВІЙТИ В СИСТЕМУ',
    createAccount: 'СТВОРИТИ АКАУНТ', logout: 'ВИЙТИ', plans: 'Підписки', friends: 'Друзі',
    export: 'Експорт', settings: 'Налаштування', commandCenter: 'Центр керування', mySpaces: 'Мої Простори',
    newSpace: 'Новий простір', searchSpaces: 'Пошук просторів...', findFriends: 'Пошук друзів',
    locked: 'Закрито', space: 'Простір', searchNodes: 'Пошук вузлів...', quickCapture: 'Швидке додавання',
    quickPlaceholder: 'Одна думка на рядок...', capture: '+ ДОДАТИ', suggestedLinks: 'Запропоновані зв’язки',
    suggestEmpty: 'Вибери вузол, щоб побачити ідеї для зв’язків', tools: 'Інструменти', actions: 'Дії',
    stats: 'Статистика', select: 'Вибір', addNode: 'Додати вузол', connect: 'Зв’язок',
    duplicate: 'Дублювати', focusNode: 'Фокус на вузлі', autoLayout: 'Авто-розміщення', fitView: 'Центрувати',
    isolated: 'Знайти одиночні', smartLinks: 'Розумні зв’язки', delete: 'Видалити', exportJson: 'Експорт JSON',
    importJson: 'Імпорт JSON', aiAssistant: 'AI Помічник', nodes: 'Вузли', links: 'Зв’язки',
    density: 'Щільність', plan: 'План', usage: 'Використано', connectionMode: 'РЕЖИМ ЗВ’ЯЗКУ - вибери цільовий вузол',
    analyzingNodes: 'Аналіз вузлів...', aiPrompt: 'Відкрий AI помічника з бічної панелі, щоб проаналізувати граф.',
    nodeEditor: 'Редактор вузла', title: 'Заголовок', titlePlaceholder: 'Назва думки...', description: 'Опис',
    descPlaceholder: 'Детальний опис...', tags: 'Теги (через кому)', tagsPlaceholder: 'ідея, проєкт, важливо',
    nodeType: 'Тип вузла', color: 'Колір', connectedNodes: 'Пов’язані вузли', save: 'ЗБЕРЕГТИ', close: 'ЗАКРИТИ',
    appearance: 'Вигляд', profile: 'Профіль', data: 'Дані', about: 'Про систему', backHub: 'НАЗАД У ХАБ',
    commandPalette: 'Палітра команд', commandPlaceholder: 'Введи команду...', language: 'Мова',
    languageSub: 'Вибери мову інтерфейсу', english: 'Англійська', ukrainian: 'Українська', russian: 'Російська',
    theme: 'Тема', accentColor: 'Акцентний колір', interfaceControl: 'Панель керування інтерфейсом',
    cleanHubTitle: 'Чистий центр керування', cleanHubCopy: 'Простори використовують монограми, шкали щільності й компактні статуси замість перевантажених карток.',
    suggestionsTitle: 'Контекстні підказки', suggestionsCopy: 'Вибрані вузли пропонують близькі або семантично схожі зв’язки з локального графа.',
    profileTitle: 'Профіль користувача', identitySub: 'Ідентичність і підпис робочого простору',
    dataTitle: 'Керування даними', dataSub: 'Локальне сховище, бекапи й переносимість',
    exportBackup: 'Експортувати повний бекап', importBackup: 'Імпортувати бекап',
    storageNote: 'Сховище: localStorage. Дані залишаються в цьому браузері, поки ти їх не експортуєш або не очистиш.',
    backupTitle: 'Портативний файл пам’яті', backupCopy: 'Експортуй користувачів, простори, вузли, зв’язки, тему й акцент одним JSON файлом.',
    restoreTitle: 'Ручна точка відновлення', restoreCopy: 'Використовуй Git для коду і JSON-бекапи для вмісту графа.',
    friendsTitle: 'Пошук друзів', friendsSub: 'Прев’ю закритого соціального шару',
    friendsLockedTitle: 'Пошук колабораторів запланований на пізніше',
    friendsLockedCopy: 'У майбутньому цей розділ шукатиме людей за спільними тегами, перетином графів, публічними просторами та інвайтами. Поки це видимий напрям продукту, а не активна мережа.',
    aboutSub: 'Розширювач цифрової пам’яті v2.1',
    aboutCopy: 'Створено для візуалізації та зв’язування ідей. Усі дані зберігаються локально у твоєму браузері.',
    local: 'Локально', openGraph: 'Відкрити граф', managePlan: 'Керувати планом',
    startClean: 'Почати чистий граф знань', template: 'Шаблон', visualTone: 'Візуальний тон',
    create: 'Створити', cancel: 'Скасувати', currentPlan: 'Поточний план', selectPreview: 'Обрати прев’ю',
    nodesUsed: 'вузлів використано', spaces: 'простори',
    prototypeBilling: 'Це прототип підписок: вибір плану змінює локальні ліміти та стан інтерфейсу. Оплата не виконується.',
    lockedModule: 'Закритий модуль', friendsModalTitle: 'Знаходь людей за спільними ідеями',
    friendsModalCopy: 'Цей розділ зарезервований для профілів, спільних просторів, запрошень і пошуку колабораторів. Кнопка працює, але соціальний шар поки закритий.',
    openSettings: 'Відкрити налаштування', noCommands: 'Немає схожих команд', noSuggestions: 'Поки немає сильних підказок',
    linkButton: 'Зв’язати', edit: 'РЕД.', subnode: '+ПІД', addLink: '+ЗВ’ЯЗОК', del: 'ВИД.',
    spaceCreated: 'Простір створено', enterName: 'Введи назву', deleteSpaceConfirm: 'Видалити цей простір і всі його вузли?',
    spaceDeleted: 'Простір видалено', profileSaved: 'Профіль збережено', themeChanged: 'Тему змінено',
    accentChanged: 'Акцентний колір змінено', languageChanged: 'Мову змінено', backupSaved: 'Повний бекап збережено',
    imported: 'Дані імпортовано', fileError: 'Помилка файлу', replaceData: 'Замінити всі дані? Поточні дані буде втрачено.',
    aiLoading: 'Аналіз графа...', aiNoNodes: 'Немає вузлів для аналізу.', smartDone: 'Готово',
    smartStopped: 'Розумні зв’язки зупинено', linkLimit: 'Досягнуто ліміт зв’язків плану',
    duplicated: 'Вузол дубльовано', requires: 'потребує', limitReached: 'ліміт досягнуто',
    downloaded: 'Код завантажується...', welcomeBack: 'З поверненням', accountCreated: 'Акаунт створено. Вітаю',
    fillFields: 'Заповни всі поля', wrongLogin: 'Неправильний ідентифікатор або код доступу',
    userExists: 'Користувач з таким email вже існує',
    typeIdea: 'Ідея', typeTask: 'Задача', typeQuestion: 'Питання', typeResource: 'Ресурс', typeDecision: 'Рішення',
    profileModalTitle: 'Профіль', profileSpaces: 'Простори', profileNodes: 'Вузли',
    matchByTags: 'Збіг за тегами', inviteToSpaces: 'Запрошення у простори', sharedGraphRooms: 'Спільні кімнати графів',
    hubMode: 'Режим хабу', graphMemory: 'Пам’ять графа', backup: 'Бекап', safety: 'Безпека',
    match: 'Збіг', invite: 'Інвайт', sync: 'Синхронізація',
    similarInterestsTags: 'Схожі інтереси й теги', sharedGraphSpaces: 'Спільні простори графів',
    optionalProfileDiscovery: 'Опційний пошук профілю',
    deleteLinkConfirm: 'Видалити цей зв’язок?', aiLocalTitle: 'AI-помічник (локальний)',
    aiContextReady: 'Контекст графа готовий для зовнішнього AI.', aiContextTitle: 'Граф знань', tagsNone: 'немає',
    aiIdea1: 'Згрупуй пов’язані вузли в окремий кластер, щоб мапу було легше читати.',
    aiIdea2: 'Один важливий вузол має мало зв’язків. Додай навколо нього проміжні задачі або контекстні вузли.',
    aiIdea3: 'Граф формує кілька напрямів. Зрілі кластери можна винести в окремі простори.',
    aiIdea4: 'Додай теги пріоритету до термінових вузлів, щоб фільтрація й пошук лишалися корисними.'
  },
  ru: {}
};

I18N.ru = {
  ...I18N.uk,
  login: 'Вход', register: 'Регистрация', identifier: 'Идентификатор', accessCode: 'Код доступа',
  nickname: 'Никнейм', accessMin: 'минимум 6 символов', enterSystem: 'ВОЙТИ В СИСТЕМУ',
  createAccount: 'СОЗДАТЬ АККАУНТ', logout: 'ВЫЙТИ', plans: 'Подписки', friends: 'Друзья',
  export: 'Экспорт', settings: 'Настройки', commandCenter: 'Центр управления', mySpaces: 'Мои Пространства',
  newSpace: 'Новое пространство', searchSpaces: 'Поиск пространств...', findFriends: 'Поиск друзей',
  locked: 'Закрыто', space: 'Пространство', searchNodes: 'Поиск узлов...', quickCapture: 'Быстрое добавление',
  quickPlaceholder: 'Одна мысль на строку...', capture: '+ ДОБАВИТЬ', suggestedLinks: 'Предложенные связи',
  suggestEmpty: 'Выберите узел, чтобы увидеть идеи связей', tools: 'Инструменты', actions: 'Действия',
  stats: 'Статистика', select: 'Выбор', addNode: 'Добавить узел', connect: 'Связь',
  duplicate: 'Дублировать', focusNode: 'Фокус на узле', autoLayout: 'Авто-размещение', fitView: 'Центрировать',
  isolated: 'Найти одиночные', smartLinks: 'Умные связи', delete: 'Удалить', aiAssistant: 'AI Помощник',
  nodes: 'Узлы', links: 'Связи', density: 'Плотность', usage: 'Использовано',
  connectionMode: 'РЕЖИМ СВЯЗИ - выберите целевой узел', analyzingNodes: 'Анализ узлов...',
  aiPrompt: 'Откройте AI помощника из боковой панели, чтобы проанализировать граф.',
  nodeEditor: 'Редактор узла', titlePlaceholder: 'Название мысли...', description: 'Описание',
  descPlaceholder: 'Подробное описание...', tags: 'Теги (через запятую)', tagsPlaceholder: 'идея, проект, важно',
  nodeType: 'Тип узла', color: 'Цвет', connectedNodes: 'Связанные узлы', save: 'СОХРАНИТЬ', close: 'ЗАКРЫТЬ',
  appearance: 'Внешний вид', profile: 'Профиль', data: 'Данные', about: 'О системе', backHub: 'НАЗАД В ХАБ',
  commandPalette: 'Палитра команд', commandPlaceholder: 'Введите команду...', language: 'Язык',
  languageSub: 'Выберите язык интерфейса', english: 'Английский', ukrainian: 'Украинский', russian: 'Русский',
  theme: 'Тема', accentColor: 'Акцентный цвет', interfaceControl: 'Панель управления интерфейсом',
  cleanHubTitle: 'Чистый центр управления',
  cleanHubCopy: 'Пространства используют монограммы, шкалы плотности и компактные статусы вместо перегруженных карточек.',
  suggestionsTitle: 'Контекстные подсказки',
  suggestionsCopy: 'Выбранные узлы предлагают близкие или семантически похожие связи из локального графа.',
  profileTitle: 'Профиль пользователя', identitySub: 'Идентичность и подпись рабочего пространства',
  dataTitle: 'Управление данными', dataSub: 'Локальное хранилище, бэкапы и переносимость',
  exportBackup: 'Экспортировать полный бэкап', importBackup: 'Импортировать бэкап',
  storageNote: 'Хранилище: localStorage. Данные остаются в этом браузере, пока вы их не экспортируете или не очистите.',
  friendsTitle: 'Поиск друзей', friendsSub: 'Превью закрытого социального слоя',
  friendsLockedTitle: 'Поиск коллабораторов запланирован на позже',
  friendsLockedCopy: 'В будущем этот раздел будет искать людей по общим тегам, пересечению графов, публичным пространствам и инвайтам. Пока это видимое направление продукта, а не активная сеть.',
  friendsModalCopy: 'Этот раздел зарезервирован для профилей, общих пространств, приглашений и поиска коллабораторов. Кнопка работает, но социальный слой пока закрыт.',
  backupCopy: 'Экспорт пользователей, пространств, узлов, связей, темы и акцента одним JSON файлом.',
  restoreCopy: 'Используйте Git для кода и JSON-бэкапы для содержимого графа.',
  aboutSub: 'Расширитель цифровой памяти v2.1',
  aboutCopy: 'Создано для визуализации и связывания идей. Все данные хранятся локально в вашем браузере.',
  local: 'Локально', openGraph: 'Открыть граф', managePlan: 'Управлять планом',
  startClean: 'Начать чистый граф знаний', template: 'Шаблон', visualTone: 'Визуальный тон',
  create: 'Создать', cancel: 'Отмена', currentPlan: 'Текущий план', selectPreview: 'Выбрать превью',
  nodesUsed: 'узлов использовано', spaces: 'пространства',
  prototypeBilling: 'Это прототип подписок: выбор плана меняет локальные лимиты и состояние интерфейса. Оплата не выполняется.',
  lockedModule: 'Закрытый модуль', friendsModalTitle: 'Находите людей по общим идеям',
  openSettings: 'Открыть настройки', noCommands: 'Нет похожих команд', noSuggestions: 'Пока нет сильных подсказок',
  linkButton: 'Связать', edit: 'РЕД.', subnode: '+ПОД', addLink: '+СВЯЗЬ', del: 'УДАЛ.',
  spaceCreated: 'Пространство создано', enterName: 'Введите название',
  deleteSpaceConfirm: 'Удалить это пространство и все его узлы?', spaceDeleted: 'Пространство удалено',
  profileSaved: 'Профиль сохранен', themeChanged: 'Тема изменена', accentChanged: 'Акцентный цвет изменен',
  languageChanged: 'Язык изменен', backupSaved: 'Полный бэкап сохранен', imported: 'Данные импортированы',
  fileError: 'Ошибка файла', replaceData: 'Заменить все данные? Текущие данные будут потеряны.',
  aiLoading: 'Анализ графа...', aiNoNodes: 'Нет узлов для анализа.', smartStopped: 'Умные связи остановлены',
  linkLimit: 'Достигнут лимит связей плана', duplicated: 'Узел дублирован', requires: 'требует',
  limitReached: 'лимит достигнут', downloaded: 'Код загружается...', welcomeBack: 'С возвращением',
  accountCreated: 'Аккаунт создан. Добро пожаловать', fillFields: 'Заполните все поля',
  wrongLogin: 'Неверный идентификатор или код доступа', userExists: 'Пользователь с таким email уже существует',
  typeIdea: 'Идея', typeTask: 'Задача', typeQuestion: 'Вопрос', typeResource: 'Ресурс', typeDecision: 'Решение',
  profileModalTitle: 'Профиль', profileSpaces: 'Пространства', profileNodes: 'Узлы',
  matchByTags: 'Совпадение по тегам', inviteToSpaces: 'Приглашение в пространства', sharedGraphRooms: 'Общие комнаты графов',
  hubMode: 'Режим хаба', graphMemory: 'Память графа', backup: 'Бэкап', safety: 'Безопасность',
  match: 'Совпадение', invite: 'Инвайт', sync: 'Синхронизация',
  similarInterestsTags: 'Похожие интересы и теги', sharedGraphSpaces: 'Общие пространства графов',
  optionalProfileDiscovery: 'Опциональный поиск профиля',
  deleteLinkConfirm: 'Удалить эту связь?', aiLocalTitle: 'AI-помощник (локальный)',
  aiContextReady: 'Контекст графа готов для внешнего AI.', aiContextTitle: 'Граф знаний', tagsNone: 'нет',
  aiIdea1: 'Сгруппируйте связанные узлы в отдельный кластер, чтобы карту было легче читать.',
  aiIdea2: 'У одного важного узла мало связей. Добавьте вокруг него промежуточные задачи или контекстные узлы.',
  aiIdea3: 'Граф формирует несколько направлений. Зрелые кластеры можно вынести в отдельные пространства.',
  aiIdea4: 'Добавьте теги приоритета к срочным узлам, чтобы фильтрация и поиск оставались полезными.'
};

const TYPE_I18N_KEYS = { idea: 'typeIdea', task: 'typeTask', question: 'typeQuestion', resource: 'typeResource', decision: 'typeDecision' };

function tr(key, vars = {}) {
  const dict = I18N[state.language] || I18N.uk;
  let text = dict[key] || I18N.en[key] || key;
  Object.entries(vars).forEach(([name, value]) => {
    text = text.replaceAll(`{${name}}`, value);
  });
  return text;
}

function typeLabel(typeId) {
  return tr(TYPE_I18N_KEYS[typeId] || 'typeIdea');
}

function currentLang() {
  return I18N[state.language] ? state.language : 'uk';
}

function getLocalizedTemplate(templateId) {
  const base = SPACE_TEMPLATES[templateId] || SPACE_TEMPLATES.blank;
  const localized = SPACE_TEMPLATE_I18N[currentLang()]?.[templateId] || {};
  return {
    ...base,
    ...localized,
    nodes: base.nodes.map((node, index) => ({
      ...node,
      ...(localized.nodes?.[index] || {})
    }))
  };
}

function getLocalizedPlan(plan) {
  const localized = PLAN_I18N[currentLang()]?.[plan.id] || {};
  return {
    ...plan,
    ...localized,
    features: localized.features || plan.features
  };
}

function getDemoCopy() {
  return DEMO_I18N[currentLang()] || DEMO_I18N.uk;
}

// ===== PERSISTENCE =====
function loadState() {
  try {
    const raw = localStorage.getItem('neurospace_v2');
    if (raw) {
      const saved = JSON.parse(raw);
      state.users = saved.users || {};
      state.currentUser = saved.currentUser || null;
      state.spaces = saved.spaces || [];
      state.nodes = saved.nodes || {};
      state.edges = saved.edges || {};
      state.theme = saved.theme || 'cyber';
      state.accentColor = saved.accentColor || '#00f5ff';
      state.language = saved.language || 'uk';
      state.subscriptionPlan = saved.subscriptionPlan || 'basic';
      state.nodeIdCounter = saved.nodeIdCounter || 1;
      state.edgeIdCounter = saved.edgeIdCounter || 1;
      state.spaceIdCounter = saved.spaceIdCounter || 1;
    }
  } catch(e) { console.error('Load error:', e); }
}

function saveState() {
  try {
    localStorage.setItem('neurospace_v2', JSON.stringify({
      users: state.users,
      currentUser: state.currentUser,
      spaces: state.spaces,
      nodes: state.nodes,
      edges: state.edges,
      theme: state.theme,
      accentColor: state.accentColor,
      language: state.language,
      subscriptionPlan: state.subscriptionPlan,
      nodeIdCounter: state.nodeIdCounter,
      edgeIdCounter: state.edgeIdCounter,
      spaceIdCounter: state.spaceIdCounter,
    }));
  } catch(e) { console.error('Save error:', e); }
}

// ===== NAVIGATION =====
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById(id);
  if (target) target.classList.add('active');
  applyStaticTranslations();
  if (id === 'hub') renderHub();
  if (id === 'engine') renderEngine();
  if (id === 'settings') {
    setSettingsTab('appearance');
    renderSettings('appearance');
  }
}

function setText(selector, value) {
  const el = document.querySelector(selector);
  if (el) el.textContent = value;
}

function setHtml(selector, value) {
  const el = document.querySelector(selector);
  if (el) el.innerHTML = value;
}

function setPlaceholder(selector, value) {
  const el = document.querySelector(selector);
  if (el) el.placeholder = value;
}

function applyStaticTranslations() {
  document.documentElement.lang = state.language || 'uk';
  setText('.gate-tabs .gate-tab:nth-child(1)', tr('login'));
  setText('.gate-tabs .gate-tab:nth-child(2)', tr('register'));
  setText('#login-form .gate-input-group:nth-child(1) .gate-label', tr('identifier'));
  setText('#login-form .gate-input-group:nth-child(2) .gate-label', tr('accessCode'));
  setText('#register-form .gate-input-group:nth-child(1) .gate-label', tr('nickname'));
  setText('#register-form .gate-input-group:nth-child(3) .gate-label', tr('accessCode'));
  setPlaceholder('#reg-pass', tr('accessMin'));
  setText('#login-form .gate-btn span', tr('enterSystem'));
  setText('#register-form .gate-btn span', tr('createAccount'));
  setText('.hub-nav-btn.plan', tr('plans'));
  setText('.hub-nav-btn.locked', tr('friends'));
  setText('.hub-nav-btn[href="#"]', tr('export'));
  setText('.hub-nav-btn[onclick*="settings"]', tr('settings'));
  setText('.hub-logout-btn', tr('logout'));
  setText('.hub-kicker', tr('commandCenter'));
  setHtml('.hub-title', `${tr('mySpaces').split(' ')[0] || tr('mySpaces')} <span>${tr('mySpaces').split(' ').slice(1).join(' ') || tr('spaces')}</span>`);
  setText('.hub-new-btn span', tr('newSpace'));
  setPlaceholder('#hub-search', tr('searchSpaces'));
  setHtml('.hub-tool-btn', `${tr('findFriends')} <span>${tr('locked')}</span>`);
  setText('.engine-space-name', document.getElementById('engine-space-name')?.textContent || tr('space'));
  setPlaceholder('#node-search', tr('searchNodes'));
  setText('.quick-capture .engine-sidebar-title', `// ${tr('quickCapture')}`);
  setPlaceholder('#quick-capture-input', tr('quickPlaceholder'));
  setText('.quick-capture-btn span', tr('capture'));
  setText('#connection-suggestions .engine-sidebar-title', `// ${tr('suggestedLinks')}`);
  const suggestionEmpty = document.querySelector('#connection-suggestions .suggestion-empty');
  if (suggestionEmpty) suggestionEmpty.textContent = tr('suggestEmpty');
  const sidebarTitles = document.querySelectorAll('.engine-sidebar-section .engine-sidebar-title, .engine-stats .engine-sidebar-title');
  if (sidebarTitles[0]) sidebarTitles[0].textContent = `// ${tr('tools')}`;
  if (sidebarTitles[1]) sidebarTitles[1].textContent = `// ${tr('actions')}`;
  if (sidebarTitles[2]) sidebarTitles[2].textContent = `// ${tr('stats')}`;
  setHtml('#tool-select', `<span class="tool-btn-icon">↖</span> ${tr('select')}`);
  setHtml('#tool-node', `<span class="tool-btn-icon">☐</span> ${tr('addNode')}`);
  setHtml('#tool-connect', `<span class="tool-btn-icon">⤢</span> ${tr('connect')}`);
  const buttons = document.querySelectorAll('.engine-sidebar .tool-btn');
  if (buttons[3]) buttons[3].innerHTML = `<span class="tool-btn-icon">⧉</span> ${tr('duplicate')} <span class="plan-badge">PLUS</span>`;
  if (buttons[4]) buttons[4].innerHTML = `<span class="tool-btn-icon">⌖</span> ${tr('focusNode')}`;
  if (buttons[5]) buttons[5].innerHTML = `<span class="tool-btn-icon">⬡</span> ${tr('autoLayout')}`;
  if (buttons[6]) buttons[6].innerHTML = `<span class="tool-btn-icon">⊡</span> ${tr('fitView')}`;
  if (buttons[7]) buttons[7].innerHTML = `<span class="tool-btn-icon">◇</span> ${tr('isolated')}`;
  if (buttons[8]) buttons[8].innerHTML = `<span class="tool-btn-icon">⌁</span> ${tr('smartLinks')} <span class="plan-badge">PLUS</span>`;
  if (buttons[9]) buttons[9].innerHTML = `<span class="tool-btn-icon">✕</span> ${tr('delete')}`;
  if (buttons[10]) buttons[10].innerHTML = `<span class="tool-btn-icon">JSON</span> ${tr('exportJson')}`;
  if (buttons[11]) buttons[11].innerHTML = `<span class="tool-btn-icon">IN</span> ${tr('importJson')}`;
  if (buttons[12]) buttons[12].innerHTML = `<span class="tool-btn-icon">AI</span> ${tr('aiAssistant')} <span class="plan-badge">PRO</span>`;
  const statLabels = document.querySelectorAll('.engine-stat-label');
  [tr('nodes'), tr('links'), tr('density'), tr('plan'), tr('usage')].forEach((label, i) => {
    if (statLabels[i]) statLabels[i].textContent = label.toUpperCase();
  });
  setText('#connect-indicator', tr('connectionMode'));
  setText('#progress-text', tr('analyzingNodes'));
  setText('#ai-panel .node-editor-title', `// ${tr('aiAssistant')}`);
  setText('#ai-panel .editor-close-btn', `× ${tr('close')}`);
  setText('#node-editor .node-editor-title', `// ${tr('nodeEditor')}`);
  const editorLabels = document.querySelectorAll('#node-editor .editor-label');
  [tr('title'), tr('description'), tr('tags'), tr('nodeType'), tr('color'), tr('connectedNodes')].forEach((label, i) => {
    if (editorLabels[i]) editorLabels[i].textContent = label;
  });
  setPlaceholder('#editor-title', tr('titlePlaceholder'));
  setPlaceholder('#editor-desc', tr('descPlaceholder'));
  setPlaceholder('#editor-tags', tr('tagsPlaceholder'));
  setText('#node-editor .editor-save-btn span', tr('save'));
  setText('#node-editor .editor-close-btn', `× ${tr('close')}`);
  const settingsItems = document.querySelectorAll('.settings-nav-item');
  if (settingsItems[0]) settingsItems[0].innerHTML = `<span>AP</span> ${tr('appearance')}`;
  if (settingsItems[1]) settingsItems[1].innerHTML = `<span>PR</span> ${tr('profile')}`;
  if (settingsItems[2]) settingsItems[2].innerHTML = `<span>DA</span> ${tr('data')}`;
  if (settingsItems[3]) settingsItems[3].innerHTML = `<span>FR</span> ${tr('friends')}`;
  if (settingsItems[4]) settingsItems[4].innerHTML = `<span>AB</span> ${tr('about')}`;
  setText('.settings-back-btn', `← ${tr('backHub')}`);
  setText('.command-title', tr('commandPalette'));
  setPlaceholder('#command-input', tr('commandPlaceholder'));
  updatePlanBadges();
}

// ===== AUTH =====
function switchTab(tab) {
  document.querySelectorAll('.gate-tab').forEach((t, i) => {
    t.classList.toggle('active', (i === 0 && tab === 'login') || (i === 1 && tab === 'register'));
  });
  document.getElementById('login-form').style.display = tab === 'login' ? '' : 'none';
  document.getElementById('register-form').style.display = tab === 'register' ? '' : 'none';
  document.getElementById('login-error').textContent = '';
  document.getElementById('reg-error').textContent = '';
}

function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pass = document.getElementById('login-pass').value;
  const errEl = document.getElementById('login-error');
  if (!email || !pass) { errEl.textContent = `⚠ ${tr('fillFields')}`; return; }
  const user = state.users[email];
  if (!user || user.pass !== pass) { errEl.textContent = `⚠ ${tr('wrongLogin')}`; return; }
  state.currentUser = email;
  saveState();
  showPage('hub');
  showToast(`✓ ${tr('welcomeBack')}, ${user.nick}`);
}

function doRegister() {
  const nick = document.getElementById('reg-nick').value.trim();
  const email = document.getElementById('reg-email').value.trim() || (nick + '@neurospace.io');
  const pass = document.getElementById('reg-pass').value;
  const errEl = document.getElementById('reg-error');
  if (!nick || !pass) { errEl.textContent = `⚠ ${tr('fillFields')}`; return; }
  if (state.users[email]) { errEl.textContent = `⚠ ${tr('userExists')}`; return; }
  state.users[email] = { nick, pass, createdAt: Date.now() };
  state.currentUser = email;
  if (state.spaces.length === 0) {
    createDemoData();
  }
  saveState();
  showPage('hub');
  showToast(`✓ ${tr('accountCreated')}, ${nick}`);
}

function doLogout() {
  state.currentUser = null;
  state.selectedNodeId = null;
  state.connectSource = null;
  saveState();
  showPage('gate');
}

function createDemoData() {
  const spaceId = 'sp_demo1';
  const demo = getDemoCopy();
  state.spaces.push({ id: spaceId, name: demo.spaceName, icon: '🧠', color: '#00f5ff' });
  state.nodes['n_d1'] = { id: 'n_d1', spaceId, x: 100, y: 100, ...demo.nodes[0], colorIdx: 0, type: 'idea' };
  state.nodes['n_d2'] = { id: 'n_d2', spaceId, x: 350, y: 50, ...demo.nodes[1], colorIdx: 2, type: 'idea' };
  state.nodes['n_d3'] = { id: 'n_d3', spaceId, x: 350, y: 200, ...demo.nodes[2], colorIdx: 1, type: 'idea' };
  state.nodes['n_d4'] = { id: 'n_d4', spaceId, x: 600, y: 120, ...demo.nodes[3], colorIdx: 3, type: 'task' };
  state.edges['e_d1'] = { id: 'e_d1', spaceId, from: 'n_d1', to: 'n_d2' };
  state.edges['e_d2'] = { id: 'e_d2', spaceId, from: 'n_d1', to: 'n_d3' };
  state.edges['e_d3'] = { id: 'e_d3', spaceId, from: 'n_d2', to: 'n_d4' };
  state.nodeIdCounter = 100;
  state.edgeIdCounter = 100;
  state.spaceIdCounter = 10;
}

// ===== HUB =====
function getSpaceStats(spaceId) {
  const nodeCount = Object.values(state.nodes).filter(n => n.spaceId === spaceId).length;
  const edgeCount = Object.values(state.edges).filter(e => e.spaceId === spaceId).length;
  const maxEdges = nodeCount * (nodeCount - 1) / 2;
  const density = maxEdges > 0 ? Math.round((edgeCount / maxEdges) * 100) : 0;
  return { nodeCount, edgeCount, density };
}

function getHubMetrics() {
  const totalNodes = Object.values(state.nodes).filter(n => state.spaces.some(s => s.id === n.spaceId)).length;
  const totalEdges = Object.values(state.edges).filter(e => state.spaces.some(s => s.id === e.spaceId)).length;
  const activeSpaces = state.spaces.length;
  const avgDensity = activeSpaces
    ? Math.round(state.spaces.reduce((sum, space) => sum + getSpaceStats(space.id).density, 0) / activeSpaces)
    : 0;
  return { activeSpaces, totalNodes, totalEdges, avgDensity };
}

function getActivePlan() {
  return SUBSCRIPTION_PLANS[state.subscriptionPlan] || SUBSCRIPTION_PLANS.basic;
}

function getPlanLevel(planId) {
  return { basic: 0, plus: 1, pro: 2 }[planId] ?? 0;
}

function planAllows(requiredPlan) {
  return getPlanLevel(state.subscriptionPlan) >= getPlanLevel(requiredPlan);
}

function requirePlan(requiredPlan, featureName) {
  if (planAllows(requiredPlan)) return true;
  showToast(`${featureName} ${tr('requires')} ${requiredPlan.toUpperCase()}`);
  openSubscriptionModal();
  return false;
}

function formatPlanLimit(value) {
  return value ? value.toLocaleString() : (state.language === 'en' ? 'Unlimited' : state.language === 'ru' ? 'Безлимит' : 'Безліміт');
}

function planUsagePct(value, limit) {
  if (!limit) return Math.min(100, Math.round(value / 500));
  return Math.min(100, Math.round((value / limit) * 100));
}

function canUsePlanResource(type, nextCount) {
  const plan = getActivePlan();
  const limit = plan.limits[type];
  return !limit || nextCount <= limit;
}

function showPlanLimit(type) {
  const plan = getActivePlan();
  showToast(`${plan.name}: ${tr('limitReached')} (${type})`);
  openSubscriptionModal();
}

function renderHub() {
  if (!state.currentUser) return;
  const user = state.users[state.currentUser];
  document.getElementById('hub-username').textContent = user.nick;
  document.getElementById('hub-avatar').textContent = user.nick.substring(0, 2).toUpperCase();
  applyAccentColor();
  if (state.theme) applyTheme(state.theme, true);
  const metrics = getHubMetrics();
  const plan = getActivePlan();
  const overview = document.getElementById('hub-overview');
  if (overview) {
    overview.innerHTML = `
      <div class="hub-metric"><span>${metrics.activeSpaces}</span><label>${tr('spaces')} / ${formatPlanLimit(plan.limits.spaces)}</label><div class="hub-meter"><i style="width:${planUsagePct(metrics.activeSpaces, plan.limits.spaces)}%"></i></div></div>
      <div class="hub-metric"><span>${metrics.totalNodes}</span><label>${tr('nodes')} / ${formatPlanLimit(plan.limits.nodes)}</label><div class="hub-meter"><i style="width:${planUsagePct(metrics.totalNodes, plan.limits.nodes)}%"></i></div></div>
      <div class="hub-metric"><span>${metrics.totalEdges}</span><label>${tr('links')} / ${formatPlanLimit(plan.limits.links)}</label><div class="hub-meter"><i style="width:${planUsagePct(metrics.totalEdges, plan.limits.links)}%"></i></div></div>
      <div class="hub-metric plan-metric"><span>${plan.name}</span><label>${plan.price}</label><button onclick="event.stopPropagation();openSubscriptionModal()">${tr('managePlan')}</button></div>
    `;
  }
  const query = document.getElementById('hub-search')?.value.trim().toLowerCase() || '';
  const grid = document.getElementById('spaces-grid');
  grid.innerHTML = '';
  const spaces = state.spaces.filter(space => space.name.toLowerCase().includes(query));
  spaces.forEach(space => {
    const { nodeCount, edgeCount, density } = getSpaceStats(space.id);
    const card = document.createElement('div');
    card.className = 'space-card';
    card.style.animationDelay = (spaces.indexOf(space) * 0.05) + 's';
    const initials = (space.name || 'NS').split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase();
    card.innerHTML = `
      <div class="space-card-accent" style="background:linear-gradient(90deg,${space.color || 'var(--accent)'},transparent)"></div>
      <div class="space-card-head">
        <div class="space-card-mark" style="border-color:${space.color || 'var(--accent)'}">${escHtml(initials)}</div>
        <div class="space-card-status">${tr('local')}</div>
      </div>
      <div class="space-card-name">${escHtml(space.name)}</div>
      <div class="space-card-meta">${nodeCount} ${tr('nodes').toLowerCase()} / ${edgeCount} ${tr('links').toLowerCase()}</div>
      <div class="space-card-progress"><span style="width:${Math.min(100, density)}%;background:${space.color || 'var(--accent)'}"></span></div>
      <div class="space-card-footer">
        <span>${tr('density')} ${density}%</span>
        <span>${tr('openGraph')}</span>
      </div>
      <button class="space-card-del" onclick="deleteSpace(event,'${space.id}')">✕</button>
    `;
    card.onclick = () => openSpace(space.id);
    grid.appendChild(card);
  });
  const newCard = document.createElement('div');
  newCard.className = 'space-card space-card-new';
  newCard.innerHTML = `<div class="space-card-new-icon"></div><div class="space-card-new-label">${tr('newSpace')}</div><div class="space-card-new-sub">${tr('startClean')}</div>`;
  newCard.onclick = () => openNewSpaceModal();
  grid.appendChild(newCard);
}

function deleteSpace(e, id) {
  e.stopPropagation();
  if (!confirm(tr('deleteSpaceConfirm'))) return;
  state.spaces = state.spaces.filter(s => s.id !== id);
  Object.keys(state.nodes).forEach(k => { if (state.nodes[k].spaceId === id) delete state.nodes[k]; });
  Object.keys(state.edges).forEach(k => { if (state.edges[k].spaceId === id) delete state.edges[k]; });
  saveState();
  renderHub();
  showToast(`✓ ${tr('spaceDeleted')}`);
}

function openSpace(id) {
  state.currentSpaceId = id;
  state.view = { x: 60, y: 60, scale: 1 };
  state.selectedNodeId = null;
  state.connectSource = null;
  showPage('engine');
}

// ===== PROFILE MODAL =====
function openProfileModal() {
  if (!state.currentUser) return;
  const user = state.users[state.currentUser];
  const spacesCount = state.spaces.length;
  const totalNodes = Object.values(state.nodes).filter(n => state.spaces.some(s => s.id === n.spaceId)).length;
  const totalEdges = Object.values(state.edges).filter(e => state.spaces.some(s => s.id === e.spaceId)).length;
  const modal = document.getElementById('modal');
  modal.querySelector('.modal-box')?.classList.remove('modal-box-wide');
  document.getElementById('modal-title').textContent = `// ${tr('profileModalTitle')}`;
  document.getElementById('modal-body').innerHTML = `
    <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px">
      <div style="width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,var(--accent),var(--accent3));display:flex;align-items:center;justify-content:center;font-family:'Orbitron',monospace;font-size:18px;font-weight:700;color:var(--bg)">${user.nick.substring(0,2).toUpperCase()}</div>
      <div>
        <div style="font-family:'Orbitron',monospace;font-size:16px;color:var(--text)">${escHtml(user.nick)}</div>
        <div style="font-family:'Share Tech Mono',monospace;font-size:11px;color:var(--text-dim)">${escHtml(state.currentUser)}</div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px">
      <div style="background:var(--glass);border:1px solid var(--border);padding:12px;text-align:center;border-radius:2px">
        <div style="font-family:'Orbitron',monospace;font-size:20px;color:var(--accent)">${spacesCount}</div>
        <div style="font-family:'Share Tech Mono',monospace;font-size:10px;color:var(--text-dim);letter-spacing:1px">${tr('profileSpaces').toUpperCase()}</div>
      </div>
      <div style="background:var(--glass);border:1px solid var(--border);padding:12px;text-align:center;border-radius:2px">
        <div style="font-family:'Orbitron',monospace;font-size:20px;color:var(--accent)">${totalNodes}</div>
        <div style="font-family:'Share Tech Mono',monospace;font-size:10px;color:var(--text-dim);letter-spacing:1px">${tr('profileNodes').toUpperCase()}</div>
      </div>
    </div>
    <div class="modal-actions">
      <button class="modal-btn modal-btn-primary" onclick="showPage('settings');closeModal()"><span>${tr('settings')}</span></button>
      <button class="modal-btn modal-btn-secondary" onclick="closeModal()">${tr('close')}</button>
    </div>
  `;
  modal.style.display = 'flex';
}

function openFriendsLocked() {
  const modal = document.getElementById('modal');
  modal.querySelector('.modal-box')?.classList.remove('modal-box-wide');
  document.getElementById('modal-title').textContent = `// ${tr('friendsTitle')}`;
  document.getElementById('modal-body').innerHTML = `
    <div class="locked-panel">
      <div class="locked-badge">${tr('lockedModule')}</div>
      <div class="locked-title">${tr('friendsModalTitle')}</div>
      <div class="locked-copy">${tr('friendsModalCopy')}</div>
      <div class="locked-preview">
        <div><span>01</span> ${tr('matchByTags')}</div>
        <div><span>02</span> ${tr('inviteToSpaces')}</div>
        <div><span>03</span> ${tr('sharedGraphRooms')}</div>
      </div>
    </div>
    <div class="modal-actions">
      <button class="modal-btn modal-btn-primary" onclick="showPage('settings');setSettingsTab('friends');closeModal()"><span>${tr('openSettings')}</span></button>
      <button class="modal-btn modal-btn-secondary" onclick="closeModal()">${tr('close')}</button>
    </div>
  `;
  modal.style.display = 'flex';
}

function openSubscriptionModal() {
  const modal = document.getElementById('modal');
  modal.querySelector('.modal-box')?.classList.add('modal-box-wide');
  const metrics = getHubMetrics();
  const activePlan = getActivePlan();
  document.getElementById('modal-title').textContent = `// ${tr('plans')}`;
  document.getElementById('modal-body').innerHTML = `
    <div class="plans-usage">
      <div>
        <span>${metrics.totalNodes}</span>
        <label>${tr('nodesUsed')}</label>
      </div>
      <div>
        <span>${metrics.activeSpaces}</span>
        <label>${tr('spaces')}</label>
      </div>
      <div>
        <span>${metrics.totalEdges}</span>
        <label>${tr('links').toLowerCase()}</label>
      </div>
    </div>
    <div class="plans-grid">
      ${Object.values(SUBSCRIPTION_PLANS).map(plan => {
        const planCopy = getLocalizedPlan(plan);
        return `
        <div class="plan-card ${plan.id === activePlan.id ? 'active' : ''}">
          <div class="plan-card-top">
            <div>
              <div class="plan-name">${plan.name}</div>
              <div class="plan-tagline">${escHtml(planCopy.tagline)}</div>
            </div>
            <div class="plan-price">${plan.price}</div>
          </div>
          <div class="plan-limits">
            <div><span>${formatPlanLimit(plan.limits.spaces)}</span> ${tr('spaces')}</div>
            <div><span>${formatPlanLimit(plan.limits.nodes)}</span> ${tr('nodes').toLowerCase()}</div>
            <div><span>${formatPlanLimit(plan.limits.links)}</span> ${tr('links').toLowerCase()}</div>
          </div>
          <div class="plan-features">
            ${planCopy.features.map(feature => `<div>${escHtml(feature)}</div>`).join('')}
          </div>
          <div class="plan-note">${escHtml(planCopy.note)}</div>
          <button class="plan-select" onclick="selectSubscriptionPlan('${plan.id}')">${plan.id === activePlan.id ? tr('currentPlan') : tr('selectPreview')}</button>
        </div>
      `;
      }).join('')}
    </div>
    <div class="plan-disclaimer">${tr('prototypeBilling')}</div>
  `;
  modal.style.display = 'flex';
}

function selectSubscriptionPlan(planId) {
  if (!SUBSCRIPTION_PLANS[planId]) return;
  state.subscriptionPlan = planId;
  saveState();
  openSubscriptionModal();
  renderHub();
  updatePlanBadges();
  showToast(`✓ ${tr('plan')}: ${SUBSCRIPTION_PLANS[planId].name}`);
}

function updatePlanBadges() {
  document.querySelectorAll('[data-plan]').forEach(el => {
    const required = el.dataset.plan;
    const allowed = planAllows(required);
    el.classList.toggle('locked-feature', !allowed);
    el.querySelectorAll('.plan-badge').forEach(badge => {
      badge.style.display = allowed ? 'none' : '';
      badge.textContent = required.toUpperCase();
    });
  });
}

// ===== NEW SPACE MODAL =====
function openNewSpaceModal() {
  if (!canUsePlanResource('spaces', state.spaces.length + 1)) {
    showPlanLimit('spaces');
    return;
  }
  newSpaceEmoji = '🧠';
  newSpaceColor = '#00f5ff';
  newSpaceTemplate = 'blank';
  const modal = document.getElementById('modal');
  modal.querySelector('.modal-box')?.classList.remove('modal-box-wide');
  document.getElementById('modal-title').textContent = `// ${tr('newSpace')}`;
  document.getElementById('modal-body').innerHTML = `
    <input class="modal-input" type="text" id="new-space-name" placeholder="${tr('newSpace')}..." autofocus>
    <div class="modal-field-label">${tr('template')}</div>
    <div class="template-grid">
      ${Object.keys(SPACE_TEMPLATES).map(id => {
        const tpl = getLocalizedTemplate(id);
        return `
        <button class="template-card ${id === newSpaceTemplate ? 'active' : ''}" onclick="selectSpaceTemplate('${id}',this)" type="button">
          <span>${escHtml(tpl.name)}</span>
          <small>${escHtml(tpl.desc)}</small>
        </button>
      `;
      }).join('')}
    </div>
    <div class="modal-field-label">${tr('visualTone')}</div>
    <div class="modal-tone-row">
      ${COLORS.map((c, i) => `<button class="modal-tone ${c===newSpaceColor?'active':''}" style="--tone:${c}" onclick="selectSpaceColor('${c}',this)" type="button"><span>${String(i + 1).padStart(2, '0')}</span></button>`).join('')}
    </div>
    <div class="modal-actions">
      <button class="modal-btn modal-btn-primary" onclick="createSpace()"><span>${tr('create')}</span></button>
      <button class="modal-btn modal-btn-secondary" onclick="closeModal()">${tr('cancel')}</button>
    </div>
  `;
  modal.style.display = 'flex';
  setTimeout(() => {
    const input = document.getElementById('new-space-name');
    if (input) {
      input.focus();
      input.addEventListener('keydown', e => { if (e.key === 'Enter') createSpace(); });
    }
  }, 100);
}

function selectEmoji(e, el) {
  newSpaceEmoji = e;
  document.querySelectorAll('.modal-emoji').forEach(el2 => el2.classList.remove('active'));
  el.classList.add('active');
}

function selectSpaceColor(c, el) {
  newSpaceColor = c;
  document.querySelectorAll('.modal-tone').forEach(el2 => el2.classList.remove('active'));
  el.classList.add('active');
}

function selectSpaceTemplate(templateId, el) {
  if (!SPACE_TEMPLATES[templateId]) return;
  newSpaceTemplate = templateId;
  document.querySelectorAll('.template-card').forEach(card => card.classList.remove('active'));
  el.classList.add('active');
}

function createSpace() {
  const name = document.getElementById('new-space-name')?.value.trim();
  if (!name) { showToast(`⚠ ${tr('enterName')}`); return; }
  if (!canUsePlanResource('spaces', state.spaces.length + 1)) {
    showPlanLimit('spaces');
    return;
  }
  const template = getLocalizedTemplate(newSpaceTemplate);
  if (!canUsePlanResource('nodes', getHubMetrics().totalNodes + template.nodes.length)) {
    showPlanLimit('nodes');
    return;
  }
  if (!canUsePlanResource('links', getHubMetrics().totalEdges + template.edges.length)) {
    showPlanLimit('links');
    return;
  }
  const space = { id: 'sp_' + (++state.spaceIdCounter), name, icon: newSpaceEmoji, color: newSpaceColor };
  state.spaces.unshift(space);
  createTemplateContent(space.id, newSpaceTemplate);
  saveState();
  closeModal();
  showToast(`✓ ${tr('spaceCreated')}: ${name}`);
  renderHub();
}

function createTemplateContent(spaceId, templateId) {
  const template = getLocalizedTemplate(templateId);
  const idMap = [];
  template.nodes.forEach(node => {
    const id = 'n_' + (++state.nodeIdCounter);
    idMap.push(id);
    state.nodes[id] = {
      id,
      spaceId,
      x: node.x,
      y: node.y,
      title: node.title,
      desc: node.desc || '',
      tags: node.tags || '',
      colorIdx: node.colorIdx || 0,
      type: node.type || 'idea'
    };
  });
  template.edges.forEach(([fromIdx, toIdx]) => {
    const from = idMap[fromIdx];
    const to = idMap[toIdx];
    if (!from || !to) return;
    const id = 'e_' + (++state.edgeIdCounter);
    state.edges[id] = { id, spaceId, from, to };
  });
}

function handleModalClick(e) {
  if (e.currentTarget === e.target) {
    closeModal();
  }
}
function closeModal() {
  document.querySelector('.modal-box')?.classList.remove('modal-box-wide');
  document.getElementById('modal').style.display = 'none';
}

// ===== ENGINE =====
function renderEngine() {
  const space = state.spaces.find(s => s.id === state.currentSpaceId);
  if (!space) return;
  document.getElementById('engine-space-name').textContent = space.name;
  applyAccentColor();
  const swatchContainer = document.getElementById('color-swatches');
  if (swatchContainer) {
    swatchContainer.innerHTML = NODE_COLORS.map((c, i) =>
      `<div class="color-swatch" style="background:${c.bg};border-color:${c.dot}" onclick="selectNodeColor(${i})" data-idx="${i}" title="${c.label}"></div>`
    ).join('');
  }
  const searchInput = document.getElementById('node-search');
  if (searchInput) searchInput.value = '';
  setTool('select');
  renderCanvas();
  applyView();
  updatePlanBadges();
}

function getSpaceNodes() {
  return Object.values(state.nodes).filter(n => n.spaceId === state.currentSpaceId);
}
function getSpaceEdges() {
  return Object.values(state.edges).filter(e => e.spaceId === state.currentSpaceId);
}

function renderCanvas() {
  const world = document.getElementById('canvas-world');
  if (!world) return;
  world.querySelectorAll('.node').forEach(n => n.remove());
  const nodes = getSpaceNodes();
  nodes.forEach(node => world.appendChild(createNodeEl(node)));
  renderEdges();
  updateStats();
  renderConnectionSuggestions(state.selectedNodeId);
}

function createNodeEl(node) {
  const colorSet = NODE_COLORS[node.colorIdx || 0];
  const type = NODE_TYPES[node.type || 'idea'] || NODE_TYPES.idea;
  const div = document.createElement('div');
  div.className = 'node';
  div.id = 'node-' + node.id;
  div.style.left = node.x + 'px';
  div.style.top = node.y + 'px';
  div.style.background = colorSet.bg;
  div.style.borderColor = colorSet.dot;
  if (node.id === state.selectedNodeId) div.classList.add('selected');
  const tagsHtml = node.tags ? node.tags.split(',').map(t => `<span class="node-tag">${escHtml(t.trim())}</span>`).join('') : '';
  div.innerHTML = `
    <div class="node-in-handle" data-node="${node.id}"></div>
    <div class="node-header">
      <div class="node-dot" style="background:${colorSet.dot};box-shadow:0 0 8px ${colorSet.dot}"></div>
      <div class="node-title">${escHtml(node.title)}</div>
      <div class="node-type" style="border-color:${type.color};color:${type.color}" title="${escAttr(typeLabel(node.type || 'idea'))}">${type.short}</div>
    </div>
    ${node.desc ? `<div class="node-desc">${escHtml(node.desc)}</div>` : ''}
    ${tagsHtml ? `<div class="node-tags">${tagsHtml}</div>` : ''}
    <div class="node-actions">
      <button class="node-action-btn" onclick="editNode(event,'${node.id}')">${tr('edit')}</button>
      <button class="node-action-btn" onclick="addSubnode(event,'${node.id}')">${tr('subnode')}</button>
      <button class="node-action-btn" onclick="startConnect('${node.id}',event)">${tr('addLink')}</button>
      <button class="node-action-btn danger" onclick="deleteNode(event,'${node.id}')">${tr('del')}</button>
    </div>
    <div class="node-connect-handle" data-node="${node.id}"></div>
  `;
  div.addEventListener('mousedown', (e) => onNodeMouseDown(e, node.id));
  const handle = div.querySelector('.node-connect-handle');
  if (handle) handle.addEventListener('mousedown', (e) => { e.stopPropagation(); startConnect(node.id, e); });
  return div;
}

function renderEdges() {
  const svg = document.getElementById('main-edges-svg');
  if (!svg) return;
  svg.innerHTML = '';
  const edges = getSpaceEdges();
  edges.forEach(edge => {
    const fromNode = state.nodes[edge.from];
    const toNode = state.nodes[edge.to];
    if (!fromNode || !toNode) return;
    const x1 = fromNode.x + 140;
    const y1 = fromNode.y + 30;
    const x2 = toNode.x;
    const y2 = toNode.y + 30;
    const cx = (x1 + x2) / 2;
    
    const bgPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    bgPath.setAttribute('d', `M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`);
    bgPath.setAttribute('class', 'edge-path-bg');
    svg.appendChild(bgPath);
    
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', `M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`);
    path.setAttribute('class', 'edge-path');
    path.setAttribute('data-edge', edge.id);
    path.addEventListener('click', () => {
      if (confirm(tr('deleteLinkConfirm'))) {
        delete state.edges[edge.id];
        saveState();
        renderCanvas();
        showToast(`✓ ${tr('delete')}`);
      }
    });
    svg.appendChild(path);
  });
}

// ===== DRAG & PAN =====
function onNodeMouseDown(e, nodeId) {
  if (e.target.tagName === 'BUTTON') return;
  if (e.target.classList.contains('node-connect-handle')) return;
  e.stopPropagation();
  if (state.tool === 'connect') {
    if (state.connectSource && state.connectSource !== nodeId) { finishConnect(nodeId); }
    else { startConnect(nodeId, e); }
    return;
  }
  selectNode(nodeId);
  const node = state.nodes[nodeId];
  const startX = e.clientX;
  const startY = e.clientY;
  const startNX = node.x;
  const startNY = node.y;
  state.dragging = nodeId;
  document.getElementById('node-' + nodeId)?.classList.add('dragging');
  const onMove = (ev) => {
    const dx = (ev.clientX - startX) / state.view.scale;
    const dy = (ev.clientY - startY) / state.view.scale;
    node.x = startNX + dx;
    node.y = startNY + dy;
    const el = document.getElementById('node-' + nodeId);
    if (el) { el.style.left = node.x + 'px'; el.style.top = node.y + 'px'; }
    renderEdges();
  };
  const onUp = () => {
    state.dragging = null;
    document.getElementById('node-' + nodeId)?.classList.remove('dragging');
    saveState();
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
  };
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
}

function applyView() {
  const world = document.getElementById('canvas-world');
  if (!world) return;
  world.style.transform = `translate(${state.view.x}px, ${state.view.y}px) scale(${state.view.scale})`;
  const zoomLabel = document.getElementById('zoom-label');
  if (zoomLabel) zoomLabel.textContent = Math.round(state.view.scale * 100) + '%';
}

function zoom(factor, cx, cy) {
  const wrap = document.getElementById('canvas-wrap');
  if (!wrap) return;
  const rect = wrap.getBoundingClientRect();
  const mx = (cx ?? rect.width/2) - rect.left;
  const my = (cy ?? rect.height/2) - rect.top;
  const newScale = Math.min(3, Math.max(0.2, state.view.scale * factor));
  state.view.x = mx - (mx - state.view.x) * (newScale / state.view.scale);
  state.view.y = my - (my - state.view.y) * (newScale / state.view.scale);
  state.view.scale = newScale;
  applyView();
}

function fitView() {
  const nodes = getSpaceNodes();
  if (!nodes.length) { state.view = {x:60,y:60,scale:1}; applyView(); return; }
  const wrap = document.getElementById('canvas-wrap');
  if (!wrap) return;
  const rect = wrap.getBoundingClientRect();
  const minX = Math.min(...nodes.map(n=>n.x));
  const maxX = Math.max(...nodes.map(n=>n.x)) + 160;
  const minY = Math.min(...nodes.map(n=>n.y));
  const maxY = Math.max(...nodes.map(n=>n.y)) + 60;
  const w = maxX - minX;
  const h = maxY - minY;
  const scaleX = (rect.width - 80) / w;
  const scaleY = (rect.height - 80) / h;
  const scale = Math.min(1.5, Math.max(0.3, Math.min(scaleX, scaleY)));
  state.view.scale = scale;
  state.view.x = (rect.width - w * scale) / 2 - minX * scale;
  state.view.y = (rect.height - h * scale) / 2 - minY * scale;
  applyView();
}

// ===== TOOLS =====
function setTool(tool) {
  state.tool = tool;
  ['select','node','connect'].forEach(t => {
    const btn = document.getElementById('tool-' + t);
    if (btn) btn.classList.toggle('active', t === tool);
  });
  if (tool !== 'connect') cancelConnect();
  const wrap = document.getElementById('canvas-wrap');
  if (wrap) wrap.style.cursor = tool === 'node' ? 'crosshair' : 'default';
}

function addNodeAt(e) {
  const wrap = document.getElementById('canvas-wrap');
  if (!wrap) return;
  const rect = wrap.getBoundingClientRect();
  const x = (e.clientX - rect.left - state.view.x) / state.view.scale;
  const y = (e.clientY - rect.top - state.view.y) / state.view.scale;
  createNode(x - 70, y - 30, tr('typeIdea'), '');
}

function createNode(x, y, title, desc, colorIdx, type = 'idea') {
  if (!canUsePlanResource('nodes', getHubMetrics().totalNodes + 1)) {
    showPlanLimit('nodes');
    return null;
  }
  const id = 'n_' + (++state.nodeIdCounter);
  state.nodes[id] = {
    id,
    spaceId: state.currentSpaceId,
    x,
    y,
    title: title || tr('typeIdea'),
    desc: desc || '',
    tags: '',
    colorIdx: colorIdx || 0,
    type
  };
  saveState();
  const world = document.getElementById('canvas-world');
  if (world) world.appendChild(createNodeEl(state.nodes[id]));
  updateStats();
  selectNode(id);
  showToast(`✓ ${tr('addNode')}`);
  return id;
}

function getQuickCapturePosition(index, total) {
  const wrap = document.getElementById('canvas-wrap');
  const rect = wrap ? wrap.getBoundingClientRect() : { width: 900, height: 600 };
  const visibleCenterX = (rect.width / 2 - state.view.x) / state.view.scale;
  const visibleCenterY = (rect.height / 2 - state.view.y) / state.view.scale;
  const cols = Math.min(3, Math.ceil(Math.sqrt(total)));
  const row = Math.floor(index / cols);
  const col = index % cols;
  const width = (cols - 1) * 220;
  return {
    x: visibleCenterX - width / 2 + col * 220 - 80,
    y: visibleCenterY + row * 120 - 40
  };
}

function quickCapture() {
  const input = document.getElementById('quick-capture-input');
  if (!input) return;
  const items = input.value
    .split(/\r?\n/)
    .map(item => item.trim())
    .filter(Boolean);

  if (!items.length) {
    showToast(`⚠ ${tr('quickPlaceholder')}`);
    input.focus();
    return;
  }

  let lastId = null;
  let captured = 0;
  for (let index = 0; index < items.length; index++) {
    const title = items[index];
    const pos = getQuickCapturePosition(index, items.length);
    lastId = createNode(pos.x, pos.y, title, '', index % NODE_COLORS.length);
    if (!lastId) break;
    captured++;
  }

  input.value = '';
  renderCanvas();
  if (lastId) selectNode(lastId);
  if (captured) showToast(`${tr('capture')}: ${captured}`);
}

function addSubnode(e, parentId) {
  e.stopPropagation();
  const parent = state.nodes[parentId];
  if (!parent) return;
  const id = createNode(parent.x + 200, parent.y, tr('subnode').replace('+', ''), '');
  if (!id) return;
  if (!canUsePlanResource('links', getHubMetrics().totalEdges + 1)) {
    showPlanLimit('links');
    return;
  }
  const eid = 'e_' + (++state.edgeIdCounter);
  state.edges[eid] = { id: eid, spaceId: state.currentSpaceId, from: parentId, to: id };
  saveState();
  renderCanvas();
  showToast(`✓ ${tr('links')}`);
}

function duplicateSelectedNode() {
  if (!requirePlan('plus', tr('duplicate'))) return;
  const source = state.nodes[state.selectedNodeId];
  if (!source) { showToast(`⚠ ${tr('suggestEmpty')}`); return; }
  const id = createNode(source.x + 34, source.y + 34, source.title + ' copy', source.desc || '', source.colorIdx || 0, source.type || 'idea');
  if (!id) return;
  state.nodes[id].tags = source.tags || '';
  saveState();
  renderCanvas();
  selectNode(id);
  showToast(`✓ ${tr('duplicated')}`);
}

function focusSelectedNode() {
  const node = state.nodes[state.selectedNodeId];
  if (!node) { showToast(`⚠ ${tr('suggestEmpty')}`); return; }
  const wrap = document.getElementById('canvas-wrap');
  if (!wrap) return;
  const rect = wrap.getBoundingClientRect();
  state.view.scale = Math.max(0.8, Math.min(1.4, state.view.scale));
  state.view.x = rect.width / 2 - (node.x + 80) * state.view.scale;
  state.view.y = rect.height / 2 - (node.y + 40) * state.view.scale;
  applyView();
  showToast(`✓ ${tr('focusNode')}`);
}

function highlightIsolatedNodes() {
  const connected = new Set();
  getSpaceEdges().forEach(edge => {
    connected.add(edge.from);
    connected.add(edge.to);
  });
  let count = 0;
  document.querySelectorAll('.node').forEach(el => el.classList.remove('search-highlight'));
  getSpaceNodes().forEach(node => {
    if (!connected.has(node.id)) {
      document.getElementById('node-' + node.id)?.classList.add('search-highlight');
      count++;
    }
  });
  showToast(count ? `${tr('isolated')}: ${count}` : `${tr('isolated')}: 0`);
}

function deleteNode(e, nodeId) {
  e.stopPropagation();
  delete state.nodes[nodeId];
  Object.keys(state.edges).forEach(eid => {
    const edge = state.edges[eid];
    if (edge.from === nodeId || edge.to === nodeId) delete state.edges[eid];
  });
  saveState();
  if (state.selectedNodeId === nodeId) { state.selectedNodeId = null; closeNodeEditor(); }
  renderCanvas();
  renderConnectionSuggestions(state.selectedNodeId);
  showToast(`✓ ${tr('delete')}`);
}

function deleteSelected() {
  if (state.selectedNodeId) {
    deleteNode({ stopPropagation: ()=>{} }, state.selectedNodeId);
  }
}

function edgeExists(fromId, toId) {
  return Object.values(state.edges).some(e =>
    (e.from === fromId && e.to === toId) ||
    (e.from === toId && e.to === fromId)
  );
}

function createConnection(fromId, toId) {
  if (!fromId || !toId || fromId === toId || edgeExists(fromId, toId)) return false;
  if (!canUsePlanResource('links', getHubMetrics().totalEdges + 1)) {
    showPlanLimit('links');
    return false;
  }
  const eid = 'e_' + (++state.edgeIdCounter);
  state.edges[eid] = { id: eid, spaceId: state.currentSpaceId, from: fromId, to: toId };
  saveState();
  renderEdges();
  updateStats();
  renderConnectionSuggestions(state.selectedNodeId || fromId);
  return true;
}

// ===== SELECT =====
function selectNode(id) {
  state.selectedNodeId = id;
  document.querySelectorAll('.node').forEach(n => n.classList.remove('selected'));
  if (id) {
    const el = document.getElementById('node-' + id);
    if (el) el.classList.add('selected');
    const deleteBtn = document.getElementById('delete-btn');
    if (deleteBtn) deleteBtn.style.display = '';
  } else {
    closeNodeEditor();
    const deleteBtn = document.getElementById('delete-btn');
    if (deleteBtn) deleteBtn.style.display = 'none';
  }
  renderConnectionSuggestions(id);
}

// ===== CONNECT =====
function startConnect(nodeId, e) {
  if (e?.stopPropagation) e.stopPropagation();
  state.connectSource = nodeId;
  setTool('connect');
  const indicator = document.getElementById('connect-indicator');
  if (indicator) indicator.classList.add('active');
  showToast(tr('connectionMode'));
}

function finishConnect(toId) {
  if (!state.connectSource || state.connectSource === toId) { cancelConnect(); return; }
  if (edgeExists(state.connectSource, toId)) { showToast(`⚠ ${tr('linkButton')} exists`); cancelConnect(); return; }
  createConnection(state.connectSource, toId);
  cancelConnect();
  showToast(`✓ ${tr('links')}`);
}

function cancelConnect() {
  state.connectSource = null;
  const indicator = document.getElementById('connect-indicator');
  if (indicator) indicator.classList.remove('active');
  const tp = document.getElementById('temp-edge-path');
  if (tp) tp.style.display = 'none';
}

function updateTempEdge(e) {
  if (!state.connectSource) return;
  const fromNode = state.nodes[state.connectSource];
  if (!fromNode) return;
  const wrap = document.getElementById('canvas-wrap');
  if (!wrap) return;
  const rect = wrap.getBoundingClientRect();
  const x1 = fromNode.x * state.view.scale + state.view.x + 140 * state.view.scale;
  const y1 = fromNode.y * state.view.scale + state.view.y + 30 * state.view.scale;
  const x2 = e.clientX - rect.left;
  const y2 = e.clientY - rect.top;
  const cx = (x1 + x2) / 2;
  const path = document.getElementById('temp-edge-path');
  if (path) {
    path.setAttribute('d', `M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`);
    path.style.display = '';
  }
}

function tokenizeNode(node) {
  return (node.title + ' ' + (node.desc || '') + ' ' + (node.tags || ''))
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(token => token.length > 2);
}

function getConnectionSuggestions(nodeId, limit = 4) {
  const source = state.nodes[nodeId];
  if (!source) return [];
  const sourceTokens = new Set(tokenizeNode(source));
  return getSpaceNodes()
    .filter(node => node.id !== nodeId && !edgeExists(nodeId, node.id))
    .map(node => {
      const tokens = tokenizeNode(node);
      const shared = tokens.filter(token => sourceTokens.has(token));
      const dx = (node.x || 0) - (source.x || 0);
      const dy = (node.y || 0) - (source.y || 0);
      const distance = Math.sqrt(dx * dx + dy * dy);
      const distanceScore = Math.max(0, 1 - distance / 900);
      const score = shared.length * 3 + distanceScore;
      return {
        node,
        score,
        shared: [...new Set(shared)].slice(0, 3),
        reason: shared.length ? 'context' : 'nearby'
      };
    })
    .filter(item => item.score > 0.12)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function renderConnectionSuggestions(nodeId) {
  const panel = document.getElementById('connection-suggestions');
  if (!panel) return;
  const title = `<div class="engine-sidebar-title">// ${tr('suggestedLinks')}</div>`;
  if (!nodeId || !state.nodes[nodeId]) {
    panel.innerHTML = title + `<div class="suggestion-empty">${tr('suggestEmpty')}</div>`;
    return;
  }

  const source = state.nodes[nodeId];
  const suggestions = getConnectionSuggestions(nodeId);
  if (!suggestions.length) {
    panel.innerHTML = title + `<div class="suggestion-source">${escHtml(source.title)}</div><div class="suggestion-empty">${tr('noSuggestions')}</div>`;
    return;
  }

  panel.innerHTML = title + `
    <div class="suggestion-source">${escHtml(source.title)}</div>
    ${suggestions.map(item => `
      <button class="suggestion-item" onclick="connectSuggested('${nodeId}','${item.node.id}')">
        <span class="suggestion-name">${escHtml(item.node.title)}</span>
        <span class="suggestion-reason">${item.reason}${item.shared.length ? ': ' + escHtml(item.shared.join(', ')) : ''}</span>
      </button>
    `).join('')}
  `;
}

function connectSuggested(fromId, toId) {
  if (createConnection(fromId, toId)) {
    selectNode(toId);
    showToast(`✓ ${tr('linkButton')}`);
  } else {
    showToast(`⚠ ${tr('linkButton')} exists`);
  }
}

// ===== NODE EDITOR =====
function editNode(e, nodeId) {
  e.stopPropagation();
  selectNode(nodeId);
  const node = state.nodes[nodeId];
  if (!node) return;
  document.getElementById('editor-title').value = node.title;
  document.getElementById('editor-desc').value = node.desc || '';
  document.getElementById('editor-tags').value = node.tags || '';
  const typeSelect = document.getElementById('editor-type');
  if (typeSelect) {
    typeSelect.innerHTML = Object.entries(NODE_TYPES)
      .map(([id]) => `<option value="${id}">${typeLabel(id)}</option>`)
      .join('');
    typeSelect.value = node.type || 'idea';
  }
  document.querySelectorAll('.color-swatch').forEach(s => {
    s.classList.toggle('active', parseInt(s.dataset.idx) === (node.colorIdx || 0));
  });
  const connEl = document.getElementById('editor-connections');
  if (connEl) {
    const edges = getSpaceEdges().filter(e => e.from === nodeId || e.to === nodeId);
    const connectedIds = edges.map(e => e.from === nodeId ? e.to : e.from);
    const connectedNodes = connectedIds.map(id => state.nodes[id]).filter(Boolean);
    connEl.innerHTML = connectedNodes.length
      ? connectedNodes.map(n => `<span class="connected-node-badge" onclick="selectNode('${n.id}')">${escHtml(n.title)}</span>`).join('')
      : `<span style="color:var(--text-dim)">${tr('noSuggestions')}</span>`;
  }
  document.getElementById('node-editor')?.classList.add('open');
}

function selectNodeColor(idx) {
  document.querySelectorAll('.color-swatch').forEach(s => {
    s.classList.toggle('active', parseInt(s.dataset.idx) === idx);
  });
  if (state.selectedNodeId) {
    state.nodes[state.selectedNodeId].colorIdx = idx;
    const colorSet = NODE_COLORS[idx];
    const el = document.getElementById('node-' + state.selectedNodeId);
    if (el) {
      el.style.background = colorSet.bg;
      el.style.borderColor = colorSet.dot;
      const dot = el.querySelector('.node-dot');
      if (dot) { dot.style.background = colorSet.dot; dot.style.boxShadow = `0 0 8px ${colorSet.dot}`; }
    }
  }
}

function saveNodeEdit() {
  if (!state.selectedNodeId) return;
  const node = state.nodes[state.selectedNodeId];
  if (!node) return;
  node.title = document.getElementById('editor-title')?.value || tr('title');
  node.desc = document.getElementById('editor-desc')?.value || '';
  node.tags = document.getElementById('editor-tags')?.value || '';
  node.type = document.getElementById('editor-type')?.value || 'idea';
  const activeColor = document.querySelector('.color-swatch.active');
  if (activeColor) node.colorIdx = parseInt(activeColor.dataset.idx);
  saveState();
  const el = document.getElementById('node-' + node.id);
  if (el) {
    const titleEl = el.querySelector('.node-title');
    if (titleEl) titleEl.textContent = node.title;
    const typeEl = el.querySelector('.node-type');
    const type = NODE_TYPES[node.type] || NODE_TYPES.idea;
    if (typeEl) {
      typeEl.textContent = type.short;
      typeEl.title = typeLabel(node.type || 'idea');
      typeEl.style.borderColor = type.color;
      typeEl.style.color = type.color;
    }
    const descEl = el.querySelector('.node-desc');
    if (node.desc) {
      if (descEl) descEl.textContent = node.desc;
      else {
        const headerEl = el.querySelector('.node-header');
        if (headerEl) headerEl.insertAdjacentHTML('afterend', `<div class="node-desc">${escHtml(node.desc)}</div>`);
      }
    } else if (descEl) descEl.remove();
    const tagsContainer = el.querySelector('.node-tags');
    if (tagsContainer) {
      tagsContainer.innerHTML = node.tags
        ? node.tags.split(',').map(t => `<span class="node-tag">${escHtml(t.trim())}</span>`).join('')
        : '';
    } else if (node.tags) {
      const tagsDiv = document.createElement('div');
      tagsDiv.className = 'node-tags';
      tagsDiv.innerHTML = node.tags.split(',').map(t => `<span class="node-tag">${escHtml(t.trim())}</span>`).join('');
      const actionsEl = el.querySelector('.node-actions');
      if (actionsEl) actionsEl.before(tagsDiv);
    }
  }
  closeNodeEditor();
  showToast(`✓ ${tr('save')}`);
}

function closeNodeEditor() {
  document.getElementById('node-editor')?.classList.remove('open');
}

// ===== AUTO LAYOUT =====
function autoLayout() {
  const nodes = getSpaceNodes();
  if (!nodes.length) return;
  const cols = Math.ceil(Math.sqrt(nodes.length));
  nodes.forEach((n, i) => {
    n.x = 60 + (i % cols) * 220;
    n.y = 60 + Math.floor(i / cols) * 140;
  });
  saveState();
  renderCanvas();
  fitView();
  showToast(`✓ ${tr('autoLayout')}`);
}

// ===== STATS =====
function updateStats() {
  const nodeCount = getSpaceNodes().length;
  const edgeCount = getSpaceEdges().length;
  const statNodes = document.getElementById('stat-nodes');
  const statEdges = document.getElementById('stat-edges');
  const statDensity = document.getElementById('stat-density');
  const statPlan = document.getElementById('stat-plan');
  const statUsage = document.getElementById('stat-usage');
  if (statNodes) statNodes.textContent = nodeCount;
  if (statEdges) statEdges.textContent = edgeCount;
  if (statDensity) {
    const maxEdges = nodeCount * (nodeCount - 1) / 2;
    const density = maxEdges > 0 ? Math.round((edgeCount / maxEdges) * 100) : 0;
    statDensity.textContent = density + '%';
  }
  if (statPlan) statPlan.textContent = getActivePlan().name;
  if (statUsage) {
    const metrics = getHubMetrics();
    const plan = getActivePlan();
    statUsage.textContent = `${metrics.totalNodes}/${formatPlanLimit(plan.limits.nodes)} N`;
    statUsage.title = `${metrics.totalEdges}/${formatPlanLimit(plan.limits.links)} links`;
  }
}

// ===== SMART CONNECT =====
function smartConnect() {
  if (!requirePlan('plus', tr('smartLinks'))) return;
  const nodes = getSpaceNodes();
  if (nodes.length < 2) { showToast(`⚠ ${tr('nodes')}: 2+`); return; }
  const progressDiv = document.getElementById('smart-connect-progress');
  const progressFill = document.getElementById('progress-fill');
  const progressText = document.getElementById('progress-text');
  if (progressDiv) {
    clearTimeout(progressDiv._hideTimer);
    progressDiv.style.display = 'block';
    progressDiv.style.opacity = '1';
  }
  if (progressFill) progressFill.style.width = '0%';
  if (progressText) progressText.textContent = tr('analyzingNodes');
  const existingEdges = new Set();
  getSpaceEdges().forEach(e => existingEdges.add(e.from + '|' + e.to));
  let totalPairs = nodes.length * (nodes.length - 1) / 2;
  let processed = 0;
  let newEdges = 0;
  let i = 0, j = 1;
  function tokenize(text) {
    return text.toLowerCase().replace(/[^\w\sа-яёіїєґ]/g, '').split(/\s+/).filter(w => w.length > 2);
  }
  function finishSmartConnect(message) {
    if (progressText) progressText.textContent = message || `✓ ${tr('smartDone')}`;
    if (progressFill) progressFill.style.width = '100%';
    if (progressDiv) {
      progressDiv._hideTimer = setTimeout(() => {
        progressDiv.style.opacity = '0';
        progressDiv._hideTimer = setTimeout(() => {
          progressDiv.style.display = 'none';
        }, 220);
      }, 350);
    }
    saveState();
    renderCanvas();
    showToast(`${tr('smartLinks')}: ${newEdges} ${tr('links').toLowerCase()}`);
  }
  function step() {
    if (i >= nodes.length) {
      finishSmartConnect(`✓ ${tr('smartDone')}`);
      return;
    }
    if (j >= nodes.length) {
      i++;
      j = i + 1;
      if (i >= nodes.length - 1) {
        finishSmartConnect(`✓ ${tr('smartDone')}`);
        return;
      }
    }
    const a = nodes[i], b = nodes[j];
    const key1 = a.id + '|' + b.id;
    const key2 = b.id + '|' + a.id;
    if (!existingEdges.has(key1) && !existingEdges.has(key2)) {
      const textA = (a.title + ' ' + (a.desc || '') + ' ' + (a.tags || '')).toLowerCase();
      const textB = (b.title + ' ' + (b.desc || '') + ' ' + (b.tags || '')).toLowerCase();
      const tokensA = new Set(tokenize(textA));
      const tokensB = tokenize(textB);
      const common = tokensB.filter(t => tokensA.has(t)).length;
      const totalTokens = new Set([...tokensA, ...tokensB]).size;
      const similarity = totalTokens > 0 ? common / totalTokens : 0;
      if (similarity >= 0.3) {
        if (!canUsePlanResource('links', getHubMetrics().totalEdges + newEdges + 1)) {
          finishSmartConnect(tr('linkLimit'));
          showPlanLimit('links');
          return;
        }
        const eid = 'e_' + (++state.edgeIdCounter);
        state.edges[eid] = { id: eid, spaceId: state.currentSpaceId, from: a.id, to: b.id };
        existingEdges.add(key1);
        existingEdges.add(key2);
        newEdges++;
      }
    }
    processed++;
    j++;
    const pct = Math.min(100, Math.round((processed / totalPairs) * 100));
    if (progressFill) progressFill.style.width = pct + '%';
    if (progressText) progressText.textContent = `${tr('analyzingNodes')} ${processed}/${totalPairs}`;
    setTimeout(() => {
      try {
        step();
      } catch (err) {
        console.error(err);
        finishSmartConnect(tr('smartStopped'));
      }
    }, 0);
  }
  try {
    step();
  } catch (err) {
    console.error(err);
    finishSmartConnect(tr('smartStopped'));
  }
}

// ===== SEARCH =====
function searchNodes() {
  const query = document.getElementById('node-search')?.value.trim().toLowerCase();
  document.querySelectorAll('.node').forEach(el => el.classList.remove('search-highlight'));
  if (!query) return;
  getSpaceNodes().forEach(node => {
    const text = (node.title + ' ' + (node.desc || '') + ' ' + (node.tags || '')).toLowerCase();
    if (text.includes(query)) {
      document.getElementById('node-' + node.id)?.classList.add('search-highlight');
    }
  });
}

// ===== EXPORT / IMPORT =====
function exportSpaceJSON() {
  const space = state.spaces.find(s => s.id === state.currentSpaceId);
  if (!space) return;
  const data = {
    space: space,
    nodes: getSpaceNodes(),
    edges: getSpaceEdges().map(e => ({ id: e.id, from: e.from, to: e.to })),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = (space.name || 'space').replace(/[^a-zа-яёіїєґ0-9]/gi,'_') + '.json';
  a.click();
  URL.revokeObjectURL(url);
  showToast(`✓ ${tr('export')}`);
}

function importSpaceJSON() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (re) => {
      try {
        const data = JSON.parse(re.target.result);
        if (!data.space || !data.nodes) throw new Error('Invalid format');
        const newSpaceId = 'sp_' + (++state.spaceIdCounter);
        data.space.id = newSpaceId;
        state.spaces.push(data.space);
        const idMap = {};
        data.nodes.forEach(n => {
          const newId = 'n_' + (++state.nodeIdCounter);
          idMap[n.id] = newId;
          state.nodes[newId] = { ...n, id: newId, spaceId: newSpaceId };
        });
        if (data.edges) {
          data.edges.forEach(e => {
            const newId = 'e_' + (++state.edgeIdCounter);
            state.edges[newId] = { id: newId, spaceId: newSpaceId, from: idMap[e.from] || e.from, to: idMap[e.to] || e.to };
          });
        }
        saveState();
        showToast(`✓ ${tr('importJson')}`);
        showPage('hub');
      } catch (err) { showToast(`⚠ ${tr('fileError')}`); }
    };
    reader.readAsText(file);
  };
  input.click();
}

// ===== SETTINGS =====
function setSettingsTab(tab) {
  document.querySelectorAll('.settings-nav-item').forEach((el, i) => {
    const tabs = ['appearance', 'profile', 'data', 'friends', 'about'];
    el.classList.toggle('active', tabs[i] === tab);
  });
  renderSettings(tab);
}

function renderSettings(tab) {
  const el = document.getElementById('settings-content');
  if (!el) return;
  if (tab === 'appearance') {
    el.innerHTML = `
      <div class="settings-section-title">${tr('appearance')} <span>${tr('settings')}</span></div>
      <div class="settings-section-sub">// ${tr('interfaceControl')}</div>
      <div class="settings-group">
        <div class="settings-group-title">${tr('language')}</div>
        <div class="language-cards">
          <button class="language-card ${state.language==='en'?'active':''}" onclick="setLanguage('en')"><span>EN</span>${tr('english')}</button>
          <button class="language-card ${state.language==='uk'?'active':''}" onclick="setLanguage('uk')"><span>UA</span>${tr('ukrainian')}</button>
          <button class="language-card ${state.language==='ru'?'active':''}" onclick="setLanguage('ru')"><span>RU</span>${tr('russian')}</button>
        </div>
        <div class="settings-note">${tr('languageSub')}</div>
      </div>
      <div class="settings-group">
        <div class="settings-group-title">${tr('theme')}</div>
        <div class="theme-cards">
          <div class="theme-card ${state.theme==='cyber'?'active':''}" onclick="applyTheme('cyber')"><div class="theme-card-preview" style="background:#040810"><div class="theme-card-bar" style="background:#00f5ff;width:80%"></div><div class="theme-card-bar" style="background:rgba(0,245,255,0.3);width:60%"></div></div><div class="theme-card-label">CYBER</div></div>
          <div class="theme-card ${state.theme==='glass'?'active':''}" onclick="applyTheme('glass')"><div class="theme-card-preview" style="background:linear-gradient(135deg,#1a1040,#0a1530)"><div class="theme-card-bar" style="background:rgba(255,255,255,0.6);width:80%"></div><div class="theme-card-bar" style="background:rgba(255,255,255,0.3);width:60%"></div></div><div class="theme-card-label">GLASS</div></div>
          <div class="theme-card ${state.theme==='neon'?'active':''}" onclick="applyTheme('neon')"><div class="theme-card-preview" style="background:#0a000f"><div class="theme-card-bar" style="background:#ff006e;width:80%"></div><div class="theme-card-bar" style="background:#7b2fff;width:60%"></div></div><div class="theme-card-label">NEON</div></div>
        </div>
      </div>
      <div class="settings-group">
        <div class="settings-group-title">${tr('accentColor')}</div>
        <div class="accent-colors">
          ${COLORS.map(c => `<div class="accent-btn ${state.accentColor===c?'active':''}" style="background:${c}" onclick="applyAccent('${c}')"></div>`).join('')}
        </div>
      </div>
      <div class="settings-grid">
        <div class="settings-feature"><div class="settings-feature-kicker">${tr('hubMode')}</div><div class="settings-feature-title">${tr('cleanHubTitle')}</div><div class="settings-feature-copy">${tr('cleanHubCopy')}</div></div>
        <div class="settings-feature"><div class="settings-feature-kicker">${tr('graphMemory')}</div><div class="settings-feature-title">${tr('suggestionsTitle')}</div><div class="settings-feature-copy">${tr('suggestionsCopy')}</div></div>
      </div>
    `;
  } else if (tab === 'profile') {
    const user = state.users[state.currentUser] || {};
    el.innerHTML = `
      <div class="settings-section-title">${tr('profileTitle')}</div>
      <div class="settings-section-sub">// ${tr('identitySub')}</div>
      <div class="settings-group">
        <div class="settings-group-title">${tr('nickname')}</div>
        <input class="editor-input" type="text" id="profile-nick" value="${escHtml(user.nick || '')}" style="max-width:300px;margin-bottom:12px">
        <button class="editor-save-btn" style="max-width:160px" onclick="saveProfile()"><span>${tr('save')}</span></button>
      </div>
      <div class="settings-profile-card">
        <div class="settings-profile-avatar">${escHtml((user.nick || 'NS').substring(0,2).toUpperCase())}</div>
        <div>
          <div class="settings-profile-name">${escHtml(user.nick || 'NeuroPilot')}</div>
          <div class="settings-profile-sub">${state.spaces.length} ${tr('spaces')} / ${Object.keys(state.nodes).length} ${tr('nodes').toLowerCase()}</div>
        </div>
      </div>
    `;
  } else if (tab === 'data') {
    el.innerHTML = `
      <div class="settings-section-title">${tr('dataTitle')}</div>
      <div class="settings-section-sub">// ${tr('dataSub')}</div>
      <div class="settings-group">
        <button class="hub-download-btn" onclick="exportAllData()" style="margin-right:10px">${tr('exportBackup')}</button>
        <button class="hub-download-btn" onclick="importAllData()">${tr('importBackup')}</button>
        <div class="settings-note">${tr('storageNote')}</div>
      </div>
      <div class="settings-grid">
        <div class="settings-feature"><div class="settings-feature-kicker">${tr('backup')}</div><div class="settings-feature-title">${tr('backupTitle')}</div><div class="settings-feature-copy">${tr('backupCopy')}</div></div>
        <div class="settings-feature"><div class="settings-feature-kicker">${tr('safety')}</div><div class="settings-feature-title">${tr('restoreTitle')}</div><div class="settings-feature-copy">${tr('restoreCopy')}</div></div>
      </div>
    `;
  } else if (tab === 'friends') {
    el.innerHTML = `
      <div class="settings-section-title">${tr('friendsTitle')}</div>
      <div class="settings-section-sub">// ${tr('friendsSub')}</div>
      <div class="locked-settings">
        <div class="locked-badge">${tr('locked')}</div>
        <div class="locked-title">${tr('friendsLockedTitle')}</div>
        <div class="locked-copy">${tr('friendsLockedCopy')}</div>
        <div class="locked-preview">
          <div><span>${tr('match')}</span> ${tr('similarInterestsTags')}</div>
          <div><span>${tr('invite')}</span> ${tr('sharedGraphSpaces')}</div>
          <div><span>${tr('sync')}</span> ${tr('optionalProfileDiscovery')}</div>
        </div>
      </div>
    `;
  } else if (tab === 'about') {
    el.innerHTML = `
      <div class="settings-section-title">${tr('about')} <span>NeuroSpace</span></div>
      <div class="settings-section-sub">// ${tr('aboutSub')}</div>
      <div class="settings-group">
        <p style="color:var(--text-dim);line-height:1.6">${tr('aboutCopy')}</p>
      </div>
    `;
  }
}

function setLanguage(language) {
  if (!I18N[language]) return;
  state.language = language;
  saveState();
  applyStaticTranslations();
  const activeSettings = [...document.querySelectorAll('.settings-nav-item')].findIndex(item => item.classList.contains('active'));
  const tabs = ['appearance', 'profile', 'data', 'friends', 'about'];
  if (document.getElementById('settings')?.classList.contains('active')) renderSettings(tabs[activeSettings] || 'appearance');
  if (document.getElementById('hub')?.classList.contains('active')) renderHub();
  if (document.getElementById('engine')?.classList.contains('active')) renderEngine();
  showToast(`✓ ${tr('languageChanged')}`);
}

function applyTheme(theme, silent = false) {
  state.theme = theme;
  saveState();
  const themes = {
    cyber: { bg: '#040810', bg2: '#080f1a', bg3: '#0d1829' },
    glass: { bg: '#0d0a20', bg2: '#120f2a', bg3: '#171330' },
    neon: { bg: '#0a000f', bg2: '#100015', bg3: '#150020' },
  };
  const t = themes[theme];
  if (t) {
    document.documentElement.style.setProperty('--bg', t.bg);
    document.documentElement.style.setProperty('--bg2', t.bg2);
    document.documentElement.style.setProperty('--bg3', t.bg3);
  }
  document.querySelectorAll('.theme-card').forEach(el => {
    el.classList.toggle('active', el.querySelector('.theme-card-label')?.textContent.toLowerCase() === theme);
  });
  if (!silent) showToast(`✓ ${tr('themeChanged')}: ${theme.toUpperCase()}`);
}

function applyAccent(color) {
  state.accentColor = color;
  saveState();
  applyAccentColor();
  document.querySelectorAll('.accent-btn').forEach(el => {
    el.classList.toggle('active', el.style.background === color);
  });
  showToast(`✓ ${tr('accentChanged')}`);
}

function applyAccentColor() {
  document.documentElement.style.setProperty('--accent', state.accentColor);
  document.documentElement.style.setProperty('--border', `rgba(${hexToRgb(state.accentColor)},0.18)`);
  document.documentElement.style.setProperty('--glass', `rgba(${hexToRgb(state.accentColor)},0.04)`);
  document.documentElement.style.setProperty('--glass2', `rgba(${hexToRgb(state.accentColor)},0.08)`);
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `${r},${g},${b}`;
}

function saveProfile() {
  const nickInput = document.getElementById('profile-nick');
  if (!nickInput) return;
  const nick = nickInput.value.trim();
  if (!nick) return;
  if (state.users[state.currentUser]) {
    state.users[state.currentUser].nick = nick;
    saveState();
    showToast(`✓ ${tr('profileSaved')}`);
    renderHub();
  }
}

function exportAllData() {
  const blob = new Blob([JSON.stringify({
    users: state.users,
    spaces: state.spaces,
    nodes: state.nodes,
    edges: state.edges,
    theme: state.theme,
    accentColor: state.accentColor,
    subscriptionPlan: state.subscriptionPlan,
    language: state.language,
  }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'neurospace_full_backup.json';
  a.click();
  URL.revokeObjectURL(url);
  showToast(`✓ ${tr('backupSaved')}`);
}

function importAllData() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (re) => {
      try {
        const data = JSON.parse(re.target.result);
        if (confirm(tr('replaceData'))) {
          state.users = data.users || {};
          state.spaces = data.spaces || [];
          state.nodes = data.nodes || {};
          state.edges = data.edges || {};
          state.theme = data.theme || 'cyber';
          state.accentColor = data.accentColor || '#00f5ff';
          state.subscriptionPlan = data.subscriptionPlan || 'basic';
          state.language = data.language || state.language || 'uk';
          saveState();
          showToast(`✓ ${tr('imported')}`);
          showPage('hub');
        }
      } catch (err) { showToast(`⚠ ${tr('fileError')}`); }
    };
    reader.readAsText(file);
  };
  input.click();
}

// ===== AI PANEL =====
function toggleAIPanel() {
  if (!requirePlan('pro', tr('aiAssistant'))) return;
  const panel = document.getElementById('ai-panel');
  if (!panel) return;
  panel.classList.toggle('open');
  if (panel.classList.contains('open')) generateAIResponse();
}

function closeAIPanel() {
  document.getElementById('ai-panel')?.classList.remove('open');
}

function generateAIResponse() {
  const responseEl = document.getElementById('ai-response-content');
  if (!responseEl) return;
  responseEl.innerHTML = `<div class="ai-loading">${tr('aiLoading')}</div>`;
  const nodes = getSpaceNodes();
  const edges = getSpaceEdges();
  if (nodes.length === 0) {
    responseEl.innerHTML = `<p>${tr('aiNoNodes')}</p>`;
    return;
  }
  let context = `${tr('aiContextTitle')}:\n`;
  nodes.forEach(n => {
    context += `- [${n.title}] ${n.desc || ''} (${tr('tags').toLowerCase()}: ${n.tags || tr('tagsNone')})\n`;
  });
  context += `\n${tr('links')}:\n`;
  edges.forEach(e => {
    const from = state.nodes[e.from]?.title || '?';
    const to = state.nodes[e.to]?.title || '?';
    context += `${from} <-> ${to}\n`;
  });
  setTimeout(() => {
    const ideas = [tr('aiIdea1'), tr('aiIdea2'), tr('aiIdea3'), tr('aiIdea4')];
    const randomIdea = ideas[Math.floor(Math.random() * ideas.length)];
    responseEl.innerHTML = `
      <p>🧠 <strong>${tr('aiLocalTitle')}</strong></p>
      <p>${randomIdea}</p>
      <p style="margin-top:12px;color:var(--text-dim);font-size:12px;">${tr('aiContextReady')}</p>
      <p style="color:var(--text-dim);font-size:10px;">${context.replace(/\n/g,'<br>')}</p>
    `;
  }, 800);
}

// ===== COMMAND PALETTE =====
function getCommandItems() {
  const inEngine = document.getElementById('engine')?.classList.contains('active');
  return [
    { name: tr('newSpace'), hint: tr('startClean'), action: openNewSpaceModal },
    { name: tr('plans'), hint: tr('managePlan'), action: openSubscriptionModal },
    { name: tr('settings'), hint: tr('interfaceControl'), action: () => showPage('settings') },
    { name: tr('friendsTitle'), hint: tr('friendsSub'), action: openFriendsLocked },
    { name: `${tr('export')} HTML`, hint: tr('downloaded'), action: () => downloadSite({ preventDefault: () => {} }) },
    { name: tr('backHub'), hint: tr('mySpaces'), action: () => showPage('hub'), enabled: inEngine },
    { name: tr('quickCapture'), hint: tr('quickPlaceholder'), action: () => document.getElementById('quick-capture-input')?.focus(), enabled: inEngine },
    { name: tr('addNode'), hint: tr('tools'), action: () => setTool('node'), enabled: inEngine },
    { name: tr('connect'), hint: tr('connectionMode'), action: () => setTool('connect'), enabled: inEngine },
    { name: tr('autoLayout'), hint: tr('actions'), action: autoLayout, enabled: inEngine },
    { name: tr('isolated'), hint: tr('suggestedLinks'), action: highlightIsolatedNodes, enabled: inEngine },
    { name: tr('smartLinks'), hint: tr('suggestedLinks'), action: smartConnect, enabled: inEngine },
    { name: tr('fitView'), hint: tr('actions'), action: fitView, enabled: inEngine },
    { name: tr('exportJson'), hint: tr('export'), action: exportSpaceJSON, enabled: inEngine }
  ].filter(item => item.enabled !== false);
}

function openCommandPalette() {
  const palette = document.getElementById('command-palette');
  const input = document.getElementById('command-input');
  if (!palette || !input) return;
  palette.style.display = 'flex';
  input.value = '';
  renderCommandPalette('');
  input.focus();
  input.select();
}

function closeCommandPalette() {
  const palette = document.getElementById('command-palette');
  if (palette) palette.style.display = 'none';
}

function renderCommandPalette(query) {
  const list = document.getElementById('command-list');
  if (!list) return;
  const q = query.trim().toLowerCase();
  const commands = getCommandItems()
    .filter(cmd => !q || (cmd.name + ' ' + cmd.hint).toLowerCase().includes(q))
    .slice(0, 8);
  list.innerHTML = commands.length
    ? commands.map((cmd, index) => `
      <button class="command-item ${index === 0 ? 'active' : ''}" onclick="runCommandByName('${escAttr(cmd.name)}')">
        <span>${escHtml(cmd.name)}</span>
        <small>${escHtml(cmd.hint)}</small>
      </button>
    `).join('')
    : `<div class="command-empty">${tr('noCommands')}</div>`;
}

function runCommandByName(name) {
  const command = getCommandItems().find(item => item.name === name);
  if (!command) return;
  closeCommandPalette();
  command.action();
}

function runFirstCommand() {
  const input = document.getElementById('command-input');
  const q = input?.value.trim().toLowerCase() || '';
  const command = getCommandItems().find(cmd => !q || (cmd.name + ' ' + cmd.hint).toLowerCase().includes(q));
  if (command) {
    closeCommandPalette();
    command.action();
  }
}

// ===== UTILS =====
function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function escAttr(str) {
  return escHtml(str).replace(/'/g, '&#39;');
}

function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 2200);
}

function downloadSite(e) {
  e.preventDefault();
  const html = document.documentElement.outerHTML;
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'neurospace.html';
  a.click();
  URL.revokeObjectURL(url);
  showToast(`⬇ ${tr('downloaded')}`);
}

// ===== EVENT LISTENERS =====
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  applyAccentColor();
  if (state.theme) applyTheme(state.theme, true);
  if (state.currentUser) showPage('hub');
  else showPage('gate');

  // Кнопка Enter на странице входа
  const loginPass = document.getElementById('login-pass');
  if (loginPass) loginPass.addEventListener('keydown', e => { if(e.key==='Enter') doLogin(); });

  // Клик по профилю в хабе
  const hubUser = document.querySelector('.hub-user');
  if (hubUser) hubUser.addEventListener('click', openProfileModal);

  const quickInput = document.getElementById('quick-capture-input');
  if (quickInput) {
    quickInput.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        quickCapture();
      }
    });
  }

  const commandInput = document.getElementById('command-input');
  if (commandInput) {
    commandInput.addEventListener('input', e => renderCommandPalette(e.target.value));
    commandInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        runFirstCommand();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        closeCommandPalette();
      }
    });
  }
  const commandPalette = document.getElementById('command-palette');
  if (commandPalette) {
    commandPalette.addEventListener('click', e => {
      if (e.target === commandPalette) closeCommandPalette();
    });
  }

  // Canvas listeners
  const wrap = document.getElementById('canvas-wrap');
  if (wrap) {
    wrap.addEventListener('mousedown', (e) => {
      if (e.target === wrap || e.target.id === 'canvas-world' || e.target.closest('#grid-svg') || e.target.closest('#main-edges-svg')) {
        if (state.tool === 'node') { addNodeAt(e); return; }
        if (state.tool === 'connect') { cancelConnect(); return; }
        state.panning = true;
        state.panStart = { x: e.clientX - state.view.x, y: e.clientY - state.view.y };
        selectNode(null);
        closeNodeEditor();
      }
    });
    wrap.addEventListener('dblclick', (e) => {
      if (state.tool === 'select') addNodeAt(e);
    });
    wrap.addEventListener('wheel', (e) => {
      e.preventDefault();
      zoom(e.deltaY > 0 ? 0.9 : 1.1, e.clientX, e.clientY);
    }, { passive: false });
  }

  document.addEventListener('mousemove', (e) => {
    if (state.panning) {
      state.view.x = e.clientX - state.panStart.x;
      state.view.y = e.clientY - state.panStart.y;
      applyView();
    }
    if (state.connectSource) updateTempEdge(e);
  });
  document.addEventListener('mouseup', () => { state.panning = false; });

  document.addEventListener('click', (e) => {
    if (!state.connectSource) return;
    const nodeEl = e.target.closest('.node');
    if (nodeEl) {
      const id = nodeEl.id.replace('node-', '');
      finishConnect(id);
    }
  });
});

document.addEventListener('keydown', (e) => {
  const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName);
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    openCommandPalette();
    return;
  }
  if (e.key === 'Escape' && document.getElementById('command-palette')?.style.display === 'flex') {
    closeCommandPalette();
    return;
  }
  if (e.key === 'Escape') { cancelConnect(); closeNodeEditor(); setTool('select'); }
  if (!typing && e.key === 'Delete' && state.selectedNodeId) deleteSelected();
  if (!typing && e.key === 'n' && !e.ctrlKey && !e.metaKey && document.getElementById('engine')?.classList.contains('active')) setTool('node');
  if (!typing && e.ctrlKey && e.key === 's') { e.preventDefault(); saveNodeEdit(); }
});
