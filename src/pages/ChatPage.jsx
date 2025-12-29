import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Send, ArrowLeft, User } from 'lucide-react';

export default function ChatPage() {
  const { orderId } = useParams(); // Ambil ID Order dari URL
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [orderInfo, setOrderInfo] = useState(null);
  const messagesEndRef = useRef(null); // Untuk auto-scroll ke bawah

  useEffect(() => {
    checkUser();
    fetchOrderInfo();
    fetchMessages();

    // --- REALTIME LISTENER ---
    const channel = supabase
      .channel(`chat:${orderId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'chat_messages',
        filter: `order_id=eq.${orderId}` // Hanya dengar chat di order ini
      }, (payload) => {
        // Saat ada pesan baru masuk, tambahkan ke layar
        fetchNewMessage(payload.new.id);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [orderId]);

  // Auto scroll ke pesan terbawah setiap ada pesan baru
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setUser(user);
    else navigate('/login');
  }

  async function fetchOrderInfo() {
    const { data } = await supabase.from('orders').select('*, profiles:penjual_id(nama_lengkap)').eq('id', orderId).single();
    if(data) setOrderInfo(data);
  }

  async function fetchMessages() {
    const { data } = await supabase
      .from('chat_messages')
      .select('*, profiles:sender_id(nama_lengkap, role)')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true }); // Urutkan dari yg terlama
    
    if (data) setMessages(data);
  }

  // Fetch satu pesan spesifik (untuk realtime) agar dapat info profil pengirimnya
  async function fetchNewMessage(msgId) {
    const { data } = await supabase
      .from('chat_messages')
      .select('*, profiles:sender_id(nama_lengkap, role)')
      .eq('id', msgId)
      .single();
    
    if (data) setMessages(prev => [...prev, data]);
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const text = newMessage;
    setNewMessage(''); // Kosongkan input biar cepat

    const { error } = await supabase.from('chat_messages').insert([{
      order_id: orderId,
      sender_id: user.id,
      message: text
    }]);

    if (error) alert("Gagal kirim: " + error.message);
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      
      {/* HEADER */}
      <div className="bg-genpro-maroon text-white p-4 shadow-md flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate(-1)}><ArrowLeft size={24}/></button>
        <div>
          <h1 className="font-bold text-lg">Chat Pesanan #{orderId}</h1>
          <p className="text-xs text-orange-200">Diskusi Pembeli, Penjual & Kurir</p>
        </div>
      </div>

      {/* AREA CHAT (SCROLLABLE) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isMe = msg.sender_id === user?.id;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-xl p-3 shadow-sm ${isMe ? 'bg-green-100 text-green-900 rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none'}`}>
                
                {/* Nama Pengirim */}
                {!isMe && (
                  <p className="text-[10px] font-bold text-orange-600 mb-1 flex items-center gap-1">
                    <User size={10}/> {msg.profiles?.nama_lengkap} 
                    <span className="text-gray-400 font-normal">({msg.profiles?.role})</span>
                  </p>
                )}
                
                {/* Isi Pesan */}
                <p className="text-sm">{msg.message}</p>
                <p className="text-[10px] text-gray-400 text-right mt-1">
                  {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} /> {/* Penanda akhir chat */}
      </div>

      {/* INPUT CHAT */}
      <div className="p-3 bg-white border-t border-gray-200">
        <form onSubmit={handleSend} className="flex gap-2 max-w-3xl mx-auto">
          <input 
            type="text" 
            className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:border-genpro-maroon"
            placeholder="Tulis pesan..."
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
          />
          <button type="submit" className="bg-genpro-maroon text-white p-3 rounded-full hover:bg-red-800 transition shadow-lg">
            <Send size={18} />
          </button>
        </form>
      </div>

    </div>
  );
}