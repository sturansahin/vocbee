const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const summaryPath = path.join(repoRoot, 'coverage', 'coverage-summary.json');

if (!fs.existsSync(summaryPath)) {
  console.error('coverage/coverage-summary.json is missing. Run npm run test:ci first.');
  process.exit(1);
}

const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
const thresholds = {
  auth: 45,
  profile: 80,
  learning: 45,
  vocabulary: 40,
  notifications: 45,
  settings: 40,
  setup: 60,
};

function featureLineCoverage(feature) {
  let covered = 0;
  let total = 0;
  const marker = `/src/features/${feature}/`;

  for (const [filePath, metrics] of Object.entries(summary)) {
    if (filePath === 'total' || !filePath.includes(marker)) continue;
    covered += metrics.lines.covered;
    total += metrics.lines.total;
  }

  return total === 0 ? 100 : (covered / total) * 100;
}

const failures = [];

for (const [feature, minimum] of Object.entries(thresholds)) {
  const actual = featureLineCoverage(feature);
  console.log(`${feature.padEnd(13)} ${actual.toFixed(1)}% (minimum ${minimum}%)`);
  if (actual < minimum) failures.push(`${feature}: ${actual.toFixed(1)}% < ${minimum}%`);
}

const totalMinimum = 50;
const totalActual = summary.total.lines.pct;
console.log(`${'total'.padEnd(13)} ${totalActual.toFixed(1)}% (minimum ${totalMinimum}%)`);
if (totalActual < totalMinimum)
  failures.push(`total: ${totalActual.toFixed(1)}% < ${totalMinimum}%`);

if (failures.length > 0) {
  console.error(`Coverage gate failed:\n- ${failures.join('\n- ')}`);
  process.exit(1);
}
