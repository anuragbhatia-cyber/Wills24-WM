import { useMemo, useState } from 'react'
import { useDebounce } from '@/lib/use-debounce'
import { formatDate, timeAgo } from '@/lib/format'
import {
  Search,
  Plus,
  MoreVertical,
  Pencil,
  KeyRound,
  UserX,
  UserCheck,
  Users,
  Wallet,
  Mail,
  Phone,
  Eye,
  EyeOff,
  Lock,
  FileText,
  Send,
  X,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import type {
  ModuleAccess,
  ModuleAccessLevel,
  TeamListProps,
  TeamMember,
  TeamModule,
} from '@/../product/sections/team/types'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LEVELS: ModuleAccessLevel[] = ['none', 'view', 'comment', 'edit']

const LEVEL_LABEL: Record<ModuleAccessLevel, string> = {
  none: 'None',
  view: 'View',
  comment: 'Comment',
  edit: 'Edit',
}

const LEVEL_HINT: Record<ModuleAccessLevel, string> = {
  none: 'Hidden from their sidebar',
  view: 'See their own records only',
  comment: 'View, plus notes and follow-ups',
  edit: 'Comment, plus add and change their own records',
}

const LEVEL_PILL: Record<ModuleAccessLevel, string> = {
  none: 'bg-neutral-100 text-neutral-400 line-through dark:bg-neutral-800 dark:text-neutral-500',
  view: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300',
  comment: 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300',
  edit: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
}

const MODULES: { key: TeamModule; label: string; short: string }[] = [
  { key: 'leads', label: 'Leads (CRM)', short: 'Leads' },
  { key: 'customers', label: 'Customers', short: 'Cust.' },
  { key: 'cases', label: 'Cases', short: 'Cases' },
]

const SEGMENT_COLORS = ['bg-yellow-500', 'bg-sky-500', 'bg-violet-500', 'bg-emerald-500', 'bg-rose-500', 'bg-neutral-400']

type StatusTab = 'all' | 'active' | 'inactive'

function levelRank(level: ModuleAccessLevel) {
  return LEVELS.indexOf(level)
}

/** Never more than the parent has for that module */
function capAccess(access: ModuleAccess, parent: ModuleAccess): ModuleAccess {
  const capped = { ...access }
  for (const m of MODULES) {
    if (levelRank(capped[m.key]) > levelRank(parent[m.key])) capped[m.key] = parent[m.key]
  }
  return capped
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const inputClass =
  'w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500'

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TeamList({
  viewer,
  members,
  parentAccess,
  sharedPackage,
  creditUsage,
  onAddMember,
  onEditMember,
  onResetPassword,
  onToggleStatus,
}: TeamListProps) {
  const [tab, setTab] = useState<StatusTab>('all')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 250)
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  // Form dialog (add or edit)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<TeamMember | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [designation, setDesignation] = useState('')
  const [passwordMode, setPasswordMode] = useState<'link' | 'typed'>('link')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [access, setAccess] = useState<ModuleAccess>({ leads: 'edit', customers: 'edit', cases: 'view' })
  const [submitted, setSubmitted] = useState(false)

  // Confirm dialogs
  const [resetTarget, setResetTarget] = useState<TeamMember | null>(null)
  const [statusTarget, setStatusTarget] = useState<TeamMember | null>(null)

  const counts = useMemo(
    () => ({
      all: members.length,
      active: members.filter((m) => m.status === 'active').length,
      inactive: members.filter((m) => m.status === 'inactive').length,
    }),
    [members],
  )

  const filtered = useMemo(() => {
    let list = members
    if (tab !== 'all') list = list.filter((m) => m.status === tab)
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase()
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q) ||
          m.code.toLowerCase().includes(q) ||
          m.designation.toLowerCase().includes(q) ||
          m.phone.includes(q),
      )
    }
    return list
  }, [members, tab, debouncedSearch])

  // Shared credits, split per person
  const willsLeft = Math.max(0, sharedPackage.willsIncluded - sharedPackage.willsUsed)
  const usageByPerson = useMemo(() => {
    const totals = new Map<string, { name: string; count: number }>()
    for (const u of creditUsage) {
      const entry = totals.get(u.usedById) ?? { name: u.usedById === viewer.wealthManagerId ? 'You' : u.usedByName, count: 0 }
      entry.count += 1
      totals.set(u.usedById, entry)
    }
    return Array.from(totals.entries())
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.count - a.count)
  }, [creditUsage, viewer.wealthManagerId])

  const teamCustomers = members.reduce((sum, m) => sum + m.customers, 0)

  // --- Form helpers ---------------------------------------------------------

  const emailTaken =
    email.trim() !== '' &&
    members.some((m) => m.email.toLowerCase() === email.trim().toLowerCase() && m.id !== editing?.id)
  const formValid =
    name.trim() !== '' &&
    /^\S+@\S+\.\S+$/.test(email.trim()) &&
    !emailTaken &&
    phone.trim() !== '' &&
    (editing || passwordMode === 'link' || password.length >= 6)

  function openAdd() {
    setEditing(null)
    setName('')
    setEmail('')
    setPhone('')
    setDesignation('')
    setPasswordMode('link')
    setPassword('')
    setShowPassword(false)
    setAccess(capAccess({ leads: 'edit', customers: 'edit', cases: 'view' }, parentAccess))
    setSubmitted(false)
    setFormOpen(true)
  }

  function openEdit(member: TeamMember) {
    setEditing(member)
    setName(member.name)
    setEmail(member.email)
    setPhone(member.phone)
    setDesignation(member.designation)
    setAccess(capAccess(member.access, parentAccess))
    setSubmitted(false)
    setFormOpen(true)
  }

  function handleSubmit() {
    setSubmitted(true)
    if (!formValid) return
    const details = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      designation: designation.trim(),
      access: capAccess(access, parentAccess),
    }
    if (editing) onEditMember?.(editing.id, details)
    else onAddMember?.({ ...details, password: passwordMode === 'typed' ? password : null })
    setFormOpen(false)
  }

  // --- Render ---------------------------------------------------------------

  return (
    <div className="space-y-6 pb-8">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">Team</h1>
        <button
          onClick={openAdd}
          className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 self-start rounded-lg bg-yellow-500 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-yellow-600"
        >
          <Plus size={13} />
          Add Team Member
        </button>
      </div>

      {/* ── Summary ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SummaryCard
          icon={<Users size={16} />}
          label="Team members"
          value={`${counts.active}`}
        />
        <SummaryCard
          icon={<UserCheck size={16} />}
          label="Team customers"
          value={`${teamCustomers}`}
        />

        {/* Shared credits */}
        <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">
              <Wallet size={16} className="text-yellow-500" />
              Shared will credits
            </div>
            <span className="rounded-full bg-yellow-50 px-2 py-0.5 text-[10px] font-semibold text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-300">
              {sharedPackage.tier}
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums text-neutral-900 dark:text-neutral-100">
            {willsLeft}
            <span className="ml-1 text-sm font-medium text-neutral-400">of {sharedPackage.willsIncluded} left</span>
          </p>
          <div className="mt-3 flex h-2 rounded-full bg-neutral-100 dark:bg-neutral-800" role="img" aria-label={`${sharedPackage.willsUsed} of ${sharedPackage.willsIncluded} wills used`}>
            {usageByPerson.map((p, i) => (
              <div
                key={p.id}
                className="group relative h-full first:rounded-l-full last:rounded-r-full"
                style={{ width: `${(p.count / sharedPackage.willsIncluded) * 100}%` }}
              >
                <div className={`h-full w-full rounded-[inherit] transition-opacity group-hover:opacity-80 ${SEGMENT_COLORS[i % SEGMENT_COLORS.length]}`} />
                {/* Tooltip */}
                <div className={`pointer-events-none absolute bottom-full z-20 mb-2 whitespace-nowrap ${
                  i === 0 ? 'left-0' : i === usageByPerson.length - 1 ? 'right-0' : 'left-1/2 -translate-x-1/2'
                } rounded-md bg-neutral-900 px-2 py-1 text-[11px] text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:bg-neutral-100 dark:text-neutral-900`}>
                  {p.name} <span className="font-semibold tabular-nums">· {p.count} {p.count === 1 ? 'will' : 'wills'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1 overflow-x-auto rounded-lg bg-neutral-200/50 p-1 dark:bg-neutral-800">
          {(['all', 'active', 'inactive'] as StatusTab[]).map((key) => {
            const isActive = tab === key
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`cursor-pointer whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-white text-yellow-600 shadow-sm dark:bg-neutral-700 dark:text-yellow-400'
                    : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300'
                }`}
              >
                {key === 'all' ? 'All' : key === 'active' ? 'Active' : 'Deactivated'}
                <span className={`ml-1.5 text-[10px] font-bold tabular-nums ${isActive ? 'text-yellow-400 dark:text-yellow-300' : 'text-neutral-400 dark:text-neutral-500'}`}>
                  {counts[key]}
                </span>
              </button>
            )
          })}
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search team members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-neutral-200 bg-white py-2 pl-8 pr-3 text-sm text-neutral-900 transition-all placeholder:text-neutral-400 focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-500/30 sm:w-64 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
          />
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xs dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-none">
        <div className="hidden grid-cols-[minmax(200px,2fr)_minmax(180px,1.6fr)_minmax(150px,1.2fr)_80px_70px_70px_90px_48px] items-center gap-3 border-b border-neutral-200 bg-neutral-50 px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-500 lg:grid dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-400">
          <span>Team member</span>
          <span>Contact</span>
          <span>Access</span>
          <span className="text-center">Customers</span>
          <span className="text-center">Cases</span>
          <span className="text-center">Credits</span>
          <span className="text-center">Status</span>
          <span />
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Users size={36} className="mx-auto mb-3 text-neutral-300 dark:text-neutral-600" />
            <p className="font-medium text-neutral-500 dark:text-neutral-400">
              {members.length === 0 ? 'No team members yet' : 'No team members found'}
            </p>
            <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
              {members.length === 0
                ? 'Add a team member to give them their own login under your account'
                : 'Try a different search or status'}
            </p>
            {members.length === 0 && (
              <button
                onClick={openAdd}
                className="mt-4 inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-yellow-500 px-3 py-2 text-xs font-medium text-white shadow-sm transition-colors hover:bg-yellow-600"
              >
                <Plus size={13} />
                Add your first team member
              </button>
            )}
          </div>
        ) : (
          filtered.map((m, idx) => {
            const isLast = idx === filtered.length - 1
            const inactive = m.status === 'inactive'
            const isMenuOpen = openMenu === m.id
            const menu = (
              <RowMenu
                member={m}
                isOpen={isMenuOpen}
                onToggle={() => setOpenMenu(isMenuOpen ? null : m.id)}
                onClose={() => setOpenMenu(null)}
                onEdit={() => openEdit(m)}
                onReset={() => setResetTarget(m)}
                onStatus={() => setStatusTarget(m)}
              />
            )

            return (
              <div key={m.id} className={!isLast ? 'border-b border-neutral-100 dark:border-neutral-800/60' : ''}>
                {/* Desktop row */}
                <div
                  className={`hidden grid-cols-[minmax(200px,2fr)_minmax(180px,1.6fr)_minmax(150px,1.2fr)_80px_70px_70px_90px_48px] items-center gap-3 px-5 py-3.5 transition-colors hover:bg-neutral-50 lg:grid dark:hover:bg-neutral-800/30 ${
                    inactive ? 'opacity-60' : ''
                  }`}
                >
                  <MemberIdentity member={m} />
                  <div className="min-w-0 text-xs text-neutral-600 dark:text-neutral-300">
                    <p className="truncate">{m.email}</p>
                    <p className="mt-0.5 text-neutral-400 dark:text-neutral-500">{m.phone}</p>
                  </div>
                  <AccessPills access={m.access} documents={m.documentsAccess} />
                  <span className="text-center text-sm font-semibold tabular-nums text-neutral-800 dark:text-neutral-100">{m.customers}</span>
                  <span className={`text-center text-sm font-semibold tabular-nums ${m.activeCases > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-400 dark:text-neutral-500'}`}>
                    {m.activeCases}
                  </span>
                  <span className="text-center text-sm font-semibold tabular-nums text-neutral-800 dark:text-neutral-100">{m.willsUsed}</span>
                  <div className="flex justify-center">
                    <StatusBadge status={m.status} />
                  </div>
                  {menu}
                </div>

                {/* Mobile card */}
                <div className={`space-y-3 p-4 lg:hidden ${inactive ? 'opacity-60' : ''}`}>
                  <div className="flex items-start justify-between gap-2">
                    <MemberIdentity member={m} />
                    <div className="flex items-center gap-1">
                      <StatusBadge status={m.status} />
                      {menu}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500 dark:text-neutral-400">
                    <span className="inline-flex items-center gap-1"><Mail size={11} />{m.email}</span>
                    <span className="inline-flex items-center gap-1"><Phone size={11} />{m.phone}</span>
                  </div>
                  <AccessPills access={m.access} documents={m.documentsAccess} />
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <MiniStat label="Customers" value={m.customers} />
                    <MiniStat label="Active cases" value={m.activeCases} />
                    <MiniStat label="Credits used" value={m.willsUsed} />
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* ── Credit usage ────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-3.5 dark:border-neutral-800">
          <div>
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Credit usage</h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Every will credit drawn from the shared package, and who used it</p>
          </div>
          <span className="text-xs tabular-nums text-neutral-500 dark:text-neutral-400">
            {sharedPackage.willsUsed} used · valid until {formatDate(sharedPackage.validUntil)}
          </span>
        </div>
        {creditUsage.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-neutral-400">No credits used yet</p>
        ) : (
          <ul className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
            {creditUsage.slice(0, 6).map((u) => (
              <li key={u.id} className="flex items-center justify-between gap-3 px-5 py-2.5 text-sm">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[10px] font-bold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                    {getInitials(u.usedByName)}
                  </span>
                  <p className="truncate text-neutral-700 dark:text-neutral-200">
                    <span className="font-medium">{u.usedById === viewer.wealthManagerId ? 'You' : u.usedByName}</span>
                    <span className="text-neutral-400"> used 1 will for </span>
                    {u.customerName}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-neutral-400">{timeAgo(u.usedAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Add / Edit dialog ───────────────────────────────────────────── */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-neutral-200 bg-white sm:max-w-xl dark:border-neutral-700 dark:bg-neutral-900">
          <DialogHeader>
            <DialogTitle className="text-neutral-900 dark:text-neutral-100">
              {editing ? `Edit ${editing.name}` : 'Add Team Member'}
            </DialogTitle>
            {editing && (
              <DialogDescription className="text-neutral-500 dark:text-neutral-400">
                {editing.code} · Part of {viewer.companyName}
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="space-y-5 py-2">
            <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Full name" required error={submitted && !name.trim() ? 'Enter a name' : undefined}>
                <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="e.g. Priya Nair" />
              </Field>
              <Field label="Designation">
                <input value={designation} onChange={(e) => setDesignation(e.target.value)} className={inputClass} placeholder="e.g. Relationship Manager" />
              </Field>
              <Field
                label="Email (login ID)"
                required
                error={
                  emailTaken
                    ? 'This email is already used by a wealth manager, team member or employee'
                    : submitted && !/^\S+@\S+\.\S+$/.test(email.trim())
                      ? 'Enter a valid email'
                      : undefined
                }
              >
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="name@company.com" />
              </Field>
              <Field label="Phone" required error={submitted && !phone.trim() ? 'Enter a phone number' : undefined}>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} placeholder="+91 98765 43210" />
              </Field>
            </section>

            {!editing && (
              <section>
                <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">First password</h3>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <ChoiceCard
                    selected={passwordMode === 'link'}
                    onClick={() => setPasswordMode('link')}
                    icon={<Send size={14} />}
                    title="Email a set-password link"
                    hint="Recommended. You never see their password."
                  />
                  <ChoiceCard
                    selected={passwordMode === 'typed'}
                    onClick={() => setPasswordMode('typed')}
                    icon={<Lock size={14} />}
                    title="Set a password now"
                    hint="6+ characters. Share it with them securely."
                  />
                </div>
                {passwordMode === 'typed' && (
                  <div className="relative mt-3">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`${inputClass} pr-10`}
                      placeholder="Login password"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer text-neutral-400 hover:text-neutral-600"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                    {submitted && password.length < 6 && (
                      <p className="mt-1 text-xs text-red-500">Use at least 6 characters</p>
                    )}
                  </div>
                )}
              </section>
            )}

            <section>
              <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Module access</h3>
              <p className="mb-3 text-xs text-neutral-500 dark:text-neutral-400">
                A team member can never have more access than you do in a module.
              </p>
              <div className="space-y-2.5">
                {MODULES.map((mod) => (
                  <div key={mod.key} className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{mod.label}</span>
                    <div className="flex gap-1 rounded-lg bg-neutral-100 p-1 dark:bg-neutral-800">
                      {LEVELS.map((level) => {
                        const disabled = levelRank(level) > levelRank(parentAccess[mod.key])
                        const selected = access[mod.key] === level
                        return (
                          <button
                            key={level}
                            type="button"
                            disabled={disabled}
                            onClick={() => setAccess((a) => ({ ...a, [mod.key]: level }))}
                            title={disabled ? `Above your own access (${LEVEL_LABEL[parentAccess[mod.key]]})` : LEVEL_HINT[level]}
                            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                              selected
                                ? 'bg-white text-yellow-700 shadow-sm dark:bg-neutral-700 dark:text-yellow-300'
                                : disabled
                                  ? 'cursor-not-allowed text-neutral-300 dark:text-neutral-600'
                                  : 'cursor-pointer text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'
                            }`}
                          >
                            {LEVEL_LABEL[level]}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-start gap-2 rounded-lg bg-neutral-50 px-3 py-2.5 text-xs text-neutral-500 dark:bg-neutral-800/60 dark:text-neutral-400">
                <FileText size={13} className="mt-0.5 shrink-0" />
                <span>
                  Documents access is granted only by Wills24 admin.
                  {editing && (editing.documentsAccess ? ' This team member has it.' : ' This team member does not have it.')}
                </span>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-2 rounded-lg border border-dashed border-neutral-200 px-3 py-2.5 text-xs sm:grid-cols-3 dark:border-neutral-700">
              <Inherited label="Company" value={viewer.companyName} />
              <Inherited label="Package" value={`${sharedPackage.name} (shared)`} />
              <Inherited label="Credits left" value={`${willsLeft} of ${sharedPackage.willsIncluded}`} />
            </section>
          </div>

          <DialogFooter>
            <button
              onClick={() => setFormOpen(false)}
              className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitted && !formValid}
              className="rounded-lg bg-yellow-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-yellow-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {editing ? 'Save changes' : passwordMode === 'link' ? 'Add and send link' : 'Add team member'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Reset password ──────────────────────────────────────────────── */}
      <ConfirmDialog
        open={!!resetTarget}
        onClose={() => setResetTarget(null)}
        title={`Reset ${resetTarget?.name ?? ''}'s password?`}
        description={`Their current password stops working at once. We'll email a set-password link to ${resetTarget?.email ?? ''}. You won't see the new password.`}
        confirmLabel="Send reset link"
        onConfirm={() => {
          if (resetTarget) onResetPassword?.(resetTarget.id)
          setResetTarget(null)
        }}
      />

      {/* ── Deactivate / Activate ───────────────────────────────────────── */}
      <ConfirmDialog
        open={!!statusTarget}
        onClose={() => setStatusTarget(null)}
        title={statusTarget?.status === 'active' ? `Deactivate ${statusTarget?.name}?` : `Activate ${statusTarget?.name ?? ''}?`}
        description={
          statusTarget?.status === 'active'
            ? 'They are signed out and can no longer log in. Their customers, leads and cases stay with them and stay visible to you.'
            : 'They can log in again with their existing password and pick up their records.'
        }
        confirmLabel={statusTarget?.status === 'active' ? 'Deactivate' : 'Activate'}
        destructive={statusTarget?.status === 'active'}
        onConfirm={() => {
          if (statusTarget) onToggleStatus?.(statusTarget.id)
          setStatusTarget(null)
        }}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function MemberIdentity({ member }: { member: TeamMember }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 text-[11px] font-bold text-white">
        {getInitials(member.name)}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">{member.name}</p>
        <p className="truncate text-[11px] text-neutral-400 dark:text-neutral-500">
          <span className="font-mono">{member.code}</span>
          {member.designation && ` · ${member.designation}`}
        </p>
        <p className="text-[10px] text-neutral-400 dark:text-neutral-500">
          Added {formatDate(member.createdAt)}
          {member.lastLoginAt && ` · last login ${timeAgo(member.lastLoginAt)}`}
        </p>
      </div>
    </div>
  )
}

function AccessPills({ access, documents }: { access: ModuleAccess; documents: boolean }) {
  return (
    <div className="flex flex-wrap gap-1">
      {MODULES.map((mod) => (
        <span
          key={mod.key}
          title={`${mod.label}: ${LEVEL_LABEL[access[mod.key]]}`}
          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${LEVEL_PILL[access[mod.key]]}`}
        >
          {mod.short} {access[mod.key] === 'none' ? '' : `· ${LEVEL_LABEL[access[mod.key]]}`}
        </span>
      ))}
      {documents && (
        <span title="Documents access granted by Wills24 admin" className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
          Docs
        </span>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: TeamMember['status'] }) {
  return status === 'active' ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
      <span className="h-1.5 w-1.5 rounded-full bg-neutral-400" />
      Deactivated
    </span>
  )
}

function RowMenu({
  member,
  isOpen,
  onToggle,
  onClose,
  onEdit,
  onReset,
  onStatus,
}: {
  member: TeamMember
  isOpen: boolean
  onToggle: () => void
  onClose: () => void
  onEdit: () => void
  onReset: () => void
  onStatus: () => void
}) {
  const item = (icon: React.ReactNode, label: string, action: () => void, danger = false) => (
    <button
      onClick={() => {
        onClose()
        action()
      }}
      className={`flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-left text-[13px] transition-colors ${
        danger
          ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20'
          : 'text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-700/50'
      }`}
    >
      {icon}
      {label}
    </button>
  )

  return (
    <div className="relative flex justify-center">
      <button
        onClick={onToggle}
        className="cursor-pointer rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
        aria-label={`Actions for ${member.name}`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <MoreVertical size={14} />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={onClose} />
          <div className="absolute right-0 top-8 z-20 w-48 rounded-xl border border-neutral-200 bg-white py-1.5 shadow-lg dark:border-neutral-700 dark:bg-neutral-800">
            {item(<Pencil size={13} />, 'Edit', onEdit)}
            {item(<KeyRound size={13} />, 'Reset password', onReset)}
            <div className="my-1 border-t border-neutral-100 dark:border-neutral-700" />
            {member.status === 'active'
              ? item(<UserX size={13} />, 'Deactivate', onStatus, true)
              : item(<UserCheck size={13} />, 'Activate', onStatus)}
          </div>
        </>
      )}
    </div>
  )
}

function SummaryCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col justify-between gap-3 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center gap-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">
        <span className="text-yellow-500">{icon}</span>
        {label}
      </div>
      <p className="text-2xl font-bold tabular-nums text-neutral-900 dark:text-neutral-100">{value}</p>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-neutral-50 py-2 dark:bg-neutral-800/50">
      <p className="text-sm font-semibold tabular-nums text-neutral-800 dark:text-neutral-100">{value}</p>
      <p className="text-[10px] text-neutral-400">{label}</p>
    </div>
  )
}

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

function ChoiceCard({ selected, onClick, icon, title, hint }: { selected: boolean; onClick: () => void; icon: React.ReactNode; title: string; hint: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-colors ${
        selected
          ? 'border-yellow-400 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-950/30'
          : 'border-neutral-200 hover:border-neutral-300 dark:border-neutral-700 dark:hover:border-neutral-600'
      }`}
    >
      <span className={`mt-0.5 ${selected ? 'text-yellow-600 dark:text-yellow-400' : 'text-neutral-400'}`}>{icon}</span>
      <span>
        <span className="block text-sm font-medium text-neutral-800 dark:text-neutral-100">{title}</span>
        <span className="block text-xs text-neutral-500 dark:text-neutral-400">{hint}</span>
      </span>
    </button>
  )
}

function Inherited({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-neutral-400">{label}</p>
      <p className="truncate font-medium text-neutral-700 dark:text-neutral-300">{value}</p>
    </div>
  )
}

function ConfirmDialog({
  open,
  onClose,
  title,
  description,
  confirmLabel,
  destructive,
  onConfirm,
}: {
  open: boolean
  onClose: () => void
  title: string
  description: string
  confirmLabel: string
  destructive?: boolean
  onConfirm: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900">
        <DialogHeader>
          <DialogTitle className="text-neutral-900 dark:text-neutral-100">{title}</DialogTitle>
          <DialogDescription className="text-neutral-500 dark:text-neutral-400">{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <button
            onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            <X size={14} />
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors ${
              destructive ? 'bg-red-600 hover:bg-red-700' : 'bg-yellow-500 hover:bg-yellow-600'
            }`}
          >
            {confirmLabel}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
