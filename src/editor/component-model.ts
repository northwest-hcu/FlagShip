import { THEME_COLORS, isColor, type ColorValue } from "./colors";
import { ICON_FONTS, iconCodepoint, isIconFont, normalizeIconName, searchIcons, type IconFontId } from "./icon-catalog";

export const COMPONENT_CATALOG = [
  { kind: "button", title: "Button Component", label: "ボタン", coreType: null },
  { kind: "container", title: "Container Component", label: "コンテナ", coreType: "container" },
  { kind: "textbox", title: "Text Box Component", label: "テキストボックス", coreType: "input" },
  { kind: "image", title: "Image Component", label: "画像", coreType: "image" },
  { kind: "icon", title: "Icon Component", label: "アイコン", coreType: "image" },
  { kind: "text", title: "Text Component", label: "テキスト", coreType: "text" },
  { kind: "video", title: "Video Component", label: "動画", coreType: "video" },
  { kind: "textarea", title: "Textarea Component", label: "複数行入力", coreType: "input" },
  { kind: "select", title: "Select Component", label: "選択入力", coreType: "input" },
  { kind: "number", title: "Number Input Component", label: "数値入力", coreType: "input" },
  { kind: "calendar", title: "Calendar Component", label: "カレンダー", coreType: "input" },
  { kind: "email", title: "Email Input Component", label: "メール入力", coreType: "input" },
  { kind: "url", title: "URL Input Component", label: "URL入力", coreType: "input" },
  { kind: "tel", title: "Telephone Input Component", label: "電話番号入力", coreType: "input" },
  { kind: "paragraph", title: "Paragraph Component", label: "段落", coreType: null },
  { kind: "span", title: "Span Component", label: "インラインテキスト", coreType: null },
  { kind: "shape", title: "Shape Component", label: "図形", coreType: "shape" },
] as const;

export type ComponentKind = (typeof COMPONENT_CATALOG)[number]["kind"];
export type CoreType = NonNullable<(typeof COMPONENT_CATALOG)[number]["coreType"]>;
export type Axis = "vertical" | "horizontal";
export type IconSymbol = string;
export type PageSlot = "context" | "overlay";
export interface EnumOption { value: string; label: string }
export type FieldType = "Color" | "String" | "Enum" | "Number" | "Boolean" | "Component" | "Component[]" | "Text Component" | "Image Component" | "Input Component" | "(Text Component | Image Component)[]";
export interface Field<T> {
  name: string; description: string; value: T; type: FieldType;
  options?: readonly EnumOption[];
  editor?: "multiline" | "icon-picker" | "date" | "number" | "email" | "url" | "tel";
  min?: number; step?: number; unit?: string;
  enabledWhen?: { field: string; prefix: string };
}
export type SlotConstraint = "component" | CoreType | readonly CoreType[];
export interface SlotField<T> extends Field<T> { kind: "slot"; accepts: SlotConstraint; multiple: boolean }
export interface ComponentType {
  type: "component"; id: string; kind: ComponentKind | "page"; fields: { name: Field<string> };
}
export interface ColorField extends Field<ColorValue> {
  defaultValue: ColorValue; localValue: ColorValue; inherited: boolean;
}
type Named = { name: Field<string>; color: ColorField; background: ColorField };
export interface TextType extends ComponentType {
  kind: "text"; coreType: "text";
  fields: Named & { value: Field<string>; font: Field<TextFontId>; fontSize: Field<number>; fontWeight: Field<"400" | "700">; lineHeight: Field<number>; letterSpacing: Field<number> };
}
export const TEXT_FONTS = [
  { value: "share-tech-mono", label: "Share Tech Mono", family: '"Share Tech Mono", monospace' },
  { value: "monospace", label: "Monospace", family: "monospace" },
  { value: "sans-serif", label: "Sans Serif", family: "sans-serif" },
  { value: "serif", label: "Serif", family: "serif" },
] as const;
export type TextFontId = (typeof TEXT_FONTS)[number]["value"];
/** Icon inherits the image contract and constrains its rendering to an icon-sized surface. */
export interface ImageType extends ComponentType {
  kind: "image" | "icon"; coreType: "image"; fields: Named & { source: Field<string>; alt: Field<string> };
}
export interface PlainImageType extends ImageType { kind: "image" }
export interface IconType extends ImageType {
  kind: "icon";
  fields: ImageType["fields"] & { symbol: Field<IconSymbol>; font: Field<IconFontId>; fill: Field<"0" | "1"> };
}
/** Input is a shared contract; only concrete variants can be placed in the editor. */
export interface InputType extends ComponentType {
  kind: "textbox" | "textarea" | "select" | SpecializedInputKind; coreType: "input";
  fields: Named & { value: Field<string>; alt: Field<string> };
}
export interface TextBoxComponent extends InputType {
  kind: "textbox";
  fields: InputType["fields"] & { label: SlotField<TextType | null>; passwordMask: Field<boolean>; placeholder: Field<string> };
}
export interface TextareaType extends InputType {
  kind: "textarea"; fields: InputType["fields"] & { placeholder: Field<string>; rows: Field<number> };
}
export interface SelectType extends InputType { kind: "select" }
export type SpecializedInputKind = "number" | "calendar" | "email" | "url" | "tel";
export type SpecializedInputType = {
  [K in SpecializedInputKind]: InputType & { kind: K; fields: InputType["fields"] & { placeholder: Field<string> } }
}[SpecializedInputKind];
export type InputNode = TextBoxComponent | TextareaType | SelectType | SpecializedInputType;
export const INPUT_HTML_TYPES = { textbox: "text", number: "number", calendar: "date", email: "email", url: "url", tel: "tel" } as const;
export function inputHtmlType(node: Exclude<InputNode, TextareaType | SelectType>): string {
  return node.kind === "textbox" && node.fields.passwordMask.value ? "password" : INPUT_HTML_TYPES[node.kind];
}
export interface VideoType extends ComponentType {
  kind: "video"; coreType: "video";
  fields: Named & { source: Field<string>; poster: Field<string>; label: Field<string>; captions: Field<string> };
}
export interface ShapeType extends ComponentType {
  kind: "shape"; coreType: "shape";
  fields: Named & { shape: Field<"line" | "rectangle" | "ellipse">; direction: Field<Axis>; width: Field<number>; height: Field<number>; strokeWidth: Field<number>; label: Field<string> };
}
export interface ContainerType extends ComponentType {
  kind: "container"; coreType: "container";
  fields: Named & { direction: Field<Axis>; padding: Field<number>; margin: Field<number>; children: SlotField<WidgetNode[]> };
  layoutOnly?: boolean;
}
export type ButtonContent = TextType | PlainImageType | IconType;
export interface ButtonComponent extends ComponentType {
  kind: "button";
  fields: Named & { contents: SlotField<ButtonContent[]>; width: Field<number>; height: Field<number>; paddingHorizontal: Field<number>; paddingVertical: Field<number>; borderRadius: Field<number> };
}
export type DecoratedTextComponent = {
  [K in "paragraph" | "span"]: ComponentType & { kind: K; fields: Named & { text: SlotField<TextType | null> } }
}["paragraph" | "span"];
export type CompositeComponent = ButtonComponent | DecoratedTextComponent;
export type WidgetNode = TextType | PlainImageType | IconType | InputNode | ShapeType | VideoType | ContainerType | CompositeComponent;
export interface PageComponent extends ComponentType {
  kind: "page"; fields: Named & { path: Field<string>; context: SlotField<WidgetNode[]>; overlay: SlotField<WidgetNode[]> };
}
export type ComponentNode = WidgetNode | PageComponent;
export type SceneNode = WidgetNode;
export type Pages = PageComponent[];
export type AnySlot = SlotField<WidgetNode | WidgetNode[] | null>;
export type FieldValue = string | number | boolean | ColorValue | WidgetNode | WidgetNode[] | null;
export interface FieldEntry { key: string; field: Field<FieldValue>; type: FieldType }

export const field = <T>(name: string, description: string, value: T, metadata: Partial<Omit<Field<T>, "name" | "description" | "value">> = {}): Field<T> =>
  ({ name, description, value, type: typeof value === "number" ? "Number" : typeof value === "boolean" ? "Boolean" : "String", ...metadata });
export const enumField = <T extends string>(name: string, description: string, value: T, options: readonly EnumOption[], metadata: Partial<Field<T>> = {}): Field<T> =>
  field(name, description, value, { ...metadata, type: "Enum", options });
function textStyleFields() {
  return {
    font: enumField<TextFontId>("Font", "文字の書体です。Share Tech Monoは同梱のOFLフォント、その他はブラウザの標準書体を使います。", "share-tech-mono", TEXT_FONTS),
    fontSize: field("Font Size", "文字の大きさをpxで指定します。", 16, { min: 1, step: .1, unit: "px" }),
    fontWeight: enumField<"400" | "700">("Font Weight", "文字の太さです。", "400", [{ value: "400", label: "Regular" }, { value: "700", label: "Bold" }]),
    lineHeight: field("Line Height", "文字サイズに対する行の高さの倍率です。", 1.5, { min: .1, step: .1 }),
    letterSpacing: field("Letter Spacing", "文字と文字の間隔をpxで指定します。負の値にも対応します。", 0, { step: .1, unit: "px" }),
  };
}
export function colorFields(color: ColorValue = THEME_COLORS.text, background: ColorValue = THEME_COLORS.transparent) {
  const makeColor = (name: string, description: string, value: ColorValue): ColorField => ({
    ...field(name, description, { ...value }, { type: "Color" }),
    defaultValue: { ...value }, localValue: { ...value }, inherited: false,
  });
  return { color: makeColor("Color", "文字・図柄の色です。15色から選ぶか、カスタムでRGBと透明度Aを編集します。", color),
    background: makeColor("Background", "背景色です。15色から選ぶか、カスタムでRGBと透明度Aを編集します。", background) };
}
const directionOptions: readonly EnumOption[] = [{ value: "vertical", label: "縦並び" }, { value: "horizontal", label: "横並び" }];
const fontOptions = ICON_FONTS.map(({ value, label }) => ({ value, label }));
const symbolOptions = new Map<IconFontId, readonly EnumOption[]>();
function symbols(font: IconFontId): readonly EnumOption[] {
  if (!symbolOptions.has(font)) symbolOptions.set(font, searchIcons(font).map(({ name }) => ({ value: name, label: name })));
  return symbolOptions.get(font)!;
}
export const slot = <T>(name: string, description: string, value: T, accepts: SlotConstraint = "component", multiple = true): SlotField<T> => {
  const names = (Array.isArray(accepts) ? accepts : [accepts]).map((type) => type === "component" ? "Component" : type[0].toUpperCase() + type.slice(1) + " Component");
  const base = names.length > 1 ? "(" + names.join(" | ") + ")" : names[0];
  return { name, description, value, type: (base + (multiple ? "[]" : "")) as FieldType, kind: "slot", accepts, multiple };
};
export function displayName(node: ComponentNode): string { return node.fields.name.value; }
export function typeName(node: ComponentNode): string {
  return "coreType" in node ? COMPONENT_CATALOG.find((item) => item.kind === node.kind)!.title : "Component";
}
export function slotTypeLabel(slot: AnySlot): string { return slot.type.replaceAll("Component", "Com"); }
export function isSlot(value: Field<unknown>): value is AnySlot { return "kind" in value && value.kind === "slot"; }
export function slotsOf(node: ComponentNode): [string, AnySlot][] {
  return Object.entries(node.fields).filter((entry): entry is [string, AnySlot] => isSlot(entry[1]));
}
export function slotNodes(value: AnySlot): WidgetNode[] { return Array.isArray(value.value) ? value.value : value.value ? [value.value] : []; }
export function childrenOf(node: ComponentNode): WidgetNode[] { return slotsOf(node).flatMap(([, value]) => slotNodes(value)); }
export function isLayout(node: ComponentNode): node is ContainerType & { layoutOnly: true } { return node.kind === "container" && node.layoutOnly === true; }
export function acceptsKind(target: AnySlot, kind: ComponentKind): boolean {
  if (target.accepts === "component") return true;
  const core = COMPONENT_CATALOG.find((item) => item.kind === kind)!.coreType;
  return core !== null && (Array.isArray(target.accepts) ? target.accepts.includes(core) : target.accepts === core);
}
export function acceptsWidget(target: AnySlot, node: WidgetNode): boolean { return acceptsKind(target, node.kind); }
export function withSlot(node: ComponentNode, key: string, value: WidgetNode | WidgetNode[] | null): ComponentNode {
  const target = slotsOf(node).find(([name]) => name === key)?.[1];
  if (!target || Array.isArray(value) !== target.multiple) return node;
  const nodes = Array.isArray(value) ? value : value ? [value] : [];
  if (!nodes.every((child) => acceptsWidget(target, child))) return node;
  return { ...node, fields: { ...node.fields, [key]: { ...target, value } } } as ComponentNode;
}
export function createComponent<K extends ComponentKind>(kind: K, sequence: number): Extract<WidgetNode, { kind: K }>;
export function createComponent(kind: ComponentKind, sequence: number): WidgetNode {
  const definition = COMPONENT_CATALOG.find((item) => item.kind === kind)!;
  const id = kind + "-" + sequence;
  const named = { name: field("Name", "Treeに表示するコンポーネントの名前です。", definition.title + " " + String(sequence).padStart(2, "0")),
    ...colorFields(kind === "button" ? THEME_COLORS.background : THEME_COLORS.text,
      kind === "button" ? THEME_COLORS.accent : definition.coreType === "input" ? THEME_COLORS.panel : THEME_COLORS.transparent) };
  const base = { type: "component" as const, id };
  const text = (key: string, value: string): TextType => ({
    type: "component", id: id + ":" + key, kind: "text", coreType: "text",
    fields: { name: field("Name", "Treeに表示する名前です。", key === "label" ? "Label Text Component" : "Text Component"), ...colorFields(kind === "button" ? THEME_COLORS.background : THEME_COLORS.text), value: field("Text", "表示するテキストの内容です。", value, { editor: "multiline" }), ...textStyleFields() },
  });
  const inputFields = { ...named, value: field("Value", "入力または選択した値を保持します。", ""), alt: field("Alt", "入力欄の意味を説明する名前です。", definition.label) };
  switch (kind) {
    case "button": return { ...base, kind, fields: { ...named,
      contents: slot("Contents", "順番に描画するText・Imageの配列です。IconもImageとして配置できます。", [text("text", "ボタン")], ["text", "image"]),
      width: field("Width", "ボタンの幅をpxで指定します。0なら内容にフィットします。", 0, { min: 0, step: .1, unit: "px" }),
      height: field("Height", "ボタンの高さをpxで指定します。0なら内容にフィットします。", 0, { min: 0, step: .1, unit: "px" }),
      paddingHorizontal: field("Horizontal Padding", "ボタンの左右の内側余白をpxで指定します。", 24, { min: 0, step: .1, unit: "px" }),
      paddingVertical: field("Vertical Padding", "ボタンの上下の内側余白をpxで指定します。", 12, { min: 0, step: .1, unit: "px" }),
      borderRadius: field("Border Radius", "ボタンの角丸をpxで指定します。0なら直角です。", 8, { min: 0, step: .1, unit: "px" }),
    } };
    case "textbox": return { ...base, kind, coreType: "input", fields: { ...inputFields,
        passwordMask: field("Password Mask", "入力値をパスワードとしてマスク表示するかを指定します。値はそのまま保持します。", false),
        placeholder: field("Placeholder", "未入力時に表示するヒントです。", ""),
        label: slot("Label", "入力欄のラベルを描画するTextコンポーネントです。", text("label", "テキストボックス"), "text", false),
      } };
    case "paragraph":
    case "span": return { ...base, kind, fields: { ...named,
      text: slot("Text", "装飾ルールを適用するTextコンポーネントです。", text("text", "テキスト"), "text", false),
    } };
    case "container": return { ...base, kind, coreType: kind, fields: { ...named,
      direction: enumField("Direction", "子コンポーネントを縦または横に並べます。", "vertical", directionOptions),
      padding: field("Padding", "内容とコンテナの内側の余白です。0以上のpxで指定します。", 10, { min: 0, step: .1, unit: "px" }),
      margin: field("Margin", "コンテナの外側の余白です。0以上のpxで指定します。", 10, { min: 0, step: .1, unit: "px" }),
      children: slot("Children", "このコンテナに配置するComponentの配列です。", []),
    } };
    case "text": return { ...base, kind, coreType: kind, fields: { ...named, value: field("Text", "表示するテキストの内容です。", "テキスト", { editor: "multiline" }), ...textStyleFields() } };
    case "icon": return { ...base, kind, coreType: "image", fields: { ...named,
      source: field("Source", "任意の画像URLです。空欄ならSymbolとFontで指定した図柄を表示します。", ""),
      alt: field("Alt", "アイコンの意味を説明する代替テキストです。", "情報"),
      symbol: enumField("Symbol", "この書体が持つSymbol配列から図柄を選びます。", "info", symbols("symbols-outlined"), { editor: "icon-picker" }),
      font: enumField("Font", "使用する書体をFont配列から選びます。", "symbols-outlined", fontOptions),
      fill: enumField("Fill", "Material Symbolsの輪郭または塗りつぶしを選びます。", "0", [{ value: "0", label: "輪郭" }, { value: "1", label: "塗りつぶし" }], { enabledWhen: { field: "font", prefix: "symbols-" } }),
    } };
    case "image": return { ...base, kind, coreType: kind, fields: { ...named,
      source: field("Source", "画像ファイルのURLです。", "/images/sample-landscape.svg"),
      alt: field("Alt", "画像の内容を説明する代替テキストです。", "山と太陽を描いたサンプル画像"),
    } };
    case "textarea": return { ...base, kind, coreType: "input", fields: { ...inputFields,
      value: field("Value", "入力した複数行の値を保持します。", "", { editor: "multiline" }),
      placeholder: field("Placeholder", "未入力時に表示するヒントです。", ""),
      rows: field("Rows", "入力欄の表示行数です。", 4, { min: 1, step: 1 }),
    } };
    case "select": return { ...base, kind, coreType: "input", fields: { ...inputFields,
      value: enumField("Value", "選択した値を保持します。", "first", [{ value: "first", label: "選択肢1" }, { value: "second", label: "選択肢2" }]),
    } };
    case "number":
    case "calendar":
    case "email":
    case "url":
    case "tel": return { ...base, kind, coreType: "input", fields: { ...inputFields,
      value: field("Value", kind === "calendar" ? "選択した日付をYYYY-MM-DD形式で保持します。" : "入力した値を保持します。", "", { editor: INPUT_HTML_TYPES[kind] }),
      placeholder: field("Placeholder", "未入力時に表示するヒントです。", ""),
    } };
    case "shape": return { ...base, kind, coreType: kind, fields: { ...named,
      shape: enumField("Shape", "単一の直線・四角・楕円を描画します。", "line", [{ value: "line", label: "直線" }, { value: "rectangle", label: "四角" }, { value: "ellipse", label: "楕円" }]),
      direction: enumField("Direction", "直線の向きを選びます。", "horizontal", directionOptions),
      width: field("Width", "図形の幅です。0以上のpxで指定します。", 160, { min: 0, step: .1, unit: "px" }),
      height: field("Height", "図形の高さです。0以上のpxで指定します。", 2, { min: 0, step: .1, unit: "px" }),
      strokeWidth: field("Stroke Width", "線の太さです。0以上のpxで指定します。", 1, { min: 0, step: .1, unit: "px" }),
      label: field("Alt", "図形の意味を説明する名前です。", "区切り線"),
    } };
    case "video": return { ...base, kind, coreType: kind, fields: { ...named,
      source: field("Source", "再生する動画ファイルのURLです。", ""),
      poster: field("Poster", "再生前に表示する画像のURLです。", "/images/sample-landscape.svg"),
      label: field("Alt", "動画の内容を説明する代替テキストです。", "動画"),
      captions: field("Captions", "字幕ファイルのURLです。", ""),
    } };
  }
}
export function createPage(sequence: number, path = sequence === 1 ? "/" : "/page-" + sequence): PageComponent {
  return { type: "component", kind: "page", id: "page-" + sequence, fields: {
    name: field("Name", "Treeに表示するページの名前です。", "Page Component " + String(sequence).padStart(2, "0")), ...colorFields(THEME_COLORS.text, THEME_COLORS.canvas),
    path: field("Path", "このページのパスです。", path),
    context: slot("Context", "ページの通常表示を構成するComponentの配列です。", []),
    overlay: slot("Overlay", "Contextの上に重ねるComponentの配列です。", []),
  } };
}
export function layoutContainer(direction: Axis, children: WidgetNode[]): ContainerType {
  const node = createComponent("container", 0);
  return { ...node, id: "layout-" + crypto.randomUUID(), layoutOnly: true,
    fields: { ...node.fields, direction: { ...node.fields.direction, value: direction },
      padding: { ...node.fields.padding, value: 0 }, margin: { ...node.fields.margin, value: 0 },
      children: { ...node.fields.children, value: children } } };
}
export function componentFields(node: ComponentNode): FieldEntry[] {
  return Object.entries(node.fields).filter(([, value]) => !isSlot(value)).map(([key, value]) => ({ key, field: value, type: value.type }));
}
export type EditableField = string;
function withTextColor(node: ComponentNode, color: ColorValue, inherited = false): ComponentNode {
  let next = { ...node, fields: { ...node.fields, color: { ...node.fields.color, value: { ...color }, inherited,
    localValue: inherited ? node.fields.color.localValue : { ...color },
  } } } as ComponentNode;
  for (const [key, slot] of slotsOf(node)) {
    const children = slotNodes(slot).map((child) => withTextColor(child, color, true) as WidgetNode);
    next = withSlot(next, key, slot.multiple ? children : children[0] ?? null);
  }
  return next;
}
export function resetColorField(node: ComponentNode, key: string): ComponentNode {
  if (key !== "color" && key !== "background") return node;
  const target = node.fields[key];
  const value = target.inherited ? target.localValue : target.defaultValue;
  return withField(node, key, JSON.stringify(value));
}
export function withField(node: ComponentNode, key: EditableField, value: string): ComponentNode {
  const target = (node.fields as Record<string, Field<unknown>>)[key];
  if (!target || isSlot(target)) return node;
  if (target.type === "Boolean") {
    if (value !== "true" && value !== "false") return node;
    return { ...node, fields: { ...node.fields, [key]: { ...target, value: value === "true" } } } as ComponentNode;
  }
  if (node.kind === "calendar" && key === "value" && value !== "") {
    const date = new Date(value + "T00:00:00Z");
    if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(value) || value.startsWith("0000") || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) return node;
  }
  if (target.type === "Color") {
    let parsed: unknown;
    try { parsed = JSON.parse(value); } catch { return node; }
    if (!isColor(parsed)) return node;
    if (key === "color") return withTextColor(node, parsed);
    return { ...node, fields: { ...node.fields, [key]: { ...target, value: parsed, localValue: { ...parsed }, inherited: false } } } as ComponentNode;
  }
  if (node.kind === "icon" && key === "symbol") value = normalizeIconName(value);
  if (target.type === "Enum" && !target.options?.some((option) => option.value === value)) return node;
  if (node.kind === "icon" && key === "font") {
    if (!isIconFont(value)) return node;
    return { ...node, fields: { ...node.fields,
      font: { ...node.fields.font, value },
      symbol: { ...node.fields.symbol, options: symbols(value), value: iconCodepoint(value, node.fields.symbol.value) === undefined ? "info" : node.fields.symbol.value },
    } };
  }
  if (node.kind === "container" && key === "direction") {
    const flatten = (nodes: WidgetNode[]): WidgetNode[] => nodes.flatMap((child) => isLayout(child) ? flatten(child.fields.children.value) : [child]);
    return { ...node, fields: { ...node.fields,
      direction: { ...node.fields.direction, value: value as Axis },
      children: { ...node.fields.children, value: flatten(node.fields.children.value) },
    } };
  }
  if (target.type === "Number") {
    const number = Number(value);
    if (!value.trim() || !Number.isFinite(number) || number < (target.min ?? -Infinity) || (target.step === 1 && !Number.isInteger(number))) return node;
    return { ...node, fields: { ...node.fields, [key]: { ...target, value: number } } } as ComponentNode;
  }
  return { ...node, fields: { ...node.fields, [key]: { ...target, value } } } as ComponentNode;
}
