const fs = require('fs');
const path = require('path');

const lang = process.argv[2];
if (!lang) {
  throw new Error('Missing locale code');
}

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => {
  input += chunk;
});
process.stdin.on('end', () => {
  const blocks = JSON.parse(input);
  const file = path.join('locales', `${lang}.ts`);
  let text = fs.readFileSync(file, 'utf8');

  for (const blockName of ['reviewPrompt', 'settings', 'onboarding', 'notifications']) {
    if (blocks[blockName]) {
      text = replaceKeysInBlock(text, blockName, blocks[blockName]);
    }
  }

  fs.writeFileSync(file, text, 'utf8');
});

function escapeTs(value) {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function findBlock(text, blockName) {
  const marker = new RegExp(`\\b${blockName}\\s*:\\s*\\{`).exec(text);
  if (!marker) throw new Error(`Block not found: ${blockName}`);

  const braceStart = text.indexOf('{', marker.index);
  if (braceStart === -1) throw new Error(`Brace not found: ${blockName}`);

  let depth = 0;
  let inString = false;
  let quote = '';
  let escaped = false;

  for (let i = braceStart; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === quote) {
        inString = false;
      }
      continue;
    }

    if (ch === "'" || ch === '"' || ch === '`') {
      inString = true;
      quote = ch;
      continue;
    }

    if (ch === '{') depth++;
    if (ch === '}') {
      depth--;
      if (depth === 0) return { start: braceStart, end: i + 1 };
    }
  }

  throw new Error(`Block end not found: ${blockName}`);
}

function replaceKeysInBlock(text, blockName, replacements) {
  const block = findBlock(text, blockName);
  let body = text.slice(block.start, block.end);

  for (const [key, value] of Object.entries(replacements)) {
    const re = new RegExp(`(\\b${key}\\s*:\\s*)'([^'\\\\]*(?:\\\\.[^'\\\\]*)*)'`);
    if (!re.test(body)) {
      throw new Error(`${blockName}.${key} not found`);
    }
    body = body.replace(re, `$1'${escapeTs(value)}'`);
  }

  return text.slice(0, block.start) + body + text.slice(block.end);
}
