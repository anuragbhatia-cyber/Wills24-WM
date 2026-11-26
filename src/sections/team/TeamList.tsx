import { useState } from 'react'
import data from '@/../product/sections/team/data.json'
import { TeamList } from './components/TeamList'
import { buildViewer } from '@/lib/preview-viewer'
import { toast } from '@/components/ui/toaster'
import type { ModuleAccess, SharedPackage, TeamMember } from '@/../product/sections/team/types'

/**
 * Preview wrapper for Design OS.
 * Always shown as the admin wealth manager: team members have no Team page.
 */
export default function TeamListPreview() {
  const [members, setMembers] = useState<TeamMember[]>(data.members as TeamMember[])
  const viewer = buildViewer('admin-wm')

  return (
    <TeamList
      viewer={viewer}
      members={members}
      parentAccess={data.parentAccess as ModuleAccess}
      sharedPackage={data.sharedPackage as SharedPackage}
      creditUsage={data.creditUsage}
      onAddMember={(input) => {
        const next = members.length + 1
        setMembers((prev) => [
          ...prev,
          {
            id: `WM-NEW-${next}`,
            code: `${data.adminWealthManager.code}-S${String(next).padStart(2, '0')}`,
            name: input.name,
            email: input.email,
            phone: input.phone,
            designation: input.designation,
            status: 'active',
            customers: 0,
            activeCases: 0,
            leads: 0,
            willsUsed: 0,
            access: input.access,
            documentsAccess: false,
            createdAt: new Date().toISOString(),
            lastLoginAt: null,
          },
        ])
        toast.success(
          'Team member added',
          input.password ? `${input.name} can log in now` : `Set-password link sent to ${input.email}`,
        )
      }}
      onEditMember={(id, input) => {
        setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, ...input } : m)))
        toast.success('Changes saved', input.name)
      }}
      onResetPassword={(id) => {
        const m = members.find((x) => x.id === id)
        toast.success('Password reset', `Set-password link sent to ${m?.email}`)
      }}
      onToggleStatus={(id) => {
        const m = members.find((x) => x.id === id)
        setMembers((prev) =>
          prev.map((x) => (x.id === id ? { ...x, status: x.status === 'active' ? 'inactive' : 'active' } : x)),
        )
        toast.success(m?.status === 'active' ? 'Team member deactivated' : 'Team member activated', m?.name)
      }}
    />
  )
}
