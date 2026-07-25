export interface LayoutRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type TutorialTargetKey =
  'card' | 'favoriteButton' | 'word' | 'exampleSentence' | 'moreExample';

export type TutorialLayouts = Record<TutorialTargetKey, LayoutRect>;

export type TooltipPlacement = 'above' | 'below';

const TARGET_BY_STEP: Record<number, TutorialTargetKey> = {
  1: 'card',
  2: 'card',
  3: 'favoriteButton',
  4: 'word',
  5: 'exampleSentence',
  6: 'moreExample',
};

const SPOTLIGHT_PADDING_BY_STEP: Record<number, { horizontal: number; vertical: number }> = {
  // The card performs a small directional nudge during the swipe lessons. Keep that movement
  // inside the transparent area instead of clipping it at the card's resting bounds.
  // The measured target is the non-animated card stack. The extra vertical room contains
  // the top and bottom corners while the foreground card rotates during the swipe nudge.
  1: { horizontal: 48, vertical: 20 },
  2: { horizontal: 48, vertical: 20 },
  3: { horizontal: 8, vertical: 8 },
  4: { horizontal: 10, vertical: 8 },
  5: { horizontal: 10, vertical: 8 },
  6: { horizontal: 4, vertical: 4 },
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function clampRect(rect: LayoutRect, containerWidth: number, containerHeight: number): LayoutRect {
  const x = clamp(rect.x, 0, Math.max(0, containerWidth));
  const y = clamp(rect.y, 0, Math.max(0, containerHeight));
  const right = clamp(rect.x + rect.width, x, Math.max(x, containerWidth));
  const bottom = clamp(rect.y + rect.height, y, Math.max(y, containerHeight));

  return { x, y, width: right - x, height: bottom - y };
}

export function getTutorialTargetLayout(layouts: TutorialLayouts, step: number): LayoutRect {
  return layouts[TARGET_BY_STEP[step] ?? 'card'];
}

export function getTutorialSpotlightLayout(
  layouts: TutorialLayouts,
  step: number,
  containerWidth: number,
  containerHeight: number,
): LayoutRect {
  const target = getTutorialTargetLayout(layouts, step);
  const padding = SPOTLIGHT_PADDING_BY_STEP[step] ?? { horizontal: 8, vertical: 8 };

  return clampRect(
    {
      x: target.x - padding.horizontal,
      y: target.y - padding.vertical,
      width: target.width + padding.horizontal * 2,
      height: target.height + padding.vertical * 2,
    },
    containerWidth,
    containerHeight,
  );
}

export function getTutorialSpotlightRadius(step: number, spotlight: LayoutRect): number {
  if (step === 3) return spotlight.height / 2;
  if (step === 6) return Math.min(32, spotlight.height / 2);
  if (step <= 2) return Math.min(36, spotlight.height / 2);
  return Math.min(14, spotlight.height / 2);
}

interface TooltipPositionOptions {
  target: LayoutRect;
  containerHeight: number;
  tooltipHeight: number;
  controlsHeight: number;
  preferAbove: boolean;
  edgeInset?: number;
  gap?: number;
}

export function getTutorialTooltipPosition({
  target,
  containerHeight,
  tooltipHeight,
  controlsHeight,
  preferAbove,
  edgeInset = 16,
  gap = 16,
}: TooltipPositionOptions): { top: number; placement: TooltipPlacement } {
  const safeTooltipHeight = Math.max(1, tooltipHeight);
  const topLimit = edgeInset;
  const bottomLimit = Math.max(topLimit, containerHeight - controlsHeight - edgeInset);
  const aboveTop = target.y - gap - safeTooltipHeight;
  const belowTop = target.y + target.height + gap;
  const aboveFits = aboveTop >= topLimit;
  const belowFits = belowTop + safeTooltipHeight <= bottomLimit;

  if (preferAbove && aboveFits) return { top: aboveTop, placement: 'above' };
  if (!preferAbove && belowFits) return { top: belowTop, placement: 'below' };
  if (aboveFits) return { top: aboveTop, placement: 'above' };
  if (belowFits) return { top: belowTop, placement: 'below' };

  const spaceAbove = Math.max(0, target.y - gap - topLimit);
  const spaceBelow = Math.max(0, bottomLimit - (target.y + target.height + gap));
  const placement: TooltipPlacement = spaceAbove >= spaceBelow ? 'above' : 'below';
  const desiredTop = placement === 'above' ? aboveTop : belowTop;
  const maxTop = Math.max(topLimit, bottomLimit - safeTooltipHeight);

  return { top: clamp(desiredTop, topLimit, maxTop), placement };
}
