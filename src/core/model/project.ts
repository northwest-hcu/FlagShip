import type { ComponentDocument } from "./component";
import type { FlowDocument } from "./flow";
import type { ResourceDocument } from "./resource";
import type { SchemaVersion } from "./schema-version";
import type { StateDocument } from "./state";
import type { UIDocument } from "./ui";
import type { LiteralValue } from "./value";

/** Projectを識別し、Schema Versionと日時を保持するMetadata。 */
export interface ProjectMetadata {
  /** 保存後も変化しないProject ID。 */
  readonly id: string;

  /** Editor上で表示するProject名。 */
  readonly name: string;

  /** Project DocumentのSchema Version。 */
  readonly schemaVersion: SchemaVersion;

  /** ISO 8601形式の作成日時。 */
  readonly createdAt: string;

  /** ISO 8601形式の最終更新日時。 */
  readonly updatedAt: string;
}

/** Project全体へ適用する公開設定。 */
export interface ProjectSettings {
  /** Browserへ公開可能なEnvironment Value。 */
  readonly environment: Readonly<Record<string, LiteralValue>>;
}

/** FlagShipで構築するApplication全体のSource of Truth。 */
export interface ProjectDocument {
  /** Projectの識別情報。 */
  readonly meta: ProjectMetadata;

  /** Application UIのLogical Definition。 */
  readonly ui: UIDocument;

  /** Application BehaviorのGraph Definition。 */
  readonly flows: FlowDocument;

  /** State SchemaとInitial Value。 */
  readonly state: StateDocument;

  /** 外部Resourceの接続定義。 */
  readonly resources: ResourceDocument;

  /** Imported Component SnapshotとProject Local Library。 */
  readonly components: ComponentDocument;

  /** Project全体の公開設定。 */
  readonly settings: ProjectSettings;
}
