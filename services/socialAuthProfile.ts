import type { AuthSessionResult } from 'expo-auth-session';

export interface StoredProfile {
  name: string;
  image: string | null;
  email: string;
}

interface StoredProfileLike {
  name?: string | null;
  image?: string | null;
  email?: string | null;
}

interface AuthProfileInput {
  existingProfile?: StoredProfileLike | null;
  email?: string | null;
  authDisplayName?: string | null;
  authPhotoURL?: string | null;
  preferredDisplayName?: string | null;
  preferredPhotoURL?: string | null;
}

interface FirestoreProfileInput {
  existingProfile?: StoredProfileLike | null;
  email?: string | null;
  firestoreDisplayName?: string | null;
  firestorePhotoURL?: string | null;
  hasFirestorePhotoURL?: boolean;
  authDisplayName?: string | null;
  authPhotoURL?: string | null;
}

type GoogleAuthResponseLike = AuthSessionResult | null | undefined;

export type GoogleAuthResponseResolution =
  | { type: 'pending' }
  | { type: 'cancelled' }
  | { type: 'success'; idToken: string }
  | { type: 'error'; message: string };

const normalizeString = (value?: string | null): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const getEmailFallbackName = (email?: string | null): string | null => {
  const normalizedEmail = normalizeString(email);
  if (!normalizedEmail) {
    return null;
  }

  const [localPart] = normalizedEmail.split('@');
  return normalizeString(localPart);
};

const getPreferredName = (
  ...candidates: Array<string | null | undefined>
): string => {
  for (const candidate of candidates) {
    const normalized = normalizeString(candidate);
    if (normalized) {
      return normalized;
    }
  }

  return 'User';
};

export const buildStoredProfileFromAuth = ({
  existingProfile,
  email,
  authDisplayName,
  authPhotoURL,
  preferredDisplayName,
  preferredPhotoURL,
}: AuthProfileInput): StoredProfile => {
  const normalizedEmail =
    normalizeString(email) ?? normalizeString(existingProfile?.email) ?? '';

  const name = getPreferredName(
    preferredDisplayName,
    authDisplayName,
    existingProfile?.name,
    getEmailFallbackName(normalizedEmail)
  );

  let image: string | null = null;
  const preferredImage = normalizeString(preferredPhotoURL);
  const authImage = normalizeString(authPhotoURL);

  if (preferredImage) {
    image = preferredImage;
  } else if (preferredPhotoURL === null) {
    image = null;
  } else if (authImage) {
    image = authImage;
  } else if (Object.prototype.hasOwnProperty.call(existingProfile ?? {}, 'image')) {
    image = existingProfile?.image ?? null;
  }

  return {
    name,
    image,
    email: normalizedEmail,
  };
};

export const buildStoredProfileFromFirestore = ({
  existingProfile,
  email,
  firestoreDisplayName,
  firestorePhotoURL,
  hasFirestorePhotoURL = false,
  authDisplayName,
  authPhotoURL,
}: FirestoreProfileInput): StoredProfile => {
  const normalizedEmail =
    normalizeString(email) ?? normalizeString(existingProfile?.email) ?? '';

  const name = getPreferredName(
    firestoreDisplayName,
    authDisplayName,
    existingProfile?.name,
    getEmailFallbackName(normalizedEmail)
  );

  let image: string | null = null;
  if (hasFirestorePhotoURL) {
    image = normalizeString(firestorePhotoURL) ?? null;
  } else {
    image =
      normalizeString(authPhotoURL) ??
      existingProfile?.image ??
      null;
  }

  return {
    name,
    image,
    email: normalizedEmail,
  };
};

export const resolveGoogleAuthResponse = (
  response: GoogleAuthResponseLike
): GoogleAuthResponseResolution => {
  if (!response?.type) {
    return { type: 'pending' };
  }

  if (response.type === 'cancel' || response.type === 'dismiss') {
    return { type: 'cancelled' };
  }

  if (response.type === 'error') {
    return {
      type: 'error',
      message: response.error?.message || 'Google Sign-In did not complete successfully.',
    };
  }

  if (response.type !== 'success') {
    return {
      type: 'error',
      message: 'Google Sign-In did not complete successfully.',
    };
  }

  const idToken =
    normalizeString(response.params?.id_token) ??
    normalizeString(response.authentication?.idToken);

  if (!idToken) {
    return {
      type: 'error',
      message: 'No Google ID token received.',
    };
  }

  return {
    type: 'success',
    idToken,
  };
};
