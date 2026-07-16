// file: services/__tests__/groqService.test.ts
import type { GrammarResponse } from '../groqService';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

const mockAuth: {
    currentUser: null | { getIdToken: jest.Mock };
} = {
    currentUser: null,
};

jest.mock('@shared/firebase', () => ({
    auth: mockAuth,
}));

describe('groqService', () => {
    let explainGrammar: typeof import('../groqService').explainGrammar;

    beforeEach(async () => {
        jest.clearAllMocks();
        mockAuth.currentUser = null;
        // Clear the module cache to reset the internal grammarCache
        jest.resetModules();
        process.env.EXPO_PUBLIC_GRAMMAR_PROXY_URL = 'https://vocbee-proxy.vercel.app/api/grammarProxy';
        explainGrammar = require('../groqService').explainGrammar;
    });

    describe('explainGrammar', () => {
        const mockSuccessResponse: GrammarResponse = {
            sentence1: {
                structure: 'Subject + Verb + Object',
                grammar: 'Simple present tense',
                reason: 'Used for daily habits',
            },
            sentence2: {
                structure: 'Subject + be + Adjective',
                grammar: 'Be verb usage',
                reason: 'Describes states',
            },
        };

        it('returns grammar explanation for valid input', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockSuccessResponse,
            });

            const result = await explainGrammar(
                'I eat breakfast.',
                'She is happy.',
                'English'
            );

            expect(result.sentence1.structure).toBe('Subject + Verb + Object');
            expect(result.sentence2.grammar).toBe('Be verb usage');
        });

        it('caches responses for same input', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => mockSuccessResponse,
            });

            // First call
            await explainGrammar('Test sentence 1', 'Test sentence 2', 'Turkish');
            
            // Second call with same input
            await explainGrammar('Test sentence 1', 'Test sentence 2', 'Turkish');

            // Should only fetch once due to caching
            expect(mockFetch).toHaveBeenCalledTimes(1);
        });

        it('makes different API calls for different inputs', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => mockSuccessResponse,
            });

            await explainGrammar('Sentence A', 'Sentence B', 'Turkish');
            await explainGrammar('Sentence C', 'Sentence D', 'Turkish');

            expect(mockFetch).toHaveBeenCalledTimes(2);
        });

        it('throws error on API failure', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                json: async () => ({
                    error: { message: 'API rate limit exceeded' },
                }),
            });

            await expect(
                explainGrammar('Test 1', 'Test 2', 'Turkish')
            ).rejects.toThrow('API rate limit exceeded');
        });

        it('throws error on invalid JSON response', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [{
                        message: {
                            content: 'This is not valid JSON',
                        },
                    }],
                }),
            });

            await expect(
                explainGrammar('Test 1', 'Test 2', 'Turkish')
            ).rejects.toThrow('Invalid response format from AI');
        });

        it('throws error on network failure', async () => {
            mockFetch.mockRejectedValueOnce(new Error('Network error'));

            await expect(
                explainGrammar('Test 1', 'Test 2', 'Turkish')
            ).rejects.toThrow('Network error');
        });

        it('uses correct API endpoint', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockSuccessResponse,
            });

            await explainGrammar('Test 1', 'Test 2', 'Turkish');

            expect(mockFetch).toHaveBeenCalledWith(
                'https://vocbee-proxy.vercel.app/api/grammarProxy',
                expect.any(Object)
            );
        });

        it('sends Firebase auth token to the proxy when available', async () => {
            mockAuth.currentUser = {
                getIdToken: jest.fn().mockResolvedValue('firebase-id-token'),
            };
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockSuccessResponse,
            });

            await explainGrammar('Test 1', 'Test 2', 'Turkish');

            expect(mockAuth.currentUser.getIdToken).toHaveBeenCalledTimes(1);
            expect(mockFetch.mock.calls[0][1].headers.Authorization).toBe('Bearer firebase-id-token');
        });

        it('sends correct request body', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockSuccessResponse,
            });

            await explainGrammar('Hello world', 'Goodbye world', 'German');

            const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
            expect(callBody.sentence1).toBe('Hello world');
            expect(callBody.sentence2).toBe('Goodbye world');
            expect(callBody.outputLanguage).toBe('German');
        });

        it('includes output language in prompt', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockSuccessResponse,
            });

            await explainGrammar('Spanish Test 1', 'Spanish Test 2', 'Spanish');

            const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
            expect(callBody.outputLanguage).toBe('Spanish');
        });

        it('defaults to Turkish output language', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockSuccessResponse,
            });

            await explainGrammar('Turkish Default 1', 'Turkish Default 2');

            const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
            expect(callBody.outputLanguage).toBe('Turkish');
        });
    });
});
