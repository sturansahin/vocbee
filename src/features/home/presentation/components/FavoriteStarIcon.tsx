// src/features/home/presentation/components/FavoriteStarIcon.tsx
// Pure presentational SVG icon extracted VERBATIM from screens/HomeScreen.tsx (ADIM 2, UI-only
// extraction — docs/architecture.md). No behavior/logic change: same points, same props, same
// rendering. HomeScreen still owns all favorite-toggle state/handlers; this component only draws
// the star shape.

import React from 'react';
import Svg, { Polygon } from 'react-native-svg';

const FEATHER_STAR_POINTS =
  '12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2';

export interface FavoriteStarIconProps {
  color: string;
  filled?: boolean;
  size?: number;
  style?: any;
}

export function FavoriteStarIcon({
  color,
  filled = false,
  size = 24,
  style,
}: FavoriteStarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
      <Polygon
        points={FEATHER_STAR_POINTS}
        fill={filled ? color : 'none'}
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default FavoriteStarIcon;
