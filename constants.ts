// Dark Theme Colors - Pure Black Theme
export const DARK_COLORS = {
  primary: '#FFD700',          // Gold/Yellow
  primaryDark: '#FFA500',      // Dark orange/gold
  background: '#000000',       // Pure black
  surface: '#1c1c1e',          // Slightly lighter gray for cards
  surfaceLight: '#2c2c2e',     // Even lighter gray
  text: '#ffffff',
  textSecondary: '#b8b8b8',    // Gray text
  border: '#3a3a3c',           // Lighter border
  error: '#ff6b6b',
};

// Light Theme Colors - Pure white background
export const LIGHT_COLORS = {
  primary: '#FFD700',          // Gold/Yellow
  primaryDark: '#FF8C00',      // Dark orange
  background: '#ffffff',       // Pure white
  surface: '#ffffff',          // Pure white
  surfaceLight: '#f5f5f5',     // Very light gray
  text: '#1a2c22',
  textSecondary: '#5a7d68',
  border: '#e0e0e0',
  error: '#e53935',
};

// Default export for backward compatibility
export const COLORS = DARK_COLORS;

// Gradient colors for LinearGradient backgrounds
export const GRADIENT_COLORS = {
  dark: ['#FFD700', '#1a1a1a', '#000000'] as const,
  light: ['#FFA500', '#f5f9f7', '#ffffff'] as const,
  locations: [0, 0.2, 1] as const,
  start: { x: 0.7, y: 0 },
  end: { x: 0.7, y: 2 },
};


// Languages available in assets/language folder
export const LANGUAGES = [
  { id: 'amharic', name: 'Amharic', nativeName: 'አማርኛ', code: 'am', flagIcon: require('./assets/icons/et.png') },
  { id: 'arabic', name: 'Arabic', nativeName: 'العربية', code: 'ar', flagIcon: require('./assets/icons/ae.png') },
  { id: 'chinese', name: 'Chinese', nativeName: '中文', code: 'zh', flagIcon: require('./assets/icons/cn.png') },
  { id: 'english', name: 'English', nativeName: 'English', code: 'en', flagIcon: require('./assets/icons/gb.png') },
  { id: 'french', name: 'French', nativeName: 'Français', code: 'fr', flagIcon: require('./assets/icons/fr.png') },
  { id: 'german', name: 'German', nativeName: 'Deutsch', code: 'de', flagIcon: require('./assets/icons/de.png') },
  { id: 'hindi', name: 'Hindi', nativeName: 'हिन्दी', code: 'hi', flagIcon: require('./assets/icons/in.png') },
  { id: 'indonesian', name: 'Indonesian', nativeName: 'Bahasa Indonesia', code: 'id', flagIcon: require('./assets/icons/id.png') },
  { id: 'italian', name: 'Italian', nativeName: 'Italiano', code: 'it', flagIcon: require('./assets/icons/it.png') },
  { id: 'japanese', name: 'Japanese', nativeName: '日本語', code: 'ja', flagIcon: require('./assets/icons/jp.png') },
  { id: 'korean', name: 'Korean', nativeName: '한국어', code: 'ko', flagIcon: require('./assets/icons/kr.png') },
  { id: 'persian', name: 'Persian', nativeName: 'فارسی', code: 'fa', flagIcon: require('./assets/icons/ir.png') },
  { id: 'portuguese', name: 'Portuguese', nativeName: 'Português', code: 'pt', flagIcon: require('./assets/icons/pt.png') },
  { id: 'russian', name: 'Russian', nativeName: 'Русский', code: 'ru', flagIcon: require('./assets/icons/ru.png') },
  { id: 'serbian', name: 'Serbian', nativeName: 'Српски', code: 'sr', flagIcon: require('./assets/icons/rs.png') },
  { id: 'spanish', name: 'Spanish', nativeName: 'Español', code: 'es', flagIcon: require('./assets/icons/es.png') },
  { id: 'swahili', name: 'Swahili', nativeName: 'Kiswahili', code: 'sw', flagIcon: require('./assets/icons/ke.png') },
  { id: 'thai', name: 'Thai', nativeName: 'ไทย', code: 'th', flagIcon: require('./assets/icons/th.png') },
  { id: 'turkish', name: 'Turkish', nativeName: 'Türkçe', code: 'tr', flagIcon: require('./assets/icons/tr.png') },
  { id: 'urdu', name: 'Urdu', nativeName: 'اردو', code: 'ur', flagIcon: require('./assets/icons/pk.png') },
  { id: 'vietnamese', name: 'Vietnamese', nativeName: 'Tiếng Việt', code: 'vi', flagIcon: require('./assets/icons/vn.png') },
];

export const LEVELS = [
  {
    id: 'beginner',
    title: 'Beginner',
    range: 'A1-A2',
    description: 'I can understand basic phrases and introduce myself.',
    color: 'text-green-400'
  },
  {
    id: 'intermediate',
    title: 'Intermediate',
    range: 'B1-B2',
    description: 'I can discuss familiar topics and understand main points.',
    color: 'text-yellow-400'
  },
  {
    id: 'advanced',
    title: 'Advanced',
    range: 'C1',
    description: 'I express myself fluently and understand complex texts.',
    color: 'text-purple-400'
  },
];

// Level Test: Questions are now dynamically generated from vocabulary files
// via generateTestQuestions() in LevelTestScreen.tsx — supports all 21 languages.
