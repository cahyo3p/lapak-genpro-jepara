import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, TrendingUp, DollarSign, Users, Download, LogOut } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  
  // Statistik
  const [stats, setStats] = useState({
    totalOmset: 0,
    totalFee: 0,
    totalTransaksi: 0,
    totalPenjualAktif: 0
  });

  useEffect(() => {
    checkAdmin();
  }, []);

  // 1. Cek Apakah User ini ADMIN?
  async function checkAdmin() {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return navigate('/login');

    // Cek Role di tabel profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      alert("Akses Ditolak: Anda bukan Admin Organisasi!");
      navigate('/'); // Tendang ke home jika bukan admin
    } else {
      fetchData();
    }
  }

  // 2. Ambil Semua Data Transaksi
  async function fetchData() {
    // Ambil order yg statusnya bukan 'dibatalkan'
    const { data, error } = await supabase
      .from('orders')
      .select('*, profiles:penjual_id(nama_lengkap, nomor_wa)')
      .neq('status', 'dibatalkan') 
      .order('created_at', { ascending: false });

    if (data) {
      setOrders(data);
      hitungStatistik(data);
    }
    setLoading(false);
  }

  function hitungStatistik(data) {
    const totalOmset = data.reduce((acc, curr) => acc + curr.total_harga, 0);
    const totalFee = data.reduce((acc, curr) => acc + curr.fee_organisasi, 0);
    // Hitung penjual unik
    const uniqueSellers = new Set(data.map(item => item.penjual_id));

    setStats({
      totalOmset,
      totalFee,
      totalTransaksi: data.length,
      totalPenjualAktif: uniqueSellers.size
    });
  }

  // 3. Fitur Download Laporan PDF (SUDAH DIPERBAIKI)
  function downloadPDF() {
    try {
      const doc = new jsPDF();

      // Header Laporan
      doc.setFontSize(18);
      doc.text("Laporan Keuangan Genpro Jepara", 14, 22);
      
      doc.setFontSize(10);
      doc.text(`Dicetak oleh Admin pada: ${new Date().toLocaleDateString('id-ID')}`, 14, 28);
      doc.line(14, 32, 196, 32); // Garis pemisah

      // Persiapan Data Tabel
      const tableColumn = ["Tanggal", "Penjual", "Pembeli", "Omset", "Fee (3%)", "Status"];
      const tableRows = [];

      orders.forEach(order => {
        const rowData = [
          new Date(order.created_at).toLocaleDateString('id-ID'),
          order.profiles?.nama_lengkap || 'Unknown',
          `User #${order.pembeli_id.substring(0,5)}`, // ID Pembeli disingkat
          `Rp ${order.total_harga.toLocaleString('id-ID')}`,
          `Rp ${order.fee_organisasi.toLocaleString('id-ID')}`,
          order.status
        ];
        tableRows.push(rowData);
      });

      // Generate Tabel
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 35,
        theme: 'grid',
        headStyles: { fillColor: [74, 21, 21] }, // Warna Marun
        styles: { fontSize: 8 },
      });

      // Total di Bagian Bawah
      const finalY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`TOTAL OMSET: Rp ${stats.totalOmset.toLocaleString('id-ID')}`, 14, finalY);
      
      doc.setTextColor(200, 0, 0); // Merah
      doc.text(`TOTAL HAK ORGANISASI: Rp ${stats.totalFee.toLocaleString('id-ID')}`, 14, finalY + 7);

      doc.save("Laporan_Keuangan_Genpro.pdf");

    } catch (error) {
      alert("Gagal download PDF: " + error.message);
      console.error(error);
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Memverifikasi akses admin...</div>;

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      {/* Navbar Admin */}
      <div className="bg-gray-900 text-white p-4 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 text-xl font-bold text-yellow-500">
            <LayoutDashboard /> ADMIN PANEL
          </div>
          <div className="flex gap-4 items-center">
            <button onClick={() => navigate('/')} className="text-sm text-gray-300 hover:text-white">Ke Halaman Depan</button>
            <button onClick={() => { supabase.auth.signOut(); navigate('/'); }} className="text-sm bg-gray-700 px-3 py-1 rounded hover:bg-red-600 flex items-center gap-2 transition">
              <LogOut size={14}/> Keluar
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        
        {/* Header & Download */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Rekapitulasi Bisnis</h1>
            <p className="text-gray-500 mt-1">Pantau pergerakan ekonomi komunitas secara realtime.</p>
          </div>
          <button onClick={downloadPDF} className="bg-genpro-maroon text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 hover:bg-red-900 shadow-lg transition active:scale-95">
            <Download size={20}/> Download Laporan PDF
          </button>
        </div>

        {/* Kartu Statistik */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs uppercase font-bold tracking-wider">Total Transaksi</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{stats.totalTransaksi}</p>
              </div>
              <TrendingUp className="text-blue-200" size={40} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs uppercase font-bold tracking-wider">Total Omset Anggota</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">Rp {stats.totalOmset.toLocaleString()}</p>
              </div>
              <DollarSign className="text-green-200" size={40} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-yellow-500 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-10">
               <DollarSign size={100} />
            </div>
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-gray-500 text-xs uppercase font-bold tracking-wider">Kas Organisasi (3%)</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">Rp {stats.totalFee.toLocaleString()}</p>
              </div>
              <div className="bg-yellow-100 p-2 rounded-full text-yellow-600">
                <DollarSign size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs uppercase font-bold tracking-wider">Penjual Aktif</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{stats.totalPenjualAktif}</p>
              </div>
              <Users className="text-purple-200" size={40} />
            </div>
          </div>
        </div>

        {/* Tabel Detail Transaksi */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
          <div className="p-4 bg-gray-50 border-b border-gray-200 font-bold text-gray-700 flex justify-between items-center">
            <span>Riwayat Transaksi Masuk</span>
            <span className="text-xs font-normal text-gray-500">Menampilkan semua data kecuali yang dibatalkan</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3">Tanggal</th>
                  <th className="px-6 py-3">Penjual</th>
                  <th className="px-6 py-3">Pembeli</th>
                  <th className="px-6 py-3">Total Omset</th>
                  <th className="px-6 py-3 bg-yellow-50 text-yellow-700 border-x border-yellow-100">Fee (3%)</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="bg-white border-b hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-mono text-gray-500 whitespace-nowrap">
                      {new Date(order.created_at).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'})}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-800">{order.profiles?.nama_lengkap}</div>
                      <div className="text-xs text-gray-400">{order.profiles?.nomor_wa}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      ID: {order.pembeli_id.slice(0,5)}...
                    </td>
                    <td className="px-6 py-4 font-bold text-green-600 whitespace-nowrap">
                      Rp {order.total_harga.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-bold text-yellow-700 bg-yellow-50 border-x border-yellow-100 whitespace-nowrap">
                      Rp {order.fee_organisasi.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold capitalize 
                        ${order.status === 'selesai' ? 'bg-green-100 text-green-700' : 
                          order.status === 'menunggu_bayar' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'}`}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}