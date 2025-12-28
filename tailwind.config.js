/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // KITA TAMBAHKAN WARNA KHUSUS GENPRO DI SINI
      colors: {
        'genpro-maroon': '#4A1515', // Warna Marun Gelap
        'genpro-orange': '#FFC107', // Warna Oranye/Emas (mirip bintang di logo)
      }
    },
  },
  plugins: [],
}