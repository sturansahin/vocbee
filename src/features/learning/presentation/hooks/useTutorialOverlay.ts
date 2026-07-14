import { useCallback, useEffect, useRef, useState } from 'react';
import type { View } from 'react-native';
import type { HomeFacade } from '../../application/contracts';

export interface LayoutRect { x: number; y: number; width: number; height: number }
export type TutorialLayouts = Record<'card' | 'favoriteButton' | 'word' | 'exampleSentence' | 'moreExample', LayoutRect>;

const EMPTY_LAYOUT: LayoutRect = { x: 0, y: 0, width: 0, height: 0 };

export function useTutorialOverlay(facade: HomeFacade, canStart: boolean, currentWordIndex: number) {
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStepState] = useState(1);
  const [tutorialLayouts, setTutorialLayouts] = useState<TutorialLayouts | null>(null);
  const showTutorialRef = useRef(false);
  const tutorialStepRef = useRef(1);
  const cardRef = useRef<any>(null);
  const favoriteRef = useRef<any>(null);
  const wordRef = useRef<View>(null);
  const exampleSentenceRef = useRef<View>(null);
  const moreExampleRef = useRef<any>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setTutorialStep = useCallback((step: number) => {
    tutorialStepRef.current = step;
    setTutorialStepState(step);
  }, []);

  const measure = useCallback(({ show = false, delay = 80 }: { show?: boolean; delay?: number } = {}) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      const refs: Array<[keyof TutorialLayouts, React.MutableRefObject<any>]> = [
        ['card', cardRef], ['favoriteButton', favoriteRef], ['word', wordRef],
        ['exampleSentence', exampleSentenceRef], ['moreExample', moreExampleRef],
      ];
      const layouts = {} as TutorialLayouts;
      let measured = 0;
      const finish = () => {
        measured += 1;
        if (measured !== refs.length) return;
        setTutorialLayouts(layouts);
        if (show) {
          showTutorialRef.current = true;
          setShowTutorial(true);
        }
      };
      refs.forEach(([key, ref]) => {
        const target = ref.current?.getNode ? ref.current.getNode() : ref.current;
        if (target?.measureInWindow) {
          target.measureInWindow((x: number, y: number, width: number, height: number) => {
            layouts[key] = { x, y, width, height };
            finish();
          });
        } else {
          layouts[key] = EMPTY_LAYOUT;
          finish();
        }
      });
    }, delay);
  }, []);

  useEffect(() => {
    if (!canStart) return;
    facade.hasSeenTutorial().then(seen => {
      if (!seen) measure({ show: true, delay: 500 });
    }).catch(error => console.warn('[HomeScreen] Tutorial state could not be loaded', error));
  }, [canStart, facade, measure]);

  useEffect(() => {
    if (showTutorial && tutorialStep > 2) measure({ delay: 60 });
  }, [currentWordIndex, measure, showTutorial, tutorialStep]);

  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const complete = useCallback(async () => {
    showTutorialRef.current = false;
    setShowTutorial(false);
    setTutorialStep(1);
    await facade.markTutorialSeen();
  }, [facade, setTutorialStep]);

  return {
    showTutorial,
    showTutorialRef,
    tutorialStep,
    tutorialStepRef,
    setTutorialStep,
    tutorialLayouts,
    refs: { cardRef, favoriteRef, wordRef, exampleSentenceRef, moreExampleRef },
    complete,
  };
}
