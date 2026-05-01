import type { ClarificationQuestion, DocSection, GeneratedDoc } from '../types';

function stripCodeFence(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:\w+)?\s*\n([\s\S]*?)\n?```\s*$/);
  return fenced ? fenced[1].trim() : trimmed;
}

function extractJsonArray(raw: string, what: string): string {
  const cleaned = stripCodeFence(raw);
  const start = cleaned.indexOf('[');
  const end = cleaned.lastIndexOf(']');
  if (start === -1 || end === -1 || end < start) {
    throw new Error(`LLM did not return a JSON array of ${what}`);
  }
  return cleaned.slice(start, end + 1);
}

interface RawQuestion {
  id?: unknown;
  question?: unknown;
}

export function parseQuestions(raw: string): ClarificationQuestion[] {
  const jsonText = extractJsonArray(raw, 'questions');

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`Could not parse questions JSON: ${msg}`);
  }

  if (!Array.isArray(parsed)) {
    throw new Error('Questions payload was not a JSON array');
  }

  const questions: ClarificationQuestion[] = [];
  for (let i = 0; i < parsed.length; i++) {
    const item = parsed[i] as RawQuestion;
    const question = typeof item?.question === 'string' ? item.question.trim() : '';
    if (!question) continue;
    const rawId = typeof item?.id === 'string' ? item.id.trim() : '';
    questions.push({
      id: rawId || `q${questions.length + 1}`,
      question,
    });
  }

  if (questions.length === 0) {
    throw new Error('No valid questions found in LLM response');
  }
  return questions;
}

interface RawSuggestion {
  questionId?: unknown;
  answer?: unknown;
}

export function parseSuggestions(raw: string): Record<string, string> {
  const jsonText = extractJsonArray(raw, 'suggestions');

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`Could not parse suggestions JSON: ${msg}`);
  }

  if (!Array.isArray(parsed)) {
    throw new Error('Suggestions payload was not a JSON array');
  }

  const out: Record<string, string> = {};
  for (const item of parsed as RawSuggestion[]) {
    const id = typeof item?.questionId === 'string' ? item.questionId.trim() : '';
    const answer = typeof item?.answer === 'string' ? item.answer.trim() : '';
    if (id && answer) out[id] = answer;
  }
  return out;
}

function unwrapDocFence(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:markdown|md)?\s*\n([\s\S]*?)\n?```\s*$/i);
  return fenced ? fenced[1].trim() : trimmed;
}

function splitByHeader(markdown: string, headerLevel: 1 | 2): DocSection[] {
  const prefix = '#'.repeat(headerLevel);
  const headerRegex = new RegExp(`^${prefix}\\s+(.+)$`);
  const lines = markdown.split('\n');
  const sections: DocSection[] = [];
  let current: { title: string; content: string } | null = null;

  for (const line of lines) {
    const match = line.match(headerRegex);
    if (match) {
      if (current) sections.push({ title: current.title, content: current.content.trim() });
      current = { title: match[1].trim(), content: '' };
    } else if (current) {
      current.content += line + '\n';
    }
  }
  if (current) sections.push({ title: current.title, content: current.content.trim() });
  return sections;
}

export function parseDoc(markdown: string): GeneratedDoc {
  const cleaned = unwrapDocFence(markdown);
  let sections = splitByHeader(cleaned, 2);
  if (sections.length === 0) sections = splitByHeader(cleaned, 1);
  return { sections, markdown: cleaned };
}
