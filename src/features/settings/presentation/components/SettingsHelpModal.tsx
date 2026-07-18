import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import type { SettingsScreenController } from '../hooks/useSettingsScreenController';
import { settingsStyles as styles } from './settingsScreenStyles';

const FAQ_KEYS = [
  ...Array.from({ length: 5 }, (_, index) => `help.basics.${index + 1}`),
  ...Array.from({ length: 3 }, (_, index) => `help.levels.${index + 1}`),
  ...Array.from({ length: 2 }, (_, index) => `help.reminders.${index + 1}`),
  ...Array.from({ length: 3 }, (_, index) => `help.data.${index + 1}`),
];

interface SettingsHelpModalProps {
  controller: SettingsScreenController;
}

export function SettingsHelpModal({ controller: c }: SettingsHelpModalProps) {
  return (
    <Modal
      visible={c.showHelpModal}
      transparent
      animationType="fade"
      onRequestClose={() => c.setShowHelpModal(false)}
    >
      <View style={styles.modalOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => c.setShowHelpModal(false)} />
        <View
          style={[
            styles.modalContent,
            {
              width: '90%',
              maxHeight: '80%',
              backgroundColor: c.colors.surface,
              borderColor: c.colors.border,
            },
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: c.colors.text, marginBottom: 0 }]}>
              {c.t('help.title')}
            </Text>
            <TouchableOpacity onPress={() => c.setShowHelpModal(false)}>
              <MaterialIcons name="close" size={24} color={c.colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView
            showsVerticalScrollIndicator
            style={styles.modalScroll}
            nestedScrollEnabled
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            {FAQ_KEYS.map((key) => {
              const [group, number] = key.replace('help.', '').split('.');
              return (
                <View key={key} style={styles.faqItem}>
                  <Text style={[styles.faqQuestion, { color: c.colors.text }]}>
                    {c.t(`help.${group}.q${number}`)}
                  </Text>
                  <Text style={[styles.faqAnswer, { color: c.colors.textSecondary }]}>
                    {c.t(`help.${group}.a${number}`)}
                  </Text>
                </View>
              );
            })}
            <View style={[styles.faqItem, { borderBottomWidth: 0 }]}>
              <Text style={[styles.faqQuestion, { color: c.colors.text }]}>
                {c.t('help.support.title')}
              </Text>
              <Text style={[styles.faqAnswer, { color: c.colors.textSecondary }]}>
                {c.t('help.support.desc')}
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
