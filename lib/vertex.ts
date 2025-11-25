import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GOOGLE_API_KEY;

if (!apiKey) {
  throw new Error("GOOGLE_API_KEY is not defined");
}

const genAI = new GoogleGenerativeAI(apiKey);

const defaultModel = process.env.GOOGLE_MODEL_NAME || "gemini-1.5-flash";

export const getModel = (
  modelName: string = defaultModel,
  systemInstruction?: string
) => {
  return genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: systemInstruction,
  });
};
