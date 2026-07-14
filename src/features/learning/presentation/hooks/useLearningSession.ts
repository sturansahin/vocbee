import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { DEFAULT_STREAK_SUMMARY, type StreakSummary } from '@features/streak';
import type { Level, VocabularyWord } from '@features/vocabulary';
import type { HomeFacade } from '../../application/contracts';

export type HomeLoadState = 'loading' | 'ready' | 'empty' | 'error';

export function useLearningSession(facade: HomeFacade) {
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentLevel, setCurrentLevel] = useState<Level>('A1');
  const [userLevel, setUserLevel] = useState('beginner');
  const [targetLanguage, setTargetLanguage] = useState('unknown');
  const [learnedCount, setLearnedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [streakSummary, setStreakSummary] = useState<StreakSummary>(DEFAULT_STREAK_SUMMARY);
  const [loadState, setLoadState] = useState<HomeLoadState>('loading');
  const requestIdRef = useRef(0);
  const hydratedRef = useRef(false);

  const load = useCallback(async (forceReload = false) => {
    const requestId = ++requestIdRef.current;
    if (!hydratedRef.current) setLoadState('loading');
    try {
      const snapshot = await facade.loadSession(forceReload);
      if (requestId !== requestIdRef.current) return;
      setWords(snapshot.words);
      setCurrentWordIndex(snapshot.currentWordIndex);
      setCurrentLevel(snapshot.level);
      setUserLevel(snapshot.userLevel);
      setTargetLanguage(snapshot.targetLanguage);
      setLearnedCount(snapshot.learnedCount);
      setTotalCount(snapshot.totalCount);
      setStreakSummary(snapshot.streakSummary);
      hydratedRef.current = true;
      setLoadState(snapshot.words.length === 0 ? 'empty' : 'ready');
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      console.error('[HomeScreen] Failed to load learning session:', error);
      setWords([]);
      setLearnedCount(0);
      setTotalCount(0);
      hydratedRef.current = true;
      setLoadState('error');
    }
  }, [facade]);

  const consumePendingWord = useCallback(async () => {
    const pending = await facade.getPendingWord();
    if (!pending || loadState === 'loading') return false;

    const activeLevel = await facade.getCurrentLevel();
    if (pending.level && pending.level !== activeLevel) {
      await facade.clearPendingWord();
      return false;
    }
    const activeTargetLanguage = await facade.getTargetLanguage();
    if (pending.targetLanguage && activeTargetLanguage && pending.targetLanguage !== activeTargetLanguage) {
      await facade.clearPendingWord();
      return false;
    }

    const existingIndex = words.findIndex(word => word.id === pending.wordId);
    if (existingIndex >= 0) {
      await facade.saveLastWordId(pending.wordId);
      setCurrentWordIndex(existingIndex);
      await facade.clearPendingWord();
      return true;
    }

    const vocabulary = await facade.getVocabulary(activeLevel);
    const pendingWord = vocabulary.find(word => word.id === pending.wordId);
    if (!pendingWord) return false;
    await facade.saveLastWordId(pending.wordId);
    setWords(currentWords => [pendingWord, ...currentWords.filter(word => word.id !== pending.wordId)]);
    setCurrentWordIndex(0);
    setLoadState('ready');
    await facade.clearPendingWord();
    return true;
  }, [facade, loadState, words]);

  const refresh = useCallback(async (retryPending = false) => {
    if (!hydratedRef.current) return;
    let pendingHandled = await consumePendingWord();
    if (!pendingHandled && retryPending) {
      await new Promise<void>(resolve => setTimeout(resolve, 250));
      pendingHandled = await consumePendingWord();
    }
    const nextLevel = await facade.getCurrentLevel();
    if (nextLevel !== currentLevel) {
      await load(true);
      return;
    }
    if (!pendingHandled && hydratedRef.current) {
      const counts = await facade.refreshCounts(currentLevel);
      setLearnedCount(counts.learnedCount);
      setTotalCount(counts.totalCount);
    }
    setStreakSummary(await facade.getStreakSummary());
  }, [consumePendingWord, currentLevel, facade, load]);

  const safelyRefresh = useCallback(() => {
    void refresh(true).catch(error => console.error('[HomeScreen] Session refresh failed:', error));
  }, [refresh]);

  useEffect(() => { void load(); }, [load]);
  useFocusEffect(useCallback(() => { safelyRefresh(); }, [safelyRefresh]));
  useEffect(() => {
    if (loadState === 'ready' || loadState === 'empty') safelyRefresh();
  }, [loadState, safelyRefresh]);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') safelyRefresh();
    });
    return () => subscription.remove();
  }, [safelyRefresh]);
  useEffect(() => () => { requestIdRef.current += 1; }, []);

  const currentWord = words[currentWordIndex];
  const nextWord = words[(currentWordIndex + 1) % Math.max(words.length, 1)];

  return {
    words,
    setWords,
    currentWord,
    nextWord,
    currentWordIndex,
    setCurrentWordIndex,
    currentLevel,
    setCurrentLevel,
    userLevel,
    targetLanguage,
    learnedCount,
    setLearnedCount,
    totalCount,
    streakSummary,
    setStreakSummary,
    loadState,
    load,
    retry: () => load(true),
  };
}
