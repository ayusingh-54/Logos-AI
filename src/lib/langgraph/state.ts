import { Annotation } from "@langchain/langgraph";
import type { BaseMessage } from "@langchain/core/messages";

export const GraphState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (prev, next) => [...prev, ...next],
    default: () => [],
  }),
  userInput: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => "",
  }),
  denomination: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => "non-denominational",
  }),
  conversationHistory: Annotation<Array<{ role: string; content: string }>>({
    reducer: (_prev, next) => next,
    default: () => [],
  }),

  // Moderation
  moderationCategory: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => "SAFE",
  }),
  fakeVerseDetected: Annotation<boolean>({
    reducer: (_prev, next) => next,
    default: () => false,
  }),
  manipulationDetected: Annotation<boolean>({
    reducer: (_prev, next) => next,
    default: () => false,
  }),
  moderationRedirect: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => "",
  }),

  // Intent
  intent: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => "CHAT",
  }),

  // Scripture grounding
  groundingVerses: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => "",
  }),
  misquotationAlert: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => "",
  }),

  // Chain-of-thought reasoning (internal — never shown to user)
  reasoning: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => "",
  }),

  // Response
  response: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => "",
  }),

  // Image
  imageUrl: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => "",
  }),
  imagePromptRefined: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => "",
  }),

  // Validation
  outputValid: Annotation<boolean>({
    reducer: (_prev, next) => next,
    default: () => true,
  }),
  validationIssues: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => "",
  }),

  // Pipeline trace for debugging
  pipelineTrace: Annotation<string[]>({
    reducer: (prev, next) => [...prev, ...next],
    default: () => [],
  }),
});

export type GraphStateType = typeof GraphState.State;
