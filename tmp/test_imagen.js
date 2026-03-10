import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function test() {
  try {
    const response = await ai.models.generateImages({
      model: 'imagen-3.0-generate-001',
      prompt: 'A cup of pour-over coffee, cinematic lighting',
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
      }
    });

    console.log("Success! Got images:", response.generatedImages?.length);
    if (response.generatedImages?.[0]?.image?.imageBytes) {
      console.log("Got base64 bytes:", response.generatedImages[0].image.imageBytes.substring(0, 50) + "...");
    }
  } catch (err) {
    console.error("SDK error:", err);
  }
}

test();
