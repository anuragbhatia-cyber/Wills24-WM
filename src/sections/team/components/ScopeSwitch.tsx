import { ChevronDown, Users } from 'lucide-react'
import type { TeamScope, TeamViewer } from '@/../product/sections/team/types'

interface ScopeSwitchProps {
  viewer?: TeamViewer
  value: TeamScope
  onChange: (scope: TeamScope) => void
}

/**
 * Team / Mine / one team member switch for the admin wealth manager.
 * Renders nothing for a sub wealth manager, who only ever sees their own records.
 */
export function ScopeSwitch({ viewer, value, onChange }: ScopeSwitchProps) {
  if (!viewer || viewer.role !== 'admin-wm') return null

  const memberSelected = value !== 'team' && value !== 'mine'

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 rounded-lg bg-neutral-200/50 p-1 dark:bg-neutral-800">
        {(['team', 'mine'] as const).map((key) => {
          const isActive = value === key
          return (
            <button
              key={key}
              onClick={() => onChange(key)}
              className={`cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-white text-yellow-600 shadow-sm dark:bg-neutral-700 dark:text-yellow-400'
                  : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300'
              }`}
            >
              {key === 'team' ? 'Team' : 'Mine'}
            </button>
          )
        })}
      </div>
      <div className="relative">
        <Users size={12} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
        <select
          value={memberSelected ? value : ''}
          onChange={(e) => onChange(e.target.value || 'team')}
          aria-label="Show one team member"
          className={`h-[34px] cursor-pointer appearance-none rounded-lg border pl-7 pr-7 text-xs font-medium outline-none transition-colors focus:border-yellow-300 ${
            memberSelected
              ? 'border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-300'
              : 'border-neutral-200 bg-white text-neutral-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
          }`}
        >
          <option value="">Team member…</option>
          {viewer.teamMembers.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}{m.status === 'inactive' ? ' (inactive)' : ''}
            </option>
          ))}
        </select>
        <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400" />
      </div>
    </div>
  )
}

interface AddedByProps {
  ownerId: string
  ownerName: string
  viewer?: TeamViewer
}

/** Compact "Added by" cell: avatar initial plus name, or "You" */
export function AddedBy({ ownerId, ownerName, viewer }: AddedByProps) {
  const isSelf = viewer?.wealthManagerId === ownerId
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5">
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${
          isSelf
            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300'
            : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300'
        }`}
      >
        {ownerName.charAt(0).toUpperCase()}
      </span>
      <span className={`truncate text-xs ${isSelf ? 'font-semibold text-neutral-800 dark:text-neutral-100' : 'text-neutral-600 dark:text-neutral-300'}`}>
        {isSelf ? 'You' : ownerName}
      </span>
    </span>
  )
}

interface OwnerLineProps {
  ownerId: string
  ownerName: string
  viewer?: TeamViewer
}

/**
 * Owner block for detail pages: who owns the record and which admin
 * wealth manager they sit under. Renders nothing without a viewer.
 */
export function OwnerLine({ ownerId, ownerName, viewer }: OwnerLineProps) {
  if (!viewer) return null
  const isSelf = ownerId === viewer.wealthManagerId
  const ownerIsAdmin = ownerId === viewer.parentId
  return (
    <div className="rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2.5 text-xs dark:border-neutral-800 dark:bg-neutral-800/50">
      <p className="text-neutral-500 dark:text-neutral-400">
        Owner{' '}
        <span className="font-semibold text-neutral-800 dark:text-neutral-100">{isSelf ? 'You' : ownerName}</span>
        <span className="ml-1.5 inline-flex rounded-full bg-white px-1.5 py-px text-[10px] font-medium text-neutral-500 ring-1 ring-neutral-200 dark:bg-neutral-900 dark:text-neutral-400 dark:ring-neutral-700">
          {ownerIsAdmin ? 'Admin wealth manager' : 'Team member'}
        </span>
      </p>
      <p className="mt-1 text-neutral-500 dark:text-neutral-400">
        Part of {viewer.companyName}
        {!ownerIsAdmin && (
          <>
            {' '}· under{' '}
            <span className="font-medium text-neutral-700 dark:text-neutral-300">
              {viewer.parentId === viewer.wealthManagerId ? 'you' : viewer.parentName}
            </span>
          </>
        )}
      </p>
    </div>
  )
}
