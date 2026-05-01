# docgen — AI-Powered Documentation Generator

## Project Overview

Portfolio project by Rafael Barros and Guilherme. A web app that takes JavaScript/TypeScript source code (via paste or GitHub URL), asks clarifying questions upfront, then generates documentation using an LLM.

Target audience: Big tech AI roles recruiting — built to demonstrate LLM API integration, prompt engineering, and clean React/TypeScript architecture.

## Stack

- Vite + React + TypeScript
- `react-markdown` for rendering doc output
- `jszip` for downloading docs as ZIP
- LLM abstraction in `src/services/llmService.ts`
- Provider switched via `VITE_LLM_PROVIDER` env var

## Architecture — 3 Phases

```
Phase 1: FileInput → Phase 2: ClarificationForm → Phase 3: DocOutput
```

Phases: `'input' | 'clarification' | 'running' | 'output'`

State lives in `App.tsx`. The hook `useDocGenerator.ts` orchestrates everything.

## File Structure

```
src/
├── services/
│   └── llmService.ts         ← only file that calls LLM APIs
├── components/
│   ├── FileInput.tsx          ← Phase 1
│   ├── ClarificationForm.tsx  ← Phase 2
│   ├── DocOutput.tsx          ← Phase 3
│   └── ProgressBar.tsx
├── hooks/
│   └── useDocGenerator.ts    ← orchestrates the prompt chain
├── utils/
│   └── promptBuilder.ts      ← builds all prompts (no prompts elsewhere)
├── types.ts
└── App.tsx
```

## LLM Providers

Toggled via `VITE_LLM_PROVIDER` env var:

| Provider | Use case          | Cost |
| -------- | ----------------- | ---- |
| `ollama` | Local development | Free |

Switching providers requires only changing this one env var. No other files change.

## Rules

- **All LLM calls go through `llmService.ts` only** — never call fetch to an LLM API directly from a component or hook
- **All prompts are built in `promptBuilder.ts` only** — no prompt strings in components, hooks, or App.tsx
- **Do not install new dependencies** without saying so explicitly
- **Run `npm run build` before marking any task complete** — zero TypeScript errors allowed
- **No Tailwind** — do not convert CSS classes to Tailwind or CSS modules

## Prompt Chain

1. `buildClarificationPrompt(input)` → LLM returns a JSON array of `ClarificationQuestion[]` (shape: `{id, question}`)
2. `buildDocPrompt(input, answers)` → LLM returns a single markdown document with `##` section headers
3. The hook's `parseDoc` function splits the markdown into `DocSection[]` by `##` headers

## Environment Variables

```env
# Provider selection: ollama
VITE_LLM_PROVIDER=ollama

# Ollama (local)
VITE_OLLAMA_MODEL=llama3.1:8b
```

## Git Branch Strategy

- `main` — production
- `develop` — integration branch

- **If the user provides a GitHub issue URL**, create a new branch off `develop` (use a descriptive name like `issue/123-short-description`) and solve the issue on that branch. If there is **no GitHub issue link**, do **not** create a new branch unless the user explicitly asks.

## Out of Scope (v1)

- Multi-file upload
- Authentication / user accounts
- Saving history server-side
- Python/Java/other languages
- Real GitHub API integration (URL is input only, no repo fetching)
