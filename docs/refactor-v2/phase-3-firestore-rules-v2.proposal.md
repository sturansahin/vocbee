# Phase 3 — Firestore Security Rules v2 (PROPOSAL)

> **STATUS: PROPOSAL — NOT APPLIED.** The live `firestore.rules` was **NOT modified** in Phase 3.
>
> **Why a proposal instead of editing `firestore.rules`?** Validating Firestore rules requires the Firestore
> emulator, which needs a **JDK (Java)**. This environment has **no Java** (verified in Phase 0), so
> `npm run test:rules` cannot run here. `firestore.rules` protects production user data; changing it
> **without emulator verification** is unsafe. These additions are therefore staged here for review and must
> be applied to `firestore.rules` + verified with `npm run test:rules` (on a machine with Java) **before**
> any deploy and **before** dual-write is enabled (docs/refactor-v2/34 §7 ordering, /23, /09).

These additions are **purely additive** and preserve all existing protections (the strict `validUserDocument`
`hasOnly` contract and the catch-all `match /{document=**} { allow read, write: if false }` are kept).

## 1. New helper + progressByLevel subcollection rule (docs/refactor-v2/34 §7)

```js
// add alongside existing helpers (signedIn / isOwner / has / optionalString ...)
function validLevelId(level) {
  return level in ['A1', 'A2', 'B1', 'B2', 'C1'];
}

function validProgressByLevel(data) {
  return data.keys().hasOnly([
           'level','learnedWordIds','favoriteWordIds','wrongWordIds',
           'lastWordIndex','learnedCount','updatedAt','updatedByDeviceId','version'
         ])
      && data.level is string && validLevelId(data.level)
      && data.learnedWordIds is list
      && data.lastWordIndex is int && data.lastWordIndex >= 0
      && data.learnedCount is int && data.learnedCount >= 0
      && (!has(data, 'favoriteWordIds') || data.favoriteWordIds is list)
      && (!has(data, 'wrongWordIds') || data.wrongWordIds is list)
      && (!has(data, 'updatedAt') || data.updatedAt is timestamp)
      && optionalString(data, 'updatedByDeviceId', 120)
      && (!has(data, 'version') || (data.version is int && data.version >= 1));
}

match /users/{userId} {
  // ... existing validUserDocument-based create/update/read/delete rules stay UNCHANGED ...

  match /progressByLevel/{level} {
    allow read: if isOwner(userId);
    allow create, update: if isOwner(userId)
                          && validLevelId(level)
                          && request.resource.data.level == level
                          && validProgressByLevel(request.resource.data);
    allow delete: if isOwner(userId);   // reset / cleanup
  }
}

// match /{document=**} { allow read, write: if false; }   // KEEP (unchanged)
```

## 2. Main-doc `hasOnly` extension (for v2 fields — docs/refactor-v2/07 §3)

When dual-write begins, `validUserDocument`'s `hasOnly([...])` list must additionally allow:
`schemaVersion`, `lastActiveAt`, `progressSummary` (otherwise the client write is rejected). Suggested validators:

```js
&& (!has(data, 'schemaVersion') || data.schemaVersion == 2)
&& (!has(data, 'lastActiveAt') || data.lastActiveAt is timestamp)
&& (!has(data, 'progressSummary') || data.progressSummary is map)
```

> ⚠️ Until this extension is deployed, clients must NOT write `schemaVersion`/`progressSummary`/`lastActiveAt`
> to the main doc — Phase 3 does not enable that write.

## 3. Emulator test skeleton (merge into `tests/firestoreRules.ts` when applied; run with `npm run test:rules`)

```ts
describe('users/{uid}/progressByLevel/{level}', () => {
  it('allows owner to write a valid level doc', async () => {
    const db = testEnv.authenticatedContext('user-a').firestore();
    await assertSucceeds(setDoc(doc(db, 'users/user-a/progressByLevel/A1'), {
      level: 'A1', learnedWordIds: [1, 2, 3], lastWordIndex: 3, learnedCount: 3,
      updatedAt: new Date(), updatedByDeviceId: 'device-a', version: 1,
    }));
  });
  it('denies cross-user write', async () => {
    const other = testEnv.authenticatedContext('other').firestore();
    await assertFails(setDoc(doc(other, 'users/user-a/progressByLevel/A1'),
      { level: 'A1', learnedWordIds: [], lastWordIndex: 0, learnedCount: 0, updatedAt: new Date() }));
  });
  it('denies invalid level id and bad field types', async () => {
    const db = testEnv.authenticatedContext('user-a').firestore();
    await assertFails(setDoc(doc(db, 'users/user-a/progressByLevel/C2'),
      { level: 'C2', learnedWordIds: [], lastWordIndex: 0, learnedCount: 0, updatedAt: new Date() }));
    await assertFails(setDoc(doc(db, 'users/user-a/progressByLevel/A1'),
      { level: 'A1', learnedWordIds: 'nope', lastWordIndex: -1, learnedCount: 0, updatedAt: new Date() }));
  });
});
```

## 4. Index requirements
`progressByLevel/{level}` is accessed by document id → **no composite index required** (docs/refactor-v2/34 §8).
`firestore.indexes.json` is still not needed for this phase.

## 5. Apply checklist (future PR-3.4, with Java available)
- [ ] Merge §1 + §2 into `firestore.rules`.
- [ ] Merge §3 into `tests/firestoreRules.ts`.
- [ ] `npm run typecheck:rules` green.
- [ ] `npm run test:rules` green (emulator, requires Java).
- [ ] Deploy rules (`firebase deploy --only firestore:rules`) BEFORE enabling dual-write.
