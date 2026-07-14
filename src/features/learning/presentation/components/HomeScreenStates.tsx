import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { HomeProgressSection } from '@features/home';
import { HomeHeader } from '../../../../../components/HomeHeader';

interface StateColors {
  background: string;
  text: string;
  textSecondary: string;
  primary: string;
  surfaceLight: string;
  border: string;
}

interface LoadingProps {
  colors: StateColors;
  isDarkMode: boolean;
  topInset: number;
  showBannerPlaceholder: boolean;
  levelCode: string;
  levelDescription: string;
  wordsLabel: string;
}

export function HomeLoadingState(props: LoadingProps) {
  const placeholder = props.isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';
  const accent = props.isDarkMode ? 'rgba(255,200,20,0.22)' : 'rgba(255,200,20,0.28)';
  return (
    <View testID="home-loading" style={[styles.container, { backgroundColor: props.colors.background, paddingTop: props.topInset }]}>
      <HomeHeader titleColor={props.colors.text} iconColor={props.colors.text} streakCount={0}
        streakCompletedToday={false} streakAtRisk={false} streakTextColor={props.colors.text}
        streakAccentColor="#FF8F1F" placeholderColor={placeholder} showPlaceholders />
      <View style={[styles.stats, { borderColor: props.colors.border }]}>
        <HomeProgressSection isLoading isDarkMode={props.isDarkMode} textColor={props.colors.text}
          textSecondaryColor={props.colors.textSecondary} primaryColor={props.colors.primary}
          surfaceLightColor={props.colors.surfaceLight} borderColor={props.colors.border}
          initialLoadingPlaceholderColor={placeholder} initialLoadingAccentColor={accent}
          levelCode={props.levelCode} levelDescription={props.levelDescription} learnedCount={0}
          totalCount={0} wordsLabel={props.wordsLabel} progressPercentage={0} />
      </View>
      <View style={[styles.cardPlaceholder, { backgroundColor: placeholder, borderColor: props.colors.border }]} />
      {props.showBannerPlaceholder && <View style={[styles.bannerPlaceholder, { backgroundColor: placeholder }]} />}
    </View>
  );
}

interface EmptyProps {
  colors: StateColors;
  topInset: number;
  title: string;
  description: string;
  header: React.ReactNode;
}

export function HomeEmptyState({ colors, topInset, title, description, header }: EmptyProps) {
  return (
    <View testID="home-empty" style={[styles.container, { backgroundColor: colors.background, paddingTop: topInset }]}>
      {header}
      <View style={styles.center}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text>
      </View>
    </View>
  );
}

export function HomeErrorState({ colors, topInset, title, description, retryLabel, onRetry }: {
  colors: StateColors; topInset: number; title: string; description: string; retryLabel: string; onRetry(): void;
}) {
  return (
    <View testID="home-error" style={[styles.container, styles.center, { backgroundColor: colors.background, paddingTop: topInset }]}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text>
      <TouchableOpacity accessibilityRole="button" onPress={onRetry} style={[styles.retry, { backgroundColor: colors.primary }]}>
        <Text style={[styles.retryText, { color: colors.text }]}>{retryLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  stats: { marginHorizontal: 20, marginTop: 8, borderRadius: 20, borderWidth: 1, padding: 16 },
  cardPlaceholder: { flex: 1, margin: 20, borderRadius: 32, borderWidth: 1, opacity: 0.45 },
  bannerPlaceholder: { height: 50, marginHorizontal: 24, marginBottom: 12, borderRadius: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  title: { fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 12 },
  description: { fontSize: 16, textAlign: 'center', lineHeight: 24 },
  retry: { marginTop: 24, minWidth: 140, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 14 },
  retryText: { fontSize: 16, fontWeight: '700', textAlign: 'center' },
});
