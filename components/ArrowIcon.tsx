import React from 'react';
import Svg, { Defs, LinearGradient, Stop, Polygon } from 'react-native-svg';

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
        <Polygon points="73,136 73,376 243,256" fill="url(#arrowGrad)" />
        <Polygon points="243,136 243,376 413,256" fill="url(#arrowGrad)" />
    </Svg>
);
