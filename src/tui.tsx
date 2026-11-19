import { createSignal } from "solid-js";
import { Plugin } from "@opencode/plugin/tui";
import { createSnapshotReader, createStatusReader } from "./git/snapshot";
import { createGitProcessRunner } from "./git/runner";
import type { GitSnapshot } from "./git/types";
import { createLightPoll } from "./light-poll";
import { createDebouncedAction } from "./refresh-scheduler";
import { GitSidebar } from "./ui/git-sidebar";

const REFRESH_DEBOUNCE_MS = 500;
const STATUS_POLL_MS = 2_000;
const FULL_REFRESH_MS = 15_000;
const PLUGIN_COMMAND_GROUP = "Git history";

/** IANA timezone for commit timestamps; set via plugin options in cli.json. */
function configuredTimeZone(options: Readonly<Record<string, unknown>>): string | undefined {
  return typeof options.timezone === "string" && options.timezone !== "" ? options.timezone : undefined;
}

/** Server events worth re-reading the repository state for. */
const REFRESH_EVENT_TYPES = [
  "vcs.branch.updated",
  "filesystem.changed",
  "session.execution.succeeded",
  "session.execution.failed",
  "session.execution.interrupted",
] as const;

export default Plugin.define({
  id: "opencode-git-history",
  setup(context) {
    const directory = (context.location ?? context.data.location.default()).directory;
    const reader = createSnapshotReader(directory, createGitProcessRunner(directory));
    const [snapshot, setSnapshot] = createSignal<GitSnapshot | null>(null);

    const refresh = async (): Promise<void> => {
      setSnapshot(await reader.read());
    };
    const scheduleRefresh = createDebouncedAction(refresh, REFRESH_DEBOUNCE_MS);
    void refresh();

    const stopEvents = REFRESH_EVENT_TYPES.map((type) => context.data.on(type, scheduleRefresh));
    const fullPoll = setInterval(scheduleRefresh, FULL_REFRESH_MS);

    // Fast status loop: flips branch color within ~2s of working-tree changes.
    const statusPoll = createLightPoll({
      intervalMs: STATUS_POLL_MS,
      read: createStatusReader(directory, createGitProcessRunner(directory)).read,
      isEqual: (a, b) => a.branch === b.branch && a.dirty === b.dirty,
      onChange: () => void refresh(),
    });
    statusPoll.start();

    context.keymap.layer(() => ({
      mode: "global",
      commands: [
        {
          id: "opencode-git-history.refresh",
          title: "Refresh git history sidebar",
          group: PLUGIN_COMMAND_GROUP,
          palette: true,
          run: () => void refresh(),
        },
      ],
    }));

    const unregisterSlot = context.ui.slot({
      append: "sidebar.content",
      render: () => <GitSidebar snapshot={snapshot()} timeZone={configuredTimeZone(context.options)} />,
    });

    return () => {
      unregisterSlot();
      stopEvents.forEach((stop) => stop());
      clearInterval(fullPoll);
      statusPoll.dispose();
      scheduleRefresh.dispose();
    };
  },
});
