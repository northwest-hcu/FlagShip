import { expect, test } from "vitest";
import { COMPONENT_CATALOG } from "./component-model";
import { filterRegistry, type RegistryEntry } from "./component-registry";

test("combines name search with a library filter across flat registry entries", () => {
  const entries: RegistryEntry[] = [
    { ...COMPONENT_CATALOG[0], libraryId: "default" },
    { ...COMPONENT_CATALOG.find((component) => component.kind === "text")!, libraryId: "default" },
    { ...COMPONENT_CATALOG[0], libraryId: "other" },
    { ...COMPONENT_CATALOG.find((component) => component.kind === "text")!, libraryId: "other" },
  ];

  expect(filterRegistry({ query: " TeXt ", libraryId: "other" }, entries).map((entry) => entry.libraryId + ":" + entry.kind)).toEqual(["other:text"]);
  expect(filterRegistry({ query: "ボタン", libraryId: "" }, entries).map((entry) => entry.libraryId)).toEqual(["default", "other"]);
});
