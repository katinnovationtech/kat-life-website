import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Contact from './pages/Contact';
import Cart from './pages/Cart';
import PreorderGuest from './pages/PreorderGuest';
import Signup from './pages/Signup';
import Login from './pages/Login';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import VerifyCode from './pages/VerifyCode';
import ChangePassword from './pages/ChangePassword';
import EmailVerified from './pages/EmailVerified';

// Admin — completely separate from regular site
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminPreOrders from './pages/admin/AdminPreOrders';
import AdminInventory from './pages/admin/AdminInventory';
import AdminUsers from './pages/admin/AdminUsers';
import AdminNewsletter from './pages/admin/AdminNewsletter';
import AdminMessages from './pages/admin/AdminMessages';
import AdminProtectedRoute from './pages/admin/AdminProtectedRoute';

function App() {
  return (
    <CartProvider>
    <Router>
      <Routes>
        {/* ── Regular Site ─────────────────────────────── */}
        <Route path="/" element={<Navigate to="/shop" replace />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/shop/:id" element={<ProductDetail />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/preorder-guest" element={<PreorderGuest />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-code" element={<VerifyCode />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/email-verified" element={<EmailVerified />} />

        {/* ── Admin (hidden from regular users) ────────── */}
        <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
        <Route path="/admin/preorders" element={<AdminProtectedRoute><AdminPreOrders /></AdminProtectedRoute>} />
        <Route path="/admin/inventory" element={<AdminProtectedRoute><AdminInventory /></AdminProtectedRoute>} />
        <Route path="/admin/users" element={<AdminProtectedRoute><AdminUsers /></AdminProtectedRoute>} />
        <Route path="/admin/newsletter" element={<AdminProtectedRoute><AdminNewsletter /></AdminProtectedRoute>} />
        <Route path="/admin/messages" element={<AdminProtectedRoute><AdminMessages /></AdminProtectedRoute>} />
      </Routes>
    </Router>
    </CartProvider>
  );
}

export default App;
