import { useEffect, useMemo, useRef, useState } from "react";
import { FileInput } from "./components/FileInput";
import { ClarificationForm } from "./components/ClarificationForm";
import { ProgressBar } from "./components/ProgressBar";
import { DocOutput } from "./components/DocOutput";
import { useDocGenerator } from "./hooks/useDocGenerator";
import { useLLMStatus } from "./hooks/useLLMStatus";
import { useToasts } from "./hooks/useToasts";
import { ToastList } from "./components/ToastList";
import { clearDraft, loadDraft, saveDraft } from "./utils/storage";
import type {
  Phase,
  InputData,
  ClarificationAnswer,
  FileInputDraft,
  Progress,
  LLMConfig,
} from "./types";

const FALLBACK_PROGRESS: Progress = { step: "Working", percent: 0 };
const EMPTY_INPUT_DRAFT: FileInputDraft = { mode: "paste", code: "", url: "" };

function App() {
  const restored = useRef(loadDraft());
  const [phase, setPhase] = useState<Phase>(restored.current?.phase ?? "input");
  const [error, setError] = useState<string | null>(null);
  const [inputDraft, setInputDraft] = useState<FileInputDraft>(() =>
    restored.current
      ? {
          mode: restored.current.inputMode,
          code: restored.current.code,
          url: restored.current.url,
        }
      : EMPTY_INPUT_DRAFT,
  );
  const [answers, setAnswers] = useState<Record<string, string>>(
    () => restored.current?.answers ?? {},
  );
  const {
    progress,
    questions,
    doc,
    pendingInput,
    isLoading,
    isSuggesting,
    startGeneration,
    submitAnswers,
    suggestAnswers,
    hydrate,
    reset,
  } = useDocGenerator();

  useEffect(() => {
    const snapshot = restored.current;
    if (!snapshot) return;
    if (
      snapshot.phase === "clarification" &&
      snapshot.questions.length > 0 &&
      snapshot.pendingInput
    ) {
      hydrate({
        questions: snapshot.questions,
        pendingInput: snapshot.pendingInput,
      });
    } else if (snapshot.phase === "clarification") {
      // Incomplete clarification snapshot — fall back to input phase.
      setPhase("input");
    }
    // Mark restoration consumed so subsequent renders persist new state instead.
    restored.current = null;
  }, [hydrate]);

  const llmConfig = useMemo<LLMConfig>(
    () => ({
      provider: import.meta.env.VITE_LLM_PROVIDER || "ollama",
      ollamaModel: import.meta.env.VITE_OLLAMA_MODEL,
      ollamaBaseUrl: import.meta.env.VITE_OLLAMA_BASE_URL,
    }),
    [],
  );
  const llmStatus = useLLMStatus(llmConfig);
  const { toasts, toast, dismiss } = useToasts();
  const isOffline = llmStatus === "offline";
  const isChecking = llmStatus === "unknown";
  const statusLabel = isOffline ? "OFFLINE" : isChecking ? "CHECKING" : "READY";

  const handleInputSubmit = async (data: InputData) => {
    if (isLoading) return;
    setError(null);
    setAnswers({});
    try {
      await startGeneration(data);
      setPhase("clarification");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleAnswersSubmit = async (answers: ClarificationAnswer[]) => {
    if (isLoading) return;
    setError(null);
    setPhase("running");
    try {
      await submitAnswers(answers);
      setPhase("output");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setPhase("clarification");
    }
  };

  const handleSuggestAnswers = async (): Promise<Record<string, string>> => {
    if (isLoading || isSuggesting) return {};
    setError(null);
    try {
      return await suggestAnswers();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return {};
    }
  };

  const handleReset = () => {
    reset();
    setError(null);
    setAnswers({});
    setInputDraft(EMPTY_INPUT_DRAFT);
    clearDraft();
    setPhase("input");
  };

  useEffect(() => {
    if (!doc) return;
    const t = setTimeout(() => setPhase("output"), 700);
    return () => clearTimeout(t);
  }, [doc]);

  useEffect(() => {
    if (phase === "output") {
      clearDraft();
      return;
    }
    if (phase !== "input" && phase !== "clarification") return;
    saveDraft({
      version: 1,
      phase,
      inputMode: inputDraft.mode,
      code: inputDraft.code,
      url: inputDraft.url,
      questions: phase === "clarification" ? questions : [],
      answers: phase === "clarification" ? answers : {},
      pendingInput: phase === "clarification" ? pendingInput : null,
    });
  }, [phase, inputDraft, questions, answers, pendingInput]);

  const handleBack = () => {
    setPhase("input");
  };

  return (
    <>
      <div className="app-bg" />

      <header className={"topbar" + (isOffline ? " offline" : "")}>
        <div className="logo">
          <span className="b">&lt;</span>docgen<span className="b">/&gt;</span>
        </div>
        <div className="topbar-line" />
        <div className="topbar-meta">
          <span>
            <span
              className={
                "dot" +
                (isOffline ? " bad" : isChecking ? " pending" : "")
              }
            />
            LLAMA 3.1 / {statusLabel}
          </span>
          <span className="ok">v1.0.4</span>
        </div>
      </header>

      <div className="app">
        <main className="shell">
          {error && (
            <div
              role="alert"
              style={{
                padding: "12px 16px",
                marginBottom: 16,
                border: "1px solid #c54",
                color: "#f99",
                background: "rgba(200, 60, 60, 0.08)",
                fontFamily: "monospace",
                fontSize: 13,
              }}
            >
              ERROR — {error}
            </div>
          )}
          {phase === "input" && (
            <FileInput
              onSubmit={handleInputSubmit}
              isLoading={isLoading}
              initialDraft={inputDraft}
              onDraftChange={setInputDraft}
            />
          )}
          {phase === "clarification" && (
            <ClarificationForm
              questions={questions}
              onSubmit={handleAnswersSubmit}
              onBack={handleBack}
              isLoading={isLoading}
              isSuggesting={isSuggesting}
              onSuggestAnswers={handleSuggestAnswers}
              initialAnswers={answers}
              onAnswersChange={setAnswers}
            />
          )}
          {phase === "running" && (
            <ProgressBar
              progress={progress ?? FALLBACK_PROGRESS}
              onComplete={doc ? () => setPhase("output") : undefined}
            />
          )}
          {phase === "output" && (
            <DocOutput doc={doc} onReset={handleReset} onToast={toast} />
          )}
        </main>
      </div>

      <ToastList toasts={toasts} onDismiss={dismiss} />
    </>
  );
}

export default App;
