import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const repoRoot = process.cwd();
const srcRoot = path.join(repoRoot, 'src');
const legacyRootDirs = ['components', 'config', 'context', 'screens', 'services', 'utils'];
const legacyRootModules = ['constants', 'types'];
const sourceExtensions = new Set(['.ts', '.tsx']);

function collectProductionFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const absolutePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === '__tests__') return [];
      return collectProductionFiles(absolutePath);
    }

    if (!sourceExtensions.has(path.extname(entry.name))) return [];
    if (/\.(?:test|spec)\.[^.]+$/.test(entry.name)) return [];
    return [absolutePath];
  });
}

function moduleSpecifiers(filePath: string): string[] {
  const sourceText = fs.readFileSync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const specifiers: string[] = [];

  const visit = (node: ts.Node) => {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      specifiers.push(node.moduleSpecifier.text);
    }

    if (
      ts.isCallExpression(node) &&
      node.arguments.length === 1 &&
      ts.isStringLiteral(node.arguments[0]) &&
      (
        node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) && node.expression.text === 'require')
      )
    ) {
      specifiers.push(node.arguments[0].text);
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return specifiers;
}

function relativeTarget(filePath: string, specifier: string): string | null {
  return specifier.startsWith('.')
    ? path.resolve(path.dirname(filePath), specifier)
    : null;
}

function relativePath(filePath: string): string {
  return path.relative(repoRoot, filePath).split(path.sep).join('/');
}

function featureName(filePath: string): string | null {
  const relative = path.relative(path.join(srcRoot, 'features'), filePath);
  if (relative.startsWith('..')) return null;
  return relative.split(path.sep)[0] || null;
}

function isPackage(specifier: string, packageName: string): boolean {
  return specifier === packageName || specifier.startsWith(`${packageName}/`);
}

const productionFiles = collectProductionFiles(srcRoot);

describe('production import boundaries', () => {
  it('keeps legacy root source directories and modules removed', () => {
    const existingLegacyPaths = [
      ...legacyRootDirs.filter(directory => fs.existsSync(path.join(repoRoot, directory))),
      ...legacyRootModules
        .map(moduleName => `${moduleName}.ts`)
        .filter(fileName => fs.existsSync(path.join(repoRoot, fileName))),
    ];

    expect(existingLegacyPaths).toEqual([]);
  });

  it('does not import active code from legacy root directories', () => {
    const violations: string[] = [];

    for (const filePath of productionFiles) {
      for (const specifier of moduleSpecifiers(filePath)) {
        const transitionalRootAlias = specifier === '@' || specifier.startsWith('@/');
        const target = relativeTarget(filePath, specifier);
        const legacyRelative = target !== null && legacyRootDirs.some(directory => {
          const legacyRoot = path.join(repoRoot, directory);
          return target === legacyRoot || target.startsWith(`${legacyRoot}${path.sep}`);
        });
        const legacyModuleRelative = target !== null && legacyRootModules.some(moduleName => (
          target === path.join(repoRoot, moduleName) ||
          target === path.join(repoRoot, `${moduleName}.ts`) ||
          target === path.join(repoRoot, `${moduleName}.tsx`)
        ));

        if (transitionalRootAlias || legacyRelative || legacyModuleRelative) {
          violations.push(`${relativePath(filePath)} -> ${specifier}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it('allows cross-feature imports only through public feature barrels', () => {
    const violations: string[] = [];

    for (const filePath of productionFiles) {
      const ownerFeature = featureName(filePath);

      for (const specifier of moduleSpecifiers(filePath)) {
        const aliasMatch = specifier.match(/^@features\/([^/]+)(\/.+)$/);
        if (aliasMatch) {
          violations.push(`${relativePath(filePath)} -> ${specifier}`);
          continue;
        }

        if (!ownerFeature) continue;
        const target = relativeTarget(filePath, specifier);
        if (!target) continue;

        const targetFeature = featureName(target);
        if (targetFeature && targetFeature !== ownerFeature) {
          violations.push(`${relativePath(filePath)} -> ${specifier}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it('keeps domain, application, and presentation SDK boundaries clean', () => {
    const violations: string[] = [];
    const domainForbidden = [
      'firebase',
      '@react-native-async-storage/async-storage',
      'expo',
      'react',
      'react-native',
      '@react-navigation',
    ];
    const sideEffectSdkForbidden = [
      'firebase',
      '@react-native-async-storage/async-storage',
      'expo-notifications',
      'expo-speech',
      'expo-image-picker',
      'expo-apple-authentication',
      'expo-constants',
      'expo-localization',
      'expo-network',
      'expo-updates',
      '@react-native-google-signin/google-signin',
      'react-native-google-mobile-ads',
      'react-native-purchases',
      'react-native-purchases-ui',
    ];

    for (const filePath of productionFiles) {
      const normalized = relativePath(filePath);
      const isDomain = /src\/features\/[^/]+\/domain\//.test(normalized);
      const isApplication = /src\/features\/[^/]+\/application\//.test(normalized);
      const isPresentation = /src\/features\/[^/]+\/presentation\//.test(normalized);
      if (!isDomain && !isApplication && !isPresentation) continue;

      for (const specifier of moduleSpecifiers(filePath)) {
        const forbiddenPackages = isDomain ? domainForbidden : sideEffectSdkForbidden;
        if (forbiddenPackages.some(packageName => isPackage(specifier, packageName))) {
          violations.push(`${normalized} -> ${specifier}`);
        }

        if (isPresentation) {
          const target = relativeTarget(filePath, specifier);
          if (
            target &&
            target.includes(`${path.sep}src${path.sep}features${path.sep}`) &&
            target.includes(`${path.sep}data${path.sep}`)
          ) {
            violations.push(`${normalized} -> ${specifier}`);
          }
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it('keeps shared independent and feature barrels free of data implementations', () => {
    const violations: string[] = [];

    for (const filePath of productionFiles) {
      const normalized = relativePath(filePath);
      const isShared = normalized.startsWith('src/shared/');

      for (const specifier of moduleSpecifiers(filePath)) {
        if (
          isShared &&
          (
            specifier === '@app' ||
            specifier.startsWith('@app/') ||
            specifier === '@features' ||
            specifier.startsWith('@features/')
          )
        ) {
          violations.push(`${normalized} -> ${specifier}`);
        }

        if (
          /src\/features\/[^/]+\/index\.ts$/.test(normalized) &&
          specifier.includes('/data/') &&
          !specifier.endsWith('/data/contracts')
        ) {
          violations.push(`${normalized} -> ${specifier}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it('provides a public index.ts for every feature', () => {
    const missing = fs.readdirSync(path.join(srcRoot, 'features'), { withFileTypes: true })
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name)
      .filter(feature => !fs.existsSync(path.join(srcRoot, 'features', feature, 'index.ts')));

    expect(missing).toEqual([]);
  });
});
