import type { NavItem } from "@/lib/admin/navigation";

/**
 * Retire les entrées dont le href n’est pas dans `allowed` (ni aucun descendant autorisé).
 * Aligné sur la logique « une ligne du blob = un href exact » côté `hasSectionAccess`.
 */
export function filterNavTreeByAllowedHrefs(items: NavItem[], allowed: Set<string>): NavItem[] {
  return items
    .map((node) => filterNavNode(node, allowed))
    .filter((node): node is NavItem => node !== null);
}

function filterNavNode(node: NavItem, allowed: Set<string>): NavItem | null {
  const mapped =
    node.children?.map((child) => filterNavNode(child, allowed)).filter((c): c is NavItem => c !== null) ?? [];
  const children = mapped.length > 0 ? mapped : undefined;
  const selfOk = allowed.has(node.href);
  if (children) {
    return { ...node, children };
  }
  if (selfOk) {
    return { ...node, children: undefined };
  }
  return null;
}
