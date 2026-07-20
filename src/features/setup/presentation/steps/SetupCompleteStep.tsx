import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { NotificationFrequencyKey } from '@features/notifications';
import type { ThemeColors } from '@shared/theme';
import { AppText, Inline, SelectionRow, Surface } from '@shared/ui';

export interface SetupCompleteStepProps {
  colors?: Pick<ThemeColors, 'textPrimary' | 'accent' | 'surface' | 'borderDefault'>;
  frequencyKeys: readonly NotificationFrequencyKey[];
  selectedFrequency: NotificationFrequencyKey;
  onSelectFrequency: (frequency: NotificationFrequencyKey) => void;
}

export function SetupCompleteStep({
  frequencyKeys,
  selectedFrequency,
  onSelectFrequency,
}: SetupCompleteStepProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Surface style={styles.card}>
        <Inline>
          <Feather name="repeat" size={20} />
          <AppText variant="bodyStrong">{t('setup.frequency')}</AppText>
        </Inline>
        <View accessibilityRole="radiogroup" style={styles.list}>
          {frequencyKeys.map((frequency) => (
            <SelectionRow
              key={frequency}
              label={t(`settings.${frequency}`)}
              onPress={() => onSelectFrequency(frequency)}
              selected={selectedFrequency === frequency}
              testID={`setup-frequency-${frequency}`}
            />
          ))}
        </View>
      </Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 120,
  },
  card: {
    padding: 16,
    gap: 12,
  },
  list: {
    gap: 8,
  },
});

export default SetupCompleteStep;
