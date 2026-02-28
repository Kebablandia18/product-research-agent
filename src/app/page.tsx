"use client";

import { useState, useCallback, useRef } from "react";
import SearchInput from "@/components/SearchInput";
import PipelineProgress from "@/components/PipelineProgress";
import Report from "@/components/Report";
import {
  PipelineEvent,
  PipelinePhase,
  AnalysisReport,
} from "@/lib/types";

type AppState = "idle" | "running" | "done" | "error";

export default function Home() {
  const [appState, setAppState] = useState<AppState>("idle");
  const [currentPhase, setCurrentPhase] = useState<PipelinePhase | null>(null);
  const [completedPhases, setCompletedPhases] = useState<PipelinePhase[]>([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [query, setQuery] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const handleSearch = useCallback(async (searchQuery: string) => {
    // Reset state
    setAppState("running");
    setCurrentPhase(null);
    setCompletedPhases([]);
    setStatusMessage("");
    setReport(null);
    setErrorMessage("");
    setQuery(searchQuery);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body as { error?: string }).error || `Request failed (${res.status})`
        );
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data: ")) continue;
          const payload = trimmed.slice(6);

          if (payload === "[DONE]") {
            setAppState("done");
            continue;
          }

          try {
            const event: PipelineEvent = JSON.parse(payload);
            setStatusMessage(event.message);
            setCurrentPhase(event.phase);

            if (event.status === "completed") {
              setCompletedPhases((prev) =>
                prev.includes(event.phase) ? prev : [...prev, event.phase]
              );
            }

            if (event.status === "error") {
              setErrorMessage(event.message);
              setAppState("error");
            }

            // The final "complete" phase carries the report
            if (
              event.phase === "complete" &&
              event.status === "completed" &&
              event.data
            ) {
              setReport(event.data as AnalysisReport);
              setAppState("done");
            }
          } catch {
            // skip unparseable lines
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setErrorMessage(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
      setAppState("error");
    }
  }, []);

  const isRunning = appState === "running";

  return (
    <main className="relative z-10 min-h-screen flex flex-col">
      {/* Header */}
      <header className="pt-12 pb-2 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: "var(--accent)",
              boxShadow: "0 0 20px var(--accent-glow)",
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              style={{ color: "var(--bg-primary)" }}
            >
              <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="9" cy="9" r="3" fill="currentColor" />
            </svg>
          </div>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            ARGUS
          </h1>
        </div>
        <p
          className="text-xs uppercase tracking-[0.2em]"
          style={{
            color: "var(--text-muted)",
            fontFamily: "var(--font-mono)",
          }}
        >
          Amazon Product Intelligence
        </p>
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center px-4">
        {/* Search — always visible */}
        <div
          className={`w-full transition-all duration-500 ${
            appState === "idle" ? "mt-[25vh]" : "mt-8"
          }`}
        >
          <SearchInput onSearch={handleSearch} disabled={isRunning} />
        </div>

        {/* Pipeline progress */}
        {(isRunning || appState === "error") && (
          <div className="mt-10 w-full">
            <PipelineProgress
              currentPhase={currentPhase}
              completedPhases={completedPhases}
              statusMessage={statusMessage}
              hasError={appState === "error"}
            />
          </div>
        )}

        {/* Error message */}
        {appState === "error" && errorMessage && (
          <div
            className="mt-6 max-w-md mx-auto px-4 py-3 rounded-lg text-sm text-center animate-fade-in"
            style={{
              background: "rgba(248, 113, 113, 0.06)",
              border: "1px solid rgba(248, 113, 113, 0.2)",
              color: "var(--error)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {errorMessage}
          </div>
        )}

        {/* Report */}
        {appState === "done" && report && (
          <div className="mt-10 w-full max-w-6xl mx-auto pb-20 animate-fade-in">
            <Report report={report} query={query} />
          </div>
        )}
      </div>
    </main>
  );
}
