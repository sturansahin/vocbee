import {
  buildStoredProfileFromAuth,
  buildStoredProfileFromFirestore,
  resolveGoogleAuthResponse,
} from '../socialAuthProfile';

describe('socialAuthProfile', () => {
  describe('resolveGoogleAuthResponse', () => {
    it('resolves success from exchanged params id_token', () => {
      expect(
        resolveGoogleAuthResponse({
          type: 'success',
          params: { id_token: 'token-from-params' },
        })
      ).toEqual({
        type: 'success',
        idToken: 'token-from-params',
      });
    });

    it('resolves success from authentication idToken fallback', () => {
      expect(
        resolveGoogleAuthResponse({
          type: 'success',
          authentication: { idToken: 'token-from-authentication' },
        })
      ).toEqual({
        type: 'success',
        idToken: 'token-from-authentication',
      });
    });

    it('returns an error when success response lacks an id token', () => {
      expect(
        resolveGoogleAuthResponse({
          type: 'success',
          params: {},
        })
      ).toEqual({
        type: 'error',
        message: 'No Google ID token received.',
      });
    });
  });

  describe('buildStoredProfileFromAuth', () => {
    it('prefers provider values and falls back to email prefix', () => {
      expect(
        buildStoredProfileFromAuth({
          email: 'vocbee@example.com',
          preferredDisplayName: 'VocBee User',
          preferredPhotoURL: 'https://image.example/profile.png',
        })
      ).toEqual({
        name: 'VocBee User',
        image: 'https://image.example/profile.png',
        email: 'vocbee@example.com',
      });

      expect(
        buildStoredProfileFromAuth({
          email: 'relay-user@example.com',
        })
      ).toEqual({
        name: 'relay-user',
        image: null,
        email: 'relay-user@example.com',
      });
    });
  });

  describe('buildStoredProfileFromFirestore', () => {
    it('keeps existing profile values when firestore is still sparse', () => {
      expect(
        buildStoredProfileFromFirestore({
          existingProfile: {
            name: 'Existing Name',
            image: 'https://image.example/existing.png',
            email: 'existing@example.com',
          },
          email: 'existing@example.com',
          firestoreDisplayName: '',
          hasFirestorePhotoURL: false,
        })
      ).toEqual({
        name: 'Existing Name',
        image: 'https://image.example/existing.png',
        email: 'existing@example.com',
      });
    });

    it('applies explicit firestore photo removal when the field exists', () => {
      expect(
        buildStoredProfileFromFirestore({
          existingProfile: {
            name: 'Existing Name',
            image: 'https://image.example/existing.png',
            email: 'existing@example.com',
          },
          email: 'existing@example.com',
          firestoreDisplayName: 'Existing Name',
          firestorePhotoURL: null,
          hasFirestorePhotoURL: true,
        })
      ).toEqual({
        name: 'Existing Name',
        image: null,
        email: 'existing@example.com',
      });
    });
  });
});
