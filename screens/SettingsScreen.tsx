import React, { useState, useRef, useEffect } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, Image, StyleSheet, Modal, Animated, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, LANGUAGES, LEVELS } from '../constants';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import Feather from '@expo/vector-icons/Feather';
import { FONT_FAMILY } from '../utils/typography';
import Ionicons from '@expo/vector-icons/Ionicons';
import { resetProgress, setCurrentLevel } from '../services/progressService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirstLevelForUserLevel } from '../services/vocabularyService';

const HOURS_LIST = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const MINUTES_LIST = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));
// Extended lists for infinite scroll effect (3x repeat)
const HOURS_EXTENDED = [...HOURS_LIST, ...HOURS_LIST, ...HOURS_LIST];
const MINUTES_EXTENDED = [...MINUTES_LIST, ...MINUTES_LIST, ...MINUTES_LIST];
const FREQUENCIES = ['Every 15 minutes','Every 30 minutes', 'Every hour', 'Every 2 hours',];

interface SwitchToggleProps {
   value: boolean;
   onToggle: () => void;
}

const SwitchToggle = ({ value, onToggle }: SwitchToggleProps) => {
   const translateX = useRef(new Animated.Value(value ? 22 : 2)).current;
   const bgColor = useRef(new Animated.Value(value ? 1 : 0)).current;

   useEffect(() => {
      Animated.parallel([
         Animated.spring(translateX, {
            toValue: value ? 22 : 2,
            useNativeDriver: true,
            friction: 8,
            tension: 100,
         }),
         Animated.timing(bgColor, {
            toValue: value ? 1 : 0,
            duration: 200,
            useNativeDriver: false,
         }),
      ]).start();
   }, [value]);

   const backgroundColor = bgColor.interpolate({
      inputRange: [0, 1],
      outputRange: ['#ffffff', COLORS.primary],
   });

   return (
      <TouchableOpacity onPress={onToggle} activeOpacity={0.8}>
         <Animated.View style={[
            styles.switchTrack,
            { backgroundColor },
            !value && { borderWidth: 1, borderColor: '#d0d0d0' }
         ]}>
            <Animated.View
               style={[
                  styles.switchThumb,
                  { transform: [{ translateX }] }
               ]}
            />
         </Animated.View>
      </TouchableOpacity>
   );
};

// Dark Mode Switch with Moon/Sun icons
const DarkModeSwitch = ({ value, onToggle }: SwitchToggleProps) => {
   const translateX = useRef(new Animated.Value(value ? 22 : 2)).current;
   const bgColor = useRef(new Animated.Value(value ? 1 : 0)).current;

   useEffect(() => {
      Animated.parallel([
         Animated.spring(translateX, {
            toValue: value ? 22 : 2,
            useNativeDriver: true,
            friction: 8,
            tension: 100,
         }),
         Animated.timing(bgColor, {
            toValue: value ? 1 : 0,
            duration: 200,
            useNativeDriver: false,
         }),
      ]).start();
   }, [value]);

   const backgroundColor = bgColor.interpolate({
      inputRange: [0, 1],
      outputRange: ['#ffffff', '#1a1a1a'],  // Light mode: white, Dark mode: black
   });

   return (
      <TouchableOpacity onPress={onToggle} activeOpacity={0.8}>
         <Animated.View style={[
            styles.switchTrack,
            { backgroundColor },
            !value && { borderWidth: 1, borderColor: '#d0d0d0' }  // Border visible in light mode
         ]}>
            <Animated.View
               style={[
                  styles.switchThumb,
                  { transform: [{ translateX }] }
               ]}
            >
               <MaterialIcons
                  name={value ? "nightlight-round" : "wb-sunny"}
                  size={16}
                  color={value ? "#FFD700" : "#FFA500"}
               />
            </Animated.View>
         </Animated.View>
      </TouchableOpacity>
   );
};

import { useTheme } from '../context/ThemeContext';

export default function SettingsScreen() {
   const navigation = useNavigation();
   const { isDarkMode, toggleTheme, colors } = useTheme();
   const [reminderEnabled, setReminderEnabled] = useState(true);
   const [startHour, setStartHour] = useState('09');
   const [startMinute, setStartMinute] = useState('00');
   const [endHour, setEndHour] = useState('21');
   const [endMinute, setEndMinute] = useState('00');
   const [frequency, setFrequency] = useState('Every 2 hours');
   const [showTimePicker, setShowTimePicker] = useState<'start' | 'end' | null>(null);
   const [tempHour, setTempHour] = useState('09');
   const [tempMinute, setTempMinute] = useState('00');
   const [showFrequencyPicker, setShowFrequencyPicker] = useState(false);
   const [selectedLanguage, setSelectedLanguage] = useState('english');
   const [showLanguagePicker, setShowLanguagePicker] = useState(false);
   const [showHelpModal, setShowHelpModal] = useState(false);
   const [showPrivacyModal, setShowPrivacyModal] = useState(false);
   const [selectedLevel, setSelectedLevel] = useState('beginner');
   const [showLevelPicker, setShowLevelPicker] = useState(false);

   // Refs for wheel picker scroll
   const hourScrollRef = useRef<ScrollView>(null);
   const minuteScrollRef = useRef<ScrollView>(null);
   const ITEM_HEIGHT = 44; // Height of each wheel item

   // Auto-scroll to selected values when picker opens (start from middle section)
   useEffect(() => {
      if (showTimePicker) {
         setTimeout(() => {
            const hourIndex = HOURS_LIST.indexOf(tempHour) + HOURS_LIST.length; // Start from middle section
            const minuteIndex = MINUTES_LIST.indexOf(tempMinute) + MINUTES_LIST.length;
            hourScrollRef.current?.scrollTo({ y: hourIndex * ITEM_HEIGHT, animated: false });
            minuteScrollRef.current?.scrollTo({ y: minuteIndex * ITEM_HEIGHT, animated: false });
         }, 100);
      }
   }, [showTimePicker]);

   // Load current level from AsyncStorage
   useEffect(() => {
      const loadLevel = async () => {
         try {
            const level = await AsyncStorage.getItem('@user_level');
            if (level) {
               setSelectedLevel(level);
            }
         } catch (error) {
            console.error('Error loading level:', error);
         }
      };
      loadLevel();
   }, []);

   // Dynamic styles based on theme
   const dynamicStyles = {
      container: { backgroundColor: colors.background },
      sectionCard: { backgroundColor: colors.surface, borderColor: colors.border },
      text: { color: colors.text },
      textSecondary: { color: colors.textSecondary },
      settingIcon: { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
      modalContent: { backgroundColor: colors.surface, borderColor: colors.border },
   };

   return (
      <SafeAreaView style={[styles.container, dynamicStyles.container]}>
         {/* Header with Back Button */}
         <View style={styles.header}>
            <TouchableOpacity
               onPress={() => navigation.goBack()}
               style={styles.backButton}
            >
               <FontAwesome5 name="arrow-left" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
            <View style={styles.headerSpacer} />
         </View>

         <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            {/* Profile */}
            <View style={[styles.profileSection, { paddingTop: 24 }]}>
               <View style={styles.avatarContainer}>
                  <Image
                     source={{ uri: 'https://i.pravatar.cc/300?img=5' }}
                     style={[styles.avatar, { borderColor: colors.surface }]}
                  />
                  <View style={[styles.editBadge, { backgroundColor: colors.primary, borderColor: colors.background }]}>
                     <MaterialIcons name="edit" size={16} color={isDarkMode ? '#000' : '#fff'} />
                  </View>
               </View>
               <Text style={[styles.profileName, dynamicStyles.text]}>Jane Doe</Text>
               <Text style={[styles.profileEmail, dynamicStyles.textSecondary]}>jane.doe@vocbee.com</Text>

               <TouchableOpacity style={[styles.editButton, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                  <Text style={[styles.editButtonText, { color: colors.text }]}>Edit Profile</Text>
               </TouchableOpacity>
            </View>

            {/* Section: Preferences */}
            <Text style={[styles.sectionTitle, dynamicStyles.textSecondary]}>Preferences</Text>
            <View style={[styles.sectionCard, dynamicStyles.sectionCard]}>
               <View style={styles.settingItem}>
                  <View style={styles.settingLeft}>
                     <View style={[styles.settingIcon, dynamicStyles.settingIcon]}>
                        <MaterialCommunityIcons name="theme-light-dark" size={24} color={colors.primary} />
                     </View>
                     <Text style={[styles.settingTitle, dynamicStyles.text]}>Theme</Text>
                  </View>
                  <DarkModeSwitch
                     value={isDarkMode}
                     onToggle={toggleTheme}
                  />
               </View>
               <TouchableOpacity
                  style={styles.settingItem}
                  onPress={() => setShowLanguagePicker(true)}
               >
                  <View style={styles.settingLeft}>
                     <View style={[styles.settingIcon, dynamicStyles.settingIcon]}>
                        <Ionicons name="language" size={24} color={colors.primary} />
                     </View>
                     <View>
                        <Text style={[styles.settingTitle, dynamicStyles.text]}>Language</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                           <Image
                              source={LANGUAGES.find(l => l.id === selectedLanguage)?.flagIcon}
                              style={{ width: 12, height: 12, borderRadius: 2 }}
                              resizeMode="contain"
                           />
                           <Text style={[styles.settingSubtitle, dynamicStyles.textSecondary]}>
                              {LANGUAGES.find(l => l.id === selectedLanguage)?.name}
                           </Text>
                        </View>
                     </View>
                  </View>
                  <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
               </TouchableOpacity>
            </View>

            {/* Section: Daily Reminder */}
            <Text style={[styles.sectionTitle, dynamicStyles.textSecondary]}>Daily Reminder</Text>
            <View style={[styles.sectionCard, dynamicStyles.sectionCard]}>
               <View style={styles.settingItem}>
                  <View style={styles.settingLeft}>
                     <View style={[styles.settingIcon, dynamicStyles.settingIcon]}>
                        <MaterialCommunityIcons name="bell-outline" size={24} color={colors.primary} />
                     </View>
                     <Text style={[styles.settingTitle, dynamicStyles.text]}>Enable Reminders</Text>
                  </View>
                  <SwitchToggle
                     value={reminderEnabled}
                     onToggle={() => setReminderEnabled(!reminderEnabled)}
                  />
               </View>

               {reminderEnabled && (
                  <>
                     {/* Time Range */}
                     <TouchableOpacity
                        style={styles.settingItem}
                        onPress={() => {
                           setTempHour(startHour);
                           setTempMinute(startMinute);
                           setShowTimePicker('start');
                        }}
                     >
                        <View style={styles.settingLeft}>
                           <View style={[styles.settingIcon, dynamicStyles.settingIcon]}>
                              <MaterialIcons name="schedule" size={20} color={colors.primary} />
                           </View>
                           <View>
                              <Text style={[styles.settingTitle, dynamicStyles.text]}>Start Time</Text>
                              <Text style={[styles.settingSubtitle, dynamicStyles.textSecondary]}>{startHour}:{startMinute}</Text>
                           </View>
                        </View>
                        <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
                     </TouchableOpacity>

                     <TouchableOpacity
                        style={styles.settingItem}
                        onPress={() => {
                           setTempHour(endHour);
                           setTempMinute(endMinute);
                           setShowTimePicker('end');
                        }}
                     >
                        <View style={styles.settingLeft}>
                           <View style={[styles.settingIcon, dynamicStyles.settingIcon]}>
                              <MaterialIcons name="schedule" size={20} color={colors.primary} />
                           </View>
                           <View>
                              <Text style={[styles.settingTitle, dynamicStyles.text]}>End Time</Text>
                              <Text style={[styles.settingSubtitle, dynamicStyles.textSecondary]}>{endHour}:{endMinute}</Text>
                           </View>
                        </View>
                        <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
                     </TouchableOpacity>

                     {/* Frequency */}
                     <TouchableOpacity
                        style={[styles.settingItem, { borderBottomWidth: 0 }]}
                        onPress={() => setShowFrequencyPicker(true)}
                     >
                        <View style={styles.settingLeft}>
                           <View style={[styles.settingIcon, dynamicStyles.settingIcon]}>
                              <Feather name="repeat" size={18} color={colors.primary} />
                           </View>
                           <View>
                              <Text style={[styles.settingTitle, dynamicStyles.text]}>Frequency</Text>
                              <Text style={[styles.settingSubtitle, dynamicStyles.textSecondary]}>{frequency}</Text>
                           </View>
                        </View>
                        <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
                     </TouchableOpacity>
                  </>
               )}
            </View>

            {/* Section: Progress */}
            <Text style={[styles.sectionTitle, dynamicStyles.textSecondary]}>Progress</Text>
            <View style={[styles.sectionCard, dynamicStyles.sectionCard]}>
               <TouchableOpacity
                  style={styles.settingItem}
                  onPress={() => setShowLevelPicker(true)}
               >
                  <View style={styles.settingLeft}>
                     <View style={[styles.settingIcon, dynamicStyles.settingIcon]}>
                        <MaterialCommunityIcons name="trophy-outline" size={24} color={colors.primary} />
                     </View>
                     <View>
                        <Text style={[styles.settingTitle, dynamicStyles.text]}>Change Level</Text>
                        <Text style={[styles.settingSubtitle, dynamicStyles.textSecondary]}>
                           {LEVELS.find(l => l.id === selectedLevel)?.title} ({LEVELS.find(l => l.id === selectedLevel)?.range})
                        </Text>
                     </View>
                  </View>
                  <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
               </TouchableOpacity>
               <TouchableOpacity
                  style={[styles.settingItem, { borderBottomWidth: 0 }]}
                  onPress={() => {
                     Alert.alert(
                        'Reset Progress',
                        'Are you sure you want to reset all your learning progress? This action cannot be undone.',
                        [
                           { text: 'Cancel', style: 'cancel' },
                           {
                              text: 'Reset',
                              style: 'destructive',
                              onPress: async () => {
                                 await resetProgress();
                                 Alert.alert('Success', 'Your progress has been reset.');
                              }
                           }
                        ]
                     );
                  }}
               >
                  <View style={styles.settingLeft}>
                     <View style={[styles.settingIcon, dynamicStyles.settingIcon]}>
                        <MaterialIcons name="refresh" size={24} color={colors.error} />
                     </View>
                     <View>
                        <Text style={[styles.settingTitle, { color: colors.error }]}>Reset Progress</Text>
                        <Text style={[styles.settingSubtitle, dynamicStyles.textSecondary]}>Clear all learned words</Text>
                     </View>
                  </View>
                  <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
               </TouchableOpacity>
            </View>

            {/* Section: Support */}
            <Text style={[styles.sectionTitle, dynamicStyles.textSecondary]}>Support</Text>
            <View style={[styles.sectionCard, dynamicStyles.sectionCard]}>
               <TouchableOpacity style={styles.settingItem} onPress={() => setShowHelpModal(true)}>
                  <View style={styles.settingLeft}>
                     <View style={[styles.settingIcon, dynamicStyles.settingIcon]}>
                        <MaterialCommunityIcons name="help" size={20} color={colors.primary} />
                     </View>
                     <Text style={[styles.settingTitle, dynamicStyles.text]}>Help & FAQ</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
               </TouchableOpacity>
               <TouchableOpacity style={[styles.settingItem, { borderBottomWidth: 0 }]} onPress={() => setShowPrivacyModal(true)}>
                  <View style={styles.settingLeft}>
                     <View style={[styles.settingIcon, dynamicStyles.settingIcon]}>
                        <MaterialCommunityIcons name="security" size={24} color={colors.primary} />
                     </View>
                     <Text style={[styles.settingTitle, dynamicStyles.text]}>Privacy Policy</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
               </TouchableOpacity>
            </View>



            {/* Log Out Button */}
            <TouchableOpacity style={styles.logoutButton}>
               <MaterialIcons name="logout" size={20} color={colors.error} />
               <Text style={[styles.logoutButtonText, { color: colors.error }]}>Log Out</Text>
            </TouchableOpacity>

            <Text style={[styles.versionText, dynamicStyles.textSecondary, { marginTop: 12, marginBottom: 0 }]}>VocBee v1.0.0</Text>
         </ScrollView>

         {/* Time Picker Modal - Wheel Style */}
         <Modal
            visible={showTimePicker !== null}
            transparent
            animationType="fade"
            onRequestClose={() => setShowTimePicker(null)}
         >
            <View style={styles.modalOverlay}>
               <TouchableOpacity
                  style={StyleSheet.absoluteFill}
                  activeOpacity={1}
                  onPress={() => setShowTimePicker(null)}
               />
               <View style={[styles.modalContent, dynamicStyles.modalContent]}>
                  <Text style={[styles.modalTitle, dynamicStyles.text]}>
                     Select {showTimePicker === 'start' ? 'Start' : 'End'} Time
                  </Text>

                  {/* Wheel Picker Container */}
                  <View style={styles.wheelPickerContainer}>
                     {/* Hours Column */}
                     <View style={styles.wheelColumn}>
                        <Text style={[styles.wheelLabel, dynamicStyles.textSecondary]}>Hour</Text>
                        <View style={styles.wheelScrollWrapper}>
                           <View style={[styles.wheelCenterIndicator, { borderColor: colors.primary }]} pointerEvents="none" />
                           <ScrollView
                              ref={hourScrollRef}
                              style={styles.wheelScroll}
                              showsVerticalScrollIndicator={false}
                              contentContainerStyle={styles.wheelScrollContent}
                              decelerationRate="fast"
                              nestedScrollEnabled={true}
                              onMomentumScrollEnd={(e) => {
                                 const y = e.nativeEvent.contentOffset.y;
                                 const index = Math.round(y / ITEM_HEIGHT);
                                 const actualIndex = ((index % HOURS_LIST.length) + HOURS_LIST.length) % HOURS_LIST.length;
                                 setTempHour(HOURS_LIST[actualIndex]);

                                 // Snap to exact position
                                 const snappedY = index * ITEM_HEIGHT;
                                 if (y !== snappedY) {
                                    hourScrollRef.current?.scrollTo({ y: snappedY, animated: true });
                                 }

                                 // Reset to middle section if scrolled too far
                                 if (index < HOURS_LIST.length || index >= HOURS_LIST.length * 2) {
                                    const middleIndex = actualIndex + HOURS_LIST.length;
                                    setTimeout(() => {
                                       hourScrollRef.current?.scrollTo({ y: middleIndex * ITEM_HEIGHT, animated: false });
                                    }, 100);
                                 }
                              }}
                           >
                              {HOURS_EXTENDED.map((hour, idx) => (
                                 <View key={`hour-${idx}`} style={styles.wheelItem}>
                                    <Text style={[styles.wheelItemText, { color: colors.text }]}>{hour}</Text>
                                 </View>
                              ))}
                           </ScrollView>
                        </View>
                     </View>

                     {/* Separator */}
                     <Text style={[styles.wheelSeparator, dynamicStyles.text]}>:</Text>

                     {/* Minutes Column */}
                     <View style={styles.wheelColumn}>
                        <Text style={[styles.wheelLabel, dynamicStyles.textSecondary]}>Min</Text>
                        <View style={styles.wheelScrollWrapper}>
                           <View style={[styles.wheelCenterIndicator, { borderColor: colors.primary }]} pointerEvents="none" />
                           <ScrollView
                              ref={minuteScrollRef}
                              style={styles.wheelScroll}
                              showsVerticalScrollIndicator={false}
                              contentContainerStyle={styles.wheelScrollContent}
                              decelerationRate="fast"
                              nestedScrollEnabled={true}
                              onMomentumScrollEnd={(e) => {
                                 const y = e.nativeEvent.contentOffset.y;
                                 const index = Math.round(y / ITEM_HEIGHT);
                                 const actualIndex = ((index % MINUTES_LIST.length) + MINUTES_LIST.length) % MINUTES_LIST.length;
                                 setTempMinute(MINUTES_LIST[actualIndex]);

                                 // Snap to exact position
                                 const snappedY = index * ITEM_HEIGHT;
                                 if (y !== snappedY) {
                                    minuteScrollRef.current?.scrollTo({ y: snappedY, animated: true });
                                 }

                                 // Reset to middle section if scrolled too far
                                 if (index < MINUTES_LIST.length || index >= MINUTES_LIST.length * 2) {
                                    const middleIndex = actualIndex + MINUTES_LIST.length;
                                    setTimeout(() => {
                                       minuteScrollRef.current?.scrollTo({ y: middleIndex * ITEM_HEIGHT, animated: false });
                                    }, 100);
                                 }
                              }}
                           >
                              {MINUTES_EXTENDED.map((minute, idx) => (
                                 <View key={`minute-${idx}`} style={styles.wheelItem}>
                                    <Text style={[styles.wheelItemText, { color: colors.text }]}>{minute}</Text>
                                 </View>
                              ))}
                           </ScrollView>
                        </View>
                     </View>
                  </View>

                  {/* Confirm Button */}
                  <TouchableOpacity
                     style={[styles.confirmButton, { backgroundColor: colors.primary }]}
                     onPress={() => {
                        if (showTimePicker === 'start') {
                           setStartHour(tempHour);
                           setStartMinute(tempMinute);
                        } else {
                           setEndHour(tempHour);
                           setEndMinute(tempMinute);
                        }
                        setShowTimePicker(null);
                     }}
                  >
                     <Text style={styles.confirmButtonText}>Confirm</Text>
                  </TouchableOpacity>
               </View>
            </View>
         </Modal>

         {/* Frequency Picker Modal */}
         <Modal
            visible={showFrequencyPicker}
            transparent
            animationType="fade"
            onRequestClose={() => setShowFrequencyPicker(false)}
         >
            <TouchableOpacity
               style={styles.modalOverlay}
               activeOpacity={1}
               onPress={() => setShowFrequencyPicker(false)}
            >
               <View style={[styles.modalContent, dynamicStyles.modalContent]}>
                  <Text style={[styles.modalTitle, dynamicStyles.text]}>Select Frequency</Text>
                  {FREQUENCIES.map((freq) => (
                     <TouchableOpacity
                        key={freq}
                        style={[
                           styles.pickerItem,
                           { borderBottomColor: colors.border },
                           frequency === freq && { backgroundColor: `${colors.primary}20` }
                        ]}
                        onPress={() => {
                           setFrequency(freq);
                           setShowFrequencyPicker(false);
                        }}
                     >
                        <Text style={[
                           styles.pickerItemText,
                           { color: colors.text },
                           frequency === freq && { color: colors.primary }
                        ]}>{freq}</Text>
                     </TouchableOpacity>
                  ))}
               </View>
            </TouchableOpacity>
         </Modal>

         {/* Language Picker Modal */}
         <Modal
            visible={showLanguagePicker}
            transparent
            animationType="fade"
            onRequestClose={() => setShowLanguagePicker(false)}
         >
            <TouchableOpacity
               style={styles.modalOverlay}
               activeOpacity={1}
               onPress={() => setShowLanguagePicker(false)}
            >
               <View style={[styles.modalContent, dynamicStyles.modalContent, { maxHeight: '70%' }]}>
                  <Text style={[styles.modalTitle, dynamicStyles.text]}>Select Language</Text>
                  <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                     {LANGUAGES.map((lang) => (
                        <TouchableOpacity
                           key={lang.id}
                           style={[
                              styles.pickerItem,
                              { borderBottomColor: colors.border },
                              selectedLanguage === lang.id && { backgroundColor: `${colors.primary}20` }
                           ]}
                           onPress={() => {
                              setSelectedLanguage(lang.id);
                              setShowLanguagePicker(false);
                           }}
                        >
                           <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                              <Image
                                 source={lang.flagIcon}
                                 style={{ width: 24, height: 18, borderRadius: 2 }}
                                 resizeMode="contain"
                              />
                              <Text style={[
                                 styles.pickerItemText,
                                 { color: colors.text },
                                 selectedLanguage === lang.id && { color: colors.primary }
                              ]}>{lang.name}</Text>
                              <Text style={[
                                 styles.pickerItemNativeName,
                                 { color: colors.textSecondary },
                                 selectedLanguage === lang.id && { color: colors.primary }
                              ]}> ({lang.nativeName})</Text>
                           </View>
                        </TouchableOpacity>
                     ))}
                  </ScrollView>
               </View>
            </TouchableOpacity>
         </Modal>

         {/* Level Picker Modal */}
         <Modal
            visible={showLevelPicker}
            transparent
            animationType="fade"
            onRequestClose={() => setShowLevelPicker(false)}
         >
            <TouchableOpacity
               style={styles.modalOverlay}
               activeOpacity={1}
               onPress={() => setShowLevelPicker(false)}
            >
               <View style={[styles.modalContent, dynamicStyles.modalContent, { maxHeight: '70%' }]}>
                  <Text style={[styles.modalTitle, dynamicStyles.text]}>Select Your Level</Text>
                  <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                     {LEVELS.map((level) => (
                        <TouchableOpacity
                           key={level.id}
                           style={[
                              styles.levelPickerItem,
                              { borderBottomColor: colors.border },
                              selectedLevel === level.id && { backgroundColor: `${colors.primary}20`, borderColor: colors.primary }
                           ]}
                           onPress={async () => {
                              setSelectedLevel(level.id);
                              try {
                                 await AsyncStorage.setItem('@user_level', level.id);
                                 // Update the CEFR level for vocabulary service
                                 const cefrLevel = getFirstLevelForUserLevel(level.id);
                                 await setCurrentLevel(cefrLevel);
                              } catch (error) {
                                 console.error('Error saving level:', error);
                              }
                              setShowLevelPicker(false);
                           }}
                        >
                           <View style={styles.levelPickerRow}>
                              <View style={[
                                 styles.levelRadio,
                                 { borderColor: colors.border },
                                 selectedLevel === level.id && { borderColor: colors.primary, backgroundColor: colors.primary }
                              ]}>
                                 {selectedLevel === level.id && <View style={[styles.levelRadioInner, { backgroundColor: colors.background }]} />}
                              </View>
                              <View style={{ flex: 1 }}>
                                 <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                                    <Text style={[
                                       styles.levelPickerTitle,
                                       { color: colors.text },
                                       selectedLevel === level.id && { color: colors.primary }
                                    ]}>{level.title}</Text>
                                    <View style={[styles.levelBadge, { backgroundColor: `${colors.primary}33` }]}>
                                       <Text style={[styles.levelRange, { color: colors.primary }]}>{level.range}</Text>
                                    </View>
                                 </View>
                                 <Text style={[
                                    styles.levelPickerDesc,
                                    { color: colors.textSecondary },
                                    selectedLevel === level.id && { color: colors.primary }
                                 ]}>{level.description}</Text>
                              </View>
                           </View>
                        </TouchableOpacity>
                     ))}
                  </ScrollView>
               </View>
            </TouchableOpacity>
         </Modal>
      </SafeAreaView>
   );
}

const styles = StyleSheet.create({
   container: {
      flex: 1,
      backgroundColor: COLORS.background,
   },
   header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 50,
      paddingBottom: 0,
      gap: 12,
   },
   backButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
   },
   headerTitle: {
      fontFamily: FONT_FAMILY,
      fontSize: 20,
      flex: 1,
      textAlign: 'center',
   },
   headerSpacer: {
      width: 44,
   },
   scrollView: {
      flex: 1,
      paddingHorizontal: 16,
   },
   scrollContent: {
      paddingTop: 24,
      paddingBottom: 40,
   },
   logoutText: {
      color: COLORS.textSecondary,
   },
   profileSection: {
      alignItems: 'center',
      marginBottom: 32,
   },
   avatarContainer: {
      position: 'relative',
      marginBottom: 16,
   },
   avatar: {
      width: 112,
      height: 112,
      borderRadius: 56,
      borderWidth: 4,
      borderColor: COLORS.surface,
   },
   editBadge: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      backgroundColor: COLORS.primary,
      padding: 6,
      borderRadius: 12,
      borderWidth: 4,
      borderColor: COLORS.background,
   },
   profileName: {
      fontFamily: FONT_FAMILY,
      color: '#fff',
      fontSize: 24,
   },
   profileEmail: {
      fontFamily: FONT_FAMILY,
      color: COLORS.textSecondary,
      fontSize: 14,
      fontWeight: '500',
      marginBottom: 16,
   },
   editButton: {
      paddingHorizontal: 24,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: COLORS.surface,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
   },
   editButtonText: {
      fontFamily: FONT_FAMILY,
      color: '#fff',
      fontWeight: '600',
      fontSize: 14,
   },
   sectionTitle: {
      fontFamily: FONT_FAMILY,
      color: COLORS.textSecondary,
      fontSize: 10,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 12,
      marginLeft: 8,
   },
   sectionCard: {
      backgroundColor: COLORS.surface,
      borderRadius: 12,
      overflow: 'hidden',
      marginBottom: 24,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.05)',
   },
   settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255,255,255,0.05)',
   },
   settingLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
   },
   settingIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255,255,255,0.05)',
      alignItems: 'center',
      justifyContent: 'center',
   },
   settingTitle: {
      fontFamily: FONT_FAMILY,
      color: '#fff',
      fontSize: 16,
      fontWeight: '500',
   },
   settingSubtitle: {
      fontFamily: FONT_FAMILY,
      color: COLORS.primary,
      fontSize: 12,
      fontWeight: '500',
      marginTop: 2,
   },
   versionText: {
      fontFamily: FONT_FAMILY,
      color: COLORS.textSecondary,
      fontSize: 12,
      textAlign: 'center',
      marginBottom: 40,
   },
   modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.7)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: 0,
   },
   modalContent: {
      width: '80%',
      maxHeight: '60%',
      backgroundColor: COLORS.surface,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
   },
   modalTitle: {
      fontFamily: FONT_FAMILY,
      color: '#fff',
      fontSize: 18,
      marginBottom: 16,
      textAlign: 'center',
   },
   pickerScroll: {
      maxHeight: 300,
   },
   pickerItem: {
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 8,
   },
   pickerItemSelected: {
      backgroundColor: 'rgba(255, 204, 0, 0.15)',
   },
   pickerItemText: {
      fontFamily: FONT_FAMILY,
      color: '#fff',
      fontSize: 16,
      textAlign: 'center',
   },
   pickerItemTextSelected: {
      fontFamily: FONT_FAMILY,
      color: COLORS.primary,
   },
   switchTrack: {
      width: 48,
      height: 28,
      borderRadius: 14,
      justifyContent: 'center',
   },
   switchThumb: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: '#fff',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000000ff',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 3,
   },
   logoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      padding: 16,
      marginTop: 24,
      marginBottom: 16,
      borderRadius: 12,
   },
   logoutButtonText: {
      fontFamily: FONT_FAMILY,
      fontSize: 16,
      fontWeight: '600',
   },
   pickerItemNativeName: {
      fontSize: 14,
      fontWeight: 'bold',
   },
   faqQuestion: {
      fontFamily: FONT_FAMILY,
      fontSize: 16,
      marginBottom: 8,
   },
   faqAnswer: {
      fontFamily: FONT_FAMILY,
      fontSize: 14,
      lineHeight: 20,
   },
   privacyHeading: {
      fontFamily: FONT_FAMILY,
      fontSize: 16,
      marginBottom: 8,
   },
   privacyText: {
      fontFamily: FONT_FAMILY,
      fontSize: 14,
      lineHeight: 20,
   },
   levelPickerItem: {
      paddingVertical: 16,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: 'transparent',
      marginBottom: 8,
   },
   levelPickerRow: {
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
      alignItems: 'center',
      justifyContent: 'center',
   },
   levelRadioInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
   },
   levelPickerTitle: {
      fontFamily: FONT_FAMILY,
      fontSize: 18,
   },
   levelPickerDesc: {
      fontFamily: FONT_FAMILY,
      fontSize: 14,
      lineHeight: 20,
   },
   levelBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
   },
   levelRange: {
      fontFamily: FONT_FAMILY,
      fontSize: 12,
   },
   wheelPickerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
   },
   wheelColumn: {
      alignItems: 'center',
      width: 80,
   },
   wheelLabel: {
      fontFamily: FONT_FAMILY,
      fontSize: 12,
      marginBottom: 8,
   },
   wheelScroll: {
      height: 200,
      width: 70,
   },
   wheelScrollContent: {
      paddingTop: 78,
      paddingBottom: 78,
   },
   wheelItem: {
      height: 44,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
   },
   wheelItemText: {
      fontFamily: FONT_FAMILY,
      fontSize: 18,
   },
   wheelSeparator: {
      fontSize: 32,
      fontWeight: 'bold',
      marginHorizontal: 8,
      marginTop: 18,
   },
   confirmButton: {
      marginTop: 16,
      paddingVertical: 14,
      paddingHorizontal: 32,
      borderRadius: 12,
      alignItems: 'center',
   },
   confirmButtonText: {
      fontFamily: FONT_FAMILY,
      fontSize: 16,
      color: '#000',
   },
   wheelScrollWrapper: {
      position: 'relative',
      height: 200,
   },
   wheelCenterIndicator: {
      position: 'absolute',
      top: 78,
      left: 0,
      right: 0,
      height: 44,
      borderTopWidth: 2,
      borderBottomWidth: 2,
      borderRadius: 8,
      zIndex: 1,
   },
});
