import React from 'react';
import Svg, { Defs, LinearGradient, Stop, Polygon } from 'react-native-svg';

interface StarIconProps {
    size?: number;
}

export const StarIcon: React.FC<StarIconProps> = ({ size = 32 }) => (
    <Svg width={size} height={size} viewBox="0 0 512 512" fill="none">
        <Defs>
            <LinearGradient id="starGrad" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0%" stopColor="#FFD36A" />
                <Stop offset="55%" stopColor="#FF9B2F" />
                <Stop offset="100%" stopColor="#FF6A00" />
            </LinearGradient>
        </Defs>
        <Polygon
            points="256,88 298.32,197.75 415.78,204.09 324.48,278.25 354.75,391.91 256,328 157.25,391.91 187.52,278.25 96.22,204.09 213.68,197.75"
            fill="url(#starGrad)"
        />
    </Svg>
);
