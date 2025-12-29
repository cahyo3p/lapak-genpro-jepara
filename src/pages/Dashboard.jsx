import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Package, Plus, Trash2, LogOut, ShoppingBag, Settings, Save, ArrowLeft, Edit, XCircle, MessageCircle } from 'lucide-react';
import imageCompression from 'browser-image-compression'; 

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('produk'); 

  // DATA STATES
  const [myProducts, setMyProducts] = useState([]);
  const [incomingOrders, setIncomingOrders] = useState([]);
  const [profile, setProfile] = useState({ nama_lengkap: '', nomor_wa: '', nama_bank: '', no_rekening: '' });

  // FORM STATES
  const [editingId, setEditingId] = useState(null);
  const [nama, setNama] = useState('');
  const [harga, setHarga] = useState('');
  const [stok, setStok] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [fileGambar, setFileGambar] = useState(null);

  useEffect(() => { checkUser(); }, []);

  async function checkUser() {
    const { data } = await supabase.auth.getUser();
    if (!data.user) { navigate('/login'); } else {
      setUser(data.user);
      fetchMyProducts(data.user.id);
      fetchIncomingOrders(data.user.id);
      fetchProfile(data.user.id);
    }
  }

  // --- REALTIME LISTENER UNTUK ORDER MASUK ---
  useEffect(() => {
    if(!user) return;
    const channel = supabase.channel('public:orders:seller')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `penjual_id=eq.${user.id}` }, 
      () => { fetchIncomingOrders(user.id); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);


  async function fetchMyProducts(userId) {
    const { data } = await supabase.from('products').select('*').eq('penjual_id', userId).order('created_at', { ascending: false });
    if (data) setMyProducts(data);
  }

  function handleEditClick(item) {
    setEditingId(item.id); setNama(item.nama_produk); setHarga(item.harga); setStok(item.stok); setDeskripsi(item.deskripsi || ''); setVideoUrl(item.video_url || ''); setFileGambar(null); 
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleCancelEdit() {
    setEditingId(null); setNama(''); setHarga(''); setStok(''); setDeskripsi(''); setVideoUrl(''); setFileGambar(null);
  }

  async function handleSaveProduct(e) {
    e.preventDefault(); setLoading(true);
    try {
      let publicUrl = null;
      if (fileGambar) {
        const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true }
        try { var fileToUpload = await imageCompression(fileGambar, options); } catch { var fileToUpload = fileGambar; }
        const fileName = `${Date.now()}_${fileToUpload.name}`;
        const { error: uploadError } = await supabase.storage.from('images').upload(fileName, fileToUpload);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('images').getPublicUrl(fileName);
        publicUrl = data.publicUrl;
      }
      const productData = { penjual_id: user.id, nama_produk: nama, harga: parseInt(harga), stok: parseInt(stok), deskripsi: deskripsi, video_url: videoUrl };
      if (publicUrl) productData.foto_url = publicUrl;

      if (editingId) {
        await supabase.from('products').update(productData).eq('id', editingId);
        alert('Produk berhasil diperbarui!'); setEditingId(null);
      } else {
        if (!publicUrl) throw new Error("Wajib upload foto!");
        await supabase.from('products').insert([productData]);
        alert('Produk berhasil ditambahkan!');
      }
      handleCancelEdit(); fetchMyProducts(user.id);
    } catch (error) { alert('Gagal: ' + error.message); } finally { setLoading(false); }
  }

  async function handleDeleteProduct(id) {
    if(!confirm("Yakin hapus?")) return;
    await supabase.from('products').delete().eq('id', id); fetchMyProducts(user.id);
  }

  async function fetchIncomingOrders(userId) {
    const { data } = await supabase.from('orders').select('*, profiles:pembeli_id(nama_lengkap, nomor_wa)').eq('penjual_id', userId).order('created_at', { ascending: false });
    if (data) setIncomingOrders(data);
  }

  async function updateStatusOrder(orderId, newStatus) {
    if(!confirm(`Ubah status jadi ${newStatus}?`)) return;
    await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    fetchIncomingOrders(user.id);
  }

  async function handleUpdateProfile(e) {
    e.preventDefault(); setLoading(true);
    const { error } = await supabase.from('profiles').update(profile).eq('id', user.id);
    if (!error) alert("Profil tersimpan!"); else alert("Gagal: " + error.message); setLoading(false);
  }
  
  async function fetchProfile(userId) {
     const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
     if (data) setProfile({ nama_lengkap: data.nama_lengkap || '', nomor_wa: data.nomor_wa || '', nama_bank: data.nama_bank || '', no_rekening: data.no_rekening || '' });
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-genpro-maroon text-white p-6 shadow-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <h1 className="text-2xl font-bold flex items-center justify-center md:justify-start gap-2"><Package /> Dapur Penjual</h1>
            <p className="text-genpro-orange text-sm mt-1">Kelola bisnis Anda di sini</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2 rounded-lg transition text-sm font-bold flex items-center gap-2"><ArrowLeft size={16} /> Ke Halaman Belanja</button>
            <button onClick={() => { supabase.auth.signOut(); navigate('/'); }} className="bg-red-800 hover:bg-red-900 border border-red-700 text-white px-4 py-2 rounded-lg transition text-sm font-bold flex items-center gap-2"><LogOut size={16}/> Keluar</button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto mt-6 px-4">
        <div className="flex bg-white rounded-lg shadow-sm p-1 overflow-x-auto">
          <button onClick={() => setActiveTab('produk')} className={`flex-1 py-3 px-4 rounded-md font-bold flex justify-center items-center gap-2 transition ${activeTab === 'produk' ? 'bg-genpro-orange text-genpro-maroon shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}><Package size={18}/> Produk Saya</button>
          <button onClick={() => setActiveTab('orders')} className={`flex-1 py-3 px-4 rounded-md font-bold flex justify-center items-center gap-2 transition ${activeTab === 'orders' ? 'bg-genpro-orange text-genpro-maroon shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}><ShoppingBag size={18}/> Pesanan Masuk {incomingOrders.some(o => o.status === 'menunggu_bayar') && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse ml-2"></span>}</button>
          <button onClick={() => setActiveTab('settings')} className={`flex-1 py-3 px-4 rounded-md font-bold flex justify-center items-center gap-2 transition ${activeTab === 'settings' ? 'bg-genpro-orange text-genpro-maroon shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}><Settings size={18}/> Toko & Bank</button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 mt-2">
        {activeTab === 'produk' && (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <div className={`p-6 rounded-xl shadow-sm border sticky top-32 transition-colors ${editingId ? 'bg-orange-50 border-genpro-orange' : 'bg-white border-gray-200'}`}>
                <h2 className="font-bold text-gray-800 mb-4 pb-2 border-b flex justify-between items-center">{editingId ? 'Edit Produk' : 'Tambah Produk'} {editingId && (<button onClick={handleCancelEdit} className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded flex items-center gap-1"><XCircle size={14}/> Batal</button>)}</h2>
                <form onSubmit={handleSaveProduct} className="space-y-3">
                  <div><label className="text-xs font-bold text-gray-500">Nama Produk</label><input required type="text" className="w-full border p-2 rounded focus:ring-1 focus:ring-genpro-orange outline-none bg-white" value={nama} onChange={e => setNama(e.target.value)} placeholder="Nama barang..."/></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="text-xs font-bold text-gray-500">Harga</label><input required type="number" className="w-full border p-2 rounded focus:ring-1 focus:ring-genpro-orange outline-none bg-white" value={harga} onChange={e => setHarga(e.target.value)}/></div>
                    <div><label className="text-xs font-bold text-gray-500">Stok</label><input required type="number" className="w-full border p-2 rounded focus:ring-1 focus:ring-genpro-orange outline-none bg-white" value={stok} onChange={e => setStok(e.target.value)}/></div>
                  </div>
                  <div><label className="text-xs font-bold text-gray-500">Deskripsi</label><textarea className="w-full border p-2 rounded focus:ring-1 focus:ring-genpro-orange outline-none text-sm h-24 bg-white" value={deskripsi} onChange={e => setDeskripsi(e.target.value)}></textarea></div>
                  <div><label className="text-xs font-bold text-gray-500">Video</label><input type="text" className="w-full border p-2 rounded focus:ring-1 focus:ring-genpro-orange outline-none text-sm bg-white" value={videoUrl} onChange={e => setVideoUrl(e.target.value)}/></div>
                  <div><label className="text-xs font-bold text-gray-500">Foto {editingId ? '(Opsional)' : '(Wajib)'}</label><input type="file" accept="image/*" onChange={e => setFileGambar(e.target.files[0])} className="w-full text-xs text-gray-500 file:mr-2 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-orange-100 file:text-genpro-orange"/></div>
                  <button disabled={loading} type="submit" className={`w-full text-white font-bold py-2 rounded transition flex justify-center items-center gap-2 ${editingId ? 'bg-orange-500 hover:bg-orange-600' : 'bg-genpro-maroon hover:bg-red-900'}`}>{loading ? 'Menyimpan...' : (editingId ? <><Save size={16}/> Simpan</> : <><Plus size={16}/> Upload</>)}</button>
                </form>
              </div>
            </div>
            <div className="md:col-span-2 space-y-3">
              {myProducts.length === 0 ? (<div className="text-center py-10 bg-white rounded-lg border border-dashed text-gray-400">Belum ada produk.</div>) : myProducts.map(item => (
                <div key={item.id} className={`bg-white p-3 rounded-lg shadow-sm border flex gap-3 items-center transition ${editingId === item.id ? 'border-orange-500 ring-1 ring-orange-500 bg-orange-50' : ''}`}>
                  <img src={item.foto_url} className="w-16 h-16 object-cover rounded bg-gray-100" />
                  <div className="flex-1"><h3 className="font-bold text-gray-800">{item.nama_produk}</h3><p className="text-sm text-gray-500">Rp {item.harga.toLocaleString()} | Stok: {item.stok}</p></div>
                  <div className="flex gap-2"><button onClick={() => handleEditClick(item)} className="bg-yellow-100 text-yellow-700 p-2 rounded"><Edit size={18}/></button><button onClick={() => handleDeleteProduct(item.id)} className="bg-red-100 text-red-600 p-2 rounded"><Trash2 size={18}/></button></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-4">
            {incomingOrders.length === 0 ? <div className="text-center py-20 bg-white rounded-xl shadow-sm text-gray-500">Belum ada pesanan masuk.</div> : incomingOrders.map(order => (
              <div key={order.id} className="bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition">
                <div className="flex justify-between items-start mb-4">
                  <div>
                     <p className="text-xs text-gray-500">Order ID: #{order.id}</p>
                     <p className="font-bold text-lg text-genpro-maroon">Rp {order.total_harga.toLocaleString()}</p>
                     
                     {/* INFO PEMBELI + TOMBOL CHAT */}
                     <div className="flex items-center gap-3 mt-1">
                        <p className="text-sm text-gray-600">Pembeli: <span className="font-bold">{order.profiles?.nama_lengkap}</span></p>
                        
                        {/* --- TOMBOL CHAT (BARU) --- */}
                        <button onClick={() => navigate(`/chat/${order.id}`)} className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded flex items-center gap-1 hover:bg-green-100">
                           <MessageCircle size={12}/> Chat Pembeli
                        </button>
                     </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${order.status === 'siap_kirim' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100'}`}>{order.status.replace('_', ' ')}</span>
                </div>
                
                {/* LIST BARANG */}
                <div className="bg-gray-50 p-3 rounded-lg mb-4 text-sm">
                  {order.items_json.map((item, idx) => (
                    <div key={idx} className="flex justify-between border-b last:border-0 border-gray-200 py-1"><span>{item.nama_produk} <span className="text-gray-400">x{item.qty}</span></span><span>Rp {(item.harga * item.qty).toLocaleString()}</span></div>
                  ))}
                </div>
                
                <div className="flex gap-2 justify-end">
                  {order.status === 'menunggu_bayar' && <button onClick={() => updateStatusOrder(order.id, 'diproses')} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700">Terima Pesanan</button>}
                  {order.status === 'diproses' && <button onClick={() => updateStatusOrder(order.id, 'siap_kirim')} className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-orange-600 flex items-center gap-2"><Package size={16}/> Panggil Kurir</button>}
                  {order.status === 'siap_kirim' && <div className="text-sm text-purple-600 font-bold animate-pulse">Menunggu kurir...</div>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB SETTING (Saya singkat agar tidak terlalu panjang, logika sama) */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto"><div className="bg-white p-6 rounded-xl shadow-sm border"><h2 className="font-bold mb-4">Pengaturan</h2><form onSubmit={handleUpdateProfile} className="space-y-4"><div><label className="block text-sm">Nama Lengkap</label><input type="text" className="border w-full p-2 rounded" value={profile.nama_lengkap} onChange={e=>setProfile({...profile, nama_lengkap:e.target.value})}/></div><div><label className="block text-sm">Nomor WA</label><input type="text" className="border w-full p-2 rounded" value={profile.nomor_wa} onChange={e=>setProfile({...profile, nomor_wa:e.target.value})}/></div><div className="grid grid-cols-2 gap-4"><div><label className="block text-sm">Bank</label><input type="text" className="border w-full p-2 rounded" value={profile.nama_bank} onChange={e=>setProfile({...profile, nama_bank:e.target.value})}/></div><div><label className="block text-sm">Rekening</label><input type="text" className="border w-full p-2 rounded" value={profile.no_rekening} onChange={e=>setProfile({...profile, no_rekening:e.target.value})}/></div></div><button className="bg-genpro-maroon text-white w-full py-2 rounded">Simpan</button></form></div></div>
        )}
      </div>
    </div>
  );
}