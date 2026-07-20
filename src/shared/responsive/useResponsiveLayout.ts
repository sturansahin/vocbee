import { useCallback, useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { createResponsiveMetrics, moderateScale as applyModerateScale } from './metrics';
import type { ResponsiveLayout } from './types';

export function useResponsiveLayout(): ResponsiveLayout {
  const { width, height } = useWindowDimensions();
  const metrics = useMemo(() => createResponsiveMetrics(width, height), [height, width]);
  const moderateScale = useCallback(
    (value: number) => applyModerateScale(value, metrics.scaleFactor),
    [metrics.scaleFactor],
  );

  return useMemo(
    () => ({
      width: metrics.width,
      height: metrics.height,
      orientation: metrics.orientation,
      sizeClass: metrics.sizeClass,
      isSmallHeight: metrics.isSmallHeight,
      contentMaxWidth: metrics.contentMaxWidth,
      horizontalGutter: metrics.horizontalGutter,
      moderateScale,
    }),
    [metrics, moderateScale],
  );
}
