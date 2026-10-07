# Flow の設計と現在の実装

## 作成と配置

最上部で`Canvas`単独、`Flow`単独、`上下分割`、`左右分割`を切り替え、左のFlows一覧にある`+ Flow`で空のFlowを作る。Flow Library・追加ボタン・Flow一覧は左右端を揃える。Comの詳細paneにある`+ Flow`も、選択中Pageを範囲とする空のFlowを開く。Flow作成時に起点やActionを自動配置・自動接続しない。

CanvasとFlowは並列の編集画面で、分割表示中はクリック・フォーカスした側に合わせて左のRegistryとTreeを切り替える。Canvas側のRegistryにはCom、Flow側のRegistryにはNodeが並び、Flow側の下段には全Flowをトリガと名前でフラットに並べる。上下・左右分割の境界はドラッグまたは矢印キーで動かせる。RegistryとTreeは個別に縮小でき、両方縮小すると左側は操作レールになる。両画面の共通ツールバーにPreview切替・解除を置き、Flow画面では同じ位置の`Delete Flow`で選択中のFlowを削除する。FlowでPreviewを始めても画面を切り替えず、実行位置とBreakpointを確認できる。

Flow画面左のLibraryからNodeをドラッグしてGraph上の任意の位置へ置く。`+`ボタンでも空き位置に配置できる。Graphのカード本体とNodeハンドルをドラッグして自由に移動でき、追加・接続は既存の座標を動かさない。`整理`ボタンを押したときだけ、Edgeの深さとNodeの追加順から全Nodeを列と行に整列する。

Graphは25〜200%で拡大縮小でき、100%ボタンで戻せる。ホイール・トラックパッドで上下左右にスクロールし、Shift＋ホイールで横移動、Ctrl＋ホイールでポインタ位置を中心に拡大縮小する。背景のドラッグと中ボタンのドラッグで表示位置を移動できる。倍率変更後もNodeの保存座標は変えず、Libraryドロップ・カード移動・接続線・仮想カーソルの配置に同じ座標変換を使う。

GraphではNode全体をクリックして選択でき、右の出力端子をドラッグすると端子は固定されたまま直角の線と矢印の先端がカーソルに追従する。左の入力端子またはNode本体で離すとEdgeを作成・付け替える。入力端子は文字を表示しない。ConditionのTRUEとFALSEは右側に並列の端子として分けて表示する。確定した接続線も端点の実際の位置に合わせた直角線で描く。Nodeを選ぶと設定paneに実行順の入力元と出力先を分けて表示し、出力先は後から選び直せる。起点の入力はイベントまたは時刻で、通常Nodeの未接続入力は「未接続」と表示する。Nodeの位置と接続はFlowに保持する。`Copy Node`・`Paste Node`・`Delete Node`とCtrl+C / Ctrl+V / Deleteに対応する。コピーは設定を複製し、接続とBreakpointは複製しない。削除したNodeにつながるEdgeとBreakpointも削除する。

将来のLibrary項目はCanvas配置物とFlow定義を一組として持てるようにする。例えばモーダルのLibrary項目なら、モーダルを開くComとClick Trigger・表示Actionまでを一組とし、配置時に新しいCom IDとFlow IDへ参照を書き換える。この形式は設計上の拡張点であり、現在のRegistryにある項目はCom単体またはNode単体である。共有するテンプレートに個人別情報や秘匿値を含めない。

| 現在配置できるNode | 役割 | 出力Port |
|---|---|---|
| `trigger.event` | ComのClickで開始する | `next` |
| `trigger.load` | Pageを表示したときに開始する | `next` |
| `trigger.schedule` | After、Interval、Atで開始する | `next` |
| `logic.condition` | 比較結果で分岐する | `true`、`false` |
| `action.navigate` | 指定Pageへ移動する | `next` |
| `action.set-variable`（Set） | ユーザー変数またはComフィールドへ値を代入する | `next` |
| `action.init-variable` | ユーザー変数を宣言・初期化する | `next` |
| `action.init-constant` | 定数を宣言・初期化する | `next` |

FlowにはEvent・Page Load・Scheduleの起点Nodeを1つ置く。Page Loadは対象PageのPreview開始時とPreview内のPage移動時に発火する。未接続のPortはそこで実行が終了する。循環するEdgeは作成できない。

## Clickイベント

Event Triggerの現在のイベント種別は`click`。PageはFlow作成時の所属を使い、対象Comだけを設定する。Event・Page Load・ScheduleのInspectorでPageを選び直す操作は設けない。Navigateの移動先Pageは別の操作対象なので選択する。対象はButtonに限定せず、そのPage内の任意のComを選べる。ButtonやParagraphの子TextなどもStable IDで参照する。Preview中のクリックは対象ComのIDで照合し、マウスとキーボードから同じFlowを起動する。編集画面のクリックはComの選択に使う。

Comの名前やTree内の位置が変わってもID参照を維持する。削除されて参照が無効になった場合、Flowに設定エラーを表示して実行を止める。同じPageの同じComへ複数のClick Flowを割り当てない。

## スケジュールイベント

`trigger.schedule`には次のモードがある。「グローバル」チェックでPage / Project範囲を切り替え、OFFに戻すとFlow作成時のPageへ戻る。編集中のCanvasを別Pageに切り替えても所属は変わらない。グローバルScheduleをClick / Page Loadへ置き換えたときも元のPageへ戻す。Page範囲では対象Pageの表示中、Project範囲ではPreview全体でTimerを有効にする。

| Mode | 発火 |
|---|---|
| `after` | 範囲が有効になってから指定ミリ秒後に一度 |
| `interval` | 指定間隔の経過後から繰り返し。間隔は1000ms以上 |
| `at` | 時差を含む指定日時に一度。過去の時刻は埋め合わせない |

Page移動時はPage範囲のTimerを解除し、新しいPageのTimerを登録する。Project範囲のTimerはPage移動でリセットせず、Preview終了時に解除する。前回の実行中やBreakpoint停止中は重複実行を積み上げない。BrowserのTimerが動くのはPreviewを開いている間で、閉じている間の実行にはBackend Schedulerが必要となる。

## 比較値と参照

Conditionの比較元・比較先、およびSetの入力値は、同じ3種類の参照から選ぶ。Setの出力先はFIELDまたはVARから選ぶ。UIでは実行順のFLOW IN/OUTと値のDATA IN/OUTを区別し、Setは「代入する値 → 代入先」の順に表示する。参照の種類もそれぞれ表示する。

| UI | 保存する参照 | 意味 |
|---|---|---|
| `FIELD` 黄緑 | Page ID、Com ID、Field key | Flowの対象Page内にあるComのフィールド値。Previewで変更された入力の`value`も参照できる |
| `VAR` 青 | Init Variable Node ID | Init Variableを通過したときに初期化するユーザー変数。Setで更新可能 |
| `CONST` 黄 | Init Constant Node ID | Init Constantを通過したときに初期化する固定値。Setでは更新しない |

Init Variable・Init Constant Nodeで名前・初期値・「グローバル」を設定する。グローバルは初期状態でOFF。同じPageのFlow間で参照でき、ONにすると全ページとProject範囲のFlowから参照できる。Project範囲のFlowでOFFにした宣言はそのFlow内だけで参照する。参照候補と検証、WATCHにはこの範囲を適用する。値はPreview中だけ保持し、Preview終了時に破棄する。

初期化Nodeは起点から必要な処理より前に接続する。通過前の値は未初期化として扱う。

Conditionでは値の種類を選び、FIELDならFlowの対象Page内のComを選んでField keyを入力する。Page選択は表示せず、別Pageの参照は検証エラーにする。Project範囲のFlowではFIELDを選べない。Field key入力にはそのComの`String`・`Number`・`Boolean`・`Enum`フィールドの候補を補完表示する。存在しないキーは検証エラーにする。参照の保存には表示名ではなくIDとキーを使う。

SetのFIELD出力先もFlowの対象Page内のCom・Field keyで指定する。内部のID参照には対象Page IDを保持する。代入値は対象フィールドの型と既存のフィールド制約で検証する。実行したフィールド値はPreview内で表示と後続Nodeの参照に使い、Preview終了時に破棄する。Flow定義や編集用Comには実行値を記録しない。

Flow定義には個人別情報と秘匿値を保存しない。FIELDが保存するのはIDとキーだけで、値は実行時に参照する。Init Nodeの初期値には共有可能な値だけを置く。実行中の現在値はPreview中のWATCHにだけ表示し、Password Maskが有効なText Boxの値は伏せる。処理ログとBrowser Consoleには値を出さない。

`equals`は両側に値がある場合に前後の空白を除き、UnicodeのNFKC正規化をした上で大文字・小文字を区別して比較する。未初期化の参照はFalseになる。`notEmpty`は前後の空白を除いた後の判定である。値の参照と条件判定はDOMを直接読まず、入力値とPreview中のユーザー変数・定数を使う。Previewで入力した値は既存の編集動作と同じくComのValueにも反映する。定数と変数の編集値、Field keyは現在文字列として比較する。

```ts
type FlowValue =
  | { kind: "field"; pageId: string; componentId: string; fieldKey: string }
  | { kind: "variable"; variableId: string }
  | { kind: "constant"; constantId: string };
```

## PreviewとBreakpoint

Previewは編集用Page選択と独立したPage状態で動く。Click・Page Load・Timerから起点を探し、EdgeのPortに沿ってNodeを実行する。実行中Nodeを黄緑色で、通過したNodeとEdgeも強調する。Canvas上部には現在の実行状態を表示し、押すとFlow画面へ移れる。

Nodeの赤い点をBreakpointとして設定できる。Previewで到達したときはNodeの実行前に停止し、`Step`でそのNodeを1つ実行して次のNodeの前で停止する。`Continue`は次のBreakpointまたは終端まで進む。Preview中はFlow画面のWATCHに参照中のFIELD・VAR・CONSTの現在値を表示し、CONSOLEとBrowser ConsoleにNodeの実行・分岐・終了を記録する。Preview終了時は停止状態、ユーザー変数・定数、処理ログを破棄し、編集画面や通常表示にはWATCHとログを出さない。入力値はComのValueとして保持する。

Flow、Page、Comは現在Editorのメモリに保持し、再読み込みで初期化する。保存・読込の導入時は同じProject Documentへ含める。

## 検証と拡張

実行前に起点数、Com・Page・Field・VAR・CONSTの参照、NodeとEdgeのID、Portの接続、循環、到達できないNodeを確認する。作成途中のFlowにはエラーを表示し、設定が揃うまで実行しない。接続線や画面位置は実行順を決めず、EdgeとPortが実行順を決める。

後続候補は、入力変更などのEvent、UI操作、外部Resource Request、Switch / Guard、値変換、Wait / Debounce / Throttle、For Each / Parallel / Retry、Subflow / Returnである。Runtime全体の構想は[Flow and Execution Model](./architecture/06-flow-and-execution-model.md)を参照する。Page・Comのコピー時に関連Flowの参照を複製する処理と、Projectの保存・読込は今後の実装対象となる。
