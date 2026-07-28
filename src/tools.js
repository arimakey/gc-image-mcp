import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

let client = null;

function getClient() {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY no configurada");
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

const MODELS = {
  text: ["gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-3.1-flash", "gemini-3.1-flash-lite", "gemini-3-pro"],
  image: ["gemini-2.0-flash-exp-image-generation", "gemini-3.1-flash-image"],
};

export const tools = [
  {
    name: "gemini_generate_text",
    description: "Genera texto usando Gemini. Responde preguntas, escribe contenido, analiza datos, etc.",
    schema: {
      prompt: z.string().min(1).describe("Instrucción o pregunta para el modelo"),
      model: z.enum(MODELS.text).optional().default("gemini-2.0-flash").describe("Modelo de Gemini a usar"),
      systemPrompt: z.string().optional().describe("Instrucción de sistema para guiar el comportamiento del modelo"),
      maxOutputTokens: z.number().int().positive().optional().describe("Máximo de tokens en la respuesta"),
      temperature: z.number().min(0).max(2).optional().describe("Controla la creatividad (0-2)"),
    },
    handler: async ({ prompt, model, systemPrompt, maxOutputTokens, temperature }) => {
      const ai = getClient();
      const config = {};
      if (maxOutputTokens) config.maxOutputTokens = maxOutputTokens;
      if (temperature !== undefined) config.temperature = temperature;

      const contents = systemPrompt
        ? [{ role: "user", parts: [{ text: `${systemPrompt}\n\n${prompt}` }] }]
        : [{ role: "user", parts: [{ text: prompt }] }];

      const response = await ai.models.generateContent({
        model,
        contents,
        config: Object.keys(config).length > 0 ? config : undefined,
      });

      const text = response.candidates?.[0]?.content?.parts?.map(p => p.text).filter(Boolean).join("\n") || "No se generó respuesta";
      return { content: [{ type: "text", text }] };
    },
  },

  {
    name: "gemini_generate_image",
    description: "Genera una imagen a partir de una descripción de texto usando Gemini.",
    schema: {
      prompt: z.string().min(1).describe("Descripción de la imagen a generar"),
      model: z.enum(MODELS.image).optional().default("gemini-2.0-flash-exp-image-generation").describe("Modelo con capacidad de generación de imágenes"),
    },
    handler: async ({ prompt, model }) => {
      const ai = getClient();

      const response = await ai.models.generateContent({
        model,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          responseModalities: ["Text", "Image"],
        },
      });

      const parts = response.candidates?.[0]?.content?.parts || [];
      const results = [];

      for (const part of parts) {
        if (part.text) {
          results.push({ type: "text", text: part.text });
        } else if (part.inlineData) {
          results.push({
            type: "image",
            data: part.inlineData.data,
            mimeType: part.inlineData.mimeType || "image/png",
          });
        }
      }

      if (results.length === 0) {
        return { content: [{ type: "text", text: "No se generó ninguna imagen" }] };
      }
      return { content: results };
    },
  },

  {
    name: "gemini_generate_mixed",
    description: "Genera texto con imágenes intercaladas (ej: receta ilustrada, tutorial paso a paso).",
    schema: {
      prompt: z.string().min(1).describe("Instrucción para generar contenido con imágenes intercaladas"),
      model: z.enum(MODELS.image).optional().default("gemini-2.0-flash-exp-image-generation").describe("Modelo con capacidad de generar imágenes y texto intercalado"),
    },
    handler: async ({ prompt, model }) => {
      const ai = getClient();

      const response = await ai.models.generateContent({
        model,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          responseModalities: ["Text", "Image"],
        },
      });

      const parts = response.candidates?.[0]?.content?.parts || [];
      const results = [];

      for (const part of parts) {
        if (part.text) {
          results.push({ type: "text", text: part.text });
        } else if (part.inlineData) {
          results.push({
            type: "image",
            data: part.inlineData.data,
            mimeType: part.inlineData.mimeType || "image/png",
          });
        }
      }

      if (results.length === 0) {
        return { content: [{ type: "text", text: "No se generó contenido" }] };
      }
      return { content: results };
    },
  },

  {
    name: "gemini_list_models",
    description: "Lista los modelos de Gemini disponibles en tu proyecto.",
    schema: {},
    handler: async () => {
      const ai = getClient();
      const models = await ai.models.list();
      const list = models
        .filter(m => m.name?.startsWith("models/gemini"))
        .map(m => `- ${m.name.replace("models/", "")}: ${m.displayName || ""}`)
        .join("\n");
      return { content: [{ type: "text", text: `Modelos Gemini disponibles:\n${list}` }] };
    },
  },
];
