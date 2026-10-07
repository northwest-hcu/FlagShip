# FlagShip

FlagShipは、Web ApplicationのUIと振る舞いを視覚的に作るEditorを目指している。

現在は`feature/incremental-editor-shell`で、動く機能を1つずつ追加している。濃いグレーと黄緑のフレームにRegistryを設け、デフォルトライブラリ内のButton・Container・Text Box・Text Input・Image・Icon・Text・Video・Textarea・Select・数値入力・Calendar・メール入力・URL入力・電話番号入力・Paragraph・ShapeをPageのContext / Overlay slotへドラッグで配置できる。初期表示はContext slot。

コンポーネントをクリックするとCanvas右側の詳細paneが開き、各フィールドの名前・説明・値を編集できる。slotはフィールドから外し、Treeで表示・操作する。ButtonはTextとImage（Iconを含む）のContents配列を持つ複合コンポーネント、Containerは縦・横の並び方と子コンポーネントを持つコアとして扱う。[コンポーネント、フィールドとslot](./docs/component-model.md)を参照する。

コンポーネントはText Comなどの名前・型で表示し、値の型はString・Enum・Number・Boolean・Colorなどで示す。詳細paneの各フィールドは初期状態で閉じ、「+/−」で個別に開閉できる。親や子はTreeから選択する。

ルートはPages配列で、PageはPathとContext / Overlay slotを持つ。Treeの「+ Page」で追加し、PageをクリックしてPathを編集できる。slotは空でもTreeへ枠を表示する。

Treeの枝は「+/−」で独立して開閉でき、目のボタンで編集画面だけの表示・非表示を切り替える。Registryではコンポーネント名を日本語・英語で検索し、ライブラリを別の条件として絞り込める。結果は1つの一覧に並べ、ライブラリの境界を線で示す。RegistryとTreeの高さの割合は境界をドラッグして調整できる。Containerの初期幅は親の100%で、内容に合わせる・px指定へ切り替えられる。Padding・Marginは初期値10px、0以上の数値で指定できる。IconはGoogle Fontsの全8書体から検索し、任意の画像URLも指定できる。デフォルトライブラリのButtonはTextのみを初期生成する。

部品の上下へドロップすると前後へ、Container・Button・Paragraphの中央へドロップすると子のslotへ配置する。Containerは親の幅100%・内容に合わせる・px指定を選べ、左右・上下揃え、子の間隔と伸張を設定できる。Text Boxも同じContainer設定とText・Text Inputのプリセットで、通常の部品から手動で再現できる。横並びは明示的に置いたContainerのDirectionで指定し、並び用Containerを自動生成しない。Tabで対象へ移動し、Enterをクリックと同じ操作に使える。Ctrl+Enterで掴む／離す、Ctrl+Shift+Pで仮想カーソルをON/OFFし、ON中の矢印でカーソルを動かして配置できる。領域の端ではスクロールし、PageUp / PageDown（Shift併用で横）でもカーソル下をスクロールできる。Treeのslotへの配置やページ間の移動にも対応する。Previewでは編集用の境界線を除いた表示と入力操作を確認できる。詳しくは[コンポーネントの配置](./docs/component-placement.md)を参照する。

色は15色パレットを基本に選び、RGB・透明度Aはカスタム編集から適用またはキャンセルする。リセットではテーマの初期色や、親の色が反映される前に子で選んだ色へ戻せる。Textにはリンク・書体・サイズ・太さ・行高・文字間隔、Buttonには幅・高さ・内側余白・角丸を用意する。Ctrl+C / Ctrl+Vで選択した部品やページを複製でき、Deleteでページも削除できる。

Canvas単独・Flow単独・上下分割・左右分割を切り替え、空のFlowへNode Libraryからノードを自由にドラッグ配置して接続できる。Graphの拡大縮小、上下左右スクロール、背景ドラッグに対応する。接続線の矢印はドラッグ中にカーソルへ追従し、`整理`でNodeを一括整列できる。Clickイベントは任意のComに設定でき、Page LoadはPreviewでPageを表示したときに発火し、ScheduleはPreview中のAfter・Interval・Atに対応する。トリガーのPageはFlowの所属から決まり、Scheduleの「グローバル」で実行範囲を切り替える。比較値はFIELD（Comのフィールド）、VAR（ユーザー変数）、CONST（定数）から選び、フィールドキーは候補から補完できる。VARとCONSTは初期化Nodeで宣言する。Previewで実行位置と現在値・処理ログを確認し、Nodeの赤い点にBreakpointを置くと実行前に停止してStep / Continueで再開できる。現在値と処理ログはPreview中だけ表示する。

入力部品は値を保持する共通Input型を使い、具体的な入力形式ごとに独立したコンポーネントを配置する。Text BoxはContainerにText ComとText Input Comを初期配置し、入力値とPassword MaskはText Inputが持つ。Textをインライン表示に使い、ParagraphはTextの配列を内包する段落コンポーネントとして扱う。

## Browserで開く

WindowsのPowerShellで実行する。

```powershell
cd '<project-root>'
docker compose up --build editor
```

起動後、Browserで http://localhost:5173 を開く。

## E2Eテスト

```powershell
cd '<project-root>'
docker compose run --rm e2e
```

単体テストはVitest、E2EテストはPlaywrightを使う。詳しいCommandは[開発環境とテスト](./docs/testing.md)を参照する。

## Documentation

- [実装TODO](./docs/TODO.md) — 現在の状態と小さく積み上げる開発方針
- [開発環境とテスト](./docs/testing.md) — 起動、型チェック、Build、テスト
- [コンポーネントの配置](./docs/component-placement.md) — ライブラリ、配置方向、Tree、slot、編集用の境界線
- [Flowの設計と実装](./docs/flow-design.md) — ノード配置、Click・Schedule、値の参照、条件分岐とBreakpoint
- [コンポーネント、フィールドとslot](./docs/component-model.md) — 共通型、コア、型付きフィールド、詳細pane
- [アイコン素材とライセンス](./docs/icons.md) — 全アイコンの参照、任意の画像URL、配布元
- [Architecture](./docs/architecture/README.md) — 将来の構想を検討するための参考資料
- [旧実装計画](./docs/archive/implementation-rounds.md) — 以前の開発記録

## Repository Layout

```text
FlagShip/
├─ src/
│  ├─ main.ts
│  └─ editor/
│     ├─ App.svelte
│     ├─ styles.css
│     ├─ editor-view.css
│     ├─ pointer-resize.ts
│     ├─ scene.ts
│     ├─ component-model.ts
│     ├─ DetailsPane.svelte
│     ├─ CanvasNodes.svelte
│     ├─ WidgetTree.svelte
│     └─ components/
├─ tests/e2e/
├─ docs/
├─ Dockerfile
├─ compose.yaml
└─ playwright.config.ts
```

Repository rootのMarkdownは`README.md`のみとし、その他の資料は`docs/`以下へ置く。

## License

[MIT License](./LICENSE)

EditorのFontは商用利用が無料のShare Tech Mono（SIL Open Font License 1.1）を同梱する。商用Applicationへの組み込み・配布が可能で、著作権表示とライセンス文をFontと一緒に保持する。[同梱ライセンス](./public/fonts/share-tech-mono/OFL.txt) / [公式OFL FAQ](https://openfontlicense.org/ofl-faq/)

Googleのアイコンフォントと索引はApache License 2.0で同梱する。[アイコン素材とライセンス](./docs/icons.md)
