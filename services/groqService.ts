// API key is loaded from environment variables for security
// Create a .env file with EXPO_PUBLIC_GROQ_API_KEY=your_key
const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

import AsyncStorage from '@react-native-async-storage/async-storage';

// Persistent + in-memory grammar cache
const GRAMMAR_CACHE_KEY = '@grammar_cache';
const grammarCache = new Map<string, GrammarResponse>();
const MAX_CACHE_ENTRIES = 100;

// Load cache from AsyncStorage on first use
let cacheLoaded = false;
async function ensureCacheLoaded(): Promise<void> {
    if (cacheLoaded) return;
    try {
        const stored = await AsyncStorage.getItem(GRAMMAR_CACHE_KEY);
        if (stored) {
            const entries: [string, GrammarResponse][] = JSON.parse(stored);
            for (const [key, value] of entries) {
                grammarCache.set(key, value);
            }
        }
    } catch (e) {
        console.error('Error loading grammar cache:', e);
    }
    cacheLoaded = true;
}

async function persistCache(): Promise<void> {
    try {
        // Keep only the last MAX_CACHE_ENTRIES
        const entries = Array.from(grammarCache.entries());
        const trimmed = entries.slice(-MAX_CACHE_ENTRIES);
        await AsyncStorage.setItem(GRAMMAR_CACHE_KEY, JSON.stringify(trimmed));
    } catch (e) {
        console.error('Error persisting grammar cache:', e);
    }
}

// ─── Rate Limiter ────────────────────────────────────────────────────────────
// Prevents abuse by limiting requests per user session.
// Window: 60 seconds, Max requests per window: 10
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 10;

interface RateLimitState {
    timestamps: number[];
}

const rateLimitState: RateLimitState = { timestamps: [] };

function isRateLimited(): boolean {
    const now = Date.now();
    // Remove timestamps outside the current window
    rateLimitState.timestamps = rateLimitState.timestamps.filter(
        (ts) => now - ts < RATE_LIMIT_WINDOW_MS
    );
    if (rateLimitState.timestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
        return true;
    }
    rateLimitState.timestamps.push(now);
    return false;
}
// ─────────────────────────────────────────────────────────────────────────────

export interface SentenceAnalysis {
    structure: string;
    grammar: string;
    reason: string;
}

export interface GrammarResponse {
    sentence1: SentenceAnalysis;
    sentence2: SentenceAnalysis;
}

export const explainGrammar = async (
    sentence1: string,
    sentence2: string,
    outputLanguage: string = 'Turkish'
): Promise<GrammarResponse> => {
    try {
        // Create a unique key for the cache
        const cacheKey = `${sentence1.trim()}|${sentence2.trim()}|${outputLanguage}`;

        // Ensure persistent cache is loaded
        await ensureCacheLoaded();

        // Return cached response if available
        if (grammarCache.has(cacheKey)) {
            console.log('Returning cached grammar explanation');
            return grammarCache.get(cacheKey)!;
        }

        // Check rate limit before making API call
        if (isRateLimited()) {
            throw new Error('Too many requests. Please wait a moment and try again.');
        }

        const prompt = `Analyze the grammar of the following two sentences.

Explain everything in ${outputLanguage}.
Use simple language suitable for beginner to intermediate learners.

For each sentence:
- In "structure", mention a clear and visible grammar clue the learner can notice
- In "grammar", explain the rule in a simple way
- In "reason", explain when and why this structure is commonly used in daily language

Return ONLY valid JSON.
Do not add extra text.
Do not use markdown.

JSON format:
{
  "sentence1": {
    "structure": "",
    "grammar": "",
    "reason": ""
  },
  "sentence2": {
    "structure": "",
    "grammar": "",
    "reason": ""
  }
}

Sentence 1: "${sentence1}"
Sentence 2: "${sentence2}"`;

        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    {
                        role: 'system',
                        content: `You are an excellent language teacher.
Your goal is not only to explain grammar, but to help the learner understand how to recognize and use it.

Teach in a practical and intuitive way.
Avoid academic terminology.
Always explain using simple, clear language.

Focus on:
- how the learner can notice this structure
- when this structure is commonly used

Follow the output format exactly.`
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.3,
                max_tokens: 1024,
                response_format: { type: "json_object" }
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || 'Failed to fetch explanation');
        }

        const content = data.choices[0].message.content;

        // Parse JSON content
        try {
            const parsedData: GrammarResponse = JSON.parse(content);

            // Cache the successful result (memory + disk)
            grammarCache.set(cacheKey, parsedData);
            await persistCache();

            return parsedData;
        } catch (parseError) {
            console.error('Failed to parse AI response as JSON:', content);
            throw new Error('Invalid response format from AI');
        }

    } catch (error) {
        console.error('Error fetching grammar explanation:', error);
        throw error;
    }
};
