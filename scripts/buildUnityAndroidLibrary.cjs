const { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync } = require('node:fs');
const { dirname, join } = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');

const root = join(__dirname, '..');
const unityExport = join(root, 'unity-export', 'android');
const gradle = join(unityExport, process.platform === 'win32' ? 'gradlew.bat' : 'gradlew');
const aar = join(
  unityExport,
  'unityLibrary',
  'build',
  'outputs',
  'aar',
  'unityLibrary-release.aar',
);
const destination = join(
  root,
  'modules',
  'vocbee-unity',
  'android',
  'libs',
  'unityLibrary-release.aar',
);
const provenanceName = 'vocbee-build-provenance.json';
const provenanceFile = join(unityExport, provenanceName);
const provenanceDestination = join(dirname(destination), provenanceName);
const unityProject = process.env.VOCBEE_UNITY_PROJECT || join(root, '..', 'vocbee-game');

if (!existsSync(join(unityExport, 'settings.gradle'))) {
  throw new Error('Run VocBee/Export Android Library in Unity first.');
}
if (!existsSync(provenanceFile)) throw new Error('Unity Android export has no provenance.');

const provenance = JSON.parse(readFileSync(provenanceFile, 'utf8'));
const catalog = JSON.parse(
  readFileSync(join(root, 'src', 'features', 'game', 'generated', 'catalog-manifest.json'), 'utf8'),
);
const git = ['-c', `safe.directory=${unityProject}`];
const sourceCommit = execFileSync('git', [...git, 'rev-parse', 'HEAD'], {
  cwd: unityProject,
  encoding: 'utf8',
}).trim();
const dirty = execFileSync('git', [...git, 'status', '--porcelain=v1'], {
  cwd: unityProject,
  encoding: 'utf8',
}).trim();
if (
  dirty ||
  provenance.sourceCommit !== sourceCommit ||
  provenance.catalogHash !== catalog.catalogHash ||
  provenance.buildTarget !== 'Android'
) {
  throw new Error('Unity Android provenance does not match clean source/catalog state.');
}

let command = gradle;
let args = [':unityLibrary:assembleRelease'];
const env = { ...process.env };
const properties = readFileSync(join(unityExport, 'local.properties'), 'utf8');
const sdk = properties.match(/^sdk\.dir=(.+)$/m)?.[1]?.replace(/\\:/g, ':');
if (!sdk) throw new Error('Unity export has no Android SDK path.');
const androidPlayer = dirname(sdk);

if (!existsSync(gradle)) {
  const gradleLib = join(androidPlayer, 'Tools', 'gradle', 'lib');
  const cli = readdirSync(gradleLib).find((name) => /^gradle-gradle-cli-main-.*\.jar$/.test(name));
  if (!cli) throw new Error('Unity bundled Gradle was not found.');

  env.JAVA_HOME = join(androidPlayer, 'OpenJDK');
  command = join(env.JAVA_HOME, 'bin', process.platform === 'win32' ? 'java.exe' : 'java');
  args = ['-classpath', join(gradleLib, cli), 'org.gradle.launcher.GradleMain', ...args];
}

const result = spawnSync(command, args, {
  cwd: unityExport,
  env,
  stdio: 'inherit',
});
if (result.status !== 0 || !existsSync(aar)) process.exit(result.status || 1);

const jar = join(androidPlayer, 'OpenJDK', 'bin', process.platform === 'win32' ? 'jar.exe' : 'jar');
const archive = spawnSync(jar, ['tf', aar], { encoding: 'utf8' });
if (archive.status !== 0 || !archive.stdout.split(/\r?\n/).includes(`assets/${provenanceName}`)) {
  throw new Error('Android AAR does not contain its build provenance.');
}

mkdirSync(dirname(destination), { recursive: true });
copyFileSync(aar, destination);
copyFileSync(provenanceFile, provenanceDestination);
console.log(`Unity Android library copied to ${destination}`);
