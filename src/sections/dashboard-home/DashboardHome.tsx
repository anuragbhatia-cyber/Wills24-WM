import { useMemo, useState } from 'react'
import data from '@/../product/sections/dashboard-home/data.json'
import teamData from '@/../product/sections/team/data.json'
import { DashboardHome } from './components/DashboardHome'
import { navigateToScreen } from '@/lib/preview-navigation'
import { usePreviewViewer } from '@/lib/preview-viewer'
import { isInScope } from '@/sections/team/components/scope'
import type { TeamScope } from '@/../product/sections/team/types'

const quickActionTargets: Record<string, [string, string]> = {
  'qa-1': ['sales-crm', 'LeadForm'],          // Add Lead
  'qa-2': ['case-management', 'AddCaseForm'], // Create Case
  'qa-3': ['sales-crm', 'LeadsList'],         // Create Quotation
  'qa-4': ['case-management', 'CaseList'],    // Assign Lawyer
  'qa-5': ['partners', 'AddWMForm'],          // Add Partner
  'qa-6': ['accounts', 'AccountsList'],       // Process Payout
  'qa-7': ['accounts', 'AccountsList'],       // Generate Invoice
  'qa-8': ['case-management', 'CaseList'],    // Upload Document
  'qa-9': ['sales-crm', 'LeadsList'],         // Schedule Follow-up
}

const activityTypeTargets: Record<string, [string, string]> = {
  lead: ['sales-crm', 'LeadDetail'],
  case: ['case-management', 'CaseDetail'],
  customer: ['customers', 'CustomerDetail'],
  followup: ['sales-crm', 'LeadDetail'],
  invoice: ['accounts', 'AccountsList'],
  payment: ['accounts', 'AccountsList'],
  wallet: ['team', 'TeamList'],
  partner: ['partners', 'WMDetail'],
  wm: ['partners', 'WMDetail'],
}

/**
 * Preview wrapper for Design OS.
 * Counts, the Case Status donut and Recent Activity are summed from the
 * per-owner breakdown for the selected scope, as the server would return them.
 */
export default function DashboardHomePreview() {
  const viewer = usePreviewViewer()
  const [scope, setScope] = useState<TeamScope>('team')

  const scoped = useMemo(() => {
    const rows = data.teamBreakdown.filter((r) => isInScope(r.ownerId, viewer, scope))
    const sum = (key: 'activeCases' | 'completedCases' | 'newLeads') => rows.reduce((n, r) => n + r[key], 0)
    const caseStatusDistribution = data.caseStatusDistribution.map((entry) => ({
      ...entry,
      count: rows.reduce((n, r) => n + (r.caseStatus[entry.status as keyof typeof r.caseStatus] ?? 0), 0),
    }))
    return {
      kpiStats: {
        ...data.kpiStats,
        activeCases: sum('activeCases'),
        completedCases: sum('completedCases'),
        newLeads: sum('newLeads'),
      },
      caseStatusDistribution,
      activityFeed: data.teamActivityFeed.filter((a) => isInScope(a.ownerId, viewer, scope)),
    }
  }, [viewer, scope])

  const pkg = teamData.sharedPackage

  return (
    <DashboardHome
      kpiStats={scoped.kpiStats}
      activityFeed={scoped.activityFeed as any}
      pendingItems={data.pendingItems as any}
      salesTrend={data.salesTrend}
      caseStatusDistribution={scoped.caseStatusDistribution}
      monthlyRevenue={data.monthlyRevenue}
      conversionFunnel={data.conversionFunnel}
      quickActions={data.quickActions}
      user={{ name: viewer.name, role: viewer.role === 'sub-wm' ? 'Team member' : 'Admin Wealth Manager' }}
      viewer={viewer}
      onScopeChange={setScope}
      sharedCredits={{ left: pkg.willsIncluded - pkg.willsUsed, total: pkg.willsIncluded }}
      onDateRangeChange={(range) => console.log('Date range:', range)}
      onQuickAction={(id) => {
        const target = quickActionTargets[id]
        if (target) navigateToScreen(target[0], target[1])
      }}
      onActivityClick={(type, id) => {
        const target = activityTypeTargets[type]
        if (target) navigateToScreen(target[0], target[1])
        else console.log('Activity:', type, id)
      }}
      onPendingItemClick={(id) => console.log('Pending item:', id)}
    />
  )
}
