import { describe, expect, it } from "vitest";
import { ICON_FONTS, iconCodepoint, searchIcons } from "./icon-catalog";
import { createComponent, withField } from "./component-model";

describe("Google Fonts icon coverage", () => {
  it.each(ICON_FONTS)("indexes all names in $value without limiting to presets", (font) => {
    const catalog = searchIcons(font.value);
    const sourceEntries = new Map(font.source.trim().split(/\r?\n/).map((line) => {
      const [name, hex] = line.split(/\s+/);
      return [name, Number.parseInt(hex, 16)] as const;
    }));
    expect(catalog.length).toBe(sourceEntries.size);
    expect(catalog.length).toBeGreaterThan(2000);
    for (const [name, codepoint] of sourceEntries) {
      expect(iconCodepoint(font.value, name)).toBe(codepoint);
    }
    expect(iconCodepoint(font.value, "home")).toBeDefined();
    expect(iconCodepoint(font.value, "search")).toBeDefined();
  });
  it("searches beyond the original three icons with multiple terms", () => {
    const matches = searchIcons("symbols-outlined", "rocket launch");
    expect(matches.map((icon) => icon.name)).toContain("rocket_launch");
    expect(searchIcons("symbols-outlined", "not_a_real_icon")).toEqual([]);
    expect(iconCodepoint("symbols-outlined", "arrow-right")).toBe(iconCodepoint("symbols-outlined", "arrow_forward"));
  });
  it("edits arbitrary catalog symbols and custom image sources without losing descriptions", () => {
    const original = createComponent("icon", 1);
    const next = withField(withField(original, "symbol", "rocket_launch"), "source", "/my-icon.svg");
    expect(next).toMatchObject({ fields: {
      symbol: { ...original.fields.symbol, value: "rocket_launch" },
      source: { ...original.fields.source, value: "/my-icon.svg" },
    } });
    expect(original.fields.source.value).toBe("");
    expect(original.fields.symbol.value).toBe("info");
  });
  it("accepts all eight fonts and rejects unsupported fonts and fills", () => {
    const icon = createComponent("icon", 1);
    for (const font of ICON_FONTS) expect(withField(icon, "font", font.value)).toMatchObject({ fields: { font: { value: font.value } } });
    expect(withField(icon, "font", "missing")).toBe(icon);
    expect(withField(icon, "fill", "2")).toBe(icon);
    expect(withField(icon, "fill", "1")).toMatchObject({ fields: { fill: { value: "1" } } });
  });
});
