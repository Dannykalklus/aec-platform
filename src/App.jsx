import { lazy, Suspense } from 'react'
import { Link, Route, Routes } from 'react-router-dom'
import { PageHeader } from './components/Blocks'
import { ConsultationProvider } from './components/Consultation'
import Layout from './components/Layout'
import { AuthProvider } from './lib/auth'
import Account from './pages/Account'
import { Login, ResetPassword, Signup } from './pages/Auth'
import Contact from './pages/Contact'
import Faq from './pages/Faq'
import Home from './pages/Home'
import HowItWorks from './pages/HowItWorks'
import { Privacy, Refunds, Terms } from './pages/Legal'
import Order from './pages/Order'
import OrderView from './pages/OrderView'
import Pricing from './pages/Pricing'
import Services from './pages/Services'

// The admin area (and its PDF library) loads only for the admin.
const admin = () => import('./pages/Admin')
const AdminLayout = lazy(() => admin().then((m) => ({ default: m.AdminLayout })))
const AdminDashboard = lazy(() => admin().then((m) => ({ default: m.AdminDashboard })))
const AdminOrders = lazy(() => admin().then((m) => ({ default: m.AdminOrders })))
const AdminOrder = lazy(() => admin().then((m) => ({ default: m.AdminOrder })))
const AdminPayments = lazy(() => admin().then((m) => ({ default: m.AdminPayments })))
const AdminLeads = lazy(() => admin().then((m) => ({ default: m.AdminLeads })))

function NotFound() {
  return (
    <PageHeader eyebrow="404" title="That page isn't here">
      <Link to="/" className="font-semibold text-scholar">Back to the home page</Link>
    </PageHeader>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ConsultationProvider>
        <Suspense fallback={<div className="wrap py-20 text-slate">Loading…</div>}>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="services" element={<Services />} />
              <Route path="how-it-works" element={<HowItWorks />} />
              <Route path="pricing" element={<Pricing />} />
              <Route path="faq" element={<Faq />} />
              <Route path="contact" element={<Contact />} />
              <Route path="order" element={<Order />} />
              <Route path="orders/:orderNumber" element={<OrderView />} />
              <Route path="o/:orderNumber" element={<OrderView />} />
              <Route path="login" element={<Login />} />
              <Route path="signup" element={<Signup />} />
              <Route path="reset-password" element={<ResetPassword />} />
              <Route path="account" element={<Account />} />
              <Route path="admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="orders/:id" element={<AdminOrder />} />
                <Route path="payments" element={<AdminPayments />} />
                <Route path="leads" element={<AdminLeads />} />
              </Route>
              <Route path="terms" element={<Terms />} />
              <Route path="privacy" element={<Privacy />} />
              <Route path="refunds" element={<Refunds />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </Suspense>
      </ConsultationProvider>
    </AuthProvider>
  )
}
