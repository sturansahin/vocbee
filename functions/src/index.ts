import {createHash} from "node:crypto";
import {initializeApp} from "firebase-admin/app";
import {FieldValue, getFirestore} from "firebase-admin/firestore";
import {logger, setGlobalOptions} from "firebase-functions";
import {onDocumentWritten} from "firebase-functions/v2/firestore";
import {
  buildLegacyMirrorPlan,
  legacyProgressChanged,
} from "./progressMirror.js";

initializeApp();
setGlobalOptions({maxInstances: 10});

/**
 * Returns a non-reversible identifier suitable for redacted logs.
 * @param {string} uid Firebase Authentication uid.
 * @return {string} Truncated SHA-256 digest.
 */
function uidHash(uid: string): string {
  return createHash("sha256").update(uid).digest("hex").slice(0, 12);
}

export const mirrorLegacyProgressToV2 = onDocumentWritten({
  document: "users/{uid}",
  region: "europe-west1",
  retry: false,
}, async (event) => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();
  if (!after || after.progress == null ||
      !legacyProgressChanged(before, after)) return;
  const syncMeta = after.syncMeta;
  if (syncMeta && typeof syncMeta === "object" &&
      "version" in syncMeta && syncMeta.version === 2) return;

  let plan;
  try {
    plan = buildLegacyMirrorPlan(after.progress);
  } catch (error) {
    logger.warn("Legacy progress mirror skipped invalid data", {
      uidHash: uidHash(event.params.uid),
      reason: error instanceof Error ? error.message : "unknown-error",
    });
    return;
  }

  const db = getFirestore();
  const userReference = db.collection("users").doc(event.params.uid);
  const timestamp = FieldValue.serverTimestamp();
  const batch = db.batch();

  for (const level of plan.levels) {
    batch.set(userReference.collection("progressByLevel").doc(level.level), {
      ...level,
      updatedAt: timestamp,
      updatedByDeviceId: typeof after.lastActiveDeviceId === "string" ?
        after.lastActiveDeviceId : "legacy-client",
      version: 2,
    }, {merge: true});
  }

  const previousMigration = after.progressMigration;
  const migratedAt = previousMigration &&
    typeof previousMigration === "object" &&
    "migratedAt" in previousMigration ?
    previousMigration.migratedAt : timestamp;
  batch.set(userReference, {
    activeLevel: plan.activeLevel,
    schemaVersion: 2,
    lastActiveAt: timestamp,
    progressSummary: {...plan.summary, updatedAt: timestamp},
    progressMigration: {
      state: "mirroring",
      source: "legacy-mirror",
      legacyMirrorEnabled: true,
      migratedAt,
      lastLegacyMirrorAt: timestamp,
    },
  }, {merge: true});

  await batch.commit();
});
