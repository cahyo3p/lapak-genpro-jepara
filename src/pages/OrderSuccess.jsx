import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { CheckCircle, MessageCircle } from 'lucide-react';

export default function OrderSuccess() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  async function fetchOrder() {
    // Ambil detail order + Info Bank Penjual dari tabel profiles
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        profiles:penjual_id (nama_lengkap, nama_bank, no_rekening, nomor_wa)
      `)
      .eq('id', orderId)
      .single();
    
    if (data) setOrder(data);
  }

  if (!order) return <div className="p-10">Memuat Info Pembayaran...</div>;

  const penjual = order.profiles;

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-2xl shadow-xl p-8 text-center border-t-8 border-green-500">
        <CheckCircle size={64} className="mx-auto text-green-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Pesanan Diterima!</h1>
        <p className="text-gray-500 mb-6">Silakan lakukan pembayaran langsung ke penjual.</p>

        <div className="bg-gray-100 p-4 rounded-xl text-left mb-6 space-y-3">
          <div>
            <p className="text-xs text-gray-500">Total Nominal</p>
            <p className="text-2xl font-bold text-genpro-maroon">Rp {order.total_harga.toLocaleString()}</p>
          </div>
          <div className="border-t border-gray-300 pt-3">
            <p className="text-xs text-gray-500">Bank Tujuan</p>
            <p className="font-bold">{penjual.nama_bank || 'Bank Belum Diatur'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">No. Rekening</p>
            <p className="font-bold text-lg font-mono tracking-wider">{penjual.no_rekening || '-'}</p>
            <p className="text-sm text-gray-600">a.n {penjual.nama_lengkap}</p>
          </div>
        </div>

        <div className="space-y-3">
          <a 
            href={`https://wa.me/${penjual.nomor_wa}?text=Halo, saya sudah order di Aplikasi Genpro dengan Order ID #${order.id}. Mohon info ongkirnya.`}
            target="_blank"
            className="block w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition flex justify-center items-center gap-2"
          >
            <MessageCircle size={18}/> Konfirmasi ke WA Penjual
          </a>
          
          <Link to="/" className="block w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-300">
            Kembali Belanja
          </Link>
        </div>
        
        <p className="text-xs text-gray-400 mt-6">
          Jangan lupa simpan bukti transfer Anda untuk diupload nanti.
        </p>
      </div>
    </div>
  );
}