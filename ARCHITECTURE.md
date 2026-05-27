# Logos AI — Architecture Document

## System Overview

Logos AI is a Christianity-focused AI assistant built with a **LangGraph multi-agent pipeline** that ensures Scripture accuracy, theological grounding, content safety, and denomination awareness.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                   React Frontend                     │
│  (Next.js App Router + Tailwind CSS)                │
│                                                      │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Chat    │  │ Denomination │  │   Session     │  │
│  │ Interface │  │  Selector    │  │  Management   │  │
│  └────┬─────┘  └──────────────┘  └──────────────┘  │
└───────┼──────────────────────────────────────────────┘
        │ POST /api/chat
        ▼
┌─────────────────────────────────────────────────────┐
│              LangGraph Pipeline                      │
│                                                      │
│  ┌──────────────┐                                   │
│  │ 1. MODERATE  │ ← GPT-4o-mini classifies input   │
│  │    INPUT     │   (SAFE/SENSITIVE/ADVERSARIAL/    │
│  └──────┬───────┘    CRISIS/OFF_TOPIC)              │
│         │                                            │
│    ┌────▼────┐                                      │
│    │ SAFE?   │──NO──▶ BLOCKED RESPONSE              │
│    └────┬────┘                                      │
│         │ YES                                        │
│  ┌──────▼───────┐                                   │
│  │ 2. CLASSIFY  │ ← Determines: CHAT/SCRIPTURE/    │
│  │    INTENT    │   IMAGE/THEOLOGICAL/CONTENT       │
│  └──────┬───────┘                                   │
│         │                                            │
│    ┌────▼────┐                                      │
│    │ IMAGE?  │──YES──▶ IMAGE SAFETY → DALL-E 3     │
│    └────┬────┘                                      │
│         │ NO                                         │
│  ┌──────▼───────┐                                   │
│  │ 3. RETRIEVE  │ ← Searches local Bible DB        │
│  │   SCRIPTURE  │   (100+ verified KJV verses)     │
│  │   GROUNDING  │   Topic + reference matching      │
│  └──────┬───────┘                                   │
│         │                                            │
│  ┌──────▼───────┐                                   │
│  │ 4. GENERATE  │ ← GPT-4o with:                   │
│  │   RESPONSE   │   - Denomination-aware system     │
│  │              │     prompt                         │
│  │              │   - Verified verse context         │
│  │              │   - Conversation history           │
│  │              │   - Safety flags                   │
│  └──────┬───────┘                                   │
│         │                                            │
│  ┌──────▼───────┐                                   │
│  │ 5. VALIDATE  │ ← Checks output for:             │
│  │    OUTPUT    │   - Hallucinated verse refs        │
│  │              │   - Invalid book/chapter/verse     │
│  │              │   - Auto-corrects if issues found  │
│  └──────────────┘                                   │
└─────────────────────────────────────────────────────┘
```

## Key Engineering Decisions

### 1. LangGraph Over Simple Chain
**Why:** A linear LLM chain can't handle the branching logic needed for moderation, intent routing, and conditional image generation. LangGraph's `StateGraph` provides:
- Conditional edges (skip image pipeline for text queries)
- State accumulation across nodes
- Clear separation of concerns per node

### 2. Two-Tier Model Strategy
- **GPT-4o-mini** for classification tasks (moderation, intent, safety checks) — fast, cheap, accurate for structured outputs
- **GPT-4o** for response generation — higher quality for nuanced theological content

### 3. Local Bible Verse Database (Not Just RAG)
**Why:** Pure RAG with embeddings would require a vector DB and can still hallucinate verse text. Instead:
- **100+ verified KJV verses** stored locally with exact text, book, chapter, verse, and topic tags
- **Verse validator** checks references against known chapter counts for all 66 books
- **Grounding injection**: verified verses are injected into the system prompt so the LLM can quote them directly with confidence
- **Output validator** scans generated responses for verse references and cross-checks them

### 4. Multi-Layer Safety Architecture
```
Layer 1: Input Moderation    → Blocks adversarial/hateful prompts
Layer 2: Fake Verse Detection → Catches "Hezekiah 4:12" type tricks
Layer 3: Image Safety Filter  → Prevents inappropriate religious imagery
Layer 4: Output Validation   → Catches hallucinated verses in responses
Layer 5: System Prompt Guard  → Denomination-aware theological guardrails
```

### 5. Denomination-Aware System Prompts
Four pre-built prompt modules (Non-Denominational, Catholic, Protestant, Orthodox) that adjust:
- Which books are considered canonical
- How tradition vs. Scripture authority is framed
- Sacramental theology
- Distinctive doctrinal emphases

### 6. Conversation Memory
Server-side session management with:
- Per-session message history (last 10 messages as context)
- Session metadata (denomination, title, timestamps)
- Stateless API design — session ID passed with each request

## Hallucination Prevention Strategy

| Technique | Implementation |
|-----------|---------------|
| **Verified verse injection** | Only pre-verified verses are provided as "safe to quote" |
| **Chapter count validation** | Every verse reference checked against known chapter limits |
| **Book name validation** | Cross-referenced against canonical + deuterocanonical book lists |
| **Output scanning** | Post-generation regex extraction + validation of all references |
| **Auto-correction** | If invalid refs found, response is regenerated with corrections |
| **Prompt engineering** | System prompt explicitly forbids inventing verses |
| **Paraphrase fallback** | "If unsure, paraphrase rather than quote directly" |

## Tech Stack

| Component | Technology | Why |
|-----------|-----------|-----|
| Frontend | Next.js 14 + React 18 | Vercel-native, SSR/SSG, API routes |
| Styling | Tailwind CSS | Rapid UI development, dark mode |
| AI Orchestration | LangGraph.js | Stateful agent graph with conditional routing |
| LLM | OpenAI GPT-4o / GPT-4o-mini | Best balance of quality + speed |
| Image Generation | DALL-E 3 | High quality, good content policy |
| Bible Data | Local TypeScript module | Zero-latency, verified, no external dependency |
| Memory | In-memory Map | Simple for demo; swap for Redis/DB in production |
| Deployment | Vercel | Zero-config Next.js deployment |

## Production Considerations (Not Implemented)

- **Persistent memory**: Replace in-memory Map with PostgreSQL/Redis
- **Full Bible database**: Complete KJV text (~31,000 verses) for comprehensive validation
- **Vector embeddings**: Semantic search over Bible passages for better grounding
- **Rate limiting**: Per-user request throttling
- **Authentication**: User accounts for persistent conversation history
- **Caching**: Cache common theological responses to reduce API costs
- **Monitoring**: Track moderation triggers, hallucination catches, user satisfaction
- **Bible API integration**: Real-time verse lookup via api.bible or similar

## File Structure

```
src/
├── app/
│   ├── api/
│   │   ├── chat/route.ts          # Main chat endpoint (LangGraph pipeline)
│   │   └── image/route.ts         # Standalone image generation
│   ├── layout.tsx                  # Root layout
│   ├── page.tsx                    # Main page (orchestrates sidebar + chat)
│   └── globals.css                 # Tailwind + custom styles
├── components/
│   ├── ChatInterface.tsx           # Chat UI with quick prompts
│   ├── MessageBubble.tsx           # Message rendering with metadata badges
│   ├── DenominationSelector.tsx    # Denomination picker dropdown
│   └── Sidebar.tsx                 # Session management + info panel
├── lib/
│   ├── langgraph/
│   │   ├── state.ts               # Graph state definition (Annotation)
│   │   ├── nodes.ts               # All graph node functions
│   │   └── graph.ts               # Graph construction + compilation
│   ├── bible/
│   │   ├── verses.ts              # Verified Bible verse database
│   │   └── validator.ts           # Verse reference validation
│   ├── prompts.ts                 # All system prompts
│   └── memory.ts                  # Conversation session management
└── evaluation/
    └── dataset.json               # 32 test cases across 4 categories
```
