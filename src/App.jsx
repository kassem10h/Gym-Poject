import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import Index from "./pages/Index";
import Navigation from "./components/Navbar";
import Footer from "./components/Footer";
import Dashboard from "./pages/Dashboard";
import LoginPage from "./pages/Login";
import SignUpPage from "./pages/Signup";
import AdminLogin from "./pages/admin/AdminLogin";
import CheckoutPage from "./pages/checkout/Checkout";
import CheckoutSuccessPage from "./pages/checkout/CheckoutSuccess";

function AppContent() {
  const location = useLocation();
  
  // Routes that should not show navbar and footer
  const noLayoutRoutes = ['/login', '/signup', '/admin/login'];
  const isDashboardRoute = location.pathname.includes('/dashboard');
  
  const shouldShowLayout = !noLayoutRoutes.includes(location.pathname) && !isDashboardRoute;

  return (
    <>
      {shouldShowLayout && <Navigation />}

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
        
        {/* Dashboard Routes */}
        <Route path="/admin/dashboard" element={<Dashboard />} />
        <Route path="/admin/dashboard/:tab" element={<Dashboard />} />
        <Route path="/member/dashboard" element={<Dashboard />} />
        <Route path="/member/dashboard/:tab" element={<Dashboard />} />
        <Route path="/trainer/dashboard" element={<Dashboard />} />
        <Route path="/trainer/dashboard/:tab" element={<Dashboard />} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {shouldShowLayout && <Footer />}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;