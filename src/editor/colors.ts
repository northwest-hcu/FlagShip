export interface ColorValue { r: number; g: number; b: number; a: number }
export const THEME_COLORS = {
  text: { r: 178, g: 214, b: 142, a: 1 },
  background: { r: 36, g: 36, b: 36, a: 1 },
  panel: { r: 41, g: 41, b: 41, a: 1 },
  canvas: { r: 48, g: 48, b: 48, a: 1 },
  accent: { r: 168, g: 230, b: 80, a: 1 },
  transparent: { r: 41, g: 41, b: 41, a: 0 },
} satisfies Record<string, ColorValue>;
export const COLOR_PRESETS = [
  { label: "赤", hex: "#ff0000" }, { label: "橙", hex: "#ff8000" },
  { label: "黄", hex: "#ffff00" }, { label: "黄緑", hex: "#80ff00" },
  { label: "緑", hex: "#00ff00" }, { label: "青緑", hex: "#00ff80" },
  { label: "水色", hex: "#00ffff" }, { label: "空色", hex: "#0080ff" },
  { label: "青", hex: "#0000ff" }, { label: "紫", hex: "#8000ff" },
  { label: "赤紫", hex: "#ff00ff" }, { label: "桃", hex: "#ff0080" },
  { label: "白", hex: "#ffffff" }, { label: "黒", hex: "#000000" },
  { label: "グレー", hex: "#808080" },
] as const;
export function isColor(value: unknown): value is ColorValue {
  if (!value || typeof value !== "object") return false;
  const color = value as ColorValue;
  return [color.r, color.g, color.b].every((channel) => Number.isInteger(channel) && channel >= 0 && channel <= 255)
    && Number.isFinite(color.a) && color.a >= 0 && color.a <= 1;
}
export function colorCss(value: ColorValue): string { return "rgba(" + [value.r, value.g, value.b, value.a].join(", ") + ")"; }
export function colorHex(value: ColorValue): string { return "#" + [value.r, value.g, value.b].map((channel) => channel.toString(16).padStart(2, "0")).join(""); }
export function colorFromHex(hex: string, alpha = 1): ColorValue {
  if (!/^#[0-9a-f]{6}$/i.test(hex) || !Number.isFinite(alpha) || alpha < 0 || alpha > 1) throw new Error("Invalid color");
  return { r: parseInt(hex.slice(1, 3), 16), g: parseInt(hex.slice(3, 5), 16), b: parseInt(hex.slice(5, 7), 16), a: alpha };
}
