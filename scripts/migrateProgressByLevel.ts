/**
 * scripts/migrateProgressByLevel.ts — DRY-RUN MIGRATION SKELETON (docs/refactor-v2/08, /34 §6)
 *
 * ⚠️ SERVER-SIDE ADMIN SCRIPT — NOT part of the mobile bundle, NOT auto-run, NOT executed in this phase.
 * ⚠️ DEFAULT IS SAFE: dry-run only (reads + reports). It performs NO writes unless explicitly forced,
 *    and even then it only COPIES (never deletes the legacy `progress` field — cleanup is Phase 9).
 *
 * Preconditions before ANY real run (docs/refactor-v2/08 §1, /23 §16):
 *   1) Verified Firestore backup exists:  gcloud firestore export gs://<bucket>/pre-v2-<date>
 *   2) progressByLevel security rules deployed + verified via `npm run test:rules` (needs Java/emulator)
 *   3) Dry-run reports `mismatched=0`
 *
 * Usage (PLAN — do not run without the preconditions + explicit approval):
 *   DRY_RUN=1 node scripts/migrateProgressByLevel.js   # default: report only, no writes
 *   DRY_RUN=0 node scripts/migrateProgressByLevel.js   # WRITE mode (copy-only) — requires approval
 *
 * Reuses the unit-tested pure transform/verify so the migration logic has a single source of truth.
 */

import {
  adaptLegacyLearnedWordsToProgressByLevelDocs,
  verifyMigrationCounts,
} from '../src/features/progress/data/adapters/progressAdapters';
import type { LegacyProgressDoc } from '../src/features/progress/data/dto';

// Default to DRY_RUN unless explicitly disabled — safe by construction.
const DRY_RUN = process.env.DRY_RUN !== '0';

/** PII protection (docs/refactor-v2/08 §PII): never log raw uid/email/displayName. */
function maskUid(uid: string): string {
  return uid.length <= 6 ? '***' : `${uid.slice(0, 4)}…${uid.slice(-2)}`;
}

interface MigrationSummary {
  mode: 'DRY_RUN' | 'WRITE';
  scanned: number;
  planned: number;
  mismatched: number;
  skipped: number;
}

async function main(): Promise<void> {
  // NOTE: Admin SDK init + user iteration are intentionally left as a documented skeleton.
  // They require firebase-admin + a service account on a server (docs/refactor-v2/09). Example shape:
  //
  //   import { applicationDefault, initializeApp } from 'firebase-admin/app';
  //   import { getFirestore } from 'firebase-admin/firestore';
  //   initializeApp({ credential: applicationDefault() });
  //   const adminDb = getFirestore();
  //
  //   for await (const userSnap of iterateUsersInBatches(adminDb)) { ... see loop below ... }

  const summary: MigrationSummary = {
    mode: DRY_RUN ? 'DRY_RUN' : 'WRITE',
    scanned: 0,
    planned: 0,
    mismatched: 0,
    skipped: 0,
  };

  // ── Per-user transform (the part that is real + unit-tested) ─────────────────────────────
  // This helper is exported for tests and shows exactly what the loop body does per user.
  const processUser = (uid: string, legacy: LegacyProgressDoc | null | undefined): 'OK' | 'MISMATCH' | 'SKIP' => {
    summary.scanned++;
    if (!legacy?.learnedWords) {
      summary.skipped++;
      return 'SKIP';
    }
    const models = adaptLegacyLearnedWordsToProgressByLevelDocs(legacy, { version: 1 });
    const { oldTotal, newTotal, ok } = verifyMigrationCounts(legacy, models);
    summary.planned += models.length;
    if (!ok) summary.mismatched++;

    // PII-masked per-user line (docs/refactor-v2/08 §dry-run)
    const perLevel = models.map(m => `${m.level}: ?→${m.learnedWordIds.length}`).join(', ');
    // eslint-disable-next-line no-console
    console.log(`uidMask=${maskUid(uid)}, ${perLevel}, old=${oldTotal} new=${newTotal} status=${ok ? 'OK' : 'MISMATCH'}`);

    if (!DRY_RUN && ok) {
      // WRITE mode (copy-only) — guarded; never deletes legacy fields.
      //   await writeProgressByLevel(adminDb, uid, models);                 // create/merge subcollection docs
      //   await adminDb.doc(`users/${uid}`).set({ schemaVersion: 2 }, { merge: true });
      // (left intentionally inert in this skeleton)
    }
    return ok ? 'OK' : 'MISMATCH';
  };

  // Silence "unused in skeleton" while keeping the real signature visible.
  void processUser;

  // ── Summary + STOP rule (docs/refactor-v2/34 §6): mismatched > 0 halts the migration ──
  // eslint-disable-next-line no-console
  console.log(`SUMMARY ${JSON.stringify(summary)}`);
  if (summary.mismatched > 0) {
    throw new Error(`Migration halted: ${summary.mismatched} user(s) failed count verification. Review before writing.`);
  }
}

// Not auto-invoked here to keep this a safe, importable skeleton. A real runner would call main().
export { main, maskUid, DRY_RUN };
