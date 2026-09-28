# FlagShip

FlagShipは、Web ApplicationのUIと振る舞いを視覚的に作るEditorを目指している。

現在は`feature/incremental-editor-shell`で、動く機能を1つずつ追加している。濃いグレーと黄緑のフレームに、Button・Container・Text Box・Image・Icon・Text・Video・Textarea・Select・数値入力・Calendar・メール入力・URL入力・電話番号入力・Paragraph・Span・Shapeのライブラリを用意し、PageのContext / Overlay slotへドラッグで配置できる。初期表示はContext slot。

コンポーネントをクリックするとCanvas右側の詳細paneが開き、各フィールドの名前・説明・値を編集できる。slotはフィールドから外し、Treeで表示・操作する。ButtonはTextとImage（Iconを含む）のContents配列を持つ複合コンポーネント、Containerは縦・横の並び方と子コンポーネントを持つコアとして扱う。[コンポーネント、フィールドとslot](./docs/component-model.md)を参照する。

コンポーネントはText Componentなどの名前・型で表示し、値の型はString・Enum・Number・Boolean・Colorなどで示す。詳細paneの各フィールドは初期状態で閉じ、「+/−」で個別に開閉できる。パンくずから親コンポーネントへ戻れる。

ルートはPages配列で、PageはPathとContext / Overlay slotを持つ。Treeの「+ Page」で追加し、PageをクリックしてPathを編集できる。slotは空でもTreeへ枠を表示する。

Treeの枝は「+/−」で独立して開閉できる。Containerは内容にフィットし、Padding・Marginを初期値10px、0以上の数値で指定できる。IconはGoogle Fontsの全8書体から検索し、任意の画像URLも指定できる。LibraryのButtonはアイコンのない見本を表示する。

部品の端にドロップすると上下左右へ、コンテナの中央へドロップすると内側へ配置する。上・左は対象より前、下・右は対象より後の順序になる。Treeのslotへの配置やページ間の移動にも対応する。Previewでは編集用の境界線を除いた表示と入力操作を確認できる。詳しくは[コンポーネントの配置](./docs/component-placement.md)を参照する。

色は15色パレットを基本に選び、RGB・透明度Aはカスタム編集から適用またはキャンセルする。リセットではテーマの初期色や、親の色が反映される前に子で選んだ色へ戻せる。Textには書体・サイズ・太さ・行高・文字間隔、Buttonには幅・高さ・内側余白・角丸を用意する。

入力部品は値を保持する共通Input型を使い、具体的な入力形式ごとに独立したコンポーネントを配置する。Text Boxは自身にValueとPassword MaskのON/OFFフィールドを持つ。Paragraph・SpanはTextへ表示ルールを適用する複合コンポーネントとして扱う。

## Browserで開く

WindowsのPowerShellで実行する。

```powershell
cd C:\Users\INI\projects\FlagShip
docker compose up --build editor
```

起動後、Browserで http://localhost:5173 を開く。

## E2Eテスト

```powershell
cd C:\Users\INI\projects\FlagShip
docker compose run --rm e2e
```

単体テストはVitest、E2EテストはPlaywrightを使う。詳しいCommandは[開発環境とテスト](./docs/testing.md)を参照する。

## Documentation

- [実装TODO](./docs/TODO.md) — 現在の状態と小さく積み上げる開発方針
- [開発環境とテスト](./docs/testing.md) — 起動、型チェック、Build、テスト
- [コンポーネントの配置](./docs/component-placement.md) — ライブラリ、配置方向、Tree、slot、編集用の境界線
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
