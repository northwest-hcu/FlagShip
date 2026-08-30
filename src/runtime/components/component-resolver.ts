import type { Component } from "../../core/model/component";
import type { ProjectDocument } from "../../core/model/project";

/** Projectへ配置済みのComponent AssetをIDとVersionから解決する。 */
export function resolveProjectComponent(
  project: ProjectDocument,
  componentId: string,
  componentVersion: string,
): Component | undefined {
  const imported = project.components.importedAssets[componentId]?.component;
  const local = project.components.localLibrary.assets[componentId];
  const component = imported ?? local;

  return component?.version === componentVersion ? component : undefined;
}
