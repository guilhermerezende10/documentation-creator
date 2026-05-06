import type { ClarificationAnswer, ClarificationQuestion, InputData } from '../types';

export const MAX_CODE_CHARS = 80_000;

export type Language =
  | 'TypeScript'
  | 'JavaScript'
  | 'Python'
  | 'Go'
  | 'Rust'
  | 'Java'
  | 'Ruby'
  | 'PHP'
  | 'C#'
  | 'C/C++'
  | 'unknown';

export function detectLanguage(code: string): Language {
  if (/=== [^\n]*\.tsx?\b/.test(code) || /=== tsconfig\.json/.test(code)) return 'TypeScript';
  if (/=== [^\n]*\.jsx?\b/.test(code) || /=== package\.json/.test(code)) return 'JavaScript';
  if (/=== [^\n]*\.py\b/.test(code) || /=== pyproject\.toml/.test(code) || /=== setup\.py/.test(code)) return 'Python';
  if (/=== [^\n]*\.go\b/.test(code) || /=== go\.mod/.test(code)) return 'Go';
  if (/=== [^\n]*\.rs\b/.test(code) || /=== Cargo\.toml/.test(code)) return 'Rust';
  if (/=== [^\n]*\.java\b/.test(code) || /=== pom\.xml/.test(code)) return 'Java';
  if (/=== [^\n]*\.rb\b/.test(code) || /=== Gemfile/.test(code)) return 'Ruby';
  if (/=== [^\n]*\.php\b/.test(code)) return 'PHP';
  if (/=== [^\n]*\.cs\b/.test(code)) return 'C#';
  if (/=== [^\n]*\.[ch](pp)?\b/.test(code)) return 'C/C++';

  if (/\binterface\s+\w+\s*\{/.test(code) || /:\s*[A-Z]\w*(\[\])?\s*[,)=]/.test(code)) return 'TypeScript';
  if (/^\s*(import|from)\s+[\w.]+\s+import\b/m.test(code) || /^\s*def\s+\w+\s*\(/m.test(code)) return 'Python';
  if (/^\s*package\s+\w+/m.test(code) && /^\s*func\s+\w+\s*\(/m.test(code)) return 'Go';
  if (/^\s*(fn\s+\w+|impl\s+\w+|struct\s+\w+\s*\{|use\s+\w+::)/m.test(code)) return 'Rust';
  if (/^\s*public\s+(class|interface)\s+\w+/m.test(code)) return 'Java';
  if (/^\s*(import\s+|export\s+(default|function|const|class))/m.test(code) || /\brequire\s*\(/.test(code)) return 'JavaScript';

  return 'unknown';
}

export function truncateCode(code: string): { code: string; truncated: boolean; omittedChars: number } {
  if (code.length <= MAX_CODE_CHARS) {
    return { code, truncated: false, omittedChars: 0 };
  }
  const omitted = code.length - MAX_CODE_CHARS;
  const head = code.slice(0, MAX_CODE_CHARS);
  return {
    code: `${head}\n\n[... source truncated to fit prompt budget; ${omitted} characters omitted ...]`,
    truncated: true,
    omittedChars: omitted,
  };
}

function describeSource(input: InputData): string {
  const raw = input.code ?? '';
  const { code, truncated, omittedChars } = truncateCode(raw);
  const language = detectLanguage(raw);

  const lines: string[] = [];
  if (input.mode === 'link' && input.url) {
    lines.push(`Source URL: ${input.url}`);
  } else {
    lines.push('Source: pasted code');
  }
  if (language !== 'unknown') {
    lines.push(`Detected language: ${language}`);
  }
  if (truncated) {
    lines.push(`Note: source was truncated to ${MAX_CODE_CHARS} characters (${omittedChars} omitted).`);
  }
  lines.push('', 'Code:', '```', code, '```');
  return lines.join('\n');
}

export function withStrictJsonRetryHint(prompt: string): string {
  return [
    prompt,
    '',
    'NOTE: Your previous reply was not valid JSON. Reply with ONLY a JSON array — no prose, no fences.',
  ].join('\n');
}

export function buildClarificationPrompt(input: InputData): string {
  return [
    'You are a senior technical writer preparing to document the codebase below.',
    'Your job: ask 3 to 5 sharp clarifying questions whose answers will let you',
    'write a high-quality README, API reference, and deployment guide.',
    '',
    'Good questions are concrete, code-grounded, and reveal intent the source alone cannot show:',
    '- target audience and primary use case',
    '- runtime expectations (versions, OS, dependencies the user must install)',
    '- known limitations or in-progress areas',
    '- conventions for configuration, secrets, and deployment',
    'Avoid generic questions you could answer yourself by reading the code.',
    '',
    describeSource(input),
    '',
    'Output format (STRICT):',
    'Return ONLY a JSON array. No prose, no markdown fences, no commentary before or after.',
    'Each item must be an object with shape {"id": "q1", "question": "..."}.',
    'IDs must be sequential: q1, q2, q3, ...',
    '',
    'Example exact output:',
    '[{"id":"q1","question":"Who is the target audience?"},{"id":"q2","question":"What runtime version is required?"}]',
  ].join('\n');
}

export function buildAnswerSuggestionPrompt(
  input: InputData,
  questions: ClarificationQuestion[],
): string {
  const questionLines = questions
    .map((q) => `- ${q.id}: ${q.question}`)
    .join('\n');

  return [
    'You are a senior technical writer studying the codebase below to draft answers',
    'to clarification questions a documentation writer would otherwise ask the project owner.',
    'Ground every answer in concrete details from the source — real file/function/class names,',
    'imports, config values. If the source is genuinely silent on a point, infer the most likely',
    'answer and keep it short rather than fabricating specifics.',
    '',
    describeSource(input),
    '',
    'Questions:',
    questionLines,
    '',
    'Output format (STRICT):',
    'Return ONLY a JSON array. No prose, no markdown fences, no commentary before or after.',
    'Each item must be an object with shape {"questionId": "<id>", "answer": "<text>"}.',
    'Use the exact question IDs above. Provide one entry per question. Keep each answer concise',
    '(2 to 4 sentences) and self-contained.',
    '',
    'Example exact output:',
    '[{"questionId":"q1","answer":"The target audience is ..."},{"questionId":"q2","answer":"Requires Node 18+ ..."}]',
  ].join('\n');
}

export function buildDocPrompt(input: InputData, answers: ClarificationAnswer[]): string {
  const answerLines = answers.length
    ? answers.map(a => `- ${a.questionId}: ${a.answer}`).join('\n')
    : '(no answers provided — make reasonable inferences from the code and call out assumptions inline)';

  return [
    'You are a senior technical writer. Produce complete project documentation in markdown',
    'for the codebase below. Be specific and grounded in the actual code — cite real',
    'function/class names, file paths, and config values rather than generic placeholders.',
    '',
    describeSource(input),
    '',
    'Clarification answers:',
    answerLines,
    '',
    'Produce a single markdown document with EXACTLY these top-level sections,',
    'in this order, each as a "## " header:',
    '## Overview',
    '## Installation',
    '## Usage',
    '## API Reference',
    '## Deployment',
    '## Troubleshooting',
    '',
    'Rules:',
    '- Output ONLY the markdown content. No prose before or after.',
    '- Do NOT wrap the whole document in a code fence.',
    '- Use fenced code blocks (```) for code samples within sections.',
    '- If a section does not apply, write a one-line "Not applicable" under the header rather than omitting it.',
  ].join('\n');
}

