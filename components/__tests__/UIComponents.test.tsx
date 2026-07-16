// file: components/__tests__/UIComponents.test.tsx
import React, { ReactNode } from 'react';
import { render, fireEvent, RenderOptions } from '@testing-library/react-native';
import { Button, Input, Header } from '../UIComponents';
import { ThemeProvider } from '../../context/ThemeContext';

// Custom render function with ThemeProvider wrapper
const renderWithTheme = (ui: React.ReactElement, options?: Omit<RenderOptions, 'wrapper'>) => {
    const Wrapper = ({ children }: { children: ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
    );
    return render(ui, { wrapper: Wrapper, ...options });
};

describe('UIComponents', () => {
    describe('Button', () => {
        it('renders correctly with title', () => {
            const { getByText } = renderWithTheme(<Button title="Test Button" onPress={() => { }} />);
            expect(getByText('Test Button')).toBeTruthy();
        });

        it('calls onPress when pressed', () => {
            const onPressMock = jest.fn();
            const { getByText } = renderWithTheme(<Button title="Press Me" onPress={onPressMock} />);

            fireEvent.press(getByText('Press Me'));
            expect(onPressMock).toHaveBeenCalledTimes(1);
        });

        it('renders disabled state', () => {
            const { getByText } = renderWithTheme(<Button title="Disabled" onPress={() => { }} disabled />);
            const buttonText = getByText('Disabled');
            expect(buttonText).toBeTruthy();
        });

        it('renders with outline variant', () => {
            const { getByText } = renderWithTheme(
                <Button title="Outline Button" onPress={() => { }} variant="outline" />
            );
            expect(getByText('Outline Button')).toBeTruthy();
        });

        it('renders with ghost variant', () => {
            const { getByText } = renderWithTheme(
                <Button title="Ghost Button" onPress={() => { }} variant="ghost" />
            );
            expect(getByText('Ghost Button')).toBeTruthy();
        });

        it('renders with icon', () => {
            const { getByText } = renderWithTheme(
                <Button title="With Icon" onPress={() => { }} icon="add" />
            );
            expect(getByText('With Icon')).toBeTruthy();
        });

        it('renders without fullWidth', () => {
            const { getByText } = renderWithTheme(
                <Button title="Not Full" onPress={() => { }} fullWidth={false} />
            );
            expect(getByText('Not Full')).toBeTruthy();
        });

        it('does not call onPress when disabled', () => {
            const onPressMock = jest.fn();
            const { getByText } = renderWithTheme(
                <Button title="Disabled" onPress={onPressMock} disabled />
            );
            
            fireEvent.press(getByText('Disabled'));
            expect(onPressMock).not.toHaveBeenCalled();
        });
    });

    describe('Input', () => {
        it('renders with label and placeholder', () => {
            const { getByText, getByPlaceholderText } = renderWithTheme(
                <Input label="Email" placeholder="Enter email" />
            );
            expect(getByText('Email')).toBeTruthy();
            expect(getByPlaceholderText('Enter email')).toBeTruthy();
        });

        it('handles text input', () => {
            const onChangeTextMock = jest.fn();
            const { getByPlaceholderText } = renderWithTheme(
                <Input placeholder="Type here" onChangeText={onChangeTextMock} />
            );

            fireEvent.changeText(getByPlaceholderText('Type here'), 'Hello');
            expect(onChangeTextMock).toHaveBeenCalledWith('Hello');
        });

        it('renders right icon and handles press', () => {
            const onRightIconPressMock = jest.fn();
            const { getByPlaceholderText } = renderWithTheme(
                <Input placeholder="Password" rightIcon="visibility" onRightIconPress={onRightIconPressMock} />
            );
            expect(getByPlaceholderText('Password')).toBeTruthy();
        });

        it('renders with left icon', () => {
            const { getByPlaceholderText } = renderWithTheme(
                <Input placeholder="Search" icon="search" />
            );
            expect(getByPlaceholderText('Search')).toBeTruthy();
        });

        it('renders without label', () => {
            const { getByPlaceholderText } = renderWithTheme(
                <Input placeholder="No Label Input" />
            );
            expect(getByPlaceholderText('No Label Input')).toBeTruthy();
        });

        it('renders with custom colors', () => {
            const { getByPlaceholderText } = renderWithTheme(
                <Input 
                    placeholder="Custom Colors"
                    backgroundColor="#FF0000"
                    borderColor="#00FF00"
                    labelColor="#0000FF"
                    textColor="#FFFFFF"
                    iconColor="#FFFF00"
                />
            );
            expect(getByPlaceholderText('Custom Colors')).toBeTruthy();
        });

        it('renders with secureTextEntry', () => {
            const { getByPlaceholderText } = renderWithTheme(
                <Input placeholder="Password" secureTextEntry />
            );
            expect(getByPlaceholderText('Password')).toBeTruthy();
        });
    });

    describe('Header', () => {
        it('renders title and subtitle', () => {
            const { getByText } = renderWithTheme(<Header title="Main Title" subtitle="Sub Title" />);
            expect(getByText('Main Title')).toBeTruthy();
            expect(getByText('Sub Title')).toBeTruthy();
        });

        it('renders back button when showBack is true', () => {
            const onBackMock = jest.fn();
            const { toJSON } = renderWithTheme(<Header showBack onBack={onBackMock} />);
            expect(toJSON()).toBeTruthy();
        });

        it('renders without title', () => {
            const { toJSON } = renderWithTheme(<Header subtitle="Only Subtitle" />);
            expect(toJSON()).toBeTruthy();
        });

        it('renders with rightAction', () => {
            const { getByText } = renderWithTheme(
                <Header title="With Action" rightAction={<></>} />
            );
            expect(getByText('With Action')).toBeTruthy();
        });

        it('renders with custom colors', () => {
            const { getByText } = renderWithTheme(
                <Header 
                    title="Custom Header"
                    backgroundColor="#FF0000"
                    textColor="#FFFFFF"
                />
            );
            expect(getByText('Custom Header')).toBeTruthy();
        });

        it('renders placeholder when showBack is false', () => {
            const { toJSON } = renderWithTheme(<Header title="No Back" />);
            expect(toJSON()).toBeTruthy();
        });
    });
});
