import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    Animated,
    PanResponder
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { FONT_FAMILY } from '../utils/typography';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

// Sample flashcard data
const SAMPLE_CARDS = [
    { id: 1, word: 'Serendipity', pronunciation: '/ˌser.ənˈdɪp.ə.ti/' },
    { id: 2, word: 'Ephemeral', pronunciation: '/ɪˈfem.ər.əl/' },
    { id: 3, word: 'Eloquent', pronunciation: '/ˈel.ə.kwənt/' },
    { id: 4, word: 'Resilience', pronunciation: '/rɪˈzɪl.jəns/' },
    { id: 5, word: 'Ubiquitous', pronunciation: '/juːˈbɪk.wɪ.təs/' },
];

export default function FlashcardScreen() {
    const insets = useSafeAreaInsets();
    const { colors, isDarkMode } = useTheme();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [cards] = useState(SAMPLE_CARDS);

    const position = useRef(new Animated.ValueXY()).current;
    const rotate = position.x.interpolate({
        inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
        outputRange: ['-15deg', '0deg', '15deg'],
        extrapolate: 'clamp',
    });

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderMove: (_, gesture) => {
                position.setValue({ x: gesture.dx, y: gesture.dy * 0.3 });
            },
            onPanResponderRelease: (_, gesture) => {
                if (gesture.dx > SWIPE_THRESHOLD) {
                    swipeCard('right');
                } else if (gesture.dx < -SWIPE_THRESHOLD) {
                    swipeCard('left');
                } else {
                    resetPosition();
                }
            },
        })
    ).current;

    const swipeCard = (direction: 'left' | 'right') => {
        const x = direction === 'right' ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5;
        Animated.timing(position, {
            toValue: { x, y: 0 },
            duration: 300,
            useNativeDriver: false,
        }).start(() => {
            position.setValue({ x: 0, y: 0 });
            setCurrentIndex((prev) => (prev + 1) % cards.length);
        });
    };

    const resetPosition = () => {
        Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
            friction: 5,
        }).start();
    };

    // Render a single card
    const renderTopCard = (card: typeof SAMPLE_CARDS[0]) => {
        return (
            <Animated.View
                key={`top-${card.id}`}
                style={[
                    styles.cardContainer,
                    {
                        transform: [
                            { translateX: position.x },
                            { translateY: position.y },
                            { rotate },
                        ],
                        zIndex: 10,
                    },
                ]}
                {...panResponder.panHandlers}
            >
                <View style={[
                    styles.card,
                    {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                    }
                ]}>
                    {/* Skip Overlay - Full card background (behind text) */}
                    <Animated.View
                        style={[
                            styles.swipeOverlay,
                            {
                                backgroundColor: '#fca8a8ff',
                                borderColor: '#fca8a8ff',
                                opacity: position.x.interpolate({
                                    inputRange: [-SWIPE_THRESHOLD, 0],
                                    outputRange: [1, 0],
                                    extrapolate: 'clamp',
                                }),
                            },
                        ]}
                    >
                        <View style={styles.swipeLabelContainer}>
                            <MaterialIcons name="close" size={48} color="#ff6b6b" />
                            <Text style={styles.skipText}>SKIP</Text>
                        </View>
                    </Animated.View>

                    {/* Learned Overlay - Full card background (behind text) */}
                    <Animated.View
                        style={[
                            styles.swipeOverlay,
                            {
                                backgroundColor: '#98f5c7ff',
                                borderColor: '#98f5c7ff',
                                opacity: position.x.interpolate({
                                    inputRange: [0, SWIPE_THRESHOLD],
                                    outputRange: [0, 1],
                                    extrapolate: 'clamp',
                                }),
                            },
                        ]}
                    >
                        <View style={styles.swipeLabelContainer}>
                            <MaterialIcons name="check" size={48} color={colors.primary} />
                            <Text style={styles.learnedText}>LEARNED</Text>
                        </View>
                    </Animated.View>


                    {/* Word and pronunciation - above overlay */}
                    <View style={styles.cardCenterAbove}>
                        <Text style={[styles.wordText, { color: colors.text }]}>{card.word}</Text>
                        <Text style={[styles.pronunciationText, { color: colors.primary }]}>{card.pronunciation}</Text>
                    </View>
                </View>
            </Animated.View>
        );
    };

    // Render background cards (static, no animation, no buttons)
    const renderBackgroundCard = (card: typeof SAMPLE_CARDS[0], stackPosition: number) => {
        const scale = 1 - (stackPosition * 0.05);
        const translateY = stackPosition * 12;

        return (
            <View
                key={`bg-${card.id}-${stackPosition}`}
                style={[
                    styles.cardContainer,
                    {
                        transform: [
                            { scale },
                            { translateY },
                        ],
                        zIndex: 5 - stackPosition,
                        opacity: 1 - (stackPosition * 0.2),
                    },
                ]}
            >
                <View style={[
                    styles.cardNoShadow,
                    {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                    }
                ]}>
                    <View style={styles.cardCenterFull}>
                        <Text style={[styles.wordText, { color: colors.text }]}>{card.word}</Text>
                        <Text style={[styles.pronunciationText, { color: colors.primary }]}>{card.pronunciation}</Text>
                    </View>
                </View>
            </View>
        );
    };

    const topCard = cards[currentIndex % cards.length];
    const secondCard = cards[(currentIndex + 1) % cards.length];

    return (
        <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
            {/* Header - Only Title */}
            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: colors.primary }]}>VOCFLASH</Text>
            </View>

            {/* Card Stack - Only 2 cards visible */}
            <View style={styles.cardArea}>
                {renderBackgroundCard(secondCard, 1)}
                {renderTopCard(topCard)}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        letterSpacing: 6,
    },
    cardArea: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    cardContainer: {
        position: 'absolute',
        width: SCREEN_WIDTH - 40,
        height: SCREEN_HEIGHT * 0.6,
    },
    card: {
        flex: 1,
        borderRadius: 32,
        padding: 24,
        justifyContent: 'center',
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    cardNoShadow: {
        flex: 1,
        borderRadius: 32,
        padding: 24,
        justifyContent: 'center',
        borderWidth: 1,
    },
    cardCenter: {
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
    },
    cardCenterAbove: {
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
        zIndex: 200,
    },
    cardCenterFull: {
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
    },
    wordText: {
        fontFamily: FONT_FAMILY,
        fontSize: 40,
        marginBottom: 12,
        letterSpacing: 1,
        textAlign: 'center',
    },
    pronunciationText: {
        fontFamily: FONT_FAMILY,
        fontSize: 18,
        fontWeight: '300',
        letterSpacing: 1,
    },
    cardActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
        paddingBottom: 8,
    },
    cardSkipButton: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#ea8484ff',
        borderWidth: 2,
        borderColor: '#eebabaff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardLearnedButton: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#75e8a3ff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    swipeOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 32,
        borderWidth: 4,
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: 40,
        zIndex: 1,
    },
    swipeLabelContainer: {
        alignItems: 'center',
        gap: 8,
    },
    skipText: {
        fontFamily: FONT_FAMILY,
        color: '#ea8484ff',
        fontSize: 20,
        letterSpacing: 4,
    },
    learnedText: {
        fontFamily: FONT_FAMILY,
        color: '#75e8a3ff',

        fontSize: 20,
        letterSpacing: 4,
    },
});
