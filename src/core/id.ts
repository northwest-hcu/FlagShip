/** Stable IDが属するEntityの種類。 */
export const STABLE_ID_PREFIXES = [
  "component-instance",
  "content-node",
  "flow-node",
  "ui-page",
  "component",
  "overlay",
  "trigger",
  "project",
  "resource",
  "state",
  "flow",
  "edge"
] as const;

/** Stable IDへ付与できるEntity Prefix。 */
export type StableIdPrefix =
  (typeof STABLE_ID_PREFIXES)[number];

/** Stable IDのPrefix以降に使用できる小文字Kebab Case。 */
const STABLE_ID_SUFFIX_PATTERN =
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Entityの種類を示すPrefixとUUIDからStable IDを生成する。
 *
 * @param prefix - IDへ付与するEntity種別のPrefix。
 * @returns `${prefix}-${UUID}` 形式のStable ID。
 */
export function createStableId(prefix: StableIdPrefix): string {
  return `${prefix}-${globalThis.crypto.randomUUID()}`;
}

/**
 * Stable IDからEntity Prefixを取得する。
 *
 * @param value - Prefixを判定する値。
 * @returns Entity Prefix。Stable ID形式でなければ `undefined`。
 */
export function getStableIdPrefix(
  value: unknown,
): StableIdPrefix | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  for (const prefix of STABLE_ID_PREFIXES) {
    const separator = `${prefix}-`;

    if (!value.startsWith(separator)) {
      continue;
    }

    const suffix = value.slice(separator.length);

    if (STABLE_ID_SUFFIX_PATTERN.test(suffix)) {
      return prefix;
    }
  }

  return undefined;
}

/**
 * JSON等から読み込んだ値がStable IDの命名規則を満たすか判定する。
 *
 * @param value - 判定対象の値。
 * @param expectedPrefix - 必要な場合に検証するEntity Prefix。
 * @returns Stable IDとして扱える文字列なら `true`。
 */
export function isStableId(
  value: unknown,
  expectedPrefix?: StableIdPrefix,
): value is string {
  const actualPrefix = getStableIdPrefix(value);

  return actualPrefix !== undefined &&
    (expectedPrefix === undefined || actualPrefix === expectedPrefix);
}
