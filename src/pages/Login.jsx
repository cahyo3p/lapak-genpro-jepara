import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Phone, UserCircle } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false); // Mode Login atau Daftar
  const [loading, setLoading] = useState(false);
  
  // State Form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nama, setNama] = useState('');
  const [wa, setWa] = useState('');
  const [role, setRole] = useState('pembeli'); // Default role

  // Fungsi Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert('Login Gagal: ' + error.message);
    } else {
      navigate('/'); // Sukses langsung ke Home
    }
    setLoading(false);
  };

  // Fungsi Daftar (Register)
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    // 1. Daftar Akun Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      alert('Gagal Daftar: ' + authError.message);
      setLoading(false);
      return;
    }

    // 2. Simpan Detail ke Tabel Profiles
    if (authData.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: authData.user.id, // ID ini harus sama dengan Auth ID
            email: email,
            nama_lengkap: nama,
            nomor_wa: wa,
            role: role
          }
        ]);

      if (profileError) {
        alert('Akun jadi tapi gagal simpan profil: ' + profileError.message);
      } else {
        alert('Pendaftaran Berhasil! Silakan Login.');
        setIsRegister(false); // Pindah ke tampilan login
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border-t-4 border-genpro-maroon">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-genpro-maroon">
            {isRegister ? 'Gabung Genpro' : 'Selamat Datang'}
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {isRegister ? 'Isi data diri untuk mulai berniaga' : 'Masuk untuk mengelola lapak Anda'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={isRegister ? handleRegister : handleLogin} className="space-y-4">
          
          {/* Input Nama & WA (Hanya muncul saat Daftar) */}
          {isRegister && (
            <>
              <div className="relative">
                <UserCircle className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Nama Lengkap"
                  className="w-full pl-10 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-genpro-orange"
                  value={nama} onChange={e => setNama(e.target.value)}
                  required
                />
              </div>
              <div className="relative">
                <Phone className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Nomor WA (08xxx)"
                  className="w-full pl-10 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-genpro-orange"
                  value={wa} onChange={e => setWa(e.target.value)}
                  required
                />
              </div>
              
              {/* Pilihan Role */}
              <div className="p-3 border rounded-lg bg-gray-50">
                <label className="block text-sm text-gray-600 mb-2">Saya mendaftar sebagai:</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" name="role" value="pembeli" 
                      checked={role === 'pembeli'} 
                      onChange={() => setRole('pembeli')}
                      className="accent-genpro-maroon"
                    /> Pembeli
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" name="role" value="penjual" 
                      checked={role === 'penjual'} 
                      onChange={() => setRole('penjual')}
                      className="accent-genpro-maroon"
                    /> Penjual
                  </label>
                </div>
              </div>
            </>
          )}

          {/* Email & Password (Selalu Muncul) */}
          <div className="relative">
            <User className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="email"
              placeholder="Email"
              className="w-full pl-10 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-genpro-orange"
              value={email} onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="password"
              placeholder="Password"
              className="w-full pl-10 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-genpro-orange"
              value={password} onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Tombol Submit */}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-genpro-maroon text-white py-3 rounded-lg font-bold hover:bg-red-900 transition flex justify-center"
          >
            {loading ? 'Memproses...' : (isRegister ? 'Daftar Sekarang' : 'Masuk')}
          </button>
        </form>

        {/* Toggle Login/Register */}
        <p className="text-center mt-6 text-sm text-gray-600">
          {isRegister ? 'Sudah punya akun? ' : 'Belum punya akun? '}
          <button 
            onClick={() => setIsRegister(!isRegister)}
            className="text-genpro-orange font-bold hover:underline"
          >
            {isRegister ? 'Login di sini' : 'Daftar di sini'}
          </button>
        </p>
      </div>
    </div>
  );
}