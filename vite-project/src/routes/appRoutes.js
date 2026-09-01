export const customerRoutes = [
  '/customer/login', '/customer/signup', '/customer/signin', '/customer/verify-otp', '/customer/forgot-password', '/customer/location', '/customer/home', '/customer/search',
  '/customer/categories', '/customer/product/:id', '/customer/cart', '/customer/checkout', '/customer/payment', '/customer/order-success',
  '/customer/orders', '/customer/orders/:id', '/customer/track/:id', '/customer/profile', '/customer/notifications',
]

export const deliveryRoutes = [
  '/delivery/login', '/delivery/signup', '/delivery/signin', '/delivery/verification', '/delivery/onboarding-fee', '/delivery/application-submitted', '/delivery/dashboard', '/delivery/orders',
  '/delivery/orders/:id', '/delivery/navigation/:id', '/delivery/gigs', '/delivery/wallet', '/delivery/profile', '/delivery/notifications',
]

export const adminRoutes = [
  '/admin/login', '/admin/dashboard', '/admin/orders', '/admin/orders/:id', '/admin/products', '/admin/products/new', '/admin/products/:id/edit',
  '/admin/categories', '/admin/branches', '/admin/branches/new', '/admin/branches/:id', '/admin/branches/:id/duplicate', '/admin/customers',
  '/admin/delivery', '/admin/support', '/admin/reports',
]

export const supportRoutes = [
  '/support/login', '/support/dashboard', '/support/products', '/support/products/new', '/support/orders', '/support/orders/:id', '/support/issues',
]

export const prototypeRoutes = { customer: customerRoutes, delivery: deliveryRoutes, admin: adminRoutes, support: supportRoutes }
