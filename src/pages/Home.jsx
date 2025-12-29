import React, { useEffect, useState } from 'react';
import { Search, LogIn, User as UserIcon, LayoutDashboard, ShoppingBag } from 'lucide-react'; // Tambah icon ShoppingBag
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [user, setUser] = useState(null); 

  useEffect(() => {
    fetchProducts();
    checkUser();
  }, []);

  // 1. Cek User Session + Cek Role
  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Fetch juga role dari tabel profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      // Gabungkan data user auth dengan role
      setUser({ ...user, role: profile?.role });
    } else {
      setUser(null);
    }
  }

  // 2. Ambil produk dari database
  async function fetchProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('*, profiles(nama_lengkap, nomor_wa)')
      .order('created_at', { ascending: false });
    
    if (data) setProducts(data);
    if (error) console.log('Error ambil produk:', error.message);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* --- NAVBAR --- */}
      <nav className="bg-white shadow-sm p-4 sticky top-0 z-20 border-b border-genpro-maroon/10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* Logo */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <img src="/logo-genpro.png" alt="Logo Genpro" className="h-10" />
            <div>
              <h1 className="font-bold text-xl text-genpro-maroon leading-none">GENPRO</h1>
              <p className="text-xs text-genpro-orange font-semibold tracking-wider">CHAPTER JEPARA</p>
            </div>
          </div>
          
          {/* Menu Navigasi */}
          <div className="flex gap-3 w-full md:w-auto justify-center md:justify-end overflow-x-auto pb-2 md:pb-0">
            {user ? (
              // Jika SUDAH login
              <div className="flex items-center gap-3">
                
                {/* TOMBOL KHUSUS ADMIN (Hanya muncul jika Role == 'admin') */}
                {user.role === 'admin' && (
                  <Link to="/admin" className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-full font-bold hover:bg-black transition shadow-sm border border-gray-700 text-xs md:text-sm whitespace-nowrap">
                    <LayoutDashboard size={16} /> Admin
                  </Link>
                )}

                {/* TOMBOL PESANAN SAYA (Fitur Baru untuk Pembeli) */}
                <Link to="/orders" className="flex items-center gap-2 bg-white text-genpro-maroon border border-genpro-maroon px-4 py-2 rounded-full font-bold hover:bg-gray-50 transition shadow-sm text-xs md:text-sm whitespace-nowrap">
                  <ShoppingBag size={16} /> Pesanan Saya
                </Link>

                {/* Tombol Dashboard Penjual (Muncul untuk semua member) */}
                <Link to="/dashboard" className="flex items-center gap-2 bg-genpro-orange text-genpro-maroon px-4 py-2 rounded-full font-bold hover:bg-yellow-400 transition shadow-sm text-xs md:text-sm whitespace-nowrap">
                  <UserIcon size={16} /> Dashboard Saya
                </Link>
              </div>
            ) : (
              // Jika BELUM login
              <Link to="/login" className="flex items-center gap-2 text-gray-600 hover:text-genpro-orange transition-colors font-medium text-sm">
                <LogIn size={20} /> Masuk / Daftar
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <div className="bg-genpro-maroon text-white py-12 md:py-16 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-500 to-transparent"></div>
        <div className="relative z-10">
          <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">Beli di Tetangga, <br/><span className="text-genpro-orange">Rezeki Tetap Terjaga</span></h1>
          <p className="text-sm md:text-lg text-gray-200 max-w-2xl mx-auto">
            Marketplace resmi komunitas pengusaha Genpro Chapter Jepara. Saling dukung, saling larisi, berkah bersama.
          </p>
        </div>
      </div>

      {/* --- PRODUK LIST --- */}
      <div className="max-w-6xl mx-auto p-4 mt-8 pb-20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-genpro-maroon border-b-4 border-genpro-orange inline-block pb-1">
            Produk Terbaru Anggota
          </h2>
        </div>
        
        {products.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="text-gray-300 mb-4 flex justify-center"><Search size={48} /></div>
            <p className="text-gray-500 text-lg">Belum ada produk yang dipajang.</p>
            <p className="text-genpro-orange font-semibold mt-2">Jadilah yang pertama membuka lapak!</p>
            {user && (
              <Link to="/dashboard" className="mt-4 inline-block text-genpro-maroon underline hover:text-genpro-orange">
                Upload Produk Sekarang
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {products.map((item) => (
              // Link Pembungkus Kartu
              <Link to={`/product/${item.id}`} key={item.id} className="block group">
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col">
                  
                  {/* Foto Produk */}
                  <div className="relative h-40 md:h-48 overflow-hidden bg-gray-100">
                     <img 
                      src={item.foto_url || 'https://via.placeholder.com/300x300?text=No+Image'} 
                      alt={item.nama_produk} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-2 right-2 bg-white/90 px-2 py-1 rounded text-[10px] font-bold text-gray-600 shadow-sm backdrop-blur-sm">
                      Stok: {item.stok}
                    </div>
                  </div>

                  {/* Info Produk */}
                  <div className="p-3 md:p-4 flex flex-col flex-1">
                    <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                      <UserIcon size={12}/> {item.profiles?.nama_lengkap || 'Penjual'}
                    </div>
                    <h3 className="font-bold text-gray-800 truncate text-sm md:text-lg mb-1" title={item.nama_produk}>
                      {item.nama_produk}
                    </h3>
                    <p className="text-genpro-orange font-bold text-base md:text-xl mt-auto">
                      Rp {item.harga.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}