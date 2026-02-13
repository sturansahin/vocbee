import type { VercelRequest, VercelResponse } from '@vercel/node';

const GROQ_API_KEY = process.env.GROQ_API_KEY;

export default async function handler(
    request: VercelRequest,
    response: VercelResponse
) {
    // CORS configuration
    response.setHeader('Access-Control-Allow-Credentials', 'true');
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    response.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // Handle OPTIONS request
    if (request.method === 'OPTIONS') {
        response.status(200).end();
        return;
    }

    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method not allowed' });
    }

    if (!GROQ_API_KEY) {
        return response.status(500).json({ error: 'Server configuration error' });
    }

    try {
        const { sentence1, sentence2, outputLanguage } = request.body;

        const prompt = `Analyze the grammar of the following two sentences.

Explain everything in ${outputLanguage || 'Turkish'}.
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

        const fetchResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
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
            }),
        });

        const data = await fetchResponse.json();

        if (!fetchResponse.ok) {
            throw new Error(data.error?.message || 'Failed to fetch explanation');
        }

        return response.status(200).json(data.choices[0].message.content);

    } catch (error: any) {
        console.error('Proxy error:', error);
        return response.status(500).json({ error: error.message || 'Internal Server Error' });
    }
}
