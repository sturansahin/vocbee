/**
 * VocBee Grammar Proxy — Cloudflare Worker
 *
 * Deploy this worker to keep GROQ_API_KEY on the server side.
 * Set `GROQ_API_KEY` as a secret in the Cloudflare dashboard:
 *   wrangler secret put GROQ_API_KEY
 *
 * Then in your .env set:
 *   EXPO_PUBLIC_GRAMMAR_PROXY_URL=https://your-worker.your-subdomain.workers.dev
 *
 * The worker accepts { sentence1, sentence2, outputLanguage } and returns
 * the parsed GrammarResponse JSON directly.
 */

export interface Env {
    GROQ_API_KEY: string;
}

// Simple IP-based rate limiter (in-memory, resets on cold start)
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;

function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const timestamps = (rateLimitMap.get(ip) || []).filter(t => now - t < RATE_LIMIT_WINDOW_MS);
    if (timestamps.length >= RATE_LIMIT_MAX) return true;
    timestamps.push(now);
    rateLimitMap.set(ip, timestamps);
    return false;
}

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        // CORS preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                },
            });
        }

        if (request.method !== 'POST') {
            return new Response('Method not allowed', { status: 405 });
        }

        const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
        if (isRateLimited(clientIP)) {
            return new Response(JSON.stringify({ error: 'Too many requests' }), {
                status: 429,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        try {
            const { sentence1, sentence2, outputLanguage = 'Turkish' } = await request.json() as any;

            if (!sentence1 || !sentence2) {
                return new Response(JSON.stringify({ error: 'sentence1 and sentence2 are required' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                });
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
  "sentence1": { "structure": "", "grammar": "", "reason": "" },
  "sentence2": { "structure": "", "grammar": "", "reason": "" }
}

Sentence 1: "${sentence1}"
Sentence 2: "${sentence2}"`;

            const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${env.GROQ_API_KEY}`,
                    'Content-Type': 'application/json',
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
Follow the output format exactly.`,
                        },
                        { role: 'user', content: prompt },
                    ],
                    temperature: 0.3,
                    max_tokens: 1024,
                    response_format: { type: 'json_object' },
                }),
            });

            const data = await groqResponse.json() as any;

            if (!groqResponse.ok) {
                return new Response(JSON.stringify({ error: data.error?.message || 'Groq API error' }), {
                    status: groqResponse.status,
                    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                });
            }

            const content = data.choices[0].message.content;
            const parsed = JSON.parse(content);

            return new Response(JSON.stringify(parsed), {
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            });
        } catch (error: any) {
            return new Response(JSON.stringify({ error: error.message || 'Internal error' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            });
        }
    },
};
