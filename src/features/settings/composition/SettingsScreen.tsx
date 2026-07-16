import React from 'react';

import PresentationSettingsScreen from '../presentation/screens/SettingsScreen';
import { settingsFacade } from './settingsFacade';

export default function SettingsScreen() {
  return <PresentationSettingsScreen facade={settingsFacade} />;
}
