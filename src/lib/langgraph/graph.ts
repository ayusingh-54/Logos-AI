import { StateGraph, END, START } from "@langchain/langgraph";
import { GraphState, type GraphStateType } from "./state";
import {
  moderateInput,
  classifyIntent,
  retrieveScripture,
  reasonAboutQuery,
  generateResponse,
  generateContent,
  handleImage,
  handleBlocked,
  validateOutput,
} from "./nodes";

// ── Routing functions ──
// These conditional edges are why LangGraph was chosen over a simple chain.
// Different message types take entirely different paths through the graph.

function routeAfterModeration(
  state: GraphStateType
): "classify_intent" | "handle_blocked" {
  if (state.moderationCategory === "ADVERSARIAL") {
    return "handle_blocked";
  }
  return "classify_intent";
}

function routeAfterIntent(
  state: GraphStateType
): "retrieve_scripture" | "handle_image" {
  if (state.intent === "IMAGE") {
    return "handle_image";
  }
  return "retrieve_scripture";
}

function routeAfterReasoning(
  state: GraphStateType
): "generate_response" | "generate_content" {
  if (state.intent === "CONTENT") {
    return "generate_content";
  }
  return "generate_response";
}

/*
 * Pipeline:
 *
 * START → moderate_input → [ADVERSARIAL? → handle_blocked → END]
 *                        → classify_intent → [IMAGE? → handle_image → END]
 *                                          → retrieve_scripture
 *                                          → reason_about_query
 *                                          → [CONTENT? → generate_content]
 *                                            [else    → generate_response]
 *                                          → validate_output → END
 */

export function buildGraph() {
  const graph = new StateGraph(GraphState)
    // Register all 9 nodes
    .addNode("moderate_input", moderateInput)
    .addNode("classify_intent", classifyIntent)
    .addNode("retrieve_scripture", retrieveScripture)
    .addNode("reason_about_query", reasonAboutQuery)
    .addNode("generate_response", generateResponse)
    .addNode("generate_content", generateContent)
    .addNode("handle_image", handleImage)
    .addNode("handle_blocked", handleBlocked)
    .addNode("validate_output", validateOutput)

    // Wire edges
    .addEdge(START, "moderate_input")

    .addConditionalEdges("moderate_input", routeAfterModeration, [
      "classify_intent",
      "handle_blocked",
    ])

    .addConditionalEdges("classify_intent", routeAfterIntent, [
      "retrieve_scripture",
      "handle_image",
    ])

    // Scripture grounding feeds into chain-of-thought reasoning
    .addEdge("retrieve_scripture", "reason_about_query")

    // Reasoning feeds into the appropriate generator
    .addConditionalEdges("reason_about_query", routeAfterReasoning, [
      "generate_response",
      "generate_content",
    ])

    // Both generators feed into output validation
    .addEdge("generate_response", "validate_output")
    .addEdge("generate_content", "validate_output")

    // Terminal edges
    .addEdge("validate_output", END)
    .addEdge("handle_image", END)
    .addEdge("handle_blocked", END);

  return graph.compile();
}

export async function runGraph(input: {
  userInput: string;
  denomination: string;
  conversationHistory: Array<{ role: string; content: string }>;
}) {
  const app = buildGraph();

  const result = await app.invoke({
    userInput: input.userInput,
    denomination: input.denomination,
    conversationHistory: input.conversationHistory,
  });

  return {
    response: result.response,
    imageUrl: result.imageUrl || null,
    intent: result.intent,
    moderationCategory: result.moderationCategory,
    fakeVerseDetected: result.fakeVerseDetected,
    manipulationDetected: result.manipulationDetected,
    misquotationAlert: result.misquotationAlert || null,
    validationIssues: result.validationIssues || null,
    groundingVerses: result.groundingVerses || null,
    outputValid: result.outputValid,
    pipelineTrace: result.pipelineTrace || [],
  };
}
