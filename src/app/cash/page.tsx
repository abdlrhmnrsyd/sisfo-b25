"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import ElegantStars from "../components/ElegantStars";
import CleanText from "../components/CleanText";
import PaymentModal from "../components/PaymentModal";
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


type KasStatusRow = {
  status: boolean;
  minggu_kas: {
    minggu: number;
    jumlah: number;
  };
};

type TransaksiKas = {
  jumlah: number;
  deskripsi: string;
  jenis: string;
  created_at?: string;
};

type MingguKas = {
  id: string;
  minggu: number;
  jumlah: number;
  created_at?: string;
};

type Mahasiswa = {
  id: string;
  nama?: string;
  nim?: string;
};

type KasStatusChart = {
  status: boolean;
  minggu_id: string;
};

type StatusBayarItem = {
  status: boolean;
  created_at: string;
  minggu_id: string;
  minggu_kas: {
    minggu: number;
    jumlah: number;
  };
};

export default function CashPage() {
  const [pemasukanMingguIni, setPemasukanMingguIni] = useState(0);
  const [totalPengeluaran, setTotalPengeluaran] = useState(0);
  const [saldoTotal, setSaldoTotal] = useState(0);
  const [detailPengeluaran, setDetailPengeluaran] = useState<TransaksiKas[]>([]);
  const [showDetail, setShowDetail] = useState(false);

  const [nim, setNim] = useState("");
  const [mahasiswaId, setMahasiswaId] = useState<string | null>(null);
  const [statusBayar, setStatusBayar] = useState<StatusBayarItem[]>([]);
  const [studentName, setStudentName] = useState<string | null>(null);
  const [authorized, setAuthorized] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authChecking, setAuthChecking] = useState(false);
  const [showQris, setShowQris] = useState(false);
  const [qrisForWeek, setQrisForWeek] = useState<number | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentWeek, setSelectedPaymentWeek] = useState<{
    minggu: number;
    amount: number;
    mingguId: string;
  } | null>(null);
  const QRIS_URL = "/tes.jpg"; // ganti ke "/qris.png" jika Anda menambahkan file QRIS

  // Data untuk charts
  const [allMingguKas, setAllMingguKas] = useState<MingguKas[]>([]);
  const [allTransaksiKas, setAllTransaksiKas] = useState<TransaksiKas[]>([]);
  const [allMahasiswa, setAllMahasiswa] = useState<Mahasiswa[]>([]);
  const [allKasStatusChart, setAllKasStatusChart] = useState<KasStatusChart[]>([]);

  const [navbarHeight, setNavbarHeight] = useState(0);
  const handleNavbarHeightChange = (height: number) => setNavbarHeight(height);

  // Cookie helpers
  const setCookie = (name: string, value: string, days: number) => {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    const expires = `; expires=${date.toUTCString()}`;
    document.cookie = `${name}=${encodeURIComponent(value || "")}${expires}; path=/`;
  };
  const getCookie = (name: string) => {
    const nameEQ = name + "=";
    const ca = document.cookie.split("; ");
    for (let i = 0; i < ca.length; i++) {
      const c = ca[i];
      if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length));
    }
    return null;
  };

  const toCurrency = (n: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
  const toCompact = (n: number) =>
    new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 }).format(n);

  // ===== Ambil summary kas =====
  const fetchSummary = async () => {
    // 1) Ambil minggu aktif (terbaru)
    const { data: minggu, error: mingguError } = await supabase
      .from("minggu_kas")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1);

    if (mingguError || !minggu?.length) {
      console.error("Error fetch minggu_kas:", mingguError);
      // saldo dihitung di bawah tetap (all time) — lanjuttttt
    }

    const mingguAktif = minggu?.[0];
    const mingguId = mingguAktif?.id;
    const jumlahPerMinggu = mingguAktif?.jumlah ?? 0;

    if (mingguId) {
      const { data: statusThisWeek, error: statusError } = await supabase
        .from("kas_status")
        .select("status")
        .eq("minggu_id", mingguId);

      if (statusError) {
        console.error("Error fetch kas_status minggu ini:", statusError);
        setPemasukanMingguIni(0);
      } else {
        const paidCount = statusThisWeek?.filter((s) => s.status === true).length ?? 0;
        setPemasukanMingguIni(paidCount * jumlahPerMinggu);
      }
    }

    const { data: keluarAll, error: keluarAllError } = await supabase
      .from("transaksi_kas")
      .select("jumlah, deskripsi, jenis, created_at")
      .eq("jenis", "pengeluaran")
      .order("created_at", { ascending: false });

    if (keluarAllError) {
      console.error("Error fetch all pengeluaran:", keluarAllError);
      setTotalPengeluaran(0);
      setDetailPengeluaran([]);
    } else {
      const totalPengeluaranComputed = keluarAll?.reduce((sum, item) => sum + (item.jumlah ?? 0), 0) ?? 0;
      setTotalPengeluaran(totalPengeluaranComputed);
      setDetailPengeluaran(keluarAll || []);
    }

    const { data: paidStatusAll, error: paidStatusAllErr } = await supabase
      .from("kas_status")
      .select("status, minggu_kas(minggu, jumlah)")
      .eq("status", true);

    if (paidStatusAllErr) {
      console.error("Error fetch all paid status:", paidStatusAllErr);
      setSaldoTotal(0);
      return;
    }

    
    const totalPemasukanAll = paidStatusAll?.reduce((sum: number, row: { minggu_kas?: { jumlah?: number } | { jumlah?: number }[] }) => {
      const mingguKas = row?.minggu_kas;
      const jumlahMinggu = Array.isArray(mingguKas)
        ? (mingguKas?.[0]?.jumlah ?? 0)
        : (mingguKas?.jumlah ?? 0);
      return sum + jumlahMinggu;
    }, 0) ?? 0;

    const totalPengeluaranForSaldo = 
      keluarAll?.reduce((sum, item) => sum + (item.jumlah ?? 0), 0) ?? 0;
    setSaldoTotal(totalPemasukanAll - totalPengeluaranForSaldo);

    const { data: allMingguKasData, error: allMingguKasError } = await supabase
      .from("minggu_kas")
      .select("*")
      .order("minggu", { ascending: true });
    if (allMingguKasError) console.error("Error fetching all minggu_kas:", allMingguKasError);
    setAllMingguKas(allMingguKasData || []);

    const { data: allTransaksiKasData, error: allTransaksiKasError } = await supabase
      .from("transaksi_kas")
      .select("jumlah, jenis, deskripsi");
    if (allTransaksiKasError) console.error("Error fetching all transaksi_kas:", allTransaksiKasError);
    setAllTransaksiKas(allTransaksiKasData || []);

    const { data: allMahasiswaData, error: allMahasiswaError } = await supabase
      .from("mahasiswa")
      .select("id");
    if (allMahasiswaError) console.error("Error fetching all mahasiswa:", allMahasiswaError);
    setAllMahasiswa(allMahasiswaData || []);

    const { data: allKasStatusChartData, error: allKasStatusChartError } = await supabase
      .from("kas_status")
      .select("status, minggu_id");
    if (allKasStatusChartError) console.error("Error fetching all kas_status for chart:", allKasStatusChartError);
    setAllKasStatusChart(allKasStatusChartData || []);
  };

  useEffect(() => {
    if (authorized) {
      fetchSummary();
    }
  }, [authorized]);

  // Auto authorize via cookie on mount
  useEffect(() => {
    const savedNim = getCookie("nim");
    if (savedNim && !authorized) {
      setNim(savedNim);
      void authorizeByNim(savedNim, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAuthorize = async () => {
    const nimTrim = nim.trim();
    if (!nimTrim) {
      setAuthError("Silakan masukkan NIM terlebih dahulu.");
      return;
    }
    await authorizeByNim(nimTrim, false);
  };

  const authorizeByNim = async (nimStr: string, silent: boolean) => {
    setAuthChecking(true);
    if (!silent) setAuthError(null);
    try {
      const { data: mhs, error: mhsError } = await supabase
        .from("mahasiswa")
        .select("id, nama")
        .eq("nim", nimStr)
        .single();

      if (mhsError || !mhs) {
        if (!silent) setAuthError("Anda bukan siswa TRPL 1B.");
        setAuthorized(false);
        return;
      }

      setNim(nimStr);
      setStudentName(mhs.nama ?? null);
      setMahasiswaId(mhs.id);
      setAuthorized(true);
      setCookie("nim", nimStr, 7);
      // Setelah otorisasi berhasil, langsung tampilkan hasil cek pembayaran
      await handleCekPembayaran();
    } finally {
      setAuthChecking(false);
    }
  };

  const handleAuthorizeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      void handleAuthorize();
    }
  };

  const handleCekPembayaran = async () => {
    let nimTrim = nim.trim();
    if (!nimTrim) {
      const cookieNim = getCookie("nim");
      if (!cookieNim) return;
      nimTrim = cookieNim.trim();
      setNim(nimTrim);
    }

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
    setMahasiswaId(mhs.id);

    const { data, error } = await supabase
      .from("kas_status")
      .select("status, created_at, minggu_id, minggu_kas(minggu, jumlah)")
      .eq("mahasiswa_id", mhs.id)
      .order("created_at");

    if (error) {
      console.error("Error cek pembayaran:", error);
      return;
    }

    const transformedData = (data || []).map(item => ({
      ...item,
      minggu_kas: Array.isArray(item.minggu_kas) ? item.minggu_kas[0] : item.minggu_kas
    }));
    setStatusBayar(transformedData);
  };

  const handleShowQris = (weekNumber: number) => {
    setQrisForWeek(weekNumber);
    setShowQris(true);
  };

  const handlePayment = (weekNumber: number, amount: number, mingguId: string) => {
    setSelectedPaymentWeek({ minggu: weekNumber, amount, mingguId });
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    setSelectedPaymentWeek(null);
    // Refresh payment status
    handleCekPembayaran();
    fetchSummary();
  };

  const chartMingguKasData = useMemo(() => {
    const sortedMingguKas = [...allMingguKas].sort((a, b) => a.minggu - b.minggu);

    const labels = sortedMingguKas.map((mk) => `Minggu ${mk.minggu}`);
    const data = sortedMingguKas.map((mk) => {
      const paidCount = allKasStatusChart.filter(
        (statusEntry) => statusEntry.minggu_id === mk.id && statusEntry.status === true
      ).length;
      return paidCount * (mk.jumlah ?? 0);
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
  

  const chartSaldoData = useMemo(() => {
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
            "rgba(75, 192, 192, 0.6)",
            "rgba(255, 99, 132, 0.6)",
            "rgba(54, 162, 235, 0.6)",
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


  // Dummy object not used anymore (kept for compatibility but without types)
  const chartSaldoOptions = {} as const;

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

  const chartStatusBayarOptions = {} as const;

  if (!authorized) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-slate-950">
        <ElegantStars />
        <Navbar onHeightChange={handleNavbarHeightChange} />
        <main
          className="relative z-10 p-6 md:p-8 flex flex-col items-center justify-center text-center min-h-screen"
          style={{ paddingTop: navbarHeight || 128 }}
        >
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            <div className="p-6 rounded-xl bg-slate-900/70 border border-slate-700/60">
              <div className="mb-4 text-left">
                <CleanText size="text-xl" className="text-white">Masuk dengan NIM</CleanText>
                <div className="text-sm text-slate-400">Akses Uang Kas TRPL 1B</div>
              </div>

              <div className="flex flex-col gap-3 text-left">
                <input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="Masukkan NIM"
                  value={nim}
                  onChange={(e) => setNim(e.target.value.replace(/\D/g, ""))}
                  onKeyDown={handleAuthorizeKeyDown}
                  className="px-4 py-3 w-full rounded-lg bg-slate-800/80 text-white placeholder-slate-400 border border-slate-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 outline-none transition-all"
                  autoFocus
                />

                {authError && (
                  <div className="text-red-400 text-sm">{authError}</div>
                )}

                <motion.button
                  onClick={handleAuthorize}
                  className="inline-flex items-center justify-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-60"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={authChecking}
                >
                  {authChecking && (
                    <span className="inline-block h-4 w-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
                  )}
                  {authChecking ? "Memeriksa..." : "Masuk"}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

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

        {/* Cek Pembayaran - dipindah ke atas dan auto terisi setelah otorisasi */}
        <motion.div
          className="relative max-w-4xl w-full mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600/50 to-fuchsia-600/50 rounded-2xl blur opacity-30" />
          <div className="relative p-6 rounded-2xl bg-slate-900/60 border border-slate-700/60">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 text-left">
                <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 grid place-items-center">🔎</div>
                <div>
                  <CleanText size="text-xl" className="text-white">Cek Pembayaran Kas</CleanText>
                  <div className="text-xs text-slate-400">Status pembayaran per minggu</div>
                </div>
              </div>
              {studentName && (
                <div className="px-3 py-1 rounded-full text-sm bg-purple-600/20 border border-purple-500/30 text-purple-200">
                  {studentName}
                </div>
              )}

            </div>

            {/* Ringkasan singkat */}
            {statusBayar.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4 text-left">
                <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/60">
                  <div className="text-xs text-slate-400">Total Minggu</div>
                  <div className="text-white text-lg font-semibold">{statusBayar.length}</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/60">
                  <div className="text-xs text-slate-400">Sudah Bayar</div>
                  <div className="text-emerald-300 text-lg font-semibold">{statusBayar.filter(s => s.status).length}</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/60 col-span-2 md:col-span-1">
                  <div className="text-xs text-slate-400">Total Dibayar</div>
                  <div className="text-white text-lg font-semibold">
                    {toCurrency(statusBayar.filter(s => s.status).reduce((sum, s) => sum + (s.minggu_kas?.jumlah ?? 0), 0))}
                  </div>
                </div>
              </div>
            )}

            {/* Daftar status */}
            <div className="text-left">
              {statusBayar.length > 0 ? (
                <ul className="divide-y divide-slate-700/60 rounded-lg overflow-hidden border border-slate-700/60">
                  {statusBayar.map((item: StatusBayarItem, i) => (
                    <li key={i} className="flex items-center justify-between gap-3 bg-slate-800/40 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-700/60 grid place-items-center text-slate-300">#{item.minggu_kas?.minggu ?? '–'}</div>
                        <div>
                          <div className="text-white font-medium">Minggu {item.minggu_kas?.minggu ?? 'N/A'}</div>
                          <div className="text-xs text-slate-400">Nominal {toCurrency(item.minggu_kas?.jumlah ?? 0)}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!item.status && (
                          <>
                            <motion.button
                              onClick={() => handlePayment(
                                item.minggu_kas?.minggu ?? 0,
                                item.minggu_kas?.jumlah ?? 0,
                                item.minggu_id ?? ''
                              )}
                              className="px-3 py-1.5 rounded-lg text-xs bg-purple-600 text-white hover:bg-purple-700 transition-colors"
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              Bayar Sekarang
                            </motion.button>

                          </>
                        )}
                        <span className={`${item.status ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/30' : 'bg-rose-600/20 text-rose-300 border-rose-500/30'} px-3 py-1 rounded-full text-xs border` }>
                          {item.status ? 'Sudah Bayar' : 'Belum Bayar'}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-6 rounded-lg bg-slate-800/50 border border-slate-700/60 text-slate-300">
                  Belum ada data pembayaran untuk ditampilkan.
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Modal QRIS */}
        {showQris && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60" onClick={() => setShowQris(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative z-10 w-[90%] max-w-md p-5 rounded-2xl bg-slate-900 border border-slate-700 text-left"
            >
              <div className="mb-3">
                <CleanText size="text-lg" className="text-white">QRIS Pembayaran {qrisForWeek ? `- Minggu ${qrisForWeek}` : ''}</CleanText>
                <div className="text-xs text-slate-400">Scan QR untuk membayar kas</div>
              </div>
              <div className="rounded-xl overflow-hidden bg-slate-800 border border-slate-700 mb-4 grid place-items-center">
                <img src={QRIS_URL} alt="QRIS" className="w-full max-w-xs object-contain" />
              </div>
              <div className="flex items-center justify-end gap-2">
                <motion.button
                  onClick={() => setShowQris(false)}
                  className="px-4 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-600"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Tutup
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Payment Modal */}
        {showPaymentModal && selectedPaymentWeek && studentName && mahasiswaId && (
          <PaymentModal
            isOpen={showPaymentModal}
            onClose={() => setShowPaymentModal(false)}
            onPaymentSuccess={handlePaymentSuccess}
            mingguNumber={selectedPaymentWeek.minggu}
            amount={selectedPaymentWeek.amount}
            studentName={studentName}
            mahasiswaId={mahasiswaId}
            mingguId={selectedPaymentWeek.mingguId}
          />
        )}

        {/* Summary */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full mb-12"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          {/* Pemasukan minggu ini */}
          <div className="p-6 bg-slate-900/60 rounded-xl shadow-xl border border-green-700/40 relative overflow-hidden hover:shadow-green-900/20 hover:scale-[1.01] transition-transform">
            <div className="absolute -inset-1 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-2xl blur-2xl" />
            <CleanText size="text-lg" className="mb-2 text-green-200 relative z-10">Pemasukan Minggu Ini</CleanText>
            <CleanText size="text-3xl" className="font-bold text-green-100 relative z-10">
              {toCurrency(pemasukanMingguIni)}
            </CleanText>
          </div>

          {/* Pengeluaran minggu ini */}
          <div
            className="p-6 bg-slate-900/60 rounded-xl shadow-xl border border-red-700/40 cursor-pointer relative overflow-hidden hover:shadow-rose-900/20 hover:scale-[1.01] transition-transform"
            onClick={() => setShowDetail(!showDetail)}
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-rose-500/10 to-orange-500/10 rounded-2xl blur-2xl" />
            <CleanText size="text-lg" className="mb-2 text-red-200 relative z-10">Total Pengeluaran</CleanText>
            <CleanText size="text-3xl" className="font-bold text-red-100 relative z-10">
              {toCurrency(totalPengeluaran)}
            </CleanText>
            <p className="text-sm text-red-300 mt-2 relative z-10">
              {showDetail ? "Klik sembunyikan" : "Klik lihat detail"}
            </p>
          </div>

          {/* Saldo total */}
          <div className="p-6 bg-slate-900/60 rounded-xl shadow-xl border border-blue-700/40 relative overflow-hidden hover:shadow-blue-900/20 hover:scale-[1.01] transition-transform">
            <div className="absolute -inset-1 bg-gradient-to-r from-sky-500/10 to-indigo-500/10 rounded-2xl blur-2xl" />
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
            className="p-6 border rounded-2xl bg-slate-900/60 border-slate-700/60 max-w-4xl w-full mb-12"
          >
            <div className="flex items-center justify-between mb-4">
              <CleanText size="text-xl" className="font-bold text-white">Detail Pengeluaran</CleanText>
              <span className="text-xs px-2 py-1 rounded-full bg-rose-600/20 text-rose-300 border border-rose-500/30">
                {detailPengeluaran.length} item
              </span>
            </div>
            {detailPengeluaran.length === 0 ? (
              <div className="text-slate-400 p-6 rounded-lg bg-slate-800/50 border border-slate-700/60">Belum ada pengeluaran minggu ini.</div>
            ) : (
              <ul className="space-y-2 text-slate-300">
                {detailPengeluaran.map((item, i) => (
                  <li key={i} className="flex justify-between items-center bg-slate-800/60 border border-slate-700/60 p-3 rounded-lg">
                    <div className="flex flex-col text-left">
                      <span className="font-medium text-white">{item.deskripsi}</span>
                      <span className="text-xs text-slate-400">
                        {item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'Tanggal tidak tersedia'}
                      </span>
                    </div>
                    <span className="font-bold text-rose-200">{toCurrency(item.jumlah)}</span>
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
            className="relative p-6 bg-slate-900/60 rounded-2xl shadow-xl border border-slate-700/60 overflow-hidden"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/10 to-teal-500/10 rounded-2xl blur-2xl" />
            <Line data={chartMingguKasData} options={chartMingguKasOptions} />
          </motion.div>

          {/* Chart 2: Ringkasan Keuangan */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative p-6 bg-slate-900/60 rounded-2xl shadow-xl border border-slate-700/60 overflow-hidden"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 rounded-2xl blur-2xl" />
            <Bar data={chartSaldoData} options={chartSaldoOptions} />
          </motion.div>

          {/* Chart 3: Status Pembayaran Mahasiswa */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="relative p-6 bg-slate-900/60 rounded-2xl shadow-xl border border-slate-700/60 overflow-hidden"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/10 to-pink-500/10 rounded-2xl blur-2xl" />
            <Doughnut data={chartStatusBayarData} options={chartStatusBayarOptions} />
          </motion.div>
        </div>


        {/* Cek Pembayaran dipindah ke atas */}

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