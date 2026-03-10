import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
  }

  const { origin, tastingNotes } = req.body;

  const prompt =
    `Aesthetic top-down pour-over coffee brewing photo, ${origin || 'specialty'} coffee origin, ` +
    `moody cinematic lighting, rich dark background, coffee drip mid-pour, ` +
    `flavor notes of ${Array.isArray(tastingNotes) && tastingNotes.length > 0 ? tastingNotes.join(', ') : 'chocolate and fruit'}, ` +
    `photorealistic, high contrast, award-winning food photography`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseModalities: ['IMAGE', 'TEXT'],
      }
    });

    const parts = response.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find(p => p.inlineData?.mimeType?.startsWith('image/'));

    if (!imagePart?.inlineData?.data) {
      return res.status(500).json({ error: 'Gemini returned no image data.' });
    }

    const dataUrl = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
    return res.status(200).json({ dataUrl });

  } catch (error) {
    console.error('[generate-image] Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
