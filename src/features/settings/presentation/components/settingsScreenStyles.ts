import { StyleSheet } from 'react-native';

import { FONT_FAMILY } from '@shared/theme';

export const settingsStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 24,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 8,
  },
  sectionCard: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  sectionSpacing: {
    marginBottom: 24,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '500',
  },
  versionText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
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
    maxHeight: 520,
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
});
