import { describe, expect, it } from "vitest";
import { COLOR_PRESETS, THEME_COLORS, colorCss, colorHex, colorFromHex, isColor } from "./colors";
import { createComponent, createPage, resetColorField, withField, withSlot, childrenOf } from "./component-model";

describe("RGB and alpha colors", () => {
  it("provides 12 hues plus white, black and gray without replacing alpha", () => {
    expect(COLOR_PRESETS).toHaveLength(15);
    expect(new Set(COLOR_PRESETS.map((preset) => preset.hex)).size).toBe(15);
    for (const preset of COLOR_PRESETS) {
      const color = colorFromHex(preset.hex, .35);
      expect(colorHex(color)).toBe(preset.hex);
      expect(color.a).toBe(.35);
    }
  });
  it("renders full precision alpha and handles transparent black", () => {
    expect(colorCss({ r: 1, g: 20, b: 255, a: .125 })).toBe("rgba(1, 20, 255, 0.125)");
    expect(colorHex({ r: 0, g: 0, b: 0, a: 0 })).toBe("#000000");
    expect(isColor({ r: 0, g: 0, b: 0, a: 0 })).toBe(true);
  });
  it.each([null, {}, { r: 256, g: 0, b: 0, a: 1 }, { r: 1.5, g: 0, b: 0, a: 1 }, { r: 0, g: 0, b: 0, a: 1.01 }, { r: 0, g: 0, b: 0, a: -1 }])("rejects malformed colors %j without changing a component", (value) => {
    const text = createComponent("text", 1);
    expect(isColor(value)).toBe(false);
    expect(withField(text, "color", JSON.stringify(value))).toBe(text);
  });
  it("defaults to theme colors and preserves source values when editing", () => {
    const text = createComponent("text", 1), button = createComponent("button", 2);
    expect(text.fields.color.value).toEqual(THEME_COLORS.text);
    expect(button.fields.background.value).toEqual(THEME_COLORS.accent);
    expect(button.fields.color.value).toEqual(THEME_COLORS.background);
    expect(createPage(1).fields.background.value).toEqual(THEME_COLORS.canvas);
    const color = { r: 12, g: 34, b: 56, a: .4 };
    expect(withField(text, "color", JSON.stringify(color))).toMatchObject({ fields: { color: { ...text.fields.color, value: color, localValue: color } } });
    expect(text.fields.color.value).toEqual(THEME_COLORS.text);
  });
  it("applies a parent foreground to nested contents without changing order or the original tree", () => {
    const button = createComponent("button", 2);
    const container = withSlot(createComponent("container", 1), "children", [button]);
    const color = { r: 12, g: 34, b: 56, a: .6 };
    const next = withField(container, "color", JSON.stringify(color));
    const nested = childrenOf(next)[0];
    expect(nested.id).toBe(button.id);
    expect(nested.fields.color.value).toEqual(color);
    expect(childrenOf(nested)[0].fields.color.value).toEqual(color);
    expect(childrenOf(nested).map((node) => node.id)).toEqual(childrenOf(button).map((node) => node.id));
    expect(button.fields.color.value).toEqual(THEME_COLORS.background);
  });
  it("restores a child's own color after repeated parent edits without changing siblings", () => {
    const own = { r: 0, g: 0, b: 255, a: .35 };
    const original = createComponent("text", 2);
    const child = withField(original, "color", JSON.stringify(own)) as typeof original;
    const sibling = createComponent("icon", 3);
    const parent = withSlot(createComponent("container", 1), "children", [child, sibling]);
    const red = { r: 255, g: 0, b: 0, a: 1 }, green = { r: 0, g: 255, b: 0, a: .5 };
    const next = withField(withField(parent, "color", JSON.stringify(red)), "color", JSON.stringify(green));
    const [inherited, other] = childrenOf(next);
    expect(inherited.fields.color.inherited).toBe(true);
    expect(inherited.fields.color.localValue).toEqual(own);
    const restored = resetColorField(inherited, "color");
    expect(restored.fields.color.value).toEqual(own);
    expect(restored.fields.color.inherited).toBe(false);
    expect(restored.fields.background).toBe(inherited.fields.background);
    expect(other.fields.color.value).toEqual(green);
    expect(next.fields.color.value).toEqual(green);
    expect(child.fields.color.value).toEqual(own);
  });
  it("resets explicit foreground and background to their original theme values", () => {
    const button = createComponent("button", 1);
    const custom = { r: 1, g: 2, b: 3, a: .4 };
    const next = withField(withField(button, "color", JSON.stringify(custom)), "background", JSON.stringify(custom));
    const colorReset = resetColorField(next, "color");
    expect(colorReset.fields.color.value).toEqual(THEME_COLORS.background);
    expect(childrenOf(colorReset)[0].fields.color.value).toEqual(THEME_COLORS.background);
    expect(colorReset.fields.background.value).toEqual(custom);
    expect(resetColorField(next, "background").fields.background.value).toEqual(THEME_COLORS.accent);
    expect(resetColorField(next, "name")).toBe(next);
    expect(button.fields.background.value).toEqual(THEME_COLORS.accent);
  });
});
