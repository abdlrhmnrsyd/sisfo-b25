"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";


type Tugas = {
  id: string;
  matakuliah: string;
  dosen: string;
  tugas: string;
  deadline: string;
  note: string | null;
};

export default function AdminTaskPage() {
  const [tugas, setTugas] = useState<Tugas[]>([]);
  const [form, setForm] = useState({
    matakuliah: "",
    dosen: "",
    tugas: "",
    deadline: "",
    note: "",
  });

  const [isAdding, setIsAdding] = useState(false);
  const [editingTugasId, setEditingTugasId] = useState<string | null>(null);

  useEffect(() => {
    fetchTugas();
  }, []);

  const fetchTugas = async () => {
    const { data, error } = await supabase.from("tugas").select("*");
    if (!error && data) setTugas(data);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAdd = async () => {
    const { error } = await supabase.from("tugas").insert([form]);
    if (!error) {
      fetchTugas();
      setForm({ matakuliah: "", dosen: "", tugas: "", deadline: "", note: "" });
      setIsAdding(false);
    }
  };

  const handleEdit = (id: string) => {
    const taskToEdit = tugas.find((t) => t.id === id);
    if (taskToEdit) {
      setForm({
        matakuliah: taskToEdit.matakuliah,
        dosen: taskToEdit.dosen,
        tugas: taskToEdit.tugas,
        deadline: taskToEdit.deadline,
        note: taskToEdit.note || "",
      });
      setEditingTugasId(id);
      setIsAdding(true);
    }
  };

  const handleUpdate = async () => {
    if (!editingTugasId) return;

    const { error } = await supabase
      .from("tugas")
      .update(form)
      .eq("id", editingTugasId);

    if (!error) {
      fetchTugas();
      setForm({ matakuliah: "", dosen: "", tugas: "", deadline: "", note: "" });
      setEditingTugasId(null);
      setIsAdding(false);
    }
  };

  const handleCancelEdit = () => {
    setForm({ matakuliah: "", dosen: "", tugas: "", deadline: "", note: "" });
    setEditingTugasId(null);
    setIsAdding(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("tugas").delete().eq("id", id);
    if (!error) fetchTugas();
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-6">⚡ Admin – Management Tugas</h1>

      {/* Tombol Tambah Tugas */}
      <button
        onClick={() => setIsAdding(!isAdding)}
        className="bg-blue-600 hover:bg-blue-700 p-3 rounded-xl mb-6 w-full text-lg font-semibold transition-all duration-300 ease-in-out"
      >
        {isAdding ? "Sembunyikan Form" : "Tambah Tugas Baru"}
      </button>

      {/* Form Tambah */}
      <div className={`grid gap-2 mb-6 bg-gray-800 p-4 rounded-xl transition-all duration-300 ease-in-out ${
        isAdding ? "max-h-screen opacity-100" : "max-h-0 opacity-0 overflow-hidden"
      }`}>
        <input
          type="text"
          name="matakuliah"
          value={form.matakuliah}
          onChange={handleChange}
          placeholder="Matakuliah"
          className="p-2 rounded bg-gray-700"
        />
        <input
          type="text"
          name="dosen"
          value={form.dosen}
          onChange={handleChange}
          placeholder="Dosen"
          className="p-2 rounded bg-gray-700"
        />
        <textarea
          name="tugas"
          value={form.tugas}
          onChange={handleChange}
          placeholder="Tugas (pisahkan dengan Enter untuk daftar)"
          className="p-3 rounded-lg bg-gray-700 border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 h-24"
        />
        <input
          type="date"
          name="deadline"
          value={form.deadline}
          onChange={handleChange}
          className="p-2 rounded bg-gray-700"
        />
        <textarea
          name="note"
          value={form.note}
          onChange={handleChange}
          placeholder="Note (Opsional)"
          className="p-3 rounded-lg bg-gray-700 border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
        />
        {editingTugasId ? (
          <div className="flex space-x-2 mt-4">
            <button
              onClick={handleUpdate}
              className="bg-yellow-600 hover:bg-yellow-700 p-3 rounded-lg text-lg font-semibold flex-1 transition-all duration-200"
            >
              Update Tugas
            </button>
            <button
              onClick={handleCancelEdit}
              className="bg-gray-600 hover:bg-gray-700 p-3 rounded-lg text-lg font-semibold flex-1 transition-all duration-200"
            >
              Batalkan
            </button>
          </div>
        ) : (
          <button
            onClick={handleAdd}
            className="bg-green-600 hover:bg-green-700 p-3 rounded-lg mt-4 text-lg font-semibold transition-all duration-200"
          >
            Tambah Tugas
          </button>
        )}
      </div>

      {/* List Data */}
      <div className="grid gap-4">
        {tugas.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-lg">
            Tidak ada tugas yang tersedia.
          </div>
        ) : (
          tugas.map((t, index) => (
            <div
              key={t.id}
              className="bg-gray-900 p-6 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center border border-gray-700 shadow-lg"
            >
              <div className="flex-grow mb-4 md:mb-0">
                <span className="text-gray-500 text-sm mr-3 font-mono">{index + 1}.</span>
                <h2 className="text-xl font-semibold text-blue-400 mb-1">{t.matakuliah}</h2>
                <p className="text-sm text-gray-300 mb-1">Dosen: <span className="font-medium text-gray-200">{t.dosen}</span></p>
                <p className="mt-2 text-base text-white">Tugas:</p>
                <ol className="list-decimal list-inside text-white ml-4">
                  {t.tugas.split('\n').map((item, i) => (
                    <li key={i} className="font-light mb-1">{item.trim()}</li>
                  ))}
                </ol>
                <p className="text-sm text-yellow-400 mt-2">
                  Deadline: {new Date(t.deadline).toLocaleDateString("id-ID", {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })}
                </p>
                {t.note && <p className="mt-2 italic text-gray-400">Catatan: <span className="font-light">{t.note}</span></p>}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(t.id)}
                  className="bg-blue-700 hover:bg-blue-800 p-2 rounded-lg text-sm transition-colors duration-200"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(t.id)}
                  className="bg-red-600 hover:bg-red-700 p-2 rounded-lg text-sm transition-colors duration-200"
                >
                  Hapus
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
