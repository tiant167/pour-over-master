import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { origin, tastingNotes } = req.body;

  const prompt =
    `A dreamy, ethereal watercolor painting inspired by ${Array.isArray(tastingNotes) && tastingNotes.length > 0 ? tastingNotes.join(', ') : 'floral, citrus, honey'} notes. Soft color washes blending into each other, abstract fluid shapes suggesting the essence of these flavors rather than literal objects. Delicate pastel gradients, gentle brushstrokes bleeding into the paper, a sense of floating and lightness. The mood is serene, poetic, and contemplative. NO text, NO realistic objects, pure abstract emotion.`;

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
