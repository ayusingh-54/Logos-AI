"use client";

import { User, Cross, Shield, AlertTriangle, BookOpen, Image } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface MessageMetadata {
  intent?: string;
  moderationCategory?: string;
  fakeVerseDetected?: boolean;
  manipulationDetected?: boolean;
  hasGrounding?: boolean;
  validationIssues?: string;
}

interface Props {
  role: "user" | "assistant";
  content: string;
  imageUrl?: string | null;
  metadata?: MessageMetadata;
  isLoading?: boolean;
}

function MetadataBadges({ metadata }: { metadata: MessageMetadata }) {
  const badges: Array<{
    icon: React.ReactNode;
    label: string;
    color: string;
  }> = [];

  if (metadata.hasGrounding) {
    badges.push({
      icon: <BookOpen size={12} />,
      label: "Scripture Grounded",
      color: "text-green-600 bg-green-50 dark:bg-green-900/20",
    });
  }

  if (metadata.intent === "THEOLOGICAL") {
    badges.push({
      icon: <Cross size={12} />,
      label: "Theological",
      color: "text-purple-600 bg-purple-50 dark:bg-purple-900/20",
    });
  }

  if (metadata.intent === "IMAGE") {
    badges.push({
      icon: <Image size={12} />,
      label: "Image Generated",
      color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20",
    });
  }

  if (metadata.moderationCategory === "SENSITIVE") {
    badges.push({
      icon: <Shield size={12} />,
      label: "Sensitive Topic",
      color: "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20",
    });
  }

  if (metadata.fakeVerseDetected) {
    badges.push({
      icon: <AlertTriangle size={12} />,
      label: "Fake Verse Detected",
      color: "text-red-600 bg-red-50 dark:bg-red-900/20",
    });
  }

  if (metadata.manipulationDetected) {
    badges.push({
      icon: <Shield size={12} />,
      label: "Manipulation Blocked",
      color: "text-red-600 bg-red-50 dark:bg-red-900/20",
    });
  }

  if (badges.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {badges.map((b, i) => (
        <span
          key={i}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${b.color}`}
        >
          {b.icon}
          {b.label}
        </span>
      ))}
    </div>
  );
}

export default function MessageBubble({
  role,
  content,
  imageUrl,
  metadata,
  isLoading,
}: Props) {
  const isUser = role === "user";

  if (isLoading) {
    return (
      <div className="flex gap-3 animate-fade-in">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
            bg-gradient-to-br from-[var(--accent)] to-[var(--accent-light)]"
        >
          <Cross size={16} className="text-white" />
        </div>
        <div
          className="rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%]
            bg-[var(--assistant-bubble)] border border-[var(--border)]"
        >
          <div className="typing-indicator flex gap-1">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
            <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
            <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex gap-3 animate-slide-up ${isUser ? "flex-row-reverse" : ""}`}
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
          ${
            isUser
              ? "bg-[var(--user-bubble)]"
              : "bg-gradient-to-br from-[var(--accent)] to-[var(--accent-light)]"
          }`}
      >
        {isUser ? (
          <User size={16} className="text-white" />
        ) : (
          <Cross size={16} className="text-white" />
        )}
      </div>

      <div
        className={`rounded-2xl px-4 py-3 max-w-[80%] ${
          isUser
            ? "rounded-tr-sm bg-[var(--user-bubble)] text-white"
            : "rounded-tl-sm bg-[var(--assistant-bubble)] border border-[var(--border)] text-[var(--text-primary)]"
        }`}
      >
        {isUser ? (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
        ) : (
          <div className="markdown-content text-sm leading-relaxed">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )}

        {imageUrl && (
          <div className="mt-3">
            <img
              src={imageUrl}
              alt="Generated Christian-themed image"
              className="rounded-lg max-w-full shadow-lg border border-[var(--border)]"
              loading="lazy"
            />
          </div>
        )}

        {metadata && !isUser && <MetadataBadges metadata={metadata} />}
      </div>
    </div>
  );
}
