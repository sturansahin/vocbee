import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    ActivityIndicator
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import Feather from '@expo/vector-icons/Feather';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { FONT_FAMILY } from '../utils/typography';
import { VocabularyWord, Level } from '../services/vocabularyService';
import { getFavorites, removeFromFavorites } from '../services/favoritesService';

export default function FavoritesScreen() {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const insets = useSafeAreaInsets();
    const { colors, isDarkMode } = useTheme();

    const [favorites, setFavorites] = useState<(VocabularyWord & { level: Level })[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load favorites when screen is focused
    useFocusEffect(
        useCallback(() => {
            loadFavorites();
        }, [])
    );

    const loadFavorites = async () => {
        setIsLoading(true);
        try {
            const data = await getFavorites();
            setFavorites(data);
        } catch (error) {
            console.error('Error loading favorites:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemoveFavorite = async (wordId: number, level: Level) => {
        await removeFromFavorites(wordId, level);
        await loadFavorites(); // Reload list
    };

    const renderFavoriteItem = ({ item }: { item: VocabularyWord & { level: Level } }) => (
        <TouchableOpacity
            style={[styles.favoriteCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => navigation.navigate('ExampleSentences', {
                word: item.word,
                translation: item.translation,
                sentence1: item.sentence1,
                sentence2: item.sentence2,
                nativeSentence1: item.nativeSentence1,
                nativeSentence2: item.nativeSentence2
            })}
            activeOpacity={0.7}
        >
            <View style={styles.favoriteContent}>
                <View style={styles.favoriteText}>
                    <Text style={[styles.favoriteWord, { color: colors.text }]}>{item.word}</Text>
                    <View style={styles.translationRow}>
                        <MaterialIcons name="translate" size={16} color={colors.primary} />
                        <Text style={[styles.favoriteTranslation, { color: colors.primary }]}>{item.translation}</Text>
                    </View>
                </View>
                <TouchableOpacity
                    onPress={(e) => {
                        e.stopPropagation();
                        handleRemoveFavorite(item.id, item.level);
                    }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Feather name="trash-2" size={22} color={colors.textSecondary} />
                </TouchableOpacity>
            </View >
        </TouchableOpacity >
    );

    return (
        <View
            style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}
        >
            {/* Floating Back Button */}
            <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={[styles.backButton, { top: insets.top + 8 }]}
            >
                <FontAwesome5 name="arrow-left" size={24} color={colors.text} />
            </TouchableOpacity>

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerSpacer} />
                <Text style={[styles.headerTitle, { color: colors.text }]}>Favorites</Text>
                <View style={styles.headerSpacer} />
            </View>

            {/* Content */}
            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : favorites.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Feather name="star" size={64} color={colors.textSecondary} />
                    <Text style={[styles.emptyTitle, { color: colors.text }]}>No Favorites Yet</Text>
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                        Tap the star button while learning to save your favorite words here.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={favorites}
                    renderItem={renderFavoriteItem}
                    keyExtractor={(item) => `${item.id}_${item.level}`}
                    contentContainerStyle={styles.listContent}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 20,
    },
    backButton: {
        position: 'absolute',
        left: 20,
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    headerTitle: {
        fontFamily: FONT_FAMILY,
        fontSize: 22,
        letterSpacing: 2,
    },
    headerSpacer: {
        width: 32,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
        gap: 16,
    },
    emptyTitle: {
        fontFamily: FONT_FAMILY,
        fontSize: 24,
        marginTop: 16,
    },
    emptyText: {
        fontFamily: FONT_FAMILY,
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
    },
    listContent: {
        padding: 20,
        gap: 12,
    },
    favoriteCard: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 16,
    },
    favoriteContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    favoriteText: {
        flex: 1,
        gap: 4,
    },
    favoriteWord: {
        fontFamily: FONT_FAMILY,
        fontSize: 20,
        fontWeight: '600',
    },
    translationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    favoriteTranslation: {
        fontFamily: FONT_FAMILY,
        fontSize: 16,
    },
});
