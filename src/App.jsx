import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// --- IMPORT SEMUA HALAMAN ---
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';           // Dashboard Penjual
import AdminDashboard from './pages/AdminDashboard'; // Dashboard Admin (Ketua)
import ProductDetail from './pages/ProductDetail';   // Halaman Detail Produk
import Checkout from './pages/Checkout';             // Halaman Konfirmasi Beli
import OrderSuccess from './pages/OrderSuccess';     // Halaman Instruksi Bayar

function App() {
  return (
    <Router>
      <Routes>
        {/* 1. HALAMAN PUBLIK */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        
        {/* 2. HALAMAN DETAIL & TRANSAKSI */}
        {/* :id menandakan parameter dinamis (misal: /product/123) */}
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/checkout/:id" element={<Checkout />} />
        <Route path="/order-success/:orderId" element={<OrderSuccess />} />
        
        {/* 3. HALAMAN KHUSUS PENJUAL */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* 4. HALAMAN KHUSUS ADMIN ORGANISASI */}
        {/* Hanya bisa diakses jika role user di database = 'admin' */}
        <Route path="/admin" element={<AdminDashboard />} />

      </Routes>
    </Router>
  );
}

export default App;