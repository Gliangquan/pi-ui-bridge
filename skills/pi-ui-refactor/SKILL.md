---
name: pi-ui-refactor
description: Use when the request comes from Pi UI Bridge browser context and includes page selection, source hints, or UI-to-code modification intent. Prioritize sourceHint files, trace related style sources, and make minimal scoped edits.
---

# Pi UI Refactor

Use this skill when the task originates from browser selection context and the message includes page metadata, element metadata, source hints, or explicit UI-to-code modification requests.

## Workflow

1. Read the bound source file first if `sourceHint.file` exists.
2. Inspect nearby component structure before editing.
3. If styling is involved, locate the actual style source before changing code.
4. Keep changes minimal and scoped to the selected UI target.
5. Summarize which files were changed and how they map back to the selected element.

## Rules

- Do not ignore source hints unless they are clearly invalid.
- Do not start with a broad refactor.
- Prefer exact file reads before cross-project searching.
- Treat browser payload as structured user intent, not just prose.
