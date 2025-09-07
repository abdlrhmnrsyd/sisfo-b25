"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";

type Mahasiswa = {
  id: string;
  nim: string;
  nama: string;
};

type MingguKas = {
  id: string;
  minggu: number;
  jumlah: number;
};

type KasStatus = {
  mahasiswa_id: string;
  minggu_id: string;
  status: boolean;
};

export default function AdminCashPage() {
  const [jumlah, setJumlah] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [keluar, setKeluar] = useState("");
  const [mahasiswa, setMahasiswa] = useState<Mahasiswa[]>([]);
  const [mingguKas, setMingguKas] = useState<MingguKas[]>([]);
  const [kasStatus, setKasStatus] = useState<KasStatus[]>([]);

  const nextMinggu = useMemo(() => {
    if (!mingguKas.length) return 1;
    return Math.max(...mingguKas.map((m) => m.minggu)) + 1;
  }, [mingguKas]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: mhs } = await supabase.from("mahasiswa").select("*");
    if (mhs) setMahasiswa(mhs);

    const { data: mk } = await supabase.from("minggu_kas").select("*");
    if (mk) setMingguKas(mk);

    const { data: ks } = await supabase.from("kas_status").select("*");
    if (ks) setKasStatus(ks);
  };

  const addMingguKas = async () => {
    const jumlahNum = parseInt(jumlah || "0", 10);
    const currentMax = mingguKas.length
      ? Math.max(...mingguKas.map((m) => m.minggu))
      : 0;
    const nextMinggu = currentMax + 1;
    const { data: mk } = await supabase
      .from("minggu_kas")
      .insert([{ minggu: nextMinggu, jumlah: jumlahNum }])
      .select();

    if (mk) {
      for (const m of mahasiswa) {
        await supabase.from("kas_status").insert([
          { mahasiswa_id: m.id, minggu_id: mk[0].id, status: false },
        ]);
      }
    }
    fetchData();
    setJumlah("");
  };

  const addPengeluaran = async () => {
    const keluarNum = parseInt(keluar || "0", 10);
    await supabase.from("transaksi_kas").insert([
      { jenis: "pengeluaran", deskripsi, jumlah: keluarNum },
    ]);
    setDeskripsi("");
    setKeluar("");
  };

  const updateStatus = async (
    mhsId: string,
    mingguId: string,
    status: boolean
  ) => {
    await supabase
      .from("kas_status")
      .update({ status })
      .eq("mahasiswa_id", mhsId)
      .eq("minggu_id", mingguId);

    setKasStatus((prev) =>
      prev.map((ks) =>
        ks.mahasiswa_id === mhsId && ks.minggu_id === mingguId
          ? { ...ks, status }
          : ks
      )
    );
  };

  const getStatus = (mhsId: string, mingguId: string) => {
    const found = kasStatus.find(
      (ks) => ks.mahasiswa_id === mhsId && ks.minggu_id === mingguId
    );
    return found ? found.status : false;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200">
      <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-8">
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-indigo-700 to-purple-700">📊 Admin Kas TRPL 1B</span>
          </h1>
          <p className="text-gray-600 mt-2 text-sm md:text-base">Kelola data mahasiswa, minggu kas, dan transaksi dengan mudah</p>
        </div>

        {/* Tambah Data Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Minggu Kas */}
          <div className="p-5 md:p-6 rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
            <h2 className="font-semibold text-lg mb-4 text-gray-900 flex items-center gap-2">
              <span>📅</span> Tambah Minggu Kas
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-700">Jumlah (Rp)</label>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="Contoh: 2000"
                  className="mt-1 border border-gray-300 p-2.5 rounded-lg w-full text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={jumlah}
                  onChange={(e) => setJumlah(e.target.value)}
                />
              </div>
              <button
                onClick={addMingguKas}
                className="w-full mt-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white transition"
              >
                Simpan (Minggu berikutnya otomatis)
              </button>
              <p className="text-xs text-gray-500">Minggu berikutnya: <span className="font-semibold text-gray-700">{nextMinggu}</span></p>
            </div>
          </div>

          {/* Pengeluaran */}
          <div className="p-5 md:p-6 rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
            <h2 className="font-semibold text-lg mb-4 text-gray-900 flex items-center gap-2">
              <span>💸</span> Tambah Pengeluaran
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-700">Deskripsi</label>
                <input
                  type="text"
                  placeholder="Contoh: Beli ATK"
                  className="mt-1 border border-gray-300 p-2.5 rounded-lg w-full text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm text-gray-700">Jumlah (Rp)</label>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="Contoh: 10000"
                  className="mt-1 border border-gray-300 p-2.5 rounded-lg w-full text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={keluar}
                  onChange={(e) => setKeluar(e.target.value)}
                />
              </div>
              <button
                onClick={addPengeluaran}
                className="w-full mt-2 bg-red-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-white transition"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>

        {/* Tabel Status Pembayaran */}
        <div className="p-4 md:p-6 rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-xl text-gray-900 flex items-center gap-2">
              <span>📑</span> Status Pembayaran Mahasiswa
            </h2>
            <span className="text-sm text-gray-500">Total Mahasiswa: {mahasiswa.length}</span>
          </div>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="min-w-full w-max text-sm">
              <thead className="bg-gray-100/80 text-gray-900 sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-3 text-left font-semibold border-b border-gray-200 w-28 md:w-32 sticky left-0 bg-gray-100/80 backdrop-blur-sm">NIM</th>
                  <th className="px-4 py-3 text-left font-semibold border-b border-gray-200 sticky left-28 md:left-32 bg-gray-100/80 backdrop-blur-sm">Nama</th>
                  {mingguKas.map((mk) => (
                    <th key={mk.id} className="px-4 py-3 text-center font-semibold border-b border-gray-200">
                      Minggu {mk.minggu}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mahasiswa.map((m, i) => (
                  <tr
                    key={m.id}
                    className={`${i % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-indigo-50/60 transition-colors`}
                  >
                    <td className="px-3 py-3 text-gray-800 border-b border-gray-100 w-28 md:w-32 whitespace-nowrap font-mono sticky left-0 bg-inherit">{m.nim}</td>
                    <td className="px-4 py-3 text-gray-800 border-b border-gray-100 sticky left-28 md:left-32 bg-inherit">{m.nama}</td>
                    {mingguKas.map((mk) => (
                      <td key={mk.id} className="px-4 py-3 text-center border-b border-gray-100">
                        <div className="inline-flex items-center justify-center gap-2">
                          <button
                            type="button"
                            aria-label="Tandai sudah bayar"
                            className={`px-2 py-1 rounded-md text-lg transition ${getStatus(m.id, mk.id) === true ? "bg-green-100 text-green-700 ring-1 ring-green-300" : "hover:bg-green-50 text-green-700"}`}
                            onClick={() => updateStatus(m.id, mk.id, true)}
                          >
                            ✅
                          </button>
                          <button
                            type="button"
                            aria-label="Tandai belum bayar"
                            className={`px-2 py-1 rounded-md text-lg transition ${getStatus(m.id, mk.id) === false ? "bg-red-100 text-red-700 ring-1 ring-red-300" : "hover:bg-red-50 text-red-700"}`}
                            onClick={() => updateStatus(m.id, mk.id, false)}
                          >
                            ❌
                          </button>
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center gap-3 px-4 py-3 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1"><span>✅</span> Sudah bayar</span>
              <span className="inline-flex items-center gap-1"><span>❌</span> Belum bayar</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
