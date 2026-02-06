// file: screens/__tests__/AuthScreens.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { LoginScreen, SignUpScreen } from '../AuthScreens';
import { ThemeProvider } from '../../context/ThemeContext';
import { AuthProvider } from '../../context/AuthContext';

// Mock contexts
jest.mock('../../context/ThemeContext', () => ({
    useTheme: () => ({
        colors: {
            background: '#FFFFFF',
            text: '#000000',
            primary: '#FFC814',
            border: '#E0E0E0',
            surface: '#F5F5F5',
            textSecondary: '#666666'
        },
        isDarkMode: false
    }),
    ThemeProvider: ({ children }) => children,
}));

// Mock AuthContext values
const mockSignIn = jest.fn();
const mockSignUp = jest.fn();

jest.mock('../../context/AuthContext', () => ({
    useAuth: () => ({
        signIn: mockSignIn,
        signUp: mockSignUp,
        signInWithGoogle: jest.fn(),
        signOut: jest.fn(),
        isLoading: false,
    }),
    AuthProvider: ({ children }) => children,
}));

// Mock Alert
jest.mock('../../components/CustomAlert', () => ({
    useAlert: () => ({
        showAlert: jest.fn(),
    }),
}));

describe('AuthScreens', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('LoginScreen', () => {
        it('renders email and password inputs', () => {
            const { getByText, getByPlaceholderText } = render(<LoginScreen />);

            expect(getByText('auth.email')).toBeTruthy(); // Using translation key mock
            expect(getByText('auth.password')).toBeTruthy();
            expect(getByPlaceholderText('auth.emailPlaceholder')).toBeTruthy();
        });

        it('validates empty inputs', () => {
            const { getByText } = render(<LoginScreen />);
            const loginButton = getByText('auth.logIn');

            fireEvent.press(loginButton);

            // Should show alert (mocked), but we can verify signIn wasn't called
            expect(mockSignIn).not.toHaveBeenCalled();
        });

        it('attempts login with valid credentials', async () => {
            const { getByText, getByPlaceholderText } = render(<LoginScreen />);

            fireEvent.changeText(getByPlaceholderText('auth.emailPlaceholder'), 'test@example.com');
            fireEvent.changeText(getByPlaceholderText('auth.passwordPlaceholder'), 'password123');

            const loginButton = getByText('auth.logIn');
            fireEvent.press(loginButton);

            // Since animation is involved, we might need to wait or verify the trigger.
            // The component starts animation then calls login.
            await waitFor(() => {
                expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
            });
        });
    });

    describe('SignUpScreen', () => {
        it('renders all signup fields', () => {
            const { getByText, getByPlaceholderText } = render(<SignUpScreen />);

            expect(getByText('auth.fullName')).toBeTruthy();
            expect(getByPlaceholderText('auth.enterEmail')).toBeTruthy(); // Adjusted to placeholder from component
        });

        it('calls signUp with valid data', async () => {
            const { getByText, getByPlaceholderText, getAllByPlaceholderText } = render(<SignUpScreen />);

            fireEvent.changeText(getByPlaceholderText('auth.namePlaceholder'), 'John Doe');
            fireEvent.changeText(getByPlaceholderText('auth.enterEmail'), 'new@example.com');

            // Handle potentially duplicate placeholders for password if any
            // Assuming unique placeholders:
            fireEvent.changeText(getByPlaceholderText('auth.createPassword'), 'pass123456');
            fireEvent.changeText(getByPlaceholderText('auth.confirmPasswordPlaceholder'), 'pass123456');

            fireEvent.press(getByText('auth.signUp'));

            await waitFor(() => {
                expect(mockSignUp).toHaveBeenCalledWith('new@example.com', 'pass123456', 'John Doe');
            });
        });
    });
});
