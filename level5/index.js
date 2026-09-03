import express from "express";
import dotenv from "dotenv";
dotenv.config();
const app = express();
import { ChatGroq } from "@langchain/groq";
import fs from "fs";
import { PDFParse } from "pdf-parse";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import {
  ChatGoogleGenerativeAI,
  GoogleGenerativeAIEmbeddings,
} from "@langchain/google-genai";
import { TaskType } from "@google/generative-ai";
import { QdrantVectorStore } from "@langchain/qdrant"; //qdrant vector store

app.use(express.json());

const llm = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  temperature: 0,
  maxRetries: 2,
});

const embeddings = new GoogleGenerativeAIEmbeddings({
  model: "gemini-embedding-001", // 768 dimensions
  taskType: TaskType.RETRIEVAL_DOCUMENT,
  title: "Document title",
});

const upload = async () => {
  try {
    const pdfPath = "./grocery-store.pdf";
    const buffer = fs.readFileSync(pdfPath);
    const uint8Array = new Uint8Array(buffer);
    const parser = new PDFParse({ data: uint8Array });
    const result = await parser.getText();
    const text = result.text;

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const docs = await splitter.createDocuments([text]);

    await QdrantVectorStore.fromDocuments(docs, embeddings, {
      url: process.env.QDRANT_URL,
      apiKey: process.env.QDRANT_API_KEY,
      collectionName: "grocery-store-v2",
    });

    console.log("pdf indexed");
  } catch (error) {
    console.log(error);
  }
};
// upload();

//connected to grocery-store collection
const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
  collectionName: "grocery-store-v2",
});

app.post("/ai", async (req, res) => {
  const { input } = req.body;

  const docs = await vectorStore.similaritySearch(input, 3);

  const context = docs.map((d) => d.pageContent).join("\n");

  const response = llm.invoke([
    ["system", `Answer only using the provided context. Context:${context}`],
    ["human", input],
  ]);

  return res.json({
    answer: (await response).content,
  });
});

app.listen(3000, () => {
  console.log("server listening on port 3000");
});
