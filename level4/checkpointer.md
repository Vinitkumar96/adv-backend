# How LangGraph Remembers

LangGraph has a concept called a **checkpointer**.

Think:

```txt
chat-123
   ↓
Store State
```

After every graph execution it saves:

```ts
{
  messages: [
    Human("My name is Vinit"),
    AI("Nice to meet you Vinit")
  ]
}
```

Then later:

```txt
chat-123
```

is loaded again.

---

# Simplest Example (In Memory)

Install:

```bash
npm install @langchain/langgraph-checkpoint
```

Then:

```ts
import { MemorySaver } from "@langchain/langgraph";
```

Create:

```ts
const checkpointer = new MemorySaver();
```

Compile:

```ts
const graph = new StateGraph(ChatState)
  .addNode("agent", agentNode)
  .addEdge(START, "agent")
  .addEdge("agent", END)
  .compile({
    checkpointer,
  });
```

---

# Invoke with Thread ID

Now:

```ts
await graph.invoke(
  {
    messages: [
      new HumanMessage("My name is Vinit"),
    ],
  },
  {
    configurable: {
      thread_id: "chat-1",
    },
  }
);
```

LangGraph saves state under:

```txt
chat-1
```

---

Later:

```ts
await graph.invoke(
  {
    messages: [
      new HumanMessage("What is my name?"),
    ],
  },
  {
    configurable: {
      thread_id: "chat-1",
    },
  }
);
```

LangGraph automatically loads previous messages.

The model actually sees:

```txt
Human: My name is Vinit
AI: Nice to meet you Vinit

Human: What is my name?
```

and replies:

```txt
Your name is Vinit.
```

---

# Hardcoded Chat ID Example

For learning:

```ts
app.post("/ai", async (req, res) => {
  const { input } = req.body;

  const result = await graph.invoke(
    {
      messages: [
        new HumanMessage(input),
      ],
    },
    {
      configurable: {
        thread_id: "chat-1",
      },
    }
  );

  const finalMessage = result.messages.at(-1);

  res.json({
    response: finalMessage.content,
  });
});
```

---

## Request 1

```json
{
  "input": "My name is Vinit"
}
```

Response:

```txt
Nice to meet you Vinit.
```

---

## Request 2

```json
{
  "input": "What is my name?"
}
```

Response:

```txt
Your name is Vinit.
```

Even though you only sent one message in Request 2.

---

# What's Happening Behind the Scenes?

### First Request

```txt
thread_id = chat-1
```

State saved:

```ts
[
  Human("My name is Vinit"),
  AI("Nice to meet you Vinit")
]
```

---

### Second Request

```txt
thread_id = chat-1
```

LangGraph loads:

```ts
[
  Human("My name is Vinit"),
  AI("Nice to meet you Vinit")
]
```

Then appends:

```ts
Human("What is my name?")
```

State becomes:

```ts
[
  Human("My name is Vinit"),
  AI("Nice to meet you Vinit"),
  Human("What is my name?")
]
```

Then sends all of that to the model.

---

# Important Limitation

`MemorySaver` only stores data in RAM.

If the server restarts:

```bash
node server.js
```

all memory is lost.

---

# Production Checkpointers

For production systems, use persistent storage:

```txt
Postgres Checkpointer
Redis Checkpointer
Mongo Checkpointer
```

These survive server restarts and allow conversations to continue across sessions.

---

# Mental Model

```txt
Request
   ↓
thread_id = chat-1
   ↓
Load Previous State
   ↓
Append New Message
   ↓
Run Graph
   ↓
Save Updated State
   ↓
Return Response
```

The key idea is:

```txt
thread_id
```

acts like a conversation ID.

Same `thread_id` → same conversation history.

Different `thread_id` → completely separate conversation.