# FlagShip 実装TODO

> 方針: 動作するものを小さく作り、Browserで確認しながら積み上げる。
>
> 現在の作業Branch: `feature/incremental-editor-shell`

## 進め方

- 次に追加する機能を1つ選び、Browserで確認できる操作と期待結果を決める。
- 必要な実装をRepositoryへ直接反映する。
- 型チェック、Build、必要な単体テストとPlaywright E2Eテストで確認する。
- 動作する状態まで完成させてから次の機能へ進む。
- 将来の機能のためにModel、Engine、抽象化を先行して作らない。
- サブエージェントはWeb検索以外で使用しない。
- Commandを提示する場合は、実行場所を指定する`cd`も付ける。

## 現在の土台

- [x] Svelte / TypeScript / Viteの起動環境
- [x] Header、Library、Tree、Canvasの空のFrame
- [x] PointerとKeyboardによるSidebar境界のResize
- [x] Vitestの単体テスト環境とPlaywrightのE2Eテスト環境
- [x] Component、Renderer、Flow Engine、Project Modelと旧機能テストの削除
- [x] FlowとInspectorの欄を削除し、Canvasを拡張
- [x] 背景を濃いグレーに変更
- [x] デジタル庁のデザインシステムを参考に、Button / Container / Text Box / Image / Iconを作成
- [x] ライブラリに実コンポーネントを使った見本を表示
- [x] PageのContext / Overlay slotを分離し、Context slotを初期表示
- [x] 上下左右とコンテナの内側へのドラッグ配置、配置済みオブジェクトの移動
- [x] 上・左は対象より前、下・右は後になるTreeの順序
- [x] 編集用の境界線とPreviewの分離
- [x] ButtonのContents配列（Text / Image / Icon）と内容の順序変更・アイコンのみの表示
- [x] LibraryのButtonからIcon設定欄を削除
- [x] Canvas右側の閉じた詳細paneとクリック / Keyboardでの選択
- [x] 全フィールドを名前・description・値で保持し、独立した編集欄とトグルを表示
- [x] 詳細paneの各フィールドを+/−で独立して開閉し、名前・型と編集値を保持
- [x] slotを詳細フィールドから除外し、Treeでの配置・子の選択とパンくずでの親への移動を維持
- [x] slotの型表示をText Com・Image Com・Com[]へ短縮
- [x] 詳細paneの全フィールドを初期状態で閉じ、色は15色を基本としてカスタム編集の適用・キャンセル・リセットを実装
- [x] 親の色を反映しても子自身の色を保存し、子のリセットで元に戻す
- [x] Textの書体・サイズ・太さ・行高・文字間隔とButtonの幅・高さ・内側余白・角丸を編集
- [x] ルートをPages配列とし、PageのpathとContext / Overlay slotを保持
- [x] Treeに型付きslot枠を表示し、slotへの配置・値の削除・子の選択を実装
- [x] Pageの追加・path編集・切り替え・ページ間の移動
- [x] Component共通型、Text / Image / Input / Shape / Video / Containerのコア型とIcon・Textarea・Selectの派生型
- [x] 汎用Input ComponentとText Box内のInput slotを削除し、Text Box自身の値とPassword Maskフィールド、独立した数値・日付・メール・URL・電話番号入力を実装
- [x] Calendarのテキスト残りを解消し、日付専用のValue編集と値の保持を実装
- [x] Containerの縦・横の並び方と子コンポーネントの配列
- [x] Containerを内容にフィットさせ、Padding・Marginを初期値10px、0以上の数値で編集
- [x] Directionの変更を自動生成された並び用グループへ反映
- [x] Treeのコンポーネントとslotを独立して開閉し、表示を「+/−」に統一
- [x] Treeの種類マークと「・」を削除し、初期名とコア型にComponent表記を追加
- [x] フィールドをString / Enum / Number / Componentなどの型で表示
- [x] 詳細paneのパンくずから親コンポーネントやPageへ戻る
- [x] Google FontsのMaterial Symbols / Material Icons全8書体と全索引を同梱し、任意のアイコン画像URLにも対応
- [x] Textを装飾するParagraph / Span、Inputの値保持、Shapeの直線
- [x] Enum選択肢・数値制約・編集方法・slot型制約を定義データとして保持
- [x] テーマの初期色と15色パレット、RGB・Aのカラーピッカー
- [ ] 外部Component定義とRendererの登録・読み込みを汎用化する
- [ ] 次に追加する最小機能の選択
- [ ] 後でサブInfo欄を作成する（Flow / Inspectorの情報を扱う場所）

現在はフレーム、17種類のコンポーネント、共通型とコア型、配置ツリー、詳細pane、編集用の境界線、Previewを持つ。配置データは開いているページ内で保持し、再読み込みで初期化する。Projectの保存・読込、Flow Engine、サブInfo欄はまだ持たない。

## テスト

- 単体テスト: Vitest。`src/**/*.test.ts`へ置く。
- E2Eテスト: Playwright。`tests/e2e/**/*.spec.ts`へ置く。
- 単体テストで配置順、入れ子、移動、循環の拒否、ドロップ方向の判定を確認する。
- E2Eでフレームの操作、ドラッグ配置、Treeとの一致、Previewを確認する。
- 型チェックとBuild確認はテストとは別に実行する。
- 実行手順は[開発環境とテスト](./testing.md)を参照する。

## 参考資料

[Architecture](./architecture/README.md)は将来の構想を確認するための資料であり、現在の実装仕様や固定された実装順序ではない。必要になった時点で実装と照合して見直す。

以前のPhase / Round計画は[旧実装計画](./archive/implementation-rounds.md)へ退避した。旧計画の順序やCopy & Pasteによる承認手順は現在の開発には適用しない。
