import type { ReferenceValue } from "./reference";
import type { PersistentStateValue } from "./state";
import type { LiteralValue } from "./value";

/** Pixel単位の固定長。 */
export interface FixedLength {
  /** 固定長を識別する固定値。 */
  readonly type: "fixed";

  /** 固定長の数値。 */
  readonly value: number;

  /** 固定長の単位。 */
  readonly unit: "px";
}

/** Design Tokenまたは明示的な固定間隔。 */
export type Spacing =
  | "none"
  | "xs"
  | "sm"
  | "md"
  | "lg"
  | FixedLength;

/** Stackの交差方向における配置方法。 */
export type StackAlignment =
  | "start"
  | "center"
  | "end"
  | "stretch";

/** Stackの進行方向における配置方法。 */
export type StackJustification =
  | "start"
  | "center"
  | "end"
  | "space-between";

/** 子を一方向へ並べるStack Layout。 */
export interface StackLayout {
  /** Stack Layoutを識別する固定値。 */
  readonly type: "stack";

  /** 子を並べる方向。 */
  readonly direction: "vertical" | "horizontal";

  /** 子の間隔。 */
  readonly gap?: Spacing;

  /** 交差方向の配置方法。 */
  readonly align?: StackAlignment;

  /** 進行方向の配置方法。 */
  readonly justify?: StackJustification;

  /** Content Node内側の間隔。 */
  readonly padding?: Spacing;

  /** 領域不足時に子を折り返すか。 */
  readonly wrap?: boolean;
}

/** Gridの1つのColumnまたはRowに適用するSize Rule。 */
export type GridTrack =
  | { readonly type: "auto" }
  | {
      readonly type: "fraction";
      /** Grid内で割り当てる比率。 */
      readonly value: number;
    }
  | FixedLength;

/** 子を行と列へ配置するGrid Layout。 */
export interface GridLayout {
  /** Grid Layoutを識別する固定値。 */
  readonly type: "grid";

  /** Column構成。 */
  readonly columns: readonly GridTrack[];

  /** Row構成。 */
  readonly rows?: readonly GridTrack[];

  /** Cell間の間隔。 */
  readonly gap?: Spacing;

  /** Cell内の配置方法。 */
  readonly align?: StackAlignment;
}

/** Named Slotごとの配置へLayoutを委ねるRule。 */
export interface SlotLayout {
  /** Slot Layoutを識別する固定値。 */
  readonly type: "slot";
}

/** Content Nodeが子へ適用するLayout Rule。 */
export type UILayout =
  | StackLayout
  | GridLayout
  | SlotLayout;

/** Content NodeのSizeを決めるRule。 */
export type SizeRule =
  | { readonly type: "fit" }
  | { readonly type: "fill" }
  | {
      readonly type: "fraction";
      /** 親の利用可能領域から割り当てる比率。 */
      readonly value: number;
    }
  | FixedLength;

/** Content NodeのSemantic Size。 */
export interface UISize {
  /** 横幅のSize Rule。 */
  readonly width: SizeRule;

  /** 高さのSize Rule。 */
  readonly height: SizeRule;

  /** 最小横幅。 */
  readonly minWidth?: FixedLength;

  /** 最大横幅。 */
  readonly maxWidth?: FixedLength;

  /** 最小高さ。 */
  readonly minHeight?: FixedLength;

  /** 最大高さ。 */
  readonly maxHeight?: FixedLength;
}

/** 親Content Nodeが子の配置先として公開するNamed Slot。 */
export interface NamedSlot {
  /** 親Content Node内で一意なSlot ID。 */
  readonly id: string;

  /** Editor上の表示名。 */
  readonly name: string;
}

/** 同じContent Tree内のContent Nodeを参照するChild Target。 */
export interface ContentNodeTarget {
  /** Content Node Targetを識別する固定値。 */
  readonly type: "content-node";

  /** 配置するContent Nodeの固定ID。 */
  readonly nodeId: string;
}

/** 子Component Instanceを参照するChild Target。 */
export interface ComponentInstanceTarget {
  /** Component Instance Targetを識別する固定値。 */
  readonly type: "component-instance";

  /** 配置するInstanceの固定ID。 */
  readonly componentInstanceId: string;
}

/** Content Nodeへ配置できる子の種類。 */
export type ChildTarget =
  | ContentNodeTarget
  | ComponentInstanceTarget;

/** 親Content NodeのNamed Slotへ子を配置する関係。 */
export interface ChildPlacement {
  /** 配置するContent NodeまたはComponent Instance。 */
  readonly target: ChildTarget;

  /** 親が定義したNamed SlotのID。省略および `null` は許可しない。 */
  readonly slotId: string;
}

/** Component Instanceごとに生成するContent Node State。 */
export type ContentNodeState =
  | PersistentStateValue
  | Readonly<Record<string, never>>;

/** ComponentをPageまたは別Component内へ配置した実体。 */
export interface ComponentInstance {
  /** Owner内でInstanceを識別するStable Local ID。 */
  readonly id: string;

  /** 利用するComponentのStable ID。 */
  readonly componentId: string;

  /** Projectが固定して利用するComponent Version。 */
  readonly componentVersion: string;

  /** Content Node IDごとのInstance固有State初期値。 */
  readonly state?: Readonly<Record<string, LiteralValue>>;

  /** Named Slotへ配置した子Component Instance。 */
  readonly children?: readonly ComponentInstanceChildPlacement[];
}

/** Component Instance内のNamed Slotへ配置した子Instance。 */
export interface ComponentInstanceChildPlacement {
  /** Slotを所有する親Content Node ID。 */
  readonly parentContentNodeId: string;

  /** 親Content Nodeが定義したNamed Slot ID。 */
  readonly slotId: string;

  /** Slotへ配置した子Component Instance。 */
  readonly instance: ComponentInstance;
}

/** すべてのContent Nodeが持つ共通Property。 */
interface ContentNodeBase {
  /** Component内で一意なContent Node ID。 */
  readonly id: string;

  /** Editor上の表示名。 */
  readonly name: string;

  /** このContent Nodeが所有する初期State。 */
  readonly state: ContentNodeState;

  /** Content NodeのSemantic Size。 */
  readonly size: UISize;
}

/** Named Slotへ子を配置できるContainer Content Node。 */
export interface ContainerContentNode
  extends ContentNodeBase {
  /** Container Content Nodeを識別する固定値。 */
  readonly type: "container";

  /** このNodeが提供するNamed Slot。 */
  readonly slots: readonly NamedSlot[];

  /** Named Slotごとの子と順序。 */
  readonly children: readonly ChildPlacement[];

  /** 子へ適用するLayout Rule。 */
  readonly layout: UILayout | null;
}

/** Text Content Nodeが描画する固定文字列またはStructured Reference。 */
export type TextContentValue =
  | string
  | ReferenceValue;

/** 文字列をStable ID付きで保持するLeaf Content Node。 */
export interface TextContentNode extends ContentNodeBase {
  /** Text Content Nodeを識別する固定値。 */
  readonly type: "text";

  /** 描画する文字列またはStructured Reference。 */
  readonly value: TextContentValue;

  /** Text Content NodeはSlotを提供しない。 */
  readonly slots: readonly [];

  /** Text Content Nodeは常にLeafとする。 */
  readonly children: readonly [];

  /** 子を持たないためLayout Ruleを持たない。 */
  readonly layout: null;
}

/** Input要素を描画するLeaf Content Node。 */
export interface InputContentNode extends ContentNodeBase {
  readonly type: "input";
  readonly slots: readonly [];
  readonly children: readonly [];
  readonly layout: null;
}

/** Image要素を描画するLeaf Content Node。 */
export interface ImageContentNode extends ContentNodeBase {
  readonly type: "image";
  readonly slots: readonly [];
  readonly children: readonly [];
  readonly layout: null;
}

/** Iconを描画するLeaf Content Node。 */
export interface IconContentNode extends ContentNodeBase {
  readonly type: "icon";
  readonly slots: readonly [];
  readonly children: readonly [];
  readonly layout: null;
}

/** Named Slotへ内容を受け入れるButton Content Node。 */
export interface ButtonContentNode extends ContentNodeBase {
  readonly type: "button";
  readonly slots: readonly NamedSlot[];
  readonly children: readonly ChildPlacement[];
  readonly layout: UILayout | null;
}

/** Content Treeへ保存できるNode。 */
export type ContentNode =
  | ContainerContentNode
  | TextContentNode
  | InputContentNode
  | ImageContentNode
  | IconContentNode
  | ButtonContentNode;

/** Componentの通常UIを構成するContent Node Tree。 */
export interface ContentTree {
  /** 親とSlotを持たないRoot Content Nodeの固定ID。 */
  readonly rootNodeId: string;

  /** Content Node IDをKeyとするNode Collection。 */
  readonly nodes: Readonly<
    Record<string, ContentNode>
  >;

  /** このTreeが所有する子Component Instance。 */
  readonly componentInstances: Readonly<
    Record<string, ComponentInstance>
  >;
}

/** Application UIの1画面を表すPage Definition。 */
export interface UIPage {
  /** 固定UI Page ID。 */
  readonly id: string;

  /** Editor上の表示名。 */
  readonly name: string;

  /** Page直下へ配置したComponent Instance。 */
  readonly componentInstances: Readonly<
    Record<string, ComponentInstance>
  >;
}

/** Projectが保持するUI Page Collection。 */
export interface UIDocument {
  /** UI Page IDをKeyとするPage Collection。 */
  readonly pages: Readonly<
    Record<string, UIPage>
  >;
}
