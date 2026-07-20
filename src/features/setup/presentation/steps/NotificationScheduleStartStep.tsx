import React from 'react';
import { useTranslation } from 'react-i18next';
import type { ThemeColors } from '@shared/theme';
import { NotificationTimeStep, type NotificationTimeStepProps } from './NotificationTimeStep';

export interface NotificationScheduleStartStepProps extends Omit<
  NotificationTimeStepProps,
  'icon' | 'label'
> {
  colors?: Pick<ThemeColors, 'textPrimary' | 'accent' | 'surface' | 'borderDefault'>;
}

export function NotificationScheduleStartStep(props: NotificationScheduleStartStepProps) {
  const { t } = useTranslation();
  return <NotificationTimeStep {...props} icon="wb-sunny" label={t('setup.startTime')} />;
}

export default NotificationScheduleStartStep;
