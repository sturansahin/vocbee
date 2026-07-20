import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@shared/theme';
import { AppButton, AppModal, IconButton } from '@shared/ui';

type PromptStep = 'enjoyment' | 'rating' | 'feedback';

interface AppRatingPromptProps {
  visible: boolean;
  onDismiss: () => void | Promise<void>;
  onRateInStore: (rating: number) => void | Promise<void>;
  onSendFeedback: (rating?: number) => void | Promise<void>;
}

const STAR_VALUES = [1, 2, 3, 4, 5] as const;

export function AppRatingPrompt({
  visible,
  onDismiss,
  onRateInStore,
  onSendFeedback,
}: AppRatingPromptProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const actionInFlight = useRef(false);
  const [step, setStep] = useState<PromptStep>('enjoyment');
  const [rating, setRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      actionInFlight.current = false;
      setStep('enjoyment');
      setRating(0);
      setIsSubmitting(false);
    }
  }, [visible]);

  const runAction = async (action: () => void | Promise<void>) => {
    if (actionInFlight.current) return;
    actionInFlight.current = true;
    setIsSubmitting(true);
    try {
      await action();
    } finally {
      actionInFlight.current = false;
      setIsSubmitting(false);
    }
  };

  const title =
    step === 'rating'
      ? t('reviewPrompt.rateTitle', { defaultValue: 'How would you rate VocBee?' })
      : step === 'feedback'
        ? t('reviewPrompt.feedbackTitle', { defaultValue: 'Help us improve' })
        : t('reviewPrompt.enjoyingTitle', { defaultValue: 'Enjoying VocBee?' });
  const message =
    step === 'rating'
      ? t('reviewPrompt.rateMessage', {
          defaultValue: 'Your rating helps us keep improving the learning experience.',
        })
      : step === 'feedback'
        ? t('reviewPrompt.feedbackMessage', {
            defaultValue: 'Tell us what would make VocBee better for you.',
          })
        : t('reviewPrompt.enjoyingMessage', {
            defaultValue: 'If VocBee is helping you learn, we would love a quick rating.',
          });
  const laterLabel = t('reviewPrompt.later', { defaultValue: 'Later' });
  const sendFeedbackLabel = t('reviewPrompt.sendFeedback', {
    defaultValue: 'Send Feedback',
  });

  const actions =
    step === 'enjoyment' ? (
      <View style={styles.actions}>
        <AppButton
          disabled={isSubmitting}
          fullWidth={false}
          label={laterLabel}
          onPress={() => runAction(onDismiss)}
          variant="ghost"
          style={styles.action}
        />
        <AppButton
          disabled={isSubmitting}
          fullWidth={false}
          label={t('reviewPrompt.notYet', { defaultValue: 'Not yet' })}
          onPress={() => setStep('feedback')}
          variant="secondary"
          style={styles.action}
        />
        <AppButton
          disabled={isSubmitting}
          fullWidth={false}
          label={t('reviewPrompt.yes', { defaultValue: 'Yes' })}
          onPress={() => setStep('rating')}
          style={styles.action}
        />
      </View>
    ) : step === 'rating' ? (
      <View style={styles.actions}>
        <AppButton
          disabled={isSubmitting}
          fullWidth={false}
          label={laterLabel}
          onPress={() => runAction(onDismiss)}
          variant="ghost"
          style={styles.action}
        />
        <AppButton
          disabled={rating <= 0}
          fullWidth={false}
          label={
            rating >= 4
              ? t('reviewPrompt.rateInStore', { defaultValue: 'Rate in Store' })
              : sendFeedbackLabel
          }
          loading={isSubmitting}
          onPress={() =>
            runAction(rating >= 4 ? () => onRateInStore(rating) : () => onSendFeedback(rating))
          }
          style={styles.action}
        />
      </View>
    ) : (
      <View style={styles.actions}>
        <AppButton
          disabled={isSubmitting}
          fullWidth={false}
          label={laterLabel}
          onPress={() => runAction(onDismiss)}
          variant="ghost"
          style={styles.action}
        />
        <AppButton
          fullWidth={false}
          label={sendFeedbackLabel}
          loading={isSubmitting}
          onPress={() => runAction(() => onSendFeedback())}
          style={styles.action}
        />
      </View>
    );

  return (
    <AppModal
      visible={visible}
      title={title}
      description={message}
      actions={actions}
      dismissOnBackdropPress={!isSubmitting}
      onRequestClose={() => void runAction(onDismiss)}
    >
      {step === 'rating' ? (
        <View
          accessibilityLabel={t('reviewPrompt.rateTitle', {
            defaultValue: 'How would you rate VocBee?',
          })}
          accessibilityRole="radiogroup"
          style={styles.starRow}
        >
          {STAR_VALUES.map((value) => {
            const selected = value <= rating;
            return (
              <IconButton
                key={value}
                accessibilityLabel={t('reviewPrompt.starAccessibilityLabel', {
                  defaultValue: '{{count}} stars',
                  count: value,
                })}
                accessibilityState={{ selected: rating === value }}
                icon={
                  <MaterialIcons
                    name={selected ? 'star' : 'star-border'}
                    size={34}
                    color={selected ? colors.accent : colors.textSecondary}
                  />
                }
                onPress={() => setRating(value)}
              />
            );
          })}
        </View>
      ) : null}
    </AppModal>
  );
}

const styles = StyleSheet.create({
  starRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  actions: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  action: {
    flexGrow: 1,
    minWidth: 92,
  },
});
