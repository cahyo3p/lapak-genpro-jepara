import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { ShieldCheck } from 'lucide-react';

export default function Checkout() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkSession();
    fetchProduct();
  }, []);

  async function checkSession() {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      alert("Silakan login dulu untuk belanja!");
      navigate('/login');
    } else {
      setUser(data.user);
    }
  }

  async function fetchProduct() {
    const { data } = await supabase.from('products').select('*').eq('id', id).single();
    if (data) setProduct(data);
  }

  async function handleOrder() {
    if (qty > product.stok) return alert("Stok tidak cukup!");
    setLoading(true);

    const totalHarga = product.harga * qty;
    const feeOrganisasi = totalHarga * 0.03; // Hitung 3%

    // 1. Simpan ke Tabel ORDERS
    const { data: orderData, error } = await supabase
      .from('orders')
      .insert([{
        pembeli_id: user.id,
        penjual_id: product.penjual_id,
        items_json: [{ // Simpan snapshot produk saat ini
            id: product.id,
            nama_produk: product.nama_produk,
            harga: product.harga,
            qty: qty,
			foto_url: product.foto_url
		}],
        total_harga: totalHarga,
        fee_organisasi: feeOrganisasi,
        status: 'menunggu_bayar'
      }])
      .select()
      .single();

    if (error) {
      alert("Gagal order: " + error.message);
      setLoading(false);
    } else {
      // 2. Arahkan ke Halaman Sukses (Instruksi Bayar)
      navigate(`/order-success/${orderData.id}`);
    }
  }

  if (!product || !user) return <div className="p-10">Memuat...</div>;

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-lg mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-genpro-maroon text-white p-4 text-center font-bold text-lg">
          Konfirmasi Pesanan
        </div>
        
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">{product.nama_produk}</h2>
          
          <div className="flex justify-between items-center border-b pb-4 mb-4">
            <span className="text-gray-600">Harga Satuan</span>
            <span className="font-semibold">Rp {product.harga.toLocaleString()}</span>
          </div>

          <div className="flex justify-between items-center mb-6">
            <span className="text-gray-600">Jumlah Beli</span>
            <input 
              type="number" min="1" max={product.stok}
              value={qty} onChange={e => setQty(e.target.value)}
              className="border p-2 rounded w-20 text-center font-bold"
            />
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border mb-6">
            <div className="flex justify-between items-center text-lg font-bold text-genpro-maroon">
              <span>Total Bayar</span>
              <span>Rp {(product.harga * qty).toLocaleString()}</span>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              *Belum termasuk ongkir (dibahas via chat nanti)
            </p>
          </div>

          <button 
            onClick={handleOrder}
            disabled={loading}
            className="w-full bg-genpro-orange text-genpro-maroon font-bold py-3 rounded-lg hover:bg-yellow-400 transition flex justify-center items-center gap-2"
          >
            {loading ? 'Memproses...' : <><ShieldCheck size={20}/> Proses Pesanan</>}
          </button>
        </div>
      </div>
    </div>
  );
}