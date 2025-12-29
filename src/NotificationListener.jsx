import React, { useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import toast, { Toaster } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function NotificationListener() {
  const navigate = useNavigate();

  useEffect(() => {
    console.log("📡 Alat Penyadap (Listener) SIAP MEMANTAU...");

    const channel = supabase
      .channel('global_chat_listener')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, async (payload) => {
        console.log("📨 ADA PESAN MASUK DARI SUPABASE!", payload); // Cek 1
        handleNewMessage(payload.new);
      })
      .subscribe((status) => {
        console.log("STATUS KONEKSI:", status); // Harus 'SUBSCRIBED'
      });

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function handleNewMessage(message) {
    console.log("🕵️‍♂️ Memproses pesan:", message.message);

    // 1. Cek User
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log("❌ Tidak ada user login. Notif batal.");
      return;
    }
    console.log("👤 User Login:", user.email);

    // 2. Cek Pengirim
    if (message.sender_id === user.id) {
      console.log("⛔ Pesan dari diri sendiri. Abaikan.");
      return;
    }

    // 3. Cek Keterlibatan di Order
    const { data: order, error } = await supabase
      .from('orders')
      .select('pembeli_id, penjual_id, kurir_id')
      .eq('id', message.order_id)
      .single();

    if (error || !order) {
      console.log("❌ Gagal ambil data order atau order tidak ditemukan:", error);
      return;
    }

    console.log("📦 Data Order:", order);

    const amIInvolved = 
      order.pembeli_id === user.id || 
      order.penjual_id === user.id || 
      order.kurir_id === user.id;

    console.log("❓ Apakah saya terlibat?", amIInvolved);

    // 4. Tampilkan Notifikasi
    if (amIInvolved) {
      console.log("✅ YES! Tampilkan Notifikasi sekarang!");
      
      const { data: sender } = await supabase.from('profiles').select('nama_lengkap').eq('id', message.sender_id).single();
      const senderName = sender?.nama_lengkap || 'Seseorang';

      // FORCE POPUP (Sederhana dulu untuk tes)
      toast.success(`Pesan dari ${senderName}: ${message.message}`, {
        duration: 5000,
        position: 'top-right',
        style: { background: '#fff', color: '#000', border: '2px solid red' }
      });

      // Mainkan suara
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.play().catch(e => console.log("🔇 Audio diblokir browser (klik layar dulu!)"));
    } else {
      console.log("⛔ Saya tidak terlibat di order ini. Jangan ganggu.");
    }
  }

  return <Toaster />;
}