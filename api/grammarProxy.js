export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sentence1, sentence2, outputLanguage = 'Turkish' } = req.body;

    if (!sentence1 || !sentence2) {
      return res.status(400).json({ error: 'sentence1 and sentence2 required' });
    }

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

JSON format MUST BE exactly this:
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

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are an excellent language teacher. Return exactly the JSON format requested, without any markdown formatting.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" }
      })
    });

    const data = await response.json();

    // Temizlik işlemi: Yapay zekanın markdown ekleyip bozma ihtimaline karşı ek koruma
    let rawContent = data.choices[0].message.content;

    // Eğer cevap ```json ile başlıyorsa temizle
    if (rawContent.startsWith('\`\`\`json')) {
      rawContent = rawContent.substring(7);
      if (rawContent.endsWith('\`\`\`')) {
        rawContent = rawContent.substring(0, rawContent.length - 3);
      }
    } else if (rawContent.startsWith('\`\`\`')) {
      rawContent = rawContent.substring(3);
      if (rawContent.endsWith('\`\`\`')) {
        rawContent = rawContent.substring(0, rawContent.length - 3);
      }
    }

    // Uçlardaki boşlukları temizle
    rawContent = rawContent.trim();

    // Parse edip gönder
    const parsedData = JSON.parse(rawContent);

    return res.status(200).json(parsedData);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}