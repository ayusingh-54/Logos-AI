"use client";

import {
  MessageSquarePlus,
  Trash2,
  BookOpen,
  Cross,
  Sun,
  Moon,
  Info,
} from "lucide-react";
import { useState } from "react";

interface Session {
  id: string;
  title: string;
  denomination: string;
  messageCount: number;
}

interface Props {
  sessions: Session[];
  activeSession: string;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export default function Sidebar({
  sessions,
  activeSession,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  darkMode,
  onToggleDarkMode,
}: Props) {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div
      className="w-72 h-full flex flex-col border-r border-[var(--border)]
        bg-[var(--bg-secondary)]"
    >
      {/* Header */}
      <div className="p-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center
              bg-gradient-to-br from-[var(--accent)] to-[var(--accent-light)]
              shadow-lg"
          >
            <Cross size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[var(--text-primary)] leading-tight">
              Logos AI
            </h1>
            <p className="text-xs text-[var(--text-secondary)]">
              Christianity Assistant
            </p>
          </div>
        </div>

        <button
          onClick={onNewSession}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5
            rounded-xl text-sm font-medium text-white
            bg-gradient-to-r from-[var(--accent)] to-[var(--accent-light)]
            hover:opacity-90 transition-opacity shadow-md"
        >
          <MessageSquarePlus size={16} />
          New Conversation
        </button>
      </div>

      {/* Sessions */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
        {sessions.length === 0 && (
          <div className="text-center py-8 text-[var(--text-secondary)] text-sm">
            <BookOpen size={24} className="mx-auto mb-2 opacity-50" />
            <p>No conversations yet</p>
            <p className="text-xs mt-1">Start by asking a question</p>
          </div>
        )}

        {sessions.map((session) => (
          <button
            key={session.id}
            onClick={() => onSelectSession(session.id)}
            className={`w-full text-left rounded-lg px-3 py-2.5 mb-1 group
              transition-colors text-sm
              ${
                session.id === activeSession
                  ? "bg-[var(--bg-chat)] border border-[var(--border)] shadow-sm"
                  : "hover:bg-[var(--bg-chat)] border border-transparent"
              }`}
          >
            <div className="flex items-start justify-between gap-2">
              <p
                className="font-medium text-[var(--text-primary)] truncate flex-1"
              >
                {session.title}
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSession(session.id);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity
                  text-[var(--text-secondary)] hover:text-red-500 flex-shrink-0 mt-0.5"
              >
                <Trash2 size={14} />
              </button>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              {session.messageCount} messages
            </p>
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-[var(--border)]">
        <div className="flex items-center justify-between">
          <button
            onClick={onToggleDarkMode}
            className="p-2 rounded-lg hover:bg-[var(--bg-chat)] transition-colors
              text-[var(--text-secondary)]"
            title={darkMode ? "Light mode" : "Dark mode"}
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button
            onClick={() => setShowInfo(!showInfo)}
            className="p-2 rounded-lg hover:bg-[var(--bg-chat)] transition-colors
              text-[var(--text-secondary)]"
            title="About"
          >
            <Info size={18} />
          </button>
        </div>

        {showInfo && (
          <div
            className="mt-2 p-3 rounded-lg bg-[var(--bg-chat)] border border-[var(--border)]
              text-xs text-[var(--text-secondary)] animate-fade-in"
          >
            <p className="font-medium text-[var(--text-primary)] mb-1">
              Architecture
            </p>
            <p>
              LangGraph multi-agent pipeline with input moderation, intent
              routing, scripture grounding, response generation, and output
              validation. Powered by OpenAI GPT-4o + DALL-E 3.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
