/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// `typescript` is a devDependency in this repo.
const ts = require('typescript');

const LOCALES_DIR = path.join(__dirname, '..', 'locales');
const EN_FILE = path.join(LOCALES_DIR, 'en.ts');

function isPlainObject(value) {
    if (value === null || typeof value !== 'object') return false;
    if (Array.isArray(value)) return false;
    // Works across vm contexts (prototype may differ).
    return Object.prototype.toString.call(value) === '[object Object]';
}

function toHostValue(value) {
    // Convert values originating from vm context into host-native
    // objects/arrays so our plain-object checks and pretty-printer work.
    if (Array.isArray(value)) return value.map(toHostValue);
    if (isPlainObject(value)) {
        const out = {};
        for (const key of Object.keys(value)) {
            out[key] = toHostValue(value[key]);
        }
        return out;
    }
    return value;
}

function loadTsDefaultExport(tsFilePath) {
    const source = fs.readFileSync(tsFilePath, 'utf8');

    const transpiled = ts.transpileModule(source, {
        compilerOptions: {
            target: ts.ScriptTarget.ES2019,
            module: ts.ModuleKind.CommonJS,
            esModuleInterop: true,
            strict: false,
            skipLibCheck: true,
        },
        fileName: path.basename(tsFilePath),
    });

    const sandbox = {
        exports: {},
        module: { exports: {} },
        require: (name) => {
            throw new Error(`Locale files must not require modules. Tried to require: ${name}`);
        },
        __dirname: path.dirname(tsFilePath),
        __filename: tsFilePath,
        console,
    };

    vm.createContext(sandbox);
    vm.runInContext(transpiled.outputText, sandbox, { filename: tsFilePath });

    const exported = sandbox.module.exports && Object.keys(sandbox.module.exports).length
        ? sandbox.module.exports
        : sandbox.exports;

    if (!exported || !('default' in exported)) {
        throw new Error(`No default export found in ${tsFilePath}`);
    }

    return toHostValue(exported.default);
}

function deepMergeMissing(target, reference, missingPaths, prefix = '') {
    // Mutates target: adds keys that exist in reference but are missing in target.
    for (const key of Object.keys(reference)) {
        const currentPath = prefix ? `${prefix}.${key}` : key;

        if (!(key in target)) {
            target[key] = reference[key];
            missingPaths.push(currentPath);
            continue;
        }

        const refVal = reference[key];
        const tgtVal = target[key];

        if (isPlainObject(refVal) && isPlainObject(tgtVal)) {
            deepMergeMissing(tgtVal, refVal, missingPaths, currentPath);
        }
    }
}

function collectExtraPaths(target, reference, extraPaths, prefix = '') {
    // Finds keys that exist in target but do NOT exist in reference.
    if (!isPlainObject(target) || !isPlainObject(reference)) return;

    for (const key of Object.keys(target)) {
        const currentPath = prefix ? `${prefix}.${key}` : key;

        if (!(key in reference)) {
            extraPaths.push(currentPath);
            continue;
        }

        const tgtVal = target[key];
        const refVal = reference[key];

        if (isPlainObject(tgtVal) && isPlainObject(refVal)) {
            collectExtraPaths(tgtVal, refVal, extraPaths, currentPath);
        }
    }
}

function reorderByReference(value, reference) {
    // Returns new object with keys ordered: reference keys first (recursively), then remaining keys.
    if (!isPlainObject(value) || !isPlainObject(reference)) return value;

    const ordered = {};

    for (const key of Object.keys(reference)) {
        if (key in value) {
            ordered[key] = reorderByReference(value[key], reference[key]);
        }
    }

    for (const key of Object.keys(value)) {
        if (!(key in ordered)) {
            ordered[key] = value[key];
        }
    }

    return ordered;
}

function escapeStringSingleQuotes(str) {
    return str
        .replace(/\\/g, '\\\\')
        .replace(/\r/g, '\\r')
        .replace(/\n/g, '\\n')
        .replace(/\t/g, '\\t')
        .replace(/\f/g, '\\f')
        .replace(/\v/g, '\\v')
        .replace(/'/g, "\\'");
}

function toTsLiteral(value, indentLevel) {
    const indent = '    '.repeat(indentLevel);
    const nextIndent = '    '.repeat(indentLevel + 1);

    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);

    if (typeof value === 'string') {
        return `'${escapeStringSingleQuotes(value)}'`;
    }

    if (Array.isArray(value)) {
        if (value.length === 0) return '[]';
        const items = value.map((item) => `${nextIndent}${toTsLiteral(item, indentLevel + 1)},`).join('\n');
        return `\n${indent}[\n${items}\n${indent}]`;
    }

    if (isPlainObject(value)) {
        const keys = Object.keys(value);
        if (keys.length === 0) return '{}';

        const lines = keys.map((key) => {
            const safeKey = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key) ? key : `'${escapeStringSingleQuotes(key)}'`;
            const rendered = toTsLiteral(value[key], indentLevel + 1);
            return `${nextIndent}${safeKey}: ${rendered},`;
        });

        return `\n${indent}{\n${lines.join('\n')}\n${indent}}`;
    }

    // Fallback: JSON stringify (shouldn't happen for these locale files)
    return JSON.stringify(value);
}

function writeLocaleTs(filePath, obj) {
    const body = toTsLiteral(obj, 0);
    const content = `export default ${body};\n`;
    fs.writeFileSync(filePath, content, 'utf8');
}

function main() {
    const args = process.argv.slice(2);
    const shouldWrite = args.includes('--write');
    const shouldFormat = args.includes('--format');
    const shouldShowExtra = args.includes('--show-extra');
    const shouldFailOnExtra = args.includes('--fail-on-extra');

    const reference = loadTsDefaultExport(EN_FILE);

    const files = fs
        .readdirSync(LOCALES_DIR)
        .filter((name) => name.endsWith('.ts'))
        .filter((name) => name !== 'index.ts')
        .filter((name) => name !== 'en.ts');

    const report = [];

    let totalExtra = 0;

    for (const fileName of files) {
        const filePath = path.join(LOCALES_DIR, fileName);
        const localeObj = loadTsDefaultExport(filePath);

        const missing = [];
        deepMergeMissing(localeObj, reference, missing);

        const extra = [];
        collectExtraPaths(localeObj, reference, extra);
        totalExtra += extra.length;

        const ordered = reorderByReference(localeObj, reference);

        report.push({ fileName, missingCount: missing.length, missing, extraCount: extra.length, extra });

        if (shouldWrite && (missing.length > 0 || shouldFormat)) {
            writeLocaleTs(filePath, ordered);
        }
    }

    report.sort((a, b) => b.missingCount - a.missingCount);

    const totalMissing = report.reduce((sum, r) => sum + r.missingCount, 0);

    console.log(`Locales checked: ${report.length}`);
    console.log(`Total missing keys filled: ${shouldWrite ? totalMissing : totalMissing} ${shouldWrite ? '(written)' : '(dry-run)'}`);
    console.log(`Total extra keys vs en.ts: ${totalExtra}`);

    for (const r of report) {
        if (r.missingCount === 0) continue;
        console.log(`- ${r.fileName}: +${r.missingCount}`);
    }

    const extraReport = report
        .filter((r) => r.extraCount > 0)
        .sort((a, b) => b.extraCount - a.extraCount);

    if (extraReport.length > 0) {
        console.log('\nExtra keys (present in locale but missing in en.ts):');
        for (const r of extraReport) {
            console.log(`- ${r.fileName}: +${r.extraCount}`);
            if (shouldShowExtra) {
                const lines = r.extra
                    .slice()
                    .sort()
                    .map((p) => `  - ${p}`)
                    .join('\n');
                console.log(lines);
            }
        }
    }

    if (!shouldWrite) {
        console.log('\nRun with --write to apply changes.');
        console.log('Add --format with --write to rewrite formatting for all locale files.');
    }

    if (shouldFailOnExtra && totalExtra > 0) {
        process.exitCode = 2;
    }
}

main();
