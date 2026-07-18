// src/features/settings/presentation/sections/__tests__/PremiumSettingsSection.test.tsx
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { PremiumSettingsSection } from '../PremiumSettingsSection';

// jest.setup.js globally mocks @expo/vector-icons but does not include MaterialCommunityIcons
// (used by this section for the crown/credit-card icons) — extend it locally for this suite only.
jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: 'MaterialIcons',
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

const colors = {
  text: '#000',
  textSecondary: '#666',
  surface: '#F5F5F5',
  border: '#E0E0E0',
  primary: '#FFC814',
};

const baseProps = {
  isAdFree: false,
  isPremiumLoading: false,
  premiumAction: null,
  adFreeStatusText: 'Lifetime',
  colors,
  isDarkMode: false,
  sectionTitle: 'Premium',
  removeAdsActiveLabel: 'Ad-Free Active',
  removeAdsLabel: 'Remove Ads',
  removeAdsDescription: 'Enjoy an ad-free experience',
  restorePurchasesLabel: 'Restore Purchases',
  restorePurchasesDescription: 'Restore your previous purchase',
  manageSubscriptionLabel: 'Manage Subscription',
  manageSubscriptionDescription: 'Manage your subscription',
  onPressRemoveAds: jest.fn(),
  onPressRestorePurchases: jest.fn(),
  onPressManageSubscription: jest.fn(),
};

describe('PremiumSettingsSection', () => {
  it('shows "Remove Ads" row for free users and hides manage-subscription row', () => {
    const { getByText, queryByText } = render(
      <PremiumSettingsSection {...baseProps} isAdFree={false} />,
    );
    expect(getByText('Remove Ads')).toBeTruthy();
    expect(queryByText('Manage Subscription')).toBeNull();
  });

  it('shows "Ad-Free Active" + manage subscription row for premium users', () => {
    const { getByText } = render(<PremiumSettingsSection {...baseProps} isAdFree />);
    expect(getByText('Ad-Free Active')).toBeTruthy();
    expect(getByText('Manage Subscription')).toBeTruthy();
    expect(getByText('Lifetime')).toBeTruthy();
  });

  it('calls onPressRemoveAds when the remove-ads row is pressed', () => {
    const onPressRemoveAds = jest.fn();
    const { getByText } = render(
      <PremiumSettingsSection {...baseProps} onPressRemoveAds={onPressRemoveAds} />,
    );
    fireEvent.press(getByText('Remove Ads'));
    expect(onPressRemoveAds).toHaveBeenCalledTimes(1);
  });
});
