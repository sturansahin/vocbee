import { DefaultReviewPromptService } from '../application/DefaultReviewPromptService';
import { ExpoReviewPlatformGateway } from '../data/gateways/ExpoReviewPlatformGateway';
import { AsyncStorageReviewPromptRepository } from '../data/repositories/AsyncStorageReviewPromptRepository';
import type { ReviewPromptContext, ReviewPromptOutcome } from '../domain/types';

const service = new DefaultReviewPromptService(
  new AsyncStorageReviewPromptRepository(),
  new ExpoReviewPlatformGateway(),
);
export const recordReviewAppLaunch = () => service.recordReviewAppLaunch();
export const getAutomaticReviewPromptDecision = (context: ReviewPromptContext) =>
  service.getAutomaticReviewPromptDecision(context);
export const markAutomaticReviewPromptPresented = (
  outcome: Extract<ReviewPromptOutcome, 'nativeRequested' | 'satisfactionShown'>,
) => service.markAutomaticReviewPromptPresented(outcome);
export const dismissReviewPrompt = () => service.dismissReviewPrompt();
export const recordSatisfactionRating = (rating: number) =>
  service.recordSatisfactionRating(rating);
export const requestNativeReview = () => service.requestNativeReview();
export const openStoreReviewPage = (source: string) => service.openStoreReviewPage(source);
export const openReviewFeedbackEmail = (rating?: number) => service.openReviewFeedbackEmail(rating);
