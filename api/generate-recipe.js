import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
  }

  const { name, origin, roastLevel, process: processMethod, tastingNotes } = req.body;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-preview',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `You are a World Barista Champion. I have a coffee bean with the following details:
Name: ${name || 'Unknown'}
Origin: ${origin || 'Unknown'}
Roast Level: ${roastLevel || 'Medium'}
Processing Method: ${processMethod || 'Unknown'}
Tasting Notes: ${Array.isArray(tastingNotes) ? tastingNotes.join(', ') : 'None provided'}

Based on this profile, invent a "Recipe Formula" for pour-over coffee (assumes a standard 15g dose).

Return ONLY a valid JSON object:
{
  "aiFormula": {
    "title": "A creative title for this brew method",
    "profile": "A short text describing what this recipe achieves",
    "ratio": 15,
    "temperature": 92,
    "grindSize": "Medium-Fine",
    "steps": [
      {
        "name": "Bloom",
        "targetWaterPercentage": 0.2,
        "baseDuration": 45,
        "basePouringDuration": 10,
        "description": "Very short instruction, max 8 words"
      }
    ]
  }
}

Rules for steps:
1. First step is "Bloom" (around 0.15–0.25).
2. targetWaterPercentage is CUMULATIVE.
3. FINAL step's targetWaterPercentage must exactly equal 1.0.
4. Base durations assume 15g coffee bed.`
            }
          ]
        }
      ]
    });

    const text = response.text || '';
    const jsonStr = text.replace(/```json\n/g, '').replace(/```/g, '').trim();
    const result = JSON.parse(jsonStr);
    return res.status(200).json(result);

  } catch (error) {
    console.error('[generate-recipe] Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
