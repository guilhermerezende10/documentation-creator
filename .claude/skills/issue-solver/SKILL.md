---
name: issue-solver
description: Solve a GitHub issue. If an issue URL is provided, branch off develop and implement the fix on that branch.
parameters:
  - name: issue_url
    type: string
    description: Full GitHub issue URL (e.g. "https://github.com/owner/repo/issues/123"). Leave empty to work on a non-issue task.
    optional: true
  - name: task
    type: string
    description: Free-form description of the work, used when no issue URL is provided or to add context beyond the issue body.
    optional: true
  - name: base_branch
    type: string
    description: Branch to fork from when an issue URL is provided. Defaults to "develop".
    optional: true
---

You are an engineer picking up a ticket. You read carefully, work on the right branch, and leave the tree clean.

Issue URL: {{issue_url}}
Free-form task: {{task}}
Base branch override: {{base_branch}}

## Branching policy (read first)

- **If `{{issue_url}}` is non-empty**, you MUST create a new branch off the develop branch before making any code changes.
- **If `{{issue_url}}` is empty**, you MUST NOT create a new branch unless the user has explicitly asked for one in `{{task}}` (e.g. "on a new branch", "branch off develop"). Otherwise, work on the current branch.
- Never amend, force-push, or rewrite history without an explicit request.
- Never push to `main`, `master`, or `develop` directly.

## Workflow when an issue URL is provided

1. **Parse the URL.** Extract `<owner>`, `<repo>`, and `<number>` from `{{issue_url}}`. If parsing fails, stop and report.
2. **Fetch the issue.** Run `gh issue view <number> --repo <owner>/<repo> --json number,title,body,labels,state,assignees`. If the issue is closed, ask the user to confirm before proceeding.
3. **Pre-flight conflict check (mandatory).** Before touching branches or the working tree:
   - Run `git fetch --all --prune`.
   - Run `git branch -a` and grep for the issue number plus a short keyword from the title — e.g. `git branch -a | grep -iE "<number>|<keyword>"`. Check both local and remote branches.
   - Run `gh pr list --state open --json number,title,headRefName,url --search "<number>"`. If `gh` is unavailable, fall back to `git log --oneline --all --since="7 days ago" | grep -iE "<number>|<keyword>"`.
   - **If a branch already exists for this issue (local or remote), STOP** and ask the user: *"A branch already exists for this. Work on top of it, or create a new one?"*
   - **If an open PR already exists for this issue, STOP** and ask: *"There's already an open PR for this. Continue anyway, or help resolve the conflict?"*
   - Only proceed when neither a matching branch nor an open PR is found.
4. **Sync the base branch.**
   - Resolve the base: `{{base_branch}}` if non-empty, otherwise `develop`. If the resolved branch does not exist locally or on the remote, fall back to `main` and warn.
   - Run `git fetch origin <base>` then `git checkout <base>` and `git pull --ff-only origin <base>`. If the working tree is dirty, stop and ask the user how to proceed (stash, commit, or abandon) — never discard their work.
5. **Create the branch.** Build a slug from the issue title: lowercase, ASCII, hyphenated, max ~5 words, no leading/trailing hyphens. Branch name format: `issue/<number>-<slug>`. Run `git checkout -b issue/<number>-<slug>`.
6. **Plan.** Re-read the issue body in full. Identify:
   - Affected files and line numbers (use them as the starting point for your reads).
   - The "Done when" / acceptance criteria — these are your exit conditions.
   - Any "Stability contract" / "Do not modify" sections — treat them as hard constraints.
7. **Implement** the smallest-change route the issue proposes (or your own equivalent if the proposal is wrong). Avoid drive-by refactors. Do not modify files the issue marks as out-of-scope.
8. **Verify.**
   - Run the project's build and test commands. For this repo: `npm run build` (TypeScript strict + Vite). Run anything else the issue's "Test cases" section requires.
   - Manually walk through each "Test cases" bullet and confirm each one passes.
9. **Report.** Summarize:
   - The branch name.
   - Each acceptance / "Done when" item with a check or note.
   - Files changed (path + 1-line description per file).
   - Any deviations from the proposed fix and why.
10. **Stop.** Do not commit, push, or open a PR unless the user explicitly asks. They may want to inspect the diff first.

## Workflow when no issue URL is provided

1. Read `{{task}}` and confirm the scope with the user if it is ambiguous.
2. Stay on the current branch unless the user said otherwise.
3. Do the work, run the build, and report changes — same reporting format as above, minus the "acceptance criteria" section.

## General rules

- Always confirm `git status` is clean (or only contains files you have just edited) before reporting "done".
- If a build or test fails, fix the underlying issue. Do not skip hooks, suppress errors, or weaken the contract to make checks pass.
- If the issue's proposed fix is wrong or has a better alternative, implement the better one but call it out explicitly in the report.
- If you cannot complete the issue (blocked by missing context, conflicting requirements, environment problems), stop early, describe what is blocking, and ask.
