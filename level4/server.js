import express, { response } from "express";
import dotenv from "dotenv";
import { MessagesValue, START,END, StateGraph, StateSchema } from "@langchain/langgraph";
import { tool } from "@langchain/core/tools";
import * as z from "zod";
import { ChatGroq } from "@langchain/groq";
import { AIMessage, HumanMessage, ToolMessage } from "@langchain/core/messages";
dotenv.config();
const app = express();
const PORT = 5000;

app.use(express.json());

// creating a agent with langgraph  and tool node
/*
START
  ↓
Agent (LLM)
  ↓
Need Tool?
  ↓
 YES ─────► Tool Node
  ▲           │
  │           │
  └───────────┘

 NO
  ↓
 END
 */

const llm = new ChatGroq({
  model: "openai/gpt-oss-120b",
  temperature:0,
  maxTokens:undefined,
  maxRetries:2
})

const ChatState = new StateSchema({
    messages: MessagesValue
})

const weatherTool = tool(
    async ({city}) => {
        return `Weather in ${city} is 32°C`
    },
    {
        name:"weather",
        description:"Get weather information",
        schema: z.object({
            city: z.string()
        })
    }
)

const llmWithTools = llm.bindTools([
    weatherTool
])

const agentNode = async(state) =>{
    const response = await llmWithTools.invoke(
        state.messages
    )

    return {
        messages: [response]
    }
}

/* 
{
  messages: [
    HumanMessage("Weather in Delhi"),

    AIMessage({
      tool_calls:[
        {
          name:"weather",
          args:{city:"Delhi"}
        }
      ]
    })
  ]
}
*/

const toolNode = async (state) => {
    const lastMessage = state.messages.at(-1) //last index

    if(!lastMessage || !AIMessage.isInstance(lastMessage)){  // tool node only want ai message
        return{
            messages: []
        }
    }

    const results = []

    for(const toolCall of lastMessage.tool_calls){
        const result = await weatherTool.invoke(toolCall)

        results.push(
            new ToolMessage({
                content:result,
                tool_call_id: toolCall.id
            })
        )
    }

    return{
        messages:results
    }
}

/* 
Old:

[
 HumanMessage,
 AIMessage(tool_call)
]

New:

[
 ToolMessage(
   "Weather in Delhi is 32°C"
 )
]

Merged:

[
 HumanMessage,
 AIMessage(tool_call),
 ToolMessage
]
*/

const shouldContinue = (state) => {
    const lastMessage = state.messages.at(-1)

    if(lastMessage?.tool_calls.length){
        return "toolNode" //graph node name => therefore langgraph routes execution to that node
    }
    return END;
}

const graph = new StateGraph(ChatState)
    .addNode("agent",agentNode)
    .addNode("toolNode",toolNode)
    .addEdge(START, "agent")
    .addConditionalEdges("agent",shouldContinue)
    .addEdge("toolNode","agent")
    .compile()

app.post("/ai",async(req,res)=>{
    const {input} = req.body

    const result = await graph.invoke({
        messages: [
           new HumanMessage(input)
        ]
    })

    const finalMessage = result.messages.at(-1)
    return res.json({
        response: finalMessage
    })
})


app.listen(PORT, () => {
  console.log("servers started");
});
