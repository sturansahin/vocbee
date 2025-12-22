// Dark Theme Colors
export const DARK_COLORS = {
  primary: '#38e07b',
  primaryDark: '#2cb863',
  background: '#122017',
  surface: '#1a2c22',
  surfaceLight: '#23362b',
  text: '#ffffff',
  textSecondary: '#96c5a9',
  border: '#366348',
  error: '#ff6b6b',
};

// Light Theme Colors - Soft mint/cream tones
export const LIGHT_COLORS = {
  primary: '#2cb863',
  primaryDark: '#249a52',
  background: '#f5f9f7',
  surface: '#ffffff',
  surfaceLight: '#e8f5ec',
  text: '#1a2c22',
  textSecondary: '#5a7d68',
  border: '#d4e5db',
  error: '#e53935',
};

// Default export for backward compatibility
export const COLORS = DARK_COLORS;

// Languages available in assets/language folder
export const LANGUAGES = [
  { id: 'amharic', name: 'Amharic', nativeName: 'አማርኛ', flagIcon: require('./assets/icons/et.png') },
  { id: 'arabic', name: 'Arabic', nativeName: 'العربية', flagIcon: require('./assets/icons/ae.png') },
  { id: 'chinese', name: 'Chinese', nativeName: '中文', flagIcon: require('./assets/icons/cn.png') },
  { id: 'english', name: 'English', nativeName: 'English', flagIcon: require('./assets/icons/gb.png') },
  { id: 'french', name: 'French', nativeName: 'Français', flagIcon: require('./assets/icons/fr.png') },
  { id: 'german', name: 'German', nativeName: 'Deutsch', flagIcon: require('./assets/icons/de.png') },
  { id: 'hindi', name: 'Hindi', nativeName: 'हिन्दी', flagIcon: require('./assets/icons/in.png') },
  { id: 'indonesian', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flagIcon: require('./assets/icons/id.png') },
  { id: 'italian', name: 'Italian', nativeName: 'Italiano', flagIcon: require('./assets/icons/it.png') },
  { id: 'japanese', name: 'Japanese', nativeName: '日本語', flagIcon: require('./assets/icons/jp.png') },
  { id: 'korean', name: 'Korean', nativeName: '한국어', flagIcon: require('./assets/icons/kr.png') },
  { id: 'persian', name: 'Persian', nativeName: 'فارسی', flagIcon: require('./assets/icons/ir.png') },
  { id: 'portuguese', name: 'Portuguese', nativeName: 'Português', flagIcon: require('./assets/icons/pt.png') },
  { id: 'russian', name: 'Russian', nativeName: 'Русский', flagIcon: require('./assets/icons/ru.png') },
  { id: 'serbian', name: 'Serbian', nativeName: 'Српски', flagIcon: require('./assets/icons/rs.png') },
  { id: 'spanish', name: 'Spanish', nativeName: 'Español', flagIcon: require('./assets/icons/es.png') },
  { id: 'swahili', name: 'Swahili', nativeName: 'Kiswahili', flagIcon: require('./assets/icons/ke.png') },
  { id: 'thai', name: 'Thai', nativeName: 'ไทย', flagIcon: require('./assets/icons/th.png') },
  { id: 'turkish', name: 'Turkish', nativeName: 'Türkçe', flagIcon: require('./assets/icons/tr.png') },
  { id: 'urdu', name: 'Urdu', nativeName: 'اردو', flagIcon: require('./assets/icons/pk.png') },
  { id: 'vietnamese', name: 'Vietnamese', nativeName: 'Tiếng Việt', flagIcon: require('./assets/icons/vn.png') },
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
    range: 'C1-C2',
    description: 'I express myself fluently and understand complex texts.',
    color: 'text-purple-400'
  },
];
