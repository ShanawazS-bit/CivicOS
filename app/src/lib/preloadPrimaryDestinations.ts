import { ABOUT_SCENE_PATH, preloadAboutExperience } from '@/lib/preloadAboutExperience'

let preloadStarted = false

export function preloadAdminDashboard() {
  void import('@/pages/AdminPage')
}

export function preloadAreaHealth() {
  void import('@/pages/FeedPage')
  void import('@/components/IssueMap')
}

export function preloadPrimaryDestinations() {
  if (preloadStarted) return
  preloadStarted = true

  preloadAboutExperience()
  preloadAdminDashboard()
  preloadAreaHealth()
  void fetch(ABOUT_SCENE_PATH, { cache: 'force-cache' }).catch(() => {})
}

export function preloadPrimaryDestinationsWhenIdle() {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => preloadPrimaryDestinations(), { timeout: 3500 })
    return
  }

  globalThis.setTimeout(preloadPrimaryDestinations, 1800)
}
