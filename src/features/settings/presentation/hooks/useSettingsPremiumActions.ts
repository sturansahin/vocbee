import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useMonetization } from '@features/monetization';
import { useAlert } from '@shared/ui';

type PremiumAction = 'paywall' | 'restore' | 'manage';

export function useSettingsPremiumActions() {
  const { t } = useTranslation();
  const { showAlert } = useAlert();
  const {
    isAdFree,
    isLoading: isPremiumLoading,
    activeEntitlement,
    presentRemoveAdsPaywall,
    restorePurchases,
    openCustomerCenter,
  } = useMonetization();
  const [premiumAction, setPremiumAction] = useState<PremiumAction | null>(null);

  const run = async (action: PremiumAction, task: () => Promise<void>) => {
    if (premiumAction) return;
    setPremiumAction(action);
    try {
      await task();
    } catch (error) {
      console.error(`[Settings] Premium action failed (${action})`, error);
      showAlert({ title: t('common.error'), message: t('settings.premiumActionFailed') });
    } finally {
      setPremiumAction(null);
    }
  };

  const handleRemoveAds = () =>
    void run('paywall', async () => {
      if (await presentRemoveAdsPaywall()) {
        showAlert({ title: t('common.success'), message: t('settings.removeAdsSuccess') });
      }
    });

  const handleRestorePurchases = () =>
    void run('restore', async () => {
      const restored = await restorePurchases();
      showAlert({
        title: restored ? t('common.success') : t('common.warning'),
        message: restored
          ? t('settings.restorePurchasesSuccess')
          : t('settings.restorePurchasesEmpty'),
      });
    });

  const handleManageSubscription = () => void run('manage', openCustomerCenter);
  const adFreeStatusText = activeEntitlement?.expirationDate
    ? t('settings.adFreeActiveUntil', {
        date: new Date(activeEntitlement.expirationDate).toLocaleDateString(),
      })
    : t('settings.adFreeLifetime');

  return {
    isAdFree,
    isPremiumLoading,
    premiumAction,
    adFreeStatusText,
    handleRemoveAds,
    handleRestorePurchases,
    handleManageSubscription,
  };
}
