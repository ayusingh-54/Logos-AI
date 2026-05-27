import { StateGraph, END, START } from "@langchain/langgraph";
import { GraphState, type GraphStateType } from "./state";
import {
  moderateInput,
  classifyIntent,
  retrieveScripture,
  generateResponse,
  generateContent,
  handleImage,
  handleBlocked,
  validateOutput,
} from "./nodes";

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

function routeAfterScripture(
  state: GraphStateType
): "generate_response" | "generate_content" {
  if (state.intent === "CONTENT") {
    return "generate_content";
  }
  return "generate_response";
}

export function buildGraph() {
  const graph = new StateGraph(GraphState)
    .addNode("moderate_input", moderateInput)
    .addNode("classify_intent", classifyIntent)
    .addNode("retrieve_scripture", retrieveScripture)
    .addNode("generate_response", generateResponse)
    .addNode("generate_content", generateContent)
    .addNode("handle_image", handleImage)
    .addNode("handle_blocked", handleBlocked)
    .addNode("validate_output", validateOutput)

    // Edges
    .addEdge(START, "moderate_input")
    .addConditionalEdges("moderate_input", routeAfterModeration, [
      "classify_intent",
      "handle_blocked",
    ])
    .addConditionalEdges("classify_intent", routeAfterIntent, [
      "retrieve_scripture",
      "handle_image",
    ])
    .addConditionalEdges("retrieve_scripture", routeAfterScripture, [
      "generate_response",
      "generate_content",
    ])
    .addEdge("generate_response", "validate_output")
    .addEdge("generate_content", "validate_output")
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
    validationIssues: result.validationIssues || null,
    groundingVerses: result.groundingVerses || null,
  };
}
