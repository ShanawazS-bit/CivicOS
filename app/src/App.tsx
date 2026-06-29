import { lazy, Suspense, useEffect, useState } from 'react'
import { BrowserRouter, Route, Routes, useLocation, Navigate } from 'react-router-dom'
import { BottomNav } from '@/components/BottomNav'
import { Footer } from '@/components/Footer'
import { ConnectionBanner } from '@/components/ConnectionBanner'
import { EditorialTopNav } from '@/components/EditorialTopNav'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { HomePage } from '@/pages/HomePage'
import { ReportPage } from '@/pages/ReportPage'
import { preloadPrimaryDestinationsWhenIdle } from '@/lib/preloadPrimaryDestinations'
import { checkSupabaseConnection, type DataSource } from '@/services/issueService'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { LoginPage } from '@/pages/LoginPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading } = useAuth()
  const location = useLocation()
  if (loading) return <LoadingSpinner label="Authenticating..." />
  if (!isAdmin) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  return <>{children}</>
}

const AdminPage = lazy(() =>
  import('@/pages/AdminPage').then((m) => ({ default: m.AdminPage }))
)

const AboutPage = lazy(() =>
  import('@/pages/AboutPage').then((m) => ({ default: m.AboutPage }))
)

const FeedPage = lazy(() =>
  import('@/pages/FeedPage').then((m) => ({ default: m.FeedPage }))
)

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </BrowserRouter>
  )
}

function AppShell() {
  const [dataSource, setDataSource] = useState<DataSource>('demo')
  const { pathname } = useLocation()
  const adminMode = pathname.startsWith('/admin') || pathname === '/login'
  const aboutMode = pathname === '/' || pathname === '/about'
  const feedMode = pathname === '/feed'
  const editorialImmersiveMode = adminMode || aboutMode

  useEffect(() => {
    checkSupabaseConnection().then(setDataSource)
  }, [])

  useEffect(() => {
    preloadPrimaryDestinationsWhenIdle()
  }, [])

  return (
    <>
      {!adminMode && <EditorialTopNav />}
      {!editorialImmersiveMode && <ConnectionBanner mode={dataSource} />}
      <main className={adminMode ? 'h-screen overflow-hidden' : editorialImmersiveMode ? 'min-h-screen' : feedMode ? 'h-[calc(100vh-57px)] overflow-hidden' : 'min-h-screen pb-[83px]'}>
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
          <Route
            path="/feed"
            element={
              <Suspense fallback={<LoadingSpinner label="Loading area health…" />}>
                <FeedPage />
              </Suspense>
            }
          />
          <Route
            path="/report"
            element={
              <ProtectedRoute>
                <ReportPage />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingSpinner label="Loading dashboard…" />}>
                  <AdminPage />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingSpinner label="Loading dashboard…" />}>
                  <AdminPage />
                </Suspense>
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
      {!editorialImmersiveMode && <BottomNav />}
      {!editorialImmersiveMode && <Footer />}
    </>
  )
}
