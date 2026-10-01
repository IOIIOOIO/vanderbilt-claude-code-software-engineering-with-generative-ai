# AGENTS.md

Guidance for AI coding agents (Claude Code and others) working in this repository.

## Purpose

This repo holds exercise work for the Coursera course **"Claude Code: Software
Engineering with Generative AI Agents"** (Vanderbilt University). The user and
the agent work through the exercises together, module by module.

## Repository layout

```
.
├── AGENTS.md        # this file
├── README.md
└── module-1/        # Module 1 exercises
```

- One top-level directory per course module: `module-1/`, `module-2/`, ...
- Within a module, put each exercise in its own subdirectory
  (e.g. `module-1/exercise-01-<short-name>/`) with a short `README.md` stating
  the exercise prompt and what was done.

## Working agreements

- **Learning first.** This is a course. Explain the reasoning behind changes,
  and prefer small, reviewable steps over large one-shot rewrites.
- **Collaborate, don't run ahead.** Confirm the exercise's goal before
  building. If the course instructions are ambiguous, ask.
- **Keep exercises self-contained.** Each exercise directory should run on its
  own; don't create cross-module dependencies.
- **Document how to run it.** If an exercise has code, its README should list
  the commands to install, run, and test it.
- **Tests where it makes sense.** When an exercise produces code, add at least
  basic tests and run them before committing.

## Git conventions

- Write clear, descriptive commit messages (imperative mood, e.g.
  "Add module 1 exercise 2: prompt refinement").
- Commit per exercise or meaningful step; don't bundle unrelated work.
- Never commit secrets, API keys, or `.env` files.
