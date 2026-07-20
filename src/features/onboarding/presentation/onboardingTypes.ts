import type { ImageSourcePropType } from 'react-native';

export interface OnboardingStep {
  id: string;
  title: string;
  subtitle: string;
  image: ImageSourcePropType;
}
