import type { Bean, RecipeFormula } from './beanService';

export interface BrewStep {
  name: string;
  targetWeight: number; // in grams
  duration: number; // in seconds (total duration of this step)
  pouringDuration: number; // in seconds (how long we are actively pouring)
  description: string;
}

export interface BrewRecipe {
  title: string;
  profile: string;
  ratio: number;
  temperature: number;
  grindSize: string;
  coffeeWeight: number;
  steps: BrewStep[];
}


/**
 * Calculates a mathematically scaled BrewRecipe based on a base RecipeFormula.
 * Scaling Rules:
 * - Water mass scales 100% linearly with coffee weight.
 * - Time scales with a damping factor (e.g. going from 15g to 30g only increases time by ~30%, not 100%).
 */
export function suggestRecipe(bean: Bean, coffeeWeight: number = 15): BrewRecipe {
  let formula: RecipeFormula;

  // 1. Read AI Generated Formula, or fallback to static defaults if missing
  if (bean.aiFormula && bean.aiFormula.steps && bean.aiFormula.steps.length > 0) {
    formula = bean.aiFormula;
  } else {
    formula = generateFallbackFormula(bean);
  }

  // 2. Mathematically Scale the Formula
  const totalWater = coffeeWeight * formula.ratio;
  
  // Damped Time Scaling Factor: Base is 15g. Every 1g variance changes time by 2% (0.02).
  // So 30g (+15g) = +30% time. 10g (-5g) = -10% time. Minimum scale factor is 0.5.
  const timeScaleFactor = Math.max(0.5, 1 + ((coffeeWeight - 15) * 0.02));

  const steps: BrewStep[] = formula.steps.map(fStep => ({
    name: fStep.name,
    targetWeight: Number((totalWater * fStep.targetWaterPercentage).toFixed(1)),
    duration: Math.round(fStep.baseDuration * timeScaleFactor),
    pouringDuration: Math.round(fStep.basePouringDuration * timeScaleFactor),
    description: fStep.description
  }));

  return {
    title: formula.title,
    profile: formula.profile,
    ratio: formula.ratio,
    temperature: formula.temperature,
    grindSize: formula.grindSize,
    coffeeWeight,
    steps
  };
}

/**
 * Generates a fallback static RecipeFormula if the AI failed to provide one.
 * These use percentages and base 15g times.
 */
function generateFallbackFormula(bean: Bean): RecipeFormula {
  if (bean.roastLevel === 'Light') {
    return {
      title: 'Bright & Floral Extraction',
      profile: 'Extracts high floral/fruit notes, crisp acidity.',
      ratio: 16,
      temperature: 96,
      grindSize: 'Medium-Fine',
      steps: [
        { name: 'Bloom', targetWaterPercentage: 0.125, baseDuration: 45, basePouringDuration: 10, description: 'Rapidly pour and gently swirl.' },
        { name: 'First Pour', targetWaterPercentage: 0.5625, baseDuration: 30, basePouringDuration: 15, description: 'Slow center pour.' },
        { name: 'Second Pour', targetWaterPercentage: 1.0, baseDuration: 30, basePouringDuration: 15, description: 'Pour concentric circles.' }
      ]
    };
  } else if (bean.roastLevel === 'Dark') {
    return {
      title: 'Rich & Smooth (Low Temp)',
      profile: 'Avoids bitter over-extraction, highlights body.',
      ratio: 14,
      temperature: 85,
      grindSize: 'Coarse',
      steps: [
        { name: 'Bloom', targetWaterPercentage: 0.178, baseDuration: 30, basePouringDuration: 10, description: 'Gentle bloom, minimal agitation.' },
        { name: 'Main Pour', targetWaterPercentage: 1.0, baseDuration: 60, basePouringDuration: 40, description: 'Slow and steady, keep water level low.' }
      ]
    };
  } else {
    // Medium fallback (4:6 Method Base)
    return {
      title: 'Sweetness Forward (4:6 Base)',
      profile: 'Balanced body, emphasizing sweetness and origin notes.',
      ratio: 15,
      temperature: 92,
      grindSize: 'Medium',
      steps: [
        { name: 'Bloom', targetWaterPercentage: 0.2, baseDuration: 45, basePouringDuration: 10, description: 'Bloom phase.' },
        { name: 'Phase 1', targetWaterPercentage: 0.4, baseDuration: 45, basePouringDuration: 12, description: 'Balances acidity.' },
        { name: 'Phase 2', targetWaterPercentage: 0.6, baseDuration: 45, basePouringDuration: 12, description: 'Enhances body.' },
        { name: 'Phase 3', targetWaterPercentage: 0.8, baseDuration: 45, basePouringDuration: 12, description: 'Increases strength.' },
        { name: 'Phase 4', targetWaterPercentage: 1.0, baseDuration: 45, basePouringDuration: 12, description: 'Finishes extraction.' }
      ]
    };
  }
}
