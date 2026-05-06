import { useRef, useState } from 'react';
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
import { parseDoc, parseQuestions, parseSuggestions } from '../utils/llmParser';
import {
  buildAnswerSuggestionPrompt,
  buildClarificationPrompt,
  buildDocPrompt,
  buildStricterRetryPrompt,
} from '../utils/promptBuilder';

export interface UseDocGeneratorResult {
  progress: Progress | null;
  questions: ClarificationQuestion[];
  doc: GeneratedDoc | null;
  pendingInput: InputData | null;
  isLoading: boolean;
  isSuggesting: boolean;
  startGeneration: (data: InputData) => Promise<void>;
  submitAnswers: (answers: ClarificationAnswer[]) => Promise<void>;
  suggestAnswers: () => Promise<Record<string, string>>;
  hydrate: (snapshot: {
    questions: ClarificationQuestion[];
    pendingInput: InputData;
  }) => void;
  cancel: () => void;
  reset: () => void;
}

async function callAndParseWithRetry<T>(
  prompt: string,
  config: LLMConfig,
  parser: (raw: string) => T,
  signal: AbortSignal,
  label: string,
): Promise<T> {
  const raw = await callLLM(prompt, config, { signal });
  try {
    return parser(raw);
  } catch (firstErr) {
    const msg = firstErr instanceof Error ? firstErr.message : String(firstErr);
    console.info(`[docgen] ${label} parse failed, retrying once with stricter prompt:`, msg);
    const stricter = buildStricterRetryPrompt(prompt);
    const retryRaw = await callLLM(stricter, config, { signal });
    try {
      return parser(retryRaw);
    } catch (secondErr) {
      const retryMsg = secondErr instanceof Error ? secondErr.message : String(secondErr);
      console.info(`[docgen] ${label} parse failed again after retry:`, retryMsg);
      throw firstErr;
    }
  }
}

export function useDocGenerator(config: LLMConfig): UseDocGeneratorResult {
  const [progress, setProgress] = useState<Progress | null>(null);
  const [questions, setQuestions] = useState<ClarificationQuestion[]>([]);
  const [doc, setDoc] = useState<GeneratedDoc | null>(null);
  const [pendingInput, setPendingInput] = useState<InputData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  function beginRequest(): AbortSignal {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    return controller.signal;
  }

  function endRequest(controllerSignal: AbortSignal) {
    if (abortRef.current && abortRef.current.signal === controllerSignal) {
      abortRef.current = null;
    }
  }

  async function startGeneration(data: InputData) {
    const signal = beginRequest();
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
      const parsed = await callAndParseWithRetry(
        prompt,
        config,
        parseQuestions,
        signal,
        'clarification questions',
      );
      setQuestions(parsed);
      setProgress({ step: 'Awaiting clarifications', percent: 50 });
    } finally {
      setIsLoading(false);
      endRequest(signal);
    }
  }

  async function submitAnswers(answers: ClarificationAnswer[]) {
    if (!pendingInput) throw new Error('No input data; call startGeneration first');
    const signal = beginRequest();
    try {
      setIsLoading(true);
      setProgress({ step: 'Generating documentation', percent: 70 });
      const prompt = buildDocPrompt(pendingInput, answers);
      const raw = await callLLM(prompt, config, { signal });
      setProgress({ step: 'Formatting output', percent: 90 });
      setDoc(parseDoc(raw));
      setProgress({ step: 'Done', percent: 100 });
    } finally {
      setIsLoading(false);
      endRequest(signal);
    }
  }

  async function suggestAnswers(): Promise<Record<string, string>> {
    if (!pendingInput) throw new Error('No input data; submit code first');
    if (questions.length === 0) return {};
    const signal = beginRequest();
    try {
      setIsSuggesting(true);
      const prompt = buildAnswerSuggestionPrompt(pendingInput, questions);
      return await callAndParseWithRetry(
        prompt,
        config,
        parseSuggestions,
        signal,
        'answer suggestions',
      );
    } finally {
      setIsSuggesting(false);
      endRequest(signal);
    }
  }

  function cancel() {
    abortRef.current?.abort();
    abortRef.current = null;
  }

  function reset() {
    cancel();
    setProgress(null);
    setQuestions([]);
    setDoc(null);
    setPendingInput(null);
    setIsLoading(false);
    setIsSuggesting(false);
  }

  function hydrate(snapshot: {
    questions: ClarificationQuestion[];
    pendingInput: InputData;
  }) {
    setQuestions(snapshot.questions);
    setPendingInput(snapshot.pendingInput);
  }

  return {
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
    cancel,
    reset,
  };
}
