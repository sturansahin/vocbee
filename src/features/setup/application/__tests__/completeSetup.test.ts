// completeSetup use-case (Firebase-free, fake writer). Verifies validation gate + delegation
// (no direct Firestore) — docs/refactor-v2/37 §9.
import { makeCompleteSetup } from '../useCases/completeSetup';
import type { SetupPreferencesWriter } from '../../data/contracts';
import type { UserPreferences } from '../../domain/types';

const validPrefs: UserPreferences = { nativeLanguage: 'turkish', targetLanguage: 'english', level: 'beginner' };

function makeFakeWriter(): SetupPreferencesWriter {
  return { saveSetupPreferences: jest.fn(async () => undefined) };
}

describe('makeCompleteSetup', () => {
  it('persists via the writer when preferences are valid (no direct Firestore)', async () => {
    const writer = makeFakeWriter();
    await makeCompleteSetup(writer)('uid-1', validPrefs);
    expect(writer.saveSetupPreferences).toHaveBeenCalledWith('uid-1', validPrefs);
  });

  it('throws and does NOT persist when preferences are invalid', async () => {
    const writer = makeFakeWriter();
    const completeSetup = makeCompleteSetup(writer);
    await expect(
      completeSetup('uid-1', { nativeLanguage: 'turkish', targetLanguage: 'english', level: 'A1' })
    ).rejects.toThrow(/invalid language\/level/i);
    expect(writer.saveSetupPreferences).not.toHaveBeenCalled();
  });
});
