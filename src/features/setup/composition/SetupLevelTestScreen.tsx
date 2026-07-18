import React from 'react';

import PresentationLevelTestScreen from '../presentation/screens/LevelTestScreen';
import { levelTestFacade } from './levelTestFacade';

export default function LevelTestScreen() {
  return <PresentationLevelTestScreen facade={levelTestFacade} />;
}
