# Architecture: Product Overview

> [Architecture Index](./README.md) · Previous: [Index](./README.md) · Next: [Core Principles](./02-core-principles.md)
>
> Covers: Section 1, Section 2

---

## 1. Overview

### 1.1 Purpose

FlagShipは、Web ApplicationのUI、Flow、State、外部Resource連携を視覚的に設計し、Browserで動作する静的Frontendを生成するVisual Application Builderである。

編集対象の正本はHTMLやDOMではなく、構造化されたProject Documentとする。

```mermaid
flowchart LR
    Editor["Editor"] --> Project["Project Document"]
    Project --> Preview["Preview"]
    Project --> Exporter["Exporter"]
    Exporter --> App["Static Frontend"]
```

Project Documentは次のModelを統合する。

```text
Project Document
├─ UI Document
│  └─ UI Page
│     └─ Component Instance
├─ Flow Document
│  └─ Flow Graph
│     └─ Flow Node
├─ State
├─ Resources
├─ Components
└─ Settings
```

Editor、Preview、Exporterは同じProject Documentと同じRuntime Semanticsを利用する。

### 1.2 Representative Application Example

User Management Applicationを例とする。

```mermaid
flowchart LR
    Form["User Form<br/>Name / Email / Save Button"]
    Save["Save User Flow"]
    API["POST /users"]
    State["state.user"]
    Notice["Success Snackbar"]

    Form -->|"SaveButton.click"| Save
    Save --> API
    API --> State
    State --> Notice
```

この例では、UIは構造、Flowは振る舞い、Stateは共有値、Resourceは外部接続を担当する。

## 2. Product Concept

### 2.1 ProjectをSingle Source of Truthとする

Applicationの正本はProject Documentである。

```text
Project Document
├─ Editor # Commandを通して編集する
├─ Preview # Runtimeとして実行する
└─ Exporter # 静的Frontendを生成する
```

DOM、生成済みHTML、Svelte State、Editor View StateをApplicationの正本にしない。

### 2.2 UI DocumentはUI Pageを保持する

UI DocumentはUI Pageの配列を持つ。UI Pageは画面単位であり、配置されたComponent InstanceとPage設定を保持する。

```text
UI Document
└─ UI Page[]
   ├─ id
   ├─ name
   ├─ componentInstances[]
   └─ settings
```

UI PageはRuntimeでContent SurfaceとOverlay Surfaceを1つずつ持つ。SurfaceのDOMや計算済み座標は永続化しない。

### 2.3 ComponentはUIとFlowを一体で再利用する

ComponentはLibraryが提供するVersion付きAssetであり、UIとその内部Behaviorをまとめて再利用する単位である。

Component Selectorでは、Componentの選択元をLibrary名で区別する。

```text
Component Libraries
├─ Installed Libraries # Project外から導入済みのLibrary
│  ├─ FlagShip Base # 標準搭載されるLibrary
│  └─ Additional Library # Userが追加導入するLibrary
└─ Local # 現在のProjectだけで作成・編集する永続Library
```

Installed LibraryはProject外の同じCatalogで管理する。選択したComponentの固定VersionをProjectへSnapshotとして取り込む。LocalはProject固有だがEditor Sessionだけの一時Dataではなく、Project Documentへ保存し、再読込、Preview、Exportの対象とする。

```text
Component
├─ id
├─ version
├─ contentTree # 単一UI Tree
├─ allowedSurface # content | overlay
└─ flowGraphs # 0..n
```

例えば時計Componentは表示用Content Treeに加え、初期化Flow Graphと1秒間隔の更新Flow Graphを持てる。

Projectは利用するComponentの特定Versionを取り込む。Library側の更新によって既存Projectの意味が暗黙に変化してはならない。

### 2.4 Component Instanceは配置された実体を表す

Component Instanceは、ComponentをUI Pageへ配置した実体である。

```text
Component Instance
├─ id # Page上の実体ID
├─ componentId
├─ componentVersion
└─ initialValues
```

Component内部のContent Node、Flow Graph、StateはComponent Instance PathをScopeとして識別する。同じComponentを複数配置しても内部IDは衝突しない。

### 2.5 Content Treeは通常UIを表す

Content TreeはContent Nodeを根とするUI Treeである。ComponentはContent Treeを1個だけ持ち、Root配下のNodeは任意の深さにネストできる。

```text
Content Tree
└─ Content Node
   ├─ id
   ├─ type
   ├─ props
   ├─ state
   ├─ slots
   ├─ layout
   ├─ size
   └─ children[]
```

通常Layoutでは絶対座標を保存せず、Stack、Grid、Slot等の構造として保存する。

### 2.6 OverlayはComponent Instanceの配置先である

Overlay用Componentも通常Componentと同じ単一Content Treeを持つ。違いは`allowedSurface = overlay`の配置制約と、配置されたComponent Instanceが持つOverlay表示設定だけである。

```text
Overlay Component Instance
├─ surface = overlay
├─ overlay.alignment
├─ overlay.contentBlock
├─ state
└─ children
```

Modal、Popover、Snackbarは専用Node種別や専用Instance型ではなく、Content Tree、配置制約、State、Flow Graphを組み合わせたComponentである。

BackdropやModal WindowもContent Nodeとして表し、表示位置はPositioning Ruleで決める。

### 2.7 Pageが物理Render Surfaceを所有する

Componentが持つContent Treeは論理構造である。物理的な描画先はUI Pageが所有する。

```mermaid
flowchart TB
    Page["UI Page"]
    ContentInstance["Component Instance Tree"]
    OverlayComponent["Component Instance<br/>surface=overlay"]
    PageContent["Page Content Surface"]
    PageOverlay["Page Overlay Surface"]

    Page --> ContentInstance
    Page --> OverlayComponent
    ContentInstance -.->|"render"| PageContent
    OverlayComponent -.->|"when active"| PageOverlay
```

Overlay RootはComponent Instanceを直接所有し、Page Overlay Surfaceへ描画する。表示状態はRoot UI NodeのRuntime Stateで管理し、Overlay Surfaceはその値を読んで描画する。

### 2.8 StateとSlotはContent Nodeが持つ

StateとSlotはComponent直下の別Collectionにせず、それを利用するContent Nodeへ置く。

```text
Content Node
├─ state
│  ├─ values
│  └─ bindings
└─ slots
   ├─ header
   ├─ content
   ├─ fields
   └─ footer
```

Slotは子Content Nodeの挿入先を表す構造概念であり、Flowを保持しない。`actions` はFlow Actionと混同するためSlot名に使わない。

入力途中の値やValidation結果等、Component Instanceごとに独立すべき値は、そのInstance内のContent Node Stateとして扱う。Application全体で共有する値はProject Stateとして扱う。

### 2.9 UIとFlowを分離して参照で接続する

Content Nodeへ任意JavaScriptを埋め込まない。Flow GraphがTriggerから始まるBehaviorを表す。

```mermaid
flowchart LR
    Button["Content Node<br/>Save Button"]
    Trigger["Flow Node<br/>UI Event Trigger"]
    Validate["Flow Node<br/>Validate"]
    Request["Flow Node<br/>POST /users"]

    Button -.->|"structured reference"| Trigger
    Trigger --> Validate --> Request
```

Project共通のFlow GraphはFlow Documentが保持し、Component固有のFlow GraphはComponentが保持する。

### 2.10 FlowをStructured Graphとして保存する

```text
Flow Document
└─ Flow Graph[]
   ├─ id
   ├─ nodes[]
   └─ edges[]
```

Flow NodeはTrigger、Action、Logic、Data、Timing、Control等の実行単位である。実行時には永続Modelを変更せず、Flow Executionを生成する。

```text
Flow Graph # Persistent
└─ Flow Execution # Runtime, concurrent instances allowed
```

### 2.11 State、Resource、Expressionを分離する

- StateはApplication、Component Instance内のContent Node、Flow ExecutionのScopeを明示する。
- ResourceはREST API等の接続先と通信設定を保持し、Flow GraphはResource IDを参照する。
- Expressionは任意JavaScript文字列ではなく、検証可能なStructured ASTとして保持する。
- SecretはProject Documentや生成Frontendへ保存しない。

### 2.12 Editorは実UIと同じRendererを使用する

Editor ModeとRuntime Modeは同じUI ModelとRendering Ruleを利用する。

```mermaid
flowchart TB
    Project["Project Document"] --> Renderer["Shared Renderer"]
    Renderer --> Editor["Editor Mode"]
    Renderer --> Runtime["Runtime Mode"]
    Editor --> DOM1["Application DOM"]
    Runtime --> DOM2["Application DOM"]
    Interaction["Editor Interaction Surface"] -.-> Editor
```

Selection Border、Drop Indicator、Resize Handle等はEditor専用のInteraction Surfaceへ描画し、Application DOMへ混ぜない。

### 2.13 Generated Applicationの境界

生成物はBrowser JavaScriptで動作する静的Frontendとする。

```text
Generated Application
├─ index.html
├─ app.js
├─ runtime.js
├─ styles.css
├─ project-data.js
└─ assets/
```

REST API、CORS、認証、永続Storage、確実なServer Scheduleは外部Backendの責務とする。Browserが閉じている間のSchedule実行をFrontendだけで保証しない。

### 2.14 Productの最終構成

```mermaid
flowchart TB
    subgraph Builder["Visual Application Builder"]
        UIEditor["UI Editor"]
        FlowEditor["Flow Editor"]
        StateEditor["State Editor"]
        ResourceEditor["Resource Editor"]
        InstalledLibrary["Installed Libraries<br/>including FlagShip Base"]
        LocalLibrary["Local"]
        Validator["Validator"]
        Preview["Preview Runtime"]
        Exporter["Static Exporter"]
    end

    InstalledLibrary -->|"import exact version"| UIEditor
    LocalLibrary <-->|"project-local edit"| UIEditor
    UIEditor --> Validator
    FlowEditor --> Validator
    StateEditor --> Validator
    ResourceEditor --> Validator
    Validator --> Preview
    Validator --> Exporter

    Exporter --> Output["Static Frontend<br/>HTML / CSS / JavaScript / Assets"]
```

---

Previous: [Index](./README.md) · [Architecture Index](./README.md) · Next: [Core Principles](./02-core-principles.md)
