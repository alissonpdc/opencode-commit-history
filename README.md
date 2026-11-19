# opencode-git-history

An [OpenCode](https://opencode.ai) TUI plugin that shows a **Git** section in the
session sidebar:

- Current branch name (`⎇ main`, bold), colored by working-tree status: green
  when clean, red when there are uncommitted changes. Falls back to the short
  HEAD hash when HEAD is detached.
- Worktree label (`↪ worktree: <name>`, orange), only when the directory is a
  linked worktree — never shown for the main working tree.
- The last 5 commits, newest first, each with white commit time
  (`dd/mm hh:mm`, local time), orange short hash and dimmed subject.

Colors are fixed (orange `#FFA500`, red `#E5484D`, green `#3FB950`) so the
section reads the same on every theme.

Click the branch line (chevron `▾`/`▸`) to collapse or expand the commit
list. The choice persists across TUI restarts.

```text
▾ ⎇ main                     ← green when clean, red when dirty; click to collapse
↪ worktree: feature-x        ← only inside a linked worktree
18/11 09:41 a1b2c3d
fix sidebar overflow
17/11 18:02 e4f5a6b
add parser tests
```

## Install

Load it from GitHub through `cli.json` (the TUI-only plugin config):

```json title="~/.config/opencode/cli.json"
{
  "plugins": [
    "github:alissonpdc/opencode-git-history#v0.2.0"
  ]
}
```

Pin the tag (`#v0.2.0`) or omit it to track the default branch. Config changes
apply without restarting OpenCode.

### Options

Pass plugin options with the object form:

```json title="~/.config/opencode/cli.json"
{
  "plugins": [
    {
      "package": "github:alissonpdc/opencode-git-history#v0.2.0",
      "options": {
        "timezone": "America/Sao_Paulo"
      }
    }
  ]
}
```

| Option     | Type   | Default        | Description                                              |
| ---------- | ------ | -------------- | -------------------------------------------------------- |
| `timezone` | string | process locale | IANA timezone for commit timestamps (e.g. for UTC hosts) |

Non-git directories render nothing, so the plugin is safe to keep enabled
globally.

## Refresh behavior

Branch color flips within ~2s of working-tree changes: a lightweight poll
(`branch` + `status --porcelain`) watches for dirty/clean transitions and
branch switches, then triggers a full refresh. The full history also refreshes
(debounced) on OpenCode events — branch changes, filesystem changes, finished
session executions — plus a 15s safety-net poll for commits made elsewhere.

A `Refresh git history sidebar` command is registered in the command palette
(`ctrl+p`).

## Development

Requires [Bun](https://bun.com) to prebuild the TUI part (`dist/tui.js`, the
entrypoint npm/git installs load).

```sh
npm install
npm test          # vitest: unit + real-git integration tests
npm run typecheck
bun run build:dist
```

Layout:

```text
src/git/       pure logic: log parser, worktree resolver, date format, snapshot reader
src/ui/        sidebar component (SolidJS + @opentui)
src/tui.tsx    plugin entry: slot registration, refresh triggers, cleanup
test/          vitest suites (unit + integration against real git)
```

## License

MIT
