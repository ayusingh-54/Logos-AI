interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface ConversationSession {
  id: string;
  denomination: string;
  messages: ConversationMessage[];
  createdAt: number;
  title: string;
}

const sessions = new Map<string, ConversationSession>();

export function getSession(sessionId: string): ConversationSession | undefined {
  return sessions.get(sessionId);
}

export function createSession(
  sessionId: string,
  denomination: string
): ConversationSession {
  const session: ConversationSession = {
    id: sessionId,
    denomination,
    messages: [],
    createdAt: Date.now(),
    title: "New Conversation",
  };
  sessions.set(sessionId, session);
  return session;
}

export function addMessage(
  sessionId: string,
  role: "user" | "assistant",
  content: string
): void {
  const session = sessions.get(sessionId);
  if (!session) return;

  session.messages.push({ role, content, timestamp: Date.now() });

  if (session.messages.length === 1 && role === "user") {
    session.title =
      content.length > 50 ? content.substring(0, 50) + "..." : content;
  }
}

export function getConversationHistory(
  sessionId: string
): Array<{ role: string; content: string }> {
  const session = sessions.get(sessionId);
  if (!session) return [];
  return session.messages.map((m) => ({ role: m.role, content: m.content }));
}

export function listSessions(): Array<{
  id: string;
  title: string;
  denomination: string;
  messageCount: number;
  createdAt: number;
}> {
  return Array.from(sessions.values())
    .sort((a, b) => b.createdAt - a.createdAt)
    .map((s) => ({
      id: s.id,
      title: s.title,
      denomination: s.denomination,
      messageCount: s.messages.length,
      createdAt: s.createdAt,
    }));
}

export function deleteSession(sessionId: string): void {
  sessions.delete(sessionId);
}
