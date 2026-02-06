// file: services/__tests__/groqService.test.ts
import { explainGrammar, GrammarResponse } from '../groqService';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('groqService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Clear the module cache to reset the internal grammarCache
        jest.resetModules();
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
                json: async () => ({
                    choices: [{
                        message: {
                            content: JSON.stringify(mockSuccessResponse),
                        },
                    }],
                }),
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
                json: async () => ({
                    choices: [{
                        message: {
                            content: JSON.stringify(mockSuccessResponse),
                        },
                    }],
                }),
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
                json: async () => ({
                    choices: [{
                        message: {
                            content: JSON.stringify(mockSuccessResponse),
                        },
                    }],
                }),
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
                json: async () => ({
                    choices: [{
                        message: {
                            content: JSON.stringify(mockSuccessResponse),
                        },
                    }],
                }),
            });

            await explainGrammar('Test 1', 'Test 2', 'Turkish');

            expect(mockFetch).toHaveBeenCalledWith(
                'https://api.groq.com/openai/v1/chat/completions',
                expect.any(Object)
            );
        });

        it('sends correct request body', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [{
                        message: {
                            content: JSON.stringify(mockSuccessResponse),
                        },
                    }],
                }),
            });

            await explainGrammar('Hello world', 'Goodbye world', 'German');

            const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
            expect(callBody.model).toBe('llama-3.3-70b-versatile');
            expect(callBody.temperature).toBe(0.3);
            expect(callBody.max_tokens).toBe(1024);
            expect(callBody.response_format.type).toBe('json_object');
        });

        it('includes output language in prompt', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [{
                        message: {
                            content: JSON.stringify(mockSuccessResponse),
                        },
                    }],
                }),
            });

            await explainGrammar('Spanish Test 1', 'Spanish Test 2', 'Spanish');

            const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
            const userMessage = callBody.messages.find((m: any) => m.role === 'user');
            expect(userMessage.content).toContain('Spanish');
        });

        it('defaults to Turkish output language', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [{
                        message: {
                            content: JSON.stringify(mockSuccessResponse),
                        },
                    }],
                }),
            });

            await explainGrammar('Turkish Default 1', 'Turkish Default 2');

            const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
            const userMessage = callBody.messages.find((m: any) => m.role === 'user');
            expect(userMessage.content).toContain('Turkish');
        });
    });
});
