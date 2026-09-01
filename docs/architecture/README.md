# Architecture Index

> Status: Draft / Architecture Baseline
>
> Project: [FlagShip README](../../README.md)

## 1. Document Map

Architecture本文は、次の10個のDomain別ファイルで構成する。章番号は全ファイルを通して既存の`1`〜`22`を維持する。

- [01 Product Overview](./01-product-overview.md) — Sections 1–2
  - 1.1–1.2 Purpose / Representative Application、2.1–2.14 Product Concept
- [02 Core Principles](./02-core-principles.md) — Section 3
  - 3.1–3.39 Source of Truth、Component Ownership、Mutation、Normalization
- [03 Technology and System Architecture](./03-technology-and-system-architecture.md) — Sections 4–5
  - 4.1–4.10 Technology Selection、5.1–5.14 System Architecture
- [04 Project Document Model](./04-project-document-model.md) — Section 6
  - 6.1–6.32 UI Page、Component Instance、Flow Graph、Reference、Migration
- [05 UI and Responsive Model](./05-ui-and-responsive-model.md) — Sections 7, 9
  - 7.1–7.14 Component Instance / Overlay Placement / UI Node、9.1–9.4 Responsive Layout
- [06 Flow and Execution Model](./06-flow-and-execution-model.md) — Sections 8, 15
  - 8.1–8.78 Flow Graph / Execution、15.1–15.3 Type / Error / Cancellation
- [07 State, Command, and History](./07-state-command-and-history.md) — Sections 10–11
  - 10.1–10.4 State、11.1–11.3 Command / Transaction / History
- [08 Editor, Preview, and Debugging](./08-editor-preview-and-debugging.md) — Sections 12, 17
  - 12.1–12.5 Editor、17.1–17.3 Preview / Debugging
- [09 Export, Validation, and Integration](./09-export-validation-and-integration.md) — Sections 13–14, 16, 18
  - 13.1–13.6 Export、14.1–14.4 Validation、16.1–16.5 Integration、18 Naming
- [10 Examples, Roadmap, and Decisions](./10-examples-roadmap-and-decisions.md) — Sections 19–22
  - 19.1–19.5 Example、20.1–20.3 Roadmap、21 Decision Index、22 Summary

## 2. Concept Relationships

```mermaid
flowchart TD
    Product["01 Product Overview"] --> Principles["02 Core Principles"]
    Principles --> System["03 Technology and System Architecture"]
    Principles --> Project["04 Project Document Model"]
    Project --> UI["05 UI and Responsive Model"]
    Project --> Flow["06 Flow and Execution Model"]
    Project --> State["07 State, Command, and History"]
    System --> Editor["08 Editor, Preview, and Debugging"]
    UI --> Editor
    Flow --> Editor
    State --> Editor
    Editor --> Export["09 Export, Validation, and Integration"]
    Export --> Delivery["10 Examples, Roadmap, and Decisions"]
```

## 3. Reading Paths

### 3.1 Product and UX

[01 Product Overview](./01-product-overview.md) → [02 Core Principles](./02-core-principles.md) → [05 UI and Responsive Model](./05-ui-and-responsive-model.md)

### 3.2 Canonical Data Model and Runtime

[02 Core Principles](./02-core-principles.md) → [04 Project Document Model](./04-project-document-model.md) → [05 UI Model](./05-ui-and-responsive-model.md) → [06 Flow Model](./06-flow-and-execution-model.md) → [07 State Model](./07-state-command-and-history.md)

### 3.3 Editor and Export Implementation

[03 System Architecture](./03-technology-and-system-architecture.md) → [08 Editor and Debugging](./08-editor-preview-and-debugging.md) → [09 Export and Validation](./09-export-validation-and-integration.md)

### 3.4 Planning and Architecture Decisions

[10 Examples, Roadmap, and Decisions](./10-examples-roadmap-and-decisions.md)

## 4. Navigation and Maintenance

- 各本文ファイルの冒頭と末尾に、Index・前ファイル・次ファイルへのNavigationを置く。
- 見出しは`Section.Subsection`形式を維持し、ファイル分割後も章番号を再採番しない。
- 概念の定義はOwnerとなる1ファイルに置き、他ファイルからは相対リンクで参照する。
- Mermaid図とSchema例は、その概念のCanonical Definitionを持つファイルに置く。
