import { useState } from 'react';
import { FileInput } from './components/FileInput';
import { ClarificationForm } from './components/ClarificationForm';
import { ProgressBar } from './components/ProgressBar';
import { DocOutput } from './components/DocOutput';
import type {
  Phase,
  InputData,
  ClarificationAnswer,
  ClarificationQuestion,
  GeneratedDoc,
  Progress,
} from './types';

function App() {
  const [phase, setPhase] = useState<Phase>('input');
  const [, setInputData] = useState<InputData | null>(null);
  const [questions] = useState<ClarificationQuestion[]>([]);
  const [doc] = useState<GeneratedDoc | null>(null);
  const [progress] = useState<Progress>({ step: 'API documentation', percent: 38 });

  const handleInputSubmit = (data: InputData) => {
    setInputData(data);
    setPhase('clarification');
  };

  const handleAnswersSubmit = (_answers: ClarificationAnswer[]) => {
    setPhase('running');
  };

  const handleRunComplete = () => {
    setPhase('output');
  };

  const handleReset = () => {
    setPhase('input');
    setInputData(null);
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
          {phase === 'input' && <FileInput onSubmit={handleInputSubmit} />}
          {phase === 'clarification' && (
            <ClarificationForm
              questions={questions}
              onSubmit={handleAnswersSubmit}
              onBack={handleBack}
            />
          )}
          {phase === 'running' && (
            <ProgressBar progress={progress} onComplete={handleRunComplete} />
          )}
          {phase === 'output' && <DocOutput doc={doc} onReset={handleReset} />}
        </main>
      </div>

      <div className="toast-wrap" id="toasts" />
    </>
  );
}

export default App;
