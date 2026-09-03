import express from "express"
import dotenv from "dotenv"
dotenv.config()
const app = express()
import { ChatGroq } from "@langchain/groq";
import fs from "fs"
import { PDFParse } from 'pdf-parse';
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

app.use(express.json());

const llm = new ChatGroq({
  model: "openai/gpt-oss-120b",
  temperature:0,
  maxTokens:undefined,
  maxRetries:2
})

const upload = async () => {
    const pdfPath = "./grocery-store.pdf"
    const buffer = fs.readFileSync(pdfPath)
    const uint8Array = new Uint8Array(buffer)
    const parser = new PDFParse({data:uint8Array})
    const result = await parser.getText()
    const text = result.text
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize:1000,
        chunkOverlap:200
    })
    const docs = await splitter.createDocuments([text])
    console.log(docs);
}
// upload()



app.post("/ai",async(req,res)=>{
    const {input} = req.body

    const result = await llm.invoke([
        {
            role:"user",
            content:input
        }
    ])

    return res.status(200).json({
        msg:result.content
    })
})


app.listen(3000, () => {
    console.log("server listening on port 3000");
})