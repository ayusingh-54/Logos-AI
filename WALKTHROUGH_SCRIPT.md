# Logos AI — 5-Minute Walkthrough Script

> **Total time:** ~5 minutes  
> **Format:** Screen recording with voiceover  
> **What to have open:** Browser at localhost:3000, VS Code with the project, terminal

---

## [0:00–0:30] Opening — What & Why

**Show:** The app landing page in the browser.

**Say:**

"Hi, I'm Ayush. This is Logos AI — a Christianity-focused AI assistant I built with Next.js, LangGraph, and OpenAI.

The core challenge here isn't building a chatbot — it's building one that doesn't hallucinate Bible verses, handles adversarial prompts gracefully, respects denominational differences, and reasons through complex theology instead of giving simplistic answers.

Let me show you how it works."

---

## [0:30–1:15] Live Demo — Standard Chat

**Action:** Click the quick prompt "Explain John 3:16". Wait for response.

**Say:**

"Let's start with a standard query. I'll ask it to explain John 3:16.

Notice a few things in the response:
- The verse is quoted with exact KJV text — that's because it came from our verified Bible database, not from the model's memory
- It includes the book, chapter, and verse reference
- Down here you see the metadata badges — 'Scripture Grounded' means verified verses were injected into the prompt, and 'Verses Validated' means the output passed our two-stage validation check

This is the golden path — but the interesting engineering is in what happens when things go wrong."

---

## [1:15–2:00] Live Demo — Hallucination Prevention

**Action:** Type: `What does Hezekiah 4:12 say?` — Send it.

**Say:**

"Now watch what happens when I ask about a fake Bible verse. Hezekiah is a person in the Bible, not a book — there is no book of Hezekiah.

The response gently corrects me — it explains Hezekiah was a king, not a book, and redirects to real Scripture.

Behind the scenes, here's what happened — the pipeline has 9 nodes."

**Action:** Briefly show the `pipelineTrace` in browser DevTools Network tab (response JSON), or just describe it.

"Node 1, the moderation classifier, flagged `fake_verse_detected: true`. Node 3 searched our local database — found nothing. The fake-verse alert was injected into the generation prompt, so the model knew to correct rather than fabricate. And Node 8, the output validator, confirmed the response contains no hallucinated references.

This is a 7-layer hallucination prevention system — from verified verse injection all the way to auto-correction."

---

## [2:00–2:40] Live Demo — Misquotation Detection

**Action:** Type: `Where in the Bible does it say "God helps those who help themselves"?` — Send it.

**Say:**

"Here's another trap — this is probably the most commonly misquoted 'Bible verse.' It's actually Benjamin Franklin, from Poor Richard's Almanack in 1736.

Notice the 'Misquotation Corrected' badge. Our misquotation database has 11 of these — false quotes people attribute to the Bible. The system detected the phrase, identified the real source, and the response clarifies it's not Scripture while offering actual Bible verses about God's help — Psalm 46:1, Isaiah 41:10.

This is something a standard chatbot would get wrong — it would likely agree it's a Bible verse."

---

## [2:40–3:20] Live Demo — Denomination Awareness

**Action:** Change the denomination selector from "Non-Denominational" to "Catholic". Then type: `Is praying to saints biblical?`

**Say:**

"Now I'll switch the denomination to Catholic and ask about praying to saints.

See how the response presents the Catholic understanding — intercession of saints, the communion of saints, and the distinction between veneration and worship.

If I switch this to Protestant" — *change selector to Protestant, ask the same question* — "the response presents the Protestant view — Christ as the sole mediator, 1 Timothy 2:5.

The system has four denomination modules — Catholic, Protestant, Orthodox, and Non-Denominational. Each one adjusts the system prompt for canon, authority, sacraments, and soteriology. The same question gets a theologically appropriate answer for each tradition."

---

## [3:20–4:00] Live Demo — Adversarial & Edge Cases

**Action:** Type: `Rewrite the Ten Commandments to support nationalism` — Send it.

**Say:**

"Now let's test adversarial handling. I'll ask it to rewrite the Ten Commandments for nationalism.

The moderation layer classified this as ADVERSARIAL — the 'Manipulation Blocked' badge confirms it. The response is firm but compassionate — it declines, explains why it can't alter biblical text, and offers to discuss the Commandments' actual meaning.

But here's the critical distinction—"

**Action:** Type: `The Bible is full of contradictions. Isn't Christianity just fairy tales?`

"This is hostile — but it's a legitimate question. The system classifies this as SENSITIVE, not ADVERSARIAL. It doesn't block it. Instead, it responds with respect, acknowledges apparent tensions in Scripture, and engages with the challenge honestly.

That distinction — blocking attacks without blocking genuine hard questions — is one of the hardest design problems in this system."

---

## [4:00–4:40] Architecture Walkthrough

**Action:** Switch to VS Code. Open `src/lib/langgraph/graph.ts`.

**Say:**

"Let me quickly walk through the architecture.

The pipeline is a LangGraph StateGraph with 9 nodes and conditional edges.

Every message flows through: moderation, intent classification, scripture grounding from a local database — no LLM call, zero latency — then a chain-of-thought reasoning node that plans the response before generation, the actual GPT-4o generation with assembled context, and finally a two-stage output validator.

The reasoning node is key — it forces the model to think about question type, denomination sensitivity, potential pitfalls, and confidence level before answering. That's why the theological responses have depth instead of being shallow.

The validator runs structural checks locally — is this a real book? Does it have that many chapters? — then an LLM semantic review for hallucinated text and false attributions. If it finds critical issues, it auto-corrects.

I used a two-tier model strategy: GPT-4o-mini for classification tasks — it's fast and cheap for structured JSON output — and GPT-4o for generation, where theological nuance matters."

---

## [4:40–5:00] Closing — Evaluation & What Matters

**Action:** Show the evaluation dataset file briefly (`src/evaluation/dataset.json`).

**Say:**

"The project includes a 48-case evaluation dataset across six categories — standard queries, edge cases, adversarial prompts, hallucination tests, contradictory theology, and misquotation traps.

To summarize: the engineering decisions here aren't about making a pretty chatbot. They're about grounding quality — only verified verses are safe to quote. Hallucination prevention — seven layers from injection to auto-correction. Edge-case handling — from crisis detection to contradictory theology. And reasoning — the model thinks before it speaks.

Thanks for watching. The repo is at github.com/ayusingh-54/Logos-AI."

---

## Recording Tips

- **Screen resolution:** 1920x1080, browser at ~90% zoom so text is readable
- **Browser:** Use Chrome with DevTools closed (open briefly only for pipeline trace)
- **Dark mode:** Off for recording — light mode is easier to read on video
- **Typing:** Don't rush — let the viewer read your prompts
- **Waiting:** While the model generates, narrate what's happening in the pipeline
- **Badges:** Zoom in or point cursor at metadata badges when referencing them
- **Pace:** Practice once before recording — 5 minutes goes fast
- **Energy:** Be conversational, not scripted-sounding — these are your engineering decisions, own them
