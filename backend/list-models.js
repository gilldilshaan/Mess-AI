import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import fs from "fs";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function test() {
  // List available models
  console.log("Fetching models...");
  const models = await genAI.listModels();
  console.log("Available models:", models.map(m => m.name).join("\n"));
}

test().catch(console.error);