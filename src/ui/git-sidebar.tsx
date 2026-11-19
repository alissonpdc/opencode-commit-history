import { For, Show, type Accessor } from "solid-js";
import { TextAttributes, type RGBA } from "@opentui/core";
import { usePlugin } from "@opencode/plugin/tui";
import { formatCommitTime } from "../git/date-format";
import type { GitSnapshot } from "../git/types";
import { chevronGlyph } from "./chevron";
import { SIDEBAR_COLORS } from "./colors";
import { truncateSubject } from "./truncate-subject";

const SUBJECT_MAX_WIDTH = 46;

interface ExpandedState {
  expanded: boolean;
}

/** Inline colored span: the runtime reads style.fg, but SpanProps types style as {} (upstream gap). */
function FgSpan(props: { fg: RGBA; children?: string | string[] }) {
  return <span style={{ fg: props.fg } as { fg?: RGBA }}>{props.children}</span>;
}

function BranchLine(props: { snapshot: GitSnapshot; expanded: boolean; onToggle: () => void }) {
  const color = () => (props.snapshot.dirty ? SIDEBAR_COLORS.pending : SIDEBAR_COLORS.synced);
  return (
    <text
      attributes={TextAttributes.BOLD}
      fg={color()}
      // onMouseUp fires exactly once per click; onMouse fires for press AND release.
      onMouseUp={() => props.onToggle()}
    >
      {chevronGlyph(props.expanded)} ⎇ {props.snapshot.branch === "" ? "(detached)" : props.snapshot.branch}
    </text>
  );
}

/** Sidebar section: current branch (+ worktree when linked) and the last commits. */
export function GitSidebar(props: { snapshot: GitSnapshot | null }) {
  const context = usePlugin();
  const theme = context.theme;
  const [expanded, updateExpanded] = context.storage.store<ExpandedState>("expanded", {
    initial: { expanded: true },
  });
  const toggle = () => void updateExpanded((draft) => { draft.expanded = !draft.expanded; });
  return (
    <Show when={props.snapshot}>
      {(snapshot: Accessor<GitSnapshot>) => (
        <box>
          <BranchLine snapshot={snapshot()} expanded={expanded.expanded} onToggle={toggle} />
          <Show when={snapshot().worktree.isLinked}>
            <text fg={SIDEBAR_COLORS.accent}>↪ worktree: {snapshot().worktree.label}</text>
          </Show>
          <Show when={expanded.expanded}>
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
          </Show>
        </box>
      )}
    </Show>
  );
}
