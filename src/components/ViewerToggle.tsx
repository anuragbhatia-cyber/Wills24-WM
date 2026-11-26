import { usePreviewViewer, setPreviewRole } from '@/lib/preview-viewer'

/**
 * Preview-only switch between the admin wealth manager and a team member login
 */
export function ViewerToggle() {
  const viewer = usePreviewViewer()
  return (
    <div className="flex items-center gap-1 rounded-md bg-stone-100 p-0.5 dark:bg-stone-800" title="Preview as">
      {(['admin-wm', 'sub-wm'] as const).map((role) => (
        <button
          key={role}
          onClick={() => setPreviewRole(role)}
          className={`rounded px-2 py-1 text-xs transition-colors ${
            viewer.role === role
              ? 'bg-white font-medium text-stone-900 shadow-sm dark:bg-stone-700 dark:text-stone-100'
              : 'text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200'
          }`}
        >
          {role === 'admin-wm' ? 'Admin WM' : 'Team member'}
        </button>
      ))}
    </div>
  )
}
