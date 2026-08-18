import en from './en';
import tr from './tr';
import de from './de';
import fr from './fr';
import es from './es';
import it from './it';
import pt from './pt';
import ru from './ru';
import ar from './ar';
import zh from './zh';
import ja from './ja';
import ko from './ko';
import hi from './hi';
import id from './id';
import vi from './vi';
import th from './th';
import am from './am';
import fa from './fa';
import sr from './sr';
import sw from './sw';
import ur from './ur';
import { gameRunnerTranslations, type GameRunnerLanguageCode } from './gameRunner';

function withGameRunner<T extends Record<string, unknown>>(
  language: GameRunnerLanguageCode,
  translation: T,
) {
  const game = (translation.game ?? {}) as Record<string, unknown>;
  return {
    ...translation,
    game: {
      ...game,
      runner: gameRunnerTranslations[language],
    },
  };
}

export default {
  en: { translation: withGameRunner('en', en) },
  tr: { translation: withGameRunner('tr', tr) },
  de: { translation: withGameRunner('de', de) },
  fr: { translation: withGameRunner('fr', fr) },
  es: { translation: withGameRunner('es', es) },
  it: { translation: withGameRunner('it', it) },
  pt: { translation: withGameRunner('pt', pt) },
  ru: { translation: withGameRunner('ru', ru) },
  ar: { translation: withGameRunner('ar', ar) },
  zh: { translation: withGameRunner('zh', zh) },
  ja: { translation: withGameRunner('ja', ja) },
  ko: { translation: withGameRunner('ko', ko) },
  hi: { translation: withGameRunner('hi', hi) },
  id: { translation: withGameRunner('id', id) },
  vi: { translation: withGameRunner('vi', vi) },
  th: { translation: withGameRunner('th', th) },
  am: { translation: withGameRunner('am', am) },
  fa: { translation: withGameRunner('fa', fa) },
  sr: { translation: withGameRunner('sr', sr) },
  sw: { translation: withGameRunner('sw', sw) },
  ur: { translation: withGameRunner('ur', ur) },
};
