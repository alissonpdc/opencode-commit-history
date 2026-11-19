import { describe, expect, it } from "vitest";
import { chevronGlyph } from "../src/ui/chevron";

describe("chevronGlyph", () => {
  it("points down when the commit list is expanded", () => {
    expect(chevronGlyph(true)).toBe("▾");
  });

  it("points right when the commit list is collapsed", () => {
    expect(chevronGlyph(false)).toBe("▸");
  });
});
