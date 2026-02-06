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
