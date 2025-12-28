import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
  Platform,
  Image
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { RootStackParamList } from '../types';
import { Button } from '../components/UIComponents';
import { MaterialIcons } from '@expo/vector-icons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { LANGUAGES, LEVELS, COLORS } from '../constants';
import { useTheme } from '../context/ThemeContext';
import { FONT_FAMILY } from '../utils/typography';
import { generateVocabulary, getFirstLevelForUserLevel } from '../services/vocabularyService';
import { setCurrentLevel } from '../services/progressService';

type SetupNavProp = StackNavigationProp<RootStackParamList>;
type SetupRouteProp = RouteProp<RootStackParamList, 'NativeLanguage'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Unified Setup Screen with Steps
export const SetupScreen = () => {
  const navigation = useNavigation<SetupNavProp>();
  const route = useRoute<SetupRouteProp>();
  const { colors, isDarkMode } = useTheme();
  const [currentStep, setCurrentStep] = useState(1);
  const [nativeLanguage, setNativeLanguage] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('');
  const [level, setLevel] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Animated values
  const progressAnim = useRef(new Animated.Value(33.33)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const totalSteps = 3;

  // Handle detected level from quiz
  useEffect(() => {
    if (route.params?.detectedLevel) {
      setLevel(route.params.detectedLevel);
      setCurrentStep(3); // Navigate to level selection step
    }
  }, [route.params?.detectedLevel]);

  // Animate progress bar when step changes
  useEffect(() => {
    const targetProgress = (currentStep / totalSteps) * 100;
    Animated.spring(progressAnim, {
      toValue: targetProgress,
      useNativeDriver: false,
      friction: 8,
      tension: 40,
    }).start();
  }, [currentStep]);

  const goToStep = (newStep: number) => {
    // Fade out, then change step, then fade in
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentStep(newStep);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleNext = async () => {
    if (currentStep < totalSteps) {
      goToStep(currentStep + 1);
    } else {
      // Final step - save settings, generate vocabulary and navigate to main app
      setIsGenerating(true);
      try {
        // Save user level to AsyncStorage
        await AsyncStorage.setItem('@user_level', level);

        // Get initial level based on user selection
        const initialLevel = getFirstLevelForUserLevel(level);

        // Save preferences and progress to Firestore
        const currentUser = auth.currentUser;
        if (currentUser) {
          const userRef = doc(db, 'users', currentUser.uid);
          await setDoc(userRef, {
            setupCompleted: true,
            preferences: {
              nativeLanguage: nativeLanguage,
              targetLanguage: targetLanguage,
              level: level,
            },
            progress: {
              currentLevel: initialLevel,
              learnedWords: {},
              skippedWords: {},
              lastSync: serverTimestamp(),
            },
          }, { merge: true });
          console.log('Saved preferences to Firestore');
        }

        // Generate vocabulary for selected language pair
        await generateVocabulary(nativeLanguage, targetLanguage);

        // Set initial level
        await setCurrentLevel(initialLevel);

        console.log(`Vocabulary generated: ${nativeLanguage} -> ${targetLanguage}, starting at ${initialLevel}`);
      } catch (error) {
        console.error('Error saving settings:', error);
      } finally {
        setIsGenerating(false);
      }
      navigation.navigate('MainTabs');
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      goToStep(currentStep - 1);
    } else {
      navigation.goBack();
    }
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  // Get step content
  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return { white: "What's your", green: "native language?" };
      case 2: return { white: "I want to learn", green: "this language..." };
      case 3: return { white: "What's your", green: "current level?" };
      default: return { white: "", green: "" };
    }
  };

  const getStepSubtitle = () => {
    switch (currentStep) {
      case 1: return "We'll use this to translate words for you.";
      case 2: return "Select the language you want to master.";
      case 3: return "Choose the level that best describes your proficiency.";
      default: return "";
    }
  };

  const getButtonTitle = () => {
    switch (currentStep) {
      case 1: return "Continue";
      case 2: return "Continue";
      case 3: return "Start Learning";
      default: return "Continue";
    }
  };

  const renderStep1Content = () => (
    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
      <View style={styles.languageList}>
        {LANGUAGES.map((lang) => (
          <TouchableOpacity
            key={lang.id}
            onPress={() => setNativeLanguage(lang.id)}
            style={[
              styles.languageItem,
              { backgroundColor: colors.surface, borderColor: colors.border },
              nativeLanguage === lang.id && [styles.languageItemSelected, { borderColor: colors.primary }]
            ]}
          >
            <Image
              source={lang.flagIcon}
              style={{ width: 32, height: 32, borderRadius: 4 }}
              resizeMode="contain"
            />
            <View style={styles.languageInfo}>
              <Text style={[styles.languageName, { color: colors.text }]}>{lang.name}</Text>
              <Text style={[styles.languageNative, { color: colors.textSecondary }]}>{lang.nativeName}</Text>
            </View>
            {nativeLanguage === lang.id && (
              <View style={[styles.checkCircle, { backgroundColor: colors.primary }]}>
                <MaterialIcons name="check" size={16} color={colors.background} />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  const renderStep2Content = () => (
    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
      <View style={styles.languageList}>
        {LANGUAGES.filter(l => l.id !== nativeLanguage).map((lang) => (
          <TouchableOpacity
            key={lang.id}
            onPress={() => setTargetLanguage(lang.id)}
            style={[
              styles.languageItem,
              { backgroundColor: colors.surface, borderColor: colors.border },
              targetLanguage === lang.id && [styles.languageItemSelected, { borderColor: colors.primary }]
            ]}
          >
            <Image
              source={lang.flagIcon}
              style={{ width: 32, height: 32, borderRadius: 4 }}
              resizeMode="contain"
            />
            <View style={styles.languageInfo}>
              <Text style={[styles.languageName, { color: colors.text }]}>{lang.name}</Text>
              <Text style={[styles.languageNative, { color: colors.textSecondary }]}>{lang.nativeName}</Text>
            </View>
            {targetLanguage === lang.id && (
              <View style={[styles.checkCircle, { backgroundColor: colors.primary }]}>
                <MaterialIcons name="check" size={16} color={colors.background} />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  const renderStep3Content = () => (
    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
      <View style={styles.levelList}>
        {LEVELS.map((lvl) => (
          <TouchableOpacity
            key={lvl.id}
            onPress={() => setLevel(lvl.id)}
            style={[
              styles.levelItem,
              { backgroundColor: colors.surface, borderColor: colors.border },
              level === lvl.id && [styles.levelItemSelected, { borderColor: colors.primary }]
            ]}
          >
            <View style={styles.levelRow}>
              <View style={[
                styles.levelRadio,
                { borderColor: colors.border },
                level === lvl.id && [styles.levelRadioSelected, { borderColor: colors.primary }]
              ]}>
                {level === lvl.id && <View style={[styles.levelRadioInner, { backgroundColor: colors.primary }]} />}
              </View>
              <View style={styles.levelContent}>
                <View style={styles.levelHeader}>
                  <Text style={[styles.levelTitle, { color: colors.text }]}>{lvl.title}</Text>
                  <View style={[styles.levelBadge, { backgroundColor: `${colors.primary}33` }]}>
                    <Text style={[styles.levelRange, { color: colors.primary }]}>{lvl.range}</Text>
                  </View>
                </View>
                <Text style={[styles.levelDesc, { color: colors.textSecondary }]}>{lvl.description}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.testLink}
        onPress={() => navigation.navigate('LevelTest')}
      >
        <MaterialIcons name="quiz" size={20} color={colors.textSecondary} />
        <Text style={[styles.testLinkText, { color: colors.textSecondary }]}>Don't know your level? Take a min test</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const stepTitle = getStepTitle();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header with animated progress */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <FontAwesome5 name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.progressWrapper}>
          <View style={[styles.progressBg, { backgroundColor: colors.surfaceLight }]}>
            <Animated.View style={[styles.progressFill, { width: progressWidth, backgroundColor: colors.primary }]} />
          </View>
        </View>

        <View style={styles.headerSpacer} />
      </View>

      {/* Content with fade animation */}
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <Text style={[styles.titleWhite, { color: colors.text }]}>{stepTitle.white}</Text>
        <Text style={[styles.titleGreen, { color: colors.primary }]}>{stepTitle.green}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{getStepSubtitle()}</Text>

        {currentStep === 1 && renderStep1Content()}
        {currentStep === 2 && renderStep2Content()}
        {currentStep === 3 && renderStep3Content()}
      </Animated.View>

      {/* Button stays fixed - no animation */}
      <View style={[styles.bottomButton, { paddingBottom: insets.bottom + 16 }]}>
        <Button
          title={currentStep === 3 ? "Start Learning" : "Continue"}
          onPress={handleNext}
          disabled={
            (currentStep === 1 && !nativeLanguage) ||
            (currentStep === 2 && !targetLanguage) ||
            (currentStep === 3 && !level)
          }
        />
      </View>
    </View>
  );
};

// Export individual screens for backward compatibility (they now redirect to SetupScreen)
export const NativeLanguageScreen = SetupScreen;
export const TargetLanguageScreen = SetupScreen;
export const LevelSelectionScreen = SetupScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Header & Progress
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  progressBg: {
    height: 6,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 3,
    width: '100%',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  progressText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
  },
  headerSpacer: {
    width: 44,
  },

  // Content
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  titleWhite: {
    fontFamily: FONT_FAMILY,
    color: '#fff',
    fontSize: 28,
  },
  titleGreen: {
    fontFamily: FONT_FAMILY,
    color: COLORS.primary,
    fontSize: 28,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: FONT_FAMILY,
    color: COLORS.textSecondary,
    fontSize: 16,
    marginBottom: 24,
    lineHeight: 22,
  },

  // Language List
  scrollView: {
    flex: 1,
  },
  languageList: {
    gap: 12,
    paddingBottom: 100,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  languageItemSelected: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  flag: {
    fontSize: 28,
    marginRight: 16,
  },
  languageInfo: {
    flex: 1,
    marginLeft: 20,
  },
  languageName: {
    fontFamily: FONT_FAMILY,
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  languageNative: {
    fontFamily: FONT_FAMILY,
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 2,
    textAlign: 'left',
    writingDirection: 'ltr',
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Level Selection
  levelList: {
    gap: 16,
    paddingBottom: 24,
  },
  levelItem: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  levelItemSelected: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  levelRadio: {
    marginTop: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelRadioSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  levelRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  levelContent: {
    flex: 1,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  levelTitle: {
    fontFamily: FONT_FAMILY,
    color: '#fff',
    fontSize: 18,
  },
  levelBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
  },
  levelRange: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    color: COLORS.primary,
  },
  levelDesc: {
    fontFamily: FONT_FAMILY,
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  testLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    marginBottom: 80,
  },
  testLinkText: {
    fontFamily: FONT_FAMILY,
    color: COLORS.textSecondary,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },

  // Bottom Button
  bottomButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 32,
  },
});
