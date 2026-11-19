/** Chevron shown before the branch name: down when expanded, right when collapsed. */
export function chevronGlyph(expanded: boolean): string {
  return expanded ? "▾" : "▸";
}
