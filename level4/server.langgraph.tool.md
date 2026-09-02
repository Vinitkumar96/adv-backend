User:

Weather in Delhi

State:

[
 HumanMessage
]

↓

Agent

↓

LLM:

AIMessage({
  tool_calls:[
    {
      name:"weather",
      args:{
        city:"Delhi"
      }
    }
  ]
})

State:

[
 HumanMessage,
 AIMessage(tool_call)
]

↓

shouldContinue()

↓

returns:

toolNode

↓

ToolNode

↓

Runs tool

↓

Returns:

[
 ToolMessage(
   "Weather in Delhi is 32°C"
 )
]

State:

[
 HumanMessage,
 AIMessage(tool_call),
 ToolMessage
]

↓

Back to Agent

↓

LLM sees tool result

↓

Returns:

AIMessage(
  "Weather in Delhi is 32°C"
)

State:

[
 HumanMessage,
 AIMessage(tool_call),
 ToolMessage,
 AIMessage(final answer)
]

↓

shouldContinue()

↓

No tool calls

↓

returns:

END

↓

Graph stops.