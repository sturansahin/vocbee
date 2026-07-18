const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const rootPackage = readJson('package.json');
const apiPackage = readJson('api/package.json');
const functionsPackage = readJson('functions/package.json');

if (rootPackage.dependencies?.['firebase-admin']) {
  throw new Error('firebase-admin must not be a mobile runtime dependency');
}
if (!apiPackage.dependencies?.['firebase-admin']) {
  throw new Error('api/package.json must own the Vercel firebase-admin dependency');
}
if (!functionsPackage.dependencies?.['firebase-admin']) {
  throw new Error('functions/package.json must own the Cloud Functions firebase-admin dependency');
}

const mobileRoots = [
  'App.tsx',
  'components',
  'config',
  'contexts',
  'hooks',
  'screens',
  'services',
  'src',
  'utils',
];
const sourcePattern = /from\s+['"]firebase-admin(?:\/[^'"]*)?['"]|require\(['"]firebase-admin/;

function scan(target) {
  const absolute = path.join(root, target);
  if (!fs.existsSync(absolute)) return;
  const stat = fs.statSync(absolute);
  if (stat.isDirectory()) {
    for (const entry of fs.readdirSync(absolute)) scan(path.join(target, entry));
    return;
  }
  if (!/\.(?:js|jsx|ts|tsx)$/.test(target)) return;
  if (sourcePattern.test(fs.readFileSync(absolute, 'utf8'))) {
    throw new Error(`Server-only firebase-admin import found in mobile source: ${target}`);
  }
}

mobileRoots.forEach(scan);
console.log('Server dependency boundary: PASS');
