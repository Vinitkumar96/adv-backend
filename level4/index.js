import express from "express";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { ChatGoogle } from "@langchain/google";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import {ChatGroq} from "@langchain/groq"
import { Annotation, END, MessagesValue, START, StateGraph, StateSchema } from "@langchain/langgraph";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
dotenv.config();

const app = express();
const PORT = 5000;

app.use(express.json());

app.get("/health", (req, res) => {
  return res.json({ message: "server is healthy" });
});

//without langchain

// const ai = new GoogleGenAI({
//   apiKey: process.env.GEMINI_API_KEY,
// });

// app.post("/ai", async (req, res) => {
//   const { input } = req.body;
//   const response = await ai.interactions.create({
//     model: "gemini-2.5-flash",
//     input: input,
//     system_instruction:
//       "you are a 7 years old child and has a unamed mother and father as your creator",
//   });

//   return res.status(200).json({
//     ai: response.output_text,
//   });
// });


// with langchain

// const llm = new ChatGoogleGenerativeAI({
//   model:"gemini-2.5-flash",
// })

// app.post("/ai", async (req,res)=>{
//   const {input} = req.body
//   const response = await llm.invoke(input)

//   return res.status(200).json({ "ai" : response.content})
// })

// langgraph without tool node

const llm = new ChatGroq({
  model: "openai/gpt-oss-120b",
  temperature:0,
  maxTokens:undefined,
  maxRetries:2
})

const ChatState = new StateSchema({
  messages: MessagesValue
})

const chatNode = async(state) =>{
  const response = await llm.invoke([
    new SystemMessage("You are a helpful assistant"),
    ...state.messages
  ])

  return{
    messages:[response]
  }
}

const graph = new StateGraph(ChatState)
  .addNode("chat", chatNode)
  .addEdge(START, "chat")
  .addEdge("chat",END)
  .compile()


app.post("/ai",async (req,res)=>{
  const{input} = req.body

  const result = await graph.invoke({
    messages:[
      new HumanMessage(input)
    ]
  })
  return res.status(200).json({
    response: result
  })
})

// app.post("/ai",async(req,res)=>{
//   const{input} = req.body
//   const aiMsg = await llm.invoke([
//     {
//       role:"system",
//       content:"You are a 7 years old child"
//     },
//     {
//       role:"user",
//       content:input
//     }
//   ])

//   return res.status(200).json({
//     msg:aiMsg.content
//   })
// })


app.listen(PORT, () => {
  console.log("servers started");
});


// 1) no relatime access to data ,  2) no memory  

// ai agent = LLM  + REAL TIME DATA + MEMORY + ACTION  => CREATE THIS WIHT FRAMEWORK CALLED LANGCHAIN , LANGGRAPH
// langchain is high level framework.. langgraph is used when workflow becomes complex...langsmith (debuggin tool like postman + logs for ai agents)

// LangChain = give an AI models + tools and build agents easily.

// LangGraph = control exactly how a more complex agent/workflow moves between different steps, branches, loops, and states.
// nodes + edges + state

//workflow => user -> write prompt -> goes to llm (knows -> back to user) (dont know) -> web search tool -> back to user
//langgraph =>  ai workflows representd by graph
//arrow which connects node are edge
// each node in the graph performs some task => each node connected to other required nodes(tool web search )(tool node)
// agent node is connectd with web searhc tool node with conditional edge and web search is connected with agent with compulsory edge
// state is managed and travles accross all nodes