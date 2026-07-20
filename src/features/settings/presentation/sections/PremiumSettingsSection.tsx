// src/features/settings/presentation/sections/PremiumSettingsSection.tsx
// Pure presentational extraction of the "Premium" settings card (remove ads / restore purchases /
// manage subscription rows) from screens/SettingsScreen.tsx (ADIM 3, UI-only section extraction —
// docs/architecture.md). VERBATIM JSX/styles — no logic. SettingsScreen still owns all monetization
// state (isAdFree, isPremiumLoading, premiumAction, activeEntitlement) and handlers
// (handleRemoveAdsPress, handleRestorePurchasesPress, handleManageSubscriptionPress).

import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { FONT_FAMILY, type ThemeColors } from '@shared/theme';

export type PremiumActionKind = 'paywall' | 'restore' | 'manage' | null;

export interface PremiumSettingsSectionProps {
  isAdFree: boolean;
  isPremiumLoading: boolean;
  premiumAction: PremiumActionKind;
  adFreeStatusText: string;
  colors: Pick<
    ThemeColors,
    'textPrimary' | 'textSecondary' | 'surface' | 'borderDefault' | 'accent'
  >;
  isDarkMode: boolean;
  sectionTitle: string;
  removeAdsActiveLabel: string;
  removeAdsLabel: string;
  removeAdsDescription: string;
  restorePurchasesLabel: string;
  restorePurchasesDescription: string;
  manageSubscriptionLabel: string;
  manageSubscriptionDescription: string;
  onPressRemoveAds: () => void;
  onPressRestorePurchases: () => void;
  onPressManageSubscription: () => void;
}

export function PremiumSettingsSection({
  isAdFree,
  isPremiumLoading,
  premiumAction,
  adFreeStatusText,
  colors,
  isDarkMode,
  sectionTitle,
  removeAdsActiveLabel,
  removeAdsLabel,
  removeAdsDescription,
  restorePurchasesLabel,
  restorePurchasesDescription,
  manageSubscriptionLabel,
  manageSubscriptionDescription,
  onPressRemoveAds,
  onPressRestorePurchases,
  onPressManageSubscription,
}: PremiumSettingsSectionProps) {
  const settingIconStyle = {
    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
  };

  return (
    <>
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{sectionTitle}</Text>
      <View
        style={[
          styles.sectionCard,
          { backgroundColor: colors.surface, borderColor: colors.borderDefault },
        ]}
      >
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityState={{
            busy: premiumAction === 'paywall' || isPremiumLoading,
            disabled: isAdFree || isPremiumLoading || premiumAction !== null,
          }}
          style={styles.settingItem}
          onPress={onPressRemoveAds}
          disabled={isAdFree || isPremiumLoading || premiumAction !== null}
        >
          <View style={[styles.settingLeft, styles.settingLeftFlexible]}>
            <View style={[styles.settingIcon, settingIconStyle]}>
              <MaterialCommunityIcons
                name={isAdFree ? 'crown' : 'crown-outline'}
                size={24}
                color={colors.accent}
              />
            </View>
            <View style={styles.settingTextContent}>
              <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>
                {isAdFree ? removeAdsActiveLabel : removeAdsLabel}
              </Text>
              <Text
                style={[styles.settingSubtitle, { color: colors.textSecondary }]}
                numberOfLines={2}
              >
                {isAdFree ? adFreeStatusText : removeAdsDescription}
              </Text>
            </View>
          </View>
          {premiumAction === 'paywall' || isPremiumLoading ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : isAdFree ? (
            <MaterialIcons name="check-circle" size={24} color={colors.accent} />
          ) : (
            <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityState={{
            busy: premiumAction === 'restore',
            disabled: isPremiumLoading || premiumAction !== null,
          }}
          style={[styles.settingItem, !isAdFree && { borderBottomWidth: 0 }]}
          onPress={onPressRestorePurchases}
          disabled={isPremiumLoading || premiumAction !== null}
        >
          <View style={[styles.settingLeft, styles.settingLeftFlexible]}>
            <View style={[styles.settingIcon, settingIconStyle]}>
              <MaterialIcons name="restore" size={24} color={colors.accent} />
            </View>
            <View style={styles.settingTextContent}>
              <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>
                {restorePurchasesLabel}
              </Text>
              <Text
                style={[styles.settingSubtitle, { color: colors.textSecondary }]}
                numberOfLines={2}
              >
                {restorePurchasesDescription}
              </Text>
            </View>
          </View>
          {premiumAction === 'restore' ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : (
            <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
          )}
        </TouchableOpacity>

        {isAdFree && (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityState={{
              busy: premiumAction === 'manage',
              disabled: isPremiumLoading || premiumAction !== null,
            }}
            style={[styles.settingItem, { borderBottomWidth: 0 }]}
            onPress={onPressManageSubscription}
            disabled={isPremiumLoading || premiumAction !== null}
          >
            <View style={[styles.settingLeft, styles.settingLeftFlexible]}>
              <View style={[styles.settingIcon, settingIconStyle]}>
                <MaterialCommunityIcons
                  name="credit-card-outline"
                  size={24}
                  color={colors.accent}
                />
              </View>
              <View style={styles.settingTextContent}>
                <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>
                  {manageSubscriptionLabel}
                </Text>
                <Text
                  style={[styles.settingSubtitle, { color: colors.textSecondary }]}
                  numberOfLines={2}
                >
                  {manageSubscriptionDescription}
                </Text>
              </View>
            </View>
            {premiumAction === 'manage' ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
            )}
          </TouchableOpacity>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 8,
  },
  sectionCard: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
    borderWidth: 1,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  settingLeftFlexible: {
    flex: 1,
    minWidth: 0,
    paddingRight: 12,
  },
  settingTextContent: {
    flex: 1,
    minWidth: 0,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '500',
  },
  settingSubtitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
});

export default PremiumSettingsSection;
