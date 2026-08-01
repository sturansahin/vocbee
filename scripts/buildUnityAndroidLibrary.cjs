const { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync } = require('node:fs');
const { dirname, join } = require('node:path');
const { spawnSync } = require('node:child_process');

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

if (!existsSync(join(unityExport, 'settings.gradle'))) {
  throw new Error('Run VocBee/Export Android Library in Unity first.');
}

let command = gradle;
let args = [':unityLibrary:assembleRelease'];
const env = { ...process.env };

if (!existsSync(gradle)) {
  const properties = readFileSync(join(unityExport, 'local.properties'), 'utf8');
  const sdk = properties.match(/^sdk\.dir=(.+)$/m)?.[1]?.replace(/\\:/g, ':');
  if (!sdk) throw new Error('Unity export has no Android SDK path.');

  const androidPlayer = dirname(sdk);
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

mkdirSync(dirname(destination), { recursive: true });
copyFileSync(aar, destination);
console.log(`Unity Android library copied to ${destination}`);
