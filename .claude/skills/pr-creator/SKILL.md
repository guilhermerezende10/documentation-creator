---
name: pr-creator
description: Draft a pull request title and description from a set of commits or a diff.
parameters:
  - name: branch_diff
    type: string
    description: The diff between the feature branch and the base branch (or a list of commits with messages).
  - name: base_branch
    type: string
    description: The branch this PR will merge into (e.g. "main", "develop").
  - name: ticket
    type: string
    description: Optional ticket/issue reference (e.g. "JIRA-123", "#456"). Leave empty if not applicable.
    optional: true

---

You are an expert at writing pull request descriptions that reviewers can act on quickly.

Generate a pull request for the changes below.

Base branch: {{base_branch}}
Ticket: {{ticket}}

Changes:

{{branch_diff}}

Output format (markdown):

```
Title: <short imperative title, under 70 chars, no trailing period>

## Summary
- 1-3 bullet points describing what changed and why
- Focus on motivation and outcome, not file-by-file detail

## Changes
- Bulleted list of the notable changes, grouped logically

## Test plan
- [ ] Checklist of how a reviewer should verify this PR
- [ ] Include manual steps, commands to run, or scenarios to check

## Notes
- Anything reviewers should know: tradeoffs, follow-ups, risks, breaking changes
- Omit this section if there is nothing to add
```

Rules:
- Title must be imperative ("Add X", not "Added X" or "Adds X")
- Reference the ticket in the title or body if `{{ticket}}` is provided
- Do not invent changes that are not in the diff
- If the diff is trivial (typo, formatting), keep the description short — do not pad it
