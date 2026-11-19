import solidPlugin from "@opentui/solid/bun-plugin";

// Prebuilds the TUI part to plain JS so the plugin loader never transpiles
// TSX itself (git/npm installs otherwise fall back to React JSX and fail).
// Runtime dependencies stay external: OpenCode resolves @opencode/plugin/tui
// itself and the installed peers provide the rest.
await Bun.build({
  entrypoints: ["./src/tui.tsx"],
  target: "bun",
  outdir: "./dist",
  naming: "[dir]/[name].[ext]",
  plugins: [solidPlugin],
  external: ["@opencode/plugin", "@opentui/core", "@opentui/solid", "solid-js"],
});
