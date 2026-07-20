import React from 'react';
import { useTranslation } from 'react-i18next';
import type { ThemeColors } from '@shared/theme';
import { NotificationTimeStep, type NotificationTimeStepProps } from './NotificationTimeStep';

export interface NotificationScheduleEndStepProps extends Omit<
  NotificationTimeStepProps,
  'icon' | 'label'
> {
  colors?: Pick<ThemeColors, 'textPrimary' | 'accent' | 'surface' | 'borderDefault'>;
}

export function NotificationScheduleEndStep(props: NotificationScheduleEndStepProps) {
  const { t } = useTranslation();
  return <NotificationTimeStep {...props} icon="nightlight-round" label={t('setup.endTime')} />;
}

export default NotificationScheduleEndStep;
