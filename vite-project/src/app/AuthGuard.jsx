import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { authStorage } from '../services/storage/authStorage';

export function CustomerAuthGuard() {
  const location = useLocation();
  const authenticated = authStorage.getCustomerAuth();
  const relativePath = location.pathname.replace(/^\/customer\/?/, '') || 'home';
  const publicPrefixes = ['home', 'search', 'categories', 'offers', 'product/'];
  const isPublic = publicPrefixes.some(
    (prefix) => relativePath === prefix || relativePath.startsWith(prefix)
  );

  if (authenticated || isPublic) return <Outlet />;

  const from = `${location.pathname}${location.search}${location.hash}`;
  authStorage.setPendingRedirect(from);
  return <Navigate to={`/customer/signin?redirect=${encodeURIComponent(from)}`} replace state={{ from }} />;
}

export function DeliveryAuthGuard() {
  const location = useLocation();
  const ready = authStorage.getDeliveryAuth();
  return ready ? <Outlet /> : <Navigate to="/delivery/signin" replace state={{ from: location.pathname }} />;
}

export function AdminAuthGuard() {
  const location = useLocation();
  const ready = authStorage.getAdminAuth();
  return ready ? <Outlet /> : <Navigate to="/admin/signin" replace state={{ from: location.pathname }} />;
}

export function SupportAuthGuard() {
  const location = useLocation();
  const ready = authStorage.getSupportAuth();
  return ready ? <Outlet /> : <Navigate to="/support/signin" replace state={{ from: location.pathname }} />;
}
