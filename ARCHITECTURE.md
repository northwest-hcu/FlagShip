# Visual UI & Flow Builder Architecture Design

> Status: Draft / Architecture Baseline  
> Target: Static Frontend Generator + Visual UI Editor + Visual Flow Editor  
> Editor Framework: Svelte 5  
> Runtime UI: Web Components  
> Runtime Core: Framework-independent TypeScript / JavaScript  
> Output: Static HTML / CSS / JavaScript + REST API integration

---

# 1. Overview

## 1.1 Purpose

本システムは、実際にブラウザ上で動作するWeb ApplicationのUI構造・状態・振る舞い・外部API連携を視覚的に設計・編集し、最終的に静的Frontendとして出力するVisual Application Builderである。

ユーザーが視覚的に編集できる対象

```
Application
├─ UI # Applicationの見た目・DOM構造・レイアウト・入力・表示を定義する
│  ├─ Structure # UIの論理階層と意味的なまとまりを構成する
│  │  ├─ Page # Application内の画面単位
│  │  ├─ Section # Page内の意味的な領域
│  │  ├─ Container # 子要素を保持する汎用コンテナ
│  │  ├─ Group # 複数要素を論理的にまとめる
│  │  ├─ Form # 入力要素と関連処理をまとめるフォーム領域
│  │  └─ Component Instance # 再利用可能Componentの配置インスタンス
│  │
│  ├─ Layout # 子要素をどのような規則で配置するかを定義する
│  │  ├─ Vertical Stack # 子要素を上から下へ並べる
│  │  ├─ Horizontal Stack # 子要素を左から右へ並べる
│  │  ├─ Grid # 行・列構造で子要素を配置する
│  │  ├─ Slot # Componentが定義した名前付き挿入領域
│  │  ├─ Spacer # Layout内に意図的な余白を設ける
│  │  └─ Divider # 要素間の視覚的・構造的な区切り
│  │
│  ├─ Content # ユーザーへ情報を表示する
│  │  ├─ Text # 一般的な文字列表示
│  │  ├─ Heading # 見出し
│  │  ├─ Paragraph # 段落
│  │  ├─ Label # 入力要素等に関連付けるラベル
│  │  ├─ Badge # 状態や分類を短い文字列で表示する
│  │  ├─ List # 複数の情報を一覧表示する
│  │  ├─ Code # コードや整形済みテキストを表示する
│  │  └─ Quote # 引用情報を表示する
│  │
│  ├─ Input # ユーザーから値を受け取るUI
│  │  ├─ Text Input # 1行テキスト入力
│  │  ├─ Textarea # 複数行テキスト入力
│  │  ├─ Select # 選択肢から値を選択する
│  │  ├─ Checkbox # 真偽値や複数選択を扱う
│  │  ├─ Radio # 排他的な単一選択を扱う
│  │  ├─ Switch # ON / OFF状態を切り替える
│  │  ├─ Slider # 数値等を範囲から選択する
│  │  ├─ Date Input # 日付・時刻を入力する
│  │  ├─ File Input # ファイルを選択する
│  │  └─ Search Input # 検索用途の入力を行う
│  │
│  ├─ Action # ユーザー操作を受け取りFlow等のTriggerとなるUI
│  │  ├─ Button # 一般的な操作ボタン
│  │  ├─ Icon Button # アイコンを主体とする操作ボタン
│  │  ├─ Link # Page遷移や外部URL遷移を行う
│  │  ├─ Menu Button # MenuやPopoverを開く操作要素
│  │  └─ Split Button # 主操作と補助操作を分けて提供する
│  │
│  ├─ Data Display # 構造化されたデータを表示するUI
│  │  ├─ Card # 関連情報をひとまとまりとして表示する
│  │  ├─ Table # 行・列形式でデータを表示する
│  │  ├─ Data Grid # 高機能な表形式データを表示・操作する
│  │  ├─ List View # レコードを縦方向に一覧表示する
│  │  ├─ Tree # 階層データを表示する
│  │  ├─ Description List # 項目名と値の組み合わせを表示する
│  │  ├─ Timeline # 時系列情報を表示する
│  │  └─ Pagination # 大量データを複数ページに分割して移動する
│  │
│  ├─ Navigation # Application内の画面・領域・状態を移動するためのUI
│  │  ├─ Tabs # 同一領域内の表示内容を切り替える
│  │  ├─ Breadcrumb # 現在位置と階層を示す
│  │  ├─ Navigation Menu # Application内の主要な移動先を表示する
│  │  ├─ Sidebar Navigation # Sidebar形式のナビゲーション
│  │  ├─ Stepper # 複数ステップの進行状況と移動を扱う
│  │  └─ Pagination # ページ単位のデータ移動を行う
│  │
│  ├─ Overlay # 通常のContent Layoutから独立して表示されるUI
│  │  ├─ Modal # 背景操作を抑止し、前面で操作を要求する
│  │  ├─ Dialog # 確認・入力など一時的な対話を行う
│  │  ├─ Drawer # 画面端から展開する補助領域
│  │  ├─ Popover # 特定要素を基準に一時的な内容を表示する
│  │  ├─ Dropdown # Anchor要素に関連する選択肢を表示する
│  │  ├─ Menu # 操作候補を一覧表示する
│  │  ├─ Context Menu # 対象要素に依存した操作候補を表示する
│  │  └─ Tooltip # 対象要素の補助説明を表示する
│  │
│  ├─ Feedback # Applicationの状態や処理結果をユーザーへ通知するUI
│  │  ├─ Snackbar # 短時間の操作結果通知を表示する
│  │  ├─ Toast # 一時的な非同期通知を表示する
│  │  ├─ Alert # 重要な状態や注意事項を表示する
│  │  ├─ Banner # 画面内の広い領域で継続的な通知を表示する
│  │  ├─ Progress # 処理の進捗状況を表示する
│  │  ├─ Spinner # 処理中であることを表示する
│  │  ├─ Skeleton # コンテンツ読み込み中のPlaceholderを表示する
│  │  ├─ Empty State # データが存在しない状態を表示する
│  │  └─ Error State # エラー状態と復旧方法を表示する
│  │
│  ├─ Media # 画像・音声・映像等のメディアを表示するUI
│  │  ├─ Image # 画像を表示する
│  │  ├─ Icon # アイコンを表示する
│  │  ├─ Avatar # ユーザーやEntityを表す画像を表示する
│  │  ├─ Video # 動画を表示・再生する
│  │  ├─ Audio # 音声を再生する
│  │  ├─ Canvas # 描画領域を提供する
│  │  └─ Map # 地理情報を表示する
│  │
│  └─ Custom Component # 標準Component以外の追加UIを利用する
│     ├─ Registered Web Component # Component Registryへ登録されたWeb Component
│     ├─ Project Component # Project内で定義した再利用可能Component
│     └─ External Component # 外部Library等から提供されるComponent
│
├─ Flow # Triggerを起点としてApplicationの振る舞いを定義する
│  ├─ Trigger # Flowを開始する契機を定義する
│  │  ├─ UI Event # UI Component上で発生するイベントを起点とする
│  │  │  ├─ Click # 要素がクリックされたときに開始する
│  │  │  ├─ Input # 入力値が変化している最中に開始する
│  │  │  ├─ Change # 入力値が確定・変更されたときに開始する
│  │  │  ├─ Submit # Formが送信されたときに開始する
│  │  │  ├─ Focus # 要素がFocusされたときに開始する
│  │  │  ├─ Blur # Focusが外れたときに開始する
│  │  │  └─ Custom Event # Web Component等が公開する独自イベントで開始する
│  │  │
│  │  ├─ Lifecycle Event # ApplicationやPage等のライフサイクルを起点とする
│  │  │  ├─ App Load # Application起動時に開始する
│  │  │  ├─ Page Load # Page表示時に開始する
│  │  │  └─ Component Mount # Component生成時に開始する
│  │  │
│  │  ├─ State Event # Application Stateの変更を起点とする
│  │  │  └─ State Change # 指定Stateの変更時に開始する
│  │  │
│  │  └─ Timing Event # 時間条件を起点とする
│  │     ├─ Delay # 指定時間経過後に開始する
│  │     ├─ Interval # 一定間隔で開始する
│  │     ├─ Foreground Schedule # Application起動中に指定時刻条件で開始する
│  │     └─ Server Schedule # Backend Scheduler等による実行を前提とする
│  │
│  ├─ UI Action # UI ComponentやOverlayに対して副作用を発生させる
│  │  ├─ Show # UIを表示する
│  │  ├─ Hide # UIを非表示にする
│  │  ├─ Enable # 操作可能状態にする
│  │  ├─ Disable # 操作不能状態にする
│  │  ├─ Focus # 指定要素へFocusを移す
│  │  ├─ Scroll # 指定位置またはComponentへスクロールする
│  │  ├─ Set Property # Componentの公開Propertyを変更する
│  │  └─ Overlay Action # Overlay Surface上のUIを操作する
│  │     ├─ Open Modal # Modalを表示する
│  │     ├─ Close Modal # Modalを閉じる
│  │     ├─ Open Drawer # Drawerを表示する
│  │     ├─ Close Drawer # Drawerを閉じる
│  │     ├─ Open Popover # Popoverを表示する
│  │     ├─ Close Popover # Popoverを閉じる
│  │     ├─ Show Snackbar # Snackbarを表示する
│  │     └─ Show Toast # Toastを表示する
│  │
│  ├─ Resource Action # Application外部のResourceへアクセスする
│  │  ├─ REST API Request # HTTP経由でREST APIを呼び出す
│  │  │  ├─ GET # Resourceを取得する
│  │  │  ├─ POST # Resourceを新規作成または処理要求する
│  │  │  ├─ PUT # Resource全体を更新する
│  │  │  ├─ PATCH # Resourceの一部を更新する
│  │  │  └─ DELETE # Resourceを削除する
│  │  ├─ Upload # ファイル等を外部Resourceへ送信する
│  │  ├─ Download # 外部Resourceからデータやファイルを取得する
│  │  ├─ WebSocket Send # WebSocket経由でMessageを送信する
│  │  └─ SSE Subscribe # Server-Sent Eventsを購読する
│  │
│  ├─ State Action # Application Stateを更新する
│  │  ├─ Set # Stateへ値を設定する
│  │  ├─ Merge # Object等へ値を統合する
│  │  ├─ Clear # Stateを初期化・削除する
│  │  ├─ Toggle # Boolean Stateを反転する
│  │  ├─ Increment # 数値を増加させる
│  │  ├─ Decrement # 数値を減少させる
│  │  ├─ Append # Arrayへ値を追加する
│  │  └─ Remove # Array等から値を削除する
│  │
│  ├─ Navigation Action # Application内外の移動を行う
│  │  ├─ Navigate # 指定PageやURLへ移動する
│  │  ├─ Back # 履歴上の前画面へ戻る
│  │  ├─ Forward # 履歴上の次画面へ進む
│  │  ├─ Reload # 現在のPageを再読み込みする
│  │  ├─ Open External URL # 外部URLを開く
│  │  └─ Set Query Parameter # URL Queryを変更する
│  │
│  ├─ Logic # Flowの実行経路を条件によって分岐する
│  │  ├─ Condition # 真偽条件によって分岐する
│  │  ├─ Switch # 値に応じて複数経路へ分岐する
│  │  └─ Guard # 条件を満たさない場合に後続処理を停止する
│  │
│  ├─ Data # Flow内で使用する値を加工・変換する
│  │  ├─ Set Variable # Flow Local Variableへ値を設定する
│  │  ├─ Transform # 入力データを別形式へ変換する
│  │  ├─ Map # Collection各要素を変換する
│  │  ├─ Filter # 条件に一致する要素だけを抽出する
│  │  ├─ Pick # Objectから指定Propertyを抽出する
│  │  ├─ Merge # 複数Object等を統合する
│  │  ├─ Format # 文字列・日付・数値等を整形する
│  │  ├─ Calculate # 数値計算や式評価を行う
│  │  └─ Parse # JSON等の入力を構造化データへ変換する
│  │
│  ├─ Timing # Flow途中の時間制御を行う
│  │  ├─ Wait # 指定時間処理を待機する
│  │  ├─ Delay # 後続処理を遅延実行する
│  │  ├─ Debounce # 短時間に連続する実行をまとめる
│  │  └─ Throttle # 一定時間内の実行頻度を制限する
│  │
│  └─ Control # Flowそのものの実行方法を制御する
│     ├─ Parallel # 複数の処理を並列実行する
│     ├─ For Each # Collectionの各要素に対して処理する
│     ├─ Retry # 失敗した処理を再試行する
│     ├─ Error Handler # Error発生時の処理を定義する
│     ├─ Cancel # Flowまたは非同期処理を中止する
│     ├─ Subflow # 別Flowを呼び出す
│     └─ Return # Flowを終了し値を返す
│
├─ Data / State # UIとFlowが参照・変更するApplication Dataを定義する
│  ├─ Application State # Application全体で共有する状態
│  ├─ Page State # 特定Pageに属する状態
│  ├─ Component State # Component固有の状態
│  ├─ Flow Variables # Flow実行中だけ存在する一時変数
│  ├─ Flow Outputs # 各Flow Nodeの実行結果
│  ├─ Event Data # TriggerからFlowへ渡されるEvent情報
│  └─ Environment Values # Development / Production等で切り替える環境値
│
├─ Resources # Applicationが接続する外部Resourceを定義する
│  ├─ REST Resource # REST APIのBase URLや共通設定を定義する
│  ├─ Static Resource # 静的データやAsset等を定義する
│  ├─ WebSocket Resource # WebSocket接続情報を定義する
│  ├─ SSE Resource # Server-Sent Events接続情報を定義する
│  └─ Future Resource Type # 将来的なResource拡張のためのExtension Point
│
├─ Components # UI Builderで利用可能なComponentの定義・再利用単位を管理する
│  ├─ Built-in Components # システム標準で提供するComponent
│  ├─ Registered Web Components # 外部または独自Web Componentを登録する
│  ├─ Project Components # Project内で作成した再利用可能Component
│  └─ Component Metadata # Props / Slots / Events / Actions等のEditor向け定義
│
└─ Application Behavior # UI・Flow・State・Resourceを組み合わせたApplication全体の動作関係
   ├─ UI Event → Flow # UIイベントをFlow Triggerへ接続する
   ├─ Flow → UI # FlowからModalやSnackbar等を操作する
   ├─ Flow → State # FlowからApplication Stateを変更する
   ├─ Flow → Resource # FlowからREST API等へアクセスする
   ├─ Resource → Data → UI # API Response等を加工してUIへ反映する
   └─ Navigation → Page # FlowによってApplication内のPageを切り替える
```

生成されるStatic Frontend

```
Static Frontend
├─ HTML # ApplicationのDocument構造
├─ CSS # Layout・Theme・Component Style
├─ JavaScript # Application全体をブラウザ上で実行するコード
│  ├─ Flow Engine # Flow定義を解釈・実行する
│  ├─ State Store # Application Stateを保持・更新・通知する
│  ├─ Resource Client # fetch等を利用してREST API等へアクセスする
│  ├─ UI Controller # UI Componentの表示・状態・Actionを制御する
│  ├─ Component Registry # Web Componentsの定義・Metadata・公開APIを管理する
│  └─ Application Definition # UI・Flow・State・Resource等の生成済みProject定義
├─ Web Components # 実際のUI Component
└─ Assets # Image・Icon等の静的Asset
```

生成Applicationの実行環境

```
Browser
├─ Chrome
├─ Safari
├─ Brave
├─ Firefox
└─ WebView
```

生成Applicationが利用する標準Web API

```
Web Platform
├─ DOM API # UI構造とElement操作
├─ Custom Elements # Web Componentsの登録・利用
├─ EventTarget / CustomEvent # UI EventとFlow Triggerのイベント基盤
├─ Fetch API # REST API等へのHTTPアクセス
├─ AbortController # Requestや非同期Flowの中断
├─ URL / URLSearchParams # URLおよびQuery Parameter操作
├─ History API # Client-side Navigation
├─ localStorage / sessionStorage # Browser Local Stateの永続化
├─ Promise / async / await # 非同期処理
└─ Standard Form APIs # Formおよび入力要素の操作
```

生成経路

```
Project
├─ UI
├─ Flow
├─ Data / State
├─ Resources
└─ Components
   ↓
Editor / Preview
   ↓
Exporter
   ↓
Static Frontend
├─ HTML
├─ CSS
├─ JavaScript
├─ Web Components
└─ Assets
   ↓
Browser
├─ Chrome
├─ Safari
├─ Brave
├─ Firefox
└─ WebView
   ↓
REST API / External Resources
```

実行時の技術方針

```
Browser Runtime Policy
├─ 標準Web APIを優先する
├─ Experimental APIを必須依存にしない
├─ 特定Browser固有APIを必須依存にしない
├─ Browser差異がある場合はFeature Detectionを行う
├─ 必要に応じてFallbackを提供する
└─ 必要な場合のみ軽量PolyfillをBuild時に含める

Framework Boundary

Editor
└─ Svelte 5 # Editor View Layerの実装に使用する

Generated Application
├─ Svelte Runtime不要
├─ React Runtime不要
├─ Node.js Runtime不要
└─ Server-side Runtime不要
```

### 1.2 Representative Application Example

本システムで構築するApplicationの代表例を以下に示す。
個々の機能ではなく、UI・Flow・State・Resourceが1つのApplicationとして統合されることを示すための例である。

```text
Example Application # Visual Application Builderで構築する典型的なBrowser Application
└─ User Management App
   ├─ UI # Userが操作するApplication UI
   │  ├─ User List
   │  ├─ User Form
   │  └─ Success Snackbar
   ├─ Flow # UI Eventから始まるApplication Behavior
   │  └─ SaveButton.click → POST /users → State Update → Snackbar
   ├─ State # Application内で共有するData
   │  ├─ users
   │  ├─ currentUser
   │  └─ form
   └─ Resources # Applicationが利用する外部Resource
      └─ Backend REST API
```

---

## 2. Product Concept

本システムは、実際にブラウザ上で動作するWeb ApplicationのUI構造・状態・振る舞い・外部Resource連携を視覚的に設計し、静的Frontendとして生成するVisual Application Builderである。

単なるHTML Builder、Design Canvas、Code Generatorではなく、Applicationを構成するModelを統合的に編集する。

```text
Project
├─ UI Document # UIの論理構造、Layout、Component、Presentationを定義する
├─ Flow Document # Triggerを起点としたApplication Behaviorを定義する
├─ Data / State # UIとFlowが参照・更新する値を定義する
├─ Resources # REST API等の外部接続先と通信設定を定義する
├─ Components # Built-in / Web Component / Project Componentを定義する
└─ Settings # Project全体の設定、環境、Build条件等を保持する
```

### 2.1 ProjectをSingle Source of Truthとする

Applicationの正本はHTML、DOM、Svelte Component TreeではなくProject Documentとする。

```text
Project
├─ Editor # Projectを視覚的に編集する
├─ Preview # ProjectをBrowser上で実行する
└─ Exporter # ProjectからStatic Frontendを生成する
```

Editor、Preview、Exporterは同一のProject Definitionを参照する。

Editor専用DocumentとProduction専用Documentを別々に持たない。

### 2.2 UIは構造化されたApplication UIとして扱う

UIはCanvas上の矩形集合ではなく、SemanticなLogical Treeとして保持する。

```text
Page
└─ UserForm
   ├─ NameInput
   ├─ EmailInput
   ├─ Actions
   │  ├─ CancelButton
   │  └─ SaveButton
   ├─ ValidationPopover
   └─ SuccessSnackbar
```

各UI Nodeは以下の情報を持つ。

```text
UINode
├─ id # Project内で安定した一意ID
├─ type # Component Definitionを参照するComponent Type
├─ parent / children # Logical Ownership
├─ slot # Parent Component内の挿入先
├─ props # Componentへ渡す公開Property
├─ layout # 子要素の配置規則
├─ size # fit / fill / fixed / fraction等のSemantic Size
└─ presentation # Content / Overlay等の描画条件
```

UIの保存形式としてDOM HTMLやCSS class文字列を正本にしない。

### 2.3 UI配置は構造編集として扱う

通常UIでは絶対座標を保存しない。

```text
Layout
├─ Stack
│  ├─ Vertical
│  └─ Horizontal
├─ Grid
├─ Slot-defined Layout
└─ Overlay
```

Editor上ではNotionのようにDrag & Dropできるが、Drop完了後は必ずDocument構造へ変換する。

```text
Drop Intent
├─ before # 同一Layout内で対象の直前へ挿入
├─ after # 同一Layout内で対象の直後へ挿入
├─ inside # Container内部へ挿入
├─ slot # 指定Component Slotへ挿入
└─ split # 新しいVertical / Horizontal Layoutを生成して配置
```

Pointer座標、Drag Ghost座標、Hit Test用Rect等はEditor Temporary StateでありProjectへ保存しない。

### 2.4 Logical OwnershipとRender Destinationを分離する

UI Nodeの所属先と実DOM上の描画先は別概念とする。

```text
Logical Tree
└─ UserForm
   ├─ SaveButton
   ├─ ValidationPopover
   └─ SuccessSnackbar
```

```text
Render Surfaces
├─ Content Surface
│  └─ UserForm
└─ Overlay Surface
   ├─ ValidationPopover
   └─ SuccessSnackbar
```

ValidationPopoverやSnackbarがOverlay Surfaceへ描画されてもLogical ParentはUserFormのままとする。

これによりLogical Ownership単位で以下を扱える。

```text
Ownership Operations
├─ Copy
├─ Paste
├─ Duplicate
├─ Delete
├─ Reuse
├─ Componentization
├─ Undo / Redo
└─ Import / Export
```

### 2.5 Render Surfaceを明示する

描画先をSurfaceとして定義する。

```text
Render Surfaces
├─ Application
│  ├─ Content Surface # 通常のDocument Layoutへ参加する
│  └─ Overlay Surface # 通常Layoutから独立して描画する
│     ├─ Anchored # Popover / Tooltip / Dropdown / Menu等
│     ├─ Modal # Modal / Dialog / Blocking Drawer等
│     └─ Notification # Snackbar / Toast等
└─ Editor
   └─ Interaction Surface # Selection / Drop Indicator等のEditor専用UI
```

`Layer` はLogical Treeやz-orderと混同するため、描画先には `Surface` を使用する。

### 2.6 Editorは実UIを直接編集する

Editor専用の疑似Componentを描画してProduction UIへ変換する方式は採用しない。

```text
UI Document
      ↓
Shared Renderer
   ┌──┴─────────────┐
   ▼                ▼
Editor Mode      Runtime Mode
   │                │
   └──── Real DOM ──┘
```

Editor Modeでは実DOMにEditor専用UIを外側から重ねる。

```text
Interaction Surface # Editor上の選択・ドラッグ・配置・サイズ変更などを補助する専用描画領域
├─ Selection Border # 現在選択されているUI Nodeの外周を示し、操作対象を明確にする
├─ Hover Outline # Pointerが現在どのUI Node上にあるかを示し、選択候補やDrop対象候補を可視化する
├─ Drop Indicator # Drag中に、Nodeが最終的にどこへ挿入されるかをbefore / after / inside等として示す
├─ Slot Indicator # Componentが持つNamed Slotの位置・範囲・Drop可否を可視化する
├─ Drag Preview # Drag中のNodeをPointer付近に仮表示し、移動対象を視覚的に示す
├─ Resize Handle # 選択Nodeのサイズ変更可能箇所を示し、Semantic Size変更操作を提供する
├─ Alignment Guide # 周囲のNodeやContainerとの揃い位置を補助表示する
└─ Spacing Guide # Node間のgap・padding・margin等の間隔を可視化し、Layout調整を補助する
```

Editor UIをApplication Component内部DOMへ挿入しない。

### 2.7 ComponentはPublic Contractを持つ

Editor、Flow Runtime、RendererはComponent内部DOMに依存しない。

```text
Component Definition
├─ type # Project上のComponent Type
├─ tag # Web Component Tag
├─ props # 公開Property
├─ slots # 子Nodeを受け入れるNamed Slot
├─ events # Flow Triggerとして使用可能なEvent
├─ actions # Flowから呼び出せる公開操作
├─ defaults # Default Property / Layout等
└─ presentation # Content / Overlay等の既定Presentation
```

例:

```text
ui-modal
├─ Properties
│  └─ open
├─ Slots
│  ├─ header
│  ├─ content
│  └─ actions
├─ Events
│  ├─ open
│  ├─ close
│  └─ confirm
└─ Actions
   ├─ open()
   └─ close()
```

FlowやEditorはShadow DOMやprivate DOM selectorを直接操作しない。

### 2.8 Slotを第一級概念とする

Component内部の子要素配置は単純なchildrenだけでなくNamed Slotを扱う。

```text
ui-card
├─ header
├─ content
└─ actions
```

Slot Definitionは以下を持つ。

```text
Slot Definition
├─ name
├─ acceptedTypes # Drop可能なComponent Type
├─ cardinality # 1件 / 複数件等
├─ layout # Slot内部のLayout
└─ required # 必須Slotかどうか
```

EditorはSlot Definitionを使ってDrop CandidateとDrop Indicatorを生成する。

### 2.9 UIとBehaviorを分離する

UI ComponentにBehaviorコードを直接埋め込まない。

避ける構造:

```text
Button
└─ onclick = arbitrary JavaScript
```

採用する構造:

```text
UI Document
└─ SaveButton

Flow Document
└─ SaveUserFlow
   └─ Trigger
      ├─ target = SaveButton
      └─ event = click
```

UIとFlowはStable Node IDでReferenceする。

UI Nodeは「何であるか」「どこに所属するか」を定義し、Flowは「いつ、何を実行するか」を定義する。

### 2.10 FlowをApplication Behavior Modelとして扱う

FlowはApplicationの振る舞いを表す独立したBehavior Modelとする。

Triggerから開始し、Action / Logic / Data / Timing / Control等のNodeをGraphとして接続する。

```text
Flow
├─ Trigger # Flowの開始条件
│  ├─ UI Event
│  ├─ Lifecycle Event
│  ├─ State Event
│  └─ Timing Event
├─ UI Action # UIへ副作用を発生させる
├─ Resource Action # REST API等の外部Resourceへアクセスする
├─ State Action # Application Stateを変更する
├─ Navigation Action # PageやURLを変更する
├─ Logic # 条件分岐を行う
├─ Data # 値の変換・加工を行う
├─ Timing # Flow途中の時間制御を行う
└─ Control # 並列・再試行・Subflow等の実行制御を行う
```

例:

```text
SaveButton.click
      ↓
Validate
      ↓
POST /users
      ↓
  Condition
   ├─ success
   │    ↓
   │  State Update
   │    ↓
   │  Snackbar Open
   │
   └─ error
        ↓
      Error Modal Open
```

Flow Editor上で表示されるGraphと、保存されるFlow Documentは同じ意味構造を持つ。

### 2.11 FlowはStructured Graphとして保存する

FlowをJavaScriptコードやイベントハンドラ文字列として保存せず、NodeとEdgeからなるStructured Graphとして保存する。

```text
Flow
├─ id # Flowの一意ID
├─ name # Editor上の表示名
├─ nodes # Flowを構成する処理Node
│  ├─ Trigger Node
│  ├─ Action Node
│  ├─ Logic Node
│  ├─ Data Node
│  ├─ Timing Node
│  └─ Control Node
└─ edges # Node間の実行経路
   ├─ default # 通常の次処理
   ├─ success / error # 成否による分岐
   ├─ true / false # 条件による分岐
   └─ Node固有Port # Switch等の複数出力
```

各Flow Nodeは少なくとも以下を持つ。

```text
Flow Node
├─ id # Flow内で一意なNode ID
├─ type # Node Type
├─ config # Node固有設定
├─ inputs # 入力Reference
├─ outputs # 実行結果として公開する値
└─ metadata # Editor表示等に必要な非実行情報
```

任意JavaScriptコード文字列をFlowの基本表現にしない。

### 2.12 Flow Execution Contextを明示する

Flow実行時の値をNamespaceで分離する。

```text
Flow Context
├─ event # Triggerから渡されたEvent Data
├─ state # Application / Page等のState
├─ variables # Flow Local Variable
├─ outputs # 先行NodeのOutput
└─ env # Environment Values
```

値参照はStable Structured Referenceとして保存する。

```text
state.form.email
outputs.createUser.id
event.detail.value
env.API_BASE_URL
```

### 2.13 ExpressionをASTとして保持する

ConditionやData Transformで任意JavaScriptを基本使用しない。

```text
AND
├─ GTE
│  ├─ state.user.age
│  └─ 18
└─ EQ
   ├─ state.enabled
   └─ true
```

これにより以下を可能にする。

```text
Expression Capabilities
├─ Visual Editing
├─ Validation
├─ Type Checking
├─ Static Analysis
├─ Migration
├─ Dependency Analysis
└─ Alternative Runtime / Compilerへの変換
```

Custom JavaScriptが将来必要になった場合は、通常Expressionとは分離した明示的なAdvanced / Escape Hatchとして扱う。

### 2.14 ResourcesをFlowから分離する

REST API等の接続情報を各Flowへ重複して保持しない。

```text
Resources
└─ backend
   ├─ type = REST
   ├─ baseUrl
   ├─ common headers
   ├─ auth policy
   └─ environment overrides
```

Flow側はResourceを参照する。

```text
HTTP Request
├─ resource = backend
├─ method = POST
├─ path = /users
├─ headers / query / body
└─ output = createdUser
```

Development / ProductionでResource設定を切り替えてもFlow Definitionは変更しない。

### 2.15 StateをScopeごとに分離する

Applicationで扱うState Scopeを分離する。

```text
State
├─ Application State # Application全体
├─ Page State # Page単位
├─ Component State # Component固有
├─ Flow Variables # Flow Execution単位
├─ Flow Outputs # Node実行結果
├─ Event Data # Trigger入力
└─ Environment Values # Environment依存値
```

Editor StateはApplication Stateと分離する。

```text
Editor State
├─ selectedNode
├─ hoveredNode
├─ dragging
├─ pointer
├─ dropIntent
├─ activePanel
├─ viewport
├─ zoom
└─ previewOverrides
```

### 2.16 PreviewとProductionで同じRuntime Coreを利用する

Editor Preview専用Behavior Engineを作らない。

```text
Project
   ↓
Browser Runtime Core
├─ Flow Engine
├─ State Store
├─ Resource Client
├─ UI Controller
├─ Component Registry
├─ Overlay Manager
└─ Expression Evaluator
   │
   ├─ Preview Mode
   └─ Production Mode
```

Preview固有機能はHookとして追加する。

```text
Preview Hooks
├─ Node Highlight
├─ Step Execution
├─ Flow Inspection
├─ Mock Resource
├─ State Inspection
└─ Debug Output
```

### 2.17 生成ApplicationはBrowser JavaScriptのみで動作可能とする

Generated Applicationの必須Runtime EnvironmentはBrowserとする。

```text
Generated Application
├─ HTML
├─ CSS
├─ JavaScript
│  ├─ Flow Engine
│  ├─ State Store
│  ├─ Resource Client
│  ├─ UI Controller
│  ├─ Component Registry
│  ├─ Overlay Manager
│  ├─ Expression Evaluator
│  └─ Application Definition
├─ Web Components
└─ Assets
```

以下を必須依存としない。

```text
Generated Application
├─ Svelte Runtime不要
├─ React Runtime不要
├─ Node.js Runtime不要
└─ Server-side Runtime不要
```

対象実行環境:

```text
Browser
├─ Chrome
├─ Safari
├─ Brave
├─ Firefox
└─ WebView
```

実装は可能な限り標準Web APIを利用する。

### 2.18 Static FrontendとBackend Responsibilityを分離する

Static Frontend側の責務:

```text
Frontend
├─ UI Rendering
├─ Client State
├─ Client-side Validation
├─ Flow Execution
├─ Navigation
├─ Overlay Control
├─ Data Transformation
├─ REST Request
└─ Browser Storage
```

Backend / REST API側の責務:

```text
Backend
├─ Authentication / Authorization
├─ Database
├─ Secret Management
├─ Protected Business Logic
├─ External API Proxy
├─ Secure File Processing
└─ Server-side Scheduled Job
```

Secretを生成Static Frontendへ保存しない。

### 2.19 Scheduleの実行保証を区別する

BrowserのみではApplicationが閉じている間の確実なSchedule実行を保証しない。

```text
Timing
├─ Delay # Browser実行中
├─ Interval # Browser実行中
├─ Foreground Schedule # Browser実行中のみ保証
└─ Server Schedule # Backend Schedulerを必要とする
```

Editor上でもForeground ScheduleとServer Scheduleを別種として明示する。

### 2.20 Representative Project Example

UI、Flow、State、Resourcesが1つのProject内でどのように接続されるかを以下に示す。

```text
Example Project # Product Concept全体を1つのApplicationで示す
├─ UI
│  └─ UserForm
│     ├─ NameInput
│     ├─ EmailInput
│     ├─ SaveButton
│     └─ SuccessSnackbar
│
├─ State
│  ├─ form
│  │  ├─ name
│  │  └─ email
│  └─ user
│
├─ Resources
│  └─ backend
│     └─ POST /users
│
└─ Flow
   └─ SaveButton.click
      ↓
      Validate
      ↓
      POST /users
      ↓
      Set state.user
      ↓
      Show SuccessSnackbar
```

UIはApplication Structure、FlowはBehavior、Stateは共有Data、Resourcesは外部接続を担当し、それぞれを独立したModelとして保持する。

### 2.21 Productの最終構成

```text
Visual Application Builder
├─ UI Editor
│  ├─ Logical Tree Editing
│  ├─ Layout Editing
│  ├─ Slot Editing
│  ├─ Component Editing
│  └─ Overlay Editing
├─ Flow Editor
│  ├─ Trigger
│  ├─ Action
│  ├─ Logic
│  ├─ Data
│  ├─ Timing
│  └─ Control
├─ State Editor
├─ Resource Editor
├─ Component Registry
├─ Preview Runtime
├─ Project Validator
└─ Static Exporter
   ↓
Static Frontend
├─ HTML
├─ CSS
├─ Browser JavaScript
├─ Web Components
└─ Assets
```



---

## 3. Core Architecture Principles

以下をArchitecture Invariantとして扱う。新機能は原則としてこれらを破らない形で実装する。

### 3.1 Project Documentを唯一のApplication Source of Truthとする

Applicationの正本はProject Documentとする。

```text
Source of Truth
└─ Project Document
   ├─ UI
   ├─ Flow
   ├─ State
   ├─ Resources
   ├─ Components
   └─ Settings
```

以下をSource of Truthにしない。

```text
Not Source of Truth
├─ Browser DOM
├─ Serialized HTML
├─ CSS Classes
├─ Svelte Component Tree
├─ Editor Component State
└─ Preview DOM
```

DOMやGenerated CodeはProjectから導出される成果物とする。

具体例:

```text
Bad
└─ DOMを直接変更
   ↓
   DOMからProjectを逆生成する

Good
└─ Project Documentを変更
   ↓
   Shared Renderer
   ↓
   DOMを再反映する
```

### 3.2 UI DocumentはSemantic Modelとして保持する

保存対象:

```text
Semantic UI
├─ Node Type
├─ Logical Parent / Children
├─ Slot
├─ Properties
├─ Layout
├─ Size
└─ Presentation
```

基本的に保存しないもの:

```text
Implementation Detail
├─ DOM sibling位置そのもの
├─ Editor座標
├─ Temporary Bounding Rect
├─ Generated CSS Selector
└─ Framework-specific State
```

RendererがSemantic Modelを実DOM / CSSへ変換する。

### 3.3 通常Layoutでは絶対座標を使用しない

Default Layoutは以下とする。

```text
Layout
├─ Stack
├─ Grid
└─ Slot
```

Freeform / Absoluteは必要になった場合のみ特殊Layoutとして追加する。

Absolute Geometryを一般UIの保存形式にしない。

### 3.4 Drag GeometryとApplication Layoutを分離する

Drag中のみTemporary Geometryを使用する。

```text
Temporary Editor Geometry
├─ pointer position
├─ drag ghost
├─ source rect
├─ target rect
└─ candidate zone
```

Drop後はPersistent Documentへ変換する。

```text
Persistent Placement
├─ before
├─ after
├─ inside
├─ slot
└─ split
```

Drop完了後にTemporary GeometryをProjectへ残さない。

具体例:

```text
Bad
└─ Drop Result
   ├─ x = 412
   └─ y = 288

Good
└─ Drop Result
   ├─ parent = node-actions
   └─ position = after(node-cancel-button)
```

### 3.5 Drag操作は必ずStructural Commandへ変換する

Drag処理からDOMを直接並べ替え、それを正本としない。

```text
Pointer Interaction
      ↓
Hit Test
      ↓
Drop Intent
      ↓
Command / Transaction
      ↓
Document Mutation
      ↓
Normalization
      ↓
Validation
      ↓
Render
```

### 3.6 EditorとProductionは同じRendering Ruleを使用する

Editor RendererとProduction Rendererを独立実装し、異なるLayout Logicを持たせない。

```text
UI Document
      ↓
Shared Renderer
├─ Editor Mode
└─ Runtime Mode
```

Mode差分はEditor Decoration、Preview Override等に限定する。

### 3.7 Editor InteractionをApplication DOMから分離する

Editor専用表示はInteraction Surfaceへ描画する。

```text
Interaction Surface
├─ Selection
├─ Hover
├─ Drop Indicator
├─ Slot Indicator
├─ Resize Handle
├─ Drag Preview
└─ Guide
```

Application Component内部へEditor専用Nodeを挿入しない。

可能な限りBounding Rect等を参照して外部から描画する。

### 3.8 Logical OwnershipとPhysical Renderingを分離する

Nodeのparentは論理所有関係を表す。

Render Surfaceは描画位置を表す。

```text
Logical Tree
└─ Form
   └─ ErrorPopover
```

Logical OwnershipはOverlay表示によって変更しない。

```text
Bad
└─ ErrorPopoverをOverlay RootのChildへ移動する

Good
└─ Logical Parent = UserForm
   └─ Render Surface = Overlay.Anchored
```

```text
Physical Rendering
├─ Content Surface
│  └─ Form
└─ Overlay Surface
   └─ ErrorPopover
```

Portal相当の描画を表すためにLogical ParentをOverlay Rootへ変更しない。

### 3.9 Surfaceは描画先でありComponent Categoryではない

Semantic CategoryとRender Surfaceを分離する。

```text
Snackbar
├─ Semantic Category = Feedback
└─ Render Surface = Overlay.Notification

Popover
├─ Semantic Category = Overlay / Contextual UI
└─ Render Surface = Overlay.Anchored
```

Component分類とRendering Policyを混同しない。

### 3.10 Overlay管理を中央Runtimeへ集約する

Overlayごとに独自Stack管理を実装しない。

```text
OverlayManager
├─ Open / Close
├─ Stack
├─ Backdrop
├─ Focus
├─ Escape
├─ Outside Click
├─ Scroll Lock
├─ Anchor Position
└─ Notification Queue
```

Componentごとに任意の巨大なz-indexを設定させない。

Overlay Stack PolicyをRuntime側で統一する。

### 3.11 Component内部実装を外部から操作しない

禁止:

```text
Flow
  ↓
querySelector
  ↓
component.shadowRoot
  ↓
private element
```

採用:

```text
Flow
  ↓
Action Registry
  ↓
Component Public Action
  ↓
Component Implementation
```

具体例:

```text
Bad
└─ Flow
   └─ querySelector(".modal-close")

Good
└─ Flow
   └─ UI Action
      └─ target = node-user-modal
         └─ action = close
```

Component内部構造はReplace可能なImplementation Detailとする。

### 3.12 Component MetadataをEditorとRuntimeで共有する

Component DefinitionからEditorとRuntime双方に必要な情報を導出する。

```text
Component Definition
├─ Inspector Property Editor
├─ Drop Slot
├─ Validation
├─ Event Selector
├─ Flow Action Selector
├─ Runtime Binding
└─ Export Information
```

Editor専用MetadataとRuntime Metadataを重複定義しない。

### 3.13 Slot Boundaryを第一級概念として保持する

SlotはDOM上の `slot` attributeだけでなくDocument Model上の配置境界とする。

Drop、Validation、Componentization、NormalizationでSlotを保持する。

NormalizerがSlot Boundaryを跨いでNodeを勝手に昇格・移動してはならない。

### 3.14 UI Node IDを安定Referenceとして使用する

FlowやState BindingからDOM Selectorを参照しない。

採用:

```text
target = "save-button-node-id"
```

禁止:

```text
target = "#form > div:nth-child(2) button"
```

Layout変更後もStable Node IDは維持する。

```text
Before
└─ node-save-button
   └─ Parent = form-footer

After Layout Change
└─ node-save-button
   └─ Parent = actions-stack

Flow Target
└─ node-save-button # 変更なし
```

DOM Layout変更によってFlow Referenceが壊れないようにする。

### 3.15 FlowはUIから独立したStructured Graphとする

Button等のprops内にFlow実装そのものを埋め込まない。

```text
UI Document
└─ SaveButton

Flow Document
└─ SaveFlow
   └─ Trigger
      ├─ target = SaveButton
      └─ event = click
```

Behavior ImplementationはFlow Documentへ集約する。

### 3.16 Flow RuntimeはComponent Type固有のprivate logicを持たない

Flow RuntimeはGenericなExecution Engineとする。

```text
Flow Runtime
├─ Trigger Registry
├─ Action Registry
├─ Expression Evaluator
├─ Execution Context
├─ Branching
├─ Async Execution
└─ Cancellation
```

Specific UI BehaviorはAction AdapterまたはComponent Public APIへ委譲する。

### 3.17 Flow Expressionに任意JavaScriptを標準採用しない

Flow ExpressionはASTとして構造化する。

```text
Expression AST
├─ Visual Editor
├─ Validation
├─ Type Analysis
├─ Security Review
├─ Dependency Analysis
├─ Migration
└─ Compilation
```

Custom JavaScriptが必要になった場合も、明示的なAdvanced / Escape Hatch Nodeとして通常Flowから分離する。

### 3.18 Flow Node Outputを明示する

非同期Action結果を暗黙Global Variableへ書き込まない。

```text
HTTP Node
├─ id = createUser
└─ output
   └─ outputs.createUser
```

後続NodeはStructured Referenceで参照する。

### 3.19 Resource接続情報とFlow Logicを分離する

Flowが完全なEnvironment URLを直接保持することを標準としない。

```text
Flow
├─ resource = backend
└─ path = /users
```

```text
Resource: backend
├─ Development baseUrl
└─ Production baseUrl
```

Environment切替でFlow Graphを変更しない。

### 3.20 State Scopeを明示する

Stateを単一Global Objectへ無制限に集約しない。

```text
State Scope
├─ Application
├─ Page
├─ Component
└─ Flow
```

ScopeごとにLifecycleと可視範囲を定義する。

### 3.21 Editor StateをApplication Stateへ混ぜない

Editor-only StateはExport対象外とする。

```text
Editor State
├─ selection
├─ hover
├─ drag
├─ viewport
├─ zoom
├─ active tool
└─ preview overrides
```

### 3.22 すべてのProject変更をCommandまたはTransactionとして扱う

ProjectをUI Componentから直接任意Mutationしない。

```text
Document Mutation
├─ ADD_NODE
├─ DELETE_NODE
├─ MOVE_NODE
├─ REORDER_NODE
├─ MOVE_TO_SLOT
├─ SET_PROPERTY
├─ SET_LAYOUT
├─ SET_PRESENTATION
├─ CONNECT_FLOW
├─ DISCONNECT_FLOW
└─ SET_RESOURCE
```

複合操作はTransactionとしてまとめる。

具体例:

```text
Bad
└─ Svelte Component
   └─ project.ui.nodes[id].parentId = targetId

Good
└─ MOVE_NODE Command
   ↓
   Command Handler
   ↓
   Project Mutation
   ↓
   Normalization
   ↓
   Validation
```

### 3.23 Undo / Redo単位をUser Intentに合わせる

Pointer移動ごとにHistory Entryを作らない。

```text
pointerdown
pointermove × N
pointerup
    ↓
Transaction
└─ MOVE_NODE × 1
```

Horizontal Split等も複数内部Commandを1 User Transactionとして扱う。

### 3.24 Document Mutation後にNormalizationを行う

処理順序を統一する。

```text
Command
   ↓
Mutation
   ↓
Normalization
   ↓
Validation
   ↓
Render
```

Normalization対象:

```text
Normalization
├─ 不要な自動生成Layout Container
├─ 空になったTemporary Structure
├─ Merge可能な自動生成Stack
└─ Canonical Child Order
```

意味を持つ構造は削除しない。

### 3.25 Normalizerが削除・統合してはいけないBoundaryを定義する

```text
Preserve Boundary
├─ User-created Explicit Container
├─ Component Root
├─ Reusable Component Boundary
├─ Slot Boundary
├─ Semantic Group
├─ Styling Boundary
├─ Flow Reference Target
└─ Externally Referenced Node
```

NormalizationはApplicationの意味を変更しない範囲でのみ行う。

具体例:

```text
Before
└─ Explicit Container
   └─ SaveButton

Normalizer
└─ Containerが1 Childしか持たなくても
   └─ Explicit Containerは保持する
```

### 3.26 Validationを保存・Preview・Exportの共通処理とする

Validation RuleをEditorとExporterで別々に実装しない。

```text
Project Validation
├─ Duplicate ID
├─ Missing Parent
├─ Circular UI Tree
├─ Invalid Slot
├─ Unsupported Child Type
├─ Missing Flow Target
├─ Invalid Flow Edge
├─ Missing Resource
├─ Invalid Expression
├─ Invalid Reference
├─ Unreachable Flow Node
├─ Potential Infinite Loop
└─ Deleted Node Reference
```

同一ValidatorをSave、Preview、Exportから利用する。

### 3.27 Browser RuntimeをFramework-independentにする

Runtime CoreをSvelte ComponentやReact Hookとして実装しない。

```text
Browser Runtime
├─ Flow Engine
├─ State Store
├─ Resource Client
├─ UI Controller
├─ Component Registry
├─ Overlay Manager
└─ Expression Engine
```

Editorからも同じRuntime Coreを利用できる形を維持する。

### 3.28 Generated ApplicationはBrowser Standard APIを基本とする

標準依存:

```text
Web Platform
├─ DOM
├─ Custom Elements
├─ EventTarget / CustomEvent
├─ Fetch
├─ AbortController
├─ URL / URLSearchParams
├─ History API
├─ Storage API
├─ Form APIs
└─ Promise / async-await
```

Experimental APIを必須にしない。

Browser差異がある場合:

```text
Compatibility
├─ Feature Detection
├─ Fallback
└─ 必要な場合のみBuild-time Polyfill
```

### 3.29 Target Browser互換性をRuntime Design Constraintとする

対象:

```text
Browser
├─ Chrome
├─ Safari
├─ Brave
├─ Firefox
└─ WebView
```

新しいBrowser APIを導入する場合、対象環境での互換性とFallback有無を確認する。

特定Engineのみで動作する機能をCore Requirementにしない。

### 3.30 file:// CompatibilityとHTTP Hostingを別条件として扱う

Static Frontendであることと `file://` で完全動作することを同一要件にしない。

Runtime内でLocal File Fetchを前提にしない。

Project Definition等は必要に応じてJavaScript BundleまたはHTMLへ埋め込む。

```text
Recommended Export
├─ index.html
├─ app.bundle.js
├─ styles.css
└─ assets/
```

標準DeploymentはHTTP(S) Static Hostingを推奨する。

REST API通信時はBrowser CORS Policyに従う。

### 3.31 SecretをClient Projectへ保持しない

Generated Applicationへ以下を出力しない。

```text
Secrets
├─ Private API Key
├─ Database Credential
├─ OAuth Client Secret
├─ Service Account Secret
└─ Backend Secret
```

Secretが必要な処理はREST API等のBackendへ委譲する。

### 3.32 Browserで保証できない処理を擬似的に保証しない

Applicationが閉じている間の正確なSchedule等をBrowser-only Runtimeで保証しない。

```text
Browser-capable
├─ Delay
├─ Interval
└─ Foreground Schedule

Server-required
└─ Guaranteed Background Schedule
```

必要な場合はServer-side Capabilityとして明示する。

Editor上でも実行保証範囲を隠さない。

### 3.33 Preview RuntimeとProduction RuntimeのBehaviorを一致させる

Preview専用MockやDebug機能がProduction Behavior自体を変更しないようにする。

Preview Overrideは明示的ContextとしてRuntimeへ与える。

同一のFlow Definition、Expression Rule、Component Contract、State Semanticsを利用する。

### 3.34 ExporterはApplicationの意味を再解釈しない

Exporterの責務はProjectを別Application Modelへ作り直すことではなく、既存Core Modelを配布形式へ変換することである。

```text
Exporter
├─ Validate Project
├─ Serialize Application Definition
├─ Generate HTML Entry
├─ Generate / Bundle CSS
├─ Bundle Components
├─ Bundle Browser Runtime
└─ Bundle Assets
```

EditorとExporterに同じBusiness Ruleを重複実装しない。

### 3.35 Architecture CoreをFrameworkから独立させる

依存方向を一方向にする。

```text
core
↑
├─ renderer
├─ runtime
├─ exporter
└─ editor
```

Editor FrameworkからCoreへの依存は許可する。

CoreからSvelte等Editor Frameworkへの依存は禁止する。

### 3.36 Svelteの責務をEditor View Layerに限定する

Svelteで扱うもの:

```text
Editor View State
├─ selection
├─ pointer
├─ hover
├─ drag UI
├─ panels
├─ inspector presentation
└─ editor interaction presentation
```

Svelte固有にしないもの:

```text
Application Core
├─ Project Schema
├─ Commands
├─ History
├─ Flow Graph
├─ Expression AST
├─ Runtime
├─ Renderer Rule
├─ Validation Rule
└─ Exporter Rule
```

### 3.37 実装順序をModelから開始する

新機能追加時はEditor UIからではなく、Application ModelとContractから定義する。

```text
Feature Development
├─ 1. Schema / Model
├─ 2. Public Contract
├─ 3. Validation
├─ 4. Runtime Behavior
├─ 5. Renderer Behavior
├─ 6. Command / History Behavior
├─ 7. Editor UI
└─ 8. Export Verification
```

Editor UIだけ先に実装し、後から保存形式やRuntime Semanticsを決める方式を避ける。

### 3.38 Architecture Invariants

以下を中核Invariantとする。

```text
A # Editor上の一時Geometryを通常Application Layout Dataへ保存しない

B # Drop完了後のUIは必ずTree / Slot / Layout Ruleへ正規化する

C # Logical OwnershipとRender Destinationを分離する

D # Project DocumentをSingle Source of Truthとする

E # DOMやFramework StateをSingle Source of Truthにしない

F # EditorとProductionで同じRendering Ruleを利用する

G # FlowはStable Node IDでUIを参照し、DOM Selectorへ依存しない

H # Flow RuntimeはComponent内部DOMへ直接アクセスしない

I # ComponentのProps / Slots / Events / ActionsをPublic Contractとして扱う

J # Flow BehaviorはStructured Dataを基本とし、任意JavaScriptを基本表現にしない

K # Project MutationはCommand / Transactionとして扱う

L # Mutation後にNormalizationとValidationを行う

M # NormalizerはSemantic Boundaryを破壊しない

N # Browser Runtime CoreをEditor Frameworkから独立させる

O # 生成ApplicationはBrowser JavaScriptだけで実行可能にする

P # SecretやServer-only ResponsibilityをStatic Frontendへ持ち込まない

Q # PreviewとProductionで同一Project / Runtime Semanticsを維持する
```

### 3.39 Core Data Flow

Editor操作からDOM反映までの基本経路:

```text
User Interaction
      ↓
Editor Interaction State
      ↓
Intent
      ↓
Command / Transaction
      ↓
Project Document
      ↓
Normalization
      ↓
Validation
      ↓
Shared Renderer
      ↓
Real DOM
```

Flow実行経路:

```text
Browser Event / Lifecycle / Timer
      ↓
Trigger Registry
      ↓
Flow Engine
      ↓
Flow Context
      ↓
Action / Logic / Data / Timing / Control
      ├─ State Store
      ├─ Resource Client
      ├─ UI Controller
      ├─ Overlay Manager
      └─ Navigation
      ↓
State / UI Update
      ↓
Renderer / Component Update
```

Export経路:

```text
Project Document
      ↓
Validation
      ↓
Exporter
      ↓
Static Frontend
├─ HTML
├─ CSS
├─ Browser JavaScript
├─ Web Components
└─ Assets
      ↓
Browser
├─ Chrome
├─ Safari
├─ Brave
├─ Firefox
└─ WebView
```

---

## 4. Technology Selection

本章ではVisual Application Builder本体、Editor、Browser Runtime、Generated Applicationの各責務に使用する技術を定義する。

技術選定は、Application CoreをEditor Frameworkから独立させ、Generated ApplicationをBrowser単体で実行可能にすることを最優先とする。

```text
Technology Responsibility
├─ TypeScript # Visual Application Builder本体のCore / Runtime Source / Exporter等を実装する
├─ Svelte 5 # Editor View LayerとEditor Interaction UIを実装する
├─ Web Components # Application UI Componentの公開境界として使用する
├─ Browser Standard APIs # PreviewおよびGenerated Applicationの実行基盤として使用する
├─ JavaScript # Export後のGenerated Applicationで実際に実行する
└─ htmx # Optional Integration。Core Requirementにはしない
```

### 4.1 TypeScriptはVisual Application Builder本体の実装に使用する

TypeScriptはBuilder内部のApplication Core、Editor、Preview Runtime Source、Exporter等の実装言語として使用する。

```text
TypeScript Implementation
├─ Project Schema
├─ UI Document Model
├─ Flow Document Model
├─ State Model
├─ Resource Model
├─ Component Definition
├─ Command System
├─ Transaction System
├─ History
├─ Normalization
├─ Validation
├─ Expression AST
├─ Reference Resolution
├─ Shared Renderer
├─ Browser Runtime Source
├─ Component Registry
├─ Overlay Manager
└─ Static Exporter
```

TypeScriptの型情報はBuilder開発時の安全性、Schema整合性、Refactor、Validation実装に利用する。

Generated ApplicationへTypeScript Sourceを必須出力しない。

```text
Builder Source
└─ TypeScript
      ↓
Build / Export
      ↓
Generated Application
└─ JavaScript
```

### 4.2 Generated ApplicationはJavaScriptのみで実行可能とする

Export後のApplicationはTypeScript Compiler、Node.js、Svelte Compiler等を必要としない。

```text
Generated Application
├─ HTML
├─ CSS
├─ JavaScript
├─ Web Components
└─ Assets
```

実行時に不要なもの:

```text
Generated Runtime Requirements
├─ TypeScript不要
├─ TypeScript Compiler不要
├─ Svelte Runtime不要
├─ React Runtime不要
├─ Node.js Runtime不要
└─ Server-side Runtime不要
```

Generated ApplicationはBrowserへ配布された時点で、そのままJavaScriptとして実行可能な状態にする。

Builder内部とExport結果の具体的な対応は以下とする。

```text
Visual Application Builder Source
├─ project-model.ts
├─ flow-engine.ts
├─ renderer.ts
├─ exporter.ts
└─ editor.svelte
      ↓
Build / Export
      ↓
Generated Application
├─ index.html
├─ app.js
├─ styles.css
└─ assets/
```

`.ts` や `.svelte` はBuilder実装側のSourceであり、Generated ApplicationのRuntime Fileではない。

### 4.3 Svelte 5はEditor View Layerに限定する

Svelte 5はVisual Application BuilderのEditor UI実装に使用する。

主な対象は、頻繁に変化するEditor専用状態とEditor Presentationである。

```text
Svelte Editor
├─ Application Canvas
├─ Logical Tree View
├─ Inspector
├─ Flow Editor
├─ State Editor
├─ Resource Editor
├─ Component Browser
├─ Interaction Surface
├─ Preview Controls
└─ Editor Panels
```

Svelteで扱うEditor-only State:

```text
Editor View State
├─ selectedNode
├─ hoveredNode
├─ pointer
├─ dragging
├─ dropIntent
├─ activeSlot
├─ viewport
├─ zoom
├─ activePanel
├─ inspectorTab
└─ previewOverrides
```

以下はSvelte固有にしない。

```text
Framework-independent Core
├─ Project Document
├─ UI Document
├─ Flow Document
├─ State
├─ Resources
├─ Component Definitions
├─ Commands
├─ Transactions
├─ History
├─ Normalization
├─ Validation
├─ Expression AST
├─ Runtime Semantics
├─ Renderer Rules
└─ Export Rules
```

依存方向は以下に固定する。

```text
Svelte Editor
      ↓
Application Core

Application Core
      ↓
      ✕
Svelte
```

Application CoreからSvelteへ依存させない。

### 4.4 Web ComponentsをApplication UI Componentの境界とする

Application UI ComponentはWeb Componentsを基本的なRuntime境界とする。

```text
Application UI
├─ Built-in Web Components
├─ Registered Web Components
├─ Project Components
└─ External Web Components
```

Componentの外部公開仕様はComponent Public Contractとして定義する。

```text
Component Public Contract
├─ Properties # 外部から設定可能な値
├─ Attributes # HTML Attributeとして公開可能な値
├─ Slots # 子UI Nodeの受け入れ先
├─ Events # Flow Triggerとして利用可能なEvent
└─ Actions # Flowから実行可能な公開操作
```

例:

```text
ui-modal
├─ Properties
│  └─ open
├─ Slots
│  ├─ header
│  ├─ content
│  └─ actions
├─ Events
│  ├─ open
│  ├─ close
│  └─ confirm
└─ Actions
   ├─ open()
   └─ close()
```

Editor、Renderer、Flow RuntimeはComponent内部DOMやShadow DOM構造へ依存しない。

### 4.5 Componentの内部実装技術をPublic Contractから分離する

Web Component内部の実装方式はComponent Public Contractとは別概念とする。

```text
Web Component Implementation
├─ Pure JavaScript Custom Element
├─ SvelteからCustom ElementとしてBuild
├─ Third-party Web Component
└─ その他Web Component互換実装
```

Generated Applicationから見たComponentの境界は常にWeb Component Contractとする。

内部実装がSvelteである場合でも、Generated Application全体にSvelte Runtimeを必須依存させない構成を優先する。

Component Registryは内部実装方式ではなくPublic Contractを管理する。

同一Contractに対して内部実装技術は異なってよい。

```text
ui-modal Public Contract
├─ Property: open
├─ Event: close
└─ Action: open()
      │
      ├─ Pure JavaScript Custom Element
      ├─ Svelte Custom Element
      └─ External Web Component
```

EditorとFlow Runtimeは上記3実装を同じContractとして扱う。

### 4.6 Shared RendererをFramework-independentにする

RendererはUI DocumentのSemantic ModelをBrowser DOM / Web Componentsへ反映する。

```text
UI Document
      ↓
Shared Renderer
      ↓
Application DOM
      ↓
Web Components
```

Shared RendererはEditorとProductionで同じRendering Rulesを使用する。

```text
Shared Renderer
├─ Editor Mode
└─ Runtime Mode
```

Mode差分はApplication UIの意味を変更しない。

Editor Modeで追加されるものはInteraction SurfaceやPreview Override等のEditor専用機能に限定する。

### 4.7 Interaction SurfaceはSvelte Editor側で管理する

Interaction SurfaceはGenerated Applicationに含まれないEditor専用Surfaceとする。

```text
Interaction Surface # Editor上の選択・Drag・配置・サイズ編集等を補助する
├─ Selection Border # 選択中UI Nodeの境界を表示する
├─ Hover Outline # Pointer下のUI Nodeを表示する
├─ Drop Indicator # Drop後のbefore / after / inside / slot / splitを表示する
├─ Slot Indicator # Named Slotの位置とDrop可否を表示する
├─ Drag Preview # Drag中の対象を一時表示する
├─ Resize Handle # Semantic Size変更操作を提供する
├─ Alignment Guide # Layout上の整列補助を表示する
└─ Spacing Guide # gap / padding等の間隔を表示する
```

Interaction Surfaceは以下の条件を満たす。

```text
Interaction Surface Rules
├─ Project Documentの一部ではない
├─ Export対象ではない
├─ Application Component内部DOMへ侵入しない
├─ Editor Stateから導出する
└─ Real DOMのBounding Rect等を参照して描画する
```

### 4.8 Browser RuntimeをFramework-independentなJavaScript Runtimeとして設計する

Browser RuntimeはProject DefinitionをBrowser上で実行するRuntimeである。

Builder内部ではTypeScriptで実装してよいが、Generated ApplicationではJavaScriptとして出力する。

```text
Browser Runtime
├─ Flow Engine # Flow Graphを実行する
├─ Trigger Registry # Event等をFlow Triggerへ接続する
├─ Action Registry # Flow ActionをRuntime Serviceへ接続する
├─ State Store # Application Stateを管理する
├─ Expression Evaluator # Expression ASTを評価する
├─ Resource Client # REST API等へアクセスする
├─ UI Controller # UI Component Public Contractを操作する
├─ Overlay Manager # Overlay Surfaceを管理する
├─ Component Registry # Component Definitionを解決する
└─ Navigation Controller # Browser Navigationを管理する
```

Runtime CoreをSvelte ComponentやReact Hookとして実装しない。

### 4.9 Browser Standard APIsをRuntimeの基本依存とする

Generated Applicationは可能な限り標準Web APIのみで実行する。

```text
Web Platform
├─ DOM API
├─ Custom Elements
├─ EventTarget / CustomEvent
├─ Fetch API
├─ AbortController
├─ URL / URLSearchParams
├─ History API
├─ localStorage / sessionStorage
├─ Standard Form APIs
└─ Promise / async / await
```

Experimental APIや特定Browser固有APIをCore Requirementにしない。

```text
Compatibility Policy
├─ Standard Web APIを優先する
├─ Feature Detectionを行う
├─ 必要に応じてFallbackを用意する
└─ 必要な場合のみ軽量PolyfillをBuild時に含める
```

### 4.10 REST通信はFetch APIを基本とする

Resource ClientはBrowser標準のFetch APIを基本とする。

```text
Flow Resource Action
      ↓
Resource Client
      ↓
Resource Definition
      ↓
Fetch API
      ↓
REST API
```

Flow NodeへEnvironment固有の完全URLを直接埋め込まない。

```text
Resource Definition
└─ backend
   ├─ baseUrl
   ├─ commonHeaders
   ├─ authPolicy
   └─ environmentOverrides
```

Flow側はResourceをReferenceする。

```text
REST Action
├─ resource = backend
├─ method = POST
├─ path = /users
├─ query
├─ headers
├─ body
└─ output
```

### 4.11 OverlayはOverlay ManagerとOverlay Surfaceで管理する

Modal、Popover、Snackbar等のRendering Policyを各Componentへ分散させない。

```text
Overlay Surface
├─ Anchored # Popover / Tooltip / Dropdown / Menu等
├─ Modal # Modal / Dialog / Blocking Drawer等
└─ Notification # Snackbar / Toast等
```

```text
Overlay Manager
├─ Open / Close
├─ Overlay Stack
├─ Backdrop
├─ Focus Management
├─ Escape Handling
├─ Outside Click
├─ Scroll Lock
├─ Anchor Position
└─ Notification Queue
```

Logical OwnershipはUI Document側で保持し、Overlay ManagerはPhysical Renderingを管理する。

### 4.12 Flow RuntimeはStructured Dataを実行する

Flow RuntimeはJavaScript Source Code文字列を基本入力としない。

```text
Flow Document
├─ Nodes
├─ Edges
├─ Structured References
└─ Expression AST
```

Flow Runtimeはこれを解釈して実行する。

```text
Flow Document
      ↓
Flow Engine
      ↓
Execution Context
      ↓
Action / Logic / Data / Timing / Control
```

初期実装ではInterpreter方式を基本とする。

将来必要になった場合、Structured Flowから最適化JavaScriptへCompileする機能を追加できる設計とする。

### 4.13 Preview RuntimeとProduction Runtimeを同一Semanticsとする

Preview専用Runtimeを別実装しない。

```text
Project
   ↓
Browser Runtime Core
├─ Preview Mode
└─ Production Mode
```

Preview Modeのみ以下を追加可能とする。

```text
Preview Hooks
├─ Node Highlight
├─ Flow Step Execution
├─ State Inspection
├─ Flow Inspection
├─ Mock Resource
├─ Force-visible Overlay
└─ Debug Output
```

Preview HookがProject Definitionそのものを暗黙変更しない。

### 4.14 ExporterはJavaScript実行物を生成する

ExporterはBuilder内部のTypeScript Sourceをそのまま配布しない。

```text
Project Document
      ↓
Validation
      ↓
Static Exporter
      ↓
JavaScript Build / Bundle
      ↓
Static Frontend
```

基本出力:

```text
dist/
├─ index.html
├─ app.js
├─ styles.css
└─ assets/
```

物理的なBundle分割は実装上変更可能とする。

```text
Alternative Output
├─ index.html
├─ app.js
├─ runtime.js
├─ components.js
├─ styles.css
└─ assets/
```

論理責務と物理ファイル数を同一視しない。

### 4.15 Generated Applicationは自己完結したBrowser Applicationとする

Static Frontendの実行にVisual Application Builder本体を必要としない。

```text
Builder
├─ TypeScript
├─ Svelte Editor
├─ Compiler / Bundler
└─ Static Exporter
        ↓
Generated Application
├─ HTML
├─ CSS
├─ JavaScript
├─ Web Components
└─ Assets
        ↓
Browser
```

Generated Application実行時にBuilderを読み込まない。

Export後の起動関係:

```text
index.html
   ↓
app.js
├─ Application Definition
├─ Browser Runtime
└─ Web Components
   ↓
Browser Standard APIs
```

Visual Application Builder本体をGenerated Applicationから読み込まない。

### 4.16 htmxはOptional Integrationとする

htmxをFlow EngineやApplication RuntimeのCoreには使用しない。

```text
htmx
└─ Optional Integration
   ├─ Existing Server-rendered Applicationとの統合
   ├─ HTML Fragment取得
   └─ 特殊なHTML-over-the-wire Component
```

以下の置き換えとして使用しない。

```text
Core Runtime
├─ Flow Engine
├─ State Store
├─ Resource Client
├─ UI Controller
└─ Navigation Controller
```

### 4.17 Technology Boundary

技術境界を以下に固定する。

```text
Visual Application Builder
├─ TypeScript # Core実装
├─ Svelte 5 # Editor View Layer
└─ Build Tooling # TypeScript / Component / RuntimeをBrowser実行形式へ変換
      ↓
Generated Application
├─ HTML
├─ CSS
├─ JavaScript
├─ Web Components
└─ Assets
      ↓
Browser Standard APIs
```

Builder内部の実装技術をGenerated ApplicationのRuntime Requirementへ漏らさない。

---

## 5. High-Level Architecture

本章ではProject Documentを中心として、Editor、Core、Preview Runtime、Browser Runtime、Exporter、Generated Applicationがどのように接続されるかを定義する。

Applicationの正本は常にProject Documentであり、Editor、Preview、Exportのために別々のApplication Modelを持たない。

```text
Project Document
├─ UI Document
├─ Flow Document
├─ State
├─ Resources
├─ Components
└─ Settings
      │
      ▼
Application Core
      │
      ├──────────────┬───────────────┐
      ▼              ▼               ▼
Svelte Editor   Preview Runtime   Static Exporter
      │              │               │
      └──────────────┘               ▼
             │                Generated Application
             ▼                ├─ HTML
       Shared Renderer        ├─ CSS
             │                ├─ JavaScript
             ▼                ├─ Web Components
      Application DOM         └─ Assets
```

### 5.1 Project DocumentをArchitectureの中心とする

Project DocumentはApplication全体を表すSingle Source of Truthである。

```text
Project Document
├─ UI Document # UIのLogical Tree、Layout、Slot、Props、Presentation
├─ Flow Document # Application Behaviorを表すStructured Graph
├─ State # Application / Page / Component等のState定義
├─ Resources # REST API等の外部Resource定義
├─ Components # Component DefinitionとPublic Contract
└─ Settings # Project全体の設定とEnvironment情報
```

Project Documentは以下すべてから利用する。

```text
Project Consumers
├─ Editor
├─ Preview Runtime
├─ Shared Renderer
├─ Validator
└─ Static Exporter
```

Editor専用Project ModelとProduction専用Project Modelを分離しない。

### 5.2 Application CoreをProject操作の中心とする

Application CoreはFramework-independentなTypeScript Module群としてBuilder内部に実装する。

```text
Application Core
├─ Project Schema
├─ UI Model
├─ Flow Model
├─ State Model
├─ Resource Model
├─ Component Model
├─ Command System
├─ Transaction System
├─ History
├─ Normalizer
├─ Validator
├─ Expression Model
├─ Reference Resolver
└─ Serialization
```

EditorはApplication Coreを通してProjectを変更する。

Project ObjectをSvelte Componentから直接任意Mutationしない。

### 5.3 Editor操作からProject変更までの経路を統一する

Editor上のUser Interactionは直接DOMやProjectを変更せず、IntentからCommandへ変換する。

```text
User Interaction
      ↓
Editor Interaction State
      ↓
Intent
      ↓
Command / Transaction
      ↓
Project Mutation
      ↓
Normalization
      ↓
Validation
      ↓
Shared Renderer
      ↓
Application DOM
```

例:

```text
Drag UI Node
      ↓
Hit Test
      ↓
Drop Intent = after
      ↓
MOVE_NODE Command
      ↓
Project Document更新
      ↓
Normalization
      ↓
Render
```

Pointer座標はこの処理中のTemporary StateでありProjectへ保存しない。

具体例として、ButtonをCardの`actions` SlotへDragする場合は以下となる。

```text
User drags Button
      ↓
Interaction Surface
      ↓
Hit Test
      ↓
Drop Candidate = Card.actions
      ↓
Slot Validation
      ↓
Drop Intent = slot(actions)
      ↓
MOVE_TO_SLOT Command
      ↓
Project Document
      ↓
Normalization
      ↓
Validation
      ↓
Shared Renderer
      ↓
Application DOM Updated
```

Pointer座標はHit Testにのみ使用し、Projectへ保存しない。

### 5.4 UI DocumentはLogical Ownershipを保持する

UI DocumentはApplication UIのLogical Treeを保持する。

```text
UI Document
└─ Page
   └─ UserForm
      ├─ NameInput
      ├─ SaveButton
      ├─ ValidationPopover
      └─ SuccessSnackbar
```

このTreeはComponentのLogical Ownershipを表す。

Physical Rendering先とは独立させる。

### 5.5 Render SurfaceはLogical Treeと分離する

RendererはNodeのPresentationに従って適切なRender Surfaceへ描画する。

```text
Render Surfaces
├─ Application
│  ├─ Content Surface
│  └─ Overlay Surface
│     ├─ Anchored
│     ├─ Modal
│     └─ Notification
└─ Editor
   └─ Interaction Surface
```

例:

```text
Logical Tree
└─ UserForm
   ├─ SaveButton
   ├─ ValidationPopover
   └─ SuccessSnackbar
```

```text
Physical Rendering
├─ Content Surface
│  └─ UserForm
│     └─ SaveButton
└─ Overlay Surface
   ├─ Anchored
   │  └─ ValidationPopover
   └─ Notification
      └─ SuccessSnackbar
```

ValidationPopoverやSuccessSnackbarのLogical ParentはUserFormのまま維持する。

### 5.6 Shared RendererがUI DocumentをReal DOMへ変換する

RendererはUI DocumentのSemantic ModelをDOM / Web Componentsへ反映する。

```text
UI Document
      ↓
Reference Resolution
      ↓
Component Registry
      ↓
Shared Renderer
      ↓
Application DOM
      ↓
Web Components
```

RendererはNode TypeからComponent Definitionを解決する。

```text
UINode
├─ type
├─ props
├─ slot
├─ layout
├─ size
└─ presentation
      ↓
Component Registry
      ↓
Component Definition
      ↓
Web Component
```

EditorとGenerated Applicationで異なるRendering Semanticsを持たない。

### 5.7 EditorではApplication DOMとInteraction Surfaceを分離する

EditorはShared Rendererが生成したReal Application DOMを表示する。

その上にEditor専用Interaction Surfaceを重ねる。

```text
Editor View
├─ Application DOM # 実Applicationと同じRendering Rulesで描画する
└─ Interaction Surface # Editor専用操作UI
   ├─ Selection Border
   ├─ Hover Outline
   ├─ Drop Indicator
   ├─ Slot Indicator
   ├─ Drag Preview
   ├─ Resize Handle
   ├─ Alignment Guide
   └─ Spacing Guide
```

Interaction SurfaceをApplication Component内部へ挿入しない。

### 5.8 Component RegistryをUIとRuntimeの接続点とする

Component RegistryはComponent TypeとPublic Contractを解決する。

```text
Component Registry
└─ Component Definition
   ├─ type
   ├─ tag
   ├─ props
   ├─ slots
   ├─ events
   ├─ actions
   ├─ defaults
   └─ presentation
```

以下が同一Definitionを利用する。

```text
Component Definition Consumers
├─ Renderer
├─ Inspector
├─ Drop System
├─ Validator
├─ Trigger Registry
├─ Action Registry
└─ Exporter
```

Editor MetadataとRuntime Metadataを別々に定義しない。

### 5.9 Flow DocumentはUI Documentから独立して保持する

FlowはApplication BehaviorをStructured Graphとして保持する。

```text
Flow Document
└─ SaveUserFlow
   ├─ Trigger
   │  ├─ target = node-save-button
   │  └─ event = click
   ├─ REST Action
   ├─ Condition
   ├─ State Action
   └─ Snackbar Action
```

UI Node側へJavaScript Behaviorを埋め込まない。

UIとFlowはStable Node IDで接続する。

### 5.10 Stable Node IDでUI Referenceを解決する

Flow RuntimeはDOM Selectorへ依存しない。

```text
UI Document
└─ SaveButton
   └─ id = node-save-button
```

```text
Flow Trigger
├─ target = node-save-button
└─ event = click
```

RuntimeはNode IDから実際のComponent Bindingを解決する。

```text
Stable Node ID
      ↓
UI Binding Registry
      ↓
Rendered Web Component
```

DOM hierarchyやCSS Selectorが変更されてもFlow Referenceを維持する。

### 5.11 Trigger RegistryがBrowser EventとFlowを接続する

Trigger RegistryはUI Event、Lifecycle、State Event、Timing Event等をFlow開始条件へ接続する。

```text
Trigger Sources
├─ UI Event
├─ Lifecycle Event
├─ State Event
└─ Timing Event
      ↓
Trigger Registry
      ↓
Flow Engine
```

UI Eventの場合:

```text
Web Component Event
      ↓
Component Public Event
      ↓
Trigger Registry
      ↓
Matching Flow Trigger
      ↓
Flow Engine
```

Component内部DOM Eventへ直接依存しない。

### 5.12 Flow EngineがStructured Graphを実行する

Runtime全体の具体的な実行例:

```text
User clicks SaveButton
      ↓
Web Component emits Public Event
      ↓
Trigger Registry
      ↓
SaveUserFlow
      ↓
Flow Engine
      ↓
Resource Action
      ↓
Resource Client
      ↓
POST /users
      ↓
Flow Node Output
      ↓
State Action
      ↓
State Store
      ↓
UI Action
      ↓
UI Controller
      ↓
Overlay Manager
      ↓
SuccessSnackbar
```

Flow Engine自身はFetch、DOM操作、Overlay描画等のImplementation Detailを直接実装しない。

Flow EngineはFlow DocumentをExecution Contextとともに実行する。

```text
Flow Engine
├─ Node Execution
├─ Edge Selection
├─ Async Execution
├─ Branching
├─ Parallel Execution
├─ Retry
├─ Error Handling
├─ Cancellation
└─ Subflow
```

Flow EngineはSpecific Component内部実装を持たない。

UI操作はUI Controller / Action Registryを経由する。

### 5.13 Flow Execution Contextで値を管理する

Flow実行時の値をNamespaceごとに管理する。

```text
Flow Execution Context
├─ event # Triggerから受け取った値
├─ state # State Store内の値
├─ variables # Flow Local Variable
├─ outputs # 先行NodeのOutput
└─ env # Environment Value
```

Node間の値参照はStructured Referenceを使用する。

```text
state.form.email
event.detail.value
outputs.createUser.id
env.API_BASE_URL
```

任意JavaScript ScopeをFlowのData Modelにしない。

### 5.14 Expression EvaluatorがExpression ASTを評価する

ConditionやData TransformはExpression ASTとして保存し、Expression Evaluatorが実行する。

```text
Expression AST
      ↓
Expression Evaluator
      ↓
Flow Context
      ↓
Result
```

例:

```text
AND
├─ GTE
│  ├─ state.user.age
│  └─ 18
└─ EQ
   ├─ state.enabled
   └─ true
```

これによりEditorとRuntimeで同一Expression Semanticsを使用する。

### 5.15 State StoreをUIとFlowの共有Data Layerとする

State StoreはUIとFlow双方から利用する。

```text
                 Flow Engine
                     │
                     ▼
                  State Store
                 ▲         │
                 │         ▼
            UI Binding   State Trigger
```

State Scopeを区別する。

```text
State Scope
├─ Application State
├─ Page State
├─ Component State
└─ Flow Variables
```

Editor StateはこのState Storeへ混ぜない。

### 5.16 UI BindingはState変更をComponentへ反映する

Stateを参照するUI PropertyはBindingとして管理する。

```text
State Store
      ↓
Binding Resolution
      ↓
UI Controller / Renderer
      ↓
Component Property
```

例:

```text
state.user.name
      ↓
Text Component
      ↓
"Yamada"
```

Flow RuntimeがComponent内部DOMへ直接値を書き込まない。

### 5.17 Resource DefinitionとResource Clientを分離する

ResourcesはProject側の接続定義であり、Resource ClientはBrowser上の実行機構である。

```text
Project Resources
└─ backend
   ├─ baseUrl
   ├─ commonHeaders
   ├─ authPolicy
   └─ environmentOverrides
```

実行経路:

```text
Flow REST Action
      ↓
Resource Client
      ↓
Resource Definition
      ↓
Fetch API
      ↓
REST API
```

Flow GraphへEnvironment固有のBase URLを重複記述しない。

### 5.18 UI ControllerをFlowとComponentの境界とする

FlowからのUI操作はUI Controllerを経由する。

```text
Flow UI Action
      ↓
Action Registry
      ↓
UI Controller
      ↓
Stable Node ID Resolution
      ↓
Component Public Contract
      ↓
Web Component
```

例:

```text
Open Modal
      ↓
UI Controller
      ↓
node-user-modal
      ↓
ui-modal.open()
```

Flowから`querySelector()`やShadow DOM操作を行わない。

### 5.19 Overlay ManagerがOverlay Surfaceを管理する

Overlay ComponentのPhysical RenderingはOverlay Managerが管理する。

```text
Flow / UI Event
      ↓
UI Controller
      ↓
Overlay Manager
      ↓
Overlay Surface
├─ Anchored
├─ Modal
└─ Notification
```

Overlay Managerが管理するもの:

```text
Overlay Management
├─ Open / Close
├─ Stack
├─ Backdrop
├─ Focus
├─ Escape
├─ Outside Click
├─ Scroll Lock
├─ Anchor Position
└─ Notification Queue
```

Logical OwnershipはUI Document側から変更しない。

### 5.20 Navigation ControllerがBrowser Navigationを管理する

Navigation Actionを直接Browser APIへ分散させず、Navigation Controllerへ集約する。

```text
Flow Navigation Action
      ↓
Navigation Controller
      ↓
Browser APIs
├─ History
├─ Location
├─ URL
└─ URLSearchParams
```

Navigation Action:

```text
Navigation
├─ Navigate
├─ Back
├─ Forward
├─ Reload
├─ Open External URL
└─ Set Query Parameter
```

### 5.21 PreviewはProduction Runtime Coreを利用する

PreviewはProductionに似せた別Engineではなく、同一Runtime Coreを使用する。

```text
Project Document
      ↓
Browser Runtime Core
├─ Preview Mode
└─ Production Mode
```

Preview ModeのみEditor Hookを追加する。

```text
Preview Hooks
├─ Flow Node Highlight
├─ Step Execution
├─ State Inspector
├─ Flow Inspector
├─ Mock Resource
├─ Force-visible Overlay
└─ Debug Output
```

Preview HookはProject Documentへ暗黙的な恒久変更を加えない。

### 5.22 Preview OverrideをProject Stateから分離する

EditorでModal等を強制表示したい場合、Application Stateを書き換えない。

```text
Project
└─ Modal
   └─ open = false

Preview Override
└─ forceVisible(node-modal) = true
```

描画時:

```text
Project State
      +
Preview Override
      ↓
Shared Renderer
      ↓
Editor Preview
```

Export時にPreview Overrideを含めない。

### 5.23 ValidationをEditor、Preview、Exportで共有する

Project Validatorは共通Ruleを使用する。

```text
Project Validator
├─ UI Validation
├─ Slot Validation
├─ Reference Validation
├─ Flow Validation
├─ Expression Validation
├─ Resource Validation
├─ Component Validation
└─ State Validation
```

利用箇所:

```text
Validator
├─ Editor
├─ Preview
└─ Static Exporter
```

Previewだけ通るProjectやExportだけ失敗するProjectを可能な限り作らない。

### 5.24 Static ExporterはProjectの意味を再解釈しない

Static ExporterはProjectから別のApplication Modelを作成しない。

```text
Project Document
      ↓
Validation
      ↓
Serialization / Build
      ↓
Generated Application
```

Exporterの責務:

```text
Static Exporter
├─ Validate Project
├─ Serialize Application Definition
├─ Build JavaScript Runtime
├─ Build Web Components
├─ Generate HTML Entry
├─ Generate / Bundle CSS
└─ Copy / Bundle Assets
```

Core SemanticsをExporter内部で再実装しない。

### 5.25 Application DefinitionをJavaScriptで配布可能にする

Generated ApplicationにはRuntimeが解釈可能なApplication Definitionを含める。

```text
Generated JavaScript
├─ Application Definition
│  ├─ UI Definition
│  ├─ Flow Definition
│  ├─ State Definition
│  ├─ Resource Definition
│  ├─ Component Definition
│  └─ Settings
│
└─ Browser Runtime
   ├─ Flow Engine
   ├─ State Store
   ├─ Resource Client
   ├─ UI Controller
   ├─ Overlay Manager
   ├─ Component Registry
   └─ Expression Evaluator
```

Application Definitionは別JSON Fetchを必須にしない。

必要に応じてJavaScript Bundle内へ埋め込む。

### 5.26 Generated Applicationの基本構成

標準的なExport結果:

```text
dist/
├─ index.html # Browser Entry Point
├─ app.js # Runtime / Application Definition / Component等のJavaScript
├─ styles.css # Application Style
└─ assets/ # Image / Icon / Font以外の許可された静的Asset等
```

内部責務は以下のように論理分割される。

```text
app.js
├─ Application Definition
├─ Flow Engine
├─ State Store
├─ Resource Client
├─ UI Controller
├─ Overlay Manager
├─ Navigation Controller
├─ Component Registry
├─ Expression Evaluator
└─ Web Components
```

物理的には1ファイルでも複数JavaScriptファイルでもよい。

### 5.27 Generated ApplicationはBrowserだけで起動可能にする

Generated Application実行時の依存関係:

```text
Generated Application
      ↓
Browser
├─ Chrome
├─ Safari
├─ Brave
├─ Firefox
└─ WebView
      ↓
Browser Standard APIs
      ↓
REST API / External Resources
```

以下を実行時前提にしない。

```text
Not Required at Runtime
├─ Visual Application Builder
├─ TypeScript
├─ TypeScript Compiler
├─ Svelte Editor
├─ Svelte Runtime
├─ React Runtime
├─ Node.js
└─ Application Server
```

### 5.28 Static Hostingを標準Deploymentとする

Generated ApplicationはStatic Frontendとして配置できる。

```text
Static Hosting
├─ CDN
├─ Object Storage
├─ Static Web Server
└─ Existing Web Server
      ↓
Generated Application
      ↓
REST API
```

REST API接続時はCORS、Authentication、Authorization等のBrowser制約に従う。

### 5.29 file:// とHTTP(S) Hostingを別要件として扱う

Static Frontendであることと`file://`で完全動作することを同一視しない。

Local File FetchやRuntime Module Fetchを必須にしないことで、可能な範囲で`file://`互換性を高める。

```text
Avoid Runtime Requirements
├─ fetch("./project.json")
├─ fetch("./component.html")
└─ 不要なRuntime Module Dependency Chain
```

ただしREST API通信、CORS、Origin Policy等の理由から標準DeploymentはHTTP(S) Hostingとする。

### 5.30 Backend ResponsibilityをGenerated Applicationから分離する

Browser Runtimeで安全に実行できない責務はBackendへ配置する。

```text
Generated Frontend
├─ UI Rendering
├─ Flow Execution
├─ Client State
├─ Navigation
├─ Overlay Control
├─ Data Transformation
├─ Client Validation
├─ REST Request
└─ Browser Storage
```

```text
Backend
├─ Authentication / Authorization
├─ Database
├─ Secret Management
├─ Protected Business Logic
├─ External API Proxy
├─ Secure File Processing
└─ Guaranteed Scheduled Jobs
```

Frontend JavaScriptへSecretを埋め込まない。

### 5.31 Server ScheduleをExternal Capabilityとして扱う

Foreground ScheduleとServer ScheduleをArchitecture上で区別する。

```text
Browser Runtime
├─ Delay
├─ Interval
└─ Foreground Schedule

External Backend Capability
└─ Server Schedule
```

Server ScheduleはGenerated Application自身がBrowser外で実行する機能ではない。

必要な場合はBackend Schedulerや外部ServiceとのIntegrationとして扱う。

### 5.32 BuilderとGenerated Applicationの技術境界

Builder内部とExport結果を明確に分ける。

```text
Visual Application Builder
├─ TypeScript
├─ Svelte 5 Editor
├─ Application Core
├─ Preview Runtime Source
├─ Shared Renderer Source
├─ Static Exporter
└─ Build Tooling
      ↓
Export
      ↓
Generated Application
├─ HTML
├─ CSS
├─ JavaScript
├─ Web Components
└─ Assets
```

Builder内部のTypeScriptやSvelteをGenerated Applicationの必須Runtime Dependencyにしない。

### 5.33 Dependency Direction

Architectureの依存方向を以下にする。

```text
Svelte Editor
      ↓
Application Core
      ↑
Shared Renderer
      ↑
Browser Runtime Source
      ↑
Static Exporter
```

より正確には各ModuleはCore ModelやPublic Contractへ依存し、Editor Frameworkへ逆依存しない。

```text
Application Core
├─ Editorから参照される
├─ Rendererから参照される
├─ Runtimeから参照される
└─ Exporterから参照される

Application Core
└─ Svelteへ依存しない
```

### 5.34 全体Architecture

Builder内部からGenerated Application実行までを統合すると以下となる。

```text
Visual Application Builder
│
├─ Project Document
│  ├─ UI Document
│  ├─ Flow Document
│  ├─ State
│  ├─ Resources
│  ├─ Components
│  └─ Settings
│
├─ Application Core
│  ├─ Schema
│  ├─ Commands
│  ├─ Transactions
│  ├─ History
│  ├─ Normalization
│  ├─ Validation
│  ├─ Expression AST
│  └─ Reference Resolution
│
├─ Svelte Editor
│  ├─ Application Canvas
│  ├─ Logical Tree
│  ├─ Inspector
│  ├─ Flow Editor
│  ├─ State Editor
│  ├─ Resource Editor
│  └─ Interaction Surface
│
├─ Shared Renderer
│  ├─ Content Surface
│  ├─ Overlay Surface
│  └─ Editor Mode Support
│
├─ Preview Runtime
│  ├─ Browser Runtime Core
│  └─ Preview Hooks
│
└─ Static Exporter
       ↓
Generated Application
├─ HTML
├─ CSS
├─ JavaScript
│  ├─ Application Definition
│  ├─ Flow Engine
│  ├─ State Store
│  ├─ Resource Client
│  ├─ UI Controller
│  ├─ Overlay Manager
│  ├─ Navigation Controller
│  ├─ Component Registry
│  └─ Expression Evaluator
├─ Web Components
└─ Assets
       ↓
Browser
├─ Chrome
├─ Safari
├─ Brave
├─ Firefox
└─ WebView
       ↓
REST API / External Resources
```

### 5.35 Core Data Flow

Editor操作:

```text
User Interaction
      ↓
Editor Interaction State
      ↓
Intent
      ↓
Command / Transaction
      ↓
Project Document
      ↓
Normalization
      ↓
Validation
      ↓
Shared Renderer
      ↓
Application DOM
```

Flow実行:

```text
Browser Event / Lifecycle / State / Timer
      ↓
Trigger Registry
      ↓
Flow Engine
      ↓
Flow Execution Context
      ↓
Action / Logic / Data / Timing / Control
      ├─ State Store
      ├─ Resource Client
      ├─ UI Controller
      ├─ Overlay Manager
      └─ Navigation Controller
      ↓
State / UI Update
      ↓
Renderer / Web Component Update
```

Export:

```text
Project Document
      ↓
Validation
      ↓
Static Exporter
      ↓
Build / Bundle
      ↓
Static Frontend
├─ HTML
├─ CSS
├─ JavaScript
├─ Web Components
└─ Assets
      ↓
Browser
```

### 5.36 High-Level Architecture Invariants

本章における重要なArchitecture Invariantを以下に固定する。

```text
A # Project DocumentをEditor / Preview / Exportの共通Source of Truthとする

B # Editor専用Application Modelを作らない

C # Production専用Application Modelを作らない

D # Shared RendererでEditorとProductionのRendering Semanticsを一致させる

E # Interaction SurfaceをApplication DOMおよびExport結果から分離する

F # Logical OwnershipとRender Surfaceを分離する

G # UIとFlowをStable Node IDで接続する

H # FlowからDOM SelectorやComponent内部DOMへ直接アクセスしない

I # Component RegistryとPublic ContractをEditor / Runtime / Exporterで共有する

J # State StoreをUIとFlowの共有Data Layerとする

K # Resource DefinitionとResource Clientを分離する

L # PreviewはProduction Runtime Coreを再利用する

M # ExporterはProject Semanticsを再実装しない

N # Builder内部はTypeScriptを使用してよいが、Generated ApplicationはJavaScriptとして出力する

O # Generated ApplicationはTypeScript / Svelte / Node.jsを実行時必須依存にしない

P # Generated ApplicationはBrowser Standard APIsを基本として単体実行可能にする

Q # Secret、Database、Guaranteed Schedule等のServer ResponsibilityをGenerated Frontendへ持ち込まない

```

---

## 6. Project Document Model

Project Documentは、Visual Application Builderで作成されるApplication全体を表す永続的なCanonical Modelであり、Editor、Preview、Validation、Exportの共通Source of Truthとする。

DOM、Generated HTML、Svelte State、Editor View State等をApplicationの正本としない。

```text
Project Document # Application全体を表すCanonical Model
├─ meta # Project識別情報とSchema Version
├─ ui # UI Document
├─ flows # Flow Document群
├─ state # State Definition
├─ resources # Resource Definition
├─ components # Component Definition / Reference
└─ settings # Project全体の設定
```

### 6.1 Project Documentを永続Application Modelとする

Project DocumentはEditor操作中だけ存在する一時Modelではなく、保存、読込、Preview、Exportすべてで利用するApplication Definitionとする。

```text
Project Document
├─ Save # 永続化する
├─ Load # 復元する
├─ Edit # Editorが変更する
├─ Validate # Project整合性を検証する
├─ Preview # Browser Runtimeで実行する
└─ Export # Static Frontendへ変換する
```

同一ProjectからEditor用ApplicationとProduction用Applicationを別々に生成する二重Modelを持たない。

### 6.2 ProjectのTop-level Structureを固定する

Projectは以下の責務に分離する。

```text
Project
├─ meta # Project ID、Name、Schema Version等
├─ ui # Logical UI Tree
├─ flows # Application Behavior Graph
├─ state # State Schema / Initial Values
├─ resources # REST Resource等の接続定義
├─ components # Component DefinitionとRegistry情報
└─ settings # EnvironmentやApplication設定
```

各領域が他領域の内部Dataを複製しない。

Referenceが必要な場合はStable IDで接続する。

最小Projectの概念的な保存例:

```json
{
  "meta": {
    "id": "project-user-app",
    "name": "User App",
    "schemaVersion": "1"
  },
  "ui": {
    "roots": ["page-home"],
    "nodes": {}
  },
  "flows": {
    "flows": {}
  },
  "state": {},
  "resources": {},
  "components": {},
  "settings": {}
}
```

この例はField名の最終Schema固定ではなく、Top-level責務の境界を示すCanonical Exampleとする。

### 6.3 Project Metadataを持つ

Project自体を識別し、Schema Migrationを可能にするためMetadataを持つ。

```text
Project Meta
├─ id # Projectを識別するStable ID
├─ name # Project表示名
├─ schemaVersion # Project Schema Version
├─ createdAt # 作成日時
├─ updatedAt # 最終更新日時
└─ generatorVersion # 必要な場合のみBuilder Versionを記録する
```

`schemaVersion` はBuilder Versionとは分離する。

Builderが更新されてもProject Schemaが変更されない場合、Schema Versionを変更する必要はない。

### 6.4 Schema Versionを明示する

Project Formatは将来変更されるため、Versionなしの匿名JSON構造にしない。

```text
Project
└─ meta
   └─ schemaVersion = "1"
```

Schema変更時はMigrationを定義する。

```text
Old Project
    ↓
Schema Detection
    ↓
Migration
    ↓
Current Project Schema
    ↓
Validation
```

既存ProjectをEditor内部で場当たり的に補正するのではなく、明示的なMigration Stepを通す。

Migration例:

```text
Project schemaVersion = 1
      ↓
detectSchemaVersion()
      ↓
migrateV1ToV2()
      ↓
Project schemaVersion = 2
      ↓
Current Schema Validation
```

Migration中にEditor UIへ依存した処理を行わない。

### 6.5 Stable IDをProject全体のReference基盤とする

Project内で外部から参照されるEntityはStable IDを持つ。

```text
Stable IDs
├─ Project ID
├─ UI Node ID
├─ Flow ID
├─ Flow Node ID
├─ State Definition ID
├─ Resource ID
└─ Component Definition ID
```

表示名をReference Keyとして使用しない。

```text
name = "Save Button" # Userが変更可能

id = "node_01H..." # Reference用Stable ID
```

RenameによってReferenceが破壊されない構造にする。

### 6.6 IDと表示名を分離する

`id` はMachine Reference、`name` はHuman-readable Labelとして扱う。

```text
Entity
├─ id # Stable Machine Reference
└─ name # Userが変更可能なDisplay Name
```

以下を禁止する。

```text
Flow Target
└─ target = "Save Button" # Display Name依存
```

以下を使用する。

```text
Flow Target
└─ target = "node-save-button"
```

### 6.7 Project間ReferenceとProject内Referenceを区別する

基本Project ModelではProject内部のReferenceをStable IDで表現する。

```text
Internal Reference
├─ UI → Component Definition
├─ Flow → UI Node
├─ Flow → Resource
├─ Flow → State
└─ Component Instance → Project Component
```

Project外ResourceやExternal Component等は、内部Entity IDではなく明示的なExternal Referenceとして扱う。

```text
Reference
├─ Internal Reference # Project内Stable ID
└─ External Reference # Package / URL / Registry Key等
```

両者を同じStringの暗黙解釈にしない。

### 6.8 ReferenceはStructured Dataとして保持する

Reference可能な値を任意String Pathだけで表現しない。

概念的には以下のようなStructured Referenceを使用する。

```text
Reference
├─ kind # uiNode / state / resource / output / env等
├─ id # Reference対象のStable ID
└─ path # Entity内部のProperty Pathが必要な場合のみ保持
```

Flow Context等の簡潔な表示では、

```text
state.form.email
outputs.createUser.id
```

のように見せてもよいが、内部保存形式は解析可能なStructured Referenceを優先する。

簡潔なReference表現の例:

```json
{
  "$ref": "state.form.email"
}
```

Entity IDを伴うReferenceの概念例:

```json
{
  "$ref": {
    "kind": "resource",
    "id": "resource-backend"
  }
}
```

RuntimeやValidatorが通常StringとReferenceを区別できる形式とする。

### 6.9 UI DocumentをProject内の独立Modelとして保持する

UI DocumentはProject内のUI構造を担当する。

```text
Project
└─ ui
   ├─ roots # Page等のRoot Node
   ├─ nodes # UI Node Definition
   └─ uiSettings # UI Document固有設定が必要な場合
```

UI Documentの詳細なSemantic ModelはSection 7で定義する。

### 6.10 Flow DocumentをUI Documentから分離する

BehaviorをUI NodeのPropertyへ直接埋め込まない。

```text
Project
├─ ui
│  └─ SaveButton
│     └─ id = node-save
│
└─ flows
   └─ SaveFlow
      └─ Trigger
         ├─ target = node-save
         └─ event = click
```

UIとFlowはStable Referenceで接続する。

### 6.11 State Definitionを独立して保持する

Application State DefinitionをComponent TreeやFlow Graphへ分散させない。

```text
Project State
├─ Application State
├─ Page State
└─ Component State Definition
```

Flow Variables、Flow Outputs、Event Data等のExecution-local DataはProject-level Persistent Stateとは区別する。

```text
Persistent Definition
├─ Application State
├─ Page State
└─ Component State Schema

Runtime Context
├─ Flow Variables
├─ Flow Outputs
└─ Event Data
```

### 6.12 Resource Definitionを独立して保持する

REST API等の接続先をFlow Nodeへ重複保存しない。

```text
Project
└─ resources
   └─ backend
      ├─ id
      ├─ type = REST
      ├─ baseUrl
      ├─ commonHeaders
      ├─ authPolicy
      └─ environmentOverrides
```

Flow ActionはResource IDを参照する。

```text
REST Action
├─ resource = backend-resource-id
├─ method = POST
└─ path = /users
```

具体例:

```json
{
  "id": "resource-backend",
  "type": "rest",
  "baseUrl": "https://api.example.com",
  "commonHeaders": {
    "Accept": "application/json"
  }
}
```

Flowは`resource-backend`をStable IDで参照する。

### 6.13 Component DefinitionをProject Modelへ統合する

利用可能なComponentと、そのPublic ContractをProjectから解決できるようにする。

```text
Project Components
├─ Built-in Component References
├─ Registered Web Components
├─ Project Components
└─ External Component References
```

各Component Definitionは少なくとも以下を公開する。

```text
Component Definition
├─ id
├─ type
├─ tag
├─ props
├─ slots
├─ events
├─ actions
├─ defaults
└─ presentation
```

Component内部DOMをProject Schemaへ保存しない。

### 6.14 SettingsをApplication Modelから分離して保持する

Project全体に関係する設定はSettingsへまとめる。

```text
Project Settings
├─ Application Settings
├─ Environment Settings
├─ Navigation Settings
├─ Theme Settings
├─ Build / Export Settings
└─ Compatibility Settings
```

特定Editor Panelの開閉状態等はProject Settingsに含めない。

### 6.15 Environment値とSecretを区別する

Browserから参照可能なEnvironment ValueはProject Definitionに含めることができる。

```text
Client Environment
├─ API Base URL
├─ Public Feature Flag
└─ Public Configuration
```

SecretはProjectへ保存しない。

```text
Do Not Store
├─ Private API Key
├─ OAuth Client Secret
├─ Database Password
├─ Service Account Secret
└─ Backend Credential
```

Secretが必要な処理はBackendへ委譲する。

### 6.16 Persistent DataとEditor-only Dataを分離する

Projectへ保存するDataとEditor Sessionだけで必要なDataを明確に分離する。

```text
Persistent Project Data
├─ UI Document
├─ Flow Document
├─ State Definition
├─ Resources
├─ Components
└─ Settings
```

```text
Editor-only State
├─ selectedNode
├─ hoveredNode
├─ pointer
├─ dragging
├─ dropIntent
├─ activeSlot
├─ viewport
├─ zoom
├─ activePanel
├─ inspectorTab
└─ previewOverrides
```

Editor-only StateをProject Documentへ混ぜない。

例:

```text
Saved Project
├─ node-save-button
├─ flow-save-user
└─ resource-backend

Not Saved
├─ selectedNode = node-save-button
├─ hoveredNode = node-email
├─ pointer = {x, y}
└─ zoom = 1.25
```

### 6.17 Runtime StateとProject Definitionを分離する

ProjectはApplication Definitionであり、実行中の状態そのものではない。

```text
Project Definition
├─ State Schema
├─ Initial State
├─ UI Definition
└─ Flow Definition
```

```text
Runtime Instance
├─ Current State Values
├─ Active Flows
├─ Pending Requests
├─ Open Overlays
└─ Navigation State
```

通常のRuntime Instance DataをProject保存時に自動保存しない。

### 6.18 Preview OverrideをProjectへ保存しない

Editor上の編集補助のためにApplicationを一時的に異なる状態で表示できる。

```text
Project
└─ Modal
   └─ open = false

Preview Override
└─ forceVisible(modal) = true
```

Preview OverrideはProject Definitionを変更しない。

Exportにも含めない。

### 6.19 Geometry CacheをProjectへ保存しない

DOMから取得するBounding Rect等はDerived Runtime Dataである。

```text
Derived Geometry
├─ x
├─ y
├─ width
├─ height
├─ clientRect
└─ scrollOffset
```

これらを通常UI LayoutのSource of TruthとしてProjectへ保存しない。

EditorのHit TestやInteraction Surfaceで一時的に利用する。

### 6.20 Project MutationはCommand経由とする

Project変更をEditor Componentから直接任意Mutationしない。

```text
Editor Intent
      ↓
Command
      ↓
Project Mutation
      ↓
Normalization
      ↓
Validation
```

代表Command:

```text
Project Commands
├─ ADD_NODE
├─ DELETE_NODE
├─ MOVE_NODE
├─ REORDER_NODE
├─ MOVE_TO_SLOT
├─ SET_PROPERTY
├─ SET_LAYOUT
├─ SET_PRESENTATION
├─ ADD_FLOW
├─ CONNECT_FLOW
├─ DISCONNECT_FLOW
├─ SET_STATE
├─ SET_RESOURCE
└─ SET_COMPONENT
```

### 6.21 複合変更をTransactionとして扱う

1つのUser Intentが複数Project Mutationを必要とする場合、Transactionとしてまとめる。

```text
User Action
└─ Create Horizontal Split
      ↓
Transaction
├─ ADD_LAYOUT_NODE
├─ MOVE_NODE
├─ MOVE_NODE
└─ SET_LAYOUT
```

Undo / Redoは内部Command数ではなくUser Intent単位を基本とする。

### 6.22 Project HistoryをProject Definitionと分離する

Undo / Redo HistoryはEditor Session Dataとして扱い、Project Definitionそのものへ必須保存しない。

```text
Editor Session
├─ Current Project
└─ History
   ├─ Past Transactions
   └─ Future Transactions
```

Project永続化とHistory永続化は別機能として扱う。

### 6.23 Mutation後にNormalizationを行う

Project Mutation後はCanonical FormへNormalizeする。

```text
Command / Transaction
      ↓
Mutation
      ↓
Normalization
      ↓
Validation
      ↓
Render
```

Normalizationは意味を変えない構造整理のみを行う。

### 6.24 Semantic BoundaryをNormalizationから保護する

Normalizerが以下を暗黙削除・統合してはならない。

```text
Preserve Boundary
├─ Explicit User Container
├─ Component Root
├─ Reusable Component Boundary
├─ Slot Boundary
├─ Semantic Group
├─ Styling Boundary
├─ Flow Reference Target
└─ Externally Referenced Node
```

### 6.25 Project-level Validationを行う

保存、Preview、Exportで共通Validatorを使用する。

```text
Project Validation
├─ Schema Validation
├─ ID Validation
├─ Reference Validation
├─ UI Validation
├─ Flow Validation
├─ State Validation
├─ Resource Validation
├─ Component Validation
└─ Settings Validation
```

Reference切れ等を各Subsystemで個別に黙って無視しない。

### 6.26 Deleted Entity Referenceを検出する

Entity削除時はReference Integrityを確認する。

```text
Delete UI Node
      ↓
Reference Search
├─ Flow Trigger
├─ Flow Action
├─ State Binding
└─ External Project Reference
      ↓
Delete Policy
```

削除PolicyはCommand側で明示する。

```text
Delete Policy
├─ Block Delete # Referenceがある場合削除不可
├─ Cascade Delete # 明示された関連Entityを削除
└─ Leave Invalid Reference # 原則使用しない
```

Userに見えない形でReferenceを勝手に別Nodeへ付け替えない。

### 6.27 Serialization FormatをCanonicalにする

ProjectはJSON等へSerialization可能なPure Data Modelを基本とする。

```text
Project Document
      ↓
Serialize
      ↓
Portable Project Data
      ↓
Deserialize
      ↓
Schema Migration
      ↓
Validation
      ↓
Project Document
```

Function、DOM Node、Svelte Proxy等をPersistent Project Dataへ保存しない。

### 6.28 Project ModelをFramework-independentにする

Project ObjectはSvelte固有Reactive ObjectをCanonical Modelにしない。

```text
Framework-independent Project
      ↓
Svelte Editor Adapter
```

Svelte側では必要に応じてProject変更通知を購読する。

Project SchemaそのものをSvelte `$state` 等へ依存させない。

### 6.29 TypeScript SchemaはBuilder内部実装とする

Builder内部ではProject ModelをTypeScript Type / Schemaとして定義する。

```text
Builder
└─ TypeScript Project Schema
      ↓
Validation / Editing / Export
```

TypeScript TypeそのものをGenerated ApplicationのRuntime Requirementにはしない。

Export時はJavaScriptから利用可能なApplication Definitionへ変換する。

```text
TypeScript Builder Model
      ↓
Static Exporter
      ↓
JavaScript Application Definition
```

### 6.30 Application DefinitionとEditor Project Dataの意味を一致させる

Export時にProjectを別の意味Modelへ変換しない。

```text
Project Document
      ↓
Serialize / Build
      ↓
Application Definition
```

Data表現を最適化してもSemantic Meaningは維持する。

### 6.31 Project Documentの最終構成

```text
Project Document # Application全体のCanonical Source of Truth
├─ meta # Project Identity / Schema Version
│  ├─ id
│  ├─ name
│  ├─ schemaVersion
│  ├─ createdAt
│  └─ updatedAt
│
├─ ui # Logical UI Definition
│  ├─ roots
│  └─ nodes
│
├─ flows # Structured Behavior Graph
│  ├─ flows
│  ├─ nodes
│  └─ edges
│
├─ state # Persistent State Definitions
│  ├─ application
│  ├─ pages
│  └─ components
│
├─ resources # External Resource Definitions
│  └─ REST Resources
│
├─ components # Component Definitions / References
│  ├─ Built-in
│  ├─ Registered Web Components
│  ├─ Project Components
│  └─ External Components
│
└─ settings # Application / Environment / Export Settings
```

### 6.32 Project Document Invariants

```text
A # Project DocumentをApplicationのSingle Source of Truthとする

B # DOM、Generated HTML、Svelte StateをSource of Truthにしない

C # Persistent Project DataとEditor-only Stateを分離する

D # Project DefinitionとRuntime Instance Stateを分離する

E # Stable IDをProject内Referenceの基盤とする

F # Display NameをReference Keyとして使用しない

G # Referenceは解析可能なStructured Dataとして保持する

H # UI / Flow / State / Resources / Componentsの責務を分離する

I # SecretをProject Documentへ保存しない

J # Project MutationはCommand / Transactionを経由する

K # Mutation後にNormalizationとValidationを行う

L # Semantic BoundaryをNormalizerが破壊しない

M # Schema VersionとMigrationを明示する

N # Persistent Project DataへDOM NodeやFramework Objectを保存しない

O # Builder内部ではTypeScriptを利用してよいがExport結果へTypeScript実行環境を要求しない

P # ExportされたApplication DefinitionとProject DocumentのSemanticsを一致させる
```

---

## 7. UI Document Model

UI DocumentはApplication UIのLogical Structure、Component Instance、Slot、Layout、Size、Properties、Presentationを表すSemantic Modelである。

UI DocumentはDOM Treeそのものではなく、RendererがDOM / Web Componentsを生成するためのCanonical UI Definitionとする。

```text
UI Document
├─ roots # Page等のRoot UI Node
└─ nodes # Stable IDで管理されるUI Node群
      │
      ▼
Logical UI Tree
      │
      ▼
Shared Renderer
      │
      ▼
Application DOM / Web Components
```

### 7.1 UI DocumentをSemantic UI Modelとする

UI Documentは画面上の座標やDOM実装ではなく、Application UIの意味構造を保持する。

```text
UI Semantic Model
├─ Structure # NodeのLogical Ownership
├─ Component # Nodeが何のComponentか
├─ Slot # Parent内の挿入先
├─ Properties # Component Public Property
├─ Layout # 子Nodeの配置Rule
├─ Size # Semantic Size
└─ Presentation # Render Surface等
```

DOMはRendererによって導出する。

### 7.2 UI NodeをUI Documentの基本単位とする

各UI要素はStable IDを持つUI Nodeとして表現する。

```text
UINode
├─ id # Stable Node ID
├─ type # Component Definitionを参照するType
├─ name # Editor上のDisplay Name
├─ parentId # Logical Parent
├─ slot # Parent Component内の所属Slot
├─ children # Logical Child Node
├─ props # Component Public Properties
├─ layout # Child Layout Rule
├─ size # Semantic Size
├─ presentation # Render Surface等
└─ metadata # 必要最小限のPersistent UI Metadata
```

Editor専用情報をUINodeへ無制限に追加しない。

Button Nodeの概念的保存例:

```json
{
  "id": "node-save-button",
  "type": "ui-button",
  "name": "Save Button",
  "parentId": "node-actions",
  "slot": null,
  "children": [],
  "props": {
    "label": "Save",
    "disabled": {
      "$ref": "state.form.submitting"
    }
  },
  "layout": null,
  "size": {
    "width": "fit",
    "height": "fit"
  },
  "presentation": {
    "surface": "content"
  }
}
```

この例はUI NodeがDOM ElementではなくSemantic Definitionであることを示す。

### 7.3 UI Node IDをStable Referenceとする

UI Node IDはFlow、State Binding、Editor Operation等から参照されるStable Identifierとする。

```text
UI Node
└─ id = node-save-button
```

```text
Flow Trigger
├─ target = node-save-button
└─ event = click
```

Nodeの移動やLayout変更によってIDを変更しない。

### 7.4 UI NodeのDisplay NameとIDを分離する

```text
UINode
├─ id = node_01HX...
└─ name = "Save Button"
```

`name` はUserが自由に変更できる。

`id` はReference Integrityのため安定させる。

### 7.5 Logical OwnershipをParent / Child関係として保持する

UI TreeはApplication上の論理的な所属関係を表す。

```text
Page
└─ UserForm
   ├─ NameInput
   ├─ EmailInput
   ├─ SaveButton
   ├─ ErrorPopover
   └─ SuccessSnackbar
```

ErrorPopoverやSuccessSnackbarが別Render Surfaceへ描画されてもLogical ParentはUserFormのままとする。

### 7.6 Logical OwnershipとDOM Parentを同一視しない

Physical RenderingによってDOM上のParentが変わってもLogical Treeを変更しない。

```text
Logical Tree
└─ UserForm
   ├─ SaveButton
   ├─ ErrorPopover
   └─ SuccessSnackbar
```

```text
Physical Rendering
├─ Content Surface
│  └─ UserForm
│     └─ SaveButton
│
└─ Overlay Surface
   ├─ Anchored
   │  └─ ErrorPopover
   └─ Notification
      └─ SuccessSnackbar
```

DOM Parentを逆解析してLogical Parentを決定しない。

### 7.7 Root Nodeを明示する

UI Documentは1つ以上のRoot Nodeを持つことができる。

通常はPage等をRootとする。

```text
UI Document
└─ roots
   ├─ HomePage
   ├─ UsersPage
   └─ SettingsPage
```

Root間のNavigationはFlow / Navigation Modelで扱う。

### 7.8 Node TypeはComponent Definitionを参照する

UI Node自身にComponent実装を埋め込まない。

```text
UINode
├─ id = node-save
└─ type = ui-button
      ↓
Component Registry
      ↓
Component Definition
```

Component DefinitionからProps、Slots、Events、Actions等を解決する。

### 7.9 Component Public ContractをUI Documentの境界とする

UI Documentが知るComponent情報はPublic Contractまでとする。

```text
Component Public Contract
├─ Properties
├─ Slots
├─ Events
└─ Actions
```

以下をUI Documentへ保存しない。

```text
Component Private Implementation
├─ Shadow DOM Structure
├─ Internal CSS Selector
├─ Internal Event Listener
├─ Private State
└─ Implementation Framework State
```

### 7.10 PropsをComponent公開値として保持する

Component Instance固有の設定値を `props` として保持する。

```text
Button Node
└─ props
   ├─ label = "Save"
   ├─ disabled = false
   └─ variant = "primary"
```

PropsはComponent Definitionで定義されたSchemaに従う。

任意のprivate Component FieldをPropsとして保存しない。

### 7.11 PropsはLiteralとReferenceを扱えるようにする

Property Valueは固定値だけでなくState等へのBindingを持てる。

```text
Property Value
├─ Literal
│  └─ "Save"
│
└─ Reference
   └─ state.user.name
```

内部的にはLiteralとReferenceを区別できるStructured Representationを使用する。

Literal Property:

```json
{
  "label": "Save"
}
```

State Binding:

```json
{
  "disabled": {
    "$ref": "state.form.submitting"
  }
}
```

Editor、Validator、RuntimeがLiteralとReferenceを区別できるようにする。

### 7.12 ChildrenとSlotを分離して扱う

ComponentがNamed Slotを持つ場合、子Nodeの挿入先を明示する。

```text
ui-card
├─ header
├─ content
└─ actions
```

Logical Child:

```text
Card
├─ Heading
│  └─ slot = header
├─ UserDetails
│  └─ slot = content
└─ SaveButton
   └─ slot = actions
```

単純なchildren順だけからSlotを推測しない。

Named Slotを使用する具体例:

```json
{
  "id": "node-save-button",
  "type": "ui-button",
  "parentId": "node-user-card",
  "slot": "actions"
}
```

```text
UserCard
├─ header
│  └─ UserHeading
├─ content
│  └─ UserForm
└─ actions
   └─ SaveButton
```

`parentId` はLogical Ownership、`slot` はParent内部のPlacement Boundaryを表す。

### 7.13 Slot DefinitionをComponent Metadataから解決する

Slotの仕様はComponent Definition側で定義する。

```text
Slot Definition
├─ name # Slot Name
├─ acceptedTypes # Drop可能Component
├─ cardinality # 1 / many等
├─ required # Required Slotか
└─ layout # Slot内部Layout Rule
```

UI DocumentはNodeがどのSlotに所属するかを保持する。

SlotそのもののContractを各Nodeへ複製しない。

### 7.14 Slot BoundaryをSemantic Boundaryとする

Slot間を跨ぐNode移動は通常のSibling Reorderとは区別する。

```text
MOVE_NODE
└─ Same Slot

MOVE_TO_SLOT
└─ Different Slot
```

NormalizerがSlot Boundaryを無視してNodeを別Slotへ移動しない。

### 7.15 LayoutをSemantic Ruleとして保持する

通常Layoutは座標ではなく構造的なRuleとして保存する。

```text
Layout
├─ Stack
│  ├─ Vertical
│  └─ Horizontal
├─ Grid
└─ Slot-defined Layout
```

Overlayは通常Flow Layoutとは異なるPresentation / Rendering Policyとして扱う。

Layoutは原則としてContainer系UI Nodeの`layout` Propertyとして保持する。
Stackそのものを必ず独立Component Typeとして要求しない。

```json
{
  "id": "node-actions",
  "type": "ui-container",
  "children": [
    "node-cancel-button",
    "node-save-button"
  ],
  "layout": {
    "type": "stack",
    "direction": "horizontal",
    "gap": "md",
    "align": "center",
    "justify": "end"
  }
}
```

```text
Container Node
└─ layout
   ├─ type = stack
   ├─ direction = horizontal
   ├─ gap = md
   ├─ align = center
   └─ justify = end
```

特殊なReusable Layout Componentが必要な場合のみ、Component Typeとして別途定義する。

### 7.16 Vertical Stackを一次Layoutとして扱う

Vertical Stackは子Nodeを縦方向に順序付けする。

```text
Vertical Stack
├─ Heading
├─ TextInput
├─ TextInput
└─ Button
```

主なProperty:

```text
Vertical Stack
├─ gap
├─ align
├─ justify
├─ padding
└─ wrapping # 必要な場合
```

Node座標を保存してVertical Stackを再現しない。

### 7.17 Horizontal Stackを一次Layoutとして扱う

Horizontal Stackは子Nodeを横方向に配置する。

```text
Horizontal Stack
├─ CancelButton
└─ SaveButton
```

主なProperty:

```text
Horizontal Stack
├─ gap
├─ align
├─ justify
├─ padding
└─ wrapping
```

### 7.18 Gridを構造Layoutとして扱う

Gridは複数Column / RowによるLayoutを表す。

```text
Grid
├─ columns
├─ rows
├─ gap
├─ alignment
└─ child placement
```

Grid Placementも可能な限りSemantic Grid情報として保持する。

Freeform座標へ変換しない。

Gridの概念例:

```json
{
  "id": "node-dashboard-grid",
  "type": "ui-container",
  "layout": {
    "type": "grid",
    "columns": [
      {"type": "fraction", "value": 1},
      {"type": "fraction", "value": 2}
    ],
    "gap": "md"
  }
}
```

### 7.19 Freeform / Absolute LayoutをDefaultにしない

通常Component配置ではAbsolute Positionを保存しない。

```text
Default
├─ Stack
├─ Grid
└─ Slot Layout

Special Mode
└─ Freeform / Absolute
```

将来Freeformが必要な場合、明示的な特殊Layout Modeとして追加する。

通常Layoutと同一Schemaへ曖昧に混在させない。

### 7.20 SizeをSemantic Modelとして保持する

Node Sizeを可能な限り意味的なSizing Ruleとして表現する。

```text
Semantic Size
├─ fit # Contentに合わせる
├─ fill # 利用可能領域を埋める
├─ fixed # 明示Size
├─ fraction # Grid / Flex等の比率
├─ min # Minimum Constraint
└─ max # Maximum Constraint
```

Resize Gestureで得たPointer Geometryをそのまま保存するのではなく、適切なSemantic Sizeへ変換する。

例:

```json
{
  "size": {
    "width": {
      "type": "fill"
    },
    "height": {
      "type": "fit"
    },
    "minWidth": {
      "type": "fixed",
      "value": 240,
      "unit": "px"
    }
  }
}
```

Resize Gestureで得たPixel値をそのまま`x / y / width / height`として保存するのではなく、Semantic Sizeへ変換する。

### 7.21 Fixed Sizeを禁止しない

絶対座標を基本にしないことと、固定Width / Heightを禁止することは別である。

```text
Allowed
└─ width
   └─ fixed = 320px
```

必要なComponentでは固定Sizeを設定可能とする。

ただしEditor Gestureの一時Pixel PositionをPersistent Positionとして保存しない。

### 7.22 SpacingをLayout Propertyとして優先する

Sibling間隔は各Childの個別MarginよりParent Layoutの `gap` を優先する。

```text
Preferred
└─ Vertical Stack
   └─ gap = md
```

必要な場合はDesign Tokenを利用できる。

```text
Spacing
├─ xs
├─ sm
├─ md
├─ lg
└─ Custom Value
```

### 7.23 Container PaddingとChild Marginを区別する

外側余白と内側余白の責務を曖昧にしない。

```text
Container
├─ padding # Container内部境界との間隔
└─ layout.gap # Child同士の間隔
```

個別Marginが必要な場合のみChild Presentationとして扱う。

### 7.24 Child OrderをLogical Orderとして保持する

Stackや通常Containerではchildren順をSemantic Orderとして扱う。

```text
children
├─ node-a
├─ node-b
└─ node-c
```

DOMを読み取ってOrderを保存し直す方式にしない。

### 7.25 Drag & DropをDrop Intentへ変換する

Pointer座標から直接Persistent Positionを作らない。

```text
Pointer
   ↓
Hit Test
   ↓
Drop Candidate
   ↓
Drop Intent
```

Drop Intent:

```text
Drop Intent
├─ before # 対象Nodeの直前
├─ after # 対象Nodeの直後
├─ inside # Container内部
├─ slot # Named Slot内部
└─ split # 新しいLayout Structureを作る
```

### 7.26 Drop IntentをCommandへ変換する

Drop確定時にStructure変更Commandを生成する。

```text
Drop Intent
      ↓
Command / Transaction
      ↓
UI Document Mutation
      ↓
Normalization
      ↓
Validation
```

例:

```text
after
└─ REORDER_NODE

inside
└─ MOVE_NODE

slot
└─ MOVE_TO_SLOT

split
└─ Transaction
   ├─ ADD_LAYOUT_NODE
   ├─ MOVE_NODE
   └─ MOVE_NODE
```

具体例:

```text
Before

Actions
├─ CancelButton
└─ SaveButton

DeleteButtonをSaveButtonの後ろへDrag
      ↓
Hit Test
      ↓
Drop Intent
└─ after(node-save-button)
      ↓
Command
└─ MOVE_NODE
   ├─ node = node-delete-button
   ├─ parent = node-actions
   └─ after = node-save-button
      ↓
After

Actions
├─ CancelButton
├─ SaveButton
└─ DeleteButton
```

Drop時のPointer座標は最終Project Dataへ残さない。

### 7.27 Drag GeometryをUI Documentへ保存しない

Drag中に使用する以下はEditor-only Stateとする。

```text
Drag Geometry
├─ pointer
├─ sourceRect
├─ targetRect
├─ dragPreviewRect
├─ candidateZone
└─ temporaryDropIntent
```

Drop完了後はStructureのみ残す。

### 7.28 PresentationをStructureから分離する

NodeのLogical OwnershipとPhysical Rendering条件を別Dataとして扱う。

```text
UINode
├─ Structure
│  ├─ parentId
│  ├─ children
│  └─ slot
│
└─ Presentation
   └─ Render Surface
```

これによりOverlay ComponentもLogical Tree内に維持できる。

### 7.29 Render Surfaceを明示する

Application用Surface:

```text
Application Render Surfaces
├─ Content Surface # 通常Layoutへ参加する
└─ Overlay Surface # 通常Layoutとは独立して描画する
   ├─ Anchored # Popover / Tooltip / Dropdown等
   ├─ Modal # Modal / Dialog / Blocking Drawer等
   └─ Notification # Snackbar / Toast等
```

Editor専用Surface:

```text
Editor Render Surface
└─ Interaction Surface
   ├─ Selection Border
   ├─ Hover Outline
   ├─ Drop Indicator
   ├─ Slot Indicator
   ├─ Drag Preview
   ├─ Resize Handle
   ├─ Alignment Guide
   └─ Spacing Guide
```

Interaction SurfaceはUI Documentへ保存しない。

### 7.30 Overlay ComponentのLogical Ownershipを維持する

例:

```text
Logical UI
└─ UserForm
   ├─ SaveButton
   ├─ ValidationPopover
   └─ SuccessSnackbar
```

Physical Rendering:

```text
Render
├─ Content Surface
│  └─ UserForm
│     └─ SaveButton
│
└─ Overlay Surface
   ├─ Anchored
   │  └─ ValidationPopover
   └─ Notification
      └─ SuccessSnackbar
```

Overlayへ描画するためにNodeをUI Tree上のGlobal Overlay Rootへ移動しない。

### 7.31 Anchored OverlayはAnchor Referenceを持てる

Popover、Tooltip等は表示基準となるUI NodeをReference可能にする。

```text
Anchored Presentation
├─ surface = overlay.anchored
├─ anchor = node-input-email
├─ placement = bottom-start
└─ collisionPolicy
```

Anchor ReferenceにはStable Node IDを使用する。

DOM Selectorを保存しない。

Anchored Overlayの概念的保存例:

```json
{
  "id": "node-validation-popover",
  "type": "ui-popover",
  "name": "Validation Popover",
  "parentId": "node-user-form",
  "slot": null,
  "presentation": {
    "surface": "overlay.anchored",
    "anchor": "node-email-input",
    "placement": "bottom-start"
  }
}
```

```text
Logical Ownership
└─ UserForm
   └─ ValidationPopover

Physical Rendering
└─ Overlay Surface
   └─ Anchored
      └─ ValidationPopover
         └─ anchor = EmailInput
```

`parentId`、`surface`、`anchor`はそれぞれ異なる意味を持つ。

### 7.32 Modal OverlayはLogical Parentと独立してBlocking Behaviorを持つ

```text
Modal Presentation
├─ surface = overlay.modal
├─ backdrop
├─ blocking
├─ focusPolicy
└─ dismissPolicy
```

Focus TrapやBackdrop等の実行処理はOverlay Managerが担当する。

UI Documentは必要なSemantic Configurationのみ保持する。

### 7.33 Notification OverlayをLogical UIとして保持できる

SnackbarやToastもFlowから突然生成される無名DOMとしてのみ扱わず、必要に応じてLogical UI Nodeとして定義できる。

```text
Page
└─ SaveFlowFeedback
   └─ SuccessSnackbar
```

FlowからStable Node IDでActionを呼び出せる。

```text
Show Snackbar
└─ target = node-success-snackbar
```

### 7.34 UI DocumentとFlow Documentを分離する

UI NodeへFlow GraphやJavaScriptコードを埋め込まない。

```text
UI Document
└─ SaveButton
   └─ id = node-save
```

```text
Flow Document
└─ SaveUser
   └─ Trigger
      ├─ target = node-save
      └─ event = click
```

UI DocumentはComponent Structureを、Flow DocumentはBehaviorを担当する。

### 7.35 UI EventはComponent Public Eventを参照する

Flow Triggerで利用可能なEventはComponent Definitionから解決する。

```text
Component Definition
└─ events
   ├─ click
   ├─ change
   └─ submit
```

Component内部private DOM EventをFlowへ直接Exposeしない。

### 7.36 UI ActionはComponent Public Actionを使用する

FlowからUIを操作する場合もUI Nodeのprivate DOMを操作しない。

```text
Flow
      ↓
UI Controller
      ↓
Component Public Action
      ↓
Component
```

例:

```text
Modal
└─ actions
   ├─ open()
   └─ close()
```

### 7.37 Component Instance BoundaryをSemantic Boundaryとする

Project ComponentやReusable ComponentのRootはNormalizerが暗黙解体しない。

```text
Reusable Component Instance
└─ Component Root
   ├─ Slot
   └─ Internal Structure
```

Componentizationの意味を単なるContainer最適化として扱わない。

### 7.38 Explicit Containerを維持する

Userが明示的に作成したContainerは、見た目上冗長でもSemantic Boundaryとして保持できる。

```text
Explicit Container
├─ Styling Boundary
├─ Semantic Group
├─ Future Drop Target
└─ Flow Reference Target
```

Normalizerが自動生成ContainerとUser-created Containerを区別する。

### 7.39 Auto-generated Layout Containerを識別可能にする

Split操作等によってEditorが自動作成するLayout Containerは、そのOriginを識別可能にしてよい。

```text
Layout Container
├─ explicit # Userが明示作成
└─ generated # Editorが構造維持のため自動作成
```

Generated Containerのみ、安全な場合にNormalization対象とできる。

### 7.40 UI Node削除時にReference Integrityを確認する

UI NodeがFlow等から参照されている場合、削除前にDependencyを確認する。

```text
Delete UI Node
      ↓
Dependency Check
├─ Flow Trigger Reference
├─ Flow UI Action Reference
├─ Anchor Reference
├─ State Binding
└─ Component Reference
```

Referenceを黙って壊さない。

### 7.41 UI TreeのCircular Referenceを禁止する

Parent / Child関係はTreeとして成立しなければならない。

```text
Invalid

A
└─ B
   └─ C
      └─ A
```

ValidatorとCommand Handler双方でCircular Structureを防止する。

### 7.42 Slot CompatibilityをValidationする

Node移動時およびProject Validation時にSlot Contractを確認する。

```text
Drop Node
      ↓
Target Slot
      ↓
Slot Definition
├─ acceptedTypes
├─ cardinality
└─ required
      ↓
Accept / Reject
```

Editor上のDrop Indicatorも同じValidation Ruleを利用する。

### 7.43 Layout CompatibilityをValidationする

Layoutごとに有効なChild Placementを確認する。

```text
Layout Validation
├─ Stack Child Rule
├─ Grid Placement Rule
├─ Slot Rule
└─ Special Layout Rule
```

Editorで許可した操作がExport時にInvalidになるRule差異を作らない。

### 7.44 UI DocumentからReal DOMを導出する

Rendering Directionは常にUI DocumentからDOMへ向ける。

```text
UI Document
      ↓
Component Registry
      ↓
Shared Renderer
      ↓
Application DOM
```

通常操作でDOMからUI Documentを逆生成しない。

### 7.45 DOM MutationをProject Mutationとして扱わない

Component内部やBrowserによるDOM変化をそのままProject変更として採用しない。

```text
DOM Mutation
   ✕
Project Source of Truth
```

Project変更はCommand経由とする。

### 7.46 EditorとProductionで同一UI Semanticsを使用する

```text
UI Document
      ↓
Shared Renderer
├─ Editor Mode
└─ Runtime Mode
```

Editor ModeではInteraction Surface等を追加するが、Application DOMのSemantic Rendering Ruleは変更しない。

### 7.47 UI Documentの概念的な最終構成

```text
UI Document
├─ roots # Page等のRoot Node ID
│
└─ nodes
   └─ UINode
      ├─ id # Stable Node ID
      ├─ type # Component Type Reference
      ├─ name # Display Name
      ├─ parentId # Logical Parent
      ├─ slot # Parent内のNamed Slot
      ├─ children # Logical Child Order
      │
      ├─ props # Component Public Properties
      │  ├─ Literal Values
      │  └─ Structured References
      │
      ├─ layout # Child Layout Rule
      │  ├─ Vertical Stack
      │  ├─ Horizontal Stack
      │  ├─ Grid
      │  └─ Slot-defined Layout
      │
      ├─ size # Semantic Sizing
      │  ├─ fit
      │  ├─ fill
      │  ├─ fixed
      │  ├─ fraction
      │  ├─ min
      │  └─ max
      │
      └─ presentation # Physical Rendering Policy
         ├─ Content Surface
         └─ Overlay Surface
            ├─ Anchored
            ├─ Modal
            └─ Notification
```

### 7.48 UI Document Invariants

```text
A # UI DocumentをDOMではなくSemantic Modelとして保持する

B # UI NodeはStable IDを持つ

C # Display NameをReferenceとして使用しない

D # Logical OwnershipをParent / Childとして保持する

E # Logical OwnershipとPhysical Renderingを分離する

F # Component TypeはComponent Registryから解決する

G # Component内部DOMをUI Documentへ保存しない

H # Props / Slots / Events / ActionsのPublic Contractを境界とする

I # Named Slotを第一級のSemantic Boundaryとして扱う

J # 通常LayoutではAbsolute Positionを保存しない

K # Drag GeometryをPersistent UI Dataへ保存しない

L # Drop結果をbefore / after / inside / slot / split等のStructureへ変換する

M # Sizeを可能な限りfit / fill / fixed / fraction等のSemantic Ruleで保持する

N # Overlay NodeでもLogical Parentを維持する

O # Render SurfaceをComponent CategoryやLogical Parentと混同しない

P # UIとFlowをStable Node IDで接続する

Q # Flow Behaviorや任意JavaScriptをUI Nodeへ埋め込まない

R # Project MutationはCommand / Transactionを経由する

S # NormalizerはSlot、Component、Explicit Container等のSemantic Boundaryを破壊しない

T # EditorとProductionで同じUI Rendering Semanticsを使用する
```

---

## 8. Flow Document Model

Flow DocumentはApplicationの振る舞いを表すCanonical Behavior Modelであり、Triggerを起点としてAction、Logic、Data、Timing、Control等のNodeを接続したStructured Graphとして保持する。

FlowをJavaScript Source Code、DOM Event Handler、Component内部Logicとして保存しない。

```text
Flow Document # Application BehaviorのCanonical Model
├─ flows # Application内のFlow Definition群
│  └─ Flow
│     ├─ id # Stable Flow ID
│     ├─ name # Editor上のDisplay Name
│     ├─ nodes # Flow Node群
│     ├─ edges # Node間のExecution Path
│     └─ metadata # Flow Editor表示に必要なPersistent Metadata
│
└─ shared # 必要に応じてFlow共通Definitionを保持する
```

### 8.1 FlowをApplication BehaviorのCanonical Modelとする

Applicationの振る舞いはFlow Documentへ集約する。

```text
Application Behavior
├─ User Interaction # Click / Input / Submit等
├─ Lifecycle # App Load / Page Load等
├─ State Change # State更新による処理開始
├─ Resource Access # REST API等
├─ UI Update # Show / Hide / Focus等
├─ Navigation # Page / URL変更
├─ Data Transformation # 値の変換・加工
├─ Conditional Logic # Condition / Switch等
├─ Timing # Delay / Debounce等
└─ Execution Control # Parallel / Retry / Subflow等
      ↓
Flow Document
```

以下をBehaviorのSource of Truthにしない。

```text
Not Behavior Source of Truth
├─ onclick文字列
├─ DOM Event Listenerそのもの
├─ Svelte Event Handler
├─ Web Component内部private logic
└─ Generated JavaScript Source
```

Generated JavaScriptはFlow Documentから導出されるRuntime Execution Formとする。

### 8.2 Flow全体の基本実行モデル

典型的なApplication Behaviorは以下のようなFlowとして表現する。

```text
SaveButton.click
      ↓
Validate Form
      ↓
Condition: Valid?
├─ false
│  ↓
│  Show Validation Error
│
└─ true
   ↓
POST /users
   ↓
Result
├─ success
│  ↓
│  Set state.user
│  ↓
│  Show SuccessSnackbar
│
└─ error
   ↓
   Error Handler
   ↓
   Show ErrorModal
```

この1本のGraph内で以下を明示する。

```text
Flow Responsibilities
├─ Trigger # いつFlowを開始するか
├─ Logic # どのPathを通るか
├─ Resource Action # 外部APIへ何を要求するか
├─ State Action # Application Stateをどう更新するか
├─ UI Action # UIへ何を行うか
└─ Error Path # Failure時にどこへ進むか
```

### 8.3 Flowを独立したStructured Graphとして保持する

各FlowはNodeとEdgeから構成する。

```text
Flow
├─ id # Stable Flow ID
├─ name # Userが変更可能なDisplay Name
├─ nodes
│  ├─ Trigger Node
│  ├─ Action Node
│  ├─ Logic Node
│  ├─ Data Node
│  ├─ Timing Node
│  └─ Control Node
└─ edges
   ├─ default
   ├─ success / error
   ├─ true / false
   └─ Node固有Port
```

Visual Flow Editor上のGraphとPersistent Flow Modelで異なる意味構造を持たない。

### 8.4 Flow IDをStable Referenceとする

各FlowはStable IDを持つ。

```text
Flow
├─ id = flow-save-user
└─ name = "Save User"
```

`name` は変更可能だが、`id` はReference Integrityのため安定させる。

Subflow等からFlowを参照する場合もFlow IDを使用する。

### 8.5 Flow Nodeを実行単位とする

各Flow Nodeは1つの明確な責務を持つ。

```text
Flow Node
├─ id # Flow内のStable Node ID
├─ type # Node Type
├─ config # Node固有設定
├─ inputs # Structured Input
├─ outputs # 公開するOutput Definition
└─ metadata # Editor表示に必要な非Runtime情報
```

概念的な保存例:

```json
{
  "id": "flow-node-create-user",
  "type": "resource.request",
  "config": {
    "resource": "resource-backend",
    "method": "POST",
    "path": "/users"
  },
  "inputs": {},
  "outputs": {
    "data": {}
  },
  "metadata": {
    "x": 720,
    "y": 340
  }
}
```

`metadata.x / y` はFlow Editor上の座標であり、Execution Semanticsには含めない。

### 8.6 Flow Node IDをStableにする

Flow Node間ReferenceやOutput ReferenceにはStable Node IDを使用する。

```text
CreateUser Node
└─ id = flow-node-create-user
```

後続NodeはこのNodeのOutputを参照できる。

```text
outputs.flow-node-create-user.data.id
```

Editor上でNodeを移動、整列、Group化してもNode IDを変更しない。

### 8.7 Flow Editor上の座標をBehavior Semanticsと分離する

Flow Graph EditorではNode Positionを保持してよい。

```text
Flow Editor Metadata
├─ x # Editor Canvas上のX座標
├─ y # Editor Canvas上のY座標
├─ collapsed # Editor上の折りたたみ状態
└─ group # Editor上の表示Group
```

Runtime Dataと分離する。

```text
Flow Node
├─ Runtime Data
│  ├─ type
│  ├─ config
│  ├─ inputs
│  └─ outputs
│
└─ Editor Metadata
   ├─ x
   ├─ y
   ├─ collapsed
   └─ group
```

Flow Editor上の見た目変更によってApplication Behaviorが変化しないようにする。

### 8.8 Trigger NodeをFlow Entry Pointとする

FlowはTriggerから開始する。

```text
Trigger
├─ UI Event # Component Public Event
├─ Lifecycle Event # App / Page等のLifecycle
├─ State Event # State Storeの変更
└─ Timing Event # Delay / Interval / Schedule
```

Triggerを持たないFlowはSubflow等から明示的に呼び出されるCallable Flowとして区別する。

### 8.9 UI Event TriggerをComponent Public Eventへ接続する

UI Event TriggerはUI NodeのStable IDとComponent Public Eventを参照する。

```text
UI Event Trigger
├─ target = node-save-button # Stable UI Node ID
└─ event = click # Component Public Event
```

概念的な保存例:

```json
{
  "id": "flow-node-save-click",
  "type": "trigger.ui-event",
  "config": {
    "target": "node-save-button",
    "event": "click"
  }
}
```

実行経路:

```text
Web Component
      ↓
Component Public Event
      ↓
Trigger Registry
      ↓
Matching Flow Trigger
      ↓
Flow Engine
```

以下のようなDOM Selectorを保存しない。

```text
target = "#form > button.save"
target = "[data-id='save']"
target = "div:nth-child(4)"
```

### 8.10 Lifecycle Triggerを明示的に定義する

ApplicationやPage等のLifecycleをTriggerとして扱える。

```text
Lifecycle Trigger
├─ App Load # Application Runtime起動時
├─ Page Load # Page表示時
└─ Component Mount # 明示的に公開されたComponent Lifecycle
```

Component内部実装の任意Lifecycle Eventを自動Exposeしない。

### 8.11 State Event TriggerをState Storeへ接続する

State変更をFlow Triggerとして扱える。

```text
State Event Trigger
├─ stateReference # 監視対象State
├─ changeType # set / change等
└─ condition # 必要な場合のみExpression
```

例:

```text
state.auth.user changes
      ↓
State Trigger
      ↓
Load User Profile
```

State更新とState Triggerが意図しない無限Loopを形成しないようRuntime GuardとValidationを設ける。

### 8.12 Timing Triggerを実行保証範囲ごとに区別する

Timing EventはBrowserで保証可能なものとServer Capabilityを必要とするものを区別する。

```text
Timing Trigger
├─ Delay # Browser Runtime実行中に一度開始する
├─ Interval # Browser Runtime実行中に繰り返す
├─ Foreground Schedule # Application実行中のみ保証するSchedule
└─ Server Schedule # Backend Scheduler等のExternal Capability
```

Server ScheduleをBrowser Runtime自身の能力として扱わない。

### 8.13 Action Nodeを副作用の実行単位とする

ActionはApplicationまたは外部環境へ副作用を発生させるNodeである。

```text
Action
├─ UI Action # UI Componentへ操作を行う
├─ Resource Action # REST API等へアクセスする
├─ State Action # State Storeを更新する
└─ Navigation Action # Browser Navigationを行う
```

Flow Engine自身へ具体的Action実装を埋め込まず、Action RegistryからRuntime Serviceへ委譲する。

### 8.14 UI ActionをUI Controllerへ委譲する

UI ActionはStable UI Node IDをTargetとする。

```text
UI Action
├─ Show
├─ Hide
├─ Enable
├─ Disable
├─ Focus
├─ Scroll
├─ Set Property
└─ Overlay Action
```

Modalを開く例:

```json
{
  "id": "flow-node-open-error-modal",
  "type": "ui.action",
  "config": {
    "target": "node-error-modal",
    "action": "open"
  }
}
```

実行経路:

```text
Flow UI Action
      ↓
Action Registry
      ↓
UI Controller
      ↓
Stable Node ID Resolution
      ↓
Component Public Contract
      ↓
Web Component
```

以下のような実装を行わない。

```text
Flow
  ↓
querySelector("#error-modal")
  ↓
shadowRoot.querySelector(...)
```

### 8.15 Overlay ActionをOverlay Managerへ委譲する

Overlay操作もUI Actionの一種として扱う。

```text
Overlay Action
├─ Open Modal
├─ Close Modal
├─ Open Drawer
├─ Close Drawer
├─ Open Popover
├─ Close Popover
├─ Show Snackbar
└─ Show Toast
```

実行経路:

```text
Flow
  ↓
UI Controller
  ↓
Overlay Manager
  ↓
Overlay Surface
├─ Anchored
├─ Modal
└─ Notification
```

Logical OwnershipはUI Document側に維持する。

### 8.16 Resource ActionをResource Definitionから分離する

REST Action内へEnvironment固有のConnection情報を重複保存しない。

Project側のResource Definition:

```json
{
  "id": "resource-backend",
  "type": "rest",
  "baseUrl": "https://api.example.com",
  "commonHeaders": {
    "Accept": "application/json"
  }
}
```

Flow側のResource Action:

```json
{
  "id": "flow-node-create-user",
  "type": "resource.request",
  "config": {
    "resource": "resource-backend",
    "method": "POST",
    "path": "/users",
    "body": {
      "email": {
        "$ref": "state.form.email"
      },
      "name": {
        "$ref": "state.form.name"
      }
    }
  }
}
```

実行時:

```text
Flow Resource Action
      ↓
Resource Client
      ↓
resource-backend
      ↓
baseUrl + path
      ↓
Fetch API
      ↓
REST API
```

Environmentを切り替えてもFlow Graph自体を変更しない。

### 8.17 REST Actionを標準Resource Actionとする

初期Core Resource ActionはRESTを中心とする。

```text
REST API Request
├─ GET
├─ POST
├─ PUT
├─ PATCH
└─ DELETE
```

REST Actionは以下の情報をStructured Dataとして保持できる。

```text
REST Action
├─ resource # Resource ID
├─ method # HTTP Method
├─ path # Resource Base URLからの相対Path
├─ query # Query Parameters
├─ headers # Request固有Header
├─ body # Request Body
├─ timeout # 必要な場合
└─ output # Response Output Definition
```

必要に応じて将来拡張する。

```text
Optional / Future Resource Actions
├─ Upload
├─ Download
├─ WebSocket Send
└─ SSE Subscribe
```

WebSocket / SSEを初期Core Requirementにはしない。

### 8.18 REST Action OutputをStructured Outputとして公開する

REST Requestの結果を暗黙Global Variableへ保存しない。

```text
Create User Request
└─ id = flow-node-create-user
   └─ outputs
      ├─ data
      ├─ status
      └─ headers
```

後続Nodeから参照する。

```text
outputs.flow-node-create-user.data.id
outputs.flow-node-create-user.status
```

概念的なReference:

```json
{
  "$ref": "outputs.flow-node-create-user.data.id"
}
```

### 8.19 State ActionをState Storeへ委譲する

State更新をStructured Actionとして表現する。

```text
State Action
├─ Set
├─ Merge
├─ Clear
├─ Toggle
├─ Increment
├─ Decrement
├─ Append
└─ Remove
```

例:

```json
{
  "id": "flow-node-set-user",
  "type": "state.set",
  "config": {
    "target": {
      "$ref": "state.user"
    },
    "value": {
      "$ref": "outputs.flow-node-create-user.data"
    }
  }
}
```

State ActionはState Store経由で実行する。

### 8.20 Navigation ActionをNavigation Controllerへ委譲する

Browser Navigation処理をFlow Nodeごとに直接実装しない。

```text
Navigation Action
├─ Navigate
├─ Back
├─ Forward
├─ Reload
├─ Open External URL
└─ Set Query Parameter
```

実行経路:

```text
Flow Navigation Action
      ↓
Navigation Controller
      ↓
Browser APIs
├─ History
├─ Location
├─ URL
└─ URLSearchParams
```

### 8.21 Logic Nodeを副作用なしの分岐処理として扱う

Logic NodeはFlow Execution Pathを選択する。

```text
Logic
├─ Condition
├─ Switch
└─ Guard
```

Logic Node内でREST RequestやDOM操作等の副作用を実行しない。

### 8.22 Condition Nodeをtrue / false Edgeへ接続する

```text
Condition: Valid?
├─ true
│  ↓
│  Create User
│
└─ false
   ↓
   Show Validation Error
```

Condition Node:

```json
{
  "id": "flow-node-is-valid",
  "type": "logic.condition",
  "config": {
    "expression": {
      "type": "eq",
      "left": {
        "$ref": "outputs.flow-node-validation.valid"
      },
      "right": true
    }
  }
}
```

Condition結果をNode内部の暗黙Branchにせず、Edge PortとしてGraphへ表現する。

### 8.23 Switch Nodeを複数Port分岐として扱う

```text
Switch: state.user.role
├─ admin
│  └─ Admin Flow
├─ member
│  └─ Member Flow
├─ guest
│  └─ Guest Flow
└─ default
   └─ Fallback Flow
```

Switch Port Definitionは解析可能なStructured Dataとして保持する。

### 8.24 Guard NodeをFlow継続条件として扱う

Guardは条件を満たさない場合にFlowを停止、または別Pathへ送る。

```text
Guard: Is Authenticated?
├─ pass
│  └─ Continue
└─ reject
   └─ Navigate Login
```

複雑な条件を各Action Nodeへ重複して埋め込まず、必要に応じてGuardとして明示する。

### 8.25 Data Nodeを値変換の実行単位とする

Data Nodeは原則として外部副作用を持たず、入力からOutputを生成する。

```text
Data
├─ Set Variable
├─ Transform
├─ Map
├─ Filter
├─ Pick
├─ Merge
├─ Format
├─ Calculate
└─ Parse
```

### 8.26 Data Node Outputを後続Nodeから参照可能にする

```text
Normalize User
└─ id = flow-node-normalize-user
   └─ output
      └─ result
```

後続Node:

```text
outputs.flow-node-normalize-user.result.email
```

概念的保存形式:

```json
{
  "$ref": "outputs.flow-node-normalize-user.result.email"
}
```

### 8.27 Timing NodeをTiming Triggerと区別する

Timing TriggerはFlow開始条件である。

Timing NodeはFlow実行途中の時間制御である。

```text
Timing Trigger
└─ Flowを開始する

Timing Node
└─ Flow途中のExecutionを制御する
```

Timing Node:

```text
Timing
├─ Wait
├─ Delay
├─ Debounce
└─ Throttle
```

### 8.28 Wait / DelayをExecution Suspensionとして扱う

```text
Show Snackbar
      ↓
Wait 3000ms
      ↓
Hide Snackbar
```

Browser Runtime内で非同期に実行する。

Runtime全体やBrowser Main ThreadをBlockingしない。

### 8.29 Debounce / Throttleを明示的なTiming Semanticsとして扱う

例:

```text
SearchInput.input
      ↓
Debounce 300ms
      ↓
GET /search
```

Component内部へ暗黙Debounceを埋め込むのではなく、Application Behaviorとして必要な場合はFlow Semanticsとして明示する。

### 8.30 Control NodeをExecution Structureとして扱う

Control Nodeは複数Nodeの実行方法を制御する。

```text
Control
├─ Parallel
├─ For Each
├─ Retry
├─ Error Handler
├─ Cancel
├─ Subflow
└─ Return
```

### 8.31 Parallelを明示的なConcurrency Nodeとする

```text
Parallel
├─ Load User
├─ Load Permissions
└─ Load Preferences
      ↓
Join
      ↓
Render Dashboard
```

Join Policyを明示できるようにする。

```text
Parallel Join
├─ all # 全Branch完了
├─ allSettled # 成否を問わず全Branch完了
└─ first # 最初の完了を採用する場合
```

Runtimeが暗黙的なExecution Orderを推測しない。

### 8.32 For EachをCollection Iterationとして扱う

```text
For Each
├─ source # Collection Reference
├─ itemVariable # Current Item
├─ indexVariable # Current Index
└─ body # Iteration Body
```

例:

```text
state.selectedUsers
      ↓
For Each user
      ↓
DELETE /users/{user.id}
```

Current ItemをGlobal Stateへ暗黙保存しない。

### 8.33 RetryをAction固有実装から分離する

Retryを各Resource Action内部へ独自実装せず、共通Control Semanticsとして表現できるようにする。

```text
Retry
├─ maxAttempts
├─ delay
├─ backoff
└─ retryCondition
```

例:

```text
Retry: max 3
      ↓
POST /users
```

### 8.34 Error HandlingをStructured Execution Pathとして扱う

Failure PathをGraphへ明示する。

```text
POST /users
├─ success
│  ↓
│  Set State
│  ↓
│  Show SuccessSnackbar
│
└─ error
   ↓
   Error Handler
   ↓
   Show ErrorModal
```

Error PathのEdge例:

```json
{
  "id": "edge-create-user-error",
  "fromNode": "flow-node-create-user",
  "fromPort": "error",
  "toNode": "flow-node-error-handler",
  "toPort": "in"
}
```

各Node内部へ独自の`try / catch` Behavior Modelを埋め込まない。

### 8.35 Error Contextを後続Nodeから参照可能にする

Error Handlerでは発生したError情報をStructured Dataとして参照できるようにする。

```text
Error Context
├─ sourceNode
├─ type
├─ message
├─ status
└─ cause
```

Runtime内部のJavaScript Error ObjectそのものをPersistent Flow Dataとして保存しない。

### 8.36 CancelをFlow Executionの第一級操作とする

長時間Request、Wait、Subflow等をCancel可能にする。

```text
Flow Execution
├─ AbortController
├─ Cancellation State
└─ Cancellation Propagation
```

Cancel可能なResource RequestではBrowser標準のAbortControllerを活用する。

### 8.37 SubflowでBehaviorを再利用する

Flowから別Flowを呼び出せる。

```text
SaveUserFlow
      ↓
ValidateUser Subflow
├─ input
│  └─ user = state.form
└─ output
   └─ valid
      ↓
Condition
```

Subflow Nodeの概念的保存例:

```json
{
  "id": "flow-node-validate-user",
  "type": "control.subflow",
  "config": {
    "flow": "flow-validate-user",
    "inputs": {
      "user": {
        "$ref": "state.form"
      }
    }
  }
}
```

Subflow ReferenceにはStable Flow IDを使用する。

### 8.38 Subflow Inputを明示する

Reusable FlowはCallerから受け取るInput Contractを定義できる。

```text
ValidateUser Flow
├─ inputs
│  └─ user
└─ outputs
   └─ valid
```

Caller:

```text
Subflow
├─ flow = flow-validate-user
└─ inputs
   └─ user = state.form
```

Application Stateへ値を一時書き込むことでParameter Passingを代用しない。

### 8.39 ReturnでFlow Outputを明示する

Reusable Flow / SubflowはReturn NodeでOutputを返せる。

```text
ValidateUser
      ↓
Calculate Result
      ↓
Return
└─ valid = outputs.validation.result
```

概念例:

```json
{
  "id": "flow-node-return-validation",
  "type": "control.return",
  "config": {
    "value": {
      "valid": {
        "$ref": "outputs.flow-node-validation.result"
      }
    }
  }
}
```

CallerはSubflow Node Outputとして参照する。

### 8.40 Flow Execution ContextをNamespace分離する

Flow Runtimeが利用する値を明示的に区別する。

```text
Flow Execution Context
├─ event # Triggerから渡されたInput
├─ state # State Store内のApplication Data
├─ variables # Flow Execution固有のLocal Data
├─ outputs # 実行済みNodeのOutput
└─ env # Browserへ公開可能なEnvironment Value
```

Namespaceの意味を混同しない。

### 8.41 Event DataをTrigger Inputとして扱う

UI Event等から受け取る値は `event` Namespaceへ格納する。

```text
event
├─ type # Event Type
├─ target # Trigger Source
└─ detail # Component Public Event Payload
```

例:

```text
event.detail.value
```

Component Public EventごとのPayload SchemaはComponent Definitionで定義可能にする。

### 8.42 Flow VariableをExecution-local Dataとする

Flow VariableはFlow Execution Instanceに閉じる。

```text
variables
├─ formData
├─ currentPage
└─ retryCount
```

Flow VariableをApplication Stateへ暗黙Promoteしない。

Concurrent Flow実行間でも共有しない。

### 8.43 Flow OutputをNode IDごとにNamespace化する

Node OutputはStable Flow Node IDを基準に管理する。

```text
outputs
├─ flow-node-create-user
│  ├─ data
│  └─ status
│
└─ flow-node-transform-user
   └─ result
```

同じNode表示名が存在してもOutput Collisionを起こさない。

### 8.44 Environment ValueをPublic Configurationとして扱う

`env` へ格納するのはBrowserへ公開してよい値のみとする。

```text
env
├─ API_BASE_URL
├─ FEATURE_FLAG
└─ PUBLIC_CONFIG
```

以下を含めない。

```text
Secrets
├─ Private API Key
├─ OAuth Client Secret
├─ Database Password
└─ Backend Credential
```

### 8.45 Flow InputをLiteralまたはReferenceとして扱う

Flow Inputは固定値とDynamic Referenceを明確に区別する。

```text
Flow Input
├─ Literal
│  ├─ string
│  ├─ number
│  ├─ boolean
│  ├─ null
│  ├─ array
│  └─ object
│
└─ Reference
   ├─ event
   ├─ state
   ├─ variables
   ├─ outputs
   └─ env
```

Literal例:

```json
{
  "value": "active"
}
```

Reference例:

```json
{
  "$ref": "state.form.email"
}
```

### 8.46 Structured Referenceを使用する

ReferenceをJavaScript Expressionとして`eval()`する形式にしない。

簡潔な保存形式の例:

```json
{
  "$ref": "state.form.email"
}
```

より構造化する場合の概念例:

```json
{
  "$ref": {
    "scope": "state",
    "path": ["form", "email"]
  }
}
```

重要なのは、ReferenceであることをRuntime、Validator、Editorが明確に識別できることである。

### 8.47 Structured Referenceの対象を明示する

```text
Reference Scope
├─ event # Trigger Event Data
├─ state # State Store
├─ variables # Current Flow Execution
├─ outputs # Flow Node Output
├─ env # Public Environment
├─ uiNode # Stable UI Node Referenceが必要な場合
├─ resource # Resource Definition
└─ flow # Subflow等のFlow Reference
```

異なるReference Typeを同じ曖昧Stringとして扱わない。

### 8.48 ExpressionをASTとして保持する

ConditionやData Transformで使用するExpressionはStructured ASTとして保持する。

```text
Expression
├─ Literal
├─ Reference
├─ Unary Operator
├─ Binary Operator
├─ Logical Operator
├─ Comparison
├─ Conditional
├─ Collection Operation
└─ Supported Function Call
```

視覚表現例:

```text
AND
├─ GTE
│  ├─ state.user.age
│  └─ 18
└─ EQ
   ├─ state.user.enabled
   └─ true
```

### 8.49 Expression ASTの具体的保存例

上記Expressionは概念的に以下のように保存できる。

```json
{
  "type": "and",
  "operands": [
    {
      "type": "gte",
      "left": {
        "$ref": "state.user.age"
      },
      "right": 18
    },
    {
      "type": "eq",
      "left": {
        "$ref": "state.user.enabled"
      },
      "right": true
    }
  ]
}
```

これにより以下を可能にする。

```text
Expression Capabilities
├─ Visual Editing
├─ Validation
├─ Type Analysis
├─ Dependency Analysis
├─ Migration
├─ Static Analysis
└─ Future Compilation
```

### 8.50 Expression EvaluatorをRuntime共通機能とする

Editor PreviewとProductionで別Expression Engineを使用しない。

```text
Expression AST
      ↓
Expression Evaluator
├─ Preview Runtime
└─ Production Runtime
```

Visual Editor上のValidation結果とProduction Execution結果を一致させる。

### 8.51 Arbitrary JavaScriptを基本Flow Modelにしない

以下を通常Flow Nodeとして保存しない。

```text
Do Not Use as Core Flow Representation
├─ eval(...)
├─ new Function(...)
├─ Arbitrary JavaScript Expression
└─ Arbitrary Script Block
```

将来Custom Codeが必要な場合は、明示的なAdvanced / Escape Hatch機能として通常Flowから分離する。

### 8.52 Flow EdgeをExecution Pathとして保持する

EdgeはNode間の実行順序・分岐を表す。

```text
Edge
├─ id # Stable Edge ID
├─ fromNode # Source Node ID
├─ fromPort # Source Output Port
├─ toNode # Destination Node ID
└─ toPort # Destination Input Port
```

具体例:

```json
{
  "id": "edge-condition-valid",
  "fromNode": "flow-node-is-valid",
  "fromPort": "true",
  "toNode": "flow-node-create-user",
  "toPort": "in"
}
```

これにより `true` はNodeではなくOutput Portであることを明示する。

### 8.53 PortをNode Contractとして定義する

Node Typeごとに利用可能なExecution Portを定義する。

```text
Condition Node
├─ Input Ports
│  └─ in
└─ Output Ports
   ├─ true
   └─ false
```

```text
REST Request Node
├─ Input Ports
│  └─ in
└─ Output Ports
   ├─ success
   └─ error
```

無効なPortへのEdgeをValidatorで検出する。

### 8.54 Execution EdgeとData Referenceを分離する

Execution順序とData依存を同じものとして扱わない。

```text
Execution Edge
└─ A → B # Bをいつ実行するか

Data Reference
└─ B.input → outputs.A.data # Bが何を読むか
```

例:

```text
Create User
      ↓ Execution Edge
Set Current User
      └─ value = outputs.CreateUser.data
```

Output Referenceだけから暗黙的Execution Orderを推測しないことを基本とする。

### 8.55 Flow Graphの具体的保存イメージ

Save User Flow全体の概念的な保存例:

```json
{
  "id": "flow-save-user",
  "name": "Save User",
  "nodes": [
    {
      "id": "node-click",
      "type": "trigger.ui-event",
      "config": {
        "target": "node-save-button",
        "event": "click"
      }
    },
    {
      "id": "node-valid",
      "type": "logic.condition",
      "config": {
        "expression": {
          "type": "eq",
          "left": {
            "$ref": "state.form.valid"
          },
          "right": true
        }
      }
    },
    {
      "id": "node-create-user",
      "type": "resource.request",
      "config": {
        "resource": "resource-backend",
        "method": "POST",
        "path": "/users",
        "body": {
          "name": {
            "$ref": "state.form.name"
          },
          "email": {
            "$ref": "state.form.email"
          }
        }
      }
    },
    {
      "id": "node-set-user",
      "type": "state.set",
      "config": {
        "target": {
          "$ref": "state.user"
        },
        "value": {
          "$ref": "outputs.node-create-user.data"
        }
      }
    },
    {
      "id": "node-success",
      "type": "ui.action",
      "config": {
        "target": "node-success-snackbar",
        "action": "open"
      }
    },
    {
      "id": "node-error",
      "type": "ui.action",
      "config": {
        "target": "node-error-modal",
        "action": "open"
      }
    }
  ],
  "edges": [
    {
      "id": "edge-1",
      "fromNode": "node-click",
      "fromPort": "default",
      "toNode": "node-valid",
      "toPort": "in"
    },
    {
      "id": "edge-2",
      "fromNode": "node-valid",
      "fromPort": "true",
      "toNode": "node-create-user",
      "toPort": "in"
    },
    {
      "id": "edge-3",
      "fromNode": "node-create-user",
      "fromPort": "success",
      "toNode": "node-set-user",
      "toPort": "in"
    },
    {
      "id": "edge-4",
      "fromNode": "node-set-user",
      "fromPort": "default",
      "toNode": "node-success",
      "toPort": "in"
    },
    {
      "id": "edge-5",
      "fromNode": "node-create-user",
      "fromPort": "error",
      "toNode": "node-error",
      "toPort": "in"
    }
  ]
}
```

この例はSchemaの最終固定形ではなく、各責務・Reference・Node・Edgeの関係を明示するためのCanonical Exampleとする。

### 8.56 Async ExecutionをFlow Engineの標準Semanticsとする

Resource Action、Wait、Subflow等は非同期実行可能とする。

```text
Flow Engine
├─ Sync Node
├─ Async Node
├─ Await
├─ Error Propagation
└─ Cancellation
```

Node TypeごとにPromise Handlingを独自実装しない。

### 8.57 Flow RuntimeをGeneric Engineとする

Flow Engine自体へ特定ComponentやREST Endpoint固有のBehaviorを埋め込まない。

```text
Flow Engine
├─ Graph Traversal # 次に実行するNodeを決定する
├─ Execution Context # Flow固有Dataを管理する
├─ Node Dispatch # Node TypeからHandlerを解決する
├─ Branching # Portに従ってExecution Pathを選択する
├─ Async Control # Promise / Wait等を扱う
├─ Error Propagation # Error Pathへ送る
└─ Cancellation # Flow Execution停止を扱う
```

具体的ActionはRegistryとRuntime Serviceへ委譲する。

### 8.58 Trigger Registryを拡張境界とする

Trigger Typeと実Browser Event Sourceの接続をRegistryで管理する。

```text
Trigger Registry
├─ UI Event Trigger
├─ Lifecycle Trigger
├─ State Trigger
└─ Timing Trigger
```

Browser Event Listener実装をFlow Engine本体へ分散させない。

### 8.59 Action Registryを拡張境界とする

Action Typeから実行Handlerを解決する。

```text
Action Registry
├─ UI Action Handler
├─ Resource Action Handler
├─ State Action Handler
└─ Navigation Action Handler
```

実行先:

```text
Action Registry
├─ UI Controller
├─ Resource Client
├─ State Store
└─ Navigation Controller
```

Custom Component ActionもComponent Public Contractを介して解決する。

### 8.60 Flow Runtimeの具体的実行経路

SaveButton ClickからREST Request、State更新、Snackbar表示までのRuntime経路:

```text
Browser Click Event
      ↓
Web Component Public Event
      ↓
Trigger Registry
      ↓
flow-save-user
      ↓
Flow Engine
      ↓
Condition Node
      ↓ true
Resource Action
      ↓
Action Registry
      ↓
Resource Client
      ↓
Fetch API
      ↓
REST API
      ↓
Node Output
      ↓
State Action
      ↓
State Store
      ↓
UI Action
      ↓
UI Controller
      ↓
Overlay Manager
      ↓
SuccessSnackbar
```

Flow Engine自身はDOM、Fetch、State implementation detailを直接操作しない。

### 8.61 Flow変更をCommand / Transactionとして扱う

Flow EditorからGraph Dataを直接任意Mutationしない。

```text
Flow Editor Intent
      ↓
Command / Transaction
      ↓
Flow Document Mutation
      ↓
Validation
      ↓
Render Flow Editor
```

代表Command:

```text
Flow Commands
├─ ADD_FLOW
├─ DELETE_FLOW
├─ ADD_FLOW_NODE
├─ DELETE_FLOW_NODE
├─ MOVE_FLOW_NODE # Editor Metadataのみ変更
├─ SET_FLOW_NODE_CONFIG
├─ CONNECT_FLOW
├─ DISCONNECT_FLOW
└─ SET_FLOW_TRIGGER
```

### 8.62 Graph Position変更とBehavior変更を区別する

Flow Editor上でNodeを移動する操作はExecution Behaviorを変更しない。

```text
MOVE_FLOW_NODE
└─ metadata.x / metadata.y
```

Edge接続変更はBehavior変更である。

```text
CONNECT_FLOW
└─ Execution Graph Change
```

Undo / Redoでも両者を区別できるようにする。

### 8.63 Flow削除時にReference Integrityを確認する

FlowがSubflow等から参照されている場合、削除前にDependencyを確認する。

```text
Delete Flow
      ↓
Dependency Check
├─ Subflow Reference
├─ Navigation / Trigger Referenceがある場合
└─ Other Project Reference
```

Referenceを黙って破壊しない。

### 8.64 UI Node削除時のFlow Referenceを検証する

UI Nodeを削除した場合、Flow TargetがInvalidになる可能性がある。

```text
Delete UI Node
      ↓
Flow Reference Search
├─ UI Event Trigger
├─ UI Action Target
├─ Overlay Action Target
└─ Anchor-related Reference
```

Project ValidatorでMissing Targetを検出する。

### 8.65 Resource削除時のFlow Referenceを検証する

```text
Delete Resource
      ↓
Flow Resource Reference Search
      ↓
Missing Resource Validation
```

Flow内のResource Referenceを自動的に別Resourceへ差し替えない。

### 8.66 Flow Graphの構造Validationを行う

```text
Flow Validation
├─ Duplicate Flow ID
├─ Duplicate Flow Node ID
├─ Missing Node
├─ Missing Edge Target
├─ Invalid Port
├─ Missing UI Target
├─ Missing Resource
├─ Invalid State Reference
├─ Invalid Expression
├─ Invalid Output Reference
├─ Invalid Subflow Reference
├─ Invalid Input Type
├─ Unreachable Node
└─ Potential Infinite Loop
```

Editor、Preview、Exportで同一Validation Ruleを使用する。

### 8.67 Unreachable Nodeを検出する

TriggerまたはSubflow Entryから到達できないNodeを検出する。

```text
Trigger
   ↓
Node A
   ↓
Node B

Node C # Unreachable
```

Unreachable NodeをErrorとするかWarningとするかはValidation Policyで明示する。

### 8.68 Infinite Loop Riskを検出する

Cycle自体を全面禁止しない。

Retry、Polling、Loop等ではCycleが必要な場合がある。

```text
Cycle
├─ Explicit Loop # Control Node等による意図されたLoop
└─ Accidental Loop # 意図しないGraph Cycle
```

Loopを許可する場合は終了条件やRuntime Guardを明示する。

### 8.69 Persistent Flow DefinitionとRuntime Execution Instanceを分離する

Flow DocumentはDefinitionであり、実行中の状態そのものではない。

```text
Flow Definition
├─ nodes
├─ edges
└─ config
```

実行中:

```text
Flow Execution Instance
├─ executionId # 実行Instance ID
├─ flowId # 実行対象Flow
├─ currentNodes # 現在実行中のNode
├─ context # event / variables / outputs等
├─ pendingAsyncOperations
├─ cancellationState
└─ errorState
```

Runtime InstanceをProject Documentへ通常保存しない。

### 8.70 Concurrent Flow Executionを許容する

同じFlowが複数回同時実行されてもExecution Contextが衝突しないようにする。

```text
SaveUserFlow
├─ Execution A
│  ├─ variables
│  └─ outputs
│
└─ Execution B
   ├─ variables
   └─ outputs
```

`variables` や `outputs` をFlow Definition単位のGlobal Objectとして共有しない。

### 8.71 Preview RuntimeでFlow Inspectionを可能にする

PreviewではProduction Runtime CoreへDebug Hookを追加する。

```text
Preview Flow Hooks
├─ Execution Start
├─ Node Enter
├─ Node Exit
├─ Node Output
├─ Branch Selected
├─ Resource Request
├─ State Update
├─ Error
├─ Cancellation
└─ Execution End
```

Debug HookによってProduction Flow Semanticsを変更しない。

### 8.72 Flow Step ExecutionをPreview機能として提供できる

```text
Preview Flow Control
├─ Pause
├─ Step
├─ Continue
├─ Stop
└─ Inspect Context
```

これらはEditor / Preview用機能であり、Flow DocumentのBehavior Nodeとして保存しない。

### 8.73 PreviewとProductionで同一Flow Runtime Semanticsを使用する

```text
Flow Document
      ↓
Flow Runtime Core
├─ Preview Mode
│  └─ Debug Hooks
└─ Production Mode
```

Preview専用Flow Engineを別実装しない。

### 8.74 Generated ApplicationではJavaScript Flow Runtimeが実行する

Builder内部ではFlow ModelやFlow Runtime SourceをTypeScriptで実装してよい。

Export後はJavaScriptとして実行する。

```text
Visual Application Builder
├─ TypeScript Flow Model
├─ TypeScript Flow Runtime Source
└─ Static Exporter
      ↓
Generated Application
├─ JavaScript Flow Definition
└─ JavaScript Flow Runtime
```

Generated ApplicationにTypeScript CompilerやTypeScript Runtimeを要求しない。

### 8.75 Initial RuntimeはInterpreter方式を基本とする

初期実装ではStructured Flow DocumentをBrowser Runtimeが解釈する。

```text
Structured Flow Definition
      ↓
JavaScript Flow Interpreter
      ↓
Browser Execution
```

Interpreter方式の利点:

```text
Interpreter
├─ EditorとProductionのSemanticsを一致させやすい
├─ Flow Debuggerを実装しやすい
├─ Validation結果とRuntimeを対応させやすい
├─ Project Schema Migrationを扱いやすい
└─ Initial Implementationを単純化できる
```

### 8.76 将来Flow Compilerを追加可能にする

PerformanceやBundle Size Optimizationが必要になった場合、Structured FlowからJavaScriptへCompileできる設計を維持する。

```text
Structured Flow Document
├─ Interpreter # Initial / Debug-friendly Runtime
└─ Future Compiler
      ↓
Optimized JavaScript
```

Compilerを追加してもStructured Flow DocumentをCanonical Source of Truthとして維持する。

### 8.77 Flow Documentの概念的な最終構成

```text
Flow Document # Application BehaviorのCanonical Definition
└─ flows
   └─ Flow
      ├─ id # Stable Flow ID
      ├─ name # Display Name
      │
      ├─ nodes
      │  └─ Flow Node
      │     ├─ id # Stable Flow Node ID
      │     ├─ type # Trigger / Action / Logic等
      │     ├─ config # Node固有設定
      │     ├─ inputs # Literal / Structured Reference
      │     ├─ outputs # Node Output Definition
      │     └─ metadata # Flow Editor表示情報
      │
      └─ edges
         └─ Edge
            ├─ id
            ├─ fromNode
            ├─ fromPort
            ├─ toNode
            └─ toPort
```

Flow Node Category:

```text
Flow Node Categories
├─ Trigger # Flowの開始条件
│  ├─ UI Event
│  ├─ Lifecycle Event
│  ├─ State Event
│  └─ Timing Event
│
├─ Action # Applicationや外部環境へ副作用を発生させる
│  ├─ UI Action
│  ├─ Resource Action
│  ├─ State Action
│  └─ Navigation Action
│
├─ Logic # Execution Pathを選択する
│  ├─ Condition
│  ├─ Switch
│  └─ Guard
│
├─ Data # 値を加工してOutputを生成する
│  ├─ Set Variable
│  ├─ Transform
│  ├─ Map
│  ├─ Filter
│  ├─ Pick
│  ├─ Merge
│  ├─ Format
│  ├─ Calculate
│  └─ Parse
│
├─ Timing # Flow途中の時間制御
│  ├─ Wait
│  ├─ Delay
│  ├─ Debounce
│  └─ Throttle
│
└─ Control # Execution Structureを制御する
   ├─ Parallel
   ├─ For Each
   ├─ Retry
   ├─ Error Handler
   ├─ Cancel
   ├─ Subflow
   └─ Return
```

Execution Context:

```text
Flow Execution Context
├─ event # Trigger Input
├─ state # Application / Page / Component State
├─ variables # Flow-local Data
├─ outputs # Flow Node Execution Result
└─ env # Public Environment Configuration
```

Runtime Architecture:

```text
Trigger Source
      ↓
Trigger Registry
      ↓
Flow Engine
      ↓
Flow Execution Context
      ↓
Flow Node Dispatcher
      │
      ├─ Expression Evaluator
      │
      ├─ Action Registry
      │  ├─ State Store
      │  ├─ Resource Client
      │  ├─ UI Controller
      │  └─ Navigation Controller
      │
      └─ Control Runtime
            ↓
       Selected Edge
            ↓
        Next Node
```

### 8.78 Flow Document Invariants

```text
A # Flow DocumentをApplication BehaviorのCanonical Source of Truthとする

B # FlowをStructured Graphとして保持する

C # UI ComponentへFlow Behavior Codeを直接埋め込まない

D # Generated JavaScript SourceをFlowのSource of Truthにしない

E # Arbitrary JavaScript文字列をFlowの基本表現にしない

F # FlowとUIはStable UI Node IDで接続する

G # DOM SelectorやShadow DOMをFlow Targetとして使用しない

H # FlowとFlow NodeにStable IDを使用する

I # Display NameをReference Keyとして使用しない

J # Flow Editor上のGeometryとExecution Semanticsを分離する

K # Trigger / Action / Logic / Data / Timing / Controlの責務を分離する

L # UI Event TriggerはComponent Public Eventを参照する

M # UI ActionはUI ControllerとComponent Public Contractを経由する

N # Overlay ActionはOverlay Managerを経由する

O # Resource ActionはResource IDを参照しResource Clientを経由する

P # Environment固有Base URLをFlow Nodeへ直接埋め込まない

Q # State ActionはState Storeを経由する

R # Navigation ActionはNavigation Controllerを経由する

S # event / state / variables / outputs / envをExecution Context上で分離する

T # Flow InputをLiteralまたはStructured Referenceとして保持する

U # ExpressionをStructured ASTとして保持する

V # Execution EdgeとData Referenceを分離する

W # true / false / success / error等を明示的なPortとして扱う

X # Node OutputをStable Node ID単位でNamespace化する

Y # Async / Error / CancellationをFlow Runtimeの標準Semanticsとして扱う

Z # Flow Runtimeを特定ComponentやResourceに依存しないGeneric Engineとする

AA # Trigger RegistryとAction RegistryをRuntime拡張境界とする

AB # Flow変更はCommand / Transactionを経由する

AC # Editor / Preview / Exportで同一Flow Validation Ruleを使用する

AD # Persistent Flow DefinitionとRuntime Execution Instanceを分離する

AE # Concurrent Flow Execution間でvariables / outputsを共有しない

AF # PreviewとProductionで同一Flow Runtime Semanticsを使用する

AG # Preview Debug機能をFlow DocumentのBehaviorへ混ぜない

AH # Builder内部ではTypeScriptを使用してよいがGenerated ApplicationではJavaScriptとして実行する

AI # Initial RuntimeはStructured Flowを解釈するJavaScript Interpreterを基本とする

AJ # 将来Compilerを追加してもStructured Flow DocumentをCanonical Source of Truthとして維持する

AK # SecretをFlow Definition、env、Generated JavaScriptへ保存しない
```

---

# 9. Logical Tree

UI Nodeの所有関係はLogical Treeで保持する。

例:

```text
UsersPage
├── Header
├── UserForm
│   ├── NameInput
│   ├── EmailInput
│   ├── Actions
│   │   ├── CancelButton
│   │   └── SaveButton
│   └── ValidationPopover
├── SuccessSnackbar
└── DeleteModal
```

重要:

```text
Logical Ownership
≠
Actual Rendering Position
```

ValidationPopover、Snackbar、ModalはLogical Treeでは親Componentに所属していても、実DOM上ではOverlay SurfaceへRenderされる場合がある。

---

# 10. Render Surfaces

「Layer」という言葉はEditorのLayer Treeやz-orderと混同するため、描画領域には `Surface` を使用する。

基本構造:

```text
Render Surfaces

Application
├── Content Surface
└── Overlay Surface
    ├── Anchored Overlay
    ├── Modal Overlay
    └── Notification Overlay

Editor
└── Interaction Surface
```

---

# 11. Content Surface

通常のDOM Layoutに参加するUI。

例:

```text
Page
Container
Stack
Grid
Card
Form
Input
Button
Table
Tabs
Text
Image
```

Content Surfaceでは原則としてCSS Layoutによる配置を行う。

---

# 12. Overlay Surface

通常Layout Flowから独立してRenderされるUI。

Overlayを最低3種類に分類する。

## 12.1 Anchored Overlay

対象:

```text
Popover
Dropdown
Menu
Tooltip
Context Menu
```

特徴:

```text
別UI NodeをAnchorとして配置
通常non-blocking
```

例:

```json
{
  "presentation": {
    "surface": "overlay",
    "overlay": {
      "kind": "anchored",
      "anchor": "accountButton",
      "placement": "bottom-end"
    }
  }
}
```

---

## 12.2 Modal Overlay

対象:

```text
Modal
Dialog
Blocking Drawer
Confirmation
```

特徴:

```text
Viewport基準
Backdrop
Focus Trap
Escape handling
Scroll lock
Stack管理
```

例:

```json
{
  "presentation": {
    "surface": "overlay",
    "overlay": {
      "kind": "modal",
      "backdrop": true,
      "dismiss": {
        "escape": true,
        "outsideClick": false
      }
    }
  }
}
```

---

## 12.3 Notification Overlay

対象:

```text
Snackbar
Toast
Global Notification
```

特徴:

```text
non-blocking
viewport基準
auto dismiss
queue
stack
```

例:

```json
{
  "presentation": {
    "surface": "overlay",
    "overlay": {
      "kind": "notification",
      "placement": "bottom-center"
    }
  }
}
```

---

# 13. Editor Interaction Surface

Application UIには含まれないEditor専用表示。

以下をここにRenderする。

```text
Selection Border
Resize Handles
Hover Outline
Drop Indicator
Slot Indicator
Alignment Guide
Spacing Guide
Drag Ghost
Drag Preview
Insert Indicator
```

Editor Interaction SurfaceはExport対象外。

---

# 14. Overlay Manager

Overlay表示は各Componentが勝手にz-indexを管理しない。

Runtimeに中央管理する `OverlayManager` を設ける。

```text
Flow / UI
   ↓
Overlay Manager
   ↓
Overlay Surface
```

責務:

```text
Open
Close
Stack
Focus
Backdrop
Escape
Outside Click
Scroll Lock
Anchor Position
Notification Queue
```

---

# 15. Overlay Stack Policy

Componentに自由な巨大 `z-index` を設定させない。

概念的な優先順位:

```text
Content
    ↓
Anchored Overlay
    ↓
Modal Backdrop
    ↓
Modal
    ↓
Notification
    ↓
System / Critical Overlay
```

必要な場合のみ同一カテゴリ内に `stackOrder` を持たせる。

---

# 16. Layout Model

基本UIを絶対座標で配置しない。

初期段階では以下に絞る。

```text
Layout
├── Stack
│   ├── vertical
│   └── horizontal
│
├── Grid
│
├── Slot-defined Layout
│
└── Overlay
```

必要になった場合のみ将来的に:

```text
Freeform / Absolute
```

を特殊Layoutとして追加する。

FreeformをDefaultにはしない。

---

# 17. Stack Layout

例:

```json
{
  "layout": {
    "type": "stack",
    "direction": "vertical",
    "gap": "md",
    "align": "stretch"
  }
}
```

実装はFlexboxへMapping可能。

```text
Stack(vertical)
→ flex-direction: column

Stack(horizontal)
→ flex-direction: row
```

ただしDocument ModelではCSS実装詳細として保存しない。

---

# 18. Grid Layout

例:

```json
{
  "layout": {
    "type": "grid",
    "columns": [
      { "type": "fraction", "value": 1 },
      { "type": "fraction", "value": 2 }
    ],
    "gap": "md"
  }
}
```

実装時にCSS Gridへ変換する。

---

# 19. Drag & Drop Philosophy

ドラッグ操作自体は自由に見せる。

ただし、永続化されるのは座標ではなく構造である。

```text
Pointer Drag
    ↓
Hit Test
    ↓
Drop Intent
    ↓
Command
    ↓
Document Update
    ↓
Normalize
    ↓
Render
```

---

# 20. Drop Intent

基本Drop Intentは以下。

```ts
type DropIntent =
  | {
      type: "before";
      targetId: string;
    }
  | {
      type: "after";
      targetId: string;
    }
  | {
      type: "inside";
      targetId: string;
    }
  | {
      type: "slot";
      targetId: string;
      slot: string;
    }
  | {
      type: "split";
      targetId: string;
      direction: "horizontal" | "vertical";
    };
```

---

# 21. before / after

Vertical Stackの場合:

```text
before = 上
after  = 下
```

Horizontal Stackの場合:

```text
before = 左
after  = 右
```

Documentには `top`, `bottom`, `left`, `right` を保存しない。

Layout方向に依存しない意味として、

```text
before
after
```

を使用する。

---

# 22. inside

Container内部への挿入。

例:

```text
Card
┌────────────────────┐
│                    │
│       INSIDE       │
│                    │
└────────────────────┘
```

Drop後:

```text
Card.children.push(node)
```

相当の構造変更を行う。

---

# 23. split

NotionのColumn作成に近い操作。

例:

```text
Before

VerticalStack
├── A
├── B
└── C
```

AをBの右へDrop:

```text
DropIntent {
  type: "split",
  targetId: "B",
  direction: "horizontal"
}
```

Document変換:

```text
After

VerticalStack
├── HorizontalStack
│   ├── B
│   └── A
└── C
```

つまり「右に置く」を絶対座標ではなく構造変換として扱う。

---

# 24. Drag中の座標

Drag中のみEditor内部でTemporary Geometryを使用可能。

例:

```text
pointer.x
pointer.y
dragGhost.x
dragGhost.y
candidateRect
```

これらはProject Documentへ保存しない。

Drop終了後には必ず、

```text
Tree
Slot
Layout
```

へ変換する。

---

# 25. Document Normalization

Drag / Drop等によって不要なContainerが生まれる可能性があるため、Document変更後にNormalizationを行う。

```text
Command
  ↓
Document Mutation
  ↓
normalizeDocument()
  ↓
Final Document
```

---

# 26. Normalization Examples

例1:

```text
VerticalStack
└── VerticalStack
    └── Button
```

意味上不要であれば:

```text
VerticalStack
└── Button
```

へ整理する。

例2:

```text
HorizontalStack
└── Button
```

1要素しかなくLayout上不要であれば親へ昇格する。

ただし、以下の場合は自動削除しない。

- Userが明示的に作成したContainer
- Styling boundary
- Semantic grouping
- Component boundary
- Slot boundary
- Flow / reference target
- Reusable component root

---

# 27. Slots

Web Componentsとの整合性のためSlotを第一級概念として扱う。

例:

```html
<ui-card>
  <h2 slot="header">
    Profile
  </h2>

  <ui-form slot="content">
    ...
  </ui-form>

  <ui-button slot="actions">
    Save
  </ui-button>
</ui-card>
```

Editorでは:

```text
┌ Card ──────────────────────┐
│ Header Slot                │
│   Profile                  │
├────────────────────────────┤
│ Content Slot               │
│   Name                     │
│   Email                    │
├────────────────────────────┤
│ Actions Slot               │
│               [Save]       │
└────────────────────────────┘
```

---

# 28. Component Slot Metadata

各Component DefinitionはSlot metadataを公開する。

例:

```json
{
  "tag": "ui-card",
  "slots": {
    "header": {
      "accept": [
        "text",
        "heading"
      ],
      "layout": {
        "type": "stack",
        "direction": "vertical"
      }
    },

    "content": {
      "accept": ["*"],
      "layout": {
        "type": "stack",
        "direction": "vertical"
      }
    },

    "actions": {
      "accept": [
        "button"
      ],
      "layout": {
        "type": "stack",
        "direction": "horizontal",
        "align": "end"
      }
    }
  }
}
```

EditorはこのMetadataから以下を判断する。

```text
Drop可能か
どのSlotにDropできるか
SlotのLayout
許可されるComponent Type
Drop Indicator表示位置
```

---

# 29. Component Definition

ComponentはEditorとRuntime双方で理解できるMetadataを持つ。

例:

```ts
interface ComponentDefinition {
  type: string;
  tag: string;

  props: PropertyDefinition[];

  slots: Record<string, SlotDefinition>;

  events: EventDefinition[];

  actions?: ActionDefinition[];

  presentation?: PresentationDefinition;
}
```

---

# 30. Component Events

Flow Triggerから利用できるEventを定義する。

例:

```json
{
  "events": [
    {
      "name": "click"
    },
    {
      "name": "value-change",
      "detail": {
        "value": "string"
      }
    }
  ]
}
```

Custom Element側はCustomEventを公開する。

```js
this.dispatchEvent(
  new CustomEvent("value-change", {
    detail: {
      value: value
    }
  })
);
```

---

# 31. Component Actions

Flow Runtimeから呼べるComponent Actionを定義可能にする。

例:

```text
ui-modal
├── open
└── close

ui-input
├── focus
└── clear
```

Flow Runtimeが内部DOMを直接操作しない。

---

# 32. Size Model

Resizeを単純なpx値へ変換しない。

基本Size Mode:

```text
fit
fill
fixed
fraction
```

例:

```json
{
  "size": {
    "width": {
      "mode": "fill"
    },
    "height": {
      "mode": "fit"
    }
  }
}
```

Grid等:

```json
{
  "width": {
    "mode": "fraction",
    "value": 2
  }
}
```

明示指定:

```json
{
  "width": {
    "mode": "fixed",
    "value": 320,
    "unit": "px"
  }
}
```

EditorのResize操作結果を可能な限りSemantic Sizeへ正規化する。

---

# 33. Responsive Design

絶対座標を基本としないため、Responsive LayoutをDocument Levelで定義可能にする。

将来的には:

```json
{
  "layout": {
    "default": {
      "type": "stack",
      "direction": "horizontal"
    },

    "breakpoints": {
      "sm": {
        "direction": "vertical"
      }
    }
  }
}
```

のように拡張可能。

初期版では必要以上に複雑化させず、Default Layoutを優先する。

---

# 34. Flow Concept

FlowはTriggerから開始し、Action / Logic / Data処理を経てApplicationの挙動を定義する。

```text
Trigger
   ↓
Action
   ↓
Logic
   ↓
Action
   ↓
...
```

例:

```text
SaveButton.click
       ↓
Validate
       ↓
POST /users
       ↓
   ┌───┴────┐
success    error
   │          │
   ▼          ▼
Modal      Snackbar
```

---

# 35. Flow Node Categories

基本カテゴリ:

```text
Trigger
Action
Logic
Data
```

---

# 36. Trigger Nodes

## UI Event

```text
click
input
change
submit
focus
blur
custom event
```

## Lifecycle

```text
app.load
page.load
component.mount
```

## Timer

```text
delay
interval
foreground schedule
```

## Navigation

```text
route change
```

## Data

```text
state change
```

---

# 37. Action Nodes

## UI

```text
open
close
show
hide
enable
disable
focus
scroll
```

## Overlay

```text
modal.open
modal.close
popover.open
popover.close
snackbar.open
toast.open
```

## HTTP

```text
GET
POST
PUT
PATCH
DELETE
```

## State

```text
set
merge
clear
toggle
```

## Navigation

```text
navigate
back
reload
```

## Storage

```text
localStorage.get
localStorage.set
localStorage.remove
```

## Feedback

```text
alert
confirm
notification
```

---

# 38. Logic Nodes

初期候補:

```text
Condition
Switch
Wait
Retry
Error Handler
Parallel
For Each
```

Loopは無制限実行を防ぐためRuntime Guardを設ける。

---

# 39. Data Nodes

候補:

```text
Set Variable
Map
Transform
Pick
Merge
Filter
Format
```

任意JavaScriptの代わりにExpression Systemを利用する。

---

# 40. Flow Example

UI:

```json
{
  "id": "saveButton",
  "type": "ui-button",
  "props": {
    "label": "保存"
  }
}
```

Flow:

```json
{
  "id": "saveUserFlow",

  "nodes": [
    {
      "id": "trigger",
      "type": "trigger.ui",
      "target": "saveButton",
      "event": "click"
    },

    {
      "id": "request",
      "type": "action.http",
      "resource": "backend",
      "method": "POST",
      "path": "/users",
      "body": {
        "name": {
          "$ref": "state.form.name"
        },
        "email": {
          "$ref": "state.form.email"
        }
      },
      "output": "createdUser"
    },

    {
      "id": "success",
      "type": "action.ui",
      "action": "open",
      "target": "successSnackbar"
    }
  ]
}
```

---

# 41. Flow Graph

FlowはNodeとEdgeで表現する。

```ts
interface Flow {
  id: string;
  name: string;

  nodes: FlowNode[];
  edges: FlowEdge[];
}
```

例:

```ts
interface FlowEdge {
  from: string;
  to: string;

  port?: string;
}
```

Conditionでは:

```text
true
false
```

HTTPでは:

```text
success
error
```

等のPortを持つ。

---

# 42. Flow Context

実行時Context:

```ts
interface FlowContext {
  event: unknown;

  state: Record<string, unknown>;

  variables: Record<string, unknown>;

  outputs: Record<string, unknown>;

  env: Record<string, unknown>;
}
```

参照Namespace例:

```text
event
state
variables
outputs
env
```

---

# 43. Value References

文字列テンプレートだけに依存せず、可能であればStructured Referenceとして保存する。

推奨:

```json
{
  "$ref": "state.form.email"
}
```

または:

```json
{
  "type": "reference",
  "source": "state",
  "path": [
    "form",
    "email"
  ]
}
```

Editor上では:

```text
State
 └ form
    └ email
```

から選択できる。

---

# 44. Expression AST

任意JavaScriptを使用しない。

例:

```json
{
  "op": "and",

  "args": [
    {
      "op": "gte",
      "left": {
        "$ref": "state.age"
      },
      "right": 18
    },

    {
      "op": "eq",
      "left": {
        "$ref": "state.enabled"
      },
      "right": true
    }
  ]
}
```

---

# 45. Expression Operators

初期候補:

```text
eq
neq
gt
gte
lt
lte

and
or
not

add
subtract
multiply
divide

contains
startsWith
endsWith

isNull
isEmpty
```

将来的に拡張可能。

---

# 46. REST Resources

API URLをFlow Nodeへ直接ハードコードしすぎない。

Resourceとして定義する。

例:

```json
{
  "resources": {
    "backend": {
      "type": "rest",
      "baseUrl": "https://api.example.com"
    }
  }
}
```

Flow:

```json
{
  "type": "action.http",
  "resource": "backend",
  "method": "GET",
  "path": "/users"
}
```

---

# 47. Environment

環境ごとにResource設定を変更可能にする。

例:

```text
Development
backend = http://localhost:8080

Production
backend = https://api.example.com
```

Flow自体は変更しない。

---

# 48. HTTP Action

例:

```json
{
  "id": "createUser",

  "type": "action.http",

  "resource": "backend",

  "method": "POST",

  "path": "/users",

  "headers": {
    "Content-Type": "application/json"
  },

  "body": {
    "name": {
      "$ref": "state.form.name"
    }
  },

  "output": "createdUser"
}
```

後続Nodeから:

```text
outputs.createdUser.id
outputs.createdUser.name
```

を参照可能。

---

# 49. Flow Runtime

Flow Runtimeの責務:

```text
Trigger受付
Flow開始
Node実行
Context管理
Output管理
Branch管理
Error管理
Cancellation
Timeout
Action Registry
Expression Evaluation
```

---

# 50. Trigger Registry

DOM EventやLifecycleをFlowへ接続する。

```text
DOM / Runtime Event
        ↓
Trigger Registry
        ↓
Flow Runtime
```

Flow Runtimeが全Component内部実装を知る必要はない。

---

# 51. Action Registry

Action実装をRegistry化する。

例:

```ts
actions.register(
  "modal.open",
  async (context, params) => {
    const component =
      runtime.getComponent(params.target);

    await component.open();
  }
);
```

Flow EngineはWeb Component内部DOMに依存しない。

---

# 52. UI Action Adapter

構造:

```text
Flow Action
    ↓
Action Registry
    ↓
UI Adapter
    ↓
Component / Overlay Manager
```

これによりFlow ModelとRendering implementationを分離する。

---

# 53. Modal Flow Example

```text
DeleteButton.click
       ↓
Modal.open
       ↓
User confirms
       ↓
DELETE /users/:id
       ↓
Modal.close
       ↓
Snackbar.open
```

Logical Tree上でModalがPageに所属していても、Flow側はSurfaceを意識しない。

---

# 54. Schedule Trigger

ScheduleにはBrowser Runtime上の制約があるため、種類を分離する。

```text
Timer
├── Delay
├── Interval
├── Foreground Schedule
└── Server Schedule
```

---

# 55. Foreground Schedule

Applicationが開かれている間のみ保証される。

例:

```text
毎分
10秒後
画面が開いている間毎日09:00判定
```

---

# 56. Server Schedule

「ブラウザを閉じていても毎日09:00」のような処理は純粋なStatic Frontendでは保証しない。

その場合:

```text
Frontend Flow
      ↓
REST API
      ↓
Backend Scheduler / Job
```

として扱う。

Editor上でも、

```text
Schedule execution:
- While application is open
- Server scheduler
```

を明示的に区別する。

---

# 57. State Model

最低限以下を分離する。

```text
Application State
Flow Variables
Event Data
Flow Outputs
Environment
Component Local State
Editor State
```

Editor StateはApplication Documentに保存しないものを含む。

例:

```text
selectedNode
hoveredNode
dragging
pointer
activePanel
zoom
editorModalPreview
```

---

# 58. Command Architecture

Document変更は原則Commandを経由する。

例:

```text
ADD_NODE
DELETE_NODE
MOVE_NODE
REORDER_NODE
SET_PROPERTY
SET_LAYOUT
MOVE_TO_SLOT
CREATE_STACK
REMOVE_STACK
CONNECT_FLOW
DISCONNECT_FLOW
SET_FLOW_PROPERTY
```

---

# 59. Undo / Redo

全Document変更をCommand / Transaction単位でHistory化する。

```text
Command
   ↓
Document
   ↓
History
```

Drag中のpointermoveごとにHistoryを追加しない。

例:

```text
pointerdown
pointermove
pointermove
pointermove
pointerup
```

を最終的に1 transaction:

```text
MOVE_NODE
```

として扱う。

---

# 60. Transactions

複数Document変更を1操作として扱う。

例:

```text
右側へDrop
   ↓
CREATE_HORIZONTAL_STACK
MOVE_TARGET_INTO_STACK
MOVE_DRAGGED_NODE_INTO_STACK
NORMALIZE
```

これをユーザーから見て1 Undo単位とする。

---

# 61. Layer Tree

Editor上のLayer TreeはLogical Treeを基本表示する。

例:

```text
Page
├── Header
├── Form
│   ├── NameInput
│   ├── EmailInput
│   └── Actions
│       └── SaveButton
├── SuccessSnackbar
└── DeleteModal
```

Overlayだから別Rootへ移動させない。

Render SurfaceはBadge等で表示可能。

例:

```text
DeleteModal   [Modal]
Snackbar      [Overlay]
```

---

# 62. UI Editor and Flow Editor Integration

UI EditorとFlow Editorを独立した島にしない。

UI → Flow:

```text
Buttonを選択
  ↓
Events
  ↓
On Click
  ↓
Open Flow
```

Flow → UI:

```text
Open Modal Node
  ↓
Target: successModal
  ↓
Select in UI Editor
```

双方向Reference Navigationを提供する。

---

# 63. Editor UI

概念レイアウト:

```text
┌─────────────────────────────────────────────────────┐
│ Toolbar                                             │
├───────────┬───────────────────────────┬─────────────┤
│ Layers    │                           │ Inspector   │
│           │                           │             │
│ Page      │       UI Canvas           │ Properties  │
│ ├ Form    │                           │ Layout      │
│ ├ Modal   │                           │ Events      │
│ └ ...     │                           │ Flow        │
│           │                           │             │
└───────────┴───────────────────────────┴─────────────┘
```

Flow Editor:

```text
┌─────────────────────────────────────────────────────┐
│ Flow: Save User                                     │
├───────────┬───────────────────────────┬─────────────┤
│ Nodes     │                           │ Inspector   │
│           │ [Button Click]            │             │
│ Trigger   │       │                   │ Event       │
│ HTTP      │       ▼                   │ Target      │
│ Logic     │ [POST /users]             │ Resource    │
│ UI        │       │                   │             │
│           │       ▼                   │             │
│           │ [Snackbar]                │             │
└───────────┴───────────────────────────┴─────────────┘
```

---

# 64. Modal Editing

ModalをEditorで編集するとき、Application State上で実際に `open = true` にする必要はない。

Editor Preview Contextで強制表示する。

```text
Document
presentation.surface = overlay
overlay.kind = modal
```

は変更しない。

Editor側:

```text
forceVisible = true
```

相当のRender Optionを渡す。

---

# 65. Runtime vs Editor Rendering

Renderer APIイメージ:

```ts
renderDocument(document, {
  mode: "runtime"
});
```

Editor:

```ts
renderDocument(document, {
  mode: "editor",
  editorState
});
```

Application DOMは同じRenderer経路で生成する。

---

# 66. Editor-specific DOM

Editor-only UIはApplication Component内部へ侵入させない。

推奨:

```text
Application DOM
+
Interaction Surface
```

選択Border等は外からBounding Rectを参照して表示する。

---

# 67. Static Export

最終出力例:

```text
dist/
├── index.html
├── app.js
├── components.js
├── runtime.js
├── styles.css
└── assets/
```

最適化時:

```text
dist/
├── index.html
├── app.bundle.js
├── styles.css
└── assets/
```

---

# 68. Runtime Dependency

生成Applicationで必須にしたくないもの:

```text
Svelte Editor Runtime
React
Editor UI
Flow Editor
Drag Library
Inspector
```

生成Applicationに必要:

```text
Web Components
Flow Runtime
State Runtime
REST Client
Application Data
CSS
```

---

# 69. Flow Interpreter vs Compiler

初期実装はInterpreterを推奨。

```text
Flow JSON
   ↓
Flow Runtime
   ↓
Execution
```

利点:

```text
Editor Previewと同じFlowを利用
変更即時反映
実装容易
Debugしやすい
```

---

# 70. Future Flow Compiler

将来的には、

```text
Flow Model
   ↓
Compiler
   ↓
Optimized JavaScript
```

へ変換可能。

例:

Flow:

```text
Button.click
 ↓
POST /users
 ↓
Modal.open
```

生成イメージ:

```js
button.addEventListener("click", async () => {
  const user =
    await api.post("/users", state.form);

  modal.open();
});
```

初期版ではRuntime Interpreterを優先する。

---

# 71. file:// Compatibility

`file://` 対応を考える場合、Runtime時の以下を避ける。

```text
fetch("./project.json")
fetch("./components/foo.html")
runtime ES module import dependency chains
```

Browser security policyの影響を強く受けるため。

---

# 72. file:// Export Strategy

可能な限り:

```text
index.html
app.bundle.js
styles.css
assets/
```

へBundleする。

Project dataも、

```js
const PROJECT = {...};
```

としてbundleへ埋め込むか、

```html
<script type="application/json" id="project-data">
  ...
</script>
```

へ埋め込む。

---

# 73. Static Hosting Recommended Mode

標準Deploymentとしては `file://` よりHTTP(S) Static Hostingを推奨する。

例:

```text
Static Hosting
├── S3
├── CDN
├── nginx
├── GitHub Pages
└── Other Static Server
```

```text
Static Frontend
      ↓ HTTPS
REST API
```

を基本Runtime Modelとする。

---

# 74. REST API and CORS

FrontendとAPIが別originの場合、API側でCORS設定が必要。

例:

```text
Frontend
https://app.example.com

REST API
https://api.example.com
```

認証方式も含めてAPI側設定を設計する。

---

# 75. Security Boundary

Static FrontendにはSecretを保存しない。

保存してはいけない例:

```text
Private API Key
Database Password
Backend Secret
OAuth Client Secret
Service Account Secret
```

Secretが必要な外部APIはBackend経由にする。

```text
Frontend
  ↓
Own REST API
  ↓
External API + Secret
```

---

# 76. Backend Responsibility

Static Frontend側:

```text
UI
Local State
Validation
Navigation
Flow
Modal
Popover
Snackbar
Fetch
Formatting
Conditional Logic
LocalStorage
```

Backend側:

```text
Authentication
Authorization
Database
Business Logic
Secrets
External API proxy
Scheduled Jobs
Secure File Processing
```

---

# 77. Validation

Project保存 / Export前にValidationを行う。

確認項目:

```text
Missing Node Reference
Missing Flow Target
Missing Slot
Invalid Slot Child
Invalid Component Property
Invalid Flow Connection
Missing Resource
Invalid Expression
Unreachable Flow Node
Potential Infinite Loop
Deleted UI referenced by Flow
Duplicate IDs
Invalid Parent Reference
Circular UI Tree
```

---

# 78. Static Analysis

Flow / UIをStructured Dataとして持つことで以下を実装できる。

```text
このPageで使用するREST API一覧
このModalを開くFlow一覧
このButtonを参照するFlow一覧
使われていないFlow
到達不能Flow Node
削除されたComponentへのReference
Resource依存一覧
Permission候補
```

---

# 79. Component Runtime Boundary

Flow RuntimeからComponent内部のShadow DOMへ直接アクセスしない。

禁止方向:

```text
Flow
 ↓
querySelector()
 ↓
Shadow DOM内部を操作
```

推奨:

```text
Flow
 ↓
Component Registry / Action Adapter
 ↓
Public Component API
```

---

# 80. Component Public Contract

Web Componentは最低限以下を公開可能にする。

```text
Properties
Attributes
Events
Actions
Slots
```

例:

```text
ui-modal

Properties:
  open

Events:
  open
  close
  confirm

Actions:
  open()
  close()

Slots:
  header
  content
  actions
```

---

# 81. Component Registry

Runtime / Editor共通でComponent Definitionを検索できるRegistryを持つ。

```ts
registry.get("ui-modal")
registry.get("ui-button")
```

RegistryからEditorが:

```text
Inspector
Slots
Events
Actions
Default Props
Allowed Children
```

を生成できるようにする。

---

# 82. Reusable Components

Logical Treeを維持することでComponent単位の:

```text
Copy
Paste
Duplicate
Delete
Export
Reuse
Instance化
```

を実現しやすくする。

Overlay NodeもComponentの所有関係から分離しない。

例:

```text
UserEditor
├── NameInput
├── SaveButton
└── ValidationPopover
```

ValidationPopoverはOverlay Surfaceで描画されても、UserEditorに論理所属する。

---

# 83. Reusable Flow

将来的にFlowも再利用可能にする。

```text
Flow
├── Input Parameters
├── Local Variables
├── Nodes
└── Outputs
```

例:

```text
confirmAndDelete(entityId)
```

Sub Flow Actionとして呼び出せる設計へ拡張可能。

---

# 84. OpenAPI Integration

将来的な拡張候補。

OpenAPIから:

```text
Resource
Endpoint
Method
Request Schema
Response Schema
```

をImportし、HTTP Action Nodeの選択肢を自動生成する。

例:

```text
Users API
├── GET /users
├── GET /users/{id}
├── POST /users
└── DELETE /users/{id}
```

Inspectorでフォーム入力にする。

---

# 85. Type System

将来的にはFlow ReferenceにType情報を持たせる。

例:

```text
outputs.createUser

{
  id: number
  name: string
  email: string
}
```

後続Nodeで:

```text
outputs.createUser.id
```

を補完できる。

Expression Editorも型チェック可能になる。

---

# 86. Flow Error Model

HTTP等ではerror branchを明示可能にする。

```text
HTTP
├── success
└── error
```

必要に応じて:

```text
timeout
cancelled
```

も追加可能。

Global Error Handlerも将来的に検討する。

---

# 87. Async Cancellation

Page遷移や再実行時に不要Requestを中止できるよう、Flow ExecutionにCancellation Token / AbortController相当を持たせる。

```text
FlowExecution
├── id
├── status
└── abort()
```

---

# 88. Preview Runtime

Editor PreviewもProduction Runtimeと同じCoreを使用する。

```text
Editor
  ↓
Preview Runtime
  ↓
Same Flow Engine
  ↓
Same Components
```

差分はEditor Hooksのみ。

例:

```text
Debug
Step Execution
Node Highlight
Variable Inspection
Mock Resources
```

---

# 89. Flow Debugging

将来的にFlow Editorで:

```text
Run
Pause
Step
Restart
```

を提供可能。

実行中:

```text
Trigger
  ↓
[HTTP] ← current
  ↓
Condition
```

とNodeをHighlightする。

Inspector:

```text
event
state
variables
outputs
```

を確認できる。

---

# 90. Resource Mock

Editor Previewでは実APIの代わりにMock Responseを定義可能にする。

```text
Resource:
backend

Mode:
Real
Mock
```

Flow自体は変更しない。

---

# 91. Naming Conventions

推奨用語:

```text
Node
  Logical UI object

Layer
  Editor hierarchy / ordering concept

Surface
  Render destination

Content Surface
  Normal layout DOM

Overlay Surface
  Out-of-flow runtime UI

Interaction Surface
  Editor-only visuals

Slot
  Named insertion point

Flow
  Behavior graph

Trigger
  Flow entry

Action
  Side effect

Resource
  External service definition
```

`Context Layer` は使用しないことを推奨。

理由:

```text
React Context
Context Menu
CSS Stacking Context
```

等と意味が衝突しやすい。

`Floating Layer` より `Overlay Surface` を使用する。

---

# 92. Why Svelte

SvelteはEditor View Layerとして採用する。

理由:

```text
細粒度UI stateを扱いやすい
Canvas / Inspector synchronizationと相性が良い
記述量が比較的少ない
Custom Elementsへの出力経路を持つ
DOMに近いモデル
```

ただしProject DocumentをSvelte stateそのものにはしない。

---

# 93. Svelte State Responsibility

Svelte `$state` 等で管理してよいもの:

```text
selectedNode
hoveredNode
pointer
dragging
activePanel
openedEditorMenu
zoom
temporaryDropIntent
```

Core Document変更はCommandを経由する。

---

# 94. React Alternative

ReactでもEditor実装は可能であり、特にReducer / explicit state transitionは大規模Editorと相性が良い。

ただし今回:

```text
Editor UI
+
Web Components
+
Framework-independent Runtime
```

という構造ではSvelteの簡潔さとCustom Elementとの親和性を優先する。

Architecture CoreをFramework-independentにすることで、この選択を不可逆にしない。

---

# 95. htmx Positioning

htmxはOptional。

Core Responsibilityにはしない。

```text
Not:
htmx = Flow Engine

Optional:
htmx = Server Fragment Integration
```

通常のREST IntegrationはFlow RuntimeのFetch Actionを利用する。

---

# 96. Example Complete UI Structure

```text
Application
└── UsersPage
    ├── Header
    │   ├── Title
    │   └── AccountButton
    │       └── AccountMenu
    │
    ├── Main
    │   ├── UserForm
    │   │   ├── NameInput
    │   │   ├── EmailInput
    │   │   └── Actions
    │   │       ├── CancelButton
    │   │       └── SaveButton
    │   │
    │   └── UserTable
    │
    ├── SaveSuccessSnackbar
    └── DeleteConfirmModal
```

Logical ownershipはこのまま保持する。

Render結果:

```text
Content Surface
├── Header
├── Main
└── ...

Overlay Surface
├── AccountMenu        [anchored]
├── SaveSnackbar       [notification]
└── DeleteModal        [modal]
```

---

# 97. Example Complete Flow

```text
SaveButton.click
       │
       ▼
Validate Form
       │
       ├── invalid
       │      │
       │      ▼
       │  Snackbar.open
       │  "入力を確認してください"
       │
       └── valid
              │
              ▼
        POST /users
              │
        ┌─────┴─────┐
        │           │
     success       error
        │           │
        ▼           ▼
 State.update   Snackbar.open
        │        "保存失敗"
        ▼
 Snackbar.open
 "保存しました"
```

---

# 98. Example Drag Operation

Initial:

```text
Form
├── Name
├── Email
└── Save
```

User drags Save above Email.

Drag:

```text
Pointer
 ↓
Hit Test Email
 ↓
DropIntent:
before(Email)
```

Command:

```text
MOVE_NODE
node = Save
parent = Form
before = Email
```

Result:

```text
Form
├── Name
├── Save
└── Email
```

座標は保存しない。

---

# 99. Example Horizontal Split

Initial:

```text
Page
├── CardA
├── CardB
└── CardC
```

CardAをCardB右側へDrop。

Result:

```text
Page
├── HorizontalStack
│   ├── CardB
│   └── CardA
└── CardC
```

Renderer:

```html
<div class="stack horizontal">
  <ui-card>...</ui-card>
  <ui-card>...</ui-card>
</div>
```

Editorと出力DOMの構造を一致させる。

---

# 100. Primary Design Decisions

## Decision 1

```text
Absolute Canvas
```

をDefaultにしない。

採用:

```text
Structured DOM Layout Editor
```

---

## Decision 2

Editor上のドラッグ結果を座標として保存しない。

採用:

```text
before
after
inside
slot
split
```

---

## Decision 3

Modal等を別Logical Treeへ分離しない。

採用:

```text
Single Logical UI Tree
+
Render Surface
```

---

## Decision 4

通常UI:

```text
Content Surface
```

Modal / Popover / Snackbar:

```text
Overlay Surface
```

Editor装飾:

```text
Interaction Surface
```

---

## Decision 5

Editor:

```text
Svelte 5
```

Runtime:

```text
Framework-independent TypeScript / JavaScript
```

UI Components:

```text
Web Components
```

---

## Decision 6

Flow:

```text
Structured Graph
```

として保存。

任意JavaScript:

```text
禁止 / 非推奨
```

Expression AST:

```text
採用
```

---

## Decision 7

Application behavior:

```text
Trigger
→ Action
→ Logic
→ Action
```

で表現する。

---

## Decision 8

Server Integration:

```text
REST API Resource
+
Fetch Action
```

を標準とする。

---

## Decision 9

生成物:

```text
Static HTML
CSS
JavaScript
Web Components
Flow Runtime
```

とする。

Svelte Editorは含めない。

---

## Decision 10

EditorとProductionでSame Renderer / Same Runtime Coreを最大限共有する。

これをEditor/Runtime乖離防止の最重要原則とする。

---

# 101. Suggested Initial MVP Scope

最初から全機能を実装せず、以下をMVPとする。

## UI

```text
Page
Stack
Grid
Text
Button
Input
Card
Modal
Snackbar
```

## Layout

```text
Vertical Stack
Horizontal Stack
Simple Grid
Slots
```

## Drag

```text
before
after
inside
slot
horizontal split
```

## Flow Trigger

```text
click
change
page.load
```

## Flow Action

```text
HTTP
State Set
Modal Open
Modal Close
Snackbar Open
Navigate
```

## Logic

```text
Condition
```

## Runtime

```text
Flow Runtime
REST Resource
State
Overlay Manager
Expression Evaluator
```

## Editor

```text
Canvas
Layer Tree
Inspector
Flow Editor
Preview
Undo / Redo
```

---

# 102. Post-MVP Candidates

```text
Responsive Breakpoints
Reusable Components
Reusable Flows
OpenAPI Import
Flow Type Checking
Advanced Grid
Drawer
Popover
Menu
Tooltip
Parallel Flow
Retry
Loop
Sub Flow
Mock API
Flow Debugger
WebSocket
SSE
Authentication helpers
Data Table integration
Dynamic List / Repeat
Conditional Rendering
Component Variants
Theme Tokens
Design Tokens
Collaboration
Version History
Autosave
```

---

# 103. Architectural Invariants

以下は将来も可能な限り守る。

### Invariant A

```text
Editor geometry must not become application layout data
unless explicitly using a Freeform layout.
```

### Invariant B

```text
Every successful Drop ends as structured Document data.
```

### Invariant C

```text
Logical ownership and render destination are separate concepts.
```

### Invariant D

```text
Flow references UI by stable Node ID, not DOM selectors.
```

### Invariant E

```text
Flow Runtime does not manipulate private component DOM.
```

### Invariant F

```text
Application Document is independent from Svelte.
```

### Invariant G

```text
Editor and Export should render through the same rendering rules.
```

### Invariant H

```text
Secrets never belong in generated static frontend data.
```

### Invariant I

```text
Application behavior is data first, arbitrary JavaScript second.
```

### Invariant J

```text
Normalization must never silently destroy semantically meaningful
user-created structure.
```

---

# 104. Final Architecture Summary

最終的な中心構造:

```text
                         Project
                            │
        ┌───────────────────┼──────────────────┐
        │                   │                  │
        ▼                   ▼                  ▼
   UI Document         Flow Document        Resources
        │                   │                  │
        └───────────────────┼──────────────────┘
                            │
                            ▼
                      Core Document
                            │
             ┌──────────────┼──────────────┐
             │              │              │
             ▼              ▼              ▼
        Svelte Editor    Renderer      Flow Runtime
             │              │              │
             │              ▼              │
             │        Web Components       │
             │              │              │
             └──────────────┼──────────────┘
                            │
                            ▼
                      Preview Runtime
                            │
                            ▼
                          Export
                            │
                            ▼
                 Static HTML/CSS/JavaScript
                            │
                            ▼
                         REST API
```

UI Layout:

```text
Logical UI Tree
      │
      ├── Layout Rules
      ├── Slots
      └── Presentation
               │
       ┌───────┴────────┐
       ▼                ▼
Content Surface    Overlay Surface
                         │
                  ┌──────┼──────────┐
                  ▼      ▼          ▼
              Anchored  Modal   Notification
```

Editor:

```text
Runtime-equivalent DOM
        +
Interaction Surface
```

Drag & Drop:

```text
Pointer
  ↓
Hit Test
  ↓
Drop Intent
  ↓
Command
  ↓
Document Mutation
  ↓
Normalization
  ↓
Same Renderer
```

Flow:

```text
Trigger
  ↓
Action
  ↓
Logic
  ↓
Action
```

生成物:

```text
Static Frontend
+
Web Components
+
Flow Runtime
+
REST API integration
```

この構造により、本システムは「Canvas上に見た目を描いてHTMLへ変換するデザインツール」ではなく、

> **実際に動作するWeb ApplicationのUI構造と振る舞いそのものを、視覚的に編集するApplication Builder**

として設計する。
