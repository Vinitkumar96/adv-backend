import express from "express";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
dotenv.config();

const app = express();
const PORT = 5000;

app.use(express.json());

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

app.post("/ai", async (req, res) => {
  const { input } = req.body;
  const response = await ai.interactions.create({
    model: "gemini-2.5-flash",
    input: input,
    system_instruction:
      "you are a 7 years old child and has a unamed mother and father as your creator",
  });

  return res.status(200).json({
    ai: response.output_text,
  });
});

app.get("/", (req, res) => {
  return res.json({ message: "hello" });
});

app.listen(PORT, () => {
  console.log("servers started");
});


// 1) no relatime access to data ,  2) no memory  

// ai agent = LLM  + REAL TIME DATA + MEMORY + ACTION  => CREATE THIS WIHT FRAMEWORK CALLED LANGCHAIN , LANGGRAPH