import React from 'react';
import { useTranslation } from 'react-i18next';
import { LoadingState, Screen } from '@shared/ui';
import type { LevelTestFacade } from '../../application/levelTestContracts';
import { useLevelTestController } from '../hooks/useLevelTestController';
import { LevelTestQuestionView } from '../levelTest/LevelTestQuestionView';
import { LevelTestResultView } from '../levelTest/LevelTestResultView';

export interface LevelTestScreenProps {
  facade: LevelTestFacade;
}

export default function LevelTestScreen({ facade }: LevelTestScreenProps) {
  const { t } = useTranslation();
  const controller = useLevelTestController(facade);

  if (controller.status === 'loading') {
    return (
      <Screen centered testID="level-test-loading">
        <LoadingState title={t('common.loading')} />
      </Screen>
    );
  }

  if (controller.status === 'result') {
    const levelInfo =
      controller.detectedLevel === 'advanced'
        ? { title: t('levelTest.advanced'), range: 'C1' }
        : controller.detectedLevel === 'intermediate'
          ? { title: t('levelTest.intermediate'), range: 'B1-B2' }
          : { title: t('levelTest.beginner'), range: 'A1-A2' };
    return (
      <LevelTestResultView
        continueLabel={t('common.continue')}
        description={t('levelTest.resultDesc', {
          correct: controller.correctAnswers,
          total: controller.totalQuestions,
        })}
        levelLabel={t('levelTest.yourLevel')}
        levelRange={levelInfo.range}
        levelTitle={levelInfo.title}
        message={t('levelTest.customizeMessage')}
        onContinue={controller.continueSetup}
        title={t('levelTest.testComplete')}
      />
    );
  }

  if (!controller.currentQuestion) {
    return null;
  }

  return (
    <LevelTestQuestionView
      currentIndex={controller.currentQuestionIndex}
      nextLabel={
        controller.currentQuestionIndex === controller.totalQuestions - 1
          ? t('levelTest.seeResults')
          : t('levelTest.next')
      }
      onBack={controller.goBack}
      onNext={controller.next}
      onSelect={controller.selectAnswer}
      prompt={t('levelTest.questionPrompt')}
      question={controller.currentQuestion}
      selectedAnswer={controller.selectedAnswer}
      total={controller.totalQuestions}
    />
  );
}
