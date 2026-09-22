import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import cors from "cors";
import { fileURLToPath } from 'url';
import { initializeApp as initFirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  serverTimestamp,
  runTransaction
} from 'firebase/firestore';
import { GoogleGenAI } from "@google/genai";

// Read config once
const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const projectId = firebaseConfig.projectId;

// Initialize Firebase with client configuration for direct Firestore access
const firebaseApp = initFirebaseApp(firebaseConfig, 'abfit-backend');
const serverDb = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

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
      let statusCode = 400;
      let errorType = "UNKNOWN_ERROR";

      const errString = String(error.stack || error.message || error);
      
      if (errString.includes("leased") || errString.includes("leaked") || errString.includes("reported as leaked") || errString.includes("PERMISSION_DENIED") || errString.includes("403")) {
        errorMessage = "A chave de API do Gemini (GEMINI_API_KEY) foi marcada como VAZADA ou REVOGADA de segurança pela Google. Por favor, remova a chave atual e adicione um token válido do Gemini API em Settings > Secrets.";
        statusCode = 400;
        errorType = "API_KEY_LEAKED";
      } else if (errString.includes("quota") || errString.includes("RESOURCE_EXHAUSTED") || errString.includes("limit") || errString.includes("429")) {
        errorMessage = "Limite de requisições excedido. A cota da sua chave de API do Gemini esgotou para este modelo. Aguarde um minuto ou mude para o fluxo de chave paga nas configurações do AI Studio.";
        statusCode = 400;
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

  // Finalizar Treino Endpoint (Transação Atômica Infalível)
  app.post("/api/finalizarTreino", async (req, res) => {
    const { userId, treinoId, duracaoMinutos, calorias, cargas, nomeTreinoCustom } = req.body;
    
    if (!userId || !treinoId) {
      return res.status(400).json({ error: 'userId e treinoId são obrigatórios.' });
    }

    try {
      // Determina tipo de treino (A, B ou C)
      const tIdLower = (treinoId || '').toLowerCase();
      let workoutType: 'A' | 'B' | 'C' = 'A';
      if (tIdLower.includes('treino-b') || tIdLower.includes('b-') || tIdLower.includes('-b') || tIdLower.endsWith('b')) {
        workoutType = 'B';
      } else if (tIdLower.includes('treino-c') || tIdLower.includes('c-') || tIdLower.includes('-c') || tIdLower.endsWith('c')) {
        workoutType = 'C';
      }

      // 1. Salva na coleção users/{userId}/workout_history permanentemente
      const userHistoryRef = collection(serverDb, 'users', userId, 'workout_history');
      await addDoc(userHistoryRef, {
        planId: 'current',
        workoutType,
        dateCompleted: serverTimestamp(),
        duracaoMinutos: duracaoMinutos || 0,
        calorias: calorias || 0,
        cargas: cargas || [],
        exercises: cargas || [],
        nomeTreino: nomeTreinoCustom || `Treino ${workoutType}`,
        timestamp: Date.now()
      });

      // 2. Atualiza active_plans/{planId} usando runTransaction (Contagem Atômica)
      const planRef = doc(serverDb, 'users', userId, 'active_plans', 'current');
      let notificacaoNecessaria: string | null = null;
      let novaContagem = 1;
      let targetSets = 18;

      await runTransaction(serverDb, async (transaction) => {
        const planDoc = await transaction.get(planRef);
        if (!planDoc.exists()) {
          targetSets = 18;
          novaContagem = 1;
          transaction.set(planRef, {
            phaseName: "Mesociclo 16 - Hipertrofia",
            targetSets: 18,
            progress: {
              A: workoutType === 'A' ? 1 : 0,
              B: workoutType === 'B' ? 1 : 0,
              C: workoutType === 'C' ? 1 : 0
            },
            updatedAt: serverTimestamp()
          });
        } else {
          const planData = planDoc.data() as any;
          targetSets = planData.targetSets || 18;
          const progress = planData.progress || { A: 0, B: 0, C: 0 };
          novaContagem = (progress[workoutType] || 0) + 1;

          transaction.update(planRef, {
            [`progress.${workoutType}`]: novaContagem,
            updatedAt: serverTimestamp()
          });
        }

        // Lógica de Notificação
        if (novaContagem === 6 || novaContagem === 12 || novaContagem === 18) {
          notificacaoNecessaria = `Atenção: Você concluiu o treino ${workoutType} pela ${novaContagem}ª vez. Hora de ajustar e aumentar a carga!`;
        } else if (novaContagem === targetSets) {
          notificacaoNecessaria = `Parabéns! Você concluiu os ${targetSets} treinos do Treino ${workoutType}. Este é o seu último treino desse ciclo e você precisa trocar de treino!`;
        }
      });

      // 3. Registra nos logs legados do aluno (alunos/{userId}/logsTreino) e na coleção workouts
      const logsRef = collection(serverDb, 'alunos', userId, 'logsTreino');
      const newLog = {
        prescricaoId: treinoId,
        dataHora: serverTimestamp(),
        duracaoMinutos: duracaoMinutos || 0,
        calorias: calorias || 0,
        cargas: cargas || [],
        concluido: true,
        timestamp: Date.now()
      };
      await addDoc(logsRef, newLog);

      await addDoc(collection(serverDb, 'workouts'), {
        userId,
        treinoId,
        prescricaoId: treinoId,
        duracaoMinutos: duracaoMinutos || 0,
        calorias: calorias || 0,
        cargas: cargas || [],
        concluidoEm: serverTimestamp(),
        concluido: true,
        timestamp: Date.now()
      });

      // 4. Retorna resposta completa com a contagem atômica do Firebase
      res.json({
        success: true,
        treinoId,
        workoutType,
        total: novaContagem,
        meta: targetSets,
        targetSets,
        notificacaoNecessaria,
        mensagem: notificacaoNecessaria
      });
    } catch (error) {
      console.error("Erro ao finalizar treino:", error);
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
    app.get('*', (req, res) => {
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
