import type { ReferenceValue } from "./reference";
import type { LiteralValue } from "./value";

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
  readonly direction: "vertical" | "horizontal"; // 子を並べる方向
  readonly gap?: Spacing; // 子の間隔
  readonly align?: StackAlignment; // 交差方向の配置方法
  readonly justify?: StackJustification; // 進行方向の配置方法
  readonly padding?: Spacing; // Content Node内側の間隔
  readonly wrap?: boolean; // 領域不足時に子を折り返すか
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
  readonly type: "slot"; // Named Slotごとの配置へLayoutを委ねる
}

export type UILayout =
  | StackLayout
  | GridLayout
  | SlotLayout; // Content Nodeが子へ適用するLayout Rule

export type SizeRule =
  | { readonly type: "fit" }
  | { readonly type: "fill" }
  | {
      readonly type: "fraction";
      readonly value: number;
    }
  | FixedLength; // Content NodeのSizeを決めるRule

export interface UISize {
  readonly width: SizeRule; // 横幅のSize Rule
  readonly height: SizeRule; // 高さのSize Rule
  readonly minWidth?: FixedLength; // 最小横幅
  readonly maxWidth?: FixedLength; // 最大横幅
  readonly minHeight?: FixedLength; // 最小高さ
  readonly maxHeight?: FixedLength; // 最大高さ
}

export interface NamedSlot {
  readonly id: string; // 親Content Node内で一意なSlot ID
  readonly name: string; // Editor上の表示名
}

export interface ContentNodeTarget {
  readonly type: "content-node"; // 同じContent Tree内のNodeを参照する
  readonly nodeId: string; // 配置するContent Nodeの固定ID
}

export interface ComponentInstanceTarget {
  readonly type: "component-instance"; // 子Component Instanceを参照する
  readonly componentInstanceId: string; // 配置するInstanceの固定ID
}

export type ChildTarget =
  | ContentNodeTarget
  | ComponentInstanceTarget; // Content Nodeへ配置できる子の種類

export interface ChildPlacement {
  readonly target: ChildTarget; // 配置するContent NodeまたはComponent Instance
  readonly slotId: string; // 親が定義したNamed SlotのID。nullと省略は不可
}

export type ContentNodeState = Readonly<
  Record<string, LiteralValue>
>; // Component Instanceごとに生成するContent Node Stateの初期値

interface ContentNodeBase {
  readonly id: string; // Component内で一意なContent Node ID
  readonly name: string; // Editor上の表示名
  readonly state: ContentNodeState; // このContent Nodeが所有する初期State
  readonly size: UISize; // Semantic Size
}

export interface ContainerContentNode
  extends ContentNodeBase {
  readonly type: "container"; // 子を配置できるContent Node
  readonly slots: readonly NamedSlot[]; // このNodeが提供するNamed Slot
  readonly children: readonly ChildPlacement[]; // Slotごとの子と順序
  readonly layout: UILayout | null; // 子へ適用するLayout Rule
}

export type TextContentValue =
  | string
  | ReferenceValue; // 固定文字列またはStructured Reference

export interface TextContentNode extends ContentNodeBase {
  readonly type: "text"; // 文字列を表すLeaf Node
  readonly value: TextContentValue; // 描画する文字列または参照
  readonly slots: readonly []; // Text Content Nodeは子を受け入れない
  readonly children: readonly []; // Text Content Nodeは常にLeafとする
  readonly layout: null; // 子を持たないためLayout Ruleを持たない
}

export type ContentNode =
  | ContainerContentNode
  | TextContentNode; // Content Treeへ保存できるNode

export interface ContentTree {
  readonly rootNodeId: string; // 親とSlotを持たないRoot Content Nodeの固定ID
  readonly nodes: Readonly<
    Record<string, ContentNode>
  >; // Content Node IDをKeyとするNode Collection
}

export interface UIPage {
  readonly id: string; // 固定UI Page ID
  readonly name: string; // Editor上の表示名
}

export interface UIDocument {
  readonly pages: Readonly<
    Record<string, UIPage>
  >; // UI Page IDをKeyとするPage Collection
}
