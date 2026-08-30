import type { FlowGraph } from "./flow";
import type { ContentNodeReference } from "./reference";
import type { ContentTree, FixedLength } from "./ui";
import type { Value } from "./value";

/** Trigger固有の設定。 */
export type TriggerConfig = Readonly<Record<string, Value>>;

/** OverlayをActivateするTriggerの永続Instance。 */
export interface TriggerInstance {
  /** Component内で一意なTrigger Instance ID。 */
  readonly id: string;

  /** Trigger Contractを識別するID。 */
  readonly triggerTypeId: string;

  /** Event Source等のTrigger固有設定。 */
  readonly config: TriggerConfig;
}

/** Viewportを基準にしたOverlayのAlignment。 */
export type ViewportAlignment =
  | "top-start"
  | "top-center"
  | "top-end"
  | "center-start"
  | "center"
  | "center-end"
  | "bottom-start"
  | "bottom-center"
  | "bottom-end";

/** Anchorを基準にしたOverlayの配置方向。 */
export type AnchorPlacement =
  | "top"
  | "right"
  | "bottom"
  | "left";

/** Overlay Positioningへ加える再計算可能な位置補正。 */
export interface OverlayOffset {
  /** 横方向の位置補正。 */
  readonly x?: FixedLength;

  /** 縦方向の位置補正。 */
  readonly y?: FixedLength;
}

/** Viewportを基準にOverlayを配置するRule。 */
export interface ViewportOverlayPositioning {
  /** Viewport Positioningを識別する固定値。 */
  readonly type: "viewport";

  /** Viewport内での配置位置。 */
  readonly alignment: ViewportAlignment;

  /** Alignmentからの位置補正。 */
  readonly offset?: OverlayOffset;
}

/** Content NodeをAnchorとしてOverlayを配置するRule。 */
export interface AnchorOverlayPositioning {
  /** Anchor Positioningを識別する固定値。 */
  readonly type: "anchor";

  /** 基準となるContent NodeへのStructured Reference。 */
  readonly anchor: ContentNodeReference;

  /** Anchorに対する配置方向。 */
  readonly placement: AnchorPlacement;

  /** Anchorからの位置補正。 */
  readonly offset?: OverlayOffset;
}

/** Projectへ保存するOverlay Positioning Rule。 */
export type OverlayPositioning =
  | ViewportOverlayPositioning
  | AnchorOverlayPositioning;

/** Out-of-flow UIと表示条件を保持するUI Tree。 */
export interface OverlayTree {
  /** Component内で一意なOverlay Tree ID。 */
  readonly id: string;

  /** Editor上の表示名。 */
  readonly name: string;

  /** OverlayをActivateするTrigger。未接続の場合は `null`。 */
  readonly openTrigger: TriggerInstance | null;

  /** Overlay Surface上の配置Rule。 */
  readonly positioning: OverlayPositioning;

  /** Overlay Surfaceへ投影するContent Tree。 */
  readonly contentTree: ContentTree;
}

/** UIとFlowをまとめたVersion付き再利用Asset。 */
export interface Component {
  /** Componentを識別するStable ID。 */
  readonly id: string;

  /** LibraryとEditor上の表示名。 */
  readonly name: string;

  /** Projectが固定して利用するComponent Version。 */
  readonly version: string;

  /** Page Content Surfaceへ投影する通常UI。Overlay専用なら `null`。 */
  readonly contentTree: ContentTree | null;

  /** Overlay Tree IDをKeyとするCollection。 */
  readonly overlayTrees: Readonly<Record<string, OverlayTree>>;

  /** Flow Graph IDをKeyとするComponent固有Graph Collection。 */
  readonly flowGraphs: Readonly<Record<string, FlowGraph>>;
}

/** Project外から選択できるComponent Libraryの種類。 */
export type ExternalComponentLibraryKind = "base" | "public";

/** Project外から導入できるComponent Library。 */
export interface ExternalComponentLibrary {
  /** 既存Projectとの互換に使用する取得元区分。 */
  readonly kind: ExternalComponentLibraryKind;

  /** Libraryを識別するStable ID。 */
  readonly id: string;

  /** Library Selectorへ表示する名前。 */
  readonly name: string;

  /** Library全体のVersion。 */
  readonly version: string;

  /** Component IDをKeyとする利用可能なAsset。 */
  readonly assets: Readonly<Record<string, Component>>;
}

/** EditorがComponent Selectorへ公開するLibrary Catalog。 */
export interface ComponentLibraryCatalog {
  /** 標準Libraryを含む導入済みLibrary。 */
  readonly libraries: Readonly<
    Record<string, ExternalComponentLibrary>
  >;
}

/** BaseまたはPublic Libraryから取り込んだComponentの取得元。 */
export interface ImportedComponentSource {
  /** Componentを取得したLibraryの種類。 */
  readonly kind: ExternalComponentLibraryKind;

  /** 取得元LibraryのStable ID。 */
  readonly libraryId: string;

  /** 取り込み時に選択したLibrary Version。 */
  readonly libraryVersion: string;
}

/** Projectへ固定Versionで取り込んだComponent Asset Snapshot。 */
export interface ImportedComponentAsset {
  /** 取り込み元を識別するMetadata。 */
  readonly source: ImportedComponentSource;

  /** Project内で利用するComponentのSnapshot。 */
  readonly component: Component;
}

/** 現在のProjectだけで作成・編集するLocal Component Library。 */
export interface LocalComponentLibrary {
  /** Local Libraryを識別するStable ID。 */
  readonly id: string;

  /** Editorへ表示するLocal Library名。 */
  readonly name: string;

  /** Projectと一緒に保存するLocal Component Asset。 */
  readonly assets: Readonly<Record<string, Component>>;
}

/** Projectが利用するImported AssetとLocal Library。 */
export interface ComponentDocument {
  /** BaseまたはPublic Libraryから取り込んだ固定VersionのSnapshot。 */
  readonly importedAssets: Readonly<
    Record<string, ImportedComponentAsset>
  >;

  /** Project固有で永続化するLocal Component Library。 */
  readonly localLibrary: LocalComponentLibrary;
}
