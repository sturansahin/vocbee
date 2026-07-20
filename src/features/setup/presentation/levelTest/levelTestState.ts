import type { LevelTestQuestion } from '../../domain/levelTestTypes';

export interface LevelTestState {
  status: 'loading' | 'question' | 'result';
  questions: readonly LevelTestQuestion[];
  currentQuestionIndex: number;
  correctAnswers: number;
  selectedAnswer: string | null;
}

export type LevelTestAction =
  | { type: 'questionsLoaded'; questions: readonly LevelTestQuestion[] }
  | { type: 'answerSelected'; answer: string }
  | { type: 'next' };

export const initialLevelTestState: LevelTestState = {
  status: 'loading',
  questions: [],
  currentQuestionIndex: 0,
  correctAnswers: 0,
  selectedAnswer: null,
};

export function levelTestReducer(state: LevelTestState, action: LevelTestAction): LevelTestState {
  switch (action.type) {
    case 'questionsLoaded':
      return {
        ...initialLevelTestState,
        status: action.questions.length > 0 ? 'question' : 'result',
        questions: action.questions,
      };
    case 'answerSelected':
      if (state.status !== 'question') return state;
      return { ...state, selectedAnswer: action.answer };
    case 'next': {
      if (state.status !== 'question' || state.selectedAnswer === null) return state;
      const question = state.questions[state.currentQuestionIndex];
      if (!question) return state;
      const correctAnswers =
        state.correctAnswers + (state.selectedAnswer === question.correct ? 1 : 0);
      const isLast = state.currentQuestionIndex >= state.questions.length - 1;

      return {
        ...state,
        status: isLast ? 'result' : 'question',
        currentQuestionIndex: isLast ? state.currentQuestionIndex : state.currentQuestionIndex + 1,
        correctAnswers,
        selectedAnswer: null,
      };
    }
    default:
      return state;
  }
}
