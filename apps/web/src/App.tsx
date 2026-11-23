import { lazy, Suspense, type ComponentType } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Infrastructure
import { ScrollToTop } from './components/common/ScrollToTop';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { PageSpinner } from './components/ui/Spinner';

// Public layout is needed on first paint for most visits, so it stays eager.
import { PublicLayout } from './layouts/PublicLayout';

// Guards
import { RequireAuth } from './components/guards/RequireAuth';
import { RequireAdmin } from './components/guards/RequireAdmin';

// Every page is its own chunk. Named exports are re-mapped to default for lazy().
const named = <K extends string>(loader: () => Promise<Record<K, ComponentType>>, key: K) =>
  lazy(() => loader().then((m) => ({ default: m[key] })));

// Public pages
const HomePage = named(() => import('./pages/public/HomePage'), 'HomePage');
const MenuPage = named(() => import('./pages/public/MenuPage'), 'MenuPage');
const DishDetailPage = named(() => import('./pages/public/DishDetailPage'), 'DishDetailPage');
const CartPage = named(() => import('./pages/public/CartPage'), 'CartPage');
const CheckoutPage = named(() => import('./pages/public/CheckoutPage'), 'CheckoutPage');
const OrderConfirmationPage = named(() => import('./pages/public/OrderConfirmationPage'), 'OrderConfirmationPage');
const ReservationPage = named(() => import('./pages/public/ReservationPage'), 'ReservationPage');
const AboutPage = named(() => import('./pages/public/AboutPage'), 'AboutPage');
const ContactPage = named(() => import('./pages/public/ContactPage'), 'ContactPage');
const LoginPage = named(() => import('./pages/public/LoginPage'), 'LoginPage');
const RegisterPage = named(() => import('./pages/public/RegisterPage'), 'RegisterPage');

// Customer account
const AccountLayout = named(() => import('./layouts/AccountLayout'), 'AccountLayout');
const AccountOverviewPage = named(() => import('./pages/customer/AccountOverviewPage'), 'AccountOverviewPage');
const OrderHistoryPage = named(() => import('./pages/customer/OrderHistoryPage'), 'OrderHistoryPage');
const OrderDetailPage = named(() => import('./pages/customer/OrderDetailPage'), 'OrderDetailPage');
const ReservationHistoryPage = named(() => import('./pages/customer/ReservationHistoryPage'), 'ReservationHistoryPage');
const CustomerReviewsPage = named(() => import('./pages/customer/CustomerReviewsPage'), 'CustomerReviewsPage');

// Admin: layout and pages load only for admins
const AdminLayout = named(() => import('./layouts/AdminLayout'), 'AdminLayout');
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'));
const AdminOrdersPage = lazy(() => import('./pages/admin/AdminOrdersPage'));
const AdminOrderDetailPage = lazy(() => import('./pages/admin/AdminOrderDetailPage'));
const AdminMenuPage = lazy(() => import('./pages/admin/AdminMenuPage'));
const AdminCategoriesPage = lazy(() => import('./pages/admin/AdminCategoriesPage'));
const AdminReservationsPage = lazy(() => import('./pages/admin/AdminReservationsPage'));
const AdminReviewsPage = lazy(() => import('./pages/admin/AdminReviewsPage'));
const AdminSettingsPage = lazy(() => import('./pages/admin/AdminSettingsPage'));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'));

export default function App() {
  return (
    <>
      {/* Resets scroll position on every route change */}
      <ScrollToTop />

      <Suspense fallback={<PageSpinner />}>
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
      </Suspense>
    </>
  );
}
