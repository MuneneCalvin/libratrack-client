import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import LoginPage from '@/pages/LoginPage';
import DashboardLayout from '@/layouts/DashboardLayout';
import PortalLayout from '@/layouts/PortalLayout';
import DashboardPage from '@/pages/DashboardPage';
import BooksPage from '@/pages/books/BooksPage';
import BookDetailPage from '@/pages/books/BookDetailPage';
import BookNewPage from '@/pages/books/BookNewPage';
import BookEditPage from '@/pages/books/BookEditPage';
import MembersPage from '@/pages/members/MembersPage';
import MemberDetailPage from '@/pages/members/MemberDetailPage';
import MemberNewPage from '@/pages/members/MemberNewPage';
import TransactionsPage from '@/pages/transactions/TransactionsPage';
import BorrowPage from '@/pages/transactions/BorrowPage';
import ReturnPage from '@/pages/transactions/ReturnPage';
import ReservationsPage from '@/pages/reservations/ReservationsPage';
import FinesPage from '@/pages/fines/FinesPage';
import ReportsPage from '@/pages/reports/ReportsPage';
import NotificationsPage from '@/pages/notifications/NotificationsPage';
import SettingsPage from '@/pages/settings/SettingsPage';
import PortalDashboardPage from '@/pages/portal/PortalDashboardPage';
import PortalReservationsPage from '@/pages/portal/PortalReservationsPage';
import PortalFinesPage from '@/pages/portal/PortalFinesPage';
import PortalNotificationsPage from '@/pages/portal/PortalNotificationsPage';
import ProfilePage from '@/pages/profile/ProfilePage';
import PortalProfilePage from '@/pages/portal/PortalProfilePage';
import PortalBooksPage from '@/pages/portal/PortalBooksPage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<ProtectedRoute roles={['admin', 'librarian']}><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="books" element={<BooksPage />} />
        <Route path="books/new" element={<BookNewPage />} />
        <Route path="books/:id" element={<BookDetailPage />} />
        <Route path="books/:id/edit" element={<BookEditPage />} />
        <Route path="members" element={<MembersPage />} />
        <Route path="members/new" element={<MemberNewPage />} />
        <Route path="members/:id" element={<MemberDetailPage />} />
        <Route path="transactions" element={<TransactionsPage />} />
        <Route path="transactions/borrow" element={<BorrowPage />} />
        <Route path="transactions/return" element={<ReturnPage />} />
        <Route path="reservations" element={<ReservationsPage />} />
        <Route path="fines" element={<FinesPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="settings" element={<ProtectedRoute roles={['admin']}><SettingsPage /></ProtectedRoute>} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
      <Route path="/portal" element={<ProtectedRoute roles={['member']}><PortalLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/portal/dashboard" replace />} />
        <Route path="dashboard" element={<PortalDashboardPage />} />
        <Route path="reservations" element={<PortalReservationsPage />} />
        <Route path="fines" element={<PortalFinesPage />} />
        <Route path="notifications" element={<PortalNotificationsPage />} />
        <Route path="profile" element={<PortalProfilePage />} />
        <Route path="books" element={<PortalBooksPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
