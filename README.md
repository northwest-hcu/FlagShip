# FlagShip

FlagShipは、Web ApplicationのUI構造、状態、振る舞い、外部API連携を視覚的に設計し、静的Frontendとして出力するVisual UI & Flow Builderである。

> Status: Architecture design / early development

## Overview

FlagShipでは、Applicationを次の独立したModelとして設計する。

- UI — Page、Content／Overlay Surface、Component Instance、Layout、Named Slotを含む画面構造
- Flow — UI Eventから始まるApplication Behavior
- State — Application、Page、ComponentなどScope別の共有Data
- Resources — REST APIを含む外部接続定義
- Export — Browserで動作する静的HTML、CSS、JavaScript

EditorにはSvelte 5、Application UIの境界にはWeb Componentsを採用する。生成ApplicationのRuntime CoreはFrameworkに依存しないTypeScript / JavaScriptとして設計する。

## Documentation

- [Architecture](./docs/architecture/README.md)
  - [Product Overview](./docs/architecture/01-product-overview.md)
  - [Core Principles](./docs/architecture/02-core-principles.md)
  - [Technology and System Architecture](./docs/architecture/03-technology-and-system-architecture.md)
  - [Project Document Model](./docs/architecture/04-project-document-model.md)
  - [UI and Responsive Model](./docs/architecture/05-ui-and-responsive-model.md)
  - [Flow and Execution Model](./docs/architecture/06-flow-and-execution-model.md)
  - [State, Command, and History](./docs/architecture/07-state-command-and-history.md)
  - [Editor, Preview, and Debugging](./docs/architecture/08-editor-preview-and-debugging.md)
  - [Export, Validation, and Integration](./docs/architecture/09-export-validation-and-integration.md)
  - [Examples, Roadmap, and Decisions](./docs/architecture/10-examples-roadmap-and-decisions.md)
- [Implementation TODO](./docs/TODO.md)
- [Component Libraryの作り方](./docs/library-authoring.md)
- [ButtonからModalを開閉するFlowの作り方](./docs/flow-usage.md)

## Repository Layout

```text
FlagShip/
├─ README.md
├─ LICENSE
└─ docs/
   ├─ TODO.md
   └─ architecture/
      ├─ README.md
      └─ 01-...md through 10-...md
```

Repository rootに配置するMarkdownは`README.md`のみとする。Architecture、設計資料、Guideなど、その他のMarkdown Documentは`docs/`以下へ配置する。

## License

This project is licensed under the [MIT License](./LICENSE).
