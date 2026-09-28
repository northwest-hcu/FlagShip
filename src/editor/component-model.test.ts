import { describe, expect, it } from "vitest";
import { COMPONENT_CATALOG, childrenOf, componentFields, createComponent, createPage, inputHtmlType, isSlot, layoutContainer, slotsOf, typeName, withField, withSlot, type TextType, type ImageType, type WidgetNode } from "./component-model";
import { THEME_COLORS } from "./colors";
import { findComponent, replaceComponent } from "./scene";

describe("component families and fields", () => {
  it("labels fields explicitly and lists component slots separately", () => {
    const types = (node: Parameters<typeof componentFields>[0]) => Object.fromEntries(componentFields(node).map((entry) => [entry.key, entry.type]));
    expect(types(createComponent("button", 1))).toMatchObject({ name: "String", color: "Color", background: "Color", width: "Number", height: "Number", borderRadius: "Number" });
    expect(types(createComponent("text", 1))).toEqual({ name: "String", color: "Color", background: "Color", value: "String", font: "Enum", fontSize: "Number", fontWeight: "Enum", lineHeight: "Number", letterSpacing: "Number" });
    expect(types(createComponent("icon", 1))).toMatchObject({ source: "String", alt: "String", symbol: "Enum", font: "Enum", fill: "Enum" });
    expect(types(createComponent("container", 1))).toMatchObject({ direction: "Enum", padding: "Number", margin: "Number" });
    expect(types(createComponent("textbox", 1))).toMatchObject({ value: "String", passwordMask: "Boolean" });
    expect(types(createPage(1))).toEqual({ name: "String", color: "Color", background: "Color", path: "String" });
    for (const node of [...COMPONENT_CATALOG.map((item) => createComponent(item.kind, 1)), createPage(1)]) {
      const fields = componentFields(node);
      expect(fields.every((entry) => !isSlot(entry.field))).toBe(true);
      for (const [key] of slotsOf(node)) expect(fields.some((entry) => entry.key === key)).toBe(false);
    }
    expect(createComponent("button", 1).fields.contents.type).toBe("(Text Component | Image Component)[]");
    expect(typeName(createComponent("text", 1))).toBe("Text Component");
    expect(typeName(createComponent("icon", 1))).toBe("Icon Component");
  });
  it("gives all fields descriptors and every Enum its own options", () => {
    for (const node of [...COMPONENT_CATALOG.map((item) => createComponent(item.kind, 1)), createPage(1)]) {
      for (const entry of componentFields(node)) {
        expect(entry.field.name.length).toBeGreaterThan(0);
        expect(entry.field.description.length).toBeGreaterThan(0);
        expect(entry.field).toHaveProperty("value");
        if (entry.type === "Enum") expect(entry.field.options?.some((option) => option.value === entry.field.value)).toBe(true);
      }
    }
  });
  it("accepts Text and both Image variants in button contents while rejecting other families", () => {
    const button = createComponent("button", 1);
    expect("coreType" in button).toBe(false);
    const text = createComponent("text", 2), image = createComponent("image", 3), icon = createComponent("icon", 4);
    const images: ImageType[] = [image, icon];
    expect(images.every((node) => node.coreType === "image")).toBe(true);
    const next = withSlot(button, "contents", [text, image, icon]);
    expect(childrenOf(next)).toEqual([text, image, icon]);
    for (const kind of ["container", "textbox", "textarea", "select", "calendar", "paragraph", "video", "shape"] as const) {
      expect(withSlot(button, "contents", [createComponent(kind, 5)])).toBe(button);
    }
    expect(withSlot(button, "contents", text)).toBe(button);
  });
  it("keeps contents and initial colors independent between instances", () => {
    const first = createComponent("button", 1), second = createComponent("button", 2);
    const firstText = first.fields.contents.value[0] as TextType;
    firstText.fields.value.value = "保存";
    first.fields.background.value.r = 0;
    expect((second.fields.contents.value[0] as TextType).fields.value.value).toBe("ボタン");
    expect(second.fields.background.value).toEqual(THEME_COLORS.accent);
    expect(firstText.id).not.toBe(second.fields.contents.value[0].id);
  });
  it("keeps nested fields, siblings and slot metadata when editing", () => {
    const icon = createComponent("icon", 3);
    const button = withSlot(createComponent("button", 2), "contents", [createComponent("text", 1), icon]) as WidgetNode;
    const text = childrenOf(button)[0] as TextType;
    const next = replaceComponent([button], withField(text, "value", "変更") as WidgetNode);
    expect(findComponent(next, text.id)).toMatchObject({ fields: { value: { value: "変更" } } });
    expect(findComponent(next, icon.id)).toBe(icon);
    expect(text.fields.value.value).toBe("テキスト");
    expect(slotsOf(next[0]).find(([key]) => key === "contents")?.[1].description).toBe(slotsOf(button).find(([key]) => key === "contents")?.[1].description);
  });
  it("keeps an empty array slot and rejects scalar and non-slot writes", () => {
    const button = createComponent("button", 1);
    const next = withSlot(button, "contents", []);
    expect(childrenOf(next)).toEqual([]);
    expect(isSlot(slotsOf(next).find(([key]) => key === "contents")![1])).toBe(true);
    expect(withField(button, "contents", "x")).toBe(button);
    expect(withSlot(button, "name", [])).toBe(button);
  });
  it("models Paragraph and Span as rules around the same Text core", () => {
    for (const kind of ["paragraph", "span"] as const) {
      const node = createComponent(kind, 1);
      expect("coreType" in node).toBe(false);
      expect(node.fields.text.value?.coreType).toBe("text");
      expect(withSlot(node, "text", createComponent("image", 2))).toBe(node);
    }
  });
  it("shares the Input contract among concrete components that own their values", () => {
    const box = createComponent("textbox", 1);
    const values = { textbox: "保持する値", textarea: "保持する値\n2行目", select: "second", number: "12.5", calendar: "2026-09-29", email: "test@example.com", url: "https://example.com", tel: "090-1234-5678" } as const;
    for (const kind of Object.keys(values) as (keyof typeof values)[]) {
      const node = createComponent(kind, 2);
      expect(node.coreType).toBe("input");
      const value = values[kind];
      expect(withField(node, "value", value)).toMatchObject({ fields: { value: { value } } });
      expect(withSlot(box, "label", node)).toBe(box);
    }
    expect(COMPONENT_CATALOG.some((item) => String(item.kind) === "input")).toBe(false);
    expect(box.fields).not.toHaveProperty("input");
    expect(childrenOf(box).map((node) => node.kind)).toEqual(["text"]);
    expect(withField(createComponent("select", 1), "value", "unknown")).toEqual(createComponent("select", 1));
  });
  it("masks Text Box presentation without changing its value or label", () => {
    const original = createComponent("textbox", 1);
    const box = withField(original, "value", "secret") as typeof original;
    const masked = withField(box, "passwordMask", "true") as typeof box;
    expect(inputHtmlType(box)).toBe("text");
    expect(inputHtmlType(masked)).toBe("password");
    expect(masked.fields.value.value).toBe("secret");
    expect(masked.fields.label).toBe(box.fields.label);
    expect(inputHtmlType(withField(masked, "passwordMask", "false") as typeof box)).toBe("text");
    expect(withField(box, "passwordMask", "yes")).toBe(box);
  });
  it.each(["テキスト", "2026-02-30", "2026-02-29", "2026-13-01", "0000-01-01"])("rejects invalid Calendar values %s", (value) => {
    const calendar = createComponent("calendar", 1);
    expect(withField(calendar, "value", value)).toBe(calendar);
  });
  it("retains valid Calendar dates and supports clearing without Text children", () => {
    const calendar = createComponent("calendar", 1);
    const next = withField(calendar, "value", "2024-02-29");
    expect(next).toMatchObject({ fields: { value: { value: "2024-02-29" } } });
    expect(withField(next, "value", "")).toMatchObject({ fields: { value: { value: "" } } });
    expect(childrenOf(calendar)).toEqual([]);
    expect(inputHtmlType(calendar)).toBe("date");
  });
  it("owns symbol/font arrays and validates enum choices when changing font", () => {
    const icon = createComponent("icon", 1);
    expect(icon.fields.symbol.options).toHaveLength(4299);
    expect(icon.fields.font.options).toHaveLength(8);
    expect(withField(icon, "symbol", "missing")).toBe(icon);
    expect(withField(icon, "font", "missing")).toBe(icon);
    const next = withField(icon, "font", "icons-filled") as typeof icon;
    expect(next.fields.symbol.options?.some((option) => option.value === next.fields.symbol.value)).toBe(true);
    expect(next.fields.symbol.options).not.toBe(icon.fields.symbol.options);
    expect(icon.fields.font.value).toBe("symbols-outlined");
  });
  it("represents pages as Components with path and two slots", () => {
    const page = createPage(1);
    expect(page.fields.path.value).toBe("/");
    expect(withField(page, "path", "/about")).toMatchObject({ fields: { path: { ...page.fields.path, value: "/about" } } });
    expect(page.fields.context.value).toEqual([]);
    expect(createPage(2).fields.path.value).toBe("/page-2");
  });
  it("uses Shape for separators and keeps Audio out of the catalog", () => {
    expect(createComponent("shape", 1).fields.shape.value).toBe("line");
    expect(COMPONENT_CATALOG.some((item) => ["audio", "divider"].includes(item.kind))).toBe(false);
  });
});

describe("Container layout fields", () => {
  it("defaults padding and margin to 10px and stores zero and fractional pixels", () => {
    const original = createComponent("container", 1);
    expect(original.fields.padding.value).toBe(10);
    expect(original.fields.margin.value).toBe(10);
    const next = withField(withField(original, "padding", "0"), "margin", "12.5");
    expect(next).toMatchObject({ fields: {
      padding: { ...original.fields.padding, value: 0 },
      margin: { ...original.fields.margin, value: 12.5 },
    } });
    expect(original.fields.padding.value).toBe(10);
  });
  it.each(["-1", "NaN", "Infinity", "", "10px"])("rejects invalid pixel values %s", (value) => {
    const node = createComponent("container", 1);
    expect(withField(node, "padding", value)).toBe(node);
    expect(withField(node, "margin", value)).toBe(node);
  });
  it("makes explicit direction override automatic groups while keeping real nested Containers", () => {
    const first = createComponent("button", 2);
    const second = createComponent("icon", 3);
    const nested = createComponent("container", 4);
    const layout = layoutContainer("vertical", [first, layoutContainer("horizontal", [second, nested])]);
    const original = withSlot(createComponent("container", 1), "children", [layout]);
    const next = withField(original, "direction", "horizontal");
    expect(childrenOf(next)).toEqual([first, second, nested]);
    expect(childrenOf(original)).toEqual([layout]);
    expect(next).toMatchObject({ fields: { direction: { value: "horizontal" }, padding: { value: 10 }, margin: { value: 10 } } });
  });
});
