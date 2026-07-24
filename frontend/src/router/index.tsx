import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { AppLayout } from '../components/layout/AppLayout';
import { useAuth } from '../store/auth.context';

// Lazy-loaded Library ERP Pages
const LoginPage = lazy(() => import('../features/auth/LoginPage').then((m) => ({ default: m.LoginPage })));
const DashboardPage = lazy(() => import('../features/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const StudentsPage = lazy(() => import('../features/students/StudentsPage').then((m) => ({ default: m.StudentsPage })));
const StudentDetailPage = lazy(() => import('../features/students/StudentDetailPage').then((m) => ({ default: m.StudentDetailPage })));
const SeatsPage = lazy(() => import('../features/seats/SeatsPage').then((m) => ({ default: m.SeatsPage })));
const PaymentsPage = lazy(() => import('../features/payments/PaymentsPage').then((m) => ({ default: m.PaymentsPage })));
const ReportsPage = lazy(() => import('../features/reports/ReportsPage').then((m) => ({ default: m.ReportsPage })));
const SettingsPage = lazy(() => import('../features/settings/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const UsersPage = lazy(() => import('../features/users/UsersPage').then((m) => ({ default: m.UsersPage })));

// Lazy-loaded Super Admin Panel Pages
import { SuperAdminLayout } from '../features/super-admin/layout/SuperAdminLayout';
const SuperAdminDashboardPage = lazy(() => import('../features/super-admin/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const LibrariesPage = lazy(() => import('../features/super-admin/pages/LibrariesPage').then((m) => ({ default: m.LibrariesPage })));
const LibraryDetailPage = lazy(() => import('../features/super-admin/pages/LibraryDetailPage').then((m) => ({ default: m.LibraryDetailPage })));
const SubscriptionsPage = lazy(() => import('../features/super-admin/pages/SubscriptionsPage').then((m) => ({ default: m.SubscriptionsPage })));
const RevenuePage = lazy(() => import('../features/super-admin/pages/RevenuePage').then((m) => ({ default: m.RevenuePage })));
const SuperAdminSettingsPage = lazy(() => import('../features/super-admin/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const LogsPage = lazy(() => import('../features/super-admin/pages/LogsPage').then((m) => ({ default: m.LogsPage })));
const ProfilePage = lazy(() => import('../features/super-admin/pages/ProfilePage').then((m) => ({ default: m.ProfilePage })));

function PageFallback() {
  return (
    <div className="flex items-center justify-center min-h-[50vh] p-4">
      <div className="flex flex-col items-center space-y-3 text-center">
        <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-muted-foreground font-medium">Loading view...</p>
        <button
          onClick={() => { window.location.href = '/login'; }}
          className="mt-1 px-3.5 py-1.5 bg-surface-2 hover:bg-surface-3 text-foreground border border-border rounded-xl text-xs font-semibold shadow-sm transition-all"
        >
          Go to Login Page
        </button>
      </div>
    </div>
  );
}

function RootRedirect() {
  const { user } = useAuth();
  if (user?.role === 'super_admin') {
    return <Navigate to="/super-admin/dashboard" replace />;
  }
  return <Navigate to="/dashboard" replace />;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected — Super Admin Panel */}
          <Route element={<ProtectedRoute allowedRoles={['super_admin']} />}>
            <Route element={<SuperAdminLayout />}>
              <Route path="/super-admin" element={<Navigate to="/super-admin/dashboard" replace />} />
              <Route path="/super-admin/dashboard" element={<SuperAdminDashboardPage />} />
              <Route path="/super-admin/libraries" element={<LibrariesPage />} />
              <Route path="/super-admin/libraries/:id" element={<LibraryDetailPage />} />
              <Route path="/super-admin/subscriptions" element={<SubscriptionsPage />} />
              <Route path="/super-admin/revenue" element={<RevenuePage />} />
              <Route path="/super-admin/settings" element={<SuperAdminSettingsPage />} />
              <Route path="/super-admin/logs" element={<LogsPage />} />
              <Route path="/super-admin/profile" element={<ProfilePage />} />
            </Route>
          </Route>

          {/* Protected — Library Dashboard (Owner, Manager, Receptionist) */}
          <Route element={<ProtectedRoute allowedRoles={['owner', 'manager', 'receptionist']} />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<RootRedirect />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/students" element={<StudentsPage />} />
              <Route path="/students/:id" element={<StudentDetailPage />} />
              <Route path="/seats" element={<SeatsPage />} />
              <Route path="/payments" element={<PaymentsPage />} />

              {/* Owner + Manager */}
              <Route element={<ProtectedRoute allowedRoles={['owner', 'manager']} />}>
                <Route path="/reports" element={<ReportsPage />} />
              </Route>

              {/* Owner only */}
              <Route element={<ProtectedRoute allowedRoles={['owner']} />}>
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/users" element={<UsersPage />} />
              </Route>
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
