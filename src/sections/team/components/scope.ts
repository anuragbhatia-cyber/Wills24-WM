import type { TeamScope, TeamViewer } from '@/../product/sections/team/types'

/**
 * Whether a record owned by `ownerId` is visible to the viewer under `scope`.
 * Mirrors the server rule: a sub wealth manager sees only their own records,
 * an admin wealth manager sees their own plus every team member's.
 * The real filter must run server-side; this keeps screen designs honest.
 */
export function isInScope(ownerId: string, viewer: TeamViewer | undefined, scope: TeamScope): boolean {
  if (!viewer) return true
  if (viewer.role === 'sub-wm') return ownerId === viewer.wealthManagerId
  if (scope === 'mine') return ownerId === viewer.wealthManagerId
  if (scope === 'team') {
    return ownerId === viewer.wealthManagerId || viewer.teamMembers.some((m) => m.id === ownerId)
  }
  return ownerId === scope
}

export function filterByScope<T>(
  items: T[],
  getOwnerId: (item: T) => string,
  viewer: TeamViewer | undefined,
  scope: TeamScope,
): T[] {
  if (!viewer) return items
  return items.filter((item) => isInScope(getOwnerId(item), viewer, scope))
}

/** "You" for the viewer's own records, otherwise the owner's name */
export function ownerLabel(ownerId: string, ownerName: string, viewer: TeamViewer | undefined): string {
  return viewer && ownerId === viewer.wealthManagerId ? 'You' : ownerName
}

export function isAdminWM(viewer: TeamViewer | undefined): boolean {
  return viewer?.role === 'admin-wm'
}

/** Owners an admin wealth manager can pick or filter by: themselves first, then the team */
export function ownerOptions(viewer: TeamViewer | undefined) {
  if (!viewer || viewer.role !== 'admin-wm') return []
  return [
    { id: viewer.wealthManagerId, name: `${viewer.name} (you)`, status: 'active' as const },
    ...viewer.teamMembers,
  ]
}
