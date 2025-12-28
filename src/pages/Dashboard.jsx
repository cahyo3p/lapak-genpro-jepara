import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Package, Plus, Trash2, LogOut, ShoppingBag, Settings, Save, CheckCircle, XCircle } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('produk'); // Tabs: 'produk', 'orders', 'settings'

  // DATA STATES
  const [myProducts, setMyProducts] = useState([]);
  const [incomingOrders, setIncomingOrders] = useState([]);
  const [profile, setProfile] = useState({
    nama_lengkap: '', nomor_wa: '', nama_bank: '', no_rekening: ''
  });

  // FORM STATES (PRODUK)
  const [nama, setNama] = useState('');
  const [harga, setHarga] = useState('');
  const [stok, setStok] = useState('');
  const [fileGambar, setFileGambar] = useState(null);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      navigate('/login');
    } else {
      setUser(data.user);
      fetchMyProducts(data.user.id);
      fetchIncomingOrders(data.user.id);
      fetchProfile(data.user.id);
    }
  }

  // --- 1. LOGIC PRODUK ---
  async function fetchMyProducts(userId) {
    const { data } = await supabase.from('products').select('*').eq('penjual_id', userId).order('created_at', { ascending: false });
    if (data) setMyProducts(data);
  }

  async function handleAddProduct(e) {
    e.preventDefault();
    setLoading(true);
    try {
      let publicUrl = null;
      if (fileGambar) {
        const fileName = `${Date.now()}_${fileGambar.name}`;
        const { error: uploadError } = await supabase.storage.from('images').upload(fileName, fileGambar);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('images').getPublicUrl(fileName);
        publicUrl = data.publicUrl;
      }

      const { error } = await supabase.from('products').insert([{
        penjual_id: user.id, nama_produk: nama, harga: parseInt(harga), stok: parseInt(stok), foto_url: publicUrl
      }]);

      if (error) throw error;
      alert('Produk berhasil ditambahkan!');
      setNama(''); setHarga(''); setStok(''); setFileGambar(null);
      fetchMyProducts(user.id);
    } catch (error) {
      alert('Gagal: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteProduct(id) {
    if(!confirm("Hapus produk ini?")) return;
    await supabase.from('products').delete().eq('id', id);
    fetchMyProducts(user.id);
  }

  // --- 2. LOGIC ORDER ---
  async function fetchIncomingOrders(userId) {
    // Ambil order dimana saya adalah penjualnya
    const { data, error } = await supabase
      .from('orders')
      .select('*, profiles:pembeli_id(nama_lengkap, nomor_wa)')
      .eq('penjual_id', userId)
      .order('created_at', { ascending: false });
    
    if (data) setIncomingOrders(data);
  }

  async function updateStatusOrder(orderId, newStatus) {
    if(!confirm(`Ubah status jadi ${newStatus}?`)) return;
    
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (!error) {
      fetchIncomingOrders(user.id); // Refresh data
    } else {
      alert('Gagal update status');
    }
  }

  // --- 3. LOGIC PROFILE (BANK) ---
  async function fetchProfile(userId) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) {
      setProfile({
        nama_lengkap: data.nama_lengkap || '',
        nomor_wa: data.nomor_wa || '',
        nama_bank: data.nama_bank || '',
        no_rekening: data.no_rekening || ''
      });
    }
  }

  async function handleUpdateProfile(e) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update(profile)
      .eq('id', user.id);

    if (!error) alert("Profil Toko & Rekening Berhasil Disimpan!");
    else alert("Gagal simpan: " + error.message);
    setLoading(false);
  }

  // --- RENDER UI ---
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-genpro-maroon text-white p-6 shadow-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Package /> Dapur Penjual
            </h1>
            <p className="text-genpro-orange text-sm mt-1">Kelola bisnis Anda di sini</p>
          </div>
          <button onClick={() => { supabase.auth.signOut(); navigate('/'); }} className="flex items-center gap-2 bg-red-800/50 hover:bg-red-800 px-4 py-2 rounded transition text-sm">
            <LogOut size={16}/> Keluar
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-5xl mx-auto mt-6 px-4">
        <div className="flex bg-white rounded-lg shadow-sm p-1 overflow-x-auto">
          <button onClick={() => setActiveTab('produk')} className={`flex-1 py-3 px-4 rounded-md font-bold flex justify-center items-center gap-2 transition ${activeTab === 'produk' ? 'bg-genpro-orange text-genpro-maroon shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}>
            <Package size={18}/> Produk Saya
          </button>
          <button onClick={() => setActiveTab('orders')} className={`flex-1 py-3 px-4 rounded-md font-bold flex justify-center items-center gap-2 transition ${activeTab === 'orders' ? 'bg-genpro-orange text-genpro-maroon shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}>
            <ShoppingBag size={18}/> Pesanan Masuk 
            {incomingOrders.some(o => o.status === 'menunggu_bayar') && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
          </button>
          <button onClick={() => setActiveTab('settings')} className={`flex-1 py-3 px-4 rounded-md font-bold flex justify-center items-center gap-2 transition ${activeTab === 'settings' ? 'bg-genpro-orange text-genpro-maroon shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}>
            <Settings size={18}/> Pengaturan Toko
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 mt-2">
        
        {/* === TAB 1: PRODUK === */}
        {activeTab === 'produk' && (
          <div className="grid md:grid-cols-3 gap-6">
            {/* Form Input */}
            <div className="md:col-span-1">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h2 className="font-bold text-gray-800 mb-4 pb-2 border-b">Tambah Produk</h2>
                <form onSubmit={handleAddProduct} className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-gray-500">Nama Produk</label>
                    <input required type="text" className="w-full border p-2 rounded focus:ring-1 focus:ring-genpro-orange outline-none" 
                      value={nama} onChange={e => setNama(e.target.value)} placeholder="Nama barang..."/>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-bold text-gray-500">Harga</label>
                      <input required type="number" className="w-full border p-2 rounded focus:ring-1 focus:ring-genpro-orange outline-none" 
                        value={harga} onChange={e => setHarga(e.target.value)}/>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500">Stok</label>
                      <input required type="number" className="w-full border p-2 rounded focus:ring-1 focus:ring-genpro-orange outline-none" 
                        value={stok} onChange={e => setStok(e.target.value)}/>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500">Foto</label>
                    <input required type="file" accept="image/*" onChange={e => setFileGambar(e.target.files[0])} 
                      className="w-full text-xs text-gray-500 file:mr-2 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-orange-50 file:text-genpro-orange hover:file:bg-orange-100"/>
                  </div>
                  <button disabled={loading} type="submit" className="w-full bg-genpro-maroon text-white font-bold py-2 rounded hover:bg-red-900 transition flex justify-center items-center gap-2">
                    {loading ? 'Upload...' : <><Plus size={16}/> Upload</>}
                  </button>
                </form>
              </div>
            </div>
            {/* List Produk */}
            <div className="md:col-span-2 space-y-3">
              {myProducts.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-lg border border-dashed text-gray-400">Belum ada produk.</div>
              ) : myProducts.map(item => (
                <div key={item.id} className="bg-white p-3 rounded-lg shadow-sm border flex gap-3 items-center">
                  <img src={item.foto_url} className="w-16 h-16 object-cover rounded bg-gray-100" />
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800">{item.nama_produk}</h3>
                    <p className="text-sm text-gray-500">Rp {item.harga.toLocaleString()} | Stok: {item.stok}</p>
                  </div>
                  <button onClick={() => handleDeleteProduct(item.id)} className="text-gray-400 hover:text-red-600 p-2"><Trash2 size={18}/></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* === TAB 2: PESANAN MASUK === */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {incomingOrders.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-xl shadow-sm"><p className="text-gray-500">Belum ada pesanan masuk.</p></div>
            ) : incomingOrders.map(order => (
              <div key={order.id} className="bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-xs text-gray-500">Order ID: #{order.id}</p>
                    <p className="font-bold text-lg text-genpro-maroon">Rp {order.total_harga.toLocaleString()}</p>
                    <p className="text-sm text-gray-600 mt-1">Pembeli: <span className="font-bold">{order.profiles?.nama_lengkap}</span> ({order.profiles?.nomor_wa})</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize 
                    ${order.status === 'menunggu_bayar' ? 'bg-yellow-100 text-yellow-700' : 
                      order.status === 'diproses' ? 'bg-blue-100 text-blue-700' : 
                      order.status === 'selesai' ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>
                    {order.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Detail Barang JSON */}
                <div className="bg-gray-50 p-3 rounded-lg mb-4 text-sm">
                  {order.items_json.map((item, idx) => (
                    <div key={idx} className="flex justify-between border-b last:border-0 border-gray-200 py-1">
                      <span>{item.nama_produk} <span className="text-gray-400">x{item.qty}</span></span>
                      <span>Rp {(item.harga * item.qty).toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-bold mt-2 pt-2 border-t border-gray-300">
                    <span>Fee Organisasi (3%)</span>
                    <span className="text-red-500">- Rp {order.fee_organisasi.toLocaleString()}</span>
                  </div>
                </div>

                {/* Tombol Aksi */}
                <div className="flex gap-2 justify-end">
                  {order.status === 'menunggu_bayar' && (
                    <button onClick={() => updateStatusOrder(order.id, 'diproses')} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700">
                      Terima & Proses
                    </button>
                  )}
                  {order.status === 'diproses' && (
                    <button onClick={() => updateStatusOrder(order.id, 'dikirim')} className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-orange-600">
                      Barang Dikirim
                    </button>
                  )}
                  {order.status === 'dikirim' && (
                    <div className="text-sm text-gray-500 italic">Menunggu pembeli konfirmasi terima...</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* === TAB 3: PENGATURAN === */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="font-bold text-gray-800 mb-6 flex items-center gap-2 text-xl">
                <Settings className="text-genpro-orange"/> Pengaturan Toko & Rekening
              </h2>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-bold text-gray-600 mb-1 block">Nama Lengkap</label>
                    <input type="text" className="w-full border p-3 rounded-lg bg-gray-50" 
                      value={profile.nama_lengkap} onChange={e => setProfile({...profile, nama_lengkap: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-600 mb-1 block">Nomor WA</label>
                    <input type="text" className="w-full border p-3 rounded-lg bg-gray-50" 
                      value={profile.nomor_wa} onChange={e => setProfile({...profile, nomor_wa: e.target.value})} />
                  </div>
                </div>

                <div className="border-t border-gray-200 my-4 pt-4">
                  <p className="text-genpro-maroon text-sm font-bold mb-3 bg-red-50 p-2 rounded inline-block">
                    Rekening Penerimaan Uang (Wajib Diisi)
                  </p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-bold text-gray-600 mb-1 block">Nama Bank / E-Wallet</label>
                      <input placeholder="Contoh: BCA / DANA" type="text" className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-genpro-orange outline-none" 
                        value={profile.nama_bank} onChange={e => setProfile({...profile, nama_bank: e.target.value})} required />
                    </div>
                    <div>
                      <label className="text-sm font-bold text-gray-600 mb-1 block">Nomor Rekening</label>
                      <input placeholder="Contoh: 1234567890" type="text" className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-genpro-orange outline-none font-mono" 
                        value={profile.no_rekening} onChange={e => setProfile({...profile, no_rekening: e.target.value})} required />
                    </div>
                  </div>
                </div>

                <button disabled={loading} type="submit" className="w-full bg-genpro-maroon text-white font-bold py-3 rounded-lg hover:bg-red-900 transition flex justify-center items-center gap-2 shadow-lg">
                  {loading ? 'Menyimpan...' : <><Save size={18}/> Simpan Perubahan</>}
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}