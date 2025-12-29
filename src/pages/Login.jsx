import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { LogIn, UserPlus, ArrowLeft } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false); // Mode: false = Login, true = Daftar

  // State Form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nama, setNama] = useState('');
  const [noWa, setNoWa] = useState('');
  const [role, setRole] = useState('pembeli'); // Default role

  async function handleAuth(e) {
    e.preventDefault();
    setLoading(true);

    try {
      if (isRegister) {
        // --- LOGIC DAFTAR ---
        
        // 1. Buat Akun di Auth Supabase
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email,
          password: password,
        });

        if (signUpError) throw signUpError;

        // 2. Simpan Biodata ke Tabel 'profiles'
        if (data.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([
              {
                id: data.user.id,
                email: email,
                nama_lengkap: nama,
                nomor_wa: noWa,
                role: role // 'pembeli', 'penjual', atau 'kurir'
              }
            ]);

          if (profileError) {
            console.error("Gagal simpan profil:", profileError);
            alert("Akun jadi tapi gagal simpan profil. Hubungi Admin.");
          } else {
            alert("Pendaftaran Berhasil! Silakan Login.");
            setIsRegister(false); // Kembali ke mode login
          }
        }

      } else {
        // --- LOGIC LOGIN (YANG DIPERBARUI) ---
        const { data: { user }, error } = await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        });

        if (error) throw error;
        
        // CEK ROLE DULU SEBELUM MENGARAHKAN HALAMAN
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        // Arahkan sesuai Role
        if (profile?.role === 'admin') {
          navigate('/admin');
        } else if (profile?.role === 'kurir') {
          navigate('/courier');
        } else {
          navigate('/dashboard'); // Penjual & Pembeli masuk sini dulu
        }
      }

    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-2xl shadow-xl overflow-hidden">
        
        {/* Header Warna */}
        <div className="bg-genpro-maroon p-6 text-center text-white relative">
          <Link to="/" className="absolute left-4 top-6 text-white/80 hover:text-white">
            <ArrowLeft size={24} />
          </Link>
          <h2 className="text-2xl font-bold mb-1">
            {isRegister ? 'Gabung Genpro' : 'Selamat Datang'}
          </h2>
          <p className="text-sm text-orange-200">Marketplace Komunitas Kita</p>
        </div>

        {/* Form */}
        <div className="p-8">
          <form onSubmit={handleAuth} className="space-y-4">
            
            {/* Field Khusus Register */}
            {isRegister && (
              <>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Nama Lengkap</label>
                  <input 
                    required type="text" 
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-genpro-orange outline-none"
                    value={nama} onChange={e => setNama(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Nomor WhatsApp</label>
                  <input 
                    required type="text" 
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-genpro-orange outline-none"
                    value={noWa} onChange={e => setNoWa(e.target.value)}
                    placeholder="08123456789"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Daftar Sebagai</label>
                  <select 
                    value={role} 
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-genpro-orange focus:border-transparent transition bg-white"
                  >
                    <option value="pembeli">Pembeli (Ingin Jajan)</option>
                    <option value="penjual">Penjual (Ingin Dagang)</option>
                    <option value="kurir">Kurir (Jasa Antar)</option>
                  </select>
                </div>
              </>
            )}

            {/* Field Login & Register (Umum) */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
              <input 
                required type="email" 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-genpro-orange outline-none"
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="nama@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
              <input 
                required type="password" 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-genpro-orange outline-none"
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder="********"
              />
            </div>

            {/* Tombol Submit */}
            <button 
              disabled={loading}
              type="submit" 
              className="w-full bg-genpro-orange text-genpro-maroon font-bold py-3 rounded-lg hover:bg-yellow-400 transition flex justify-center items-center gap-2 mt-6"
            >
              {loading ? 'Memproses...' : (
                isRegister ? <><UserPlus size={20}/> Daftar Sekarang</> : <><LogIn size={20}/> Masuk Aplikasi</>
              )}
            </button>
          </form>

          {/* Toggle Login/Register */}
          <div className="mt-6 text-center border-t pt-4">
            <p className="text-gray-600 text-sm">
              {isRegister ? 'Sudah punya akun?' : 'Belum punya akun?'}
            </p>
            <button 
              onClick={() => setIsRegister(!isRegister)}
              className="text-genpro-maroon font-bold hover:underline mt-1"
            >
              {isRegister ? 'Login di sini' : 'Daftar akun baru'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}