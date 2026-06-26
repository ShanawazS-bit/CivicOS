import { lazy, Suspense, useEffect, useState } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { BottomNav } from '@/components/BottomNav'
import { ConnectionBanner } from '@/components/ConnectionBanner'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { FeedPage } from '@/pages/FeedPage'
import { HomePage } from '@/pages/HomePage'
import { ReportPage } from '@/pages/ReportPage'
import { preloadPrimaryDestinationsWhenIdle } from '@/lib/preloadPrimaryDestinations'
import { checkSupabaseConnection, type DataSource } from '@/services/issueService'

const AdminPage = lazy(() =>
  import('@/pages/AdminPage').then((m) => ({ default: m.AdminPage }))
)

const AboutPage = lazy(() =>
  import('@/pages/AboutPage').then((m) => ({ default: m.AboutPage }))
)

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  )
}

function AppShell() {
  const [dataSource, setDataSource] = useState<DataSource>('demo')
  const { pathname } = useLocation()
  const adminMode = pathname === '/admin' || pathname === '/admin/dashboard'
  const aboutMode = pathname === '/' || pathname === '/about'
  const editorialImmersiveMode = adminMode || aboutMode

  useEffect(() => {
    checkSupabaseConnection().then(setDataSource)
  }, [])

  useEffect(() => {
    preloadPrimaryDestinationsWhenIdle()
  }, [])

  return (
    <>
      {!editorialImmersiveMode && <ConnectionBanner mode={dataSource} />}
      <main className={adminMode ? 'h-screen overflow-hidden' : editorialImmersiveMode ? 'min-h-screen' : 'min-h-screen pb-[83px]'}>
        <Routes>
          <Route
            path="/"
            element={
              <Suspense fallback={<LoadingSpinner label="Loading about…" />}>
                <AboutPage />
              </Suspense>
            }
          />
          <Route
            path="/about"
            element={
              <Suspense fallback={<LoadingSpinner label="Loading about…" />}>
                <AboutPage />
              </Suspense>
            }
          />
          <Route path="/home" element={<HomePage />} />
          <Route path="/feed" element={<FeedPage />} />
          <Route path="/report" element={<ReportPage />} />
          <Route
            path="/admin"
            element={
              <Suspense fallback={<LoadingSpinner label="Loading dashboard…" />}>
                <AdminPage />
              </Suspense>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <Suspense fallback={<LoadingSpinner label="Loading dashboard…" />}>
                <AdminPage />
              </Suspense>
            }
          />
        </Routes>
      </main>
      {!editorialImmersiveMode && <BottomNav />}
    </>
  )
}
