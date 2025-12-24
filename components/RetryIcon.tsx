import React from 'react';
import Svg, { Defs, LinearGradient, Stop, Path, G } from 'react-native-svg';

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
            <Path
                d="M 313.03,72.00 L 266.97,34.00 Q 250.00,20.00 250.00,42.00 L 250.00,130.00 Q 250.00,152.00 266.97,138.00 L 313.03,100.00 Q 330.00,86.00 313.03,72.00 Z"
                fill="url(#retryGrad)"
            />
        </G>
    </Svg>
);
