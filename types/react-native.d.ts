import 'react-native';

// Fix React Native 0.74 type issues with ref and key props
declare module 'react-native' {
    interface ViewProps {
        key?: string | number;
    }
    interface ScrollViewProps {
        ref?: React.Ref<any>;
    }
    interface TextProps {
        key?: string | number;
    }
    interface TouchableOpacityProps {
        key?: string | number;
    }
}
