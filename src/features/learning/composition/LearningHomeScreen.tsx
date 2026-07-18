import React from 'react';
import PresentationHomeScreen from '../presentation/screens/HomeScreen';
import { homeFacade } from './homeFacade';

export default function HomeScreen() {
  return <PresentationHomeScreen facade={homeFacade} />;
}

export { getTutorialSwipeNextStep } from '../presentation/screens/HomeScreen';
