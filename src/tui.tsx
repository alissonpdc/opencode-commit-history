import { createSignal } from "solid-js";
import { Plugin } from "@opencode/plugin/tui";
import { createSnapshotReader } from "./git/snapshot";
import { createGitProcessRunner } from "./git/runner";
import type { GitSnapshot } from "./git/types";
import { createDebouncedAction } from "./refresh-scheduler";
import { GitSidebar } from "./ui/git-sidebar";

const REFRESH_DEBOUNCE_MS = 500;
const POLL_INTERVAL_MS = 15_000;
const PLUGIN_COMMAND_GROUP = "Git history";

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
    const poll = setInterval(scheduleRefresh, POLL_INTERVAL_MS);

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
      render: () => <GitSidebar snapshot={snapshot()} />,
    });

    return () => {
      unregisterSlot();
      stopEvents.forEach((stop) => stop());
      clearInterval(poll);
      scheduleRefresh.dispose();
    };
  },
});
