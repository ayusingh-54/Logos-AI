"use client";

import { Church, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

const DENOMINATIONS = [
  {
    id: "non-denominational",
    label: "Non-Denominational",
    description: "Broadly evangelical perspective",
  },
  {
    id: "catholic",
    label: "Catholic",
    description: "Roman Catholic tradition",
  },
  {
    id: "protestant",
    label: "Protestant",
    description: "Reformation traditions",
  },
  {
    id: "orthodox",
    label: "Orthodox",
    description: "Eastern Orthodox tradition",
  },
];

export default function DenominationSelector({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const current = DENOMINATIONS.find((d) => d.id === value) || DENOMINATIONS[0];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm
          bg-[var(--bg-secondary)] hover:bg-[var(--border)] transition-colors
          text-[var(--text-primary)] border border-[var(--border)]"
      >
        <Church size={16} className="text-[var(--accent)]" />
        <span>{current.label}</span>
        <ChevronDown
          size={14}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          className="absolute top-full mt-1 left-0 z-50 w-64 rounded-xl
            bg-[var(--bg-chat)] border border-[var(--border)] shadow-xl
            animate-fade-in overflow-hidden"
        >
          {DENOMINATIONS.map((d) => (
            <button
              key={d.id}
              onClick={() => {
                onChange(d.id);
                setOpen(false);
              }}
              className={`w-full text-left px-4 py-3 transition-colors hover:bg-[var(--bg-secondary)]
                ${d.id === value ? "bg-[var(--bg-secondary)]" : ""}`}
            >
              <div className="text-sm font-medium text-[var(--text-primary)]">
                {d.label}
              </div>
              <div className="text-xs text-[var(--text-secondary)]">
                {d.description}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
