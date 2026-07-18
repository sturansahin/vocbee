export interface OnboardingRepository {
  markSeen(): Promise<void>;
}

export interface OnboardingFacade {
  complete(): Promise<void>;
}
