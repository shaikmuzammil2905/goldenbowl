/*
 * Legacy role-selection landing page intentionally disabled.
 *
 * The application now starts directly at the Customer panel.
 * Keep this file commented for reference so the old role launcher
 * does not become the public landing page again accidentally.
 *
 * Previous entry links:
 *   Customer: /customer/signin
 *   Delivery Partner: /delivery/signin
 *   Admin: /admin/dashboard
 *   Support: /support/dashboard
 *
 * import { Link } from 'react-router-dom'
 * import { Smartphone, Monitor, ArrowRight } from 'lucide-react'
 *
 * const BOWL_LOGO = 'https://res.cloudinary.com/dwmjz9csc/image/upload/v1787120716/image-removebg-preview_e1wfil.png'
 *
 * export function PrototypeHome() {
 *   return <div className="prototype-launcher"><div className="launcher-card"><div className="launcher-logo"><img src={BOWL_LOGO} alt="Golden Food Bowl" /></div><h1>Golden Food Bowl</h1><p>Choose a role to explore the connected food ordering ecosystem.</p><div className="role-grid"><Link to="/customer/signin"><Smartphone/><strong>Customer</strong><small>Sign in / create account</small><ArrowRight/></Link><Link to="/delivery/signin"><Smartphone/><strong>Delivery Partner</strong><small>Sign in / join Bowl</small><ArrowRight/></Link><Link to="/admin/dashboard"><Monitor/><strong>Admin</strong><small>Desktop operations</small><ArrowRight/></Link><Link to="/support/dashboard"><Monitor/><strong>Support</strong><small>Desktop support desk</small><ArrowRight/></Link></div></div></div>
 * }
 */
