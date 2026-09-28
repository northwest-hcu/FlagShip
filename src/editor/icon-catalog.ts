import symbolsOutlined from "./icons/symbols-outlined.codepoints?raw";
import symbolsRounded from "./icons/symbols-rounded.codepoints?raw";
import symbolsSharp from "./icons/symbols-sharp.codepoints?raw";
import iconsFilled from "./icons/icons-filled.codepoints?raw";
import iconsOutlined from "./icons/icons-outlined.codepoints?raw";
import iconsRounded from "./icons/icons-rounded.codepoints?raw";
import iconsSharp from "./icons/icons-sharp.codepoints?raw";
import iconsTwoTone from "./icons/icons-two-tone.codepoints?raw";

export const ICON_FONTS = [
  { value: "symbols-outlined", label: "Symbols / Outlined", source: symbolsOutlined },
  { value: "symbols-rounded", label: "Symbols / Rounded", source: symbolsRounded },
  { value: "symbols-sharp", label: "Symbols / Sharp", source: symbolsSharp },
  { value: "icons-filled", label: "Icons / Filled", source: iconsFilled },
  { value: "icons-outlined", label: "Icons / Outlined", source: iconsOutlined },
  { value: "icons-rounded", label: "Icons / Rounded", source: iconsRounded },
  { value: "icons-sharp", label: "Icons / Sharp", source: iconsSharp },
  { value: "icons-two-tone", label: "Icons / Two Tone", source: iconsTwoTone },
] as const;
export type IconFontId = (typeof ICON_FONTS)[number]["value"];
export interface IconDefinition { name: string; codepoint: number }
export function parseCodepoints(source: string): IconDefinition[] {
  const entries = source.trim().split(/\r?\n/).map((line) => {
    const [name, hex] = line.trim().split(/\s+/);
    const codepoint = Number.parseInt(hex, 16);
    if (!/^[a-z0-9_]+$/.test(name) || !Number.isInteger(codepoint) || codepoint < 0 || codepoint > 0x10ffff) {
      throw new Error("Invalid icon index: " + line);
    }
    return { name, codepoint };
  });
  // 公式の旧Icons索引には同名の行があるため、最後の定義で名前を一意にする。
  return [...new Map(entries.map((icon) => [icon.name, icon])).values()].sort((a, b) => a.name.localeCompare(b.name));
}
const catalogs = Object.fromEntries(ICON_FONTS.map((font) => [font.value, parseCodepoints(font.source)])) as Record<IconFontId, IconDefinition[]>;
const indexes = Object.fromEntries(ICON_FONTS.map((font) => [font.value, new Map(catalogs[font.value].map((icon) => [icon.name, icon.codepoint]))])) as Record<IconFontId, Map<string, number>>;
export const normalizeIconName = (name: string): string => name === "arrow-right" ? "arrow_forward" : name;
export function isIconFont(value: string): value is IconFontId { return ICON_FONTS.some((font) => font.value === value); }
export function iconCodepoint(font: IconFontId, name: string): number | undefined {
  return indexes[font].get(normalizeIconName(name));
}
export function searchIcons(font: IconFontId, query = ""): IconDefinition[] {
  const terms = query.toLowerCase().trim().replaceAll("-", "_").split(/\s+/).filter(Boolean);
  return catalogs[font].filter((icon) => terms.every((term) => icon.name.includes(term)));
}
