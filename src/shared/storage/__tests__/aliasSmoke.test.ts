// Phase 1 smoke test: verifies the @shared alias resolves (tsconfig + jest moduleNameMapper + babel)
// and that the moved storage keys are byte-identical (behavior contract — docs/refactor-v2/03, /21 §9).
import { STORAGE_KEYS } from '@shared/storage';
import { AppError, isAppError } from '@shared/errors';

describe('Phase 1 — @shared alias + storage-key preservation', () => {
    it('resolves @shared/storage barrel', () => {
        expect(typeof STORAGE_KEYS).toBe('object');
    });

    it('preserves critical storage key string values (no behavior change)', () => {
        expect(STORAGE_KEYS.HAS_SEEN_ONBOARDING).toBe('@VocBee:hasSeenOnboarding');
        expect(STORAGE_KEYS.PROGRESS).toBe('@user_progress');
        expect(STORAGE_KEYS.DEVICE_ID).toBe('@vocbee_device_id');
        expect(STORAGE_KEYS.SYNC_FLAG).toBe('@vocbee_needs_sync');
        expect(STORAGE_KEYS.NOTIFICATION_CONTENT_VERSION).toBe('@notification_content_version');
        expect(STORAGE_KEYS.FAVORITES_PREFIX).toBe('@favorites');
        expect(STORAGE_KEYS.PROFILE_PREFIX).toBe('profile_');
    });

    it('resolves @shared/errors barrel (new AppError)', () => {
        const err = new AppError('boom', { code: 'storage' });
        expect(isAppError(err)).toBe(true);
        expect(err.code).toBe('storage');
        expect(err.message).toBe('boom');
    });
});

// Verify the old service paths (now shims) still expose the same keys.
import { STORAGE_KEYS as SHIM_KEYS } from '../../../../services/storageKeys';

describe('Phase 1 — storage shim parity', () => {
    it('old services/storageKeys path re-exports identical values', () => {
        expect(SHIM_KEYS.PROGRESS).toBe(STORAGE_KEYS.PROGRESS);
        expect(SHIM_KEYS).toEqual(STORAGE_KEYS);
    });
});
