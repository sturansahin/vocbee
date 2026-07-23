import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import type { NotificationFrequencyKey } from '@features/notifications';
import { useTheme } from '@shared/theme';
import { AppText } from '@shared/ui';

type ExpandedField = 'start' | 'end' | 'frequency';

interface DropdownOption<T extends string> {
  key: T;
  label: string;
}

interface DropdownFieldProps<T extends string> {
  field: ExpandedField;
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  options: readonly DropdownOption<T>[];
  expanded: boolean;
  selectedValue: T;
  onSelect: (value: T) => void;
  onToggle: () => void;
}

function DropdownField<T extends string>({
  field,
  icon,
  label,
  options,
  expanded,
  selectedValue,
  onSelect,
  onToggle,
}: DropdownFieldProps<T>) {
  const { colors, radii } = useTheme();
  const selectedLabel = options.find((option) => option.key === selectedValue)?.label;

  return (
    <View style={styles.fieldGroup}>
      <Pressable
        accessibilityLabel={`${label}: ${selectedLabel ?? selectedValue}`}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={onToggle}
        style={({ pressed }) => [
          styles.field,
          {
            backgroundColor: pressed ? colors.surfaceMuted : colors.surface,
            borderColor: expanded ? colors.accent : colors.borderDefault,
            borderRadius: radii.md,
          },
        ]}
        testID={`setup-schedule-${field}`}
      >
        <View
          style={[styles.iconBox, { backgroundColor: colors.accentSoft, borderRadius: radii.sm }]}
        >
          <Feather color={colors.accent} name={icon} size={18} />
        </View>
        <View style={styles.fieldText}>
          <AppText color="textSecondary" variant="caption">
            {label}
          </AppText>
          <AppText numberOfLines={1} variant="bodyStrong">
            {selectedLabel ?? selectedValue}
          </AppText>
        </View>
        <Feather
          color={colors.textSecondary}
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
        />
      </Pressable>

      {expanded ? (
        <ScrollView
          contentContainerStyle={styles.optionsContent}
          nestedScrollEnabled
          showsVerticalScrollIndicator
          style={[
            styles.options,
            {
              backgroundColor: colors.surface,
              borderColor: colors.borderDefault,
              borderRadius: radii.md,
            },
          ]}
          testID={`setup-schedule-${field}-options`}
        >
          <View accessibilityRole="radiogroup">
            {options.map((option) => {
              const selected = option.key === selectedValue;
              return (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  key={option.key}
                  onPress={() => onSelect(option.key)}
                  style={({ pressed }) => [
                    styles.option,
                    {
                      backgroundColor: selected || pressed ? colors.accentSoft : colors.transparent,
                      borderRadius: radii.sm,
                    },
                  ]}
                  testID={`setup-schedule-${field}-option-${option.key}`}
                >
                  <AppText style={styles.optionLabel} variant={selected ? 'bodyStrong' : 'body'}>
                    {option.label}
                  </AppText>
                  {selected ? <Feather color={colors.accent} name="check" size={18} /> : null}
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      ) : null}
    </View>
  );
}

export interface ReminderScheduleStepProps {
  timeOptions: readonly string[];
  frequencyKeys: readonly NotificationFrequencyKey[];
  startTime: string;
  endTime: string;
  selectedFrequency: NotificationFrequencyKey;
  onSelectStartTime: (time: string) => void;
  onSelectEndTime: (time: string) => void;
  onSelectFrequency: (frequency: NotificationFrequencyKey) => void;
}

export function ReminderScheduleStep({
  timeOptions,
  frequencyKeys,
  startTime,
  endTime,
  selectedFrequency,
  onSelectStartTime,
  onSelectEndTime,
  onSelectFrequency,
}: ReminderScheduleStepProps) {
  const { t } = useTranslation();
  const [expandedField, setExpandedField] = useState<ExpandedField | null>(null);
  const timeDropdownOptions = timeOptions.map((time) => ({ key: time, label: time }));
  const frequencyOptions = frequencyKeys.map((frequency) => ({
    key: frequency,
    label: t(`settings.${frequency}`),
  }));

  const toggleField = (field: ExpandedField) => {
    setExpandedField((current) => (current === field ? null : field));
  };

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      nestedScrollEnabled
      showsVerticalScrollIndicator={false}
      style={styles.container}
    >
      <DropdownField
        expanded={expandedField === 'start'}
        field="start"
        icon="sunrise"
        label={t('setup.startTime')}
        onSelect={(time) => {
          onSelectStartTime(time);
          setExpandedField(null);
        }}
        onToggle={() => toggleField('start')}
        options={timeDropdownOptions}
        selectedValue={startTime}
      />
      <DropdownField
        expanded={expandedField === 'end'}
        field="end"
        icon="sunset"
        label={t('setup.endTime')}
        onSelect={(time) => {
          onSelectEndTime(time);
          setExpandedField(null);
        }}
        onToggle={() => toggleField('end')}
        options={timeDropdownOptions}
        selectedValue={endTime}
      />
      <DropdownField
        expanded={expandedField === 'frequency'}
        field="frequency"
        icon="repeat"
        label={t('setup.frequency')}
        onSelect={(frequency) => {
          onSelectFrequency(frequency);
          setExpandedField(null);
        }}
        onToggle={() => toggleField('frequency')}
        options={frequencyOptions}
        selectedValue={selectedFrequency}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    gap: 10,
    paddingBottom: 12,
  },
  fieldGroup: {
    gap: 6,
  },
  field: {
    minHeight: 58,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 10,
  },
  iconBox: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldText: {
    flex: 1,
    gap: 1,
  },
  options: {
    maxHeight: 176,
    borderWidth: 1,
    padding: 4,
  },
  optionsContent: {
    paddingBottom: 2,
  },
  option: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  optionLabel: {
    flex: 1,
  },
});

export default ReminderScheduleStep;
