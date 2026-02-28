"use client";

import { useState } from "react";

interface SearchInputProps {
  onSearch: (query: string) => void;
  disabled?: boolean;
}

export default function SearchInput({ onSearch, disabled }: SearchInputProps) {
  const [query, setQuery] = useState("");

  function handleSubmit(e: { preventDefault: () => void }) {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed && !disabled) {
      onSearch(trimmed);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div
        className="relative group"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-primary)",
          borderRadius: "16px",
          transition: "border-color 0.2s, box-shadow 0.2s",
        }}
      >
        {/* Glow effect on focus-within */}
        <div
          className="absolute -inset-px rounded-[17px] opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none"
          style={{
            background:
              "linear-gradient(135deg, var(--accent-glow), transparent, var(--accent-glow))",
            filter: "blur(8px)",
          }}
        />

        <div className="relative flex items-center gap-3 px-5 py-4">
          {/* Search icon */}
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            style={{ color: disabled ? "var(--text-muted)" : "var(--accent)" }}
            className="shrink-0 transition-colors"
          >
            <circle
              cx="8.5"
              cy="8.5"
              r="6"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M13 13L17 17"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Amazon products..."
            disabled={disabled}
            className="flex-1 bg-transparent outline-none placeholder:text-[var(--text-muted)] disabled:opacity-50 text-[15px]"
            style={{
              fontFamily: "var(--font-sans)",
              color: "var(--text-primary)",
            }}
          />

          <button
            type="submit"
            disabled={disabled || !query.trim()}
            className="shrink-0 px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              fontFamily: "var(--font-mono)",
              background: disabled
                ? "var(--bg-tertiary)"
                : "var(--accent)",
              color: disabled ? "var(--text-muted)" : "var(--bg-primary)",
              letterSpacing: "0.05em",
            }}
          >
            {disabled ? (
              <span className="flex items-center gap-2">
                <span
                  className="inline-block w-3 h-3 border-2 rounded-full animate-spin"
                  style={{
                    borderColor: "var(--text-muted)",
                    borderTopColor: "transparent",
                  }}
                />
                RUNNING
              </span>
            ) : (
              "RESEARCH"
            )}
          </button>
        </div>
      </div>

      <p
        className="text-center mt-3 text-xs"
        style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}
      >
        e.g. &quot;wireless earbuds&quot; &middot; &quot;mechanical keyboard&quot; &middot; &quot;running shoes&quot;
      </p>
    </form>
  );
}
