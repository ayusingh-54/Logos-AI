"use client";

import { useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import Sidebar from "@/components/Sidebar";
import ChatInterface from "@/components/ChatInterface";

interface Session {
  id: string;
  title: string;
  denomination: string;
  messageCount: number;
}

export default function Home() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>(() => uuidv4());
  const [denomination, setDenomination] = useState("non-denominational");
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleNewSession = useCallback(() => {
    const newId = uuidv4();
    setActiveSessionId(newId);
  }, []);

  const handleSelectSession = useCallback((id: string) => {
    setActiveSessionId(id);
  }, []);

  const handleDeleteSession = useCallback(
    (id: string) => {
      setSessions((prev) => prev.filter((s) => s.id !== id));
      if (id === activeSessionId) {
        handleNewSession();
      }
    },
    [activeSessionId, handleNewSession]
  );

  const handleFirstMessage = useCallback(
    (msg: string) => {
      const title = msg.length > 50 ? msg.substring(0, 50) + "..." : msg;
      setSessions((prev) => {
        const exists = prev.find((s) => s.id === activeSessionId);
        if (exists) {
          return prev.map((s) =>
            s.id === activeSessionId
              ? { ...s, title, messageCount: s.messageCount + 1 }
              : s
          );
        }
        return [
          {
            id: activeSessionId,
            title,
            denomination,
            messageCount: 1,
          },
          ...prev,
        ];
      });
    },
    [activeSessionId, denomination]
  );

  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      return next;
    });
  }, []);

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-3 left-3 z-50 p-2 rounded-lg
          bg-[var(--bg-secondary)] border border-[var(--border)]
          text-[var(--text-primary)]"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="2" />
        </svg>
      </button>

      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 transition-transform fixed lg:relative z-40 h-full`}
      >
        <Sidebar
          sessions={sessions}
          activeSession={activeSessionId}
          onSelectSession={handleSelectSession}
          onNewSession={handleNewSession}
          onDeleteSession={handleDeleteSession}
          darkMode={darkMode}
          onToggleDarkMode={toggleDarkMode}
        />
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Chat */}
      <ChatInterface
        sessionId={activeSessionId}
        denomination={denomination}
        onDenominationChange={setDenomination}
        onFirstMessage={handleFirstMessage}
      />
    </div>
  );
}
