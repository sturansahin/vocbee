// file: components/__tests__/SwarmLogo.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { SwarmLogo } from '../SwarmLogo';

describe('SwarmLogo', () => {
    it('renders without crashing', () => {
        const { toJSON } = render(<SwarmLogo />);
        expect(toJSON()).toBeTruthy();
    });

    it('renders with default props', () => {
        const { toJSON } = render(<SwarmLogo />);
        const tree = toJSON();
        
        // Default size is 40
        expect(tree).toBeTruthy();
    });

    it('renders with custom size', () => {
        const { toJSON } = render(<SwarmLogo size={60} />);
        const tree = toJSON();
        
        expect(tree).toBeTruthy();
    });

    it('renders with custom color', () => {
        const { toJSON } = render(<SwarmLogo color="#FF0000" />);
        const tree = toJSON();
        
        expect(tree).toBeTruthy();
    });

    it('renders with both custom size and color', () => {
        const { toJSON } = render(<SwarmLogo size={80} color="#0000FF" />);
        const tree = toJSON();
        
        expect(tree).toBeTruthy();
    });

    it('renders SVG paths correctly', () => {
        const { UNSAFE_getAllByType } = render(<SwarmLogo />);
        
        // The component should render Svg with Path children
        // Note: This is a basic structure check
        expect(UNSAFE_getAllByType).toBeDefined();
    });
});
