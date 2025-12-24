/**
 * Build-time script to convert CSV vocabulary files to JSON
 * 
 * Usage: node scripts/generateVocabulary.js
 * 
 * This script:
 * 1. Reads all CSV files from assets/language/{language}/ folders
 * 2. Parses them into structured JSON
 * 3. Saves combined vocabulary files to assets/vocabulary/
 * 
 * Output structure per level:
 * {
 *   words: [
 *     {
 *       id: number,
 *       word: string,         // Target language word
 *       sentence1: string,    // Example sentence 1 (target)
 *       sentence2: string,    // Example sentence 2 (target)
 *     }
 *   ]
 * }
 */

const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, '..', 'assets');
const LANGUAGE_DIR = path.join(ASSETS_DIR, 'language');
const OUTPUT_DIR = path.join(ASSETS_DIR, 'vocabulary');

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];

// Get all language folders
function getLanguages() {
    return fs.readdirSync(LANGUAGE_DIR).filter(item => {
        const itemPath = path.join(LANGUAGE_DIR, item);
        return fs.statSync(itemPath).isDirectory();
    });
}

// Parse CSV content
function parseCSV(content) {
    const lines = content.split('\n').filter(line => line.trim());
    const words = [];

    // Skip header line
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Split by | delimiter
        const parts = line.split('|');
        if (parts.length >= 3) {
            words.push({
                id: i,
                word: parts[0].trim(),
                sentence1: parts[1].trim(),
                sentence2: parts[2].trim()
            });
        }
    }

    return words;
}

// Read and parse CSV file
function readCSV(language, level) {
    const filename = `${level}_${language}.csv`;
    const filepath = path.join(LANGUAGE_DIR, language, filename);

    if (!fs.existsSync(filepath)) {
        console.warn(`Warning: ${filepath} not found`);
        return [];
    }

    const content = fs.readFileSync(filepath, 'utf-8');
    return parseCSV(content);
}

// Generate vocabulary JSON for a language
function generateLanguageVocabulary(language) {
    console.log(`Processing ${language}...`);

    const languageOutput = {};

    for (const level of LEVELS) {
        const words = readCSV(language, level);
        languageOutput[level] = { words };
        console.log(`  ${level}: ${words.length} words`);
    }

    // Save to output file
    const outputPath = path.join(OUTPUT_DIR, `${language}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(languageOutput, null, 2), 'utf-8');
    console.log(`  Saved to ${outputPath}`);

    return languageOutput;
}

// Main function
function main() {
    console.log('=== Vocabulary Generator ===\n');

    // Create output directory if not exists
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
        console.log(`Created output directory: ${OUTPUT_DIR}\n`);
    }

    const languages = getLanguages();
    console.log(`Found ${languages.length} languages: ${languages.join(', ')}\n`);

    // Generate vocabulary for each language
    for (const language of languages) {
        generateLanguageVocabulary(language);
        console.log('');
    }

    // Create an index file for easy imports
    const indexContent = `// Auto-generated vocabulary index
// Run: node scripts/generateVocabulary.js to regenerate

${languages.map(lang => `export const ${lang}Vocabulary = require('./${lang}.json');`).join('\n')}

export const AVAILABLE_LANGUAGES = ${JSON.stringify(languages, null, 2)};
`;

    fs.writeFileSync(path.join(OUTPUT_DIR, 'index.ts'), indexContent, 'utf-8');
    console.log('Created vocabulary index file');

    console.log('\n=== Generation Complete ===');
}

main();
