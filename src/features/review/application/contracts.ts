import type { ReviewPromptState } from '../domain/types';

export interface ReviewPromptRepository {
  read(): Promise<ReviewPromptState>;
  write(state: ReviewPromptState): Promise<void>;
}

export interface ReviewPlatformGateway {
  readonly platform: string;
  readonly appVersion: string;
  isNativeReviewAvailable(): Promise<boolean>;
  requestNativeReview(): Promise<void>;
  getStoreReviewUrls(): string[];
  canOpenUrl(url: string): Promise<boolean>;
  openUrl(url: string): Promise<void>;
}
