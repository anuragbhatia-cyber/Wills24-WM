// =============================================================================
// Data Types
// =============================================================================

/** Who is signed in to the wealth manager dashboard */
export type TeamRole = 'admin-wm' | 'sub-wm'

/** Access level a team member holds in one module */
export type ModuleAccessLevel = 'none' | 'view' | 'comment' | 'edit'

/** Modules the admin wealth manager can grant to a team member */
export type TeamModule = 'leads' | 'customers' | 'cases'

export type ModuleAccess = Record<TeamModule, ModuleAccessLevel>

export type TeamMemberStatus = 'active' | 'inactive'

/**
 * Which records a list shows for an admin wealth manager:
 * their own, the whole team, or one named team member (by wealth manager ID).
 */
export type TeamScope = 'mine' | 'team' | string

// ---------------------------------------------------------------------------
// Team member (sub wealth manager)
// ---------------------------------------------------------------------------

export interface TeamMember {
  /** Wealth manager ID, used as the owner on customers, leads and cases */
  id: string
  /** Display ID derived from the parent, e.g. PAT-00020-S01 */
  code: string
  name: string
  email: string
  phone: string
  designation: string
  status: TeamMemberStatus
  customers: number
  activeCases: number
  leads: number
  willsUsed: number
  access: ModuleAccess
  /** Granted only by Wills24 admin; read-only for the admin wealth manager */
  documentsAccess: boolean
  createdAt: string
  lastLoginAt: string | null
}

/** Minimal owner reference for pickers, filters and Added by labels */
export interface TeamOwner {
  id: string
  name: string
  status?: TeamMemberStatus
}

// ---------------------------------------------------------------------------
// Signed-in viewer
// ---------------------------------------------------------------------------

export interface TeamViewer {
  role: TeamRole
  /** The signed-in wealth manager's own ID */
  wealthManagerId: string
  name: string
  /** The admin wealth manager (self when role is admin-wm) */
  parentId: string
  parentName: string
  companyName: string
  /** Team members under the admin wealth manager; empty for a sub wealth manager */
  teamMembers: TeamOwner[]
}

// ---------------------------------------------------------------------------
// Shared package and credits
// ---------------------------------------------------------------------------

export interface SharedPackage {
  name: string
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum'
  willsIncluded: number
  willsUsed: number
  validUntil: string
}

export interface CreditUsage {
  id: string
  /** Wealth manager ID of whoever spent the credit */
  usedById: string
  usedByName: string
  customerName: string
  usedAt: string
}

// =============================================================================
// Component Props
// =============================================================================

export interface TeamMemberInput {
  name: string
  email: string
  phone: string
  designation: string
  /** Typed password, or null when a set-password link is emailed instead */
  password: string | null
  access: ModuleAccess
}

export interface TeamListProps {
  /** The signed-in admin wealth manager */
  viewer: TeamViewer
  /** Sub wealth managers under the admin wealth manager */
  members: TeamMember[]
  /** The admin wealth manager's own module access; a team member can never exceed it */
  parentAccess: ModuleAccess
  /** Package and credits shared by the whole team */
  sharedPackage: SharedPackage
  /** Every will credit spent, with who spent it */
  creditUsage: CreditUsage[]
  /** Called when a team member is added */
  onAddMember?: (input: TeamMemberInput) => void
  /** Called when a team member's details or access change */
  onEditMember?: (id: string, input: Omit<TeamMemberInput, 'password'>) => void
  /** Called to email a set-password link; the old password stops working at once */
  onResetPassword?: (id: string) => void
  /** Called to deactivate or reactivate a team member. There is no delete. */
  onToggleStatus?: (id: string) => void
}
