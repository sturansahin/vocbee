import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@shared/theme';

export interface PaginationDotsProps {
  count: number;
  selectedIndex: number;
}

export function PaginationDots({ count, selectedIndex }: PaginationDotsProps) {
  const { colors } = useTheme();
  return (
    <View accessibilityRole="tablist" style={styles.container}>
      {Array.from({ length: count }, (_, index) => {
        const selected = selectedIndex === index;
        return (
          <View
            accessible
            accessibilityLabel={`Step ${index + 1} of ${count}`}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor: selected ? colors.accent : colors.borderDefault,
                width: selected ? 32 : 8,
              },
            ]}
            testID={`onboarding-dot-${index}`}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
});
