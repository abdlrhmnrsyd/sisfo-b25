"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";


type Jadwal = {
  id: number;
  hari: string;
  matkul: string;
  dosen: string;
  lokasi: string;
  jam_mulai: string;
  jam_selesai: string;
};

export default function AdminPage() {
  const [jadwal, setJadwal] = useState<Jadwal[]>([]);
  const [form, setForm] = useState<Omit<Jadwal, "id">>({
    hari: "",
    matkul: "",
    dosen: "",
    lokasi: "",
    jam_mulai: "",
    jam_selesai: ""
  });
  const [editId, setEditId] = useState<number | null>(null);

  const fetchData = async () => {
    const { data, error } = await supabase.from("jadwal").select("*").order("jam_mulai");
    if (!error) setJadwal(data || []);
  };

  const addData = async () => {
    const payload = {
      ...form,
      jam_mulai: form.jam_mulai.length === 5 ? form.jam_mulai + ":00" : form.jam_mulai,
      jam_selesai: form.jam_selesai.length === 5 ? form.jam_selesai + ":00" : form.jam_selesai,
    };

    if (editId) {
      const { error } = await supabase.from("jadwal").update(payload).eq("id", editId);
      
    } else {
      const { error } = await supabase.from("jadwal").insert([payload]);
      
    }

    setForm({ hari: "", matkul: "", dosen: "", lokasi: "", jam_mulai: "", jam_selesai: "" });
    setEditId(null);
    fetchData();
  };

  const deleteData = async (id: number) => {
    await supabase.from("jadwal").delete().eq("id", id);
    fetchData();
  };

  const startEdit = (j: Jadwal) => {
    setEditId(j.id);
    setForm({
      hari: j.hari,
      matkul: j.matkul,
      dosen: j.dosen,
      lokasi: j.lokasi,
      jam_mulai: j.jam_mulai.slice(0, 5),
      jam_selesai: j.jam_selesai.slice(0, 5),
    });
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">⚙️ Admin Jadwal</h1>

      <div className="grid gap-2 mb-4">
        <input className="border p-2" placeholder="Hari" value={form.hari} onChange={e => setForm({ ...form, hari: e.target.value })} />
        <input className="border p-2" placeholder="Mata Kuliah" value={form.matkul} onChange={e => setForm({ ...form, matkul: e.target.value })} />
        <input className="border p-2" placeholder="Dosen" value={form.dosen} onChange={e => setForm({ ...form, dosen: e.target.value })} />
        <input className="border p-2" placeholder="Lokasi" value={form.lokasi} onChange={e => setForm({ ...form, lokasi: e.target.value })} />
        <input type="time" className="border p-2" value={form.jam_mulai} onChange={e => setForm({ ...form, jam_mulai: e.target.value })} />
        <input type="time" className="border p-2" value={form.jam_selesai} onChange={e => setForm({ ...form, jam_selesai: e.target.value })} />
        <button 
          onClick={addData} 
          className="bg-blue-600 text-white p-2 rounded"
        >
          {editId ? "Update" : "Tambah"}
        </button>
      </div>

      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Hari</th>
            <th className="border p-2">Mata Kuliah</th>
            <th className="border p-2">Dosen</th>
            <th className="border p-2">Lokasi</th>
            <th className="border p-2">Waktu</th>
            <th className="border p-2">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {jadwal.map((j) => (
            <tr key={j.id}>
              <td className="border p-2">{j.hari}</td>
              <td className="border p-2">{j.matkul}</td>
              <td className="border p-2">{j.dosen}</td>
              <td className="border p-2">{j.lokasi}</td>
              <td className="border p-2">{j.jam_mulai} - {j.jam_selesai}</td>
              <td className="border p-2 space-x-2">
                <button 
                  onClick={() => startEdit(j)} 
                  className="bg-yellow-500 text-white p-1 rounded"
                >
                  Edit
                </button>
                <button 
                  onClick={() => deleteData(j.id)} 
                  className="bg-red-600 text-white p-1 rounded"
                >
                  Hapus
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
