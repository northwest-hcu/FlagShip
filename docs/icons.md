# アイコン素材とライセンス

Google Fontsの両アイコンセット、Material SymbolsとMaterial Iconsを同梱する。

| セット | 書体 |
|---|---|
| Material Symbols | Outlined、Rounded、Sharp |
| Material Icons | Filled、Outlined、Rounded、Sharp、Two Tone |

Iconの詳細paneでSymbolを名前検索し、Fontから書体を選ぶ。検索しない場合も全件をページ送りで参照できる。各書体の公式codepoints索引を使用し、元の3種類への制限やフォントの一部への絞り込みを行わない。Material Symbolsは各書体4,299名称を収録する。旧Material Iconsの索引に同名が重複する場合は最後の定義を使用する。

Material SymbolsのFillで輪郭と塗りつぶしを選べる。Material Iconsは書体自体がスタイルを持つため、Fillの変更を無効にする。

Sourceに任意のSVG・PNGなどの画像URLを指定できる。Sourceを空欄に戻すと保持していたGoogle Fontsの設定を表示する。ImageTypeを継承するIconをButtonのContents配列へ配置した場合も同じ機能を利用できる。

フォントは `public/fonts/google-icons/`、索引は `src/editor/icons/` に配置する。実行時にGoogleのサーバーへ問い合わせず、ローカルで読み込む。

## 配布元

- [Google公式リポジトリ](https://github.com/google/material-design-icons)
- 固定したコミット: `bd8cb85bd4bad964fe6918f79665bb40c3a8efef`
- 取得日: 2026-09-28
- [Material Symbols公式ガイド](https://developers.google.com/fonts/docs/material_symbols)
- [Material Icons公式ガイド](https://developers.google.com/fonts/docs/material_icons)

更新時はフォントとcodepoints索引を同じ公式コミットから取得し、ライセンスを維持する。単体テストが全索引の参照を、Playwrightが全8書体のブラウザ読み込みを確認する。

素材のライセンスはApache License 2.0。[同梱ライセンス](../public/fonts/google-icons/LICENSE.txt)と[配布元情報](../public/fonts/google-icons/NOTICE.txt)を保持する。Editorのテキスト用Share Tech Monoは別素材であり、引き続きSIL OFL 1.1を適用する。
