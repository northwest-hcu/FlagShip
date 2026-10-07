import { COMPONENT_CATALOG } from "./component-model";

export type RegistryComponent = (typeof COMPONENT_CATALOG)[number];
export type RegistryEntry = RegistryComponent & { readonly libraryId: string };
export const COMPONENT_LIBRARIES = [{ id: "default", name: "デフォルトライブラリ" }] as const;
export const COMPONENT_REGISTRY: readonly RegistryEntry[] = COMPONENT_CATALOG.map((component) => ({ ...component, libraryId: "default" }));

export interface RegistryFilters { query: string; libraryId: string }

export function libraryName(libraryId: string): string {
  return COMPONENT_LIBRARIES.find((library) => library.id === libraryId)?.name ?? libraryId;
}

export function filterRegistry({ query, libraryId }: RegistryFilters, entries: readonly RegistryEntry[] = COMPONENT_REGISTRY): RegistryEntry[] {
  const term = query.trim().normalize("NFKC").toLowerCase();
  return entries.filter((entry) => (!libraryId || entry.libraryId === libraryId)
    && (!term || `${entry.title} ${entry.label}`.normalize("NFKC").toLowerCase().includes(term)));
}
