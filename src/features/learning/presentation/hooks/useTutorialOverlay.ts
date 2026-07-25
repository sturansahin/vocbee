import { useCallback, useEffect, useRef, useState } from 'react';
import type { LayoutChangeEvent, View } from 'react-native';
import type { HomeFacade } from '../../application/contracts';

export interface LayoutRect {
  x: number;
  y: number;
  width: number;
  height: number;
}
export type TutorialLayouts = Record<
  'card' | 'favoriteButton' | 'word' | 'exampleSentence' | 'moreExample',
  LayoutRect
>;

const EMPTY_LAYOUT: LayoutRect = { x: 0, y: 0, width: 0, height: 0 };

export function useTutorialOverlay(
  facade: HomeFacade,
  canStart: boolean,
  currentWordIndex: number,
  layoutRevision: string,
) {
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStepState] = useState(1);
  const [tutorialLayouts, setTutorialLayouts] = useState<TutorialLayouts | null>(null);
  const showTutorialRef = useRef(false);
  const tutorialStepRef = useRef(1);
  const rootRef = useRef<View>(null);
  const cardRef = useRef<any>(null);
  const favoriteRef = useRef<any>(null);
  const wordRef = useRef<View>(null);
  const exampleSentenceRef = useRef<View>(null);
  const moreExampleRef = useRef<any>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const measurementGenerationRef = useRef(0);

  const setTutorialStep = useCallback((step: number) => {
    tutorialStepRef.current = step;
    setTutorialStepState(step);
  }, []);

  const measure = useCallback(
    ({ show = false, delay = 80 }: { show?: boolean; delay?: number } = {}) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      const generation = measurementGenerationRef.current + 1;
      measurementGenerationRef.current = generation;
      timeoutRef.current = setTimeout(() => {
        const root = rootRef.current;
        if (!root) return;
        const refs: Array<[keyof TutorialLayouts, React.MutableRefObject<any>]> = [
          ['card', cardRef],
          ['favoriteButton', favoriteRef],
          ['word', wordRef],
          ['exampleSentence', exampleSentenceRef],
          ['moreExample', moreExampleRef],
        ];
        if (measurementGenerationRef.current !== generation) return;
        const layouts = {} as TutorialLayouts;
        let measured = 0;
        const record = (key: keyof TutorialLayouts, layout: LayoutRect) => {
          layouts[key] = layout;
          measured += 1;
          if (measured !== refs.length || measurementGenerationRef.current !== generation) return;
          setTutorialLayouts(layouts);
          if (show) {
            showTutorialRef.current = true;
            setShowTutorial(true);
          }
        };
        refs.forEach(([key, ref]) => {
          const target = ref.current?.getNode ? ref.current.getNode() : ref.current;
          if (target?.measureLayout) {
            target.measureLayout(
              root,
              (x: number, y: number, width: number, height: number) =>
                record(key, { x, y, width, height }),
              () => record(key, EMPTY_LAYOUT),
            );
          } else {
            record(key, EMPTY_LAYOUT);
          }
        });
      }, delay);
    },
    [],
  );

  useEffect(() => {
    if (!canStart) return;
    facade
      .hasSeenTutorial()
      .then((seen) => {
        if (!seen) measure({ show: true, delay: 500 });
      })
      .catch((error) => console.warn('[HomeScreen] Tutorial state could not be loaded', error));
  }, [canStart, facade, measure]);

  useEffect(() => {
    if (showTutorial && tutorialStep > 2) measure({ delay: 60 });
  }, [currentWordIndex, measure, showTutorial, tutorialStep]);

  useEffect(() => {
    if (showTutorialRef.current) measure({ delay: 80 });
  }, [layoutRevision, measure]);

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      measurementGenerationRef.current += 1;
    },
    [],
  );

  const onRootLayout = useCallback(
    (_event: LayoutChangeEvent) => {
      if (showTutorialRef.current) measure({ delay: 60 });
    },
    [measure],
  );

  const onCardLayout = useCallback(
    (_event: LayoutChangeEvent) => {
      if (showTutorialRef.current) measure({ delay: 40 });
    },
    [measure],
  );

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
    rootRef,
    onRootLayout,
    onCardLayout,
    refs: { cardRef, favoriteRef, wordRef, exampleSentenceRef, moreExampleRef },
    complete,
  };
}
