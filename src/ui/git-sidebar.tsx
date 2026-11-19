import { For, Show, type Accessor } from "solid-js";
import type { RGBA } from "@opentui/core";
import { usePlugin } from "@opencode/plugin/tui";
import { formatCommitTime } from "../git/date-format";
import type { GitSnapshot } from "../git/types";
import { truncateSubject } from "./truncate-subject";

const SUBJECT_MAX_WIDTH = 40;

/** Inline colored span: the runtime reads style.fg, but SpanProps types style as {} (upstream gap). */
function FgSpan(props: { fg: RGBA; children?: string }) {
  return <span style={{ fg: props.fg } as { fg?: RGBA }}>{props.children}</span>;
}

/** Sidebar section: current branch (+ worktree when linked) and the last commits. */
export function GitSidebar(props: { snapshot: GitSnapshot | null }) {
  const theme = usePlugin().theme;
  return (
    <Show when={props.snapshot}>
      {(snapshot: Accessor<GitSnapshot>) => (
        <box>
          <text fg={theme.text.faint}>GIT</text>
          <text>
            ⎇ <FgSpan fg={theme.hue.accent[500]}>{snapshot().branch === "" ? "(detached)" : snapshot().branch}</FgSpan>
          </text>
          <Show when={snapshot().worktree.isLinked}>
            <text fg={theme.text.muted}>↪ worktree: {snapshot().worktree.label}</text>
          </Show>
          <For each={snapshot().commits}>
            {(commit) => (
              <box>
                <text>
                  <FgSpan fg={theme.hue.accent[500]}>{commit.hash}</FgSpan>
                  <span style={{ fg: theme.text.muted } as { fg?: RGBA }}> {formatCommitTime(commit.date)}</span>
                </text>
                <text fg={theme.text.base}>{truncateSubject(commit.subject, SUBJECT_MAX_WIDTH)}</text>
              </box>
            )}
          </For>
        </box>
      )}
    </Show>
  );
}
