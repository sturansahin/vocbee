const { existsSync, readFileSync, rmSync, writeFileSync } = require('node:fs');
const { dirname, join } = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');

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
const provenanceName = 'vocbee-build-provenance.json';

if (!existsSync(deviceProject)) {
  throw new Error('Run VocBee/Export iOS Library in Unity first.');
}
if (!existsSync(simulatorProject)) {
  throw new Error('Run VocBee/Export iOS Simulator Library in Unity first.');
}

const deviceProvenance = JSON.parse(readFileSync(join(deviceExport, provenanceName), 'utf8'));
const simulatorProvenance = JSON.parse(readFileSync(join(simulatorExport, provenanceName), 'utf8'));
const unityProject = process.env.VOCBEE_UNITY_PROJECT || join(root, '..', 'vocbee-game');
const git = ['-c', `safe.directory=${unityProject}`];
const sourceCommit = execFileSync('git', [...git, 'rev-parse', 'HEAD'], {
  cwd: unityProject,
  encoding: 'utf8',
}).trim();
const dirty = execFileSync('git', [...git, 'status', '--porcelain=v1'], {
  cwd: unityProject,
  encoding: 'utf8',
}).trim();
const catalog = JSON.parse(
  readFileSync(join(root, 'src', 'features', 'game', 'generated', 'catalog-manifest.json'), 'utf8'),
);

if (
  dirty ||
  deviceProvenance.sourceCommit !== sourceCommit ||
  simulatorProvenance.sourceCommit !== sourceCommit ||
  deviceProvenance.catalogHash !== catalog.catalogHash ||
  simulatorProvenance.catalogHash !== catalog.catalogHash ||
  deviceProvenance.unityVersion !== simulatorProvenance.unityVersion ||
  deviceProvenance.buildTarget !== 'iOS' ||
  simulatorProvenance.buildTarget !== 'iOS'
) {
  throw new Error('Unity iOS provenance does not match clean source/catalog state.');
}

function buildFramework(project, sdk, derivedData, architecture) {
  // Unity's generated Xcode project copies managed metadata into the framework.
  // Reusing DerivedData can leave that copy stale even after a fresh Unity export,
  // so always rebuild each framework from a clean generated-products directory.
  rmSync(derivedData, { recursive: true, force: true });

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
writeFileSync(
  join(destination, provenanceName),
  `${JSON.stringify(
    {
      schemaVersion: 1,
      sourceCommit,
      catalogHash: catalog.catalogHash,
      unityVersion: deviceProvenance.unityVersion,
      deviceBuildGuid: deviceProvenance.buildGuid,
      simulatorBuildGuid: simulatorProvenance.buildGuid,
    },
    null,
    2,
  )}\n`,
);
console.log(`UnityFramework XCFramework created at ${destination}`);
