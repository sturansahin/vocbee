import { StyleSheet } from 'react-native';

import { COLORS, FONT_FAMILY } from '@shared/theme';

import { moderateScale, scale, SCREEN_HEIGHT } from './settingsScreenConstants';

export const settingsStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    paddingBottom: scale(8),
    gap: scale(12),
  },
  backButton: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(22),
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: moderateScale(20),
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: scale(44),
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingTop: 24,
    paddingBottom: 40,
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
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: moderateScale(16),
    fontWeight: '500',
  },
  versionText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
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
  pickerItemText: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    textAlign: 'center',
  },
  pickerItemNativeName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  levelPickerItem: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  levelPickerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
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
  imagePickerModalContent: {
    width: '90%',
    maxWidth: 420,
    maxHeight: '85%',
  },
  avatarPickerModalContent: {
    width: '88%',
    maxWidth: 380,
  },
  imagePickerScroll: {
    maxHeight: SCREEN_HEIGHT * 0.58,
  },
  imagePickerScrollContent: {
    paddingBottom: 4,
  },
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
  avatarGrid: {
    gap: 16,
  },
  avatarGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  avatarBareOption: {
    width: '30%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarBareImage: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
  },
  avatarSelectedIcon: {
    position: 'absolute',
    right: 0,
    bottom: 0,
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
});
