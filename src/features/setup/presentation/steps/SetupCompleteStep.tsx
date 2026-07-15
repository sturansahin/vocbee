// src/features/setup/presentation/steps/SetupCompleteStep.tsx
// Pure UI extraction of SetupScreens.tsx renderStep7Content (notification frequency picker —
// the final step before the bottom "Start Learning" button triggers handleFinalStep in the parent).
//
// Naming note (deviation documented per ADIM4 report): the ADIM4 target file list names this
// "SetupCompleteStep", but the underlying render block is actually the frequency-selection step,
// not a dedicated "completion" screen — SetupScreens.tsx has no separate step for that; step 7 IS
// the last step and its "Start Learning" button (owned by the parent's shared bottom button, not by
// this component) is what finalizes setup. No new completion UI was invented; this file simply
// takes the name the task specified for the step that precedes/triggers setup completion.

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { FONT_FAMILY } from '../../../../../utils/typography';
import type { NotificationFrequencyKey } from '@features/notifications';

export interface SetupCompleteStepProps {
  colors: { text: string; primary: string; surface: string; border: string };
  frequencyKeys: readonly NotificationFrequencyKey[];
  selectedFrequency: NotificationFrequencyKey;
  onSelectFrequency: (frequency: NotificationFrequencyKey) => void;
}

export const SetupCompleteStep: React.FC<SetupCompleteStepProps> = ({
  colors,
  frequencyKeys,
  selectedFrequency,
  onSelectFrequency,
}) => {
  const { t } = useTranslation();

  return (
    <View style={[styles.scrollView, { justifyContent: 'center' }]}>
      <View style={styles.scheduleContainer}>
        <View style={[styles.scheduleSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.scheduleLabelRow}>
            <Feather name="repeat" size={18} color={colors.primary} />
            <Text style={[styles.scheduleLabel, { color: colors.text }]}>{t('setup.frequency')}</Text>
          </View>
          <View style={styles.frequencyList}>
            {frequencyKeys.map((freqKey) => (
              <TouchableOpacity
                key={freqKey}
                style={[
                  styles.frequencyItem,
                  { borderColor: colors.border },
                  selectedFrequency === freqKey && { borderColor: colors.primary, backgroundColor: `${colors.primary}15` },
                ]}
                onPress={() => onSelectFrequency(freqKey)}
              >
                <Text
                  style={[
                    styles.frequencyText,
                    { color: selectedFrequency === freqKey ? colors.primary : colors.text },
                  ]}
                >
                  {t(`settings.${freqKey}`)}
                </Text>
                {selectedFrequency === freqKey && (
                  <MaterialIcons name="check" size={18} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
};

// Styles copied VERBATIM from screens/SetupScreens.tsx (scheduleContainer/.../frequencyText block).
const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scheduleContainer: {
    gap: 16,
    paddingBottom: 120,
  },
  scheduleSection: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  scheduleLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  scheduleLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '600',
  },
  frequencyList: {
    gap: 8,
  },
  frequencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  frequencyText: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
  },
});

export default SetupCompleteStep;
