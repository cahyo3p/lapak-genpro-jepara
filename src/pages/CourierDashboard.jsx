import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Truck, Package, Camera, LogOut, Navigation, Phone, RefreshCw, MessageCircle } from 'lucide-react';
import imageCompression from 'browser-image-compression';

export default function CourierDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [availableJobs, setAvailableJobs] = useState([]); 
  const [myJobs, setMyJobs] = useState([]); 
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkCourier();
  }, []);

  // --- REALTIME: Dengar Order Masuk & Update GPS ---
  useEffect(() => {
    if (!user) return;
    
    // 1. Dengar Order Baru
    const channel = supabase.channel('public:orders:courier')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        fetchJobs(user.id);
      })
      .subscribe();
      
    // 2. Kirim GPS (Jika sedang bawa barang)
    let watchId;
    if (myJobs.length > 0 && "geolocation" in navigator) {
      watchId = navigator.geolocation.watchPosition(
        async (pos) => {
          for (let job of myJobs) {
            await supabase.from('orders').update({ courier_lat: pos.coords.latitude, courier_lng: pos.coords.longitude }).eq('id', job.id);
          }
        },
        err => console.error(err), { enableHighAccuracy: true }
      );
    }

    return () => { 
      supabase.removeChannel(channel); 
      if(watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [user, myJobs]); 

  async function checkCourier() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return navigate('/login');
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile.role !== 'kurir') { alert("Bukan kurir!"); navigate('/'); }
    setUser(user);
    fetchJobs(user.id);
  }

  async function fetchJobs(userId) {
    // 1. Job Tersedia
    const { data: openJobs } = await supabase.from('orders')
      .select('*, profiles:penjual_id(nama_lengkap, nomor_wa), pembeli:pembeli_id(nama_lengkap, nomor_wa)') 
      .eq('status', 'siap_kirim');
    if (openJobs) setAvailableJobs(openJobs);

    // 2. Job Saya
    const { data: activeJobs } = await supabase.from('orders')
      .select('*, profiles:penjual_id(nama_lengkap, nomor_wa), pembeli:pembeli_id(nama_lengkap, nomor_wa)')
      .eq('status', 'dikirim').eq('kurir_id', userId);
    if (activeJobs) setMyJobs(activeJobs);
  }

  async function handleTakeJob(orderId) {
    if (!confirm("Ambil orderan ini?")) return;
    const { error } = await supabase.from('orders').update({ status: 'dikirim', kurir_id: user.id }).eq('id', orderId);
    if (!error) fetchJobs(user.id);
  }

  async function handleFinishJob(e, orderId) {
    const file = e.target.files[0];
    if(!file) return;
    setLoading(true);
    try {
      const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true };
      const compressedFile = await imageCompression(file, options);
      const fileName = `bukti_kurir_${orderId}_${Date.now()}`;
      const { error } = await supabase.storage.from('images').upload(fileName, compressedFile);
      if (error) throw error;
      const { data } = supabase.storage.from('images').getPublicUrl(fileName);

      await supabase.from('orders').update({ status: 'selesai', bukti_terima_url: data.publicUrl }).eq('id', orderId);
      alert("Selesai!"); fetchJobs(user.id);
    } catch (err) { alert(err.message); } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-20 font-sans">
      <div className="bg-slate-800 text-white p-4 sticky top-0 z-30 shadow-lg">
        <div className="flex justify-between items-center max-w-lg mx-auto">
          <h1 className="font-bold text-lg flex items-center gap-2"><Truck className="text-yellow-400"/> Kurir Genpro</h1>
          <button onClick={() => {supabase.auth.signOut(); navigate('/')}} className="text-xs bg-slate-700 px-3 py-1 rounded hover:bg-red-600 transition"><LogOut size={14}/></button>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-6">
        {/* SECTION TUGAS SAYA */}
        <div>
          <h2 className="font-bold text-slate-800 mb-3 flex items-center gap-2 border-b pb-1"><Navigation size={20} className="text-blue-600"/> Sedang Diantar ({myJobs.length})</h2>
          {myJobs.length === 0 ? <p className="text-sm text-gray-400 italic">Tidak ada paket yang sedang dibawa.</p> : myJobs.map(job => (
            <div key={job.id} className="bg-white rounded-xl shadow-md border-l-4 border-blue-600 p-4 mb-4 relative">
               <div className="mb-3 border-b border-dashed pb-2">
                 <p className="text-xs font-bold text-gray-500 uppercase">Jemput:</p>
                 <p className="font-bold">{job.profiles?.nama_lengkap}</p>
               </div>
               <div className="mb-4">
                 <p className="text-xs font-bold text-gray-500 uppercase">Antar:</p>
                 <p className="font-bold text-lg">{job.pembeli?.nama_lengkap || 'Pembeli'}</p>
                 
                 {/* --- TOMBOL CHAT (BARU) --- */}
                 <button onClick={() => navigate(`/chat/${job.id}`)} className="w-full mt-2 text-sm bg-blue-50 text-blue-600 py-2 rounded font-bold flex justify-center items-center gap-2 hover:bg-blue-100 transition">
                    <MessageCircle size={16}/> Chat via Aplikasi
                 </button>

               </div>
               <input type="file" id={`f-${job.id}`} accept="image/*" className="hidden" onChange={(e) => handleFinishJob(e, job.id)} />
               <label htmlFor={`f-${job.id}`} className="bg-blue-600 text-white w-full py-3 rounded-lg font-bold flex justify-center items-center gap-2 cursor-pointer hover:bg-blue-700">
                 {loading ? 'Mengupload...' : <><Camera size={18}/> Paket Sampai (Foto)</>}
               </label>
            </div>
          ))}
        </div>

        {/* SECTION JOB POOL */}
        <div>
           <h2 className="font-bold text-slate-800 mb-3 flex items-center gap-2 border-b pb-1 mt-8"><Package size={20} className="text-orange-500"/> Orderan Masuk ({availableJobs.length})</h2>
           {availableJobs.length === 0 ? (
             <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-8 text-center"><RefreshCw className="mx-auto text-gray-300 mb-2 animate-spin-slow" size={30}/><p className="text-gray-400 text-sm">Menunggu toko memanggil kurir...</p></div>
           ) : availableJobs.map(job => (
            <div key={job.id} className="bg-white rounded-xl shadow-sm border p-4 mb-3 flex justify-between items-center animate-pulse-once">
              <div>
                 <p className="font-bold text-sm text-slate-800">Dari: {job.profiles?.nama_lengkap}</p>
                 <p className="text-xs text-gray-500">Ke: {job.pembeli?.nama_lengkap || 'Pembeli'}</p>
                 <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full mt-1 inline-block">Siap Kirim</span>
              </div>
              <button onClick={() => handleTakeJob(job.id)} className="bg-orange-500 text-white px-5 py-2 rounded-lg font-bold text-sm hover:bg-orange-600 shadow-sm transition transform active:scale-95">Ambil</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}