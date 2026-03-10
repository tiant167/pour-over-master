import { getItem, setItem, StorageKeys } from './storage';

export interface FormulaStep {
  name: string;
  targetWaterPercentage: number; // e.g. 0.2 for 20%
  baseDuration: number; // in seconds (for 15g)
  basePouringDuration: number; // in seconds (for 15g)
  description: string;
}

export interface RecipeFormula {
  title: string;
  profile: string;
  ratio: number;
  temperature: number;
  grindSize: string;
  steps: FormulaStep[];
}

export interface Bean {
  id: string;
  name: string;
  roastLevel: string;
  tastingNotes: string[];
  origin?: string;
  process?: string;
  createdAt: number;
  aiFormula?: RecipeFormula; // Persist the AI-generated formula here
}

export async function getBeans(): Promise<Bean[]> {
  const beans = await getItem<Bean[]>(StorageKeys.BEANS);
  return beans || [];
}

export async function addBean(bean: Omit<Bean, 'id' | 'createdAt'>): Promise<Bean> {
  const beans = await getBeans();
  const newBean: Bean = {
    ...bean,
    id: crypto.randomUUID(),
    createdAt: Date.now()
  };
  beans.push(newBean);
  await setItem(StorageKeys.BEANS, beans);
  return newBean;
}

export async function updateBean(id: string, updates: Partial<Bean>): Promise<void> {
  const beans = await getBeans();
  const index = beans.findIndex(b => b.id === id);
  if (index !== -1) {
    beans[index] = { ...beans[index], ...updates };
    await setItem(StorageKeys.BEANS, beans);
  }
}

export async function deleteBean(id: string): Promise<void> {
  let beans = await getBeans();
  beans = beans.filter(b => b.id !== id);
  await setItem(StorageKeys.BEANS, beans);
}

export async function getBeanById(id: string): Promise<Bean | undefined> {
  const beans = await getBeans();
  return beans.find(b => b.id === id);
}
