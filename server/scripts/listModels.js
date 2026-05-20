// tmp script - run: node scripts/listModels.js
import dotenv from "dotenv";
dotenv.config();
const raw = process.env.APP || "{}";
const env = JSON.parse(raw);
const key = env.GEMINI_API_KEY || "";
console.log("Using key:", key.slice(0, 16) + "...");
const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
const data = await res.json();
const models = data?.models || [];
console.log("\nAvailable models that support generateContent:\n");
models.filter(m => m.supportedGenerationMethods?.includes("generateContent"))
    .forEach(m => console.log(" •", m.name));
