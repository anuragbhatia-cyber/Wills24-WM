import data from '@/../product/sections/case-management/data.json'
import { CaseList } from './components/CaseList'
import { navigateToScreen } from '@/lib/preview-navigation'
import { usePreviewViewer } from '@/lib/preview-viewer'

export default function CaseListPreview() {
  const viewer = usePreviewViewer()
  return (
    <CaseList
      cases={data.cases as any}
      kpiStats={data.kpiStats as any}
      statusCounts={data.statusCounts as any}
      viewer={viewer}
      onScopeChange={(scope) => console.log('Scope:', scope)}
      onView={() => navigateToScreen('case-management', 'CaseDetail')}
      onEdit={(id) => console.log('Edit case:', id)}
      onCreate={() => navigateToScreen('case-management', 'AddCaseForm')}
    />
  )
}
