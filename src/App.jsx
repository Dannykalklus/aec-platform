import { Link, Route, Routes } from 'react-router-dom'
import { PageHeader } from './components/Blocks'
import { ConsultationProvider } from './components/Consultation'
import Layout from './components/Layout'
import Contact from './pages/Contact'
import Faq from './pages/Faq'
import Home from './pages/Home'
import HowItWorks from './pages/HowItWorks'
import { Privacy, Refunds, Terms } from './pages/Legal'
import Order from './pages/Order'
import Pricing from './pages/Pricing'
import Services from './pages/Services'

function NotFound() {
  return (
    <PageHeader eyebrow="404" title="That page isn't here">
      <Link to="/" className="font-semibold text-scholar">Back to the home page</Link>
    </PageHeader>
  )
}

export default function App() {
  return (
    <ConsultationProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="services" element={<Services />} />
          <Route path="how-it-works" element={<HowItWorks />} />
          <Route path="pricing" element={<Pricing />} />
          <Route path="faq" element={<Faq />} />
          <Route path="contact" element={<Contact />} />
          <Route path="order" element={<Order />} />
          <Route path="terms" element={<Terms />} />
          <Route path="privacy" element={<Privacy />} />
          <Route path="refunds" element={<Refunds />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </ConsultationProvider>
  )
}
