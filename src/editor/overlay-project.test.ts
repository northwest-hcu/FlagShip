import { describe, expect, it } from "vitest";
import { validateProject } from "../core/validation/validate-project";
import { componentLibraryCatalog } from "../library/component-catalog";
import {
  addComponentToSlot,
  createEditorProject,
  listSelectableComponents,
} from "./editor-project";
import {
  listFlowVariableCandidates,
  stateFieldsForFlowVariable,
} from "./flow-variables";
import {
  placeOverlayOnPage,
  updateOverlaySettings,
} from "./overlay-project";

describe("Overlay Instance project operations", () => {
  // Overlay専用ComponentをContent Rootへ混在させず、Overlay Instanceで
  // Component Instanceを包んでOverlay Root直下へ保存することを確認する。
  it("places an Overlay Instance below the Page Overlay Root", () => {
    const initial = createEditorProject();
    const modal = listSelectableComponents(initial, componentLibraryCatalog)
      .find((selection) => selection.component.name === "Modal")!;
    const placed = placeOverlayOnPage(initial, "ui-page-main", modal);
    const overlay = Object.values(
      placed.project.ui.pages["ui-page-main"].overlayInstances ?? {},
    )[0];

    expect(overlay).toMatchObject({
      surface: "overlay",
      overlayTreeId: "overlay-tree-modal",
      alignment: "center",
      contentBlock: true,
      componentInstance: { id: placed.componentInstanceId },
    });
    expect(
      placed.project.ui.pages["ui-page-main"]
        .componentInstances[placed.componentInstanceId],
    ).toBeUndefined();
    expect(validateProject(placed.project)).toEqual([]);
  });

  // Overlayの9点配置と背景幕はFlow変数へ公開せず、Modalとその子を
  // 通常のComponent Instanceとして扱えることを確認する。
  it("updates Overlay settings and exposes instance variables", () => {
    let project = createEditorProject();
    const selections = listSelectableComponents(project, componentLibraryCatalog);
    const modal = selections.find((selection) => selection.component.name === "Modal")!;
    const button = selections.find((selection) => selection.component.name === "Button")!;
    const placed = placeOverlayOnPage(project, "ui-page-main", modal);
    project = placed.project;
    const overlay = Object.values(
      project.ui.pages["ui-page-main"].overlayInstances ?? {},
    )[0];
    project = addComponentToSlot(
      project,
      "ui-page-main",
      placed.componentInstanceId,
      "content-node-modal",
      "footer",
      button,
    ).project;
    project = updateOverlaySettings(project, "ui-page-main", overlay.id, {
      alignment: "bottom-right",
      contentBlock: false,
    });

    const candidates = listFlowVariableCandidates(project, "ui-page-main");
    expect(project.ui.pages["ui-page-main"].overlayInstances?.[overlay.id])
      .toMatchObject({ alignment: "bottom-right", contentBlock: false });
    expect(candidates.map((candidate) => candidate.name)).toEqual([
      "Modal",
      "Modal / Button",
    ]);
    expect(candidates).toHaveLength(2);
    const modalCandidate = candidates.find((candidate) =>
      candidate.target.componentInstancePath[0] === placed.componentInstanceId)!;
    expect(stateFieldsForFlowVariable({
      id: "flow-variable-modal",
      name: "Modal",
      target: modalCandidate.target,
    }, candidates, "content-node-modal")).toEqual([
      { key: "open", type: "boolean" },
    ]);
    expect(validateProject(project)).toEqual([]);
  });
});
