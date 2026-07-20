import { initialLevelTestState, levelTestReducer } from '../levelTestState';

const questions = [
  { id: 1, level: 'A1' as const, word: 'Haus', options: ['Ev', 'Araba'], correct: 'Ev' },
  { id: 2, level: 'A1' as const, word: 'Auto', options: ['Ev', 'Araba'], correct: 'Araba' },
];

describe('levelTestReducer', () => {
  it('models loading, question transitions and final score explicitly', () => {
    let state = levelTestReducer(initialLevelTestState, {
      type: 'questionsLoaded',
      questions,
    });
    expect(state).toMatchObject({ status: 'question', currentQuestionIndex: 0 });

    state = levelTestReducer(state, { type: 'answerSelected', answer: 'Ev' });
    state = levelTestReducer(state, { type: 'next' });
    expect(state).toMatchObject({
      status: 'question',
      currentQuestionIndex: 1,
      correctAnswers: 1,
      selectedAnswer: null,
    });

    state = levelTestReducer(state, { type: 'answerSelected', answer: 'Ev' });
    state = levelTestReducer(state, { type: 'next' });
    expect(state).toMatchObject({ status: 'result', correctAnswers: 1 });
  });

  it('ignores next until an answer is selected', () => {
    const loaded = levelTestReducer(initialLevelTestState, {
      type: 'questionsLoaded',
      questions,
    });
    expect(levelTestReducer(loaded, { type: 'next' })).toBe(loaded);
  });
});
