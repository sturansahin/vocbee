import { useEffect, useRef, useState } from 'react';
import type { ScrollView } from 'react-native';
import type { TFunction } from 'i18next';
import {
  getNotificationFrequencyKey,
  getNotificationFrequencyMinutes,
  type NotificationFrequencyKey,
  type NotificationSettings,
} from '@features/notifications';
import { useAlert } from '@shared/ui';
import type { SettingsFacade } from '../../application/contracts';
import type { SettingsModal } from './useSettingsModalState';

const padTime = (value: number) => value.toString().padStart(2, '0');

interface NotificationControllerOptions {
  facade: SettingsFacade;
  notificationSettings: NotificationSettings;
  updateNotificationSettings(settings: Partial<NotificationSettings>): Promise<void>;
  showAlert: ReturnType<typeof useAlert>['showAlert'];
  t: TFunction;
  modal: SettingsModal;
  openModal(modal: Exclude<SettingsModal, null>): void;
  closeModal(): void;
}

export function useNotificationSettingsController({
  facade,
  notificationSettings,
  updateNotificationSettings,
  showAlert,
  t,
  modal,
  openModal,
  closeModal,
}: NotificationControllerOptions) {
  const [reminderEnabled, setReminderEnabled] = useState(notificationSettings.enabled);
  const [autoMarkLearned, setAutoMarkLearned] = useState(notificationSettings.autoMarkLearned);
  const [startHour, setStartHour] = useState(padTime(notificationSettings.startHour));
  const [startMinute, setStartMinute] = useState(padTime(notificationSettings.startMinute));
  const [endHour, setEndHour] = useState(padTime(notificationSettings.endHour));
  const [endMinute, setEndMinute] = useState(padTime(notificationSettings.endMinute));
  const [frequency, setFrequency] = useState<NotificationFrequencyKey>(
    getNotificationFrequencyKey(notificationSettings.frequencyMinutes),
  );
  const [tempHour, setTempHour] = useState('09');
  const [tempMinute, setTempMinute] = useState('00');
  const hourScrollRef = useRef<ScrollView>(null);
  const minuteScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    setReminderEnabled(notificationSettings.enabled);
    setAutoMarkLearned(notificationSettings.autoMarkLearned);
    setStartHour(padTime(notificationSettings.startHour));
    setStartMinute(padTime(notificationSettings.startMinute));
    setEndHour(padTime(notificationSettings.endHour));
    setEndMinute(padTime(notificationSettings.endMinute));
    setFrequency(getNotificationFrequencyKey(notificationSettings.frequencyMinutes));
  }, [notificationSettings]);

  const openTimePicker = (type: 'start' | 'end') => {
    setTempHour(type === 'start' ? startHour : endHour);
    setTempMinute(type === 'start' ? startMinute : endMinute);
    openModal(type === 'start' ? 'time-start' : 'time-end');
  };

  const handleReminderToggle = async () => {
    const enabled = !reminderEnabled;
    if (enabled && !(await facade.requestNotificationPermission())) {
      showAlert({
        title: t('settings.permissionRequired'),
        message: t('settings.enableNotificationsInSettings'),
        buttons: [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('settings.openSettings'), onPress: () => void facade.openSystemSettings() },
        ],
      });
      return;
    }
    setReminderEnabled(enabled);
    void updateNotificationSettings({ enabled }).catch(console.error);
  };

  const confirmTime = () => {
    if (modal !== 'time-start' && modal !== 'time-end') return;
    const type = modal === 'time-start' ? 'start' : 'end';
    const hour = tempHour;
    const minute = tempMinute;
    closeModal();
    if (type === 'start') {
      setStartHour(hour);
      setStartMinute(minute);
    } else {
      setEndHour(hour);
      setEndMinute(minute);
    }
    void updateNotificationSettings(
      type === 'start'
        ? { startHour: Number(hour), startMinute: Number(minute) }
        : { endHour: Number(hour), endMinute: Number(minute) },
    ).catch(console.error);
  };

  const changeFrequency = (nextFrequency: NotificationFrequencyKey) => {
    setFrequency(nextFrequency);
    closeModal();
    void updateNotificationSettings({
      frequencyMinutes: getNotificationFrequencyMinutes(nextFrequency),
    }).catch(console.error);
  };

  const changeAutoMark = (enabled: boolean) => {
    setAutoMarkLearned(enabled);
    closeModal();
    void updateNotificationSettings({ autoMarkLearned: enabled }).catch(console.error);
  };

  return {
    reminderEnabled,
    autoMarkLearned,
    startHour,
    startMinute,
    endHour,
    endMinute,
    frequency,
    tempHour,
    setTempHour,
    tempMinute,
    setTempMinute,
    hourScrollRef,
    minuteScrollRef,
    openTimePicker,
    handleReminderToggle,
    confirmTime,
    changeFrequency,
    changeAutoMark,
  };
}
