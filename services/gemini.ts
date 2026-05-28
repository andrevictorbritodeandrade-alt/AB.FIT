
import { EXERCISE_CATALOG, FULL_EXERCISE_LIST } from "../src/constants/exerciseCatalog";

const MODEL_TEXT = 'gemini-1.5-flash';
const MODEL_IMAGE = 'gemini-2.0-flash';

export async function callAI(params: any) {
  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
    }

    return await response.json();
  } catch (e: any) {
    console.error("AI Error:", e);
    throw e;
  }
}

export async function analyzeExerciseAndGenerateImage(exerciseName: string, studentProfile?: any): Promise<any> {
  try {
    const brainPrompt = `Analise o exercício "${exerciseName}". 
    Instruções biomecânicas de Mestre:
    - Se HBC: Haltere (Dumbbell).
    - Se HBL: Barra Longa Olímpica.
    - Se "alternado": Execução assimétrica.
    
    Forneça JSON puro: {"description": "descrição curta", "benefits": "3 benefícios principais", "visualPrompt": "Detailed 4k gym prompt for imagen of a black athlete"}`;

    const brainResultRaw = await callAI({
      model: MODEL_TEXT,
      prompt: brainPrompt,
      responseMimeType: "application/json"
    });

    const brainResult = JSON.parse(brainResultRaw.text || "{}");
    
    const imageResult = await callAI({
      model: MODEL_IMAGE,
      prompt: brainResult.visualPrompt || `Professional athlete performing ${exerciseName}, gym setting, 4k resolution`,
      isImageGeneration: true
    });
    
    return { ...brainResult, imageUrl: imageResult.imageUrl };
  } catch (e) {
    console.error("Erro GenAI:", e);
    return null;
  }
}

export async function generateWorkoutFromText(prompt: string): Promise<any[]> {
  const catalogNames = FULL_EXERCISE_LIST.map(ex => ex.name).join(', ');
  const systemInstruction = `
    Você é o ABFIT AI, um treinador Mestre. 
    Gere uma lista de exercícios baseada no pedido do usuário.
    IMPORTANTE: Sempre que possível, utilize os nomes exatos desta lista de exercícios: [${catalogNames}].
    Se o exercício não estiver na lista, use um nome profissional e claro em Português.
    Retorne APENAS um JSON array.
    Estrutura: [{"name": "Nome", "sets": "3", "reps": "12", "rest": "60", "method": "Normal", "load": ""}]
  `;

  try {
    const response = await callAI({
      model: MODEL_TEXT,
      prompt: prompt,
      systemInstruction: systemInstruction,
      responseMimeType: "application/json"
    });

    const text = response.text || "[]";
    const json = JSON.parse(text);
    return Array.isArray(json) ? json : [];
  } catch (e) {
    console.error("Erro ao gerar treino por texto:", e);
    return [];
  }
}

export async function generateRunningPlan(anamneseData: any): Promise<any> {
  const prompt = `Gere planilha de corrida para: ${JSON.stringify(anamneseData)}. Responda JSON: {"workouts": [{"dayOfWeek": "Segunda", "type": "Tiro", "warmupTime": 10, "sets": 1, "reps": 8, "stimulusTime": "400m", "recoveryTime": 60, "cooldownTime": 5, "totalTime": 45, "pace": "4:30"}]}`;
  try {
    const res = await callAI({
      model: MODEL_TEXT,
      prompt: prompt,
      responseMimeType: "application/json"
    });
    return JSON.parse(res.text || "{}");
  } catch (e) { return null; }
}

export async function generateTechnicalCue(exerciseName: string) {
  try {
    const res = await callAI({
      model: MODEL_TEXT,
      prompt: `Dica biomecânica rápida de Mestre para ${exerciseName}.`
    });
    return res.text;
  } catch (e) { return "Mantenha a estabilidade do core."; }
}

export async function generateBioInsight(profile: any) {
  try {
    const res = await callAI({
      model: MODEL_TEXT,
      prompt: `Forneça 3 dicas de segurança clínica para o aluno: ${profile.name || 'Atleta'}. Foco em fisiologia.`
    });
    return res.text;
  } catch (e) { return ""; }
}

export async function generateAIMealPlan(profile: any): Promise<any> {
  const prompt = `Gere um plano alimentar diário para: ${JSON.stringify(profile)}. Responda JSON: {"id": "1", "date": "2024-01-01", "breakfast": "...", "lunch": "...", "dinner": "...", "snacks": "..."}`;
  try {
    const res = await callAI({
      model: MODEL_TEXT,
      prompt: prompt,
      responseMimeType: "application/json"
    });
    return JSON.parse(res.text || "{}");
  } catch (e) { return null; }
}

export async function estimateFoodMacros(foodInput: string): Promise<any> {
  const prompt = `Estime macros para: "${foodInput}". Responda JSON: {"calories": 0, "protein": 0, "carbs": 0, "fat": 0}`;
  try {
    const res = await callAI({
      model: MODEL_TEXT,
      prompt: prompt,
      responseMimeType: "application/json"
    });
    return JSON.parse(res.text || "{}");
  } catch (e) { return null; }
}

export async function extractWorkoutFromImage(imageBase64: string): Promise<any[]> {
  const catalogNames = FULL_EXERCISE_LIST.map(ex => ex.name).join(', ');
  const prompt = `
    Analyze the image which contains a list of gym exercises.
    Return a JSON ARRAY containing the exercises found.
    Translate exercise names to Portuguese (Brazil) if they are in English.
    
    CRITICAL: Always try to match the exercise names to the following official catalog: [${catalogNames}].
    If a name is clearly a variation of one in the catalog, use the catalog name.
    
    Structure per item:
    {
      "name": "Nome do Exercício",
      "sets": "3",
      "reps": "12",
      "rest": "60",
      "method": "Normal"
    }

    If sets/reps are not visible, use default "3" sets and "12" reps.
    Do NOT include markdown formatting. Just the raw JSON array.
  `;

  try {
    const response = await callAI({
      model: MODEL_TEXT,
      prompt: prompt,
      isImageAnalysis: true,
      imageBase64: imageBase64,
      responseMimeType: "application/json"
    });

    const text = response.text || "[]";
    const json = JSON.parse(text);
    return Array.isArray(json) ? json : [];

  } catch (e) {
    console.error("Erro fatal na extração:", e);
    return [];
  }
}
