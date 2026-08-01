const { existsSync, rmSync } = require('node:fs');
const { dirname, join } = require('node:path');
const { spawnSync } = require('node:child_process');

if (process.platform !== 'darwin') throw new Error('Unity iOS framework build requires macOS.');

const root = join(__dirname, '..');
const deviceExport = join(root, 'unity-export', 'ios');
const simulatorExport = join(root, 'unity-export', 'ios-simulator-arm64');
const deviceProject = join(deviceExport, 'Unity-iPhone.xcodeproj');
const simulatorProject = join(simulatorExport, 'Unity-iPhone.xcodeproj');
const deviceDerivedData = join(deviceExport, 'DerivedData');
const simulatorDerivedData = join(simulatorExport, 'DerivedData');
const deviceFramework = join(
  deviceDerivedData,
  'Build',
  'Products',
  'Release-iphoneos',
  'UnityFramework.framework',
);
const simulatorFramework = join(
  simulatorDerivedData,
  'Build',
  'Products',
  'Release-iphonesimulator',
  'UnityFramework.framework',
);
const destination = join(root, 'modules', 'vocbee-unity', 'ios', 'UnityFramework.xcframework');

if (!existsSync(deviceProject)) {
  throw new Error('Run VocBee/Export iOS Library in Unity first.');
}
if (!existsSync(simulatorProject)) {
  throw new Error('Run VocBee/Export iOS Simulator Library in Unity first.');
}

function buildFramework(project, sdk, derivedData, architecture) {
  const args = [
    '-project',
    project,
    '-scheme',
    'UnityFramework',
    '-configuration',
    'Release',
    '-sdk',
    sdk,
    '-derivedDataPath',
    derivedData,
    'BUILD_LIBRARY_FOR_DISTRIBUTION=YES',
    'SKIP_INSTALL=NO',
    'build',
  ];
  if (architecture) args.splice(8, 0, '-arch', architecture);
  const result = spawnSync('xcodebuild', args, { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
}

buildFramework(deviceProject, 'iphoneos', deviceDerivedData);
buildFramework(simulatorProject, 'iphonesimulator', simulatorDerivedData, 'arm64');

if (!existsSync(deviceFramework) || !existsSync(simulatorFramework)) process.exit(1);

if (dirname(destination) !== join(root, 'modules', 'vocbee-unity', 'ios')) {
  throw new Error('Unexpected UnityFramework destination.');
}
rmSync(destination, { recursive: true, force: true });
const result = spawnSync(
  'xcodebuild',
  [
    '-create-xcframework',
    '-framework',
    deviceFramework,
    '-framework',
    simulatorFramework,
    '-output',
    destination,
  ],
  { stdio: 'inherit' },
);
if (result.status !== 0 || !existsSync(destination)) process.exit(result.status || 1);
console.log(`UnityFramework XCFramework created at ${destination}`);
