"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AdminCashPage() {
  const [nim, setNim] = useState("");
  const [nama, setNama] = useState("");
  const [minggu, setMinggu] = useState(1);
  const [jumlah, setJumlah] = useState(0);
  const [deskripsi, setDeskripsi] = useState("");
  const [keluar, setKeluar] = useState(0);
  const [mahasiswa, setMahasiswa] = useState<any[]>([]);
  const [mingguKas, setMingguKas] = useState<any[]>([]);
  const [kasStatus, setKasStatus] = useState<any[]>([]);

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

  const addMahasiswa = async () => {
    await supabase.from("mahasiswa").insert([{ nim, nama }]);
    fetchData();
    setNim("");
    setNama("");
  };

  const addMingguKas = async () => {
    const { data: mk } = await supabase
      .from("minggu_kas")
      .insert([{ minggu, jumlah }])
      .select();

    if (mk) {
      for (const m of mahasiswa) {
        await supabase.from("kas_status").insert([
          { mahasiswa_id: m.id, minggu_id: mk[0].id, status: false },
        ]);
      }
    }
    fetchData();
    setMinggu(1);
    setJumlah(0);
  };

  const addPengeluaran = async () => {
    await supabase.from("transaksi_kas").insert([
      { jenis: "pengeluaran", deskripsi, jumlah: keluar },
    ]);
    setDeskripsi("");
    setKeluar(0);
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
    <div className="p-6 max-w-7xl mx-auto space-y-8 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold text-center mb-6 text-gray-900">
        📊 Admin Kas TRPL 1B
      </h1>

      {/* Tambah Data Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Mahasiswa */}
        <div className="p-5 border rounded-xl shadow bg-white">
          <h2 className="font-semibold text-lg mb-3 text-gray-900">
            👨‍🎓 Tambah Mahasiswa
          </h2>
          <input
            type="text"
            placeholder="NIM"
            className="border p-2 rounded w-full mt-2 text-gray-900"
            value={nim}
            onChange={(e) => setNim(e.target.value)}
          />
          <input
            type="text"
            placeholder="Nama"
            className="border p-2 rounded w-full mt-2 text-gray-900"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
          />
          <button
            onClick={addMahasiswa}
            className="mt-3 bg-green-600 text-white px-4 py-2 rounded w-full hover:bg-green-700"
          >
            Simpan
          </button>
        </div>

        {/* Minggu Kas */}
        <div className="p-5 border rounded-xl shadow bg-white">
          <h2 className="font-semibold text-lg mb-3 text-gray-900">
            📅 Tambah Minggu Kas
          </h2>
          <input
            type="number"
            placeholder="Minggu ke-"
            className="border p-2 rounded w-full mt-2 text-gray-900"
            value={minggu}
            onChange={(e) => setMinggu(Number(e.target.value))}
          />
          <input
            type="number"
            placeholder="Jumlah (Rp)"
            className="border p-2 rounded w-full mt-2 text-gray-900"
            value={jumlah}
            onChange={(e) => setJumlah(Number(e.target.value))}
          />
          <button
            onClick={addMingguKas}
            className="mt-3 bg-blue-600 text-white px-4 py-2 rounded w-full hover:bg-blue-700"
          >
            Simpan
          </button>
        </div>

        {/* Pengeluaran */}
        <div className="p-5 border rounded-xl shadow bg-white">
          <h2 className="font-semibold text-lg mb-3 text-gray-900">
            💸 Tambah Pengeluaran
          </h2>
          <input
            type="text"
            placeholder="Deskripsi"
            className="border p-2 rounded w-full mt-2 text-gray-900"
            value={deskripsi}
            onChange={(e) => setDeskripsi(e.target.value)}
          />
          <input
            type="number"
            placeholder="Jumlah (Rp)"
            className="border p-2 rounded w-full mt-2 text-gray-900"
            value={keluar}
            onChange={(e) => setKeluar(Number(e.target.value))}
          />
          <button
            onClick={addPengeluaran}
            className="mt-3 bg-red-600 text-white px-4 py-2 rounded w-full hover:bg-red-700"
          >
            Simpan
          </button>
        </div>
      </div>

      {/* Tabel Status Pembayaran */}
      <div className="p-6 border rounded-xl shadow bg-white overflow-x-auto">
        <h2 className="font-semibold text-xl mb-4 text-gray-900">
          📑 Status Pembayaran Mahasiswa
        </h2>

        <table className="min-w-full border border-gray-300">
          <thead className="bg-gray-200 text-gray-900">
            <tr>
              <th className="border px-4 py-2 text-left">Nama</th>
              <th className="border px-4 py-2 text-left">NIM</th>
              {mingguKas.map((mk) => (
                <th key={mk.id} className="border px-4 py-2 text-center">
                  Minggu {mk.minggu}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mahasiswa.map((m, i) => (
              <tr
                key={m.id}
                className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
              >
                <td className="border px-4 py-2 text-gray-800">{m.nama}</td>
                <td className="border px-4 py-2 text-gray-800">{m.nim}</td>
                {mingguKas.map((mk) => (
                  <td key={mk.id} className="border px-4 py-2 text-center">
                    <div className="flex justify-center gap-3">
                      <label className="flex items-center gap-1 text-green-700">
                        <input
                          type="radio"
                          name={`status-${m.id}-${mk.id}`}
                          checked={getStatus(m.id, mk.id) === true}
                          onChange={() => updateStatus(m.id, mk.id, true)}
                        />
                        Sudah
                      </label>
                      <label className="flex items-center gap-1 text-red-700">
                        <input
                          type="radio"
                          name={`status-${m.id}-${mk.id}`}
                          checked={getStatus(m.id, mk.id) === false}
                          onChange={() => updateStatus(m.id, mk.id, false)}
                        />
                        Belum
                      </label>
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
