/**
 * Preview-only "signed in as" switch for the wealth manager team feature.
 * Lets every screen design be viewed as the admin wealth manager or as a
 * team member (sub wealth manager). Stored in localStorage so it survives
 * screen-to-screen navigation and syncs between the Design OS page and the
 * preview iframe. Not part of the exported product.
 */
import { useEffect, useState } from 'react'
import teamData from '@/../product/sections/team/data.json'
import type { TeamRole, TeamViewer } from '@/../product/sections/team/types'

const STORAGE_KEY = 'wm-preview-viewer'
const CHANGE_EVENT = 'wm-preview-viewer-change'

export function getPreviewRole(): TeamRole {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'sub-wm' ? 'sub-wm' : 'admin-wm'
  } catch {
    return 'admin-wm'
  }
}

export function setPreviewRole(role: TeamRole) {
  try {
    localStorage.setItem(STORAGE_KEY, role)
  } catch {
    // ignore: preview falls back to admin-wm
  }
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

export function buildViewer(role: TeamRole): TeamViewer {
  const admin = teamData.adminWealthManager
  const teamMembers = teamData.members.map((m) => ({
    id: m.id,
    name: m.name,
    status: m.status as 'active' | 'inactive',
  }))

  if (role === 'sub-wm') {
    const me = teamData.members.find((m) => m.id === teamData.subViewerId)!
    return {
      role,
      wealthManagerId: me.id,
      name: me.name,
      parentId: admin.id,
      parentName: admin.name,
      companyName: admin.companyName,
      teamMembers: [],
    }
  }

  return {
    role,
    wealthManagerId: admin.id,
    name: admin.name,
    parentId: admin.id,
    parentName: admin.name,
    companyName: admin.companyName,
    teamMembers,
  }
}

/** Current preview viewer; re-renders when the role is switched anywhere */
export function usePreviewViewer(): TeamViewer {
  const [role, setRole] = useState<TeamRole>(getPreviewRole)

  useEffect(() => {
    const sync = () => setRole(getPreviewRole())
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) sync()
    }
    window.addEventListener(CHANGE_EVENT, sync)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  return buildViewer(role)
}
