# CLAUDE.md — Agent System Bootstrap

You are an orchestrated multi-agent system. Follow these rules absolutely.

## System architecture

This project uses a team of specialized agents. Each agent has a defined role, token budget, and context scope. The system is designed to minimize token consumption while maintaining code quality.

## Startup sequence

When you receive a task:

1. Read `.ai/memory/project_index.md`
2. Read `.ai/memory/file_summaries.md`
3. Check `.ai/tasks/pending/` for queued tasks
4. Activate `orchestrator` agent

NEVER read source code directly from the main context.
NEVER scan the entire project tree.

## Agent definitions

All agent specs are in `.ai/agents/`:

| Agent | Model | Role | Token budget |
|-------|-------|------|-------------|
| orchestrator | sonnet | Coordinates tasks | 200-300 |
| lead-architect | opus | Designs, decomposes tasks | 400-700 |
| backend | sonnet | Server code | 1500 (code) |
| frontend | sonnet | UI code | 1500 (code) |
| code-reviewer | haiku | Reviews code | 300-400 |
| file-reader | haiku | Reads files → summaries | 500 |
| knowledge-manager | haiku | Updates knowledge layer | 400-800 |

## Context levels

```
Level 1 — User task (orchestrator only)
Level 2 — Execution plan (orchestrator + architect)
Level 3 — Implementation (backend, frontend, reviewer)
Level 4 — Knowledge archive (knowledge-manager, file-reader)
```

Main context (orchestrator) works ONLY with levels 1-2.
Sub-agents work at level 3.
Knowledge layer persists at level 4.

## Knowledge layer

```
.ai/knowledge/core_concepts.md  — stack, architecture
.ai/knowledge/project_rules.md  — coding conventions
.ai/knowledge/decisions.md      — decision log
.ai/knowledge/facts.md          — project facts
.ai/knowledge/lessons.md        — optimizations found
```

## Memory layer

```
.ai/memory/project_index.md     — file tree + purposes
.ai/memory/file_summaries.md    — cached file summaries
```

## File reading protocol

1. Check `file_summaries.md` first
2. If summary exists and file unchanged → use summary
3. If no summary → delegate to `file-reader` agent
4. file-reader reads file → produces summary → caches it
5. Summary returned to requesting agent (never full file)

## Task queue

```
.ai/tasks/pending/      — waiting
.ai/tasks/in_progress/  — one at a time
.ai/tasks/done/         — completed
```

## Inter-agent communication rules

- Pass ONLY results and summaries between agents
- NEVER pass full file contents
- NEVER pass full architecture docs
- Each delegation: max 500 tokens of context
- Agents produce structured output (not prose)

## After each task

Orchestrator MUST call `knowledge-manager` with the list of all created/modified files.
Knowledge-manager will:
- Read every file from the list
- Write structured summaries to `file_summaries.md`
- Update project index with new files
- Log architectural decisions

**This step is MANDATORY. Never skip it. The entire caching system depends on it.**

## Creating new tasks

Place `.md` files in `.ai/tasks/pending/` with format:
```
# TASK
[title]

## Goal
[what to achieve]

## Requirements
[specifics]

## Files expected
[output files]
```
