import type { OnboardingFacade, OnboardingRepository } from './contracts';

export class DefaultOnboardingFacade implements OnboardingFacade {
  constructor(private readonly repository: OnboardingRepository) {}

  complete(): Promise<void> {
    return this.repository.markSeen();
  }
}
