import { useState } from 'react';
import { FileInput } from './components/FileInput';
import { ClarificationForm } from './components/ClarificationForm';
import { DocOutput } from './components/DocOutput';
import type {
  Phase,
  InputData,
  ClarificationAnswer,
  ClarificationQuestion,
  GeneratedDoc,
} from './types';

function App() {
  const [phase, setPhase] = useState<Phase>('input');
  const [, setInputData] = useState<InputData | null>(null);
  const [questions] = useState<ClarificationQuestion[]>([]);
  const [doc] = useState<GeneratedDoc | null>(null);

  const handleInputSubmit = (data: InputData) => {
    setInputData(data);
    setPhase('clarification');
  };

  const handleAnswersSubmit = (_answers: ClarificationAnswer[]) => {
    setPhase('output');
  };

  const handleReset = () => {
    setPhase('input');
    setInputData(null);
  };

  return (
    <div>
      {phase === 'input' && <FileInput onSubmit={handleInputSubmit} />}
      {phase === 'clarification' && (
        <ClarificationForm questions={questions} onSubmit={handleAnswersSubmit} />
      )}
      {phase === 'output' && doc && <DocOutput doc={doc} onReset={handleReset} />}
    </div>
  );
}

export default App;
