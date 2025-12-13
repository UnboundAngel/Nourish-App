# gemini.md

## Purpose
This repository may be modified using AI tools.  
All changes must follow strict documentation, versioning, and scope rules.

---

## Core Rules
- Correctness and clarity are mandatory.
- Follow existing conventions exactly.
- Do not add features, refactors, or dependencies unless explicitly requested.
- Change the minimum required to satisfy the task.

---

## Versioning
- Every modified file must include a version header (file-level or documented in metadata).
- Version format: `MAJOR.MINOR.PATCH`
  - MAJOR: breaking or full rewrite
  - MINOR: feature or behavior change
  - PATCH: fixes or small edits
- Increment the version on **every** change, no exceptions.

---

## File Changes
- Partial changes: update the existing file and bump its version.
- Full rewrites:
  - Create a new file with an incremented MAJOR version, **or**
  - Move the old file into `/versions/` or `/archive/` with its final version preserved.
- Never overwrite a full file rewrite without preserving the previous version.

---

## Documentation
- Every change must be documented.
- Document:
  - What changed
  - Why it changed
  - Version number
- Keep documentation concise and factual.
- No undocumented behavior changes.

---

## Scope Control
- Touch only files directly related to the task.
- Do not reformat unrelated code.
- Do not modify config, tooling, or structure unless instructed.

---

## Comments
- Explain intent, not implementation.
- No tutorial-style or verbose comments.
- Keep comments accurate and up to date with the current version.

---

## Errors and Safety
- Handle errors explicitly.
- Do not silence failures.
- Match existing error-handling patterns.

---

## Output Rules
- Produce copy-paste-ready output.
- No filler, opinions, explanations, or AI references.
- Assume minimal intent if unclear.

---

## Final Rule
If a change cannot be clearly versioned and documented, do not make it.
