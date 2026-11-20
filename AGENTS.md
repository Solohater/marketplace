# AGENTS.md

Guidelines for AI agents and humans working in this repository.

## Workflow

- Work through the plan's tickets one at a time (see `../plan.md` and `.scratch/marketplace/issues`).
- Complete a ticket end-to-end before starting the next: schema → API → UI → tests → verification.
- Ask before moving to a new ticket.
- **When a ticket is finished:** tick all completed checkboxes (`- [x]`) in `.scratch/marketplace/issues/<ticket>.md` and set its status to `done`.

## Testing & verification

- `npm run lint` — ESLint across workspaces
- `npm run typecheck` — tsc across workspaces
- `npm test` — Vitest unit + integration
- `npm run build` — shared, API, and web builds

## Docs update convention

After completing every task, sync the corresponding files under:

- `docs/changes/<date>-<task>.md` — append or create with file operations and dates
- `docs/reference/<task>-reference.md` — update reusable patterns with new learnings
- `docs/defination/<task>-explanation.md` — keep the code walkthrough in sync with actual implementation
