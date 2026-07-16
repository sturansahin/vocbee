import React, { createContext, useContext, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { DARK_COLORS, LIGHT_COLORS } from './colors';

export type ThemeColors = typeof DARK_COLORS;

export interface ThemeContextType {
    isDarkMode: boolean;
    colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const systemColorScheme = useColorScheme();
    const isDarkMode = systemColorScheme === 'dark';
    const colors = isDarkMode ? DARK_COLORS : LIGHT_COLORS;

    return (
        <ThemeContext.Provider value={{ isDarkMode, colors }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
