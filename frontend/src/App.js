import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Contact from './pages/Contact';
import Cart from './pages/Cart';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/shop" replace />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/shop/:id" element={<ProductDetail />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/cart" element={<Cart />} />
      </Routes>
    </Router>
  );
}

export default App;
