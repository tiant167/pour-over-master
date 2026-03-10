import { checkRateLimit, incrementRateLimit } from './rateLimiter';

export interface CoffeeBeanRecognition {
  name: string;
  roastLevel: string;
  tastingNotes: string[];
  origin?: string;
  process?: string;
  aiFormula?: any;
}

export async function recognizeCoffeeBean(base64Image: string): Promise<CoffeeBeanRecognition> {
  const rateLimit = await checkRateLimit();
  if (!rateLimit.allowed) {
    throw new Error('Daily AI recognition rate limit exceeded. Please try again tomorrow.');
  }

  const response = await fetch('/api/recognize-bean', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ base64Image }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || 'Failed to recognize bean. Please try again.');
  }

  const result: CoffeeBeanRecognition = await response.json();
  await incrementRateLimit();
  return result;
}

export async function generateRecipeFromText(beanData: Partial<CoffeeBeanRecognition>): Promise<any> {
  const rateLimit = await checkRateLimit();
  if (!rateLimit.allowed) {
    throw new Error('Daily AI recognition rate limit exceeded.');
  }

  const response = await fetch('/api/generate-recipe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: beanData.name,
      origin: beanData.origin,
      roastLevel: beanData.roastLevel,
      process: beanData.process,
      tastingNotes: beanData.tastingNotes,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || 'Failed to generate recipe. Please try again.');
  }

  const result = await response.json();
  await incrementRateLimit();
  return result.aiFormula;
}

/**
 * Generates an aesthetic image via the server-side Gemini proxy.
 * Returns a base64 data URL string (e.g. "data:image/jpeg;base64,...")
 */
export async function generateAIImage(origin: string, tastingNotes: string[]): Promise<string> {
  const response = await fetch('/api/generate-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ origin, tastingNotes }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || 'Failed to generate image.');
  }

  const { dataUrl } = await response.json();
  return dataUrl;
}
