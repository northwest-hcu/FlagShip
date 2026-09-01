import type { FlowGraph } from "./flow";
import type { ContentTree } from "./ui";

/** UIとFlowをまとめたVersion付き再利用Asset。 */
export interface Component {
  /** Componentを識別するStable ID。 */
  readonly id: string;

  /** LibraryとEditor上の表示名。 */
  readonly name: string;

  /** Projectが固定して利用するComponent Version。 */
  readonly version: string;

  /** Component Instanceが描画する単一のUI Tree。 */
  readonly contentTree: ContentTree;

  /** 配置できるPage Surface。省略時はContent Surface。 */
  readonly allowedSurface?: "content" | "overlay";

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
