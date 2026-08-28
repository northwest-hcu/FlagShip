import type { FlowDocument } from "./flow";
import type { ResourceDocument } from "./resource";
import type { SchemaVersion } from "./schema-version";
import type { StateDocument } from "./state";
import type { UIDocument } from "./ui";
import type { LiteralValue } from "./value";

// Projectそのものを識別し、Schema Versionと作成日時を保持する
export interface ProjectMetadata {
  readonly id: string; // 保存後も変化しないProject ID
  readonly name: string; // Editor上で表示するProject名
  readonly schemaVersion: SchemaVersion; // Project DocumentのSchema Version
  readonly createdAt: string; // ISO 8601形式の作成日時
  readonly updatedAt: string; // ISO 8601形式の最終更新日時
}

// MVPではProject固有のComponent Definitionを作成しないため、空Objectだけを許可する
export type ComponentDocument = Readonly<Record<string, never>>;

// Project全体へ適用する公開設定
export interface ProjectSettings {
  readonly environment: Readonly<Record<string, LiteralValue>>; // Browserへ公開可能なEnvironment Value
}

// FlagShipで構築するApplication全体のSource of Truth
export interface ProjectDocument {
  readonly meta: ProjectMetadata; // Projectの識別情報
  readonly ui: UIDocument; // Application UIのLogical Definition
  readonly flows: FlowDocument; // Application BehaviorのGraph Definition
  readonly state: StateDocument; // State SchemaとInitial Value
  readonly resources: ResourceDocument; // 外部Resourceの接続定義
  readonly components: ComponentDocument; // Project固有ComponentのDefinition境界
  readonly settings: ProjectSettings; // Project全体の公開設定
}