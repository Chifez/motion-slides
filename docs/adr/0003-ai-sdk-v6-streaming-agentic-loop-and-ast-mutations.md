# ADR 003: AI SDK v6 Streaming Cognitive Loop & AST Mutation Architecture

## Status
**Accepted** (2026-08-18)

## Context & Problem Statement
MotionSlides provides an agentic AI Design Studio where an AI agent can synthesize full presentation decks from raw documentation, generate cloud architecture diagrams, patch existing nodes, choreograph animation flows, and re-theme slides in real-time.

We need an agentic AI architecture that:
1. Supports streaming multi-step tool execution loops (`streamText`) where the model can inspect deck context, reason, call tools, receive client results, and continue autonomously.
2. Intercepts tool calls cleanly on the client to perform domain-level AST mutations in Zustand.
3. Automatically captures immutable time-travel snapshots prior to every mutation so users can instantly undo any AI action.
4. Enforces strict schema validation for all tool inputs via Zod contracts.

## Decision Drivers
- **Multi-Step Execution**: Complex deck synthesis requires multi-turn tool calling within a single user request.
- **Safety & Reversibility**: Users must have a 1-click rollback guarantee for any agentic mutation.
- **Type Safety**: Tool schemas, parameters, and AST payload types must be strictly validated.
- **Provider Agnosticism**: Seamless support for Anthropic (Claude 3.5 Sonnet), OpenAI (GPT-4o), and local Ollama models.

## Decision Outcome
We adopted the **Vercel AI SDK v6 Architecture** with client-side tool execution, domain-specific tool handlers, and time-travel snapshot markers:

1. **Server-Side Streaming (`routes/api/chat.ts`)**:
   - Uses `streamText` from `ai` with `stopWhen: stepCountIs(5)` for autonomous tool chaining.
   - Configures model providers dynamically (`@ai-sdk/anthropic`, `@ai-sdk/openai`).
   - Uses `toUIMessageStreamResponse()` for standardized streaming transport.
2. **Client-Side Dispatch (`ai-chat.tsx` & `lib/agent/tools.ts`)**:
   - The client `useChat` hook intercepts tool calls via `onToolCall`.
   - Normalizes input arguments: `toolArgs = toolCall.input ?? toolCall.args`.
   - Dispatches calls to modular tool handlers in `apps/web/src/lib/agent/tools/` (`slide-tools.ts`, `element-tools.ts`, `diagram-tools.ts`, `animation-tools.ts`, `theme-tools.ts`, `deck-synthesis-tools.ts`).
3. **Time-Travel Snapshot Capture**:
   - Before any mutating tool runs, `pushSnapshot(description)` is called on `snapshot-slice.ts`.
   - Every AI message in the UI provides an interactive "Undo this action" trigger.
4. **Approval Gates**:
   - Destructive operations (such as `deleteSlide` or deck wipe) route through an approval gate modal before execution.

---

## Negative Space & Forbidden Alternatives

The following tools, paradigms, and patterns are **STRICTLY FORBIDDEN** in this repository:

| Forbidden Alternative | Reason for Rejection & Threat to Architecture |
| :--- | :--- |
| **LangChain / LangGraph** | Heavy abstract wrappers, slow execution overhead, conflicting streaming protocols with Next.js/Nitro, difficult to maintain in browser-first AST editors. |
| **Unstructured String Output Parsing** | Prompting models for raw text or unvalidated JSON without Zod schemas leads to malformed AST mutations and app crashes. |
| **Direct DOM Manipulation by AI** | The AI must ONLY mutate the Zustand Scene Graph AST. Injecting arbitrary HTML or manipulating DOM nodes directly destroys state synchronization. |
| **Mutations Without Snapshot Push** | Any AI tool modifying the presentation state without registering a time-travel snapshot violates our data safety and user trust guarantees. |
| **Bypassing Zod Tool Schemas** | Defining tool definitions without `z.object({...})` validation schemas exposes the application to runtime schema errors. |

---

## Agent Guardrails (Automated Enforcement Rules)

AI Agents modifying this codebase must adhere to the following strict guardrails:

1. **All New AI Tools Must Define Zod Schemas**:
   - Tool parameters in `routes/api/chat.ts` MUST use `inputSchema: z.object({...})` with descriptive field annotations.
2. **Mandatory Domain Handler Separation**:
   - Implement tool logic inside `apps/web/src/lib/agent/tools/<domain>-tools.ts`. Do not write sprawling inline switch cases in UI components.
3. **Automatic Snapshot Gating**:
   - Every mutating tool in `executeAgentTool` MUST call `useEditorStore.getState().pushSnapshot(...)` before modifying slides or elements.
4. **Return Informative String Summaries**:
   - Tool execution functions must return a concise, human-readable confirmation string (e.g., `"Added VPC section and 3 microservice nodes to slide 2"`) so the model has grounded feedback for its next step.

---

## Consequences & Trade-offs

### Positive
- **Rock-Solid Safety**: Users can freely experiment with agentic workflows knowing any step is 1-click reversible.
- **Clean Architecture**: Clear separation between LLM streaming orchestration, tool schemas, and local AST mutation.
- **Provider Portability**: Switch seamlessly between Claude 3.5 Sonnet, GPT-4o, and other models without refactoring client tools.

### Negative
- **Client Coordination**: Client-side tool execution requires maintaining tool registration in both server schemas and client dispatchers.

---

## References & Code Artifacts
- Chat API Route: [apps/web/src/routes/api/chat.ts](file:///c:/Users/c/Desktop/motionslides/apps/web/src/routes/api/chat.ts)
- Tool Registry: [apps/web/src/lib/agent/tools.ts](file:///c:/Users/c/Desktop/motionslides/apps/web/src/lib/agent/tools.ts)
- Domain Tool Implementations: [apps/web/src/lib/agent/tools/](file:///c:/Users/c/Desktop/motionslides/apps/web/src/lib/agent/tools/)
- Snapshot Slice: [apps/web/src/store/slices/snapshot-slice.ts](file:///c:/Users/c/Desktop/motionslides/apps/web/src/store/slices/snapshot-slice.ts)
