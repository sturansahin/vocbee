const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');

const REFERENCE_WIDTH_ALLOWLIST = Object.freeze({
  'src/shared/responsive/metrics.ts': {
    expectedMatches: 1,
    reason: 'The centralized responsive scale needs one documented design reference width.',
    removalCondition: 'Remove when the product no longer scales from a reference canvas.',
  },
});

function normalizePath(filePath) {
  return filePath.replaceAll('\\', '/').replace(/^.*?\/(?=src\/)/, '');
}

function isProductionSource(filePath) {
  return (
    /\.(?:ts|tsx)$/.test(filePath) &&
    !/(?:^|\/)__tests__(?:\/|$)/.test(filePath) &&
    !/\.test\.(?:ts|tsx)$/.test(filePath)
  );
}

function isUiSource(filePath) {
  return (
    /^src\/features\/[^/]+\/presentation\//.test(filePath) ||
    /^src\/shared\/ui\//.test(filePath) ||
    /^src\/app\/(?:navigation|presentation)\//.test(filePath)
  );
}

function lineNumberAt(source, index) {
  return source.slice(0, index).split('\n').length;
}

function pushViolation(violations, rule, filePath, source, index, message) {
  violations.push({
    rule,
    file: filePath,
    line: lineNumberAt(source, index),
    message,
  });
}

function auditSource(inputPath, source) {
  const filePath = normalizePath(inputPath);
  const violations = [];

  if (!isProductionSource(filePath)) {
    return violations;
  }

  if (isUiSource(filePath)) {
    for (const match of source.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) {
      pushViolation(
        violations,
        'raw-hex-color',
        filePath,
        source,
        match.index,
        'Use a semantic theme color instead of a raw hex value.',
      );
    }

    for (const match of source.matchAll(/<IconButton\b[\s\S]*?(?<![=])>/g)) {
      if (!/\baccessibilityLabel\s*=/.test(match[0])) {
        pushViolation(
          violations,
          'icon-action-label',
          filePath,
          source,
          match.index,
          'IconButton actions require an accessibilityLabel.',
        );
      }
    }

    const iconActionPattern = /<(Pressable|TouchableOpacity)\b([\s\S]*?)(?<![=])>([\s\S]*?)<\/\1>/g;
    for (const match of source.matchAll(iconActionPattern)) {
      const attributes = match[2];
      const body = match[3];
      const rendersIcon =
        /<(?:MaterialIcons|MaterialCommunityIcons|Ionicons|Feather|FontAwesome5?|Entypo|AntDesign|Octicons|Icon)\b/.test(
          body,
        );
      const rendersVisibleText = /<(?:Text|AppText)\b/.test(body);
      if (rendersIcon && !rendersVisibleText && !/\baccessibilityLabel\s*=/.test(attributes)) {
        pushViolation(
          violations,
          'icon-action-label',
          filePath,
          source,
          match.index,
          'Icon-only Pressable/TouchableOpacity actions require an accessibilityLabel.',
        );
      }
    }
  }

  for (const match of source.matchAll(/\bDimensions\s*\.\s*get\s*\(/g)) {
    pushViolation(
      violations,
      'dimensions-window',
      filePath,
      source,
      match.index,
      'Use the shared responsive metrics hook instead of Dimensions.get().',
    );
  }

  const referenceWidthMatches = [...source.matchAll(/\b393\b/g)];
  if (referenceWidthMatches.length > 0) {
    const allowlist = REFERENCE_WIDTH_ALLOWLIST[filePath];
    if (!allowlist || referenceWidthMatches.length !== allowlist.expectedMatches) {
      for (const match of referenceWidthMatches) {
        pushViolation(
          violations,
          'local-reference-width',
          filePath,
          source,
          match.index,
          'Local 393-based scaling is forbidden; use shared responsive metrics.',
        );
      }
    }
  }

  const reactNativeImports = source.matchAll(
    /import\s*{([\s\S]*?)}\s*from\s*['"]react-native['"]/g,
  );
  for (const match of reactNativeImports) {
    if (/\bSafeAreaView\b/.test(match[1])) {
      pushViolation(
        violations,
        'deprecated-safe-area',
        filePath,
        source,
        match.index,
        'Import SafeAreaView from react-native-safe-area-context.',
      );
    }
  }

  if (/^(?:src\/features|src\/app)\//.test(filePath)) {
    for (const match of source.matchAll(/from\s+['"]@shared\/ui\/[^'"]+['"]/g)) {
      pushViolation(
        violations,
        'shared-ui-public-api',
        filePath,
        source,
        match.index,
        'Import shared UI only from the @shared/ui public barrel.',
      );
    }
  }

  if (isUiSource(filePath) && /(?:Screen|Controller)\.(?:ts|tsx)$/.test(path.basename(filePath))) {
    const lineCount = source.split(/\r?\n/).length;
    if (lineCount >= 400) {
      violations.push({
        rule: 'ui-file-size',
        file: filePath,
        line: 400,
        message: `Screen/controller has ${lineCount} lines; the hard limit is 399.`,
      });
    }
  }

  return violations;
}

function listSourceFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? listSourceFiles(entryPath) : [entryPath];
  });
}

function runAudit(root = ROOT) {
  const sourceRoot = path.join(root, 'src');
  return listSourceFiles(sourceRoot).flatMap((filePath) =>
    auditSource(path.relative(root, filePath), fs.readFileSync(filePath, 'utf8')),
  );
}

function main() {
  const violations = runAudit();
  if (violations.length > 0) {
    console.error(`UI audit failed with ${violations.length} violation(s):`);
    for (const violation of violations) {
      console.error(
        `- [${violation.rule}] ${violation.file}:${violation.line} ${violation.message}`,
      );
    }
    process.exitCode = 1;
    return;
  }

  console.log(
    `UI audit passed (0 violations, ${Object.keys(REFERENCE_WIDTH_ALLOWLIST).length} documented allowlist).`,
  );
}

if (require.main === module) {
  main();
}

module.exports = {
  REFERENCE_WIDTH_ALLOWLIST,
  auditSource,
  runAudit,
};
