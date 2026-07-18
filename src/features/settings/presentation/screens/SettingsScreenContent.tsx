import React from 'react';

import type { SettingsFacade } from '../../application/contracts';
import { SettingsScreenView } from '../components/SettingsScreenView';
import { useSettingsScreenController } from '../hooks/useSettingsScreenController';

interface SettingsScreenContentProps {
  facade: SettingsFacade;
}

export default function SettingsScreenContent({ facade }: SettingsScreenContentProps) {
  const controller = useSettingsScreenController(facade);

  return <SettingsScreenView controller={controller} />;
}
