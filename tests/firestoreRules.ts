import fs from 'fs';
import path from 'path';
import {
  RulesTestEnvironment,
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import { deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';

const PROJECT_ID = 'vocbee-rules-test';

let testEnv: RulesTestEnvironment;

const validUserDocument = () => ({
  email: 'owner@example.com',
  displayName: 'Owner',
  photoURL: null,
  createdAt: new Date(),
  setupCompleted: false,
  preferences: null,
  progress: null,
  streak: null,
});

const validLevelProgress = (level = 'A1') => ({
  level,
  learnedWordIds: [1, 2, 3],
  lastWordId: 3,
  learnedCount: 3,
  vocabularySchemaVersion: 2,
  updatedAt: new Date(),
  updatedByDeviceId: 'device-a',
  version: 2,
});

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: fs.readFileSync(path.join(process.cwd(), 'firestore.rules'), 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  });
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe('firestore.rules users/{uid}', () => {
  it('allows an authenticated user to create, read, update and delete their own document', async () => {
    const db = testEnv.authenticatedContext('user-a').firestore();
    const userRef = doc(db, 'users/user-a');

    await assertSucceeds(setDoc(userRef, validUserDocument()));
    await assertSucceeds(getDoc(userRef));
    await assertSucceeds(
      setDoc(userRef, {
        ...validUserDocument(),
        setupCompleted: true,
        preferences: {
          nativeLanguage: 'turkish',
          targetLanguage: 'english',
          level: 'beginner',
        },
        progress: {
          currentLevel: 'A1',
          learnedWords: { A1: [1, 2, 3] },
          lastWordIndex: 3,
          lastSync: new Date(),
        },
        streak: {
          currentStreak: 2,
          longestStreak: 4,
          brokenStreak: null,
          lastQualifiedDay: '2026-05-06',
          lastQualifiedAt: '2026-05-06T10:00:00.000Z',
        },
        notificationSettings: {
          enabled: true,
          startHour: 9,
          startMinute: 0,
          endHour: 21,
          endMinute: 0,
          frequencyMinutes: 120,
          autoMarkLearned: true,
        },
        favorites: [{ id: 1, level: 'A1' }],
        syncMeta: {
          version: 1,
          updatedAt: new Date(),
          updatedByDeviceId: 'device-a',
        },
      }),
    );
    await assertSucceeds(deleteDoc(userRef));
  });

  it('denies access to another user document', async () => {
    const ownerDb = testEnv.authenticatedContext('owner').firestore();
    await assertSucceeds(setDoc(doc(ownerDb, 'users/owner'), validUserDocument()));

    const otherDb = testEnv.authenticatedContext('other').firestore();
    await assertFails(getDoc(doc(otherDb, 'users/owner')));
    await assertFails(setDoc(doc(otherDb, 'users/owner'), validUserDocument()));
    await assertFails(deleteDoc(doc(otherDb, 'users/owner')));
  });

  it('denies unauthenticated access', async () => {
    const db = testEnv.unauthenticatedContext().firestore();

    await assertFails(getDoc(doc(db, 'users/user-a')));
    await assertFails(setDoc(doc(db, 'users/user-a'), validUserDocument()));
  });

  it('denies unknown top-level fields', async () => {
    const db = testEnv.authenticatedContext('user-a').firestore();

    await assertFails(
      setDoc(doc(db, 'users/user-a'), {
        ...validUserDocument(),
        role: 'admin',
      }),
    );
  });

  it('denies invalid progress learnedWords type', async () => {
    const db = testEnv.authenticatedContext('user-a').firestore();

    await assertFails(
      setDoc(doc(db, 'users/user-a'), {
        ...validUserDocument(),
        progress: {
          currentLevel: 'A1',
          learnedWords: ['not-a-map'],
          lastWordIndex: 0,
          lastSync: new Date(),
        },
      }),
    );
  });

  it('denies invalid preference level', async () => {
    const db = testEnv.authenticatedContext('user-a').firestore();

    await assertFails(
      setDoc(doc(db, 'users/user-a'), {
        ...validUserDocument(),
        preferences: {
          nativeLanguage: 'turkish',
          targetLanguage: 'english',
          level: 'C2',
        },
      }),
    );
  });

  it('denies negative streak values', async () => {
    const db = testEnv.authenticatedContext('user-a').firestore();

    await assertFails(
      setDoc(doc(db, 'users/user-a'), {
        ...validUserDocument(),
        streak: {
          currentStreak: -1,
          longestStreak: 4,
          brokenStreak: null,
          lastQualifiedDay: '2026-05-06',
          lastQualifiedAt: '2026-05-06T10:00:00.000Z',
        },
      }),
    );
  });

  it('denies invalid sync metadata', async () => {
    const db = testEnv.authenticatedContext('user-a').firestore();

    await assertFails(
      setDoc(doc(db, 'users/user-a'), {
        ...validUserDocument(),
        syncMeta: {
          version: 0,
          updatedAt: 'not-a-timestamp',
          updatedByDeviceId: 'device-a',
        },
      }),
    );
  });

  it('allows the owner to store v2 summary and level progress', async () => {
    const db = testEnv.authenticatedContext('user-a').firestore();
    const userRef = doc(db, 'users/user-a');
    const levelRef = doc(db, 'users/user-a/progressByLevel/A1');

    await assertSucceeds(
      setDoc(userRef, {
        ...validUserDocument(),
        activeLevel: 'A1',
        schemaVersion: 2,
        lastActiveAt: new Date(),
        progressSummary: {
          byLevel: { A1: { learnedCount: 3, totalCount: 100, percent: 3 } },
          totalLearnedCount: 3,
          overallPercent: 3,
          updatedAt: new Date(),
        },
      }),
    );
    await assertSucceeds(setDoc(levelRef, validLevelProgress()));
    await assertSucceeds(getDoc(levelRef));
    await assertSucceeds(deleteDoc(levelRef));
  });

  it('accepts the compact notification-disabled shape written during setup', async () => {
    const db = testEnv.authenticatedContext('user-a').firestore();
    await assertSucceeds(
      setDoc(doc(db, 'users/user-a'), {
        ...validUserDocument(),
        notificationSettings: { enabled: false },
      }),
    );
  });

  it('denies cross-user and unauthenticated v2 progress access', async () => {
    const ownerDb = testEnv.authenticatedContext('owner').firestore();
    const levelRef = doc(ownerDb, 'users/owner/progressByLevel/A1');
    await assertSucceeds(setDoc(levelRef, validLevelProgress()));

    const otherDb = testEnv.authenticatedContext('other').firestore();
    const anonymousDb = testEnv.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(otherDb, 'users/owner/progressByLevel/A1')));
    await assertFails(setDoc(doc(otherDb, 'users/owner/progressByLevel/A1'), validLevelProgress()));
    await assertFails(getDoc(doc(anonymousDb, 'users/owner/progressByLevel/A1')));
  });

  it('denies malformed or mismatched v2 progress documents', async () => {
    const db = testEnv.authenticatedContext('user-a').firestore();

    await assertFails(
      setDoc(doc(db, 'users/user-a/progressByLevel/A1'), { ...validLevelProgress(), level: 'A2' }),
    );
    await assertFails(
      setDoc(doc(db, 'users/user-a/progressByLevel/A1'), {
        ...validLevelProgress(),
        learnedCount: 99,
      }),
    );
    await assertFails(
      setDoc(doc(db, 'users/user-a/progressByLevel/C2'), {
        ...validLevelProgress('C2'),
        version: 1,
      }),
    );
  });

  it('denies client creation or mutation of server-owned migration metadata', async () => {
    const db = testEnv.authenticatedContext('user-a').firestore();
    const userRef = doc(db, 'users/user-a');
    const migration = {
      state: 'backfilled',
      source: 'backfill',
      migratedAt: new Date(),
    };

    await assertFails(setDoc(userRef, { ...validUserDocument(), progressMigration: migration }));
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'users/user-a'), {
        ...validUserDocument(),
        progressMigration: migration,
      });
    });
    await assertSucceeds(setDoc(userRef, { displayName: 'Safe update' }, { merge: true }));
    await assertFails(
      setDoc(
        userRef,
        {
          progressMigration: { ...migration, state: 'verified' },
        },
        { merge: true },
      ),
    );
  });

  it('keeps unknown subcollections denied', async () => {
    const db = testEnv.authenticatedContext('user-a').firestore();
    await assertFails(setDoc(doc(db, 'users/user-a/private/data'), { value: true }));
  });
});
