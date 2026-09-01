import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import '../styles/customer-final-overrides.css';
import { authStorage } from '../services/storage/authStorage';
import { CustomerLayout } from '../layouts/CustomerLayout';
import { DeliveryLayout } from '../layouts/DeliveryLayout';
import { AdminLayout } from '../layouts/AdminLayout';
import { SupportLayout } from '../layouts/SupportLayout';
import { GoldenCustomerHome } from '../pages/customer/GoldenCustomerHome';
import { CustomerSearchPage } from '../pages/customer/CustomerSearchPage';
import { CustomerOrdersPage } from '../pages/customer/CustomerOrdersPage';
import { CustomerCartPage } from '../pages/customer/CustomerCartPage';
import { CustomerCheckoutPage } from '../pages/customer/CustomerCheckoutPage';
import { CustomerTrackingPage } from '../pages/customer/CustomerTrackingPage';
import { CustomerProfilePage } from '../pages/customer/CustomerProfilePage';
import { CustomerProductPage } from '../pages/customer/CustomerProductPage';
import {
  CustomerCategoriesPage,
  CustomerPaymentPage,
  CustomerSuccessPage,
  CustomerNotificationsPage,
  CustomerOffersPage,
} from '../pages/customer/CustomerSecondaryPages';
import { DeliveryDashboardPage } from '../pages/delivery/DeliveryDashboardPage';
import { DeliveryOrdersPage } from '../pages/delivery/DeliveryOrdersPage';
import { DeliveryOrderDetailsPage } from '../pages/delivery/DeliveryOrderDetailsPage';
import { DeliveryNavigationPage } from '../pages/delivery/DeliveryNavigationPage';
import { DeliveryGigsPage } from '../pages/delivery/DeliveryGigsPage';
import { DeliveryWalletPage } from '../pages/delivery/DeliveryWalletPage';
import { DeliveryProfilePage } from '../pages/delivery/DeliveryProfilePage';
import { DeliveryNotificationsPage } from '../pages/delivery/DeliveryNotificationsPage';
import { SupportDashboardPage } from '../pages/support/SupportDashboardPage';
import { SupportOrdersPage } from '../pages/support/SupportOrdersPage';
import { SupportProductsPage } from '../pages/support/SupportProductsPage';
import { SupportIssuesPage } from '../pages/support/SupportIssuesPage';
import { SupportAgentsPage } from '../pages/support/SupportAgentsPage';
import { SupportNotificationsPage } from '../pages/support/SupportNotificationsPage';
import {
  CustomerSignUpPage,
  CustomerSignInPage,
  CustomerVerifyOtpPage,
  CustomerForgotPasswordPage,
  CustomerLocationPage,
  DeliverySignUpPage,
  DeliveryVerificationPage,
  DeliveryFeePage,
  DeliveryApplicationSubmittedPage,
} from '../pages/auth/AuthPages';
import { DeliveryPartnerSignInPage } from '../pages/auth/DeliveryPartnerSignInPage';
import { DeliveryLocationPage } from '../pages/auth/DeliveryLocationPage';
import { AdminSignInPage } from '../pages/admin/AdminSignInPage';
import { SupportSignInPage } from '../pages/support/SupportSignInPage';
import { DeliveryAuthGuard, AdminAuthGuard, SupportAuthGuard } from './AuthGuard';
import { DashboardPage } from '../pages/admin/DashboardPage';
import { OrdersPage } from '../pages/admin/OrdersPage';
import { ProductsPage } from '../pages/admin/ProductsPage';
import { CategoriesPage } from '../pages/admin/CategoriesPage';
import { BranchesPage } from '../pages/admin/BranchesPage';
import { CustomersPage } from '../pages/admin/CustomersPage';
import { DeliveryPage as AdminDeliveryPage } from '../pages/admin/DeliveryPage';
import { SupportPage as AdminSupportPage } from '../pages/admin/SupportPage';
import { ReportsPage } from '../pages/admin/ReportsPage';
import { NotificationsPage } from '../pages/admin/NotificationsPage';

function CustomerBrowseGuard() {
  const location = useLocation();
  const authenticated = authStorage.getCustomerAuth();
  const relativePath = location.pathname.replace(/^\/customer\/?/, '') || 'home';
  const protectedPrefixes = ['checkout', 'payment', 'profile', 'orders', 'track', 'notifications'];
  const isProtected = protectedPrefixes.some(
    (prefix) => relativePath === prefix || relativePath.startsWith(prefix + '/')
  );
  if (authenticated || !isProtected) return <Outlet />;
  const from = `${location.pathname}${location.search}${location.hash}`;
  authStorage.setPendingRedirect(from);
  return <Navigate to={`/customer/signin?redirect=${encodeURIComponent(from)}`} replace state={{ from }} />;
}

function CustomerHomeEntry() {
  const authenticated = authStorage.getCustomerAuth();
  if (authenticated) {
    const pending = authStorage.getPendingRedirect();
    if (pending) {
      authStorage.clearPendingRedirect();
      return <Navigate to={pending} replace />;
    }
  }
  return <GoldenCustomerHome />;
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/customer/home" replace />} />
      <Route path="/customer/auth" element={<Navigate to="/customer/home" replace />} />
      <Route path="/customer/signin" element={<CustomerSignInPage />} />
      <Route path="/customer/signup" element={<CustomerSignUpPage />} />
      <Route path="/customer/verify-otp" element={<CustomerVerifyOtpPage />} />
      <Route path="/customer/forgot-password" element={<CustomerForgotPasswordPage />} />
      <Route path="/customer/location" element={<CustomerLocationPage />} />
      <Route path="/customer" element={<CustomerBrowseGuard />}>
        <Route element={<CustomerLayout />}>
          <Route index element={<CustomerHomeEntry />} />
          <Route path="home" element={<CustomerHomeEntry />} />
          <Route path="search" element={<CustomerSearchPage />} />
          <Route path="categories" element={<CustomerCategoriesPage />} />
          <Route path="orders" element={<CustomerOrdersPage />} />
          <Route path="orders/:id" element={<CustomerOrdersPage />} />
          <Route path="product/:id" element={<CustomerProductPage />} />
          <Route path="offers" element={<CustomerOffersPage />} />
          <Route path="profile" element={<CustomerProfilePage />} />
          <Route path="cart" element={<CustomerCartPage />} />
          <Route path="checkout" element={<CustomerCheckoutPage />} />
          <Route path="payment" element={<CustomerPaymentPage />} />
          <Route path="order-success" element={<CustomerSuccessPage />} />
          <Route path="track/:id" element={<CustomerTrackingPage />} />
          <Route path="notifications" element={<CustomerNotificationsPage />} />
        </Route>
      </Route>
      <Route path="/delivery/onboarding" element={<Navigate to="/delivery/signup" replace />} />
      <Route path="/delivery/signin" element={<DeliveryPartnerSignInPage />} />
      <Route path="/delivery/signup" element={<DeliverySignUpPage />} />
      <Route path="/delivery/verification" element={<DeliveryVerificationPage />} />
      <Route path="/delivery/onboarding-fee" element={<DeliveryLocationPage />} />
      <Route path="/delivery/onboarding-fee/payment" element={<DeliveryFeePage />} />
      <Route path="/delivery/application-submitted" element={<DeliveryApplicationSubmittedPage />} />
      <Route path="/delivery" element={<DeliveryAuthGuard />}>
        <Route element={<DeliveryLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DeliveryDashboardPage />} />
          <Route path="orders" element={<DeliveryOrdersPage />} />
          <Route path="orders/:id" element={<DeliveryOrderDetailsPage />} />
          <Route path="navigation/:id" element={<DeliveryNavigationPage />} />
          <Route path="gigs" element={<DeliveryGigsPage />} />
          <Route path="wallet" element={<DeliveryWalletPage />} />
          <Route path="profile" element={<DeliveryProfilePage />} />
          <Route path="notifications" element={<DeliveryNotificationsPage />} />
        </Route>
      </Route>
      <Route path="/admin/signin" element={<AdminSignInPage />} />
      <Route path="/admin/login" element={<AdminSignInPage />} />
      <Route path="/admin" element={<AdminAuthGuard />}>
        <Route element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="branches" element={<BranchesPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="delivery" element={<AdminDeliveryPage />} />
          <Route path="support" element={<AdminSupportPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
        </Route>
      </Route>
      <Route path="/support/signin" element={<SupportSignInPage />} />
      <Route path="/support/login" element={<SupportSignInPage />} />
      <Route path="/support" element={<SupportAuthGuard />}>
        <Route element={<SupportLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<SupportDashboardPage />} />
          <Route path="orders" element={<SupportOrdersPage />} />
          <Route path="products" element={<SupportProductsPage />} />
          <Route path="issues" element={<SupportIssuesPage />} />
          <Route path="agents" element={<SupportAgentsPage />} />
          <Route path="notifications" element={<SupportNotificationsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/customer/home" replace />} />
    </Routes>
  );
}