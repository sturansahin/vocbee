import 'react-native-gesture-handler/jestSetup';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
    require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock Expo modules
jest.mock('expo-font', () => ({
    loadAsync: jest.fn(),
    isLoaded: jest.fn(() => true),
}));

jest.mock('expo-asset', () => ({
    Asset: {
        fromModule: jest.fn(() => ({
            downloadAsync: jest.fn(),
            localUri: 'mock-uri',
            uri: 'mock-uri'
        })),
    },
}));

jest.mock('expo-constants', () => ({
    manifest: { extra: {} },
}));

jest.mock('expo-speech', () => ({
    speak: jest.fn(),
    stop: jest.fn(),
}));

jest.mock('expo-tracking-transparency', () => ({
    PermissionStatus: {
        GRANTED: 'granted',
        UNDETERMINED: 'undetermined',
        DENIED: 'denied',
    },
    getTrackingPermissionsAsync: jest.fn(async () => ({
        status: 'granted',
        granted: true,
        canAskAgain: true,
        expires: 'never',
    })),
    requestTrackingPermissionsAsync: jest.fn(async () => ({
        status: 'granted',
        granted: true,
        canAskAgain: true,
        expires: 'never',
    })),
    isAvailable: jest.fn(() => true),
}));


jest.mock('expo-linear-gradient', () => ({
    LinearGradient: 'LinearGradient'
}));

jest.mock('expo-blur', () => ({
    BlurView: 'BlurView'
}));

// Mock React Navigation
jest.mock('@react-navigation/native', () => {
    const actualNav = jest.requireActual('@react-navigation/native');
    return {
        ...actualNav,
        useNavigation: () => ({
            navigate: jest.fn(),
            goBack: jest.fn(),
            setOptions: jest.fn(),
        }),
        useFocusEffect: jest.fn((callback) => callback()),
    };
});

// Mock i18next
jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key) => key,
        i18n: {
            changeLanguage: jest.fn(),
            language: 'en'
        },
    }),
    initReactI18next: {
        type: '3rdParty',
        init: jest.fn(),
    },
}));

// Mock Lottie
jest.mock('lottie-react-native', () => 'LottieView');

// Mock Vector Icons
jest.mock('@expo/vector-icons', () => ({
    MaterialIcons: 'MaterialIcons',
    FontAwesome5: 'FontAwesome5',
    Feather: 'Feather',
    Ionicons: 'Ionicons',
    AntDesign: 'AntDesign',
}));

// Mock Ads
jest.mock('react-native-google-mobile-ads', () => ({
    BannerAd: 'BannerAd',
    BannerAdSize: {},
    TestIds: {},
}));

jest.mock('react-native-purchases', () => ({
    __esModule: true,
    default: {
        configure: jest.fn(),
        setLogLevel: jest.fn(() => Promise.resolve()),
        getCustomerInfo: jest.fn(() => Promise.resolve({
            entitlements: { active: {}, all: {} },
        })),
        logIn: jest.fn(() => Promise.resolve({
            customerInfo: { entitlements: { active: {}, all: {} } },
            created: false,
        })),
        restorePurchases: jest.fn(() => Promise.resolve({
            entitlements: { active: {}, all: {} },
        })),
        setAttributes: jest.fn(() => Promise.resolve()),
        setEmail: jest.fn(() => Promise.resolve()),
        setDisplayName: jest.fn(() => Promise.resolve()),
        addCustomerInfoUpdateListener: jest.fn(),
        removeCustomerInfoUpdateListener: jest.fn(() => true),
    },
    LOG_LEVEL: {
        DEBUG: 'DEBUG',
        WARN: 'WARN',
    },
}));

jest.mock('react-native-purchases-ui', () => ({
    __esModule: true,
    default: {
        presentPaywallIfNeeded: jest.fn(() => Promise.resolve('CANCELLED')),
        presentCustomerCenter: jest.fn(() => Promise.resolve()),
    },
    PAYWALL_RESULT: {
        NOT_PRESENTED: 'NOT_PRESENTED',
        ERROR: 'ERROR',
        CANCELLED: 'CANCELLED',
        PURCHASED: 'PURCHASED',
        RESTORED: 'RESTORED',
    },
}));
