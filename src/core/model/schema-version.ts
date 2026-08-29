/** 新規Project Documentへ設定する現在のSchema Version。 */
export const CURRENT_SCHEMA_VERSION = "1" as const;

/** 現在の実装が読み書きできるSchema Version。 */
export type SchemaVersion = typeof CURRENT_SCHEMA_VERSION;
