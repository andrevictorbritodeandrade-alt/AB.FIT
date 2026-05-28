import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import cors from "cors";
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';
import { GoogleGenAI } from "@google/genai";

// Initialize Firebase Admin
admin.initializeApp();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
// Lazy loaded GoogleGenAI instance helper
let cachedGenAI: GoogleGenAI | null = null;
function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.API_KEY || "";
  
  if (!apiKey) {
    throw new Error("Gemini API Key não encontrada. Adicione seu token válido em Settings > Secrets (GEMINI_API_KEY).");
  }
  if (!cachedGenAI) {
    cachedGenAI = new GoogleGenAI({ 
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return cachedGenAI;
}

// Read config once
const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const projectId = firebaseConfig.projectId;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '50mb' }));
  app.use(cors());

  // API Proxy for Gemini
  app.post("/api/ai", async (req, res) => {
    const { model: modelName, prompt, systemInstruction, responseMimeType, isImageGeneration, isImageAnalysis, imageBase64, config } = req.body;

    try {
      const activeGenAI = getGenAI();
      let resolvedModel = modelName || "gemini-3.5-flash";

      // Map deprecated models based on skill guidelines
      if (isImageGeneration) {
        resolvedModel = "gemini-2.5-flash-image";
      } else {
        if (
          resolvedModel === "gemini-1.5-flash" || 
          resolvedModel === "gemini-1.5-pro" || 
          resolvedModel === "gemini-2.0-flash" || 
          resolvedModel === "gemini-2.0-pro-exp-02-05" ||
          resolvedModel === "gemini-2.0-flash-lite-preview-02-05"
        ) {
          resolvedModel = "gemini-3.5-flash";
        }
      }

      let contents: any;
      if (isImageAnalysis && imageBase64) {
        const base64Data = imageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
        const imagePart = {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Data
          }
        };
        const textPart = {
          text: prompt
        };
        contents = { parts: [imagePart, textPart] };
      } else {
        contents = { parts: [{ text: prompt }] };
      }

      const mergedConfig: any = {
        systemInstruction: systemInstruction || undefined,
        responseMimeType: responseMimeType || undefined,
        ...config
      };

      if (isImageGeneration) {
        mergedConfig.imageConfig = {
          aspectRatio: "16:9",
          ...config?.imageConfig
        };
      }

      const result = await activeGenAI.models.generateContent({
        model: resolvedModel,
        contents: [contents],
        config: mergedConfig
      });

      if (isImageGeneration) {
        let imageUrl = null;
        const parts = result.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
          if (part.inlineData) {
            imageUrl = `data:image/png;base64,${part.inlineData.data}`;
            break;
          }
        }
        return res.json({ imageUrl });
      }

      res.json({ text: result.text || "" });
    } catch (error: any) {
      console.error("Server-side AI Error:", error);
      let errorMessage = error.message || "Erro desconhecido na IA.";
      let statusCode = 500;
      let errorType = "UNKNOWN_ERROR";

      const errString = String(error.stack || error.message || error);
      
      if (errString.includes("leased") || errString.includes("leaked") || errString.includes("reported as leaked") || errString.includes("PERMISSION_DENIED") || errString.includes("403")) {
        errorMessage = "A chave de API do Gemini (GEMINI_API_KEY) foi marcada como VAZADA ou REVOGADA de segurança pela Google. Por favor, remova a chave atual e adicione um token válido do Gemini API em Settings > Secrets.";
        statusCode = 403;
        errorType = "API_KEY_LEAKED";
      } else if (errString.includes("quota") || errString.includes("RESOURCE_EXHAUSTED") || errString.includes("limit") || errString.includes("429")) {
        errorMessage = "Limite de requisições excedido. A cota da sua chave de API do Gemini esgotou para este modelo. Aguarde um minuto ou mude para o fluxo de chave paga nas configurações do AI Studio.";
        statusCode = 429;
        errorType = "QUOTA_EXCEEDED";
      }

      res.status(statusCode).json({ error: errorMessage, type: errorType, raw: error.message });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    const key = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.API_KEY || "";
    res.json({ status: "ok", aiConfigured: !!key && key.startsWith("AIzaSy") });
  });

  // Finalizar Treino Endpoint
  app.post("/api/finalizarTreino", async (req, res) => {
    const { userId, treinoId, duracaoMinutos, calorias, cargas } = req.body;
    
    if (!userId || !treinoId) {
      return res.status(400).json({ error: 'userId e treinoId são obrigatórios.' });
    }

    try {
      const db = admin.firestore();
      const alunoRef = db.collection('alunos').doc(userId);
      const logsRef = alunoRef.collection('logsTreino');
      const prescricoesRef = alunoRef.collection('prescricoes');

      // 1. Registra o log do treino
      const newLog = {
        prescricaoId: treinoId,
        dataHora: admin.firestore.FieldValue.serverTimestamp(),
        duracaoMinutos: duracaoMinutos || 0,
        calorias: calorias || 0,
        cargas: cargas || [],
        concluido: true,
        timestamp: Date.now()
      };
      await logsRef.add(newLog);

      // 2. Busca todas as prescrições para calcular a meta global
      const prescricoesSnap = await prescricoesRef.get();
      let targetGlobal = 0;
      let targetPerWorkout = 20;
      let nomeTreino = "Treino";

      prescricoesSnap.forEach(doc => {
        const data = doc.data();
        targetGlobal += (data.totalSessoes || 0);
        if (doc.id === treinoId) {
          targetPerWorkout = data.totalSessoes || 20;
          nomeTreino = data.nome || "Treino";
        }
      });

      // 3. Busca todos os logs para calcular o progresso
      const logsSnap = await logsRef.where('concluido', '==', true).get();
      let totalGlobal = logsSnap.size;
      let totalPerWorkout = 0;

      logsSnap.forEach(doc => {
        if (doc.data().prescricaoId === treinoId) {
          totalPerWorkout++;
        }
      });

      // 4. Retorna os dados
      res.json({
        treinoId: treinoId,
        total: totalPerWorkout, // total for this workout
        meta: targetPerWorkout,   // meta for this workout
        totalGlobal: totalGlobal,
        metaGlobal: targetGlobal,
        nomeTreino: nomeTreino,
        metaAtingida: totalPerWorkout >= targetPerWorkout,
        mensagem: totalPerWorkout >= targetPerWorkout
          ? `Parabéns! Você completou as ${targetPerWorkout} sessões do ${nomeTreino}.`
          : null
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erro ao finalizar treino.' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    const key = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.API_KEY || "";
    console.log(`AI Configuration: ${!!key && key.startsWith("AIzaSy") ? "SUCCESS" : "MISSING KEY"}`);
  });
}

startServer();
