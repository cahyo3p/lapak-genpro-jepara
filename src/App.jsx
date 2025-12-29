import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// --- IMPORT HALAMAN ---
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import ProductDetail from './pages/ProductDetail';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import OrderHistory from './pages/OrderHistory';
import CourierDashboard from './pages/CourierDashboard';
import ChatPage from './pages/ChatPage';

// --- IMPORT LISTENER NOTIFIKASI (BARU) ---
import NotificationListener from './NotificationListener'; 

function App() {
  return (
    <Router>
      
      {/* Pasang "Kuping Global" di sini agar aktif di semua halaman */}
      <NotificationListener />

      <Routes>
        {/* 1. HALAMAN PUBLIK */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        
        {/* 2. HALAMAN DETAIL & TRANSAKSI */}
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/checkout/:id" element={<Checkout />} />
        <Route path="/order-success/:orderId" element={<OrderSuccess />} />
        
        {/* 3. HALAMAN DASHBOARD */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/orders" element={<OrderHistory />} />
        <Route path="/courier" element={<CourierDashboard />} />

        {/* 4. HALAMAN CHAT */}
        <Route path="/chat/:orderId" element={<ChatPage />} />

      </Routes>
    </Router>
  );
}

export default App;