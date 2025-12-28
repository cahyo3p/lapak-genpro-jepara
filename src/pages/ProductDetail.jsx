import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { ShoppingCart, ArrowLeft, User } from 'lucide-react';

export default function ProductDetail() {
  const { id } = useParams(); // Ambil ID produk dari URL
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProductDetail();
  }, [id]);

  async function fetchProductDetail() {
    // Ambil data produk + data penjualnya
    const { data, error } = await supabase
      .from('products')
      .select('*, profiles(*)')
      .eq('id', id)
      .single();

    if (error) console.log(error);
    if (data) setProduct(data);
    setLoading(false);
  }

  if (loading) return <div className="p-10 text-center">Memuat produk...</div>;
  if (!product) return <div className="p-10 text-center">Produk tidak ditemukan</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Tombol Kembali */}
      <div className="max-w-4xl mx-auto p-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 mb-4 hover:text-genpro-maroon">
          <ArrowLeft size={20} /> Kembali
        </button>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden grid md:grid-cols-2">
          {/* Foto Produk Besar */}
          <div className="h-96 bg-gray-200">
            <img 
              src={product.foto_url || 'https://via.placeholder.com/400'} 
              alt={product.nama_produk} 
              className="w-full h-full object-cover"
            />
          </div>

          {/* Info Produk */}
          <div className="p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <User size={16}/> Penjual: <span className="font-bold text-genpro-maroon">{product.profiles?.nama_lengkap}</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{product.nama_produk}</h1>
              <p className="text-3xl font-bold text-genpro-orange mb-6">Rp {product.harga.toLocaleString('id-ID')}</p>
              
              <div className="prose text-gray-600 mb-6">
                <h3 className="font-bold text-black mb-1">Deskripsi:</h3>
                <p className="whitespace-pre-line">{product.deskripsi || 'Tidak ada deskripsi.'}</p>
              </div>
              
              <div className="bg-orange-50 p-3 rounded-lg border border-orange-100 text-sm text-gray-600">
                Stok tersedia: <strong>{product.stok}</strong>
              </div>
            </div>

            {/* Tombol Beli */}
            <div className="mt-8">
              <button 
                onClick={() => navigate(`/checkout/${product.id}`)}
                className="w-full bg-genpro-maroon text-white py-4 rounded-xl font-bold text-lg hover:bg-red-900 transition flex justify-center items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <ShoppingCart /> Beli Sekarang
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}