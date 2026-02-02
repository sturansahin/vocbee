// API key is loaded from environment variables for security
// Create a .env file with EXPO_PUBLIC_GROQ_API_KEY=your_key
const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Simple in-memory cache to store explanations during the app session
const grammarCache = new Map<string, GrammarResponse>();

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

        // Return cached response if available
        if (grammarCache.has(cacheKey)) {
            console.log('Returning cached grammar explanation');
            return grammarCache.get(cacheKey)!;
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

            // Cache the successful result
            grammarCache.set(cacheKey, parsedData);

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
