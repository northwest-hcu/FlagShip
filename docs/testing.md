# 開発環境とテスト

単体テストはVitest、E2EテストはPlaywrightを使う。型チェックとBuild確認も実行する。

## Editorの起動

WindowsのPowerShellで実行する。

```powershell
cd '<project-root>'
docker compose up --build editor
```

Browserで http://localhost:5173 を開く。Libraryの見本をCanvasへDragすると部品を配置できる。Library / TreeとCanvasの横幅、LibraryとTreeの高さの割合もDragまたはArrow KeyでResizeできる。詳しい操作は[コンポーネントの配置](./component-placement.md)を参照する。

EditorのDependencyは専用のNamed VolumeへInstallする。HostやUbuntuのE2E環境とは共有しない。
Windows上のProjectをDockerへマウントした際も編集を反映できるよう、Editor ServiceではViteのファイル監視にPollingを使用する。

起動したTerminalで`Ctrl+C`を押すと停止する。Containerの削除:

```powershell
cd '<project-root>'
docker compose down
```

## 単体テストと型チェック

Editorの起動中、別のTerminalで実行する。

```powershell
cd '<project-root>'
docker compose exec editor npm run test:unit
docker compose exec editor npm run check
docker compose exec editor npm run build
```

単体テストは`src/**/*.test.ts`へ置く。`scene.test.ts`で配置と移動、`component-model.test.ts`で型付きslot、独立した編集、フィールド更新を確認する。Frameや実際のDrag操作はE2Eで確認する。

## Playwright E2Eテスト

Editorを起動していなくても実行できる。

```powershell
cd '<project-root>'
docker compose run --rm e2e
```

E2E専用ServiceはPlaywright 1.63.0の公式Ubuntu Imageを使用し、BrowserとOS Dependencyを含む。`@playwright/test`も同じVersionに固定している。更新時は`package.json`、Lockfile、`compose.yaml`を同時に更新する。[Playwright Docker公式説明](https://playwright.dev/docs/docker)

DependencyはE2E専用のNamed Volumeへ`npm ci`でInstallする。PlaywrightがPort 4173でViteを自動起動し、テスト終了時に停止する。

現在のE2Eシナリオ:

- Libraryに17種類の見本が表示され、Context slotが初期表示になる
- PointerでLibrary / Treeの幅を変更するとCanvasの幅も追従する
- Arrow KeyでResizeでき、SidebarとCanvasの最小幅を下回らない
- Libraryから5種類のコンポーネントをDragして配置できる
- 上下への配置で見た目の位置とTreeの順序が一致し、Containerなしの左右配置は拒否して自動レイアウトを作らない
- コンテナの内側へ配置でき、配置済みの部品も移動できる
- 自分自身や子孫へ移動する循環を拒否する
- Context / Overlayの内容を独立して保持し、Previewで両方を表示する
- Previewでコンテナの編集用境界線が消え、Text Boxへ入力できる
- LibraryのButtonにIcon設定を表示せず、ContentsにText・Image・Iconを追加して配列順で描画する
- Buttonの画像・アイコンのみの内容や混在する内容を、Treeのドラッグで並べ替えてPreviewでも維持する
- 詳細paneは初期状態で閉じ、CanvasのクリックまたはKeyboardで開く
- 詳細フィールドの名前・説明・値とトグル操作、TreeでのButton Contents編集
- slotは詳細フィールドに表示せず、Treeで子・親を選択する
- 詳細paneの各フィールドを+/−で独立して開閉し、編集値・アイコン検索・Treeで戻ったときの開閉状態を保持する
- 全フィールドが初期状態で閉じ、色フィールドを開いてもRGB・Aのカスタム編集が自動表示されない
- 空のslot枠、型に適合する配置と不適合な移動の拒否
- Pageの追加、path編集、ページ切り替えとページ間移動
- コアのText / Icon / Image / Videoのフィールド編集
- Text Box内のText ComとText Input Comの個別選択・移動、Text InputのValue編集、Previewで入力した値の維持
- 詳細編集でSvelteの実行時警告が出ない
- TreeのPage・コンポーネント・slotを「+/−」で独立して開閉し、閉じたslotへ配置できる
- Googleアイコン全索引からの検索、全8書体の読み込み、任意の画像URL
- Containerの幅100%・内容に合わせる・px指定、初期の横並び、子の追加後の方向維持、Padding・Marginの数値編集、縦・横切替とPreviewへの反映
- Text Boxを通常のContainer・Text・Text Inputから手動で再現し、寸法・間隔・読み上げ名・入力値・Previewを確認する
- Containerの両方向で左右・上下揃えを確認し、ネストした100%幅が余白込みで親に収まり、親幅変更に追従する
- Treeの装飾削除、ComponentとString / Enum / Numberの型表示の区別
- Treeから親やPageへ戻り、別のroot slotの子も選択できる
- Treeのslot枠の左右の端が親コンポーネントの背景色の左右の端に揃い、子の行とslot見出しの文字位置が揃う
- Tree内で前後へドラッグして順序を変え、横並びのContainerの方向を保持する
- slotから取り出す移動、slotへの戻し、Page間の移動で編集値を保持し、不適合な型や循環を拒否する

- Text Box・Textarea・Selectの値の保持、Password MaskのON/OFFとラベルの関連付け
- Calendarにテキストが残らず日付を保持し、数値・メール・URL・電話番号も独立した入力欄で値を保持する
- ParagraphのText配列・寸法・余白、Textのインライン表示とリンク、Shapeの直線・四角の描画
- Ctrl+C / Ctrl+Vによる子を含む複製、編集画面だけの表示切り替え、Pageの削除、LibraryとTreeの高さ調整
- テーマの初期色、15色パレット、RGB・A、透明度を維持する変更、移動・Preview後の保持
- 色表示の重複をなくし、カスタム編集の適用・キャンセル・閉じた際の破棄、初期色や子自身の色へのリセットを確認する
- Textの書体・サイズ・太さ・行高・文字間隔とButtonの寸法・余白・角丸が、複合コンポーネントやPreviewにも反映される
- Canvas単独・Flow単独・上下分割・左右分割を切り替え、操作中の面に合わせてLibraryとTreeが切り替わる。分割境界はドラッグ・矢印キー・画面幅変更でも調整できる
- Flow Nodeを自由配置して整理ボタンで整列でき、OUTから矢印を引いて接続先を変更できる
- RegistryとTreeの右端をスクロールバーの有無にかかわらず揃え、Flow LibraryとFlows一覧の左右端も揃える。トリガと名前のフラットなFlow一覧からGraphを切り替えられる
- Flow Nodeをコピー・貼り付け・削除でき、削除時に接続とBreakpointを除去する
- Page Loadと初期化NodeがPreview中だけ実行され、WATCHに現在値、CONSOLEとBrowser Consoleに値を含まない処理ログが出る
- FIELDからVARへの代入後にCONSTとのEqualsがTrue・Falseへ正しく分岐し、Breakpointで値を確認できる
- Flowの「!」が小さな固定幅で表示され、FIELDの参照候補はFlowの対象Page内に限られ、Page選択が表示されない
- 変数・定数のグローバル設定で参照候補と検証が更新され、別PageのFlowから初期化済みの値を読み書きできる

- TabとEnterによる選択・掴んだ子の配置、クリックでの同じ配置、Ctrl+Enterの掴む／離す、Escapeの取消
- Ctrl+Shift+Pで仮想カーソルを切り替え、矢印がLibraryのスクロールやリサイズに取られず、OFFでは通常のキー操作に戻る
- 仮想カーソルでLibraryから明示的なContainerへ配置し、Flow LibraryからNodeを配置・移動できる
- 仮想カーソルの端移動とPageUp / PageDownで対象領域だけをスクロールし、掴んだComを画面外のContainerへ配置できる
- 詳細paneにChildrenボタンを表示せず、TreeからのLibrary追加と手動配置が同じ親の配下に入る
- Flow Graphの拡大縮小・上下左右スクロール・背景ドラッグ、倍率変更後のドロップ座標・カード移動・接続端点を確認する
- Click・Load・ScheduleでPage指定を求めず、グローバル切替と起点の置き換えで元のPageを保持する

Reportは`playwright-report/`へ、失敗時のScreenshotとTraceは`test-results/`へ保存する。これらはGitとDocker build contextから除外する。

## WSL / LinuxのHostで実行

Node.js 24とPlaywright対応OSで実行できる。LinuxのBrowser OS DependencyもInstallする場合は`--with-deps`を付ける。

```bash
cd '<project-root>'
npm ci
npx playwright install chromium
npm run check
npm run build
npm run test:unit
npm run test:e2e
```

HTML Reportの表示:

```bash
cd '<project-root>'
npm run test:e2e:report
```

E2Eテストは`tests/e2e/**/*.spec.ts`へ置く。E2Eの設定とテストも`npm run check`の対象とする。

## 今回の確認結果

Dockerで型チェック（エラー・警告0件）、ビルド、単体テスト92件、Chromium E2E 98件が通過した。ビルドには既存のバンドルサイズ警告が残る。
Childrenボタンの削除、手動配置とLibrary追加の親子構造、仮想カーソルのスクロール、倍率変更後のFlow配置・接続、トリガーのPage指定削除と所属Pageの保持を確認した。
通常のContainer・Text・Text InputでText Boxを手動構成し、同じ寸法・間隔・読み上げ名・Preview入力を再現した。両方向での左右／上下揃え、子の伸張、余白込みの100%幅、親幅変更への追従も確認した。
Brave実機での操作確認は未実施。
