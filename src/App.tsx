import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './features/auth/AuthContext';
import { LoginPage } from './features/auth/LoginPage';
import { PublicClientForm } from './features/public/PublicClientForm';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { CalendarPage } from './features/calendar/CalendarPage';
import { ClientListPage } from './features/crm/ClientListPage';
import { OperatorListPage } from './features/operators/OperatorListPage';
import { FinancialsPage } from './features/financials/FinancialsPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { ChatPage } from './features/chat/ChatPage';
import { ConsentsPage } from './features/consents/ConsentsPage';
import { PromotionsPage } from './features/promotions/PromotionsPage';
import { AcademyPage } from './features/academy/AcademyPage';
import { AttendancePage } from './features/academy/AttendancePage';
import { MaterialsPage } from './features/academy/MaterialsPage';
import { AppLayout } from './components/layout/AppLayout';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register/:tenantId" element={<PublicClientForm />} />

          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/clients" element={<ClientListPage />} />
            <Route path="/artists" element={<OperatorListPage />} />
            <Route path="/financials" element={<FinancialsPage />} />
            <Route path="/promotions" element={<PromotionsPage />} />
            <Route path="/academy" element={<AcademyPage />} />
            <Route path="/attendance" element={<AttendancePage />} />
            <Route path="/materials" element={<MaterialsPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/consents" element={<ConsentsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
