import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './features/auth/AuthContext';
import { LoginPage } from './features/auth/LoginPage';
import { PublicClientForm } from './features/public/PublicClientForm';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { CalendarPage } from './features/calendar/CalendarPage';
import { ClientListPage } from './features/crm/ClientListPage';
import { OperatorListPage } from './features/operators/OperatorListPage';
import { OperatorDetailsPage } from './features/operators/OperatorDetailsPage';
import { FinancialsPage } from './features/financials/FinancialsPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { ChatPage } from './features/chat/ChatPage';
import { ConsentsPage } from './features/consents/ConsentsPage';
import { PromotionsPage } from './features/promotions/PromotionsPage';
import { AcademyPage } from './features/academy/AcademyPage';
import { AttendancePage } from './features/academy/AttendancePage';
import { MaterialsPage } from './features/academy/MaterialsPage';
import { WaitlistPage } from './features/waitlist/WaitlistPage';
import { AppLayout } from './components/layout/AppLayout';
import { RoleGuard } from './components/layout/RoleGuard';
import { PrivacyProvider } from './features/context/PrivacyContext';
//...
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PrivacyProvider>
          <Routes>
//...
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register/:tenantId" element={<PublicClientForm />} />

            <Route element={<AppLayout />}>
              {/* Shared Route (Dashboard handles internal logic) */}
              <Route path="/" element={<DashboardPage />} />

              {/* Staff Routes (Manager & Artist) */}
              <Route path="/calendar" element={
                <RoleGuard allowedRoles={['MANAGER', 'ARTIST']}>
                  <CalendarPage />
                </RoleGuard>
              } />
              <Route path="/clients" element={
                <RoleGuard allowedRoles={['MANAGER', 'ARTIST']}>
                  <ClientListPage />
                </RoleGuard>
              } />
              <Route path="/financials" element={
                <RoleGuard allowedRoles={['MANAGER', 'ARTIST']}>
                  <FinancialsPage />
                </RoleGuard>
              } />
              <Route path="/chat" element={
                <RoleGuard allowedRoles={['MANAGER', 'ARTIST']}>
                  <ChatPage />
                </RoleGuard>
              } />
              <Route path="/consents" element={
                <RoleGuard allowedRoles={['MANAGER', 'ARTIST']}>
                  <ConsentsPage />
                </RoleGuard>
              } />

              {/* Manager Only Routes */}
              <Route path="/waitlist" element={
                <RoleGuard allowedRoles={['MANAGER']}>
                  <WaitlistPage />
                </RoleGuard>
              } />
              <Route path="/artists" element={
                <RoleGuard allowedRoles={['MANAGER']}>
                  <OperatorListPage />
                </RoleGuard>
              } />
              <Route path="/artists/:id" element={
                <RoleGuard allowedRoles={['MANAGER', 'ARTIST']}>
                  <OperatorDetailsPage />
                </RoleGuard>
              } />
              <Route path="/promotions" element={
                <RoleGuard allowedRoles={['MANAGER']}>
                  <PromotionsPage />
                </RoleGuard>
              } />
              <Route path="/academy" element={
                <RoleGuard allowedRoles={['MANAGER']}>
                  <AcademyPage />
                </RoleGuard>
              } />
              <Route path="/settings" element={
                <RoleGuard allowedRoles={['MANAGER']}>
                  <SettingsPage />
                </RoleGuard>
              } />

              {/* Student Only Routes */}
              <Route path="/attendance" element={
                <RoleGuard allowedRoles={['STUDENT']}>
                  <AttendancePage />
                </RoleGuard>
              } />
              <Route path="/materials" element={
                <RoleGuard allowedRoles={['STUDENT']}>
                  <MaterialsPage />
                </RoleGuard>
              } />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </PrivacyProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
