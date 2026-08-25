import type { Value } from "./value";

export type UIProperties =
  Readonly<Record<string, Value>>; // Componentの公開Property

export interface FixedLength {
  readonly type: "fixed"; // 固定長であることを示す識別子
  readonly value: number; // 固定長の数値
  readonly unit: "px"; // 固定長の単位
}

export type Spacing =
  | "none"
  | "xs"
  | "sm"
  | "md"
  | "lg"
  | FixedLength; // Design Tokenまたは明示的な固定間隔

export type StackAlignment =
  | "start"
  | "center"
  | "end"
  | "stretch"; // Stackの交差方向における配置方法

export type StackJustification =
  | "start"
  | "center"
  | "end"
  | "space-between"; // Stackの進行方向における配置方法

export interface StackLayout {
  readonly type: "stack"; // Stack Layoutの識別子
  readonly direction: "vertical" | "horizontal"; // 子Nodeを並べる方向
  readonly gap?: Spacing; // 子Node間の間隔
  readonly align?: StackAlignment; // 交差方向の配置方法
  readonly justify?: StackJustification; // 進行方向の配置方法
  readonly padding?: Spacing; // Container内側の間隔
  readonly wrap?: boolean; // 領域不足時に子Nodeを折り返すか
}

export type GridTrack =
  | { readonly type: "auto" }
  | {
      readonly type: "fraction";
      readonly value: number;
    }
  | FixedLength; // Gridの1つのColumnまたはRowのSize Rule

export interface GridLayout {
  readonly type: "grid"; // Grid Layoutの識別子
  readonly columns: readonly GridTrack[]; // Column構成
  readonly rows?: readonly GridTrack[]; // Row構成
  readonly gap?: Spacing; // Cell間の間隔
  readonly align?: StackAlignment; // Cell内の配置方法
}

export interface SlotLayout {
  readonly type: "slot"; // ComponentのSlot ContractへLayoutを委譲する
}

export type UILayout =
  | StackLayout
  | GridLayout
  | SlotLayout; // UI Nodeが子Nodeへ適用するLayout Rule

export type SizeRule =
  | { readonly type: "fit" }
  | { readonly type: "fill" }
  | {
      readonly type: "fraction";
      readonly value: number;
    }
  | FixedLength; // Node Sizeの決定方法

export interface UISize {
  readonly width: SizeRule; // 横幅のSize Rule
  readonly height: SizeRule; // 高さのSize Rule
  readonly minWidth?: FixedLength; // 最小横幅
  readonly maxWidth?: FixedLength; // 最大横幅
  readonly minHeight?: FixedLength; // 最小高さ
  readonly maxHeight?: FixedLength; // 最大高さ
}

export type OverlayPlacement =
  | "top-start"
  | "top"
  | "top-end"
  | "right-start"
  | "right"
  | "right-end"
  | "bottom-start"
  | "bottom"
  | "bottom-end"
  | "left-start"
  | "left"
  | "left-end"; // Anchorを基準としたOverlayの表示位置

export type UIPresentation =
  | {
      readonly surface: "content"; // 通常Layout内へ描画する
    }
  | {
      readonly surface: "overlay.anchored"; // Anchor基準でOverlayへ描画する
      readonly anchor: string; // AnchorとなるUI Nodeの固定ID
      readonly placement: OverlayPlacement; // Anchorに対する表示位置
    }
  | {
      readonly surface: "overlay.modal"; // Modal Surfaceへ描画する
    }
  | {
      readonly surface: "overlay.notification"; // Notification Surfaceへ描画する
    };

export interface UINode {
  readonly id: string; // 固定UI Node ID
  readonly type: string; // Component Contract ID
  readonly name: string; // Editor上の表示名
  readonly parentId: string | null; // Logical Parentの固定ID
  readonly slot: string | null; // Parent内のNamed Slot
  readonly children: readonly string[]; // Logical Childの固定IDと順番
  readonly props: UIProperties; // Componentの公開Property
  readonly layout: UILayout | null; // 子Nodeへ適用する配置方法
  readonly size: UISize; // Semantic Size
  readonly presentation: UIPresentation; // 描画するRender Surface
}

export interface UIDocument {
  readonly roots: readonly string[]; // Root Nodeの固定ID
  readonly nodes: Readonly<
    Record<string, UINode>
  >; // UI Node IDをKeyとするUI Node
}