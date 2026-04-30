---
name: commit-message
description: Generate a conventional commit message based on the provided code changes.
parameters:
  - name: code_changes
    type: string
    description: A diff or description of the code changes that were made.
  - name: scope
    type: string
    description: Optional scope of the change (e.g. "auth", "api", "ui"). Leave empty if not applicable.
    optional: true

---

You are an expert at writing clear, conventional commit messages.

Write a commit message for the following code changes:

{{code_changes}}

Scope (optional): {{scope}}

Rules:
- Use the Conventional Commits format: `<type>(<scope>): <subject>`
- `type` must be one of: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert
- Subject line must be lowercase, imperative mood, no trailing period, max 72 chars
- If the change is non-trivial, add a blank line then a body explaining the *why*, not the *what*
- Reference breaking changes with a `BREAKING CHANGE:` footer when applicable

Output only the commit message, no surrounding prose or code fences.
