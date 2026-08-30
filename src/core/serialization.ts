import type { ProjectDocument } from "./model/project";

/** Project JSONの読書きで識別するError種別。 */
export type ProjectSerializationErrorCode =
  | "INVALID_JSON"
  | "NON_SERIALIZABLE_VALUE";

/** Project JSON境界で発生したError。 */
export class ProjectSerializationError extends Error {
  /** 表示文言から独立した安定Error Code。 */
  readonly code: ProjectSerializationErrorCode;

  /** 問題があるProject内の位置。 */
  readonly path: readonly (string | number)[];

  /**
   * Project Serialization Errorを生成する。
   *
   * @param code - Errorの種類を示す固定Code。
   * @param message - 初見User向けの説明。
   * @param path - Project内の該当位置。
   */
  constructor(
    code: ProjectSerializationErrorCode,
    message: string,
    path: readonly (string | number)[] = [],
  ) {
    super(message);
    this.name = "ProjectSerializationError";
    this.code = code;
    this.path = path;
  }
}

function assertSerializable(
  value: unknown,
  path: readonly (string | number)[],
  ancestors: WeakSet<object>,
): void {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return;
  }

  if (typeof value === "number") {
    if (Number.isFinite(value)) {
      return;
    }

    throw new ProjectSerializationError(
      "NON_SERIALIZABLE_VALUE",
      "Project numbers must be finite JSON values.",
      path,
    );
  }

  if (typeof value !== "object") {
    throw new ProjectSerializationError(
      "NON_SERIALIZABLE_VALUE",
      "Project data contains a value that JSON cannot preserve.",
      path,
    );
  }

  if (ancestors.has(value)) {
    throw new ProjectSerializationError(
      "NON_SERIALIZABLE_VALUE",
      "Project data must not contain circular references.",
      path,
    );
  }

  ancestors.add(value);

  if (Array.isArray(value)) {
    if (Object.getOwnPropertySymbols(value).length > 0) {
      throw new ProjectSerializationError(
        "NON_SERIALIZABLE_VALUE",
        "Project arrays must not contain Symbol properties.",
        path,
      );
    }

    for (let index = 0; index < value.length; index += 1) {
      if (!Object.hasOwn(value, index)) {
        throw new ProjectSerializationError(
          "NON_SERIALIZABLE_VALUE",
          "Project arrays must not contain empty items.",
          [...path, index],
        );
      }

      const descriptor = Object.getOwnPropertyDescriptor(
        value,
        String(index),
      );

      if (
        descriptor === undefined ||
        !descriptor.enumerable ||
        !("value" in descriptor)
      ) {
        throw new ProjectSerializationError(
          "NON_SERIALIZABLE_VALUE",
          "Project arrays must contain only enumerable data items.",
          [...path, index],
        );
      }

      assertSerializable(
        descriptor.value,
        [...path, index],
        ancestors,
      );
    }

    for (const key of Object.getOwnPropertyNames(value)) {
      if (key === "length") {
        continue;
      }

      const index = Number(key);

      if (
        !Number.isInteger(index) ||
        index < 0 ||
        index >= value.length ||
        String(index) !== key
      ) {
        throw new ProjectSerializationError(
          "NON_SERIALIZABLE_VALUE",
          "Project arrays must not contain named properties.",
          [...path, key],
        );
      }
    }

    ancestors.delete(value);
    return;
  }

  const prototype = Object.getPrototypeOf(value);

  if (prototype !== Object.prototype && prototype !== null) {
    throw new ProjectSerializationError(
      "NON_SERIALIZABLE_VALUE",
      "Project data must contain only plain JSON objects.",
      path,
    );
  }

  if (Object.getOwnPropertySymbols(value).length > 0) {
    throw new ProjectSerializationError(
      "NON_SERIALIZABLE_VALUE",
      "Project objects must not contain Symbol properties.",
      path,
    );
  }

  for (const key of Object.getOwnPropertyNames(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);

    if (
      descriptor === undefined ||
      !descriptor.enumerable ||
      !("value" in descriptor)
    ) {
      throw new ProjectSerializationError(
        "NON_SERIALIZABLE_VALUE",
        "Project objects must contain only enumerable data properties.",
        [...path, key],
      );
    }

    assertSerializable(
      descriptor.value,
      [...path, key],
      ancestors,
    );
  }

  ancestors.delete(value);
}

/**
 * Project Documentを可読なJSONへ変換する。
 * JSONが黙って欠落・置換する値は保存前に拒否する。
 *
 * @param project - SerializationするCanonical Project Document。
 * @returns 2-space Indentと末尾改行を持つProject JSON。
 * @throws {ProjectSerializationError} JSONで意味を維持できない値を含む場合。
 */
export function serializeProject(
  project: ProjectDocument,
): string {
  assertSerializable(project, [], new WeakSet());
  return `${JSON.stringify(project, null, 2)}\n`;
}

/**
 * Project JSONを未検証Dataとして読み込む。
 * Schema MigrationとValidationが完了するまでProject Documentとは扱わない。
 *
 * @param source - 読み込むProject JSON文字列。
 * @returns JSONから復元した未検証Data。
 * @throws {ProjectSerializationError} JSON Syntaxが不正な場合。
 */
export function parseProjectJson(source: string): unknown {
  try {
    return JSON.parse(source) as unknown;
  } catch {
    throw new ProjectSerializationError(
      "INVALID_JSON",
      "Project file is not valid JSON.",
    );
  }
}
