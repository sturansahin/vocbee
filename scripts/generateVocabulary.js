/**
 * Build-time script to convert CSV vocabulary files to JSON
 * 
 * Usage: node scripts/generateVocabulary.js
 * 
 * This script:
 * 1. Reads all CSV files from assets/language/{language}/ folders
 * 2. Parses them into structured JSON
 * 3. Saves LEVEL-BASED vocabulary files to assets/vocabulary/ (e.g., english_A1.txt)
 * 
 * Output structure:
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

// Generate vocabulary JSON files for a language (LEVEL-BASED)
function generateLanguageVocabulary(language) {
    console.log(`Processing ${language}...`);

    let totalWords = 0;

    for (const level of LEVELS) {
        const words = readCSV(language, level);

        if (words.length > 0) {
            // Save each level as a separate file
            const outputPath = path.join(OUTPUT_DIR, `${language}_${level}.txt`);
            fs.writeFileSync(outputPath, JSON.stringify({ words }, null, 2), 'utf-8');
            console.log(`  ${level}: ${words.length} words -> ${language}_${level}.txt`);
            totalWords += words.length;
        } else {
            console.log(`  ${level}: 0 words (skipped)`);
        }
    }

    console.log(`  Total: ${totalWords} words`);
    return totalWords;
}

// Main function
function main() {
    console.log('=== Vocabulary Generator (Level-Based) ===\n');

    // Create output directory if not exists
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
        console.log(`Created output directory: ${OUTPUT_DIR}\n`);
    }

    // Clean old combined files
    const existingFiles = fs.readdirSync(OUTPUT_DIR);
    for (const file of existingFiles) {
        if ((file.endsWith('.txt') || file.endsWith('.json')) && !file.includes('_') && file !== 'index.ts') {
            // Old combined file (e.g., english.json / english.txt), delete it
            fs.unlinkSync(path.join(OUTPUT_DIR, file));
            console.log(`Removed old file: ${file}`);
        }
    }

    const languages = getLanguages();
    console.log(`Found ${languages.length} languages: ${languages.join(', ')}\n`);

    // Generate vocabulary for each language
    let grandTotal = 0;
    for (const language of languages) {
        grandTotal += generateLanguageVocabulary(language);
        console.log('');
    }

    // Create an index file listing all available files
    const files = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.txt'));
    const indexContent = `// Auto-generated vocabulary index
// Run: node scripts/generateVocabulary.js to regenerate

export const AVAILABLE_LANGUAGES = ${JSON.stringify(languages, null, 2)};

export const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];

// Level-based file names: {language}_{level}.txt (JSON content)
// Example: english_A1.txt, turkish_B2.txt
`;

    fs.writeFileSync(path.join(OUTPUT_DIR, 'index.ts'), indexContent, 'utf-8');
    console.log('Created vocabulary index file');

    console.log(`\n=== Generation Complete ===`);
    console.log(`Total files: ${files.length}`);
    console.log(`Total words: ${grandTotal}`);
}

main();
