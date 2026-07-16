import React from 'react';

import type { SettingsFacade } from '../../application/contracts';
import SettingsScreenContent from './SettingsScreenContent';

interface SettingsScreenProps {
  facade: SettingsFacade;
}

export default function SettingsScreen({ facade }: SettingsScreenProps) {
  return <SettingsScreenContent facade={facade} />;
}
