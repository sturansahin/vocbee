import React from 'react';
import { StyleSheet, View } from 'react-native';
import { HomeHeader, HomeProgressSection } from '@features/home';
import { EmptyState, ErrorState, Screen } from '@shared/ui';

interface StateColors {
  background: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  surfaceMuted: string;
  borderDefault: string;
  streak: string;
}

interface LoadingProps {
  colors: StateColors;
  isDarkMode: boolean;
  showBannerPlaceholder: boolean;
  levelCode: string;
  levelDescription: string;
  wordsLabel: string;
}

export function HomeLoadingState(props: LoadingProps) {
  const placeholder = props.isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';
  const accent = props.isDarkMode ? 'rgba(255,200,20,0.22)' : 'rgba(255,200,20,0.28)';
  return (
    <Screen testID="home-loading" constrainWidth={false} contentStyle={styles.container}>
      <HomeHeader
        titleColor={props.colors.textPrimary}
        iconColor={props.colors.textPrimary}
        streakCount={0}
        streakCompletedToday={false}
        streakAtRisk={false}
        streakTextColor={props.colors.textPrimary}
        streakAccentColor={props.colors.streak}
        streakAccessibilityLabel=""
        favoritesAccessibilityLabel=""
        settingsAccessibilityLabel=""
        placeholderColor={placeholder}
        showPlaceholders
      />
      <View style={[styles.stats, { borderColor: props.colors.borderDefault }]}>
        <HomeProgressSection
          isLoading
          isDarkMode={props.isDarkMode}
          textColor={props.colors.textPrimary}
          textSecondaryColor={props.colors.textSecondary}
          primaryColor={props.colors.accent}
          surfaceLightColor={props.colors.surfaceMuted}
          borderColor={props.colors.borderDefault}
          initialLoadingPlaceholderColor={placeholder}
          initialLoadingAccentColor={accent}
          levelCode={props.levelCode}
          levelDescription={props.levelDescription}
          learnedCount={0}
          totalCount={0}
          wordsLabel={props.wordsLabel}
          progressPercentage={0}
        />
      </View>
      <View
        style={[
          styles.cardPlaceholder,
          {
            backgroundColor: placeholder,
            borderColor: props.colors.borderDefault,
          },
        ]}
      />
      {props.showBannerPlaceholder && (
        <View style={[styles.bannerPlaceholder, { backgroundColor: placeholder }]} />
      )}
    </Screen>
  );
}

interface EmptyProps {
  colors: StateColors;
  title: string;
  description: string;
  header: React.ReactNode;
}

export function HomeEmptyState({ title, description, header }: EmptyProps) {
  return (
    <Screen testID="home-empty" constrainWidth={false} contentStyle={styles.container}>
      {header}
      <EmptyState title={title} message={description} />
    </Screen>
  );
}

export function HomeErrorState({
  title,
  description,
  retryLabel,
  onRetry,
}: {
  colors: StateColors;
  title: string;
  description: string;
  retryLabel: string;
  onRetry(): void;
}) {
  return (
    <Screen testID="home-error" centered>
      <ErrorState title={title} message={description} retryLabel={retryLabel} onRetry={onRetry} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  stats: { marginHorizontal: 20, marginTop: 8, borderRadius: 20, borderWidth: 1, padding: 16 },
  cardPlaceholder: { flex: 1, margin: 20, borderRadius: 32, borderWidth: 1, opacity: 0.45 },
  bannerPlaceholder: { height: 50, marginHorizontal: 24, marginBottom: 12, borderRadius: 16 },
});
