const assert = require('node:assert/strict');
const test = require('node:test');
const { REFERENCE_WIDTH_ALLOWLIST, auditSource } = require('../ui-audit.cjs');

function rulesFor(filePath, source) {
  return auditSource(filePath, source).map((violation) => violation.rule);
}

test('accepts semantic, responsive and accessible UI source', () => {
  const source = `
    import { Pressable, Text } from 'react-native';
    import { AppButton } from '@shared/ui';
    export function ExampleScreen() {
      return <Pressable><Text>Continue</Text></Pressable>;
    }
  `;
  assert.deepEqual(rulesFor('src/features/example/presentation/ExampleScreen.tsx', source), []);
});

test('rejects raw hex colors in production presentation code', () => {
  const rules = rulesFor(
    'src/features/example/presentation/ExampleCard.tsx',
    `export const color = '#abcdef';`,
  );
  assert.ok(rules.includes('raw-hex-color'));
});

test('rejects Dimensions.get and local 393 scaling', () => {
  const rules = rulesFor(
    'src/features/example/presentation/ExampleCard.tsx',
    `const width = Dimensions.get('window').width / 393;`,
  );
  assert.ok(rules.includes('dimensions-window'));
  assert.ok(rules.includes('local-reference-width'));
});

test('allows exactly one documented shared reference width', () => {
  const filePath = Object.keys(REFERENCE_WIDTH_ALLOWLIST)[0];
  assert.deepEqual(rulesFor(filePath, 'const REFERENCE_WIDTH = 393;'), []);
  assert.ok(rulesFor(filePath, 'const A = 393; const B = 393;').includes('local-reference-width'));
});

test('rejects deprecated React Native SafeAreaView', () => {
  const rules = rulesFor(
    'src/shared/ui/layout/BadScreen.tsx',
    `import { SafeAreaView, View } from 'react-native';`,
  );
  assert.ok(rules.includes('deprecated-safe-area'));
});

test('rejects deep shared UI imports', () => {
  const rules = rulesFor(
    'src/features/example/presentation/ExampleCard.tsx',
    `import { AppButton } from '@shared/ui/primitives/AppButton';`,
  );
  assert.ok(rules.includes('shared-ui-public-api'));
});

test('rejects unlabeled icon-only actions and accepts labeled ones', () => {
  const badRules = rulesFor(
    'src/features/example/presentation/ExampleCard.tsx',
    `<Pressable onPress={go}><MaterialIcons name="close" /></Pressable>`,
  );
  assert.ok(badRules.includes('icon-action-label'));

  const goodRules = rulesFor(
    'src/features/example/presentation/ExampleCard.tsx',
    `<IconButton accessibilityLabel="Close" icon={<MaterialIcons name="close" />} />`,
  );
  assert.deepEqual(goodRules, []);
});

test('rejects screen and controller files at or above 400 lines', () => {
  const source = Array.from({ length: 400 }, () => '// line').join('\n');
  const rules = rulesFor('src/features/example/presentation/ExampleScreen.tsx', source);
  assert.ok(rules.includes('ui-file-size'));
});

test('ignores tests because the audit guards production source', () => {
  const rules = rulesFor(
    'src/features/example/presentation/__tests__/Example.test.tsx',
    `const color = '#fff'; const width = 393;`,
  );
  assert.deepEqual(rules, []);
});
