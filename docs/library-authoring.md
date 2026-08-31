# Component Libraryの作り方

FlagShipのComponent Libraryは、UI Node DefinitionとFlow Graph Definitionをまとめて配布する単位である。Component Definition自体はUI上に存在せず、配置時にComponent Instanceから参照する。Overlay SurfaceではOverlay InstanceがComponent Instanceを包む。

## 1. Libraryの種類

| 種類 | 用途 | 保存場所 |
|---|---|---|
| FlagShip Base | 標準Componentを提供するPublic Library | Repository内のLibrary Catalog |
| Public Library | Themeや再利用Component群を追加する | Repository内のLibrary Catalog |
| Local | 作業中Projectだけで使用する | Project Documentの`localLibrary` |

Baseは特別な実行形式ではなく、標準で導入されるPublic Libraryである。Editorには内部区分ではなくLibrary名を表示する。

## 2. 最小Component

Component DefinitionはStable ID、Version、UI、Overlay、Flowを明示する。すべてのUI Nodeは`visible`を省略でき、省略時は表示する。

```ts
import type { Component } from "../core/model/component";

export const badgeComponent: Component = {
  id: "component-acme-badge",
  name: "Badge",
  version: "1.0.0",
  contentTree: {
    rootNodeId: "content-node-acme-badge",
    nodes: {
      "content-node-acme-badge": {
        id: "content-node-acme-badge",
        name: "Badge",
        type: "text",
        value: "Badge",
        state: {},
        slots: [],
        children: [],
        layout: null,
        size: {
          width: { type: "fit" },
          height: { type: "fit" },
        },
      },
    },
    componentInstances: {},
  },
  overlayTrees: {},
  flowGraphs: {},
};
```

`contentTree`を持たないModal等のOverlay専用Componentでは`contentTree: null`とし、`overlayTrees`へ1つ以上のOverlay Treeを定義する。
Overlay専用ComponentはPageのOverlay Surface直下へ配置する。別ComponentのNamed Slotへは配置できない。

## 3. Named Slot

子Componentを受け入れる場所はNamed Slotとして定義する。Default Slot、空文字のSlot ID、暗黙の子配置は使用しない。

```ts
const cardRoot = {
  id: "content-node-acme-card",
  name: "Card",
  type: "container" as const,
  state: {},
  slots: [
    { id: "header", name: "Header" },
    { id: "content", name: "Content" },
  ],
  children: [],
  layout: { type: "slot" as const },
  size: {
    width: { type: "fill" as const },
    height: { type: "fit" as const },
  },
};
```

EditorではLibrary ComponentをLayersツリーのSlot行へDrag and Dropして子Instanceを追加する。

## 4. Component固有Flow

Componentと一緒に再利用するBehaviorは`flowGraphs`へ保存する。実行順序は`edges`で表し、EditorはEdgeの向きからフローチャートの階層と接続線を表示する。

```ts
flowGraphs: {
  "flow-acme-initialize": {
    id: "flow-acme-initialize",
    name: "Initialize",
    nodes: [
      {
        id: "flow-node-acme-value",
        type: "data.constant",
        config: { value: "ready" },
        inputs: {},
        outputs: { value: "" },
        metadata: { x: 24, y: 24 },
      },
    ],
    edges: [],
  },
}
```

現時点のRuntimeで実行できるNodeは`data.constant`、`trigger.ui-event`、`trigger.page-load`、`trigger.schedule`、`state.set`である。Project Flowでは対象Component InstanceをGraph Local Variableへ登録し、Nodeの`variableId`から参照する。Modalの開閉も専用Actionではなく、Modal Root UI Nodeの`open` Stateを`state.set`で更新する。Triggerを持つFlowはPreview上のEventから実行する。未対応Nodeは成功扱いにせず、実行結果へ`UNSUPPORTED_FLOW_NODE_TYPE`を表示する。

ProjectのFlow EditorでNodeを追加すると、直前のNodeから新しいNodeへEdgeが作られる。分岐を含む既存Flow Graphは、同じ階層のNodeを横並びで表示する。

## 5. Public Libraryへの登録

Library定義を作り、`src/library/component-catalog.ts`の`libraries`へ登録する。

```ts
import type { ExternalComponentLibrary } from "../core/model/component";
import { badgeComponent } from "./acme-components";

export const acmeLibrary: ExternalComponentLibrary = {
  kind: "public",
  id: "library-acme-theme",
  name: "Acme Theme",
  version: "1.0.0",
  assets: {
    [badgeComponent.id]: badgeComponent,
  },
};
```

CatalogのKey、Libraryの`id`、Component CollectionのKey、Componentの`id`はそれぞれ一致させる。既存Projectは取り込み時のLibrary VersionとComponent Snapshotを保持するため、Library更新で暗黙に変更されない。

## 6. Local Libraryへの追加

Project固有Componentは`ProjectDocument.components.localLibrary.assets`へ保存する。形式はPublic LibraryのComponentと同じであり、EditorではLibrary名`Local`として表示する。

## 7. 検証

RepositoryのDocker環境内で次を実行する。

```powershell
docker compose run --rm editor npm run check
docker compose run --rm editor npm test
docker compose run --rm editor npm run build
```

`check`はTypeScriptとSvelteの型を、`test`はModelとRuntimeの振る舞いを、`build`は製品Bundleを生成できることを確認する。
