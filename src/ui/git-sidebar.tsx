import { For, Show, type Accessor } from "solid-js";
import { TextAttributes, type RGBA } from "@opentui/core";
import { usePlugin } from "@opencode/plugin/tui";
import { formatCommitTime } from "../git/date-format";
import type { GitSnapshot } from "../git/types";
import { SIDEBAR_COLORS } from "./colors";
import { truncateSubject } from "./truncate-subject";

const SUBJECT_MAX_WIDTH = 46;

/** Inline colored span: the runtime reads style.fg, but SpanProps types style as {} (upstream gap). */
function FgSpan(props: { fg: RGBA; children?: string | string[] }) {
  return <span style={{ fg: props.fg } as { fg?: RGBA }}>{props.children}</span>;
}

function BranchLine(props: { snapshot: GitSnapshot }) {
  const color = () => (props.snapshot.dirty ? SIDEBAR_COLORS.pending : SIDEBAR_COLORS.synced);
  return (
    <text attributes={TextAttributes.BOLD} fg={color()}>
      ⎇ {props.snapshot.branch === "" ? "(detached)" : props.snapshot.branch}
    </text>
  );
}

/** Sidebar section: current branch (+ worktree when linked) and the last commits. */
export function GitSidebar(props: { snapshot: GitSnapshot | null }) {
  const theme = usePlugin().theme;
  return (
    <Show when={props.snapshot}>
      {(snapshot: Accessor<GitSnapshot>) => (
        <box>
          <BranchLine snapshot={snapshot()} />
          <Show when={snapshot().worktree.isLinked}>
            <text fg={SIDEBAR_COLORS.accent}>↪ worktree: {snapshot().worktree.label}</text>
          </Show>
          <For each={snapshot().commits}>
            {(commit) => (
              <box>
                <text>
                  <FgSpan fg={theme.text.base}> {formatCommitTime(commit.date)}</FgSpan>
                  <FgSpan fg={SIDEBAR_COLORS.accent}> {commit.hash}</FgSpan>
                </text>
                <text attributes={TextAttributes.DIM} fg={theme.text.base}>
                  {truncateSubject(commit.subject, SUBJECT_MAX_WIDTH)}
                </text>
              </box>
            )}
          </For>
        </box>
      )}
    </Show>
  );
}
