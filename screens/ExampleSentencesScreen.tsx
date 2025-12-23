import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { FONT_FAMILY } from '../utils/typography';

export default function ExampleSentencesScreen() {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { colors, isDarkMode } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]}
            >
                {/* Title Section */}
                <View style={styles.titleSection}>
                    <Text style={[styles.wordTitle, { color: colors.text }]}>Serendipity</Text>
                    <View style={styles.pronunciationRow}>
                        <MaterialIcons name="graphic-eq" size={16} color={colors.primary} />
                        <Text style={[styles.pronunciation, { color: colors.primary }]}>/ˌserənˈdipədē/</Text>
                    </View>
                    <Text style={[styles.definition, { color: colors.textSecondary }]}>
                        The occurrence and development of events by chance in a happy or beneficial way.
                    </Text>
                </View>

                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                {/* Examples List */}
                <View style={styles.examplesSection}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Example Sentences</Text>

                    <View style={styles.examplesList}>
                        {/* Item 1 */}
                        <View style={[styles.exampleCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <Text style={[styles.exampleText, { color: colors.text }]}>
                                It was pure <Text style={[styles.highlightWord, { color: colors.primary }]}>serendipity</Text> that we met at the coffee shop right before the rain started.
                            </Text>
                            <View style={[styles.exampleDivider, { backgroundColor: colors.border }]} />
                            <Text style={[styles.translationText, { color: colors.textSecondary }]}>
                                Tamamen şans eseri yağmur başlamadan hemen önce kahve dükkanında karşılaştık.
                            </Text>
                        </View>

                        {/* Item 2 */}
                        <View style={[styles.exampleCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <Text style={[styles.exampleText, { color: colors.text }]}>
                                Many scientific discoveries are a result of <Text style={[styles.highlightWord, { color: colors.primary }]}>serendipity</Text> and hard work.
                            </Text>
                            <View style={[styles.exampleDivider, { backgroundColor: colors.border }]} />
                            <Text style={[styles.translationText, { color: colors.textSecondary }]}>
                                Birçok bilimsel keşif, mutlu tesadüflerin ve sıkı çalışmanın bir sonucudur.
                            </Text>
                        </View>


                    </View>
                </View>

                {/* AI Assistant Promo */}
                <View style={styles.aiSection}>
                    <View style={[styles.aiCard, { backgroundColor: colors.surface, borderColor: `${colors.primary}33` }]}>
                        <View style={[styles.aiGlow, { backgroundColor: `${colors.primary}1a` }]} />

                        <View style={styles.aiHeader}>
                            <View style={[styles.aiIcon, { backgroundColor: colors.primary }]}>
                                <MaterialIcons name="smart-toy" size={24} color={colors.background} />
                            </View>
                            <View>
                                <Text style={[styles.aiTitle, { color: colors.text }]}>VocBee AI Assistant</Text>
                                <Text style={[styles.aiSubtitle, { color: colors.primary }]}>Ask about usage, nuance, or similar words.</Text>
                            </View>
                        </View>

                        <TouchableOpacity style={[styles.aiInput, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderColor: colors.border }]}>
                            <Text style={[styles.aiInputText, { color: colors.textSecondary }]}>Ask a question about this word...</Text>
                            <View style={[styles.aiSendButton, { backgroundColor: `${colors.primary}33` }]}>
                                <MaterialIcons name="arrow-upward" size={14} color={colors.primary} />
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

            </ScrollView>

            {/* Floating Back Button */}
            <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={[styles.backButton, { top: insets.top + 8 }]}
            >
                <FontAwesome5 name="arrow-left" size={24} color={colors.text} />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 8,
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
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    topBarRight: {
        flexDirection: 'row',
        gap: 12,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: 8,
        paddingBottom: 40,
    },
    titleSection: {
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 24,
    },
    wordTitle: {
        fontFamily: FONT_FAMILY,
        color: '#fff',
        fontSize: 36,
        marginBottom: 8,
    },
    pronunciationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    pronunciation: {
        fontFamily: FONT_FAMILY,
        fontSize: 18,
        fontWeight: '500',
    },
    definition: {
        fontFamily: FONT_FAMILY,
        color: '#d1d5db',
        textAlign: 'center',
        fontSize: 16,
        lineHeight: 24,
        maxWidth: 280,
    },
    badges: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 24,
    },
    badgeDark: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: '#1a2c22',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    badgeTextDark: {
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        color: '#9ca3af',
    },
    badgeGreen: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.2)',
    },
    badgeTextGreen: {
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        color: '#FFD700',
    },
    divider: {
        width: '85%',
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignSelf: 'center',
        marginBottom: 32,
    },
    examplesSection: {
        paddingHorizontal: 24,
        marginBottom: 16,
    },
    sectionTitle: {
        fontFamily: FONT_FAMILY,
        color: '#fff',
        fontSize: 20,
        marginBottom: 16,
    },
    examplesList: {
        gap: 16,
    },
    exampleCard: {
        padding: 20,
        borderRadius: 12,
        borderWidth: 1,
    },
    exampleText: {
        fontFamily: FONT_FAMILY,
        color: '#e5e7eb',
        fontSize: 16,
        lineHeight: 24,
        marginBottom: 16,
    },
    highlightWord: {
        fontWeight: 'bold',
    },
    exampleDivider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        width: '100%',
        marginBottom: 12,
    },
    translationRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    translationText: {
        color: '#9ca3af',
        fontSize: 14,
        fontStyle: 'italic',
        flex: 1,
        marginRight: 16,
    },
    aiSection: {
        marginHorizontal: 24,
        marginTop: 16,
    },
    aiCard: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 20,
        overflow: 'hidden',
        position: 'relative',
    },
    aiGlow: {
        position: 'absolute',
        right: -16,
        top: -16,
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
    },
    aiHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },
    aiIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    aiTitle: {
        color: '#fff',
        fontWeight: 'bold',
    },
    aiSubtitle: {
        color: 'rgba(255, 215, 0, 0.8)',
        fontSize: 12,
    },
    aiInput: {
        width: '100%',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    aiInputText: {
        color: '#9ca3af',
        fontSize: 14,
    },
    aiSendButton: {
        backgroundColor: 'rgba(255, 215, 0, 0.2)',
        borderRadius: 12,
        padding: 4,
    },
});
