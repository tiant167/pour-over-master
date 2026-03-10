import { GoogleGenAI } from '@google/genai';
import { readFileSync, writeFileSync } from 'fs';

const env = readFileSync('.env', 'utf-8').split('\n').find(l => l.startsWith('GEMINI_API_KEY='))?.split('=')[1];
const ai = new GoogleGenAI({ apiKey: env });

async function run() {
  try {
    const res = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: [{ role: 'user', parts: [{ text: 'A cup of pour-over coffee, cinematic lighting' }] }]
    });
    const parts = res.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find(p => p.inlineData?.mimeType?.startsWith('image/'));
    const data = imagePart?.inlineData?.data;
    if(data) {
        console.log('SUCCESS length:', data.length);
        console.log('MIME TYPE:', imagePart.inlineData.mimeType);
        writeFileSync('/Users/haotianchai/Documents/workspace/pour-over-master/tmp/test.png', Buffer.from(data, 'base64'));
        console.log('wrote to tmp/test.png');
    } else {
        console.log('NO IMAGE PART');
    }
  } catch(e) { console.log('ERR', e.message); }
}

run();
