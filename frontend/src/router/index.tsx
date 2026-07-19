import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { AppLayout } from '../components/layout/AppLayout';
import { LoginPage } from '../features/auth/LoginPage';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { StudentsPage } from '../features/students/StudentsPage';
import { StudentDetailPage } from '../features/students/StudentDetailPage';
import { SeatsPage } from '../features/seats/SeatsPage';
import { PaymentsPage } from '../features/payments/PaymentsPage';
import { ReportsPage } from '../features/reports/ReportsPage';
import { SettingsPage } from '../features/settings/SettingsPage';
import { UsersPage } from '../features/users/UsersPage';
import { useAuth } from '../store/auth.context';

// Super Admin imports
import { SuperAdminLayout } from '../features/super-admin/layout/SuperAdminLayout';
import { DashboardPage as SuperAdminDashboardPage } from '../features/super-admin/pages/DashboardPage';
import { LibrariesPage } from '../features/super-admin/pages/LibrariesPage';
import { SubscriptionsPage } from '../features/super-admin/pages/SubscriptionsPage';
import { RevenuePage } from '../features/super-admin/pages/RevenuePage';
import { SettingsPage as SuperAdminSettingsPage } from '../features/super-admin/pages/SettingsPage';
import { LogsPage } from '../features/super-admin/pages/LogsPage';
import { ProfilePage } from '../features/super-admin/pages/ProfilePage';

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
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected — Super Admin Panel */}
        <Route element={<ProtectedRoute allowedRoles={['super_admin']} />}>
          <Route element={<SuperAdminLayout />}>
            <Route path="/super-admin" element={<Navigate to="/super-admin/dashboard" replace />} />
            <Route path="/super-admin/dashboard" element={<SuperAdminDashboardPage />} />
            <Route path="/super-admin/libraries" element={<LibrariesPage />} />
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
    </BrowserRouter>
  );
}
