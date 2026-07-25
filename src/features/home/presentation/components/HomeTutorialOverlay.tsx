import React, { useId, useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useResponsiveLayout } from '@shared/responsive';
import { FONT_FAMILY, useTheme } from '@shared/theme';
import Svg, { Defs, Mask, Rect } from 'react-native-svg';
import {
  getTutorialSpotlightLayout,
  getTutorialSpotlightRadius,
  getTutorialTooltipPosition,
  type TutorialLayouts,
} from './homeTutorialLayout';

export type { LayoutRect, TutorialLayouts } from './homeTutorialLayout';

interface HomeTutorialOverlayProps {
  visible: boolean;
  onComplete: () => void;
  currentStep: number;
  onNext: () => void;
  layouts: TutorialLayouts;
}

const TOTAL_STEPS = 6;
const DEFAULT_TOOLTIP_HEIGHT = 76;
const DEFAULT_CONTROLS_HEIGHT = 68;

export default function HomeTutorialOverlay({
  visible,
  onComplete,
  currentStep,
  onNext,
  layouts,
}: HomeTutorialOverlayProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { width: viewportWidth, height: viewportHeight, isSmallHeight } = useResponsiveLayout();
  const [containerSize, setContainerSize] = useState({
    width: viewportWidth,
    height: viewportHeight,
  });
  const [tooltipHeight, setTooltipHeight] = useState(DEFAULT_TOOLTIP_HEIGHT);
  const [controlsHeight, setControlsHeight] = useState(DEFAULT_CONTROLS_HEIGHT);
  const maskId = `homeTutorialSpotlight-${useId().replace(/:/g, '')}`;

  const spotlight = useMemo(
    () =>
      getTutorialSpotlightLayout(layouts, currentStep, containerSize.width, containerSize.height),
    [containerSize.height, containerSize.width, currentStep, layouts],
  );
  const spotlightRadius = getTutorialSpotlightRadius(currentStep, spotlight);
  const tooltipPosition = getTutorialTooltipPosition({
    target: spotlight,
    containerHeight: containerSize.height,
    tooltipHeight,
    controlsHeight,
    preferAbove: currentStep <= 2 || currentStep === 6,
    edgeInset: isSmallHeight ? 10 : 16,
    gap: isSmallHeight ? 10 : 16,
  });
  const tooltipWidth = Math.max(1, Math.min(560, containerSize.width - 32));

  if (!visible) return null;

  const onContainerLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width !== containerSize.width || height !== containerSize.height) {
      setContainerSize({ width, height });
    }
  };

  const onTooltipLayout = (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    if (Math.abs(height - tooltipHeight) > 0.5) setTooltipHeight(height);
  };

  const onControlsLayout = (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    if (Math.abs(height - controlsHeight) > 0.5) setControlsHeight(height);
  };

  return (
    <View
      testID="home-tutorial-overlay"
      style={styles.container}
      pointerEvents="box-none"
      onLayout={onContainerLayout}
    >
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg height="100%" width="100%">
          <Defs>
            <Mask id={maskId}>
              <Rect x="0" y="0" width="100%" height="100%" fill="white" />
              <Rect
                x={spotlight.x}
                y={spotlight.y}
                width={spotlight.width}
                height={spotlight.height}
                rx={spotlightRadius}
                ry={spotlightRadius}
                fill="black"
              />
            </Mask>
          </Defs>
          <Rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(0,0,0,0.82)"
            mask={`url(#${maskId})`}
          />
          <Rect
            testID="home-tutorial-spotlight"
            x={spotlight.x}
            y={spotlight.y}
            width={spotlight.width}
            height={spotlight.height}
            rx={spotlightRadius}
            ry={spotlightRadius}
            fill="none"
            stroke={colors.accent}
            strokeWidth={2}
          />
        </Svg>
      </View>

      {/* Block unrelated Home controls while leaving the transparent spotlight touch-through. */}
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <BackdropBlocker style={{ left: 0, top: 0, right: 0, height: spotlight.y }} />
        <BackdropBlocker
          style={{
            left: 0,
            top: spotlight.y,
            width: spotlight.x,
            height: spotlight.height,
          }}
        />
        <BackdropBlocker
          style={{
            left: spotlight.x + spotlight.width,
            top: spotlight.y,
            right: 0,
            height: spotlight.height,
          }}
        />
        <BackdropBlocker
          style={{
            left: 0,
            top: spotlight.y + spotlight.height,
            right: 0,
            bottom: 0,
          }}
        />
      </View>

      <View
        testID="home-tutorial-tooltip"
        pointerEvents="none"
        onLayout={onTooltipLayout}
        style={[
          styles.tooltipPosition,
          {
            top: tooltipPosition.top,
            left: (containerSize.width - tooltipWidth) / 2,
            width: tooltipWidth,
          },
        ]}
      >
        <View
          style={[
            styles.tooltipBox,
            {
              backgroundColor: colors.surface,
              borderColor: colors.borderDefault,
              shadowColor: colors.shadow,
            },
          ]}
        >
          <Text style={[styles.tooltipText, { color: colors.textPrimary }]}>
            {t(`homeTutorial.step${currentStep}` as any)}
          </Text>
          <Text style={[styles.stepText, { color: colors.textSecondary }]}>
            {t('homeTutorial.stepOf', { current: currentStep, total: TOTAL_STEPS })}
          </Text>
        </View>
      </View>

      <View
        testID="home-tutorial-controls"
        onLayout={onControlsLayout}
        style={styles.footer}
        pointerEvents="box-none"
      >
        <View style={styles.actions}>
          {currentStep < TOTAL_STEPS ? (
            <>
              <TouchableOpacity
                accessibilityLabel={t('homeTutorial.skip')}
                accessibilityRole="button"
                onPress={onComplete}
                style={styles.navigationButton}
              >
                <Text
                  style={[
                    styles.skipText,
                    { color: colors.onOverlay, fontSize: isSmallHeight ? 15 : 17 },
                  ]}
                >
                  {t('homeTutorial.skip')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityLabel={t('homeTutorial.next')}
                accessibilityRole="button"
                onPress={onNext}
                style={styles.navigationButton}
              >
                <Text
                  style={[
                    styles.nextText,
                    { color: colors.accent, fontSize: isSmallHeight ? 15 : 17 },
                  ]}
                >
                  {t('homeTutorial.next')}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.doneButtonContainer}>
              <TouchableOpacity
                accessibilityLabel={t('homeTutorial.done')}
                accessibilityRole="button"
                onPress={onComplete}
                style={styles.doneButton}
              >
                <Text
                  style={[
                    styles.nextText,
                    { color: colors.accent, fontSize: isSmallHeight ? 15 : 17 },
                  ]}
                >
                  {t('homeTutorial.done')}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

function BackdropBlocker({ style }: { style: object }) {
  return (
    <Pressable
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      onPress={() => undefined}
      style={[styles.backdropBlocker, style]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropBlocker: {
    position: 'absolute',
  },
  tooltipPosition: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 20,
    elevation: 20,
  },
  tooltipBox: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 20,
    alignItems: 'center',
  },
  tooltipText: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    fontWeight: '600',
  },
  stepText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 6,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    zIndex: 30,
    elevation: 30,
  },
  actions: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  navigationButton: {
    minWidth: 72,
    minHeight: 48,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipText: {
    fontFamily: FONT_FAMILY,
    opacity: 0.9,
  },
  nextText: {
    fontFamily: FONT_FAMILY,
    fontWeight: '600',
  },
  doneButtonContainer: {
    flex: 1,
    alignItems: 'center',
  },
  doneButton: {
    minHeight: 48,
    paddingHorizontal: 48,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
