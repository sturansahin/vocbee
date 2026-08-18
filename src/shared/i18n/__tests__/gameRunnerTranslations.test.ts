import resources from '../../../../locales';
import { GAME_RUNNER_LANGUAGE_CODES, gameRunnerTranslations } from '../../../../locales/gameRunner';

const expectedFields = Object.keys(gameRunnerTranslations.en).sort();

describe('game runner translations', () => {
  it('ships a complete catalog for every supported app language', () => {
    expect(Object.keys(resources).sort()).toEqual([...GAME_RUNNER_LANGUAGE_CODES].sort());

    for (const language of GAME_RUNNER_LANGUAGE_CODES) {
      const runner = resources[language].translation.game.runner;
      expect(Object.keys(runner).sort()).toEqual(expectedFields);
      expect(Object.values(runner).every((value) => value.trim().length > 0)).toBe(true);
    }
  });

  it('preserves the named runtime placeholders in every language', () => {
    for (const language of GAME_RUNNER_LANGUAGE_CODES) {
      const runner = gameRunnerTranslations[language];
      expect(runner.comboTemplate.match(/\{count\}/g)).toHaveLength(1);
      expect(runner.scoreTemplate.match(/\{score\}/g)).toHaveLength(1);
      expect(runner.bestScoreTemplate.match(/\{score\}/g)).toHaveLength(1);
      expect(runner.bestComboTemplate.match(/\{count\}/g)).toHaveLength(1);
      expect(runner.heartsTemplate.match(/\{current\}/g)).toHaveLength(1);
      expect(runner.heartsTemplate.match(/\{max\}/g)).toHaveLength(1);
    }
  });
});
