import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Truck, CheckCircle, Clock, ArrowLeft, Camera, MessageCircle, Map as MapIcon } from 'lucide-react';
import imageCompression from 'browser-image-compression';

export default function OrderHistory() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [uploadingId, setUploadingId] = useState(null);

  useEffect(() => {
    fetchMyOrders();

    // Realtime Listener agar status berubah otomatis tanpa refresh
    const channel = supabase
      .channel('public:orders:buyer')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (payload) => {
        setOrders(currentOrders => currentOrders.map(o => o.id === payload.new.id ? {...o, ...payload.new} : o));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchMyOrders() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return navigate('/login');

    const { data } = await supabase
      .from('orders')
      .select('*, profiles:penjual_id(nama_lengkap, nomor_wa)')
      .eq('pembeli_id', user.id)
      .order('created_at', { ascending: false });

    if (data) setOrders(data);
    setLoading(false);
  }

  async function handleConfirmReceive(event, orderId) {
    const file = event.target.files[0];
    if (!file) return;
    if (!confirm("Sudah cek kondisi barang dan yakin ingin menyelesaikan pesanan ini?")) return;
    setUploadingId(orderId);

    try {
      const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true };
      const compressedFile = await imageCompression(file, options);
      const fileName = `bukti_${orderId}_${Date.now()}`;
      const { error: uploadError } = await supabase.storage.from('images').upload(fileName, compressedFile);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('images').getPublicUrl(fileName);

      await supabase.from('orders').update({ status: 'selesai', bukti_terima_url: data.publicUrl }).eq('id', orderId);
      alert("Terima kasih! Pesanan selesai.");
      fetchMyOrders();
    } catch (error) { alert("Gagal: " + error.message); } finally { setUploadingId(null); }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-100 rounded-full transition"><ArrowLeft size={20} className="text-gray-600"/></button>
          <h1 className="font-bold text-lg text-gray-800">Riwayat Belanja Saya</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 space-y-4">
        {loading ? <div className="text-center py-20 text-gray-400">Memuat...</div> : orders.length === 0 ? <p className="text-center py-10 text-gray-400">Belum ada pesanan.</p> : orders.map(order => (
          <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            
            <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <div className="flex items-center gap-2 text-sm text-gray-600"><ShoppingBag size={16}/> <span className="font-bold">{order.profiles?.nama_lengkap || 'Penjual'}</span></div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${order.status === 'dikirim' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100'}`}>{order.status.replace('_', ' ')}</span>
            </div>

            <div className="p-4">
              {order.items_json.map((item, idx) => (
                <div key={idx} className="flex gap-4 mb-3 last:mb-0">
                  <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden flex-shrink-0 border border-gray-200">
					<img 
					src={item.foto_url || 'https://placehold.co/100x100?text=No+Img'} 
					alt={item.nama_produk}
					className="w-full h-full object-cover"
					onError={(e) => { e.target.src = 'https://placehold.co/100x100?text=Error'; }} // Jaga-jaga kalau link mati
					/>
					</div>
                  <div><h3 className="font-bold text-gray-800 text-sm">{item.nama_produk}</h3><p className="text-gray-500 text-xs">{item.qty} x Rp {item.harga.toLocaleString()}</p></div>
                </div>
              ))}

              {/* === TOMBOL CHAT (BARU) === */}
              <button 
                onClick={() => navigate(`/chat/${order.id}`)}
                className="w-full mt-3 py-2 rounded-lg font-bold text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 flex justify-center items-center gap-2 transition border border-blue-200"
              >
                <MessageCircle size={16}/> Chat Penjual / Kurir
              </button>

            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              {order.status === 'dikirim' && (
                <div>
                  <input type="file" id={`upload-${order.id}`} accept="image/*" className="hidden" onChange={(e) => handleConfirmReceive(e, order.id)} />
                  <label htmlFor={`upload-${order.id}`} className="cursor-pointer bg-genpro-maroon text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-red-900">
                    <Camera size={16}/> Terima Barang
                  </label>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}