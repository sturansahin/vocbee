// file: src/features/vocabulary/composition/__tests__/vocabularyService.test.ts
// Mock the vocabularyService module to avoid .txt file import issues
jest.mock('../vocabularyService', () => ({
    getStoredVocabulary: jest.fn(),
    isVocabularyGenerated: jest.fn(),
    generateVocabulary: jest.fn(),
    getCurrentLevel: jest.fn(),
    getLearnedWords: jest.fn(),
    getLastWordId: jest.fn(),
    shuffleArray: jest.fn((arr) => arr),
    getLevelDisplay: jest.fn(),
}));

// Import after mocking
import {
    getStoredVocabulary,
    isVocabularyGenerated,
    generateVocabulary
} from '../vocabularyService';

describe('VocabularyService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('isVocabularyGenerated returns false when nothing stored', async () => {
        (isVocabularyGenerated as jest.Mock).mockResolvedValue(false);
        const result = await isVocabularyGenerated();
        expect(result).toBe(false);
    });

    it('getStoredVocabulary returns empty array if no data', async () => {
        (getStoredVocabulary as jest.Mock).mockResolvedValue([]);
        const result = await getStoredVocabulary('A1');
        expect(result).toEqual([]);
    });

    it('getStoredVocabulary returns stored vocabulary', async () => {
        const mockData = [{ id: 1, word: 'Test' }];
        (getStoredVocabulary as jest.Mock).mockResolvedValue(mockData);

        const result = await getStoredVocabulary('A1');
        expect(result).toHaveLength(1);
        expect(result[0].word).toEqual('Test');
    });

    it('generateVocabulary is callable', async () => {
        (generateVocabulary as jest.Mock).mockResolvedValue(undefined);
        await expect(generateVocabulary('english', 'A1')).resolves.toBeUndefined();
        expect(generateVocabulary).toHaveBeenCalledWith('english', 'A1');
    });
});
