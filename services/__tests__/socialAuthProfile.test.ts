import {
  buildStoredProfileFromAuth,
  buildStoredProfileFromFirestore,
} from '../socialAuthProfile';

describe('socialAuthProfile', () => {
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

    it('keeps an existing user-selected profile image on auth refresh', () => {
      expect(
        buildStoredProfileFromAuth({
          existingProfile: {
            name: 'Existing User',
            image: 'vocbee-avatar:avatar2',
            email: 'vocbee@example.com',
          },
          email: 'vocbee@example.com',
          authDisplayName: 'Provider Name',
          authPhotoURL: 'https://image.example/provider.png',
        })
      ).toEqual({
        name: 'Provider Name',
        image: 'vocbee-avatar:avatar2',
        email: 'vocbee@example.com',
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
