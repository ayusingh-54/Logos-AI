import { NextRequest, NextResponse } from "next/server";
import { runGraph } from "@/lib/langgraph/graph";
import {
  getSession,
  createSession,
  addMessage,
  getConversationHistory,
  listSessions,
  deleteSession,
} from "@/lib/memory";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      message,
      sessionId,
      denomination = "non-denominational",
    } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    let session = getSession(sessionId);
    if (!session) {
      session = createSession(sessionId, denomination);
    }

    addMessage(sessionId, "user", message);

    const history = getConversationHistory(sessionId);

    const result = await runGraph({
      userInput: message,
      denomination: session.denomination,
      conversationHistory: history.slice(0, -1),
    });

    addMessage(sessionId, "assistant", result.response);

    return NextResponse.json({
      response: result.response,
      imageUrl: result.imageUrl,
      metadata: {
        intent: result.intent,
        moderationCategory: result.moderationCategory,
        fakeVerseDetected: result.fakeVerseDetected,
        manipulationDetected: result.manipulationDetected,
        validationIssues: result.validationIssues,
        hasGrounding: !!result.groundingVerses,
      },
    });
  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      {
        error: "An error occurred processing your request",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  if (action === "sessions") {
    return NextResponse.json({ sessions: listSessions() });
  }

  return NextResponse.json({ status: "ok" });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");

  if (sessionId) {
    deleteSession(sessionId);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Session ID required" }, { status: 400 });
}
