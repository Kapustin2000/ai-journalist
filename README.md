# AI Journalist

AI Journalist is a sandbox project that demonstrates how a root “journalist” agent can orchestrate a pair of specialist sub‑agents to edit long-form articles block by block. The repository contains a lightweight CLI harness plus all prompts and helper utilities needed to test multi‑step editorial flows.

## Repository Layout

- `ai_journalist/` – application package with agents, shared tools, and typed models.
  - `agent.py` – entry point for the root journalist agent.
  - `sub_agents/segment_editor/` – Segment Editor agent and instructions.
  - `sub_agents/writer/` – Writer agent and instructions.
  - `tools/` – helper functions (memory, markup utilities, etc.).
  - `types/` – Pydantic models describing article segments and agent I/O.
- `article.md` – sample article used during local runs.
- `docs/` – documentation (see `docs/flow.md`).
- `requests.md` – scripted prompts that exercise the orchestration pipeline.
- `session-*.json` – captured session state for debugging.

## How It Works

1. **Root Agent** (`ai_journalist/agent.py`) reads the current `article_segments` from session state and interprets user prompts (e.g., the scenarios in `requests.md`).
2. **Segment Editor** receives per-block editing instructions. It is responsible for inserting/replacing segments, calling the Writer when new prose is needed, and logging every change to `pending_segment_updates`.
3. **Writer Agent** produces revised or brand-new blocks based on the neighbors and constraints supplied by the editor.
4. The queue `pending_segment_updates` accumulates all edits so the frontend (or a reviewer) can apply/reject them later.

The detailed flow, including message passing between agents, is illustrated in `docs/flow.md`.

## Running Scenarios

1. Open `requests.md` and pick one of the prompts (Phase 1 is a good warmup).
2. Provide the prompt to the root agent. Each request triggers a cascade of Segment Editor + Writer calls.
3. Inspect `pending_segment_updates` in the session JSON to ensure the expected stack of `rewrite_segment` / `insert_segment` actions is present.

## Development Notes

- Python 3.11+ is recommended (see `requirements.txt` for dependencies).
- The project intentionally keeps the root agent “dumb”: it never mutates `article_segments` directly, which makes it easier to audit pending changes.
- Documentation lives under `docs/`; feel free to expand it with additional flows or onboarding tips.

## License

The repository is provided for experimentation and internal demos. Use at your own risk.
