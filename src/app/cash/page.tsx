"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import ElegantStars from "../components/ElegantStars";
import CleanText from "../components/CleanText";
import { supabase } from "@/lib/supabaseClient";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, TooltipItem, Filler } from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// type ChartTooltipContext = {
//   dataset: {
//     label: string;
//   };
//   parsed: {
//     y: number;
//   };
//   label: string;
// };

type KasStatusRow = {
  status: boolean;
  minggu_kas: Array<{
    minggu: number;
    jumlah: number;
  }>;
};

type TransaksiKas = {
  jumlah: number;
  deskripsi: string;
  jenis: string; // 'pengeluaran' or 'pemasukan'
};

type MingguKas = {
  id: string;
  minggu: number;
  jumlah: number;
  created_at?: string; // Menambahkan ini karena kadang tidak semua field diambil
};

type Mahasiswa = {
  id: string;
  nama?: string; // Menambahkan ini karena kadang hanya ID yang diambil
  nim?: string;
};

type KasStatusChart = {
  status: boolean;
  minggu_id: string;
};

type StatusBayarItem = {
  status: boolean;
  created_at: string;
  minggu_kas: Array<{
    minggu: number;
    jumlah: number;
  }>;
};

export default function CashPage() {
  const [pemasukanMingguIni, setPemasukanMingguIni] = useState(0);
  const [totalPengeluaran, setTotalPengeluaran] = useState(0);
  const [saldoTotal, setSaldoTotal] = useState(0);
  const [detailPengeluaran, setDetailPengeluaran] = useState<TransaksiKas[]>([]);
  const [showDetail, setShowDetail] = useState(false);

  const [nim, setNim] = useState("");
  const [statusBayar, setStatusBayar] = useState<StatusBayarItem[]>([]);
  const [studentName, setStudentName] = useState<string | null>(null);

  // Data untuk charts
  const [allMingguKas, setAllMingguKas] = useState<MingguKas[]>([]);
  const [allTransaksiKas, setAllTransaksiKas] = useState<TransaksiKas[]>([]);
  const [allMahasiswa, setAllMahasiswa] = useState<Mahasiswa[]>([]);
  const [allKasStatusChart, setAllKasStatusChart] = useState<KasStatusChart[]>([]);

  const [navbarHeight, setNavbarHeight] = useState(0);
  const handleNavbarHeightChange = (height: number) => setNavbarHeight(height);

  const toCurrency = (n: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

  // ===== Ambil summary kas =====
  const fetchSummary = async () => {
    // 1) Ambil minggu aktif (terbaru)
    const { data: minggu, error: mingguError } = await supabase
      .from("minggu_kas")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1);
    console.log("Supabase - minggu_kas data:", minggu);
    console.log("Supabase - minggu_kas error:", mingguError);

    if (mingguError || !minggu?.length) {
      console.error("Error fetch minggu_kas:", mingguError);
      // saldo dihitung di bawah tetap (all time) — lanjut
    }

    const mingguAktif = minggu?.[0];
    const mingguId = mingguAktif?.id;
    const jumlahPerMinggu = mingguAktif?.jumlah ?? 0;

    // 2) Pemasukan minggu ini = jumlahPerMinggu * (count kas_status true untuk minggu aktif)
    if (mingguId) {
      const { data: statusThisWeek, error: statusError } = await supabase
        .from("kas_status")
        .select("status")
        .eq("minggu_id", mingguId);
    console.log("Supabase - kas_status (this week) data:", statusThisWeek);
    console.log("Supabase - kas_status (this week) error:", statusError);

      if (statusError) {
        console.error("Error fetch kas_status minggu ini:", statusError);
        setPemasukanMingguIni(0);
      } else {
        const paidCount = statusThisWeek?.filter((s) => s.status === true).length ?? 0;
        setPemasukanMingguIni(paidCount * jumlahPerMinggu);
      }
    }

    // 3) Total Pengeluaran (all time) dan detail
    const { data: keluarAll, error: keluarAllError } = await supabase
      .from("transaksi_kas")
      .select("jumlah, deskripsi, jenis")
      .eq("jenis", "pengeluaran");
    console.log("Supabase - transaksi_kas (all pengeluaran) data:", keluarAll);
    console.log("Supabase - transaksi_kas (all pengeluaran) error:", keluarAllError);

    if (keluarAllError) {
      console.error("Error fetch all pengeluaran:", keluarAllError);
      setTotalPengeluaran(0);
      setDetailPengeluaran([]);
    } else {
      const totalPengeluaranComputed =
        keluarAll?.reduce((sum, item) => sum + (item.jumlah ?? 0), 0) ?? 0;
      setTotalPengeluaran(totalPengeluaranComputed);
      setDetailPengeluaran(keluarAll || []);
    }

    // 4) SALDO (ALL TIME) — FIXED:
    //    Total pemasukan all time = sum(minggu_kas.jumlah) untuk SETIAP baris kas_status
    //    yang status=true (dibayar). Karena unique (mahasisw-id, minggu_id), tiap paid row
    //    mewakili satu pembayaran “jumlah” pada minggu tsb.
    const { data: paidStatusAll, error: paidStatusAllErr } = await supabase
      .from("kas_status")
      .select("status, minggu_kas(minggu, jumlah)")
      .eq("status", true);
    console.log("Supabase - kas_status (paid all) data:", paidStatusAll);
    console.log("Supabase - kas_status (paid all) error:", paidStatusAllErr);

    // Catatan: jika ada event “pemasukan” manual di transaksi_kas, Anda bisa
    //          tambahkan juga ke perhitungan, tapi di desain ini kita asumsikan
    //          pemasukan hanya dari pembayaran mahasiswa (kas_status).

    if (paidStatusAllErr) {
      console.error("Error fetch all paid status:", paidStatusAllErr);
      setSaldoTotal(0);
      return;
    }

    const totalPemasukanAll =
      (paidStatusAll as KasStatusRow[] | null)?.reduce((sum, row) => {
        const j = row?.minggu_kas?.[0]?.jumlah ?? 0; // Mengakses elemen pertama dari array
        return sum + j;
      }, 0) ?? 0;

    console.log("Total Pemasukan All:", totalPemasukanAll);
    console.log("Total Pengeluaran:", totalPengeluaran);
    setSaldoTotal(totalPemasukanAll - totalPengeluaran);
    console.log("Saldo Total:", totalPemasukanAll - totalPengeluaran);

    // ===== Data untuk Charts =====
    const { data: allMingguKasData, error: allMingguKasError } = await supabase
      .from("minggu_kas")
      .select("*")
      .order("minggu", { ascending: true });
    console.log("Supabase - allMingguKas data:", allMingguKasData);
    console.log("Supabase - allMingguKas error:", allMingguKasError);
    if (allMingguKasError) console.error("Error fetching all minggu_kas:", allMingguKasError);
    setAllMingguKas(allMingguKasData || []);

    const { data: allTransaksiKasData, error: allTransaksiKasError } = await supabase
      .from("transaksi_kas")
      .select("jumlah, jenis, deskripsi");
    console.log("Supabase - allTransaksiKas data:", allTransaksiKasData);
    console.log("Supabase - allTransaksiKas error:", allTransaksiKasError);
    if (allTransaksiKasError) console.error("Error fetching all transaksi_kas:", allTransaksiKasError);
    setAllTransaksiKas(allTransaksiKasData || []);

    const { data: allMahasiswaData, error: allMahasiswaError } = await supabase
      .from("mahasiswa")
      .select("id"); // Hanya butuh ID untuk count
    console.log("Supabase - allMahasiswa data:", allMahasiswaData);
    console.log("Supabase - allMahasiswa error:", allMahasiswaError);
    if (allMahasiswaError) console.error("Error fetching all mahasiswa:", allMahasiswaError);
    setAllMahasiswa(allMahasiswaData || []);

    const { data: allKasStatusChartData, error: allKasStatusChartError } = await supabase
      .from("kas_status")
      .select("status, minggu_id"); // Menambahkan minggu_id di sini
    console.log("Supabase - allKasStatusChart data:", allKasStatusChartData);
    console.log("Supabase - allKasStatusChart error:", allKasStatusChartError);
    if (allKasStatusChartError) console.error("Error fetching all kas_status for chart:", allKasStatusChartError);
    setAllKasStatusChart(allKasStatusChartData || []);
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  // ===== Cek pembayaran berdasarkan NIM =====
  const handleCekPembayaran = async () => {
    const nimTrim = nim.trim();
    if (!nimTrim) return;

    setStudentName(null);
    setStatusBayar([]);

    const { data: mhs, error: mhsError } = await supabase
      .from("mahasiswa")
      .select("id, nama")
      .eq("nim", nimTrim)
      .single();

    if (mhsError || !mhs) {
      alert(`Mahasiswa dengan NIM ${nimTrim} tidak ditemukan`);
      return;
    }

    setStudentName(mhs.nama);

    const { data, error } = await supabase
      .from("kas_status")
      .select("status, created_at, minggu_kas(minggu, jumlah)")
      .eq("mahasiswa_id", mhs.id) // Perbaikan typo di sini
      .order("created_at");

    if (error) {
      console.error("Error cek pembayaran:", error);
      return;
    }

    setStatusBayar(data || []);
  };

  // ===== Data untuk Chart 1: Uang kas dari minggu ke minggu (Total Pemasukan Aktual) =====
  const chartMingguKasData = useMemo(() => {
    // Pastikan allMingguKas diurutkan berdasarkan minggu untuk tampilan chart yang benar
    const sortedMingguKas = [...allMingguKas].sort((a, b) => a.minggu - b.minggu);

    const labels = sortedMingguKas.map((mk) => `Minggu ${mk.minggu}`);
    const data = sortedMingguKas.map((mk) => {
      const paidCount = allKasStatusChart.filter(
        (statusEntry) => statusEntry.minggu_id === mk.id && statusEntry.status === true
      ).length;
      return paidCount * (mk.jumlah ?? 0); // Total pemasukan aktual
    });

    return {
      labels,
      datasets: [
        {
          label: "Total Pemasukan Aktual Per Minggu",
          data,
          borderColor: "rgba(75, 192, 192, 1)",
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          fill: true,
        },
      ],
    };
  }, [allMingguKas, allKasStatusChart]);

  const chartMingguKasOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: 'white',
        },
      },
      title: {
        display: true,
        text: "Total Pemasukan Kas dari Minggu ke Minggu",
        color: 'white',
      },
      tooltip: {
        callbacks: {
          label: function(context: TooltipItem<"line">) {
            let label = context.dataset.label || '';
            if (label) {
                label += ': ';
            }
            if (context.parsed.y !== null) {
                label += toCurrency(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        ticks: { color: 'white' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      },
      y: {
        ticks: { color: 'white' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      }
    }
  };

  // ===== Data untuk Chart 2: Uang Keluar dan Total Saldo =====
  const chartSaldoData = useMemo(() => {
    // Calculate total actual income from all paid statuses
    const totalActualIncome = allKasStatusChart.reduce((sum, statusEntry) => {
      if (statusEntry.status) {
        const minggu = allMingguKas.find(mk => mk.id === statusEntry.minggu_id);
        return sum + (minggu?.jumlah ?? 0);
      }
      return sum;
    }, 0);

    const totalPengeluaranAllTime = allTransaksiKas
      .filter((t) => t.jenis === "pengeluaran")
      .reduce((sum, t) => sum + (t.jumlah ?? 0), 0);

    const currentSaldo = totalActualIncome - totalPengeluaranAllTime;

    return {
      labels: ["Total Pemasukan Aktual", "Total Pengeluaran", "Saldo Saat Ini"],
      datasets: [
        {
          label: "Jumlah",
          data: [totalActualIncome, totalPengeluaranAllTime, currentSaldo],
          backgroundColor: [
            "rgba(75, 192, 192, 0.6)", // Pemasukan
            "rgba(255, 99, 132, 0.6)", // Pengeluaran
            "rgba(54, 162, 235, 0.6)", // Saldo
          ],
          borderColor: [
            "rgba(75, 192, 192, 1)",
            "rgba(255, 99, 132, 1)",
            "rgba(54, 162, 235, 1)",
          ],
          borderWidth: 1,
        },
      ],
    };
  }, [allTransaksiKas, allKasStatusChart, allMingguKas]);


  const chartSaldoOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: 'white',
        },
      },
      title: {
        display: true,
        text: "Ringkasan Keuangan",
        color: 'white',
      },
      tooltip: {
        callbacks: {
          label: function(context: TooltipItem<"bar">) {
            let label = context.dataset.label || '';
            if (label) {
                label += ': ';
            }
            if (context.parsed.y !== null) {
                label += toCurrency(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        ticks: { color: 'white' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      },
      y: {
        ticks: { color: 'white' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      }
    }
  };

  // ===== Data untuk Chart 3: Berapa orang yang bayar dan berapa orang yang belum =====
  const chartStatusBayarData = useMemo(() => {
    const totalMahasiswa = allMahasiswa.length;
    const jumlahSudahBayar = allKasStatusChart.filter(s => s.status === true).length;
    const jumlahBelumBayar = totalMahasiswa - jumlahSudahBayar;

    return {
      labels: ["Sudah Bayar", "Belum Bayar"],
      datasets: [
        {
          data: [jumlahSudahBayar, jumlahBelumBayar],
          backgroundColor: ["rgba(75, 192, 192, 0.6)", "rgba(255, 99, 132, 0.6)"],
          borderColor: ["rgba(75, 192, 192, 1)", "rgba(255, 99, 132, 1)"],
          borderWidth: 1,
        },
      ],
    };
  }, [allMahasiswa, allKasStatusChart]);

  const chartStatusBayarOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: 'white',
        },
      },
      title: {
        display: true,
        text: "Status Pembayaran Mahasiswa",
        color: 'white',
      },
      tooltip: {
        callbacks: {
          label: function(context: TooltipItem<"doughnut">) {
            let label = context.label || '';
            if (label) {
                label += ': ';
            }
            if (context.parsed !== null && typeof context.parsed === 'number') {
                label += context.parsed + ' orang';
            }
            return label;
          }
        }
      }
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950">
      <ElegantStars />
      <Navbar onHeightChange={handleNavbarHeightChange} />

      <main
        className="relative z-10 p-6 md:p-8 flex flex-col items-center justify-center text-center mt-20"
        style={{ paddingTop: navbarHeight || 128 }}
      >
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <CleanText size="text-5xl md:text-7xl" className="mb-4 bg-gradient-to-r from-white via-purple-100 to-white bg-clip-text text-transparent">
            Uang Kas TRPL 1B
          </CleanText>
          <CleanText size="text-xl md:text-2xl" className="text-purple-300">
            Manajemen Keuangan Kelas
          </CleanText>
        </motion.div>

        {/* Summary */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full mb-12"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          {/* Pemasukan minggu ini */}
          <div className="p-6 bg-green-900/30 rounded-xl shadow-lg border border-green-700/40 relative overflow-hidden">
            <div className="absolute inset-0 bg-green-500/5 blur-3xl rounded-full" />
            <CleanText size="text-lg" className="mb-2 text-green-200 relative z-10">Pemasukan Minggu Ini</CleanText>
            <CleanText size="text-3xl" className="font-bold text-green-100 relative z-10">
              {toCurrency(pemasukanMingguIni)}
            </CleanText>
          </div>

          {/* Pengeluaran minggu ini */}
          <div
            className="p-6 bg-red-900/30 rounded-xl shadow-lg border border-red-700/40 cursor-pointer relative overflow-hidden"
            onClick={() => setShowDetail(!showDetail)}
          >
            <div className="absolute inset-0 bg-red-500/5 blur-3xl rounded-full" />
            <CleanText size="text-lg" className="mb-2 text-red-200 relative z-10">Total Pengeluaran</CleanText>
            <CleanText size="text-3xl" className="font-bold text-red-100 relative z-10">
              {toCurrency(totalPengeluaran)}
            </CleanText>
            <p className="text-sm text-red-300 mt-2 relative z-10">
              {showDetail ? "Klik sembunyikan" : "Klik lihat detail"}
            </p>
          </div>

          {/* Saldo total */}
          <div className="p-6 bg-blue-900/30 rounded-xl shadow-lg border border-blue-700/40 relative overflow-hidden">
            <div className="absolute inset-0 bg-blue-500/5 blur-3xl rounded-full" />
            <CleanText size="text-lg" className="mb-2 text-blue-200 relative z-10">Saldo Kas</CleanText>
            <CleanText size="text-3xl" className="font-bold text-blue-100 relative z-10">
              {toCurrency(saldoTotal)}
            </CleanText>
          </div>
        </motion.div>

        {/* Detail Pengeluaran Minggu Ini */}
        {showDetail && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="p-6 border rounded-xl bg-slate-800/60 border-slate-700/50 max-w-4xl w-full mb-12"
          >
            <CleanText size="text-xl" className="font-bold mb-4 text-white">Detail Pengeluaran</CleanText>
            {detailPengeluaran.length === 0 ? (
              <div className="text-slate-400">Belum ada pengeluaran minggu ini.</div>
            ) : (
              <ul className="space-y-2 text-slate-300">
                {detailPengeluaran.map((item, i) => (
                  <li key={i} className="flex justify-between items-center bg-slate-700/40 p-3 rounded-md">
                    <span className="font-medium">{item.deskripsi}</span>
                    <span className="font-bold">{toCurrency(item.jumlah)}</span>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}

        {/* Chart Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 max-w-6xl w-full mb-12">
          {/* Chart 1: Uang kas dari minggu ke minggu */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="p-6 bg-slate-800/60 rounded-xl shadow-lg border border-slate-700/50"
          >
            <Line data={chartMingguKasData} options={chartMingguKasOptions} />
          </motion.div>

          {/* Chart 2: Ringkasan Keuangan */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="p-6 bg-slate-800/60 rounded-xl shadow-lg border border-slate-700/50"
          >
            <Bar data={chartSaldoData} options={chartSaldoOptions} />
          </motion.div>

          {/* Chart 3: Status Pembayaran Mahasiswa */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="p-6 bg-slate-800/60 rounded-xl shadow-lg border border-slate-700/50"
          >
            <Doughnut data={chartStatusBayarData} options={chartStatusBayarOptions} />
          </motion.div>
        </div>


        {/* Cek Pembayaran */}
        <motion.div
          className="p-6 bg-slate-800/60 rounded-xl border border-slate-700/50 max-w-4xl w-full mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <CleanText size="text-xl" className="font-bold mb-4 text-white">🔍 Cek Pembayaran Kas</CleanText>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <input
              type="text"
              placeholder="Masukkan NIM Anda"
              value={nim}
              onChange={(e) => setNim(e.target.value)}
              className="border p-3 rounded-lg w-full bg-slate-900 text-white border-slate-700 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
            />
            <motion.button
              onClick={handleCekPembayaran}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Cek Pembayaran
            </motion.button>
          </div>
          {studentName && (
            <CleanText size="text-lg" className="text-purple-300 mb-4">
              Nama Mahasiswa: {studentName}
            </CleanText>
          )}
          <ul className="space-y-2 text-slate-300">
            {statusBayar.length > 0 ? (
              statusBayar.map((item: StatusBayarItem, i) => (
                <li key={i} className="flex justify-between items-center bg-slate-700/40 p-3 rounded-md">
                  <span className="font-medium">Minggu {item.minggu_kas?.[0]?.minggu ?? 'N/A'}</span>
                  <span>
                    {item.status ? "✅ Sudah Bayar" : "❌ Belum Bayar"} ({toCurrency(item.minggu_kas?.[0]?.jumlah ?? 0)})
                  </span>
                </li>
              ))
            ) : (
              nim && (
                <CleanText size="text-sm" className="text-slate-400">
                  Masukkan NIM untuk melihat status pembayaran Anda.
                </CleanText>
              )
            )}
          </ul>
        </motion.div>

        {/* Footer */}
        <motion.div
          className="mt-20 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <div className="text-slate-500 text-sm mb-4">
            System Online • @scriptb25
          </div>
          <div className="flex justify-center items-center gap-2">
            <motion.div
              className="w-2 h-2 bg-green-400 rounded-full"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-green-400 text-xs">Connected</span>
          </div>
        </motion.div>
      </main>

      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-900/10 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-900/10 rounded-full blur-3xl opacity-50" />
      </div>
    </div>
  );
}