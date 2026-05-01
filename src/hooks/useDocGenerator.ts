import { useState } from 'react';
import type {
  ClarificationAnswer,
  ClarificationQuestion,
  GeneratedDoc,
  InputData,
  LLMConfig,
  Progress,
} from '../types';
import { callLLM } from '../services/llmService';
import { fetchGitHubRepoDetailed } from '../utils/githubFetcher';
import { parseDoc, parseQuestions } from '../utils/llmParser';
import { buildClarificationPrompt, buildDocPrompt } from '../utils/promptBuilder';

export interface UseDocGeneratorResult {
  progress: Progress | null;
  questions: ClarificationQuestion[];
  doc: GeneratedDoc | null;
  isLoading: boolean;
  startGeneration: (data: InputData) => Promise<void>;
  submitAnswers: (answers: ClarificationAnswer[]) => Promise<void>;
  reset: () => void;
}

function getConfig(): LLMConfig {
  return {
    provider: import.meta.env.VITE_LLM_PROVIDER || 'ollama',
    ollamaModel: import.meta.env.VITE_OLLAMA_MODEL,
    ollamaBaseUrl: import.meta.env.VITE_OLLAMA_BASE_URL,
  };
}

export function useDocGenerator(): UseDocGeneratorResult {
  const [progress, setProgress] = useState<Progress | null>(null);
  const [questions, setQuestions] = useState<ClarificationQuestion[]>([]);
  const [doc, setDoc] = useState<GeneratedDoc | null>(null);
  const [pendingInput, setPendingInput] = useState<InputData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function startGeneration(data: InputData) {
    try {
      setIsLoading(true);
      setProgress({ step: 'Loading source', percent: 10 });
      setQuestions([]);
      setDoc(null);

      let resolved = data;
      if (data.mode === 'link') {
        if (!data.url) throw new Error('URL is required for link mode');
        const fetched = await fetchGitHubRepoDetailed(data.url);
        console.info('[docgen] GitHub fetch:', {
          included: fetched.filesIncluded,
          skipped: fetched.filesSkipped,
          truncated: fetched.truncated,
        });
        const skippedNote = fetched.filesSkipped.length
          ? `, ${fetched.filesSkipped.length} skipped`
          : '';
        const truncNote = fetched.truncated ? ' (tree truncated)' : '';
        setProgress({
          step: `Fetched ${fetched.filesIncluded.length} files${skippedNote}${truncNote}`,
          percent: 25,
        });
        resolved = { ...data, code: fetched.text };
      } else if (!data.code) {
        throw new Error('Code is required for paste mode');
      }

      setPendingInput(resolved);
      setProgress({ step: 'Analyzing code', percent: 35 });

      const prompt = buildClarificationPrompt(resolved);
      const raw = await callLLM(prompt, getConfig());
      setQuestions(parseQuestions(raw));
      setProgress({ step: 'Awaiting clarifications', percent: 50 });
    } finally {
      setIsLoading(false);
    }
  }

  async function submitAnswers(answers: ClarificationAnswer[]) {
    if (!pendingInput) throw new Error('No input data; call startGeneration first');
    try {
      setIsLoading(true);
      setProgress({ step: 'Generating documentation', percent: 70 });
      const prompt = buildDocPrompt(pendingInput, answers);
      const raw = await callLLM(prompt, getConfig());
      setProgress({ step: 'Formatting output', percent: 90 });
      setDoc(parseDoc(raw));
      setProgress({ step: 'Done', percent: 100 });
    } finally {
      setIsLoading(false);
    }
  }

  function reset() {
    setProgress(null);
    setQuestions([]);
    setDoc(null);
    setPendingInput(null);
    setIsLoading(false);
  }

  return { progress, questions, doc, isLoading, startGeneration, submitAnswers, reset };
}
