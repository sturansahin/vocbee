import * as ImagePicker from 'expo-image-picker';

import type {
  AvatarPickerGateway,
  AvatarPickResult,
  AvatarSource,
} from '../../application/contracts';

const pickerOptions = {
  allowsEditing: true,
  aspect: [1, 1] as [number, number],
  quality: 0.8,
};

export class ExpoAvatarPickerGateway implements AvatarPickerGateway {
  async pick(source: AvatarSource): Promise<AvatarPickResult> {
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') return { status: 'permission-denied' };

    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync(pickerOptions)
        : await ImagePicker.launchImageLibraryAsync({
            ...pickerOptions,
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
          });
    if (result.canceled || !result.assets[0]) return { status: 'cancelled' };
    return { status: 'selected', uri: result.assets[0].uri };
  }
}
