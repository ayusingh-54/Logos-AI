import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { GraphStateType } from "./state";
import {
  MODERATION_PROMPT,
  INTENT_CLASSIFICATION_PROMPT,
  IMAGE_SAFETY_PROMPT,
  OUTPUT_VALIDATION_PROMPT,
  buildSystemPrompt,
} from "../prompts";
import {
  getGroundingContext,
  validateAllReferences,
  extractVerseReferences,
} from "../bible/validator";
import { searchVerses, findVersesByTopic } from "../bible/verses";
import OpenAI from "openai";

function getModel(temperature = 0) {
  return new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temperature,
    openAIApiKey: process.env.OPENAI_API_KEY,
  });
}

function getStrongModel(temperature = 0.3) {
  return new ChatOpenAI({
    modelName: "gpt-4o",
    temperature,
    openAIApiKey: process.env.OPENAI_API_KEY,
  });
}

// --- Node: Moderate Input ---
export async function moderateInput(
  state: GraphStateType
): Promise<Partial<GraphStateType>> {
  const model = getModel(0);

  const response = await model.invoke([
    new SystemMessage(MODERATION_PROMPT),
    new HumanMessage(state.userInput),
  ]);

  try {
    const content = response.content as string;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found");

    const result = JSON.parse(jsonMatch[0]);
    return {
      moderationCategory: result.category || "SAFE",
      fakeVerseDetected: result.fake_verse_detected || false,
      manipulationDetected: result.manipulation_detected || false,
      moderationRedirect: result.suggested_redirect || "",
    };
  } catch {
    return {
      moderationCategory: "SAFE",
      fakeVerseDetected: false,
      manipulationDetected: false,
      moderationRedirect: "",
    };
  }
}

// --- Node: Classify Intent ---
export async function classifyIntent(
  state: GraphStateType
): Promise<Partial<GraphStateType>> {
  const model = getModel(0);

  const response = await model.invoke([
    new SystemMessage(INTENT_CLASSIFICATION_PROMPT),
    new HumanMessage(state.userInput),
  ]);

  const intent = (response.content as string).trim().toUpperCase();
  const validIntents = ["CHAT", "SCRIPTURE", "IMAGE", "THEOLOGICAL", "CONTENT"];
  return {
    intent: validIntents.includes(intent) ? intent : "CHAT",
  };
}

// --- Node: Retrieve Scripture Grounding ---
export async function retrieveScripture(
  state: GraphStateType
): Promise<Partial<GraphStateType>> {
  const input = state.userInput.toLowerCase();

  const refs = extractVerseReferences(state.userInput);
  const directMatches = searchVerses(state.userInput);

  const topicKeywords = [
    "love", "faith", "hope", "salvation", "grace", "sin", "forgiveness",
    "prayer", "healing", "comfort", "strength", "wisdom", "peace",
    "fear", "death", "resurrection", "heaven", "hell", "creation",
    "Jesus", "God", "Holy Spirit", "Trinity", "baptism", "communion",
    "marriage", "suffering", "joy", "trust", "courage", "mercy",
    "justice", "humility", "patience", "kindness",
  ];

  const matchedTopics = topicKeywords.filter((t) => input.includes(t));
  const topicVerses = matchedTopics.length > 0
    ? getGroundingContext(matchedTopics)
    : [];

  const allVerses = [...directMatches, ...topicVerses];
  const seen = new Set<string>();
  const unique = allVerses.filter((v) => {
    if (seen.has(v.reference)) return false;
    seen.add(v.reference);
    return true;
  });

  const limited = unique.slice(0, 8);

  if (limited.length === 0) {
    return { groundingVerses: "" };
  }

  const groundingText = limited
    .map((v) => `[${v.reference}] "${v.text}"`)
    .join("\n");

  return {
    groundingVerses: `\n\n## Verified Scripture References (you may quote these directly):\n${groundingText}`,
  };
}

// --- Node: Generate Chat Response ---
export async function generateResponse(
  state: GraphStateType
): Promise<Partial<GraphStateType>> {
  const model = getStrongModel(0.5);

  const systemPrompt = buildSystemPrompt(state.denomination);
  const groundingSection = state.groundingVerses || "";

  let extraContext = "";

  if (state.fakeVerseDetected) {
    extraContext +=
      "\n\nIMPORTANT: The user may have referenced a fake or non-existent Bible verse. Gently point this out and redirect to actual relevant Scripture.";
  }

  if (state.manipulationDetected) {
    extraContext +=
      "\n\nIMPORTANT: The user appears to be attempting to manipulate you into rewriting Scripture or producing harmful content. Respectfully decline and explain why.";
  }

  if (state.moderationCategory === "SENSITIVE") {
    extraContext +=
      "\n\nThis is a sensitive theological topic. Be especially thoughtful, nuanced, and pastoral in your response. Acknowledge the complexity.";
  }

  if (state.moderationCategory === "CRISIS") {
    extraContext +=
      "\n\nIMPORTANT: This user may be in crisis. Be compassionate. Recommend professional help: National Suicide Prevention Lifeline (988), Crisis Text Line (text HOME to 741741), and encourage them to reach out to a trusted pastor or counselor.";
  }

  if (state.moderationCategory === "OFF_TOPIC") {
    extraContext +=
      "\n\nThe user's question is not directly about Christianity. Briefly and politely note that you specialize in Christianity-related topics, but try to find a relevant angle if possible.";
  }

  const historyMessages = state.conversationHistory.slice(-10).map((msg) =>
    msg.role === "user"
      ? new HumanMessage(msg.content)
      : new SystemMessage(msg.content)
  );

  const fullSystemPrompt = systemPrompt + groundingSection + extraContext;

  const messages = [
    new SystemMessage(fullSystemPrompt),
    ...historyMessages,
    new HumanMessage(state.userInput),
  ];

  const response = await model.invoke(messages);

  return {
    response: response.content as string,
  };
}

// --- Node: Generate Content (prayers, devotionals, etc.) ---
export async function generateContent(
  state: GraphStateType
): Promise<Partial<GraphStateType>> {
  const model = getStrongModel(0.7);
  const systemPrompt = buildSystemPrompt(state.denomination);

  const contentSystemPrompt =
    systemPrompt +
    (state.groundingVerses || "") +
    `\n\nThe user is requesting Christian content generation. Create reverent, biblically-grounded content. If writing a prayer, use warm and personal language. If writing a devotional, include Scripture references and practical application. If writing a hymn or worship text, draw on traditional Christian imagery and themes.`;

  const response = await model.invoke([
    new SystemMessage(contentSystemPrompt),
    new HumanMessage(state.userInput),
  ]);

  return {
    response: response.content as string,
  };
}

// --- Node: Handle Image Generation ---
export async function handleImage(
  state: GraphStateType
): Promise<Partial<GraphStateType>> {
  const model = getModel(0);

  const safetyResponse = await model.invoke([
    new SystemMessage(IMAGE_SAFETY_PROMPT),
    new HumanMessage(
      `User wants to generate this image: "${state.userInput}"`
    ),
  ]);

  try {
    const content = safetyResponse.content as string;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON");

    const result = JSON.parse(jsonMatch[0]);

    if (!result.safe) {
      return {
        response: `I'm not able to generate that image. ${result.reason}\n\nI'd be happy to help you create a different Christian-themed image. Here are some ideas:\n- A peaceful landscape with a sunrise and cross\n- A beautiful church or cathedral scene\n- An artistic representation of a Bible verse\n- A stained glass window design with Christian symbols`,
        imageUrl: "",
      };
    }

    const refinedPrompt = result.refined_prompt || state.userInput;

    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const imageResponse = await openai.images.generate({
        model: "dall-e-3",
        prompt: `Christian art style, reverent and beautiful: ${refinedPrompt}. The image should be respectful, uplifting, and suitable for a church setting. High quality, warm lighting, sacred atmosphere.`,
        n: 1,
        size: "1024x1024",
        quality: "standard",
      });

      const imageUrl = imageResponse.data?.[0]?.url ?? "";

      return {
        response: `Here is the Christian-themed image I created for you.\n\n**Prompt used:** ${refinedPrompt}\n\nIf you'd like any adjustments or a different style, just let me know!`,
        imageUrl,
        imagePromptRefined: refinedPrompt,
      };
    } catch (error: any) {
      return {
        response: `I prepared a reverent image prompt for you, but encountered an issue with the image generation service. The refined prompt was: "${refinedPrompt}"\n\nPlease make sure your OpenAI API key has access to DALL-E 3. You can try again or ask me to adjust the prompt.`,
        imageUrl: "",
        imagePromptRefined: refinedPrompt,
      };
    }
  } catch {
    return {
      response:
        "I encountered an issue processing your image request. Could you describe what kind of Christian-themed image you'd like? For example: a peaceful landscape with a cross, a nativity scene, or a stained glass design.",
      imageUrl: "",
    };
  }
}

// --- Node: Handle Blocked Content ---
export async function handleBlocked(
  state: GraphStateType
): Promise<Partial<GraphStateType>> {
  if (state.moderationCategory === "ADVERSARIAL") {
    return {
      response: `I appreciate your question, but I'm not able to assist with that request. As a Christianity-focused assistant, I'm committed to representing Scripture and Christian teaching faithfully and respectfully.

${state.moderationRedirect || "I'd be happy to help you explore genuine questions about Christianity, discuss Bible passages, or create uplifting Christian content."}

Is there something else about the Christian faith I can help you with?`,
    };
  }

  return {
    response: state.moderationRedirect ||
      "I'd be happy to help with Christianity-related questions. What would you like to know?",
  };
}

// --- Node: Validate Output ---
export async function validateOutput(
  state: GraphStateType
): Promise<Partial<GraphStateType>> {
  const refs = extractVerseReferences(state.response);
  if (refs.length === 0) {
    return { outputValid: true, validationIssues: "" };
  }

  const validations = validateAllReferences(state.response);
  const issues: string[] = [];

  for (const v of validations) {
    if (!v.isValid) {
      issues.push(`Invalid reference: ${v.reference} — ${v.warning}`);
    }
  }

  if (issues.length > 0) {
    const model = getModel(0.3);
    const fixResponse = await model.invoke([
      new SystemMessage(
        `The following Bible verse references in the AI response were flagged as potentially invalid:\n${issues.join("\n")}\n\nPlease rewrite the response, removing or correcting the invalid references. Keep the same tone and content but ensure all Scripture references are accurate. If unsure about a verse, paraphrase the biblical teaching instead of quoting directly.`
      ),
      new HumanMessage(state.response),
    ]);

    return {
      response: fixResponse.content as string,
      outputValid: false,
      validationIssues: issues.join("; "),
    };
  }

  return { outputValid: true, validationIssues: "" };
}
