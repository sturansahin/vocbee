// ─── Groq Grammar Explanation Service ─────────────────────────────────────────
// API calls are routed through a backend proxy to keep the API key server-side.
// The proxy URL is set via EXPO_PUBLIC_GRAMMAR_PROXY_URL env variable.
// Fallback: direct Groq API call (only for local development with EXPO_PUBLIC_GROQ_API_KEY).
// In production builds, ONLY the proxy should be used — never ship the raw API key.
// ──────────────────────────────────────────────────────────────────────────────

import AsyncStorage from '@react-native-async-storage/async-storage';
import appConfig from '../app.json';
import { auth } from '../config/firebase';
import { STORAGE_KEYS } from '@shared/storage';

const APP_CONFIG_GRAMMAR_PROXY_URL = appConfig.expo.extra?.grammarProxyUrl ?? '';
const GRAMMAR_PROXY_URL = (
    process.env.EXPO_PUBLIC_GRAMMAR_PROXY_URL
    || (!__DEV__ ? APP_CONFIG_GRAMMAR_PROXY_URL : '')
).trim();
const GROQ_API_KEY_DEV = __DEV__ ? (process.env.EXPO_PUBLIC_GROQ_API_KEY || '') : '';
const FETCH_TIMEOUT_MS = 30_000; // 30 second timeout for API calls
const MAX_SENTENCE_LENGTH = 280;

// Persistent + in-memory grammar cache
const GRAMMAR_CACHE_KEY = STORAGE_KEYS.GRAMMAR_CACHE;
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
        // Keep only the last MAX_CACHE_ENTRIES in both memory and disk
        const entries = Array.from(grammarCache.entries());
        if (entries.length > MAX_CACHE_ENTRIES) {
            const trimmed = entries.slice(-MAX_CACHE_ENTRIES);
            grammarCache.clear();
            for (const [key, value] of trimmed) {
                grammarCache.set(key, value);
            }
            await AsyncStorage.setItem(GRAMMAR_CACHE_KEY, JSON.stringify(trimmed));
        } else {
            await AsyncStorage.setItem(GRAMMAR_CACHE_KEY, JSON.stringify(entries));
        }
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
    return rateLimitState.timestamps.length >= RATE_LIMIT_MAX_REQUESTS;
}

/** Record a rate limit slot. Call ONLY when actually making a request. */
function recordRateLimitHit(): void {
    rateLimitState.timestamps.push(Date.now());
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

interface GrammarApiResponse {
    error?: { message?: string };
    choices?: Array<{ message: { content: string } }>;
    sentence1?: SentenceAnalysis;
    sentence2?: SentenceAnalysis;
}

function assertValidGrammarRequest(sentence1: string, sentence2: string): void {
    const first = sentence1.trim();
    const second = sentence2.trim();

    if (!first || !second) {
        throw new Error('Please provide both sentences before requesting grammar help.');
    }

    if (first.length > MAX_SENTENCE_LENGTH || second.length > MAX_SENTENCE_LENGTH) {
        throw new Error('Sentences must be 280 characters or fewer.');
    }
}

async function getProxyHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    const idToken = await auth.currentUser?.getIdToken();
    if (idToken) {
        headers.Authorization = `Bearer ${idToken}`;
    } else if (!__DEV__) {
        throw new Error('Grammar service requires sign-in.');
    }

    return headers;
}

export const explainGrammar = async (
    sentence1: string,
    sentence2: string,
    outputLanguage: string = 'Turkish'
): Promise<GrammarResponse> => {
    try {
        assertValidGrammarRequest(sentence1, sentence2);

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

        // Record rate limit hit only when actually making the request
        recordRateLimitHit();

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

        // Fetch with timeout to prevent indefinite hangs
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

        let response: Response;
        try {
            // ── Route decision: proxy (production) vs direct Groq (dev-only) ──
            if (GRAMMAR_PROXY_URL) {
                // Production path: call backend proxy (API key stays server-side)
                const headers = await getProxyHeaders();
                response = await fetch(GRAMMAR_PROXY_URL, {
                    method: 'POST',
                    headers,
                    signal: controller.signal,
                    body: JSON.stringify({
                        sentence1: sentence1.trim(),
                        sentence2: sentence2.trim(),
                        outputLanguage,
                    }),
                } as RequestInit);
            } else if (GROQ_API_KEY_DEV) {
                // Dev-only fallback: direct Groq call (NEVER in production builds)
                console.warn('[groqService] Using direct Groq API — dev only, do NOT ship this key');
                response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${GROQ_API_KEY_DEV}`,
                        'Content-Type': 'application/json'
                    },
                    signal: controller.signal,
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
                } as RequestInit);
            } else {
                throw new Error('Grammar service is not configured. Please set EXPO_PUBLIC_GRAMMAR_PROXY_URL.');
            }
        } finally {
            clearTimeout(timeoutId);
        }

        const data = await response.json() as GrammarApiResponse;

        if (!response.ok) {
            throw new Error(data.error?.message || 'Failed to fetch explanation');
        }

        // Proxy returns the parsed result directly; direct Groq returns choices array
        const content: unknown = data.choices
            ? data.choices[0]?.message?.content
            : (data.sentence1 ? JSON.stringify(data) : data);

        // Parse JSON content
        try {
            const parsedData: GrammarResponse = typeof content === 'string'
                ? JSON.parse(content)
                : content;

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
