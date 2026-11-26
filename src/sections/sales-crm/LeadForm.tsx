import data from '@/../product/sections/sales-crm/data.json'
import { LeadForm } from './components/LeadForm'
import { navigateToScreen } from '@/lib/preview-navigation'
import { toast } from '@/components/ui/toaster'
import { usePreviewViewer } from '@/lib/preview-viewer'

/**
 * Preview wrapper for Design OS.
 * Shows the Add Lead form (no lead prop = create mode).
 * To preview edit mode, pass a lead from the data.
 */
export default function LeadFormPreview() {
  const viewer = usePreviewViewer()
  // Derive employee list from leads data
  const employees = [...new Set(data.leads.map((l) => l.assignedEmployee).filter(Boolean))].sort()

  return (
    <LeadForm
      wealthManagers={data.wealthManagers as any}
      employees={employees}
      viewer={viewer}
      onSave={(lead) => {
        toast.success('Lead created', lead?.name ? `${lead.name} added to your pipeline` : undefined)
        navigateToScreen('sales-crm', 'LeadsList')
      }}
      onCancel={() => navigateToScreen('sales-crm', 'LeadsList')}
    />
  )
}
