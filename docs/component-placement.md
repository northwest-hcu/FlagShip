# コンポーネントの配置

LibraryにはButton、Container、Text Box、Image、Icon、Text、Video、Textarea、Select、Number、Calendar、Email、URL、Telephone、Paragraph、Span、Shapeの見本を表示する。見本とCanvasは同じコンポーネントを描画する。

## 操作

1. Libraryの見本をCanvasへドラッグする。空いた部分へのドロップは、選択中のPageのContextまたはOverlay slotの末尾へ追加する。
2. 配置済みの部品の上・下・左・右へドロップすると、その方向へ並べる。黄緑の線が挿入位置を示す。
3. Containerの中央へドロップするとChildren slotへ追加する。
4. 配置済みの部品もCanvasまたはTreeからドラッグできる。PageのContext / Overlay slotへドロップすると、そのslotの末尾へ移動する。別のPageにも移動できる。
5. Treeのコンポーネント配下のslot枠へも配置できる。ButtonのContents slotはText・Imageの配列を受け付け、IconもImageとして配置できる。Text BoxのLabel slotはTextを受け付け、入力値はText Box自身が持つ。単一slotの既存の値は置き換える。
6. Libraryの追加ボタンをクリックしても末尾へ追加できる。
7. Treeの行の上半分へドロップすると対象の前、下半分へドロップすると後ろへ移動する。黄緑の線で挿入位置を示し、Containerの縦・横の並び方は維持する。Libraryの見本も行の前後へ追加できる。
8. slot内のコンポーネントを親の行の前後、別のslot、PageのContext / Overlayへドラッグすると、元のslotから取り出して移動する。空になったslot枠は残り、編集したフィールド値も保持する。slot枠の空いた部分にもドロップできる。

不適合な型、存在しない配置先、自身や子孫への移動は拒否して元の配置を保持する。単一slot内の部品の隣への配置は受け付けない。

Treeのコンポーネント名をクリックすると詳細paneが開く。Deleteで選択したコンポーネントとそのslot内容を削除する。slot内の値だけを削除した場合は空の枠が残る。

コンポーネントの横の「+/−」で配下のslotを開閉する。slotも同じ表示で内容を開閉できる。PageとContext / Overlayのslotにも独立した開閉ボタンがある。折りたたみはCanvasの表示・選択・データを変更せず、子の開閉状態を保持する。閉じたslotの見出しへもドロップできる。

Treeのコンポーネント名の前には種類マークや「・」を表示しない。子を持たないコンポーネントには開閉ボタンを置かず、インデントのみを揃える。配下のslot枠の左右の端は親コンポーネントの背景色の左右の端に揃え、slot見出しと子の行にも同じ開閉欄の幅を使う。

## 右側の詳細pane

初期状態では閉じている。コンポーネントをクリック、またはCanvasの部品でEnter / Spaceを押すと開く。各フィールドに名前、description、値を表示する。閉じるボタンで閉じ、右側の「+」で再び開ける。
型はString・Enum・NumberやText Componentなどで表示する。詳細paneのパンくずから親やPageへ戻ることができ、編集値を保持する。

ButtonのContents配列をTreeへ表示する。子をクリックしてテキスト・画像・図柄を編集し、Tree内のドラッグで配列の順序を変える。内容はテキストのみ、画像・アイコンのみ、またはその組み合わせに対応する。Libraryではアイコンのない見本を表示する。

ContainerのDirectionはトグルで選び、Padding・Marginは初期値10px、0以上の数値で指定する。大きさは内容に合わせる。Directionの変更はドラッグ配置で作られた並び用グループより優先する。

IconのSymbolはGoogle Fontsの全アイコンから検索して選ぶ。Fontは全8書体から選べ、Sourceに任意のアイコン画像URLも指定できる。詳細は[コンポーネント、フィールドとslot](./component-model.md)を参照する。

初期色はテーマカラー。Color / Backgroundフィールドは15色パレットを基本とし、RGB・Aはカスタム編集で適用またはキャンセルする。リセットでは初期色や親の色で上書きされる前の子自身の色へ戻す。各入力コンポーネントはPreviewの入力値を保持する。Text BoxのPassword MaskはON/OFFで切り替える。日付入力には独立したCalendarを配置する。詳細paneの各フィールドは初期状態で閉じ、「+/−」で個別に開閉できる。Paragraph・SpanはTextに固定の表示ルールを適用し、Shapeの直線を区切り線として利用できる。

TextではFont・Font Size・Font Weight・Line Height・Letter Spacingを編集する。Button内の文字もContentsのTextから変更する。ButtonではWidth・Height・Horizontal Padding・Vertical Padding・Border Radiusをpxで編集する。幅・高さを0にすると内容にフィットする。

## 順序

| 配置先 | 並べ方 | Treeの順序 |
|---|---|---|
| 上 | 縦 | 対象より前 |
| 下 | 縦 | 対象より後 |
| 左 | 横 | 対象より前 |
| 右 | 横 | 対象より後 |
| 内側 | ContainerのChildren slot | Containerの配下 |

上下・左右が混在する場合はContainerで並びを組み合わせる。Treeでは自動作成した並び用Containerを省略し、配置されたコンポーネントとslotを表示する。

## PagesとContext / Overlay

TreeのルートはPages配列。PageはPathとContext / Overlayのslotを持つ。初期状態は最初のPageのContextを開き、Overlayを閉じる。slotの見出しをクリックするとCanvasの編集対象を切り替え、詳細paneを閉じる。

「+ Page」でPageを追加できる。Page名をクリックするとPathを編集できる。各Pageと各slotの内容は独立して保持する。

Previewでは選択中のPageのContextを表示し、その上へOverlayを重ねる。配置データはメモリに保持するため、再読み込みすると初期化する。

## 編集用スタイル

`components/components.css` は実コンポーネントのスタイル、`editor-view.css` は編集画面の見本、選択、slot枠、配置ガイドのスタイル。

Containerの点線、空Containerの表示、選択枠、ドロップ位置は編集画面だけに表示する。Outlineは寸法を変えず、Previewに切り替えても部品の配置を維持する。Text Box自体のBorderはPreviewでも表示する。

PreviewではText Boxへ入力できる。Buttonのアイコンは装飾として扱い、読み上げる名前はテキストのみとする。単独のIconには代替テキストを付ける。

## デザインの参考資料

デジタル庁デザインシステムの操作領域、入力ラベル、フォーカス、代替テキストの考え方を参考に独自実装した。

- [ボタン：アクセシビリティ](https://design.digital.go.jp/dads/components/button/accessibility/)
- [インプットテキスト：使い方](https://design.digital.go.jp/dads/components/input-text/usage/)
- [画像](https://design.digital.go.jp/dads/components/image/)
- [アイコン：アクセシビリティ](https://design.digital.go.jp/dads/foundations/icon/accessibility/)

サンプル画像とアイコンはリポジトリ内のSVGを使用する。
