import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";

const exercises = [
  "SUPINO AB. BC. RETO HBC",
  "REMADA ALTA CROSS",
  "TRÍCEPS COICE CROSS PL. BAIXA",
  "AG. PASSADA HBC",
  "LEG PRESS ART.",
  "ABDOMINAL PARCIAL NO SOLO",
  "PUXADA AB. PL. ALTO B. ROMANA",
  "BÍCEPS BC 75° HBC PG. NT.",
  "AG. SUMÔ HBC FRENTE QUAD.",
  "MATA-BORRÃO DIN. EM D.V. NO SOLO"
];

async function run() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not set.");
    return;
  }
  const ai = new GoogleGenAI({ apiKey });
  
  const dir = path.join(process.cwd(), "public", "images", "andre");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  for (const ex of exercises) {
    console.log(`Generating for ${ex}...`);
    try {
      const prompt = `Professional athlete performing ${ex}, gym setting, 4k resolution, high quality, realistic, fitness photography`;
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: [{ parts: [{ text: prompt }] }],
      });

      let base64 = null;
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            base64 = part.inlineData.data;
            break;
          }
        }
      }

      if (base64) {
        const filename = ex.replace(/[^a-z0-9]/gi, '_').toLowerCase() + ".png";
        fs.writeFileSync(path.join(dir, filename), Buffer.from(base64, "base64"));
        console.log(`Saved ${filename}`);
      } else {
        console.log(`No image for ${ex}`);
      }
    } catch (e: any) {
      console.error(`Error for ${ex}:`, e.message);
    }
  }
}

run();
