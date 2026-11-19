// @bun
// src/tui.tsx
import { createComponent as _$createComponent2 } from "@opentui/solid";
import { createSignal } from "solid-js";
import { Plugin } from "@opencode/plugin/tui";

// src/git/log-parser.ts
var FIELD = "\x1F";
var RECORD = "\x1E";
function parseCommitLog(output, limit) {
  const commits = [];
  for (const record of output.split(RECORD)) {
    const [hash = "", subject = "", date = ""] = record.split(FIELD).map((field) => field.trim());
    if (hash === "" || subject === "" || date === "")
      continue;
    commits.push({ hash, subject, date });
    if (commits.length === limit)
      break;
  }
  return commits;
}

// src/git/worktree-resolver.ts
import { basename, resolve } from "path";
function resolveWorktree(paths) {
  const rootPath = resolve(paths.rootPath);
  const gitDir = resolve(rootPath, paths.gitDir);
  const commonDir = resolve(rootPath, paths.commonDir);
  return {
    isLinked: gitDir !== commonDir,
    rootPath,
    label: basename(rootPath)
  };
}

// src/git/snapshot.ts
var SIDEBAR_COMMIT_LIMIT = 5;
var LOG_ARGUMENTS = ["log", `-${SIDEBAR_COMMIT_LIMIT}`, "--pretty=format:%h%x1f%s%x1f%aI%x1e"];
function createSnapshotReader(directory, runner) {
  const run = async (args) => (await runner(args)).trim();
  return { read: () => readSnapshot(run) };
}
async function readSnapshot(run) {
  const rootPath = await tryRun(run, ["rev-parse", "--show-toplevel"]);
  if (rootPath === null)
    return null;
  const gitDir = await run(["rev-parse", "--absolute-git-dir"]);
  const commonDir = await run(["rev-parse", "--git-common-dir"]);
  const branch = await run(["branch", "--show-current"]);
  const status = await run(["status", "--porcelain"]);
  const commits = parseCommitLog(await tryRun(run, LOG_ARGUMENTS) ?? "", SIDEBAR_COMMIT_LIMIT);
  return {
    branch: branch === "" ? commits[0]?.hash ?? "" : branch,
    detachedHead: branch === "",
    dirty: status !== "",
    worktree: resolveWorktree({ rootPath, gitDir, commonDir }),
    commits
  };
}
async function tryRun(run, args) {
  try {
    return (await run(args)).trim();
  } catch {
    return null;
  }
}
function createStatusReader(directory, runner) {
  const run = async (args) => (await runner(args)).trim();
  return {
    read: async () => {
      const branch = await tryRun(run, ["branch", "--show-current"]);
      if (branch === null)
        return null;
      const status = await tryRun(run, ["status", "--porcelain"]);
      if (status === null)
        return null;
      return { branch, dirty: status !== "" };
    }
  };
}

// src/git/runner.ts
import { execFile } from "child_process";
var GIT_TIMEOUT_MS = 5000;
var GIT_MAX_BUFFER_BYTES = 1024 * 1024;
function createGitProcessRunner(directory) {
  return async (args) => {
    const command = ["git", ...args];
    return new Promise((resolveOutput, rejectCommand) => {
      execFile(command[0] ?? "git", command.slice(1), {
        cwd: directory,
        timeout: GIT_TIMEOUT_MS,
        maxBuffer: GIT_MAX_BUFFER_BYTES,
        windowsHide: true
      }, (error, stdout, stderr) => {
        if (error !== null) {
          rejectCommand(new Error(`git ${args.join(" ")} failed: ${stderr.trim() || error.message}`));
          return;
        }
        resolveOutput(stdout);
      });
    });
  };
}

// src/light-poll.ts
function createLightPoll(options) {
  const { intervalMs, read, isEqual, onChange } = options;
  let timer = null;
  let baseline = null;
  let disposed = false;
  const tick = async () => {
    let next;
    try {
      next = await read();
    } catch {
      return;
    }
    if (disposed || next === null)
      return;
    const first = baseline === null;
    const previous = baseline;
    baseline = next;
    if (!first && previous !== null && !isEqual(previous, next))
      onChange(next);
  };
  return {
    start() {
      if (timer !== null)
        return;
      tick();
      timer = setInterval(() => void tick(), intervalMs);
    },
    dispose() {
      disposed = true;
      if (timer !== null)
        clearInterval(timer);
      timer = null;
    }
  };
}

// src/refresh-scheduler.ts
function createDebouncedAction(action, delayMs) {
  let timer = null;
  const schedule = () => {
    if (timer !== null)
      clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      action();
    }, delayMs);
  };
  schedule.dispose = () => {
    if (timer !== null)
      clearTimeout(timer);
    timer = null;
  };
  return schedule;
}

// src/ui/git-sidebar.tsx
import { createComponent as _$createComponent } from "@opentui/solid";
import { createTextNode as _$createTextNode } from "@opentui/solid";
import { insertNode as _$insertNode } from "@opentui/solid";
import { memo as _$memo } from "@opentui/solid";
import { setProp as _$setProp } from "@opentui/solid";
import { effect as _$effect } from "@opentui/solid";
import { insert as _$insert } from "@opentui/solid";
import { createElement as _$createElement } from "@opentui/solid";
import { For, Show } from "solid-js";
import { TextAttributes } from "@opentui/core";
import { usePlugin } from "@opencode/plugin/tui";

// src/git/date-format.ts
var formatterCache = new Map;
function getTimeFormatter(timeZone) {
  if (timeZone === undefined)
    return null;
  if (!formatterCache.has(timeZone)) {
    let formatter = null;
    try {
      formatter = new Intl.DateTimeFormat("en-GB", {
        timeZone,
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23"
      });
    } catch {
      formatter = null;
    }
    formatterCache.set(timeZone, formatter);
  }
  return formatterCache.get(timeZone) ?? null;
}
function localFormat(date) {
  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${day}/${month} ${hours}:${minutes}`;
}
function pad(value) {
  return String(value).padStart(2, "0");
}
function formatCommitTime(isoDate, timeZone) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime()))
    return isoDate;
  const formatter = getTimeFormatter(timeZone);
  if (formatter === null)
    return localFormat(date);
  const parts = formatter.formatToParts(date);
  const value = (type) => parts.find((part) => part.type === type)?.value ?? "";
  return `${value("day")}/${value("month")} ${value("hour")}:${value("minute")}`;
}

// src/ui/chevron.ts
function chevronGlyph(expanded) {
  return expanded ? "\u25BE" : "\u25B8";
}

// src/ui/colors.ts
import { RGBA } from "@opentui/core";
var SIDEBAR_COLORS = {
  accent: RGBA.fromHex("#FFA500"),
  pending: RGBA.fromHex("#E5484D"),
  synced: RGBA.fromHex("#3FB950")
};

// src/ui/truncate-subject.ts
var ELLIPSIS = "\u2026";
function truncateSubject(subject, maxWidth) {
  if (subject.length <= maxWidth)
    return subject;
  const keep = Math.max(maxWidth - ELLIPSIS.length, 0);
  return subject.slice(0, keep) + ELLIPSIS;
}

// src/ui/git-sidebar.tsx
var SUBJECT_MAX_WIDTH = 46;
function FgSpan(props) {
  return (() => {
    var _el$ = _$createElement("span");
    _$insert(_el$, () => props.children);
    _$effect((_$p) => _$setProp(_el$, "style", {
      fg: props.fg
    }, _$p));
    return _el$;
  })();
}
function BranchLine(props) {
  const color = () => props.snapshot.dirty ? SIDEBAR_COLORS.pending : SIDEBAR_COLORS.synced;
  return (() => {
    var _el$2 = _$createElement("text"), _el$3 = _$createTextNode(` \u2387 `);
    _$insertNode(_el$2, _el$3);
    _$setProp(_el$2, "onMouseUp", () => props.onToggle());
    _$insert(_el$2, () => chevronGlyph(props.expanded), _el$3);
    _$insert(_el$2, (() => {
      var _c$ = _$memo(() => props.snapshot.branch === "");
      return () => _c$() ? "(detached)" : props.snapshot.branch;
    })(), null);
    _$effect((_p$) => {
      var _v$ = TextAttributes.BOLD, _v$2 = color();
      _v$ !== _p$.e && (_p$.e = _$setProp(_el$2, "attributes", _v$, _p$.e));
      _v$2 !== _p$.t && (_p$.t = _$setProp(_el$2, "fg", _v$2, _p$.t));
      return _p$;
    }, {
      e: undefined,
      t: undefined
    });
    return _el$2;
  })();
}
function CommitLine(props) {
  return (() => {
    var _el$4 = _$createElement("text");
    _$insert(_el$4, _$createComponent(FgSpan, {
      get fg() {
        return props.white;
      },
      get children() {
        return [" ", _$memo(() => formatCommitTime(props.date, props.timeZone))];
      }
    }), null);
    _$insert(_el$4, _$createComponent(FgSpan, {
      get fg() {
        return props.accent;
      },
      get children() {
        return [" ", _$memo(() => props.hash)];
      }
    }), null);
    return _el$4;
  })();
}
function GitSidebar(props) {
  const context = usePlugin();
  const theme = context.theme;
  const [expanded, updateExpanded] = context.storage.store("expanded", {
    initial: {
      expanded: true
    }
  });
  const toggle = () => void updateExpanded((draft) => {
    draft.expanded = !draft.expanded;
  });
  return _$createComponent(Show, {
    get when() {
      return props.snapshot;
    },
    children: (snapshot) => (() => {
      var _el$5 = _$createElement("box");
      _$insert(_el$5, _$createComponent(BranchLine, {
        get snapshot() {
          return snapshot();
        },
        get expanded() {
          return expanded.expanded;
        },
        onToggle: toggle
      }), null);
      _$insert(_el$5, _$createComponent(Show, {
        get when() {
          return snapshot().worktree.isLinked;
        },
        get children() {
          var _el$6 = _$createElement("text"), _el$7 = _$createTextNode(`\u21AA worktree: `);
          _$insertNode(_el$6, _el$7);
          _$insert(_el$6, () => snapshot().worktree.label, null);
          _$effect((_$p) => _$setProp(_el$6, "fg", SIDEBAR_COLORS.accent, _$p));
          return _el$6;
        }
      }), null);
      _$insert(_el$5, _$createComponent(Show, {
        get when() {
          return expanded.expanded;
        },
        get children() {
          return _$createComponent(For, {
            get each() {
              return snapshot().commits;
            },
            children: (commit) => (() => {
              var _el$8 = _$createElement("box"), _el$9 = _$createElement("text");
              _$insertNode(_el$8, _el$9);
              _$insert(_el$8, _$createComponent(CommitLine, {
                get date() {
                  return commit.date;
                },
                get hash() {
                  return commit.hash;
                },
                get timeZone() {
                  return props.timeZone;
                },
                get white() {
                  return theme.text.base;
                },
                get accent() {
                  return SIDEBAR_COLORS.accent;
                }
              }), _el$9);
              _$insert(_el$9, () => truncateSubject(commit.subject, SUBJECT_MAX_WIDTH));
              _$effect((_p$) => {
                var _v$3 = TextAttributes.DIM, _v$4 = theme.text.base;
                _v$3 !== _p$.e && (_p$.e = _$setProp(_el$9, "attributes", _v$3, _p$.e));
                _v$4 !== _p$.t && (_p$.t = _$setProp(_el$9, "fg", _v$4, _p$.t));
                return _p$;
              }, {
                e: undefined,
                t: undefined
              });
              return _el$8;
            })()
          });
        }
      }), null);
      return _el$5;
    })()
  });
}

// src/tui.tsx
var REFRESH_DEBOUNCE_MS = 500;
var STATUS_POLL_MS = 2000;
var FULL_REFRESH_MS = 15000;
var PLUGIN_COMMAND_GROUP = "Git history";
function configuredTimeZone(options) {
  return typeof options.timezone === "string" && options.timezone !== "" ? options.timezone : undefined;
}
var REFRESH_EVENT_TYPES = ["vcs.branch.updated", "filesystem.changed", "session.execution.succeeded", "session.execution.failed", "session.execution.interrupted"];
var tui_default = Plugin.define({
  id: "opencode-git-history",
  setup(context) {
    const directory = (context.location ?? context.data.location.default()).directory;
    const reader = createSnapshotReader(directory, createGitProcessRunner(directory));
    const [snapshot, setSnapshot] = createSignal(null);
    const refresh = async () => {
      setSnapshot(await reader.read());
    };
    const scheduleRefresh = createDebouncedAction(refresh, REFRESH_DEBOUNCE_MS);
    refresh();
    const stopEvents = REFRESH_EVENT_TYPES.map((type) => context.data.on(type, scheduleRefresh));
    const fullPoll = setInterval(scheduleRefresh, FULL_REFRESH_MS);
    const statusPoll = createLightPoll({
      intervalMs: STATUS_POLL_MS,
      read: createStatusReader(directory, createGitProcessRunner(directory)).read,
      isEqual: (a, b) => a.branch === b.branch && a.dirty === b.dirty,
      onChange: () => void refresh()
    });
    statusPoll.start();
    context.keymap.layer(() => ({
      mode: "global",
      commands: [{
        id: "opencode-git-history.refresh",
        title: "Refresh git history sidebar",
        group: PLUGIN_COMMAND_GROUP,
        palette: true,
        run: () => void refresh()
      }]
    }));
    const unregisterSlot = context.ui.slot({
      append: "sidebar.content",
      render: () => _$createComponent2(GitSidebar, {
        get snapshot() {
          return snapshot();
        },
        get timeZone() {
          return configuredTimeZone(context.options);
        }
      })
    });
    return () => {
      unregisterSlot();
      stopEvents.forEach((stop) => stop());
      clearInterval(fullPoll);
      statusPoll.dispose();
      scheduleRefresh.dispose();
    };
  }
});
export {
  tui_default as default
};
