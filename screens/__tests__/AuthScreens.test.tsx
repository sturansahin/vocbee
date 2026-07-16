// file: screens/__tests__/AuthScreens.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { LoginScreen } from '../../src/features/auth/presentation/screens/LoginScreen';
import { SignUpScreen } from '../../src/features/auth/presentation/screens/SignUpScreen';

const mockNavigate = jest.fn();
const mockShowAlert = jest.fn();

jest.mock('@react-navigation/native', () => {
    const actualNav = jest.requireActual('@react-navigation/native');
    return {
        ...actualNav,
        useNavigation: () => ({
            navigate: mockNavigate,
            goBack: jest.fn(),
            setOptions: jest.fn(),
        }),
    };
});

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
    ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock AuthContext values
const mockSignIn = jest.fn();
const mockSignUp = jest.fn();
const mockSignInWithGoogle = jest.fn();
const mockSignInWithApple = jest.fn();
const mockSignOut = jest.fn();

jest.mock('../../src/features/auth/presentation/AuthProvider', () => ({
    useAuth: () => ({
        signIn: mockSignIn,
        signUp: mockSignUp,
        signInWithGoogle: mockSignInWithGoogle,
        signInWithApple: mockSignInWithApple,
        signOut: mockSignOut,
        isLoading: false,
    }),
    AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock Alert
jest.mock('../../components/CustomAlert', () => ({
    useAlert: () => ({
        showAlert: mockShowAlert,
    }),
}));

describe('AuthScreens', () => {
    const authPresentationGateway = {
        openPrivacyPolicy: jest.fn(async () => undefined),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockSignIn.mockResolvedValue({ setupCompleted: true });
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

        it('navigates to main app after successful social login', async () => {
            mockSignInWithGoogle.mockResolvedValue({ setupCompleted: true });

            const { getByText } = render(<LoginScreen />);

            fireEvent.press(getByText('auth.google'));

            await waitFor(() => {
                expect(mockSignInWithGoogle).toHaveBeenCalled();
                expect(mockNavigate).toHaveBeenCalledWith('MainTabs');
            });
        });
    });

    describe('SignUpScreen', () => {
        it('renders all signup fields', () => {
            const { getByText, getByPlaceholderText } = render(
                <SignUpScreen gateway={authPresentationGateway} />
            );

            expect(getByText('auth.fullName')).toBeTruthy();
            expect(getByPlaceholderText('auth.enterEmail')).toBeTruthy(); // Adjusted to placeholder from component
        });

        it('does not call signUp before privacy policy is accepted', async () => {
            const { getByText, getByPlaceholderText } = render(
                <SignUpScreen gateway={authPresentationGateway} />
            );

            fireEvent.changeText(getByPlaceholderText('auth.namePlaceholder'), 'John Doe');
            fireEvent.changeText(getByPlaceholderText('auth.enterEmail'), 'new@example.com');
            fireEvent.changeText(getByPlaceholderText('auth.createPassword'), 'pass123456');
            fireEvent.changeText(getByPlaceholderText('auth.confirmPasswordPlaceholder'), 'pass123456');

            fireEvent.press(getByText('auth.signUp'));

            await waitFor(() => {
                expect(mockSignUp).not.toHaveBeenCalled();
            });
        });

        it('calls signUp with valid data', async () => {
            const { getByText, getByPlaceholderText, getByTestId } = render(
                <SignUpScreen gateway={authPresentationGateway} />
            );

            fireEvent.changeText(getByPlaceholderText('auth.namePlaceholder'), 'John Doe');
            fireEvent.changeText(getByPlaceholderText('auth.enterEmail'), 'new@example.com');

            fireEvent.changeText(getByPlaceholderText('auth.createPassword'), 'pass123456');
            fireEvent.changeText(getByPlaceholderText('auth.confirmPasswordPlaceholder'), 'pass123456');
            fireEvent.press(getByTestId('privacy-consent-checkbox'));

            fireEvent.press(getByText('auth.signUp'));

            await waitFor(() => {
                expect(mockSignUp).toHaveBeenCalledWith('new@example.com', 'pass123456', 'John Doe');
            });
        });
    });
});
