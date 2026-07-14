import AsyncStorage from '@react-native-async-storage/async-storage';

import { STORAGE_KEYS } from '@shared/storage';

import type { ReviewPromptRepository } from '../../application/contracts';
import { normalizeReviewPromptState } from '../../domain/rules';
import { DEFAULT_REVIEW_PROMPT_STATE, type ReviewPromptState } from '../../domain/types';

export class AsyncStorageReviewPromptRepository implements ReviewPromptRepository {
  async read(): Promise<ReviewPromptState> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.APP_REVIEW_PROMPT_STATE);
      return raw ? normalizeReviewPromptState(JSON.parse(raw) as Partial<ReviewPromptState>) : DEFAULT_REVIEW_PROMPT_STATE;
    } catch (error) { console.warn('[ReviewPrompt] Failed to read state', error); return DEFAULT_REVIEW_PROMPT_STATE; }
  }
  write(state: ReviewPromptState): Promise<void> {
    return AsyncStorage.setItem(STORAGE_KEYS.APP_REVIEW_PROMPT_STATE, JSON.stringify(state));
  }
}
