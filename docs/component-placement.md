# コンポーネントの配置

Registryはコンポーネントを1つの一覧で表示する。現在のデフォルトライブラリにはButton、Container、Text Box、Text Input、Image、Icon、Text、Video、Textarea、Select、Number、Calendar、Email、URL、Telephone、Paragraph、Shapeの見本を収める。見本とCanvasは同じコンポーネントを描画する。Registry上部ではコンポーネント名を日本語・英語で検索でき、ライブラリは独立した絞り込み条件として選べる。結果はライブラリごとに境界線で区切り、フォルダの印は所属を示す。検索してもクリック追加とドラッグ配置ができる。

## 操作

1. Libraryの見本をCanvasへドラッグする。空いた部分へのドロップは、選択中のPageのContextまたはOverlay slotの末尾へ追加する。
2. 配置済みの部品の上・下へドロップすると前後に追加する。左右の配置は横向きのContainer内で行う。Page直下や縦向きContainer内への左右ドロップは受け付けず、Containerの自動生成やDirectionの変更は行わない。黄緑の線が挿入位置を示す。
3. ContainerとText Boxの中央へドロップするとChildren slot、Buttonの中央はContents slot、Paragraphの中央はText slotへ追加する。slotに合わない種類は受け付けない。
4. 配置済みの部品もCanvasまたはTreeからドラッグできる。PageのContext / Overlay slotへドロップすると、そのslotの末尾へ移動する。別のPageにも移動できる。
5. Treeのコンポーネント配下のslot枠へも配置できる。ButtonのContents slotはText・Imageの配列を受け付け、IconもImageとして配置できる。Text Boxは通常Containerの設定を持つプリセットで、Children slotにはTextとText Inputが初期配置され、どちらも通常の子Comとして移動できる。入力値はText Inputが持つ。単一slotの既存の値は置き換える。
6. Libraryの追加ボタンをクリックしても末尾へ追加できる。
7. Treeの行の上半分へドロップすると対象の前、下半分へドロップすると後ろへ移動する。黄緑の線で挿入位置を示し、Containerの縦・横の並び方は維持する。Libraryの見本も行の前後へ追加できる。
8. slot内のコンポーネントを親の行の前後、別のslot、PageのContext / Overlayへドラッグすると、元のslotから取り出して移動する。空になったslot枠は残り、編集したフィールド値も保持する。slot枠の空いた部分にもドロップできる。

Tabで見本・部品・Treeの行・slotへフォーカスを移動する。Enterはクリックと同じ選択・操作を行う。Libraryの見本や配置済みの部品でCtrl+Enterを押すと掴み、配置先でCtrl+Enter・Enter・クリックすると離す。配置方法を選ぶパネルは表示しない。Treeの行にフォーカスして確定すると行の後ろへ置く。

Ctrl+Shift+Pで仮想カーソルをON/OFFする。ON中は矢印キーを先に処理し、Library・スクロール・リサイズ操作へ渡さない。矢印は12px、Shift+矢印は48px、Alt+矢印は2pxで移動する。カーソルがスクロール領域の端へ来ると矢印の方向へその領域をスクロールする。スクロールの限界ではカーソルが領域の外へ移動できる。PageUp / PageDownでカーソル下の領域を縦スクロールし、Shift併用で横スクロールする。Tabでフォーカスを移すと仮想カーソルも対象へ移る。カーソル下の対象をEnterでクリックし、Ctrl+Enterで掴む／離す。Canvasの部品とFlow Node、両方のLibraryに対応する。Escapeは掴んだ部品の移動を確定せず取り消し、仮想カーソルをOFFにすると掴んだ状態も取り消す。Previewへ切り替えたときは仮想カーソルと掴んだ状態を解除する。

不適合な型、存在しない配置先、自身や子孫への移動は拒否して元の配置を保持する。単一slot内の部品の隣への配置は受け付けない。

Treeのコンポーネント名をクリックすると詳細paneが開く。Deleteで選択したコンポーネントまたはPageを削除する。最後のPageを削除すると空のPageを作って編集可能な状態を保つ。slot内の値だけを削除した場合は空の枠が残る。Ctrl+C / Ctrl+Vで選択したコンポーネントまたはPageとその子を複製する。フィールドの入力中は通常の文字編集ショートカットを優先する。

コンポーネントとPageのコピー内容は現在のタブ内のエディタ状態に保持する。フィールド内の文字のコピー・貼り付けはブラウザ標準のクリップボードを使う。

コンポーネントの横の「+/−」で配下のslotを開閉する。slotも同じ表示で内容を開閉できる。PageとContext / Overlayのslotにも独立した開閉ボタンがある。折りたたみはCanvasの表示・選択・データを変更せず、子の開閉状態を保持する。閉じたslotの見出しへもドロップできる。

Treeのコンポーネント名の前には種類マークや「・」を表示しない。子を持たないコンポーネントには開閉ボタンを置かず、インデントのみを揃える。配下のslot枠の左右の端は親コンポーネントの背景色の左右の端に揃え、slot見出しと子の行にも同じ開閉欄の幅を使う。

## 右側の詳細pane

初期状態では閉じている。コンポーネントをクリック、またはCanvasの部品でEnter / Spaceを押すと開く。各フィールドに名前、description、値を表示する。閉じるボタンで閉じ、右側の「+」で再び開ける。
追加先指定用のChildren等のボタンは詳細paneに置かない。子の追加先はTreeのslot見出しで指定し、Libraryの＋とCanvas・Treeへの手動配置は同じslot配列へ追加する。
型はString・Enum・NumberやText Comなどで表示する。親やPageはTreeから選択でき、編集値を保持する。

ButtonのContents配列をTreeへ表示する。子をクリックしてテキスト・画像・図柄を編集し、Tree内のドラッグで配列の順序を変える。内容はテキストのみ、画像・アイコンのみ、またはその組み合わせに対応する。Libraryではアイコンのない見本を表示する。

ContainerのWidth Modeは初期値が親の幅100%で、左右のMarginを含めて親に収める。内容に合わせる・px指定も選べる。Horizontal Alignで左・中央・右、Vertical Alignで上・中央・下へ揃え、Gapで子の間隔を指定する。Stretch ChildrenをONにすると縦並びの子の横幅または横並びの子の高さを広げる。固定した子Containerのサイズは保持する。Directionは初期値が横並びで、子を追加した直後から適用する。トグルで縦並びにも変更できる。Padding・Marginは初期値10px、0以上の数値で指定する。Heightの0は内容に合わせる。上下揃えの空きを作る場合はHeightを指定する。Container内へのドラッグ配置は子の順序を変え、Directionを上書きしない。

IconのSymbolはGoogle Fontsの全アイコンから検索して選ぶ。Fontは全8書体から選べ、Sourceに任意のアイコン画像URLも指定できる。詳細は[コンポーネント、フィールドとslot](./component-model.md)を参照する。

初期色はテーマカラー。Color / Backgroundフィールドは15色パレットを基本とし、RGB・Aはカスタム編集で適用またはキャンセルする。リセットでは初期色や親の色で上書きされる前の子自身の色へ戻す。各入力コンポーネントはPreviewの入力値を保持する。Text InputのPassword MaskはON/OFFで切り替える。日付入力には独立したCalendarを配置する。詳細paneの各フィールドは初期状態で閉じ、「+/−」で個別に開閉できる。Textはインライン表示に使用でき、ParagraphはTextを段落として描画する。Shapeの直線を区切り線として利用できる。

TextではLink・Font・Font Size・Font Weight・Line Height・Letter Spacingを編集する。Button内の文字もContentsのTextから変更する。ButtonではWidth・Height・Horizontal Padding・Vertical Padding・Border Radiusをpxで編集する。幅・高さを0にすると内容にフィットする。ParagraphのText slotは配列で、複数のTextを順番に描画する。ParagraphではWidth・Height・Margin・Paddingをpxで編集し、0なら内容に合わせるか余白をなくす。

## 順序

| 配置先 | 並べ方 | Treeの順序 |
|---|---|---|
| 上 | 縦 | 対象より前 |
| 下 | 縦 | 対象より後 |
| 左 | 横向きContainer内 | 対象より前 |
| 右 | 横向きContainer内 | 対象より後 |
| 内側 | ContainerのChildren slot | Containerの配下 |

上下・左右が混在する場合はContainerを明示的に置き、Directionで並びを組み合わせる。配置操作で新しい並び用Containerは作らず、部品の配列順だけを変更する。

## PagesとContext / Overlay

TreeのルートはPages配列。PageはPathとContext / Overlayのslotを持つ。初期状態は最初のPageのContextを開き、Overlayを閉じる。slotの見出しをクリックするとCanvasの編集対象を切り替え、詳細paneを閉じる。

「+ Page」でPageを追加できる。Page名をクリックするとPathを編集できる。各Pageと各slotの内容は独立して保持する。RegistryとTreeの境界はドラッグまたは上下矢印キーで高さの割合を変えられる。Treeの目のボタンはCanvasの編集表示のみを切り替え、Previewには影響しない。

Previewでは選択中のPageのContextを表示し、その上へOverlayを重ねる。配置データはメモリに保持するため、再読み込みすると初期化する。

## 編集用スタイル

`components/components.css` は実コンポーネントのスタイル、`editor-view.css` は編集画面の見本、選択、slot枠、配置ガイドのスタイル。

Containerの点線、空Containerの表示、選択枠、ドロップ位置は編集画面だけに表示する。Outlineは寸法を変えず、Previewに切り替えても部品の配置を維持する。Text InputのBorderはPreviewでも表示する。

PreviewではText Boxへ入力できる。Buttonのアイコンは装飾として扱い、読み上げる名前はテキストのみとする。単独のIconには代替テキストを付ける。

## デザインの参考資料

デジタル庁デザインシステムの操作領域、入力ラベル、フォーカス、代替テキストの考え方を参考に独自実装した。

- [ボタン：アクセシビリティ](https://design.digital.go.jp/dads/components/button/accessibility/)
- [インプットテキスト：使い方](https://design.digital.go.jp/dads/components/input-text/usage/)
- [画像](https://design.digital.go.jp/dads/components/image/)
- [アイコン：アクセシビリティ](https://design.digital.go.jp/dads/foundations/icon/accessibility/)

サンプル画像とアイコンはリポジトリ内のSVGを使用する。

手動でText Boxを組み立てる設定値は[Containerの揃えと手動でのText Box構成](./component-model.md#containerの揃えと手動でのtext-box構成)を参照する。
