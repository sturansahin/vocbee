import { useEffect, useReducer } from 'react';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '@app/navigation/types';
import type { LevelTestFacade } from '../../application/levelTestContracts';
import { initialLevelTestState, levelTestReducer } from '../levelTest/levelTestState';

export function useLevelTestController(facade: LevelTestFacade) {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'LevelTest'>>();
  const [state, dispatch] = useReducer(levelTestReducer, initialLevelTestState);

  useEffect(() => {
    let active = true;
    void facade
      .loadQuestions(route.params)
      .then((questions) => {
        if (active) dispatch({ type: 'questionsLoaded', questions });
      })
      .catch((error) => {
        console.error('Error loading test questions:', error);
        if (active) navigation.goBack();
      });
    return () => {
      active = false;
    };
  }, [facade, navigation, route.params]);

  const totalQuestions = state.questions.length;
  const detectedLevel = facade.detectLevel(state.correctAnswers, totalQuestions);

  return {
    ...state,
    currentQuestion: state.questions[state.currentQuestionIndex],
    detectedLevel,
    totalQuestions,
    selectAnswer: (answer: string) => dispatch({ type: 'answerSelected', answer }),
    next: () => dispatch({ type: 'next' }),
    goBack: () => navigation.goBack(),
    continueSetup: () => navigation.navigate('NativeLanguage', { detectedLevel }),
  };
}
