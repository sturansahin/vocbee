import React from 'react';
import Svg, { Defs, LinearGradient, Stop, Path, Polygon, G } from 'react-native-svg';

interface RetryIconProps {
    size?: number;
}

export const RetryIcon: React.FC<RetryIconProps> = ({ size = 32 }) => (
    <Svg width={size} height={size} viewBox="0 0 512 512" fill="none">
        <Defs>
            <LinearGradient id="retryGrad" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0%" stopColor="#FFD36A" />
                <Stop offset="55%" stopColor="#FF9B2F" />
                <Stop offset="100%" stopColor="#FF6A00" />
            </LinearGradient>
        </Defs>
        <G transform="rotate(-30 256 256)">
            <Path
                d="M 426 256 A 170 170 0 1 1 256 86"
                stroke="url(#retryGrad)"
                strokeWidth={50}
                strokeLinecap="round"
                fill="none"
            />
            <Polygon points="330,86 250,20 250,152" fill="url(#retryGrad)" />
        </G>
    </Svg>
);
