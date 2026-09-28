# コンポーネント、フィールドとslot

実装は `src/editor/component-model.ts` に定義する。コンポーネントの共通型はComponentType、画面のルートはPages配列。

## コアと派生型

| コア | 派生・用途 |
|---|---|
| Text | 文字列を描画する最小単位 |
| Image | 画像を描画。IconはImageTypeを継承し、アイコン寸法とSymbol / Fontの選択肢を持つ |
| Input | 入力でき、値を保持する共通型。Text Box・Textarea・Select・Number・Calendar・Email・URL・Telephoneが継承する。共通型そのものは配置しない |
| Shape | 直線・四角・楕円。区切り線には直線を使う |
| Video | 動画を表示する |
| Container | 縦・横の配置とChildren配列を持つ |

Audioはコアに含めず、Dividerの独立したコアも作らない。LibraryとTreeではText Componentなどの初期名と型を表示し、値のString型と区別する。

ParagraphとSpanはTextの種類を増やさず、Text slotを持つ別の複合Componentとして実装する。Paragraphはp、Spanはspanという表示ルールを適用する。Buttonには専用のコア型を作らない。Text Boxは共通Input型を使い、ラベル用のText slotを持つ。

## Buttonの内容

ButtonはContents slotにText・Imageを配列で保持する。IconもImageとして受け付ける。配列の順序で描画し、テキストだけ、画像だけ、アイコンだけ、混在した複数内容に対応する。

```text
Button — Component
├─ name / color / background
└─ contents — SlotField<(TextType | ImageType)[]>
   ├─ Text Component
   ├─ Icon Component — ImageType
   └─ Image Component
```

初期内容はText一件。Libraryにはアイコンなしの見本を表示する。ContentsへLibraryから追加し、Treeの行の前後へドラッグして配置順を変える。旧Text / Iconの別slotとIcon PositionはContents配列へ置き換える。内部にContainerなどの別型を入れる操作は拒否する。

ButtonはWidth、Height、Horizontal Padding、Vertical Padding、Border RadiusをNumberフィールドとして持つ。幅・高さは初期値0で内容にフィットし、0より大きい値をpxで固定する。内側余白は左右24px・上下12px、角丸は8pxを初期値とし、0以上で編集する。文字の書体やサイズはContents内のTextで編集する。

ボタンの操作名はTextの内容から作り、Textがない場合はImage / IconのAltを使用する。Button内の画像は装飾として描画して読み上げの重複を避ける。

## Textの書体とサイズ

TextはFont、Font Size、Font Weight、Line Height、Letter Spacingを持つ。Fontは同梱のShare Tech Monoとブラウザ標準のMonospace / Sans Serif / Serifから選ぶ。初期値はShare Tech Mono、16px、Regular、行高1.5倍、文字間隔0px。太さはRegular / Boldのトグルで選び、行高にはpxを付けない。文字間隔は負のpxにも対応する。

単独のText、ButtonのContents、Text BoxのLabel、Paragraph / SpanのText slotで同じ設定を描画し、Previewや移動でも保持する。Text Boxのラベルを装飾しても入力値や入力欄の文字サイズは変えない。

## InputとText Box

InputTypeはName、Color、Background、Value、Altを共通で持つ。Valueは各インスタンスが保持する。汎用のInput Componentと入力形式のEnumは削除し、具体的な入力形式ごとに独立したコンポーネントを配置する。

Text BoxはValue、Placeholder、Password Mask（Boolean）とLabelのText slotを持つ。入力欄はText Box自身に属し、内側のInput ComponentやInput slotは持たない。Password MaskをONにするとHTMLのpassword入力、OFFにするとtext入力として描画し、値はそのまま保持する。ラベルと入力欄を関連付け、ラベルが空の場合はAltを読み上げる。

TextareaはPlaceholderとRows、SelectはValueのEnum選択肢を持つ。Number、Calendar、Email、URL、Telephoneはそれぞれnumber、date、email、url、telの入力として描画する。Calendarはテキスト用のラベルや値を引き継がず、未選択の初期値を空文字とする。詳細paneも日付専用のValue編集欄を使い、YYYY-MM-DD形式の有効な日付のみ保持する。

Previewで入力・選択した値は各コンポーネント自身へ反映し、編集画面に戻った後や移動した後も保持する。

## フィールドと定義データ

詳細paneのフィールドは名前、description、値、型を保持する。文字列はString、選択肢はEnum、数値はNumber、真偽値はBoolean、色はColorとして表示する。BooleanはON/OFFのトグルで編集する。コンポーネントを配置するslotはフィールド一覧から外し、Treeで表示・操作する。

Enumは自身のoptions配列にvalueとlabelを持つ。IconのSymbolは書体の全Symbol配列、Fontは全8書体の配列から選択する。Fontの変更時にSymbolの選択肢も更新する。[アイコン素材とライセンス](./icons.md)

数値フィールドはmin、step、unit、多行編集はeditorなどの定義データを持つ。詳細paneはこれらの情報から編集欄とトグルを描画する。

slotはkind、accepts、multipleを持つ。acceptsは共通Component、コア型、複数のコア型の組み合わせを表し、派生型も基底のコア型として受け付ける。componentFieldsはslotを除いたフィールド、slotsOfはslotだけを列挙する。空のslot枠もTreeへ表示する。単一slotへの配置は既存値を置き換える。

外部ライブラリに向けて、Enum選択肢・数値制約・編集方法・slot制約をデータ化した。任意の外部Component定義とRendererを登録・読み込みする仕組みは今後の対応。現在のLibraryには17種類の見本を同梱する。

## 色とテーマ

ColorはRGB各0～255の整数、Aは0～1の透明度を保持する。フィールドを開くと現在色一件と、12色＋白・黒・グレーの15色パレットを表示する。パレットは選択時に確定し、Aを保持する。

RGBピッカーとRGB / Aの数値入力・スライダーは「カスタム…」から開く。カスタム編集は一時的な値として保持し、「適用」で確定、「キャンセル」で破棄する。フィールドを閉じるか別コンポーネントを選ぶと未確定の編集を破棄する。カスタム編集中は色見本をRGB入力に置き換え、現在色の表示を重複させない。[ブラウザの色入力](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/color)を必要なときだけ使用する。

初期色は濃いグレーと黄緑の既存テーマ。文字はテーマの文字色、Inputの背景はパネル色、Pageの背景はCanvas色、Buttonはアクセント背景と濃いグレーの文字を使う。Containerなどの背景はテーマのグレーをA=0で保持する。

Colorは文字・図柄の色、Backgroundは背景色。Colorフィールドはテーマの初期値defaultValueと、そのコンポーネント自身で最後に選んだlocalValueを保持する。親のColorを変更すると配下の表示色valueにも反映し、inheritedをtrueにするが、子のlocalValueは上書きしない。

親の色を適用中の子で「リセット」すると、その子自身のlocalValueへ戻す。親や兄弟の色は変更しない。直接編集したColorやBackgroundのリセットはテーマの初期値へ戻す。子を選択して個別に色を変更することもできる。画像の画素そのものをColorで着色する処理は行わず、Iconの図柄やShapeには色を適用する。色は移動やPreviewで保持する。

## Pagesと編集

Pages = PageComponent[]。PageはName、Color、Background、PathとContext / OverlayのComponent配列slotを持つ。最初のpathは/。「+ Page」で追加し、詳細paneでpathを編集する。URLルーティングはまだ持たない。

詳細paneはCanvas右側を維持する。クリック時に開き、slotを除いたフィールドを個別に表示する。各フィールドは初期状態で閉じ、名前と型のみ表示する。+/−で独立して開閉し、確定した編集値やアイコン検索を保持する。paneを開いている間はコンポーネントごとの開閉状態を保持する。Enumはトグル、Symbolは検索、Colorは15色パレットを基本に編集する。Treeでslot内の子を選択し、詳細paneのパンくずから親やPageへ戻る。

TreeはPage・Component・slotを+/−で独立して開閉する。slot枠の左右の端は親Componentの背景色の左右の端に揃える。Tree内の前後移動はContainerの並び方向を変えない。slotからの取り出し・戻し・ページ間移動で編集値を維持し、不適合な型や循環を拒否する。

slotの型表記はText Com、Image Com、Com[]のようにComponentをComへ短縮する。型定義と通常のコンポーネント名は維持する。

Containerは内容にフィットし、PaddingとMarginは初期値10px。Directionを変更すると直下の自動生成された並び用グループを展開し、実際の子Containerは保持する。

状態はメモリ内で保持する。再読み込みで初期化し、保存・読込はまだ持たない。
