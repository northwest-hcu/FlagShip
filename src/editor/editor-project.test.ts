import { describe, expect, it } from "vitest";
import { resolveComponentInstancePath } from "../core/references";
import { validateProject } from "../core/validation/validate-project";
import { componentLibraryCatalog } from "../library/component-catalog";
import { resolveProjectComponent } from "../runtime/components/component-resolver";
import {
  addComponentToSlot,
  createEditorProject,
  findPageComponentInstance,
  listSelectableComponents,
  movePageComponent,
  placeComponentOnPage,
  removePageComponent,
  removeSlotComponent,
  updateComponentInstanceState,
} from "./editor-project";

describe("editor project", () => {
  // Base、Public、Localを同じ操作でPageへ配置し、外部Componentだけが
  // Imported SnapshotとしてProjectへ取り込まれることを確認する。
  it("places selectable library components on the page", () => {
    let project = createEditorProject();
    const selections = listSelectableComponents(
      project,
      componentLibraryCatalog,
    );
    const base = selections.find(
      (selection) => selection.component.id === "component-base-text",
    )!;
    const publicComponent = selections.find(
      (selection) => selection.component.id === "component-public-notice",
    )!;
    const local = selections.find(
      (selection) => selection.component.id === "component-local-text",
    )!;

    for (const selection of [base, publicComponent, local]) {
      project = placeComponentOnPage(
        project,
        "ui-page-main",
        selection,
      ).project;
    }

    expect(
      Object.values(
        project.ui.pages["ui-page-main"].componentInstances,
      ).map((instance) => instance.componentId),
    ).toEqual([
      "component-base-text",
      "component-public-notice",
      "component-local-text",
    ]);
    expect(
      project.components.importedAssets["component-base-text"].source.kind,
    ).toBe("base");
    expect(
      project.components.importedAssets["component-public-notice"].source.kind,
    ).toBe("public");
    expect(
      project.components.importedAssets["component-local-text"],
    ).toBeUndefined();
    expect(
      project.components.importedAssets["component-base-text"].component,
    ).not.toBe(base.component);
    expect(validateProject(project)).toEqual([]);

    const initialOrder = Object.keys(
      project.ui.pages["ui-page-main"].componentInstances,
    );
    project = movePageComponent(
      project,
      "ui-page-main",
      initialOrder[0],
      initialOrder.length,
    );
    expect(
      Object.values(
        project.ui.pages["ui-page-main"].componentInstances,
      ).map((instance) => instance.componentId),
    ).toEqual([
      "component-public-notice",
      "component-local-text",
      "component-base-text",
    ]);

    project = removePageComponent(
      project,
      "ui-page-main",
      initialOrder[1],
    );
    expect(
      Object.values(
        project.ui.pages["ui-page-main"].componentInstances,
      ).map((instance) => instance.componentId),
    ).toEqual([
      "component-local-text",
      "component-base-text",
    ]);
    expect(validateProject(project)).toEqual([]);
  });

  // ResolverがProjectへ固定したVersionだけを返し、Libraryの別Versionへ
  // 暗黙に差し替えないことを確認する。
  it("resolves only the component version pinned by the instance", () => {
    const initialProject = createEditorProject();
    const base = listSelectableComponents(
      initialProject,
      componentLibraryCatalog,
    ).find(
      (selection) => selection.component.id === "component-base-text",
    )!;
    const project = placeComponentOnPage(
      initialProject,
      "ui-page-main",
      base,
    ).project;

    expect(
      resolveProjectComponent(project, "component-base-text", "1.0.0")?.name,
    ).toBe("Text");
    expect(
      resolveProjectComponent(project, "component-base-text", "2.0.0"),
    ).toBeUndefined();
  });

  // FlagShip Baseの必須Componentを選択でき、Card InstanceのNamed Slotと
  // 子Text InstanceのStateをProject内だけで編集できることを確認する。
  it("edits instance state and named slot children", () => {
    let project = createEditorProject();
    const selections = listSelectableComponents(
      project,
      componentLibraryCatalog,
    );
    const baseNames = selections
      .filter((selection) => selection.libraryName === "FlagShip Base")
      .map((selection) => selection.component.name);
    expect(baseNames).toEqual(expect.arrayContaining([
      "Text",
      "Input",
      "Modal",
      "Icon",
      "Button",
      "Image",
      "Card",
    ]));

    const card = selections.find(
      (selection) => selection.component.name === "Card",
    )!;
    const text = selections.find(
      (selection) => selection.component.name === "Text",
    )!;
    const placedCard = placeComponentOnPage(
      project,
      "ui-page-main",
      card,
    );
    project = placedCard.project;
    expect(() => addComponentToSlot(
      project,
      "ui-page-main",
      placedCard.componentInstanceId,
      "content-node-card",
      "default",
      text,
    )).toThrow("A named Slot ID is required.");
    const addedText = addComponentToSlot(
      project,
      "ui-page-main",
      placedCard.componentInstanceId,
      "content-node-card",
      "header",
      text,
    );
    project = addedText.project;
    project = updateComponentInstanceState(
      project,
      "ui-page-main",
      addedText.componentInstanceId,
      "content-node-text",
      { text: "編集した見出し" },
    );

    const cardInstance = findPageComponentInstance(
      project,
      "ui-page-main",
      placedCard.componentInstanceId,
    )!;
    const textInstance = findPageComponentInstance(
      project,
      "ui-page-main",
      addedText.componentInstanceId,
    )!;
    expect(cardInstance.children?.[0].slotId).toBe("header");
    expect(textInstance.state?.["content-node-text"]).toEqual({
      text: "編集した見出し",
    });
    expect(resolveComponentInstancePath(
      project,
      "ui-page-main",
      [placedCard.componentInstanceId, addedText.componentInstanceId],
    )?.instance.id).toBe(addedText.componentInstanceId);
    expect(validateProject(project)).toEqual([]);

    project = removeSlotComponent(
      project,
      "ui-page-main",
      placedCard.componentInstanceId,
      addedText.componentInstanceId,
    );
    expect(findPageComponentInstance(
      project,
      "ui-page-main",
      addedText.componentInstanceId,
    )).toBeUndefined();
  });
});
