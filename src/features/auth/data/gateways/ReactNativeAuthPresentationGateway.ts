import { Linking } from 'react-native';

import type { AuthPresentationGateway } from '../../application/presentationContracts';

const PRIVACY_POLICY_URL = 'https://vocbee.online/privacypolicy';

export class ReactNativeAuthPresentationGateway implements AuthPresentationGateway {
  async openPrivacyPolicy(): Promise<void> {
    await Linking.openURL(PRIVACY_POLICY_URL);
  }
}
