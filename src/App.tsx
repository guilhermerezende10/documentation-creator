import { useEffect, useState } from 'react';
import { FileInput } from './components/FileInput';
import { ClarificationForm } from './components/ClarificationForm';
import { ProgressBar } from './components/ProgressBar';
import { DocOutput } from './components/DocOutput';
import { useDocGenerator } from './hooks/useDocGenerator';
import type { Phase, InputData, ClarificationAnswer, Progress } from './types';

const FALLBACK_PROGRESS: Progress = { step: 'Working', percent: 0 };

function App() {
  const [phase, setPhase] = useState<Phase>('input');
  const [error, setError] = useState<string | null>(null);
  const { progress, questions, doc, isLoading, startGeneration, submitAnswers, reset } =
    useDocGenerator();

  useEffect(() => {
    if (phase === 'running' && !doc && questions.length > 0) {
      setPhase('clarification');
    }
  }, [phase, questions, doc]);

  useEffect(() => {
    if (phase === 'running' && doc) {
      setPhase('output');
    }
  }, [phase, doc]);

  const handleInputSubmit = async (data: InputData) => {
    if (isLoading) return;
    setError(null);
    try {
      await startGeneration(data);
      setPhase('clarification');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleAnswersSubmit = async (answers: ClarificationAnswer[]) => {
    if (isLoading) return;
    setError(null);
    try {
      await submitAnswers(answers);
      setPhase('output');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleReset = () => {
    reset();
    setError(null);
    setPhase('input');
  };

  const handleBack = () => {
    setPhase('input');
  };

  return (
    <>
      <div className="app-bg" />

      <header className="topbar">
        <div className="logo">
          <span className="b">&lt;</span>docgen<span className="b">/&gt;</span>
        </div>
        <div className="topbar-line" />
        <div className="topbar-meta">
          <span>
            <span className="dot" />
            CLAUDE-H-4 / READY
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
                padding: '12px 16px',
                marginBottom: 16,
                border: '1px solid #c54',
                color: '#f99',
                background: 'rgba(200, 60, 60, 0.08)',
                fontFamily: 'monospace',
                fontSize: 13,
              }}
            >
              ERROR — {error}
            </div>
          )}
          {phase === 'input' && (
            <FileInput onSubmit={handleInputSubmit} isLoading={isLoading} />
          )}
          {phase === 'clarification' && (
            <ClarificationForm
              questions={questions}
              onSubmit={handleAnswersSubmit}
              onBack={handleBack}
              isLoading={isLoading}
            />
          )}
          {phase === 'running' && (
            <ProgressBar progress={progress ?? FALLBACK_PROGRESS} />
          )}
          {phase === 'output' && <DocOutput doc={doc} onReset={handleReset} />}
        </main>
      </div>

      <div className="toast-wrap" id="toasts" />
    </>
  );
}

export default App;
