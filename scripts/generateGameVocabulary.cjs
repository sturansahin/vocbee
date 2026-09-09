#!/usr/bin/env node

const { createHash } = require('node:crypto');
const {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  writeFileSync,
} = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const SOURCE_DIR = path.join(ROOT, 'assets', 'vocabulary');
const HOST_MANIFEST = path.join(
  ROOT,
  'src',
  'features',
  'game',
  'generated',
  'catalog-manifest.json',
);
const HOST_IDS = path.join(path.dirname(HOST_MANIFEST), 'catalog-ids.json');
const LOCK_FILE = path.join(__dirname, 'gameVocabularyLock.json');
const UNITY_OUTPUT = path.join('Assets', 'VocBee', 'Resources', 'Vocabulary');
const MANIFEST_FILE = 'catalog-manifest.json';
const MANIFEST_SCHEMA_VERSION = 1;
const CATALOG_VERSION = 1;
const LANGUAGES = [
  'amharic',
  'arabic',
  'chinese',
  'english',
  'french',
  'german',
  'hindi',
  'indonesian',
  'italian',
  'japanese',
  'korean',
  'persian',
  'portuguese',
  'russian',
  'serbian',
  'spanish',
  'swahili',
  'thai',
  'turkish',
  'urdu',
  'vietnamese',
];
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function parseSourceCatalog(contents, name) {
  let parsed;
  try {
    parsed = JSON.parse(contents);
  } catch {
    throw new Error(`${name}: invalid JSON`);
  }
  if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.words)) {
    throw new Error(`${name}: words must be an array`);
  }

  const ids = new Set();
  return parsed.words
    .map((entry, index) => {
      if (!entry || typeof entry !== 'object') throw new Error(`${name}: invalid word at ${index}`);
      if (!Number.isSafeInteger(entry.id) || entry.id < 0) {
        throw new Error(`${name}: invalid word ID at ${index}`);
      }
      if (ids.has(entry.id)) throw new Error(`${name}: duplicate word ID ${entry.id}`);
      if (typeof entry.word !== 'string' || !entry.word.trim()) {
        throw new Error(`${name}: empty word at ID ${entry.id}`);
      }
      ids.add(entry.id);
      return { id: entry.id, word: entry.word.trim() };
    })
    .sort((left, right) => left.id - right.id);
}

function readSourceCatalog(sourceDir, language, level) {
  const name = `${language}_${level}.txt`;
  const file = path.join(sourceDir, name);
  if (!existsSync(file)) throw new Error(`${name}: source file is missing`);
  return parseSourceCatalog(readFileSync(file, 'utf8'), name);
}

function assertIdParity(reference, candidate, level, language) {
  if (
    reference.length !== candidate.length ||
    reference.some((word, index) => word.id !== candidate[index].id)
  ) {
    throw new Error(`${language}_${level}: word IDs differ from the ${level} canonical set`);
  }
}

function createIdentityLock(catalogs) {
  const identities = [];
  for (const language of LANGUAGES) {
    for (const level of LEVELS) {
      for (const { id, word } of catalogs.get(`${language}_${level}`)) {
        identities.push([language, level, id, word.normalize('NFKC').toUpperCase()]);
      }
    }
  }
  return {
    normalization: 'NFKC+uppercase',
    entryCount: identities.length,
    sha256: sha256(JSON.stringify(identities)),
  };
}

function verifyLock(build, expected) {
  const actual = build.identityLock;
  if (
    expected.schemaVersion !== 1 ||
    actual.normalization !== expected.identity?.normalization ||
    actual.entryCount !== expected.identity?.entryCount ||
    actual.sha256 !== expected.identity?.sha256
  ) {
    throw new Error(
      `Stable ID lock changed. Update ${path.basename(LOCK_FILE)} only after explicit identity review; migrate learned progress if any meaning changed.`,
    );
  }
  if (
    expected.catalogVersion !== build.manifest.catalogVersion ||
    expected.catalogHash !== build.manifest.catalogHash
  ) {
    throw new Error(
      `Catalog lock differs from catalogVersion ${build.manifest.catalogVersion}; increment CATALOG_VERSION and update ${path.basename(LOCK_FILE)} together.`,
    );
  }
}

function buildCatalogSet(sourceDir = SOURCE_DIR) {
  const expectedSources = new Set(
    LANGUAGES.flatMap((language) => LEVELS.map((level) => `${language}_${level}.txt`)),
  );
  const actualSources = readdirSync(sourceDir).filter((name) => name.endsWith('.txt'));
  const missing = [...expectedSources].filter((name) => !actualSources.includes(name));
  const unexpected = actualSources.filter((name) => !expectedSources.has(name));
  if (missing.length > 0 || unexpected.length > 0) {
    throw new Error(
      `Vocabulary source grid differs: missing [${missing.join(', ')}], unexpected [${unexpected.join(', ')}]`,
    );
  }

  const catalogs = new Map();
  const referenceByLevel = new Map();
  for (const language of LANGUAGES) {
    for (const level of LEVELS) {
      const words = readSourceCatalog(sourceDir, language, level);
      const reference = referenceByLevel.get(level);
      if (reference) assertIdParity(reference, words, level, language);
      else referenceByLevel.set(level, words);
      catalogs.set(`${language}_${level}`, words);
    }
  }

  const outputs = new Map();
  const files = {};
  let totalBytes = 0;
  for (const language of LANGUAGES) {
    for (const level of LEVELS) {
      const name = `${language}_${level}.bytes`;
      const words = catalogs.get(`${language}_${level}`);
      const contents = Buffer.from(JSON.stringify({ words }), 'utf8');
      outputs.set(name, contents);
      files[name] = {
        sha256: sha256(contents),
        wordCount: words.length,
        byteLength: contents.length,
      };
      totalBytes += contents.length;
    }
  }

  const catalogDigest = createHash('sha256');
  for (const [name, contents] of outputs) {
    catalogDigest.update(name).update('\0').update(contents).update('\0');
  }
  const manifest = {
    manifestSchemaVersion: MANIFEST_SCHEMA_VERSION,
    catalogVersion: CATALOG_VERSION,
    catalogHash: catalogDigest.digest('hex'),
    languages: LANGUAGES,
    levels: LEVELS,
    files,
  };
  const manifestBytes = Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  const idsBytes = Buffer.from(
    `${JSON.stringify(
      Object.fromEntries(
        LEVELS.map((level) => [level, referenceByLevel.get(level).map(({ id }) => id)]),
      ),
    )}\n`,
    'utf8',
  );
  return {
    catalogs,
    identityLock: createIdentityLock(catalogs),
    manifest,
    manifestBytes,
    idsBytes,
    outputs,
    totalBytes,
  };
}

function assertCatalogVersion(previous, next) {
  if (!previous) return;
  if (previous.catalogVersion > next.catalogVersion) {
    throw new Error('catalogVersion cannot move backwards');
  }
  if (
    previous.catalogVersion === next.catalogVersion &&
    previous.catalogHash !== next.catalogHash
  ) {
    throw new Error(
      `Catalog content changed under catalogVersion ${next.catalogVersion}; increment CATALOG_VERSION first.`,
    );
  }
}

function expectedUnityOutputs(build) {
  const files = new Map([...build.outputs, [MANIFEST_FILE, build.manifestBytes]]);
  for (const name of [...files.keys()]) {
    files.set(`${name}.meta`, unityMeta(`Vocabulary/${name}`));
  }
  return files;
}

function unityMeta(identity, folder = false) {
  const guid = sha256(`VocBee/Resources/${identity}`).slice(0, 32);
  const importer = folder ? 'DefaultImporter' : 'TextScriptImporter';
  return Buffer.from(
    `fileFormatVersion: 2\nguid: ${guid}\n${folder ? 'folderAsset: yes\n' : ''}${importer}:\n  externalObjects: {}\n  userData:\n  assetBundleName:\n  assetBundleVariant:\n`,
    'utf8',
  );
}

function resolveUnityOutput(projectRoot) {
  if (!projectRoot) throw new Error('--sync-unity requires a project root');
  const root = realpathSync(path.resolve(projectRoot));
  if (
    !existsSync(path.join(root, 'ProjectSettings', 'ProjectVersion.txt')) ||
    !existsSync(path.join(root, 'Assets', 'VocBee', 'Resources'))
  ) {
    throw new Error(`${root} is not the authoritative VocBee Unity project`);
  }
  const output = path.resolve(root, UNITY_OUTPUT);
  const relative = path.relative(root, output);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Unsafe Unity output path: ${output}`);
  }
  if (existsSync(output) && lstatSync(output).isSymbolicLink()) {
    throw new Error(`Unity output cannot be a symbolic link: ${output}`);
  }
  return output;
}

function checkOutputs(directory, expected, folderMeta) {
  const stale = [];
  if (
    folderMeta &&
    (!existsSync(`${directory}.meta`) || !readFileSync(`${directory}.meta`).equals(folderMeta))
  ) {
    stale.push(`${path.basename(directory)}.meta`);
  }
  for (const [name, contents] of expected) {
    const file = path.join(directory, name);
    if (!existsSync(file) || !readFileSync(file).equals(contents)) stale.push(name);
  }
  if (existsSync(directory)) {
    for (const name of readdirSync(directory)) {
      if (!expected.has(name)) stale.push(name);
    }
  }
  if (stale.length > 0)
    throw new Error(`Generated output is stale: ${[...new Set(stale)].join(', ')}`);
}

function syncOutputs(directory, expected, folderMeta) {
  mkdirSync(directory, { recursive: true });
  if (
    folderMeta &&
    existsSync(`${directory}.meta`) &&
    lstatSync(`${directory}.meta`).isSymbolicLink()
  ) {
    throw new Error(`Refusing to overwrite symbolic link: ${directory}.meta`);
  }
  for (const name of expected.keys()) {
    const file = path.join(directory, name);
    if (existsSync(file) && lstatSync(file).isSymbolicLink()) {
      throw new Error(`Refusing to overwrite symbolic link: ${file}`);
    }
  }
  for (const name of readdirSync(directory)) {
    if (expected.has(name)) continue;
    if (name.endsWith('.bytes') || name.endsWith('.bytes.meta')) {
      rmSync(path.join(directory, name));
      continue;
    }
    throw new Error(`Refusing to delete unexpected Unity asset: ${path.join(directory, name)}`);
  }
  if (folderMeta) writeFileSync(`${directory}.meta`, folderMeta);
  for (const [name, contents] of expected) writeFileSync(path.join(directory, name), contents);
}

function parseArgs(argv) {
  let check = false;
  let unityProject;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--check') {
      if (check) throw new Error('--check was supplied more than once');
      check = true;
    } else if (argument === '--sync-unity') {
      if (unityProject !== undefined) throw new Error('--sync-unity was supplied more than once');
      unityProject = argv[++index];
      if (!unityProject || unityProject.startsWith('--')) {
        throw new Error('--sync-unity requires a project root');
      }
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }
  return { check, unityProject };
}

function run(options) {
  const build = buildCatalogSet();
  if (!existsSync(LOCK_FILE)) throw new Error(`Game vocabulary lock is missing: ${LOCK_FILE}`);
  verifyLock(build, JSON.parse(readFileSync(LOCK_FILE, 'utf8')));

  const previousManifest = existsSync(HOST_MANIFEST)
    ? JSON.parse(readFileSync(HOST_MANIFEST, 'utf8'))
    : null;
  assertCatalogVersion(previousManifest, build.manifest);
  const unityOutput = options.unityProject ? resolveUnityOutput(options.unityProject) : null;

  if (options.check) {
    checkOutputs(
      path.dirname(HOST_MANIFEST),
      new Map([
        [path.basename(HOST_MANIFEST), build.manifestBytes],
        [path.basename(HOST_IDS), build.idsBytes],
      ]),
    );
    if (unityOutput) {
      checkOutputs(unityOutput, expectedUnityOutputs(build), unityMeta('Vocabulary', true));
    }
  } else {
    mkdirSync(path.dirname(HOST_MANIFEST), { recursive: true });
    writeFileSync(HOST_MANIFEST, build.manifestBytes);
    writeFileSync(HOST_IDS, build.idsBytes);
    if (unityOutput) {
      syncOutputs(unityOutput, expectedUnityOutputs(build), unityMeta('Vocabulary', true));
    }
  }

  console.log(
    `Game vocabulary ${options.check ? 'verified' : 'generated'}: ${build.outputs.size} catalogs, ${build.totalBytes} bytes, ${build.manifest.catalogHash}`,
  );
  if (unityOutput) console.log(`Unity output: ${unityOutput}`);
  return build;
}

if (require.main === module) {
  try {
    run(parseArgs(process.argv.slice(2)));
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}

module.exports = {
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
};
