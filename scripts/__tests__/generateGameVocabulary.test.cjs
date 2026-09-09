const assert = require('node:assert/strict');
const {
  appendFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  assertCatalogVersion,
  assertIdParity,
  buildCatalogSet,
  checkOutputs,
  expectedUnityOutputs,
  parseSourceCatalog,
  readSourceCatalog,
  resolveUnityOutput,
  syncOutputs,
  unityMeta,
  verifyLock,
} = require('../generateGameVocabulary.cjs');

const root = path.join(__dirname, '..', '..');

test('builds all compact catalogs deterministically from the locked IDs', () => {
  const first = buildCatalogSet();
  const second = buildCatalogSet();
  const lock = JSON.parse(
    readFileSync(path.join(root, 'scripts', 'gameVocabularyLock.json'), 'utf8'),
  );

  assert.equal(first.outputs.size, 105);
  assert.equal(first.totalBytes, 3_637_397);
  assert.equal(
    Object.values(JSON.parse(first.idsBytes)).reduce((sum, ids) => sum + ids.length, 0),
    5_292,
  );
  assert.deepEqual(first.manifest, second.manifest);
  assert.deepEqual([...first.outputs], [...second.outputs]);
  verifyLock(first, lock);
  for (const contents of first.outputs.values()) {
    const catalog = JSON.parse(contents);
    assert.ok(catalog.words.every((word) => Object.keys(word).join(',') === 'id,word'));
  }
});

test('rejects invalid records, ID drift and same-version content changes', () => {
  for (const words of [
    [
      { id: 1, word: 'one' },
      { id: 1, word: 'duplicate' },
    ],
    [{ id: -1, word: 'negative' }],
    [{ id: Number.MAX_SAFE_INTEGER + 1, word: 'unsafe' }],
    [{ id: 1, word: ' ' }],
  ]) {
    assert.throws(() => parseSourceCatalog(JSON.stringify({ words }), 'fixture'));
  }
  assert.throws(() => assertIdParity([{ id: 1 }], [{ id: 2 }], 'A1', 'english'), /word IDs differ/);
  assert.throws(
    () =>
      assertCatalogVersion(
        { catalogVersion: 1, catalogHash: 'old' },
        { catalogVersion: 1, catalogHash: 'new' },
      ),
    /increment CATALOG_VERSION/,
  );
  const build = buildCatalogSet();
  assert.throws(
    () =>
      verifyLock(build, {
        schemaVersion: 1,
        catalogVersion: 1,
        catalogHash: 'changed',
        identity: build.identityLock,
      }),
    /Catalog lock differs/,
  );
  assert.throws(
    () =>
      verifyLock(build, {
        schemaVersion: 1,
        catalogVersion: 1,
        catalogHash: build.manifest.catalogHash,
        identity: { ...build.identityLock, sha256: 'changed' },
      }),
    /Stable ID lock changed/,
  );
  const empty = mkdtempSync(path.join(tmpdir(), 'vocbee-missing-catalog-'));
  try {
    assert.throws(() => readSourceCatalog(empty, 'english', 'A1'), /source file is missing/);
  } finally {
    rmSync(empty, { recursive: true, force: true });
  }
});

test('syncs only the controlled Unity folder and detects manual edits', () => {
  const project = mkdtempSync(path.join(tmpdir(), 'vocbee-unity-'));
  try {
    mkdirSync(path.join(project, 'ProjectSettings'));
    mkdirSync(path.join(project, 'Assets', 'VocBee', 'Resources'), { recursive: true });
    writeFileSync(
      path.join(project, 'ProjectSettings', 'ProjectVersion.txt'),
      'm_EditorVersion: test\n',
    );
    const output = resolveUnityOutput(project);
    const build = buildCatalogSet();
    const expected = expectedUnityOutputs(build);
    const folderMeta = unityMeta('Vocabulary', true);

    assert.equal(expected.size, 212);
    syncOutputs(output, expected, folderMeta);
    checkOutputs(output, expected, folderMeta);
    appendFileSync(path.join(output, 'english_A1.bytes'), 'edited');
    assert.throws(() => checkOutputs(output, expected, folderMeta), /english_A1.bytes/);
  } finally {
    rmSync(project, { recursive: true, force: true });
  }
});
