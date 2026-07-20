// src/features/home/presentation/components/index.ts
// Barrel for HomeScreen's extracted pure UI components (ADIM 2 — docs/architecture.md UI-only
// extraction). No business logic; every component here is presentational and receives all data
// via typed props from screens/HomeScreen.tsx.

export { FavoriteStarIcon } from './FavoriteStarIcon';
export type { FavoriteStarIconProps } from './FavoriteStarIcon';

export { HomeProgressSection } from './HomeProgressSection';
export type { HomeProgressSectionProps } from './HomeProgressSection';

export { HomeWordCardSection } from './HomeWordCardSection';
export type { HomeWordCardSectionProps, HomeBeePosition } from './HomeWordCardSection';

export { HomeTutorialSection } from './HomeTutorialSection';
export type { HomeTutorialSectionProps } from './HomeTutorialSection';

export { HomeModals } from './HomeModals';
export type { HomeModalsProps } from './HomeModals';

export { HomeHeader } from './HomeHeader';
export { default as HomeTutorialOverlay } from './HomeTutorialOverlay';
export type { LayoutRect } from './HomeTutorialOverlay';
export { VocabularyCardHeader } from './VocabularyCardHeader';
export type { VocabularyCardHeaderProps } from './VocabularyCardHeader';
