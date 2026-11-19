import { RGBA } from "@opentui/core";

/** Sidebar palette: fixed hues so the plugin looks the same on every theme. */
export const SIDEBAR_COLORS = {
  /** Accent for branch name and commit hashes. */
  accent: RGBA.fromHex("#FFA500"),
  /** Branch name while the working tree has uncommitted changes. */
  pending: RGBA.fromHex("#E5484D"),
  /** Branch name while the working tree is clean. */
  synced: RGBA.fromHex("#3FB950"),
} as const;
