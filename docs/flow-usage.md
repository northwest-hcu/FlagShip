# Flowの使い方

通常のFlow追加操作から、ButtonのclickでModalを開閉する手順を示す。Modal専用のFlow作成機能は使用しない。

## 1. ButtonとModalを配置する

1. Libraryの`Button`をContent SurfaceへDrag and Dropする。
2. Libraryの`Modal`をOverlay SurfaceへDrag and Dropする。
3. Layersの`Overlay Surface > Modal`を展開する。
4. Libraryの`Button`をModalの`Footer` Named SlotへDrag and Dropする。

Content側のButtonを開くButton、Modal Footer内のButtonを閉じるButtonとして使用する。必要ならInspectorで各Buttonの`label`を変更する。

## 2. Flow変数を登録する

Flow欄の`+ Flow`を押す。作成したFlowの`Variables`で次のInstanceを1つずつ追加する。

- Content SurfaceのButton: `component-instance`
- Overlay SurfaceのModal: `overlay-instance`
- Modal Footer内のButton: `component-instance`

変数はPage上の実体を指す。LibraryのComponent DefinitionやDOM Selectorは指さない。

## 3. Modalを開くFlowを作る

1. `trigger.ui-event` Nodeを追加する。
2. `Component variable`にContent SurfaceのButtonを指定する。
3. `UI node`にButton Nodeを指定する。
4. `overlay.action` Nodeを追加する。
5. `Overlay variable`にModalを指定する。
6. `Action`に`activate`を指定する。

```mermaid
flowchart TD
    Click["trigger.ui-event<br/>Open Button / click"] --> Open["overlay.action<br/>Modal / activate"]
```

## 4. Modalを閉じるFlowを作る

別のFlowを追加し、同じ手順で次を指定する。

- `trigger.ui-event`: Modal Footer内のButton変数、Button Node、`click`
- `overlay.action`: 同じModal変数、`deactivate`

```mermaid
flowchart TD
    Click["trigger.ui-event<br/>Close Button / click"] --> Close["overlay.action<br/>Modal / deactivate"]
```

## 5. Overlayを設定する

LayersでModalを選択し、Inspectorの`Overlay`で次を設定できる。

- `Position`: 左上・上中央・右上・左中央・中央・右中央・左下・下中央・右下
- `Content block`: 有効時は灰色の背景幕を表示し、背面Contentの操作を遮る

## 6. Previewで確認する

1. Headerの`プレビュー`を押す。
2. Content SurfaceのButtonを押し、Modalが表示されることを確認する。
3. Modal Footer内のButtonを押し、Modalが非表示になることを確認する。

`trigger.ui-event`を持つFlowはPreview上のEventから実行する。Flow欄の実行Buttonは使用しない。
