import React, { useState, useRef, useEffect } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, Image, StyleSheet, Modal, Animated, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, LANGUAGES, LEVELS } from '../constants';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { FONT_FAMILY } from '../utils/typography';
import { resetProgress, setCurrentLevel } from '../services/progressService';
import { getFirstLevelForUserLevel } from '../services/vocabularyService';
import { forceSync } from '../services/SyncService';
import { useAlert } from '../components/CustomAlert';
import * as ImagePicker from 'expo-image-picker';
import {
   getNotificationSettings,
   saveNotificationSettings,
   requestNotificationPermissions,
   scheduleVocabularyNotifications,
   sendTestNotification,
} from '../services/notificationService';
import { doc, setDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { updateProfile } from 'firebase/auth';


// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const HOURS_LIST = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const MINUTES_LIST = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));
const HOURS_EXTENDED = [...HOURS_LIST, ...HOURS_LIST, ...HOURS_LIST];
const MINUTES_EXTENDED = [...MINUTES_LIST, ...MINUTES_LIST, ...MINUTES_LIST];
const FREQUENCIES = ['Every 15 minutes', 'Every 30 minutes', 'Every hour', 'Every 2 hours'];

// ─────────────────────────────────────────────────────────────────────────────
// AnimatedSwitch Component - Unified toggle with variants
// ─────────────────────────────────────────────────────────────────────────────
interface AnimatedSwitchProps {
   value: boolean;
   onToggle: () => void;
   variant?: 'default' | 'theme';
}

const AnimatedSwitch: React.FC<AnimatedSwitchProps> = ({ value, onToggle, variant = 'default' }) => {
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
   }, [value, translateX, bgColor]);

   // Colors based on variant
   const activeColor = variant === 'theme' ? '#1a1a1a' : COLORS.primary;
   const backgroundColor = bgColor.interpolate({
      inputRange: [0, 1],
      outputRange: ['#ffffff', activeColor],
   });

   return (
      <TouchableOpacity onPress={onToggle} activeOpacity={0.8}>
         <Animated.View style={[
            styles.switchTrack,
            { backgroundColor },
            !value && { borderWidth: 1, borderColor: '#d0d0d0' },
            value && variant === 'theme' && { borderWidth: 1, borderColor: '#444444' }
         ]}>
            <Animated.View style={[styles.switchThumb, { transform: [{ translateX }] }]}>
               {variant === 'theme' && (
                  <MaterialIcons
                     name={value ? 'nightlight-round' : 'wb-sunny'}
                     size={16}
                     color={value ? '#FFD700' : '#FFA500'}
                  />
               )}
            </Animated.View>
         </Animated.View>
      </TouchableOpacity>
   );
};


export default function SettingsScreen() {
   const navigation = useNavigation<StackNavigationProp<any>>();
   const { isDarkMode, toggleTheme, colors } = useTheme();
   const {
      signOut,
      user,
      profile,
      updateProfileData
   } = useAuth();
   const { showAlert } = useAlert();
   const [reminderEnabled, setReminderEnabled] = useState(true);
   const [autoMarkLearned, setAutoMarkLearned] = useState(true);
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
   const [showLevelPicker, setShowLevelPicker] = useState(false);
   const [currentLevel, setCurrentLevelState] = useState('A1');
   const [showAutoMarkPicker, setShowAutoMarkPicker] = useState(false);

   // Profile states
   const [showEditProfileModal, setShowEditProfileModal] = useState(false);
   const [showImagePickerModal, setShowImagePickerModal] = useState(false);

   // Temp states for editing
   const [tempName, setTempName] = useState('');
   const [tempEmail, setTempEmail] = useState('');

   // Load notification settings on mount
   useEffect(() => {
      const loadSettings = async () => {
         const settings = await getNotificationSettings();
         setReminderEnabled(settings.enabled);
         setAutoMarkLearned(settings.autoMarkLearned);
         setStartHour(settings.startHour.toString().padStart(2, '0'));
         setStartMinute(settings.startMinute.toString().padStart(2, '0'));
         setEndHour(settings.endHour.toString().padStart(2, '0'));
         setEndMinute(settings.endMinute.toString().padStart(2, '0'));
         // Set frequency from minutes
         switch (settings.frequencyMinutes) {
            case 15: setFrequency('Every 15 minutes'); break;
            case 30: setFrequency('Every 30 minutes'); break;
            case 60: setFrequency('Every hour'); break;
            default: setFrequency('Every 2 hours');
         }
      };
      loadSettings();
   }, []);

   // Helper to convert frequency string to minutes
   const getFrequencyMinutes = (freq: string): number => {
      switch (freq) {
         case 'Every 15 minutes': return 15;
         case 'Every 30 minutes': return 30;
         case 'Every hour': return 60;
         default: return 120;
      }
   };

   // Handle reminder toggle with permission request
   const handleReminderToggle = async () => {
      const newValue = !reminderEnabled;
      if (newValue) {
         const granted = await requestNotificationPermissions();
         if (!granted) {
            showAlert({ title: 'Permission Required', message: 'Please enable notifications in your device settings.' });
            return;
         }
      }
      setReminderEnabled(newValue);
      await saveNotificationSettings({
         enabled: newValue,
         startHour: parseInt(startHour),
         startMinute: parseInt(startMinute),
         endHour: parseInt(endHour),
         endMinute: parseInt(endMinute),
         frequencyMinutes: getFrequencyMinutes(frequency),
         autoMarkLearned,
      });
   };

   // Handle auto-mark toggle
   const handleAutoMarkToggle = async () => {
      const newValue = !autoMarkLearned;
      setAutoMarkLearned(newValue);
      await saveNotificationSettings({ autoMarkLearned: newValue });
   };

   // Save time settings
   const saveTimeSettings = async (type: 'start' | 'end', hour: string, minute: string) => {
      if (type === 'start') {
         await saveNotificationSettings({
            startHour: parseInt(hour),
            startMinute: parseInt(minute),
         });
      } else {
         await saveNotificationSettings({
            endHour: parseInt(hour),
            endMinute: parseInt(minute),
         });
      }
   };

   // Save frequency
   const handleFrequencyChange = async (freq: string) => {
      setFrequency(freq);
      await saveNotificationSettings({ frequencyMinutes: getFrequencyMinutes(freq) });
   };

   // Refs for wheel picker scroll
   const hourScrollRef = useRef<any>(null);
   const minuteScrollRef = useRef<any>(null);
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
               setCurrentLevelState(level);
            }
         } catch (error) {
            console.error('Error loading level:', error);
         }
      };
      loadLevel();
   }, []);

   // Removed local profile loading useEffect - data now comes from AuthContext

   // Pick image from gallery
   const pickImageFromGallery = async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
         showAlert({ title: 'Permission Required', message: 'Please grant access to your photo library.' });
         return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
         mediaTypes: ImagePicker.MediaTypeOptions.Images,
         allowsEditing: true,
         aspect: [1, 1],
         quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
         const uri = result.assets[0].uri;
         await updateProfileData({ image: uri });
         setShowImagePickerModal(false);
      }
   };

   // Take photo with camera
   const takePhotoWithCamera = async () => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
         showAlert({ title: 'Permission Required', message: 'Please grant access to your camera.' });
         return;
      }

      const result = await ImagePicker.launchCameraAsync({
         allowsEditing: true,
         aspect: [1, 1],
         quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
         const uri = result.assets[0].uri;
         await updateProfileData({ image: uri });
         setShowImagePickerModal(false);
      }
   };

   // Remove profile image
   const removeProfileImage = async () => {
      await updateProfileData({ image: null });
      setShowImagePickerModal(false);
   };

   // Save profile changes (local only - Firebase sync happens daily)
   const saveProfileChanges = async () => {
      try {
         await updateProfileData({ name: tempName });

         setShowEditProfileModal(false);
         showAlert({ title: 'Success', message: 'Profile updated successfully!' });
      } catch (error) {
         console.error('Error saving profile:', error);
         showAlert({ title: 'Error', message: 'Failed to save profile.' });
      }
   };

   // Open edit profile modal
   const openEditProfileModal = () => {
      setTempName(profile.name);
      setTempEmail(profile.email);
      setShowEditProfileModal(true);
   };

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
               <TouchableOpacity style={styles.avatarContainer} onPress={() => setShowImagePickerModal(true)}>
                  {profile.image ? (
                     <Image
                        source={{ uri: profile.image }}
                        style={[styles.avatar, { borderColor: colors.surface }]}
                     />
                  ) : (
                     <View style={[styles.avatar, styles.avatarPlaceholder, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                        <MaterialIcons name="person" size={56} color={colors.textSecondary} />
                     </View>
                  )}
                  <View style={[styles.editBadge, { backgroundColor: colors.primary, borderColor: colors.background }]}>
                     <MaterialIcons name="camera-alt" size={16} color={isDarkMode ? '#000' : '#fff'} />
                  </View>
               </TouchableOpacity>
               <Text style={[styles.profileName, dynamicStyles.text]}>{profile.name || 'User'}</Text>
               <Text style={[styles.profileEmail, dynamicStyles.textSecondary]}>{profile.email}</Text>

               <TouchableOpacity
                  style={[styles.editButton, { borderColor: colors.border, backgroundColor: colors.surface }]}
                  onPress={openEditProfileModal}
               >
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
                  <AnimatedSwitch value={isDarkMode} onToggle={toggleTheme} variant="theme" />
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
               <TouchableOpacity
                  style={styles.settingItem}
                  onPress={() => setShowAutoMarkPicker(true)}
               >
                  <View style={styles.settingLeft}>
                     <View style={[styles.settingIcon, dynamicStyles.settingIcon]}>
                        <MaterialCommunityIcons name="check-circle-outline" size={24} color={colors.primary} />
                     </View>
                     <View>
                        <Text style={[styles.settingTitle, dynamicStyles.text]}>When Notification Arrives</Text>
                        <Text style={[styles.settingSubtitle, dynamicStyles.textSecondary]}>
                           {autoMarkLearned ? 'Mark as learned' : 'Do not mark'}
                        </Text>
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
                  <AnimatedSwitch value={reminderEnabled} onToggle={handleReminderToggle} />
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
                           {LEVELS.find(l => l.id === currentLevel)?.title} ({LEVELS.find(l => l.id === currentLevel)?.range})
                        </Text>
                     </View>
                  </View>
                  <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
               </TouchableOpacity>
               <TouchableOpacity
                  style={styles.settingItem}
                  onPress={() => {
                     showAlert({
                        title: 'Change Learning Language',
                        message: 'This will reset all your progress and let you choose a new language to learn. Are you sure?',
                        buttons: [
                           { text: 'Cancel', style: 'cancel' },
                           {
                              text: 'Continue',
                              style: 'destructive',
                              onPress: async () => {
                                 await resetProgress();
                                 await forceSync(user?.uid || '');
                                 navigation.reset({
                                    index: 0,
                                    routes: [{ name: 'NativeLanguage' as any }],
                                 });
                              }
                           }
                        ]
                     });
                  }}
               >
                  <View style={styles.settingLeft}>
                     <View style={[styles.settingIcon, dynamicStyles.settingIcon]}>
                        <MaterialCommunityIcons name="translate" size={24} color={colors.primary} />
                     </View>
                     <View>
                        <Text style={[styles.settingTitle, dynamicStyles.text]}>Change Learning Language</Text>
                        <Text style={[styles.settingSubtitle, dynamicStyles.textSecondary]}>Start learning a new language</Text>
                     </View>
                  </View>
                  <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
               </TouchableOpacity>
               <TouchableOpacity
                  style={[styles.settingItem, { borderBottomWidth: 0 }]}
                  onPress={() => {
                     showAlert({
                        title: 'Reset Progress',
                        message: 'Are you sure you want to reset all your learning progress? This action cannot be undone.',
                        buttons: [
                           { text: 'Cancel', style: 'cancel' },
                           {
                              text: 'Reset',
                              style: 'destructive',
                              onPress: async () => {
                                 await resetProgress();
                                 // Sync empty progress to Firebase
                                 await forceSync(user?.uid || '');
                                 showAlert({ title: 'Success', message: 'Your progress has been reset.' });
                              }
                           }
                        ]
                     });
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
            <TouchableOpacity
               style={styles.logoutButton}
               onPress={() => {
                  showAlert({
                     title: 'Log Out',
                     message: 'Are you sure you want to log out?',
                     buttons: [
                        { text: 'Cancel', style: 'cancel' },
                        {
                           text: 'Log Out', style: 'destructive', onPress: async () => {
                              try {
                                 await signOut();
                                 navigation.reset({
                                    index: 0,
                                    routes: [{ name: 'Login' as any }],
                                 });
                              } catch (error) {
                                 console.error('Logout error:', error);
                              }
                           }
                        }
                     ]
                  });
               }}
            >
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
                              currentLevel === level.id && { backgroundColor: `${colors.primary}20`, borderColor: colors.primary }
                           ]}
                           onPress={async () => {
                              setCurrentLevelState(level.id);
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
                                 currentLevel === level.id && { borderColor: colors.primary, backgroundColor: colors.primary }
                              ]}>
                                 {currentLevel === level.id && <View style={[styles.levelRadioInner, { backgroundColor: colors.background }]} />}
                              </View>
                              <View style={{ flex: 1 }}>
                                 <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                                    <Text style={[
                                       styles.levelPickerTitle,
                                       { color: colors.text },
                                       currentLevel === level.id && { color: colors.primary }
                                    ]}>{level.title}</Text>
                                    <View style={[styles.levelBadge, { backgroundColor: `${colors.primary}33` }]}>
                                       <Text style={[styles.levelRange, { color: colors.primary }]}>{level.range}</Text>
                                    </View>
                                 </View>
                                 <Text style={[
                                    styles.levelPickerDesc,
                                    { color: colors.textSecondary },
                                    currentLevel === level.id && { color: colors.primary }
                                 ]}>{level.description}</Text>
                              </View>
                           </View>
                        </TouchableOpacity>
                     ))}
                  </ScrollView>
               </View>
            </TouchableOpacity>
         </Modal>

         {/* Auto-Mark Picker Modal */}
         <Modal
            visible={showAutoMarkPicker}
            transparent
            animationType="fade"
            onRequestClose={() => setShowAutoMarkPicker(false)}
         >
            <TouchableOpacity
               style={styles.modalOverlay}
               activeOpacity={1}
               onPress={() => setShowAutoMarkPicker(false)}
            >
               <View style={[styles.modalContent, dynamicStyles.modalContent]}>
                  <Text style={[styles.modalTitle, dynamicStyles.text]}>When Notification Arrives</Text>

                  <TouchableOpacity
                     style={[
                        styles.autoMarkOption,
                        { borderBottomColor: colors.border },
                        autoMarkLearned && { backgroundColor: `${colors.primary}20` }
                     ]}
                     onPress={async () => {
                        setAutoMarkLearned(true);
                        await saveNotificationSettings({ autoMarkLearned: true });
                        setShowAutoMarkPicker(false);
                     }}
                  >
                     <View style={styles.autoMarkOptionContent}>
                        <MaterialCommunityIcons
                           name="check-circle"
                           size={24}
                           color={autoMarkLearned ? colors.primary : colors.textSecondary}
                        />
                        <View style={{ flex: 1 }}>
                           <Text style={[styles.autoMarkOptionTitle, { color: autoMarkLearned ? colors.primary : colors.text }]}>
                              Mark as learned
                           </Text>
                           <Text style={[styles.autoMarkOptionDesc, { color: colors.textSecondary }]}>
                              Word will be marked as learned when notification is sent
                           </Text>
                        </View>
                     </View>
                     {autoMarkLearned && (
                        <MaterialIcons name="check" size={24} color={colors.primary} />
                     )}
                  </TouchableOpacity>

                  <TouchableOpacity
                     style={[
                        styles.autoMarkOption,
                        { borderBottomWidth: 0 },
                        !autoMarkLearned && { backgroundColor: `${colors.primary}20` }
                     ]}
                     onPress={async () => {
                        setAutoMarkLearned(false);
                        await saveNotificationSettings({ autoMarkLearned: false });
                        setShowAutoMarkPicker(false);
                     }}
                  >
                     <View style={styles.autoMarkOptionContent}>
                        <MaterialCommunityIcons
                           name="close-circle-outline"
                           size={24}
                           color={!autoMarkLearned ? colors.primary : colors.textSecondary}
                        />
                        <View style={{ flex: 1 }}>
                           <Text style={[styles.autoMarkOptionTitle, { color: !autoMarkLearned ? colors.primary : colors.text }]}>
                              Do not mark
                           </Text>
                           <Text style={[styles.autoMarkOptionDesc, { color: colors.textSecondary }]}>
                              Word will remain in your learning queue
                           </Text>
                        </View>
                     </View>
                     {!autoMarkLearned && (
                        <MaterialIcons name="check" size={24} color={colors.primary} />
                     )}
                  </TouchableOpacity>
               </View>
            </TouchableOpacity>
         </Modal>

         {/* Image Picker Modal */}
         <Modal
            visible={showImagePickerModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowImagePickerModal(false)}
         >
            <TouchableOpacity
               style={styles.modalOverlay}
               activeOpacity={1}
               onPress={() => setShowImagePickerModal(false)}
            >
               <View style={[styles.modalContent, dynamicStyles.modalContent]}>
                  <Text style={[styles.modalTitle, dynamicStyles.text]}>Change Profile Photo</Text>

                  <TouchableOpacity
                     style={[styles.imagePickerOption, { borderBottomColor: colors.border }]}
                     onPress={takePhotoWithCamera}
                  >
                     <View style={[styles.imagePickerIcon, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                        <MaterialIcons name="camera-alt" size={24} color={colors.primary} />
                     </View>
                     <Text style={[styles.imagePickerOptionText, dynamicStyles.text]}>Take Photo</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                     style={[styles.imagePickerOption, { borderBottomColor: colors.border }]}
                     onPress={pickImageFromGallery}
                  >
                     <View style={[styles.imagePickerIcon, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                        <MaterialIcons name="photo-library" size={24} color={colors.primary} />
                     </View>
                     <Text style={[styles.imagePickerOptionText, dynamicStyles.text]}>Choose from Gallery</Text>
                  </TouchableOpacity>

                  {profile.image && (
                     <TouchableOpacity
                        style={[styles.imagePickerOption, { borderBottomWidth: 0 }]}
                        onPress={removeProfileImage}
                     >
                        <View style={[styles.imagePickerIcon, { backgroundColor: 'rgba(255,59,48,0.1)' }]}>
                           <MaterialIcons name="delete" size={24} color={colors.error} />
                        </View>
                        <Text style={[styles.imagePickerOptionText, { color: colors.error }]}>Remove Photo</Text>
                     </TouchableOpacity>
                  )}

                  <TouchableOpacity
                     style={[styles.cancelButton, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
                     onPress={() => setShowImagePickerModal(false)}
                  >
                     <Text style={[styles.cancelButtonText, dynamicStyles.text]}>Cancel</Text>
                  </TouchableOpacity>
               </View>
            </TouchableOpacity>
         </Modal>

         {/* Edit Profile Modal */}
         <Modal
            visible={showEditProfileModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowEditProfileModal(false)}
         >
            <TouchableOpacity
               style={styles.modalOverlay}
               activeOpacity={1}
               onPress={() => setShowEditProfileModal(false)}
            >
               <View
                  style={[styles.modalContent, dynamicStyles.modalContent, { width: '90%' }]}
                  onStartShouldSetResponder={() => true}
               >
                  <Text style={[styles.modalTitle, dynamicStyles.text]}>Edit Profile</Text>

                  <View style={styles.inputContainer}>
                     <Text style={[styles.inputLabel, dynamicStyles.textSecondary]}>Name</Text>
                     <TextInput
                        style={[
                           styles.textInput,
                           {
                              backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                              color: colors.text,
                              borderColor: colors.border
                           }
                        ]}
                        value={tempName}
                        onChangeText={setTempName}
                        placeholder="Enter your name"
                        placeholderTextColor={colors.textSecondary}
                     />
                  </View>
                  <View style={styles.modalButtonRow}>
                     <TouchableOpacity
                        style={[styles.modalButton, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
                        onPress={() => setShowEditProfileModal(false)}
                     >
                        <Text style={[styles.modalButtonText, dynamicStyles.text]}>Cancel</Text>
                     </TouchableOpacity>
                     <TouchableOpacity
                        style={[
                           styles.modalButton,
                           { backgroundColor: colors.primary },
                           tempName === profile.name && { opacity: 0.5 }
                        ]}
                        onPress={saveProfileChanges}
                        disabled={tempName === profile.name}
                     >
                        <Text style={[styles.modalButtonText, { color: isDarkMode ? '#000' : '#fff' }]}>Save</Text>
                     </TouchableOpacity>
                  </View>
               </View>
            </TouchableOpacity>
         </Modal>

         {/* Help & FAQ Modal */}
         <Modal
            visible={showHelpModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowHelpModal(false)}
         >
            <TouchableOpacity
               style={styles.modalOverlay}
               activeOpacity={1}
               onPress={() => setShowHelpModal(false)}
            >
               <View
                  style={[styles.modalContent, dynamicStyles.modalContent, { width: '90%', maxHeight: '80%' }]}
                  onStartShouldSetResponder={() => true}
               >
                  <View style={styles.modalHeader}>
                     <Text style={[styles.modalTitle, dynamicStyles.text]}>Help & FAQ</Text>
                     <TouchableOpacity onPress={() => setShowHelpModal(false)}>
                        <MaterialIcons name="close" size={24} color={colors.textSecondary} />
                     </TouchableOpacity>
                  </View>
                  <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
                     <View style={styles.faqItem}>
                        <Text style={[styles.faqQuestion, dynamicStyles.text]}>How do I learn new words?</Text>
                        <Text style={[styles.faqAnswer, dynamicStyles.textSecondary]}>Swipe right to mark as learned, left to skip.</Text>
                     </View>
                     <View style={styles.faqItem}>
                        <Text style={[styles.faqQuestion, dynamicStyles.text]}>How do reminders work?</Text>
                        <Text style={[styles.faqAnswer, dynamicStyles.textSecondary]}>Enable in Settings to get notifications.</Text>
                     </View>
                     <View style={styles.faqItem}>
                        <Text style={[styles.faqQuestion, dynamicStyles.text]}>Can I change my level?</Text>
                        <Text style={[styles.faqAnswer, dynamicStyles.textSecondary]}>Yes! Go to Progress - Change Level.</Text>
                     </View>
                     <View style={[styles.faqItem, { borderBottomWidth: 0 }]}>
                        <Text style={[styles.faqQuestion, dynamicStyles.text]}>Need more help?</Text>
                        <Text style={[styles.faqAnswer, dynamicStyles.textSecondary]}>Contact support@vocbee.com</Text>
                     </View>
                  </ScrollView>
               </View>
            </TouchableOpacity>
         </Modal>

         {/* Privacy Policy Modal */}
         <Modal
            visible={showPrivacyModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowPrivacyModal(false)}
         >
            <TouchableOpacity
               style={styles.modalOverlay}
               activeOpacity={1}
               onPress={() => setShowPrivacyModal(false)}
            >
               <View
                  style={[styles.modalContent, dynamicStyles.modalContent, { width: '90%', maxHeight: '80%' }]}
                  onStartShouldSetResponder={() => true}
               >
                  <View style={styles.modalHeader}>
                     <Text style={[styles.modalTitle, dynamicStyles.text]}>Privacy Policy</Text>
                     <TouchableOpacity onPress={() => setShowPrivacyModal(false)}>
                        <MaterialIcons name="close" size={24} color={colors.textSecondary} />
                     </TouchableOpacity>
                  </View>
                  <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
                     <Text style={[styles.policyDate, dynamicStyles.textSecondary]}>Last updated: December 2024</Text>
                     <View style={styles.policySection}>
                        <Text style={[styles.policyHeading, dynamicStyles.text]}>1. Data Collection</Text>
                        <Text style={[styles.policyText, dynamicStyles.textSecondary]}>VocBee stores all data locally on your device.</Text>
                     </View>
                     <View style={styles.policySection}>
                        <Text style={[styles.policyHeading, dynamicStyles.text]}>2. Data Usage</Text>
                        <Text style={[styles.policyText, dynamicStyles.textSecondary]}>Used only for tracking progress and sending reminders.</Text>
                     </View>
                     <View style={styles.policySection}>
                        <Text style={[styles.policyHeading, dynamicStyles.text]}>3. Your Rights</Text>
                        <Text style={[styles.policyText, dynamicStyles.textSecondary]}>Delete data via Reset Progress or uninstall.</Text>
                     </View>
                     <View style={[styles.policySection, { marginBottom: 0 }]}>
                        <Text style={[styles.policyHeading, dynamicStyles.text]}>4. Contact</Text>
                        <Text style={[styles.policyText, dynamicStyles.textSecondary]}>privacy@vocbee.com</Text>
                     </View>
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
   avatarPlaceholder: {
      alignItems: 'center',
      justifyContent: 'center',
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
   autoMarkOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      borderBottomWidth: 1,
      borderRadius: 12,
      marginBottom: 8,
   },
   autoMarkOptionContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
   },
   autoMarkOptionTitle: {
      fontFamily: FONT_FAMILY,
      fontSize: 16,
      marginBottom: 4,
   },
   autoMarkOptionDesc: {
      fontFamily: FONT_FAMILY,
      fontSize: 13,
   },
   // Profile Modal Styles
   imagePickerOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      borderBottomWidth: 1,
      gap: 16,
   },
   imagePickerIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
   },
   imagePickerOptionText: {
      fontFamily: FONT_FAMILY,
      fontSize: 16,
   },
   cancelButton: {
      marginTop: 16,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
   },
   cancelButtonText: {
      fontFamily: FONT_FAMILY,
      fontSize: 16,
   },
   inputContainer: {
      marginBottom: 16,
   },
   inputLabel: {
      fontFamily: FONT_FAMILY,
      fontSize: 14,
      marginBottom: 8,
   },
   textInput: {
      fontFamily: FONT_FAMILY,
      fontSize: 16,
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderRadius: 12,
      borderWidth: 1,
   },
   modalButtonRow: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 8,
   },
   modalButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
   },
   modalButtonText: {
      fontFamily: FONT_FAMILY,
      fontSize: 16,
   },
   // Help & Privacy Modal Styles
   modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
   },
   modalScroll: {
      maxHeight: 400,
   },
   faqItem: {
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(128,128,128,0.2)',
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
   policyDate: {
      fontFamily: FONT_FAMILY,
      fontSize: 12,
      marginBottom: 16,
   },
   policySection: {
      marginBottom: 20,
   },
   policyHeading: {
      fontFamily: FONT_FAMILY,
      fontSize: 16,
      marginBottom: 8,
   },
   policyText: {
      fontFamily: FONT_FAMILY,
      fontSize: 14,
      lineHeight: 20,
   },
});
