export type Orientation = 'portrait' | 'landscape';
export type SizeClass = 'compact' | 'regular' | 'wide';

export interface ResponsiveLayout {
  width: number;
  height: number;
  orientation: Orientation;
  sizeClass: SizeClass;
  isSmallHeight: boolean;
  contentMaxWidth: number;
  horizontalGutter: number;
  moderateScale: (value: number) => number;
}

export interface ResponsiveMetrics extends Omit<ResponsiveLayout, 'moderateScale'> {
  scaleFactor: number;
}
