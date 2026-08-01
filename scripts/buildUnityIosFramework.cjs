const { cpSync, existsSync, rmSync } = require('node:fs');
const { dirname, join } = require('node:path');
const { spawnSync } = require('node:child_process');

if (process.platform !== 'darwin') throw new Error('Unity iOS framework build requires macOS.');

const root = join(__dirname, '..');
const unityExport = join(root, 'unity-export', 'ios');
const project = join(unityExport, 'Unity-iPhone.xcodeproj');
const derivedData = join(unityExport, 'DerivedData');
const framework = join(
  derivedData,
  'Build',
  'Products',
  'Release-iphoneos',
  'UnityFramework.framework',
);
const destination = join(root, 'modules', 'vocbee-unity', 'ios', 'UnityFramework.framework');

if (!existsSync(project)) throw new Error('Run VocBee/Export iOS Library in Unity first.');

const result = spawnSync(
  'xcodebuild',
  [
    '-project',
    project,
    '-scheme',
    'UnityFramework',
    '-configuration',
    'Release',
    '-sdk',
    'iphoneos',
    '-derivedDataPath',
    derivedData,
    'BUILD_LIBRARY_FOR_DISTRIBUTION=YES',
    'SKIP_INSTALL=NO',
    'build',
  ],
  { stdio: 'inherit' },
);
if (result.status !== 0 || !existsSync(framework)) process.exit(result.status || 1);

if (dirname(destination) !== join(root, 'modules', 'vocbee-unity', 'ios')) {
  throw new Error('Unexpected UnityFramework destination.');
}
rmSync(destination, { recursive: true, force: true });
cpSync(framework, destination, { recursive: true });
console.log(`UnityFramework copied to ${destination}`);
