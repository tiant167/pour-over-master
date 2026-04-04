import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { origin, tastingNotes } = req.body;

  const prompt =
    `A breathtaking, cinematic landscape photography of ${origin || 'a beautiful high-altitude coffee-growing region'}, featuring iconic geographical landmarks, stunning nature, or cultural essence of this specific origin. The scene should be highly aesthetic, moody, and atmospheric, visually reflecting the abstract feeling of tasting notes like ${Array.isArray(tastingNotes) && tastingNotes.length > 0 ? tastingNotes.join(', ') : 'floral and fruit'}. Photorealistic, National Geographic style landscape, rich colors, deep contrast. NO text or words in the image.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
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
    console.error('[generate-image] Error stack:', error.stack);
    console.error('[generate-image] Request body:', { origin, tastingNotes });
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
