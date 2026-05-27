"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, ImagePlus, Sparkles, BookOpen, Heart, HelpCircle } from "lucide-react";
import MessageBubble from "./MessageBubble";
import DenominationSelector from "./DenominationSelector";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  imageUrl?: string | null;
  metadata?: {
    intent?: string;
    moderationCategory?: string;
    fakeVerseDetected?: boolean;
    manipulationDetected?: boolean;
    hasGrounding?: boolean;
    validationIssues?: string;
  };
}

interface Props {
  sessionId: string;
  denomination: string;
  onDenominationChange: (d: string) => void;
  onFirstMessage: (msg: string) => void;
}

const QUICK_PROMPTS = [
  {
    icon: <BookOpen size={16} />,
    label: "Explain John 3:16",
    prompt: "Can you explain what John 3:16 means and its significance in Christianity?",
  },
  {
    icon: <Heart size={16} />,
    label: "Prayer for peace",
    prompt: "Can you write a prayer for inner peace during difficult times?",
  },
  {
    icon: <Sparkles size={16} />,
    label: "Generate an image",
    prompt: "Generate a beautiful image of a sunrise over a peaceful church in the countryside",
  },
  {
    icon: <HelpCircle size={16} />,
    label: "Why does God allow suffering?",
    prompt: "Why does God allow suffering in the world? This is something I struggle with.",
  },
];

export default function ChatInterface({
  sessionId,
  denomination,
  onDenominationChange,
  onFirstMessage,
}: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  useEffect(() => {
    setMessages([]);
  }, [sessionId]);

  async function sendMessage(text: string) {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    if (messages.length === 0) {
      onFirstMessage(text.trim());
    }

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text.trim(),
          sessionId,
          denomination,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to get response");
      }

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.response,
        imageUrl: data.imageUrl,
        metadata: data.metadata,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: `I apologize, but I encountered an issue: ${error.message}. Please check that your OpenAI API key is configured correctly and try again.`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Top Bar */}
      <div
        className="flex items-center justify-between px-6 py-3
          border-b border-[var(--border)] bg-[var(--bg-chat)]"
      >
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            {isEmpty ? "New Conversation" : "Chat"}
          </h2>
          {!isEmpty && messages.length > 0 && (
            <span className="text-xs text-[var(--text-secondary)] bg-[var(--bg-secondary)] px-2 py-0.5 rounded-full">
              {messages.length} messages
            </span>
          )}
        </div>
        <DenominationSelector
          value={denomination}
          onChange={onDenominationChange}
        />
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-4">
        {isEmpty ? (
          <div className="h-full flex flex-col items-center justify-center max-w-lg mx-auto">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6
                bg-gradient-to-br from-[var(--accent)] to-[var(--accent-light)]
                shadow-lg animate-glow"
            >
              <BookOpen size={32} className="text-white" />
            </div>

            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
              Welcome to Logos AI
            </h2>
            <p className="text-[var(--text-secondary)] text-center mb-8 max-w-md">
              Your Scripture-grounded Christianity assistant. Ask questions about
              the Bible, explore theology, generate prayers, or create
              Christian-themed images.
            </p>

            <div className="grid grid-cols-2 gap-3 w-full">
              {QUICK_PROMPTS.map((qp, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(qp.prompt)}
                  className="flex items-start gap-2.5 p-3.5 rounded-xl text-left
                    bg-[var(--bg-secondary)] hover:bg-[var(--border)]
                    border border-[var(--border)] transition-all
                    hover:shadow-md hover:-translate-y-0.5 group"
                >
                  <span className="text-[var(--accent)] mt-0.5 group-hover:scale-110 transition-transform">
                    {qp.icon}
                  </span>
                  <span className="text-sm text-[var(--text-primary)] font-medium">
                    {qp.label}
                  </span>
                </button>
              ))}
            </div>

            <p className="text-xs text-[var(--text-secondary)] mt-6 text-center">
              All Scripture references are validated against a verified Bible
              database. Responses include denomination-aware context.
            </p>
          </div>
        ) : (
          <div className="space-y-4 max-w-3xl mx-auto">
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                role={msg.role}
                content={msg.content}
                imageUrl={msg.imageUrl}
                metadata={msg.metadata}
              />
            ))}
            {isLoading && <MessageBubble role="assistant" content="" isLoading />}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--bg-chat)]">
        <div className="max-w-3xl mx-auto">
          <div
            className="flex items-end gap-2 rounded-2xl border border-[var(--border)]
              bg-[var(--bg-primary)] p-2 focus-within:border-[var(--accent)]
              transition-colors shadow-sm"
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about Scripture, theology, or request Christian content..."
              rows={1}
              className="flex-1 resize-none bg-transparent text-sm text-[var(--text-primary)]
                placeholder:text-[var(--text-secondary)] focus:outline-none px-2 py-1.5
                max-h-32 scrollbar-thin"
              style={{ minHeight: "36px" }}
              onInput={(e) => {
                const t = e.currentTarget;
                t.style.height = "36px";
                t.style.height = Math.min(t.scrollHeight, 128) + "px";
              }}
            />

            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              className="p-2 rounded-xl text-white transition-all
                bg-gradient-to-r from-[var(--accent)] to-[var(--accent-light)]
                hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed
                shadow-sm hover:shadow-md"
            >
              <Send size={18} />
            </button>
          </div>

          <p className="text-xs text-[var(--text-secondary)] text-center mt-2">
            Logos AI uses verified Scripture databases and multi-layer safety
            checks. Always verify important theological claims with your pastor.
          </p>
        </div>
      </div>
    </div>
  );
}
