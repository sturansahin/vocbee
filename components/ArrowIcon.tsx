import React from 'react';
import Svg, { Defs, LinearGradient, Stop, Path, G } from 'react-native-svg';

interface ArrowIconProps {
    size?: number;
}

export const ArrowIcon: React.FC<ArrowIconProps> = ({ size = 32 }) => (
    <Svg width={size} height={size} viewBox="0 0 512 512" fill="none">
        <Defs>
            <LinearGradient id="arrowGrad" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0%" stopColor="#FFD36A" />
                <Stop offset="55%" stopColor="#FF9B2F" />
                <Stop offset="100%" stopColor="#FF6A00" />
            </LinearGradient>
        </Defs>
        <G fill="url(#arrowGrad)">
            <Path d="M 73.00,158.00 L 73.00,354.00 Q 73.00,376.00 90.97,363.31 L 225.03,268.69 Q 243.00,256.00 225.03,243.31 L 90.97,148.69 Q 73.00,136.00 73.00,158.00 Z" />
            <Path d="M 243.00,158.00 L 243.00,354.00 Q 243.00,376.00 260.97,363.31 L 395.03,268.69 Q 413.00,256.00 395.03,243.31 L 260.97,148.69 Q 243.00,136.00 243.00,158.00 Z" />
        </G>
    </Svg>
);
