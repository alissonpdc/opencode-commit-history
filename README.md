# opencode-git-history

An [OpenCode](https://opencode.ai) TUI plugin that shows a **Git** section in the
session sidebar:

- Current branch name (`⎇ main`), falling back to the short HEAD hash when HEAD
  is detached.
- Worktree label (`↪ worktree: <name>`), only when the directory is a linked
  worktree — never shown for the main working tree.
- The last 8 commits, newest first, each with short hash, commit time
  (`dd/mm hh:mm`, local time) and subject.

```text
GIT
⎇ main
↪ worktree: feature-x        ← only inside a linked worktree
a1b2c3d 18/11 09:41
fix sidebar overflow
e4f5a6b 17/11 18:02
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

Pin the tag (`#v0.1.0`) or omit it to track the default branch. Config changes
apply without restarting OpenCode.

Non-git directories render nothing, so the plugin is safe to keep enabled
globally.

## Refresh behavior

The section re-reads the repository (debounced) when OpenCode reports branch
changes, filesystem changes, or a finished session execution — plus a 15s
safety-net poll for commits made outside OpenCode.

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
