import React from 'react';
import { FlatList, Image, ScrollView, StyleSheet, View } from 'react-native';
import { AppText, Stack } from '@shared/ui';
import type { ResponsiveLayout } from '@shared/responsive';
import type { OnboardingStep } from '../onboardingTypes';

export interface OnboardingCarouselProps {
  steps: readonly OnboardingStep[];
  listRef: React.RefObject<FlatList<OnboardingStep> | null>;
  layout: ResponsiveLayout;
  onScroll: (event: any) => void;
}

export function OnboardingCarousel({ steps, listRef, layout, onScroll }: OnboardingCarouselProps) {
  const visualHeight = Math.min(
    layout.height * (layout.isSmallHeight ? 0.34 : 0.42),
    layout.sizeClass === 'wide' ? 400 : 360,
  );
  const imageWidth = Math.min(layout.width * 0.86, layout.sizeClass === 'wide' ? 460 : 360);

  return (
    <FlatList
      bounces={false}
      data={[...steps]}
      decelerationRate="fast"
      getItemLayout={(_, index) => ({
        length: layout.width,
        offset: layout.width * index,
        index,
      })}
      horizontal
      keyExtractor={(item) => item.id}
      onScroll={onScroll}
      pagingEnabled
      ref={listRef}
      renderItem={({ item, index }) => (
        <ScrollView
          contentContainerStyle={[
            styles.slide,
            {
              width: layout.width,
              paddingHorizontal: layout.horizontalGutter,
              paddingTop: layout.isSmallHeight ? 12 : 24,
            },
          ]}
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
        >
          <Stack gap="md">
            <AppText
              accessibilityLabel={`${item.title}. Step ${index + 1} of ${steps.length}`}
              accessibilityRole="header"
              variant="screenTitle"
            >
              {item.title}
            </AppText>
            <AppText color="textSecondary">{item.subtitle}</AppText>
          </Stack>
          <View style={[styles.visualArea, { height: visualHeight }]}>
            <Image
              accessibilityIgnoresInvertColors
              resizeMode="contain"
              source={item.image}
              style={{ width: imageWidth, height: visualHeight }}
            />
          </View>
        </ScrollView>
      )}
      scrollEventThrottle={16}
      showsHorizontalScrollIndicator={false}
      testID="onboarding-carousel"
    />
  );
}

const styles = StyleSheet.create({
  slide: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  visualArea: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
