import { Routes, Route, Navigate } from 'react-router-dom';

// Infrastructure
import { ScrollToTop } from './components/common/ScrollToTop';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Layouts
import { PublicLayout } from './layouts/PublicLayout';
import { AccountLayout } from './layouts/AccountLayout';
import { AdminLayout } from './layouts/AdminLayout';

// Guards
import { RequireAuth } from './components/guards/RequireAuth';
import { RequireAdmin } from './components/guards/RequireAdmin';

// Public Pages
import { HomePage } from './pages/public/HomePage';
import { MenuPage } from './pages/public/MenuPage';
import { DishDetailPage } from './pages/public/DishDetailPage';
import { CartPage } from './pages/public/CartPage';
import { CheckoutPage } from './pages/public/CheckoutPage';
import { OrderConfirmationPage } from './pages/public/OrderConfirmationPage';
import { ReservationPage } from './pages/public/ReservationPage';
import { AboutPage } from './pages/public/AboutPage';
import { ContactPage } from './pages/public/ContactPage';
import { LoginPage } from './pages/public/LoginPage';
import { RegisterPage } from './pages/public/RegisterPage';

// Customer Account Pages
import { AccountOverviewPage } from './pages/customer/AccountOverviewPage';
import { OrderHistoryPage } from './pages/customer/OrderHistoryPage';
import { OrderDetailPage } from './pages/customer/OrderDetailPage';
import { ReservationHistoryPage } from './pages/customer/ReservationHistoryPage';
import { CustomerReviewsPage } from './pages/customer/CustomerReviewsPage';

// Admin Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminOrderDetailPage from './pages/admin/AdminOrderDetailPage';
import AdminMenuPage from './pages/admin/AdminMenuPage';
import AdminCategoriesPage from './pages/admin/AdminCategoriesPage';
import AdminReservationsPage from './pages/admin/AdminReservationsPage';
import AdminReviewsPage from './pages/admin/AdminReviewsPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';

export default function App() {
  return (
    <>
      {/* Resets scroll position on every route change */}
      <ScrollToTop />

      <Routes>
        {/* ── Public Routes (with nav + footer) ── */}
        <Route element={<ErrorBoundary><PublicLayout /></ErrorBoundary>}>
          <Route path="/" element={<HomePage />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/menu/:id" element={<DishDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order-confirmation/:orderId" element={<OrderConfirmationPage />} />
          <Route path="/reservation" element={<ReservationPage />} />
          <Route path="/reservations" element={<ReservationPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* ── Customer Account Routes (auth required) ── */}
        <Route element={<RequireAuth />}>
          <Route element={<ErrorBoundary><AccountLayout /></ErrorBoundary>}>
            <Route path="/account" element={<AccountOverviewPage />} />
            <Route path="/account/orders" element={<OrderHistoryPage />} />
            <Route path="/account/orders/:id" element={<OrderDetailPage />} />
            <Route path="/account/reservations" element={<ReservationHistoryPage />} />
            <Route path="/account/reviews" element={<CustomerReviewsPage />} />
            <Route path="/account/settings" element={<AccountOverviewPage />} />
          </Route>
        </Route>

        {/* ── Admin Routes (admin role required) ── */}
        <Route element={<RequireAdmin />}>
          <Route element={<ErrorBoundary><AdminLayout /></ErrorBoundary>}>
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/orders" element={<AdminOrdersPage />} />
            <Route path="/admin/orders/:id" element={<AdminOrderDetailPage />} />
            <Route path="/admin/menu" element={<AdminMenuPage />} />
            <Route path="/admin/menu/:id" element={<AdminMenuPage />} />
            <Route path="/admin/categories" element={<AdminCategoriesPage />} />
            <Route path="/admin/reservations" element={<AdminReservationsPage />} />
            <Route path="/admin/customers" element={<AdminUsersPage />} />
            <Route path="/admin/customers/:id" element={<AdminUsersPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/reviews" element={<AdminReviewsPage />} />
            <Route path="/admin/settings" element={<AdminSettingsPage />} />
          </Route>
        </Route>

        {/* ── 404 Fallback ── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
