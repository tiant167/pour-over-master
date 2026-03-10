import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { base64Image } = req.body;
  if (!base64Image) {
    return res.status(400).json({ error: 'base64Image is required' });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
  }

  try {
    const mimeType = base64Image.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/)?.[1] || 'image/jpeg';
    const imageData = base64Image.split(',')[1];

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-preview',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Analyze this image of a coffee bean bag. Extract the following information into a strict JSON format.
If you cannot find specific information, make a highly educated guess based on the other information on the bag.

CRITICAL: You are a World Barista Champion. Based on the roast level, origin, and process you identify, you MUST ALSO invent a "Recipe Formula" for pour-over coffee (assumes a standard 15g dose).

The JSON must match this EXACT structure and nothing else:
{
  "name": "Name of the coffee or roaster",
  "roastLevel": "Light" | "Medium" | "Dark",
  "tastingNotes": ["note1", "note2", "note3"],
  "origin": "Country or specific region",
  "process": "Washed" | "Natural" | "Honey" | "Other",
  "aiFormula": {
    "title": "A creative title for this brew method",
    "profile": "A short text describing what this recipe achieves",
    "ratio": 15,
    "temperature": 92,
    "grindSize": "Medium-Fine" | "Medium" | "Medium-Coarse",
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

Rules for aiFormula.steps:
1. The first step is usually "Bloom" (around 0.15 to 0.25).
2. The targetWaterPercentage is CUMULATIVE.
3. The FINAL step's targetWaterPercentage must exactly equal 1.0.
4. Base durations should assume a 15g coffee bed.`
            },
            {
              inlineData: { data: imageData, mimeType }
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
    console.error('[recognize-bean] Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
