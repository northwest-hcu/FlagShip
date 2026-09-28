import { describe, expect, it } from "vitest";
import { componentBreadcrumbs } from "./component-breadcrumbs";
import { createComponent, createPage, layoutContainer, withField, withSlot, type PageComponent, type WidgetNode } from "./component-model";

describe("component breadcrumb paths", () => {
  it("includes Page, root slot, parents and typed slots with unique keys", () => {
    const button = createComponent("button", 2);
    const container = withSlot(createComponent("container", 1), "children", [button]) as WidgetNode;
    const page = withSlot(createPage(1), "context", [container]);
    const path = componentBreadcrumbs(page, "button-2:text");
    expect(path.map((crumb) => crumb.label)).toEqual([
      "Page Component 01", "Context slot", "Container Component 01", "Children slot", "Button Component 02", "Contents slot", "Text Component",
    ]);
    expect(path.filter((crumb) => crumb.kind === "component").map((crumb) => crumb.id)).toEqual(["page-1", "container-1", "button-2", "button-2:text"]);
    expect(new Set(path.map((crumb) => crumb.key)).size).toBe(path.length);
  });
  it("omits automatic layout groups while keeping real Containers", () => {
    const button = createComponent("button", 2);
    const page = withSlot(createPage(1), "context", [layoutContainer("horizontal", [createComponent("icon", 3), button])]);
    expect(componentBreadcrumbs(page, button.id).map((crumb) => crumb.label)).toEqual(["Page Component 01", "Context slot", "Button Component 02"]);
  });
  it("uses current names and parent slots after a rename and move", () => {
    const text = withField(createComponent("text", 1), "name", "Headline") as WidgetNode;
    const first = withSlot(createPage(1), "context", [text]);
    const moved = withSlot(withSlot(first, "context", []), "overlay", [text]);
    expect(componentBreadcrumbs(first, text.id).map((crumb) => crumb.label)).toEqual(["Page Component 01", "Context slot", "Headline"]);
    expect(componentBreadcrumbs(moved, text.id).map((crumb) => crumb.label)).toEqual(["Page Component 01", "Overlay slot", "Headline"]);
  });
  it("returns just the Page when selected, and no path for a missing component", () => {
    const page: PageComponent = createPage(1);
    expect(componentBreadcrumbs(page, page.id).map((crumb) => crumb.label)).toEqual(["Page Component 01"]);
    expect(componentBreadcrumbs(page, "missing")).toEqual([]);
  });
});
