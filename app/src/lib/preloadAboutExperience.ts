export const ABOUT_SCENE_PATH = '/models/finalwhitescene.splinecode.json'

let preloadStarted = false

export function preloadAboutExperience() {
  if (preloadStarted) return
  preloadStarted = true

  void import('@/pages/AboutPage')
  void fetch(ABOUT_SCENE_PATH, { cache: 'force-cache' }).catch(() => {
    preloadStarted = false
  })
}

export function preloadAboutWhenIdle() {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => preloadAboutExperience(), { timeout: 5000 })
    return
  }

  globalThis.setTimeout(preloadAboutExperience, 2500)
}
