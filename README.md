# documentation-creator

AI-powered documentation generator. Paste JavaScript/TypeScript source (or a GitHub URL), answer a few clarifying questions, and the app generates Markdown documentation via a local LLM.

## Quickstart

```bash
# 1. Install dependencies
npm install

# 2. Copy the example env file and edit values to match your setup
cp .env.example .env

# 3. Make sure Ollama is running and the model is pulled
ollama pull llama3.1:8b

# 4. Start the dev server
npm run dev
```

See [`.env.example`](./.env.example) for the full list of supported `VITE_*` variables and their defaults.
