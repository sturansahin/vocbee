import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Pressable,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FONT_FAMILY, useTheme } from '@shared/theme';
import Svg, { Defs, Rect, Mask } from 'react-native-svg';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface LayoutRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface HomeTutorialOverlayProps {
  visible: boolean;
  onComplete: () => void;
  currentStep: number;
  onNext: () => void;
  renderHighlight?: (layout: LayoutRect, step: number) => React.ReactNode;
  layouts: {
    card: LayoutRect;
    favoriteButton: LayoutRect;
    word: LayoutRect;
    exampleSentence: LayoutRect;
    moreExample: LayoutRect;
  };
}

export default function HomeTutorialOverlay({ visible, onComplete, currentStep, onNext, renderHighlight, layouts }: HomeTutorialOverlayProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const TOTAL_STEPS = 6;

  if (!visible) return null;

  // Determine current target layout to position tooltip
  let targetLayout: LayoutRect;
  switch (currentStep) {
    case 1:
    case 2:
      targetLayout = layouts.card;
      break;
    case 3:
      targetLayout = layouts.favoriteButton;
      break;
    case 4:
      targetLayout = layouts.word;
      break;
    case 5:
      targetLayout = layouts.exampleSentence;
      break;
    case 6:
      targetLayout = layouts.moreExample;
      break;
    default:
      targetLayout = { x: 0, y: 0, width: 0, height: 0 };
  }

  // We removed pad completely so the shadow hugs the real element 1-to-1.
  const cutX = targetLayout.x;
  const cutY = targetLayout.y;
  const cutW = targetLayout.width;
  const cutH = targetLayout.height;

  // Calculate inner radius perfectly based on element shapes
  let innerRadius = 8; // default subtle rounding
  if (currentStep === 3) {
    innerRadius = cutH / 2; // Circle for favorite
  } else if (currentStep === 6) {
    innerRadius = Math.min(24, cutH / 2); // Rounded rectangle for more example button
  }

  // The 4 rectangles forming the mask
  const bgOpacity = currentStep <= 2 ? 0.75 : 0.85; // Slightly darker for smaller spotlights
  const bgColor = `rgba(0,0,0,${bgOpacity})`;
  const hasFloatingHighlight = currentStep > 2 && !!renderHighlight;

  // Calculate Tooltip position roughly
  const getTooltipStyle = () => {
    let top: number | undefined = targetLayout.y + targetLayout.height + 20;
    let bottom: number | undefined = undefined;

    // Steps 1 & 2: Move tooltip above the card area
    if (currentStep <= 2) {
      top = Math.max(insets.top + 8, layouts.card.y - (isSmallScreen ? 100 : 112));
    }
    // Steps 3, 4, 5: Tooltip below the highlighted content
    else if (currentStep === 3 || currentStep === 4 || currentStep === 5) {
      top = targetLayout.y + targetLayout.height + 20;
    }
    // Step 6: Tooltip above the bottom button to avoid screen edge
    else if (currentStep === 6) {
      top = undefined;
      bottom = SCREEN_HEIGHT - targetLayout.y + 20;
    }

    return {
      position: 'absolute' as const,
      left: 20,
      right: 20,
      top,
      bottom,
      alignItems: 'center' as const,
    };
  };

  const isSmallScreen = SCREEN_HEIGHT < 700;
  const subtitleFontSize = isSmallScreen ? 14 : 16;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <View style={styles.container} pointerEvents="box-none">

        {/* 
          Steps 1 & 2: The card in HomeScreen is zIndex 10000 and renders ON TOP of this entire overlay.
          So we don't need a hole! We just render a solid background to darken the rest of the screen.
        */}
        {(currentStep <= 2 || hasFloatingHighlight) && (
          <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: bgColor }]} onPress={() => {}} />
        )}

        {/* Fallback spotlight for callers that still prefer a cutout instead of a floating highlight */}
        {currentStep > 2 && !hasFloatingHighlight && (
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <Svg height="100%" width="100%">
              <Defs>
                <Mask id="spotlightMask">
                  <Rect x="0" y="0" width="100%" height="100%" fill="white" />
                  <Rect
                    x={cutX}
                    y={cutY}
                    width={cutW}
                    height={cutH}
                    rx={innerRadius}
                    ry={innerRadius}
                    fill="black"
                  />
                </Mask>
              </Defs>
              <Rect
                x="0"
                y="0"
                width="100%"
                height="100%"
                fill={bgColor}
                mask="url(#spotlightMask)"
              />
            </Svg>
          </View>
        )}

        {hasFloatingHighlight && (
          <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            {renderHighlight?.(targetLayout, currentStep)}
          </View>
        )}

        {/* Tooltip Content */}
        <View style={getTooltipStyle()} pointerEvents="none">
          <View
            style={[
              styles.tooltipBox,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.tooltipText, { color: colors.text }]}>
              {t(`homeTutorial.step${currentStep}` as any)}
            </Text>
          </View>
        </View>

        {/* Footer Controls */}
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]} pointerEvents="box-none">
          {/* Buttons matching OnboardingScreen */}
          <View style={styles.actions}>
            {currentStep < TOTAL_STEPS ? (
              <>
                <TouchableOpacity onPress={onComplete} style={styles.btnNav}>
                  <Text style={[styles.btnSkipText, { fontSize: subtitleFontSize + 2 }]}>
                    {t('homeTutorial.skip')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onNext} style={styles.btnNav}>
                  <Text style={[styles.btnNextText, { color: colors.primary, fontSize: subtitleFontSize + 2 }]}>
                    {t('homeTutorial.next')}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.startButtonContainer}>
                <TouchableOpacity onPress={onComplete} style={styles.startButton}>
                  <Text style={[styles.startButtonText, { color: colors.primary, fontSize: subtitleFontSize + 2 }]}>
                    {t('homeTutorial.done')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  tooltipBox: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    maxWidth: '85%',
    alignItems: 'center',
  },
  tooltipText: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 0,
    backgroundColor: 'transparent',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingBottom: 10,
  },
  btnNav: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  btnSkipText: {
    fontFamily: FONT_FAMILY,
    color: 'white',
    opacity: 0.8,
  },
  btnNextText: {
    fontFamily: FONT_FAMILY,
    fontWeight: '600',
  },
  startButtonContainer: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: 10,
  },
  startButton: {
    paddingHorizontal: 48,
    paddingVertical: 14,
  },
  startButtonText: {
    fontFamily: FONT_FAMILY,
    fontWeight: '600',
  },
});
