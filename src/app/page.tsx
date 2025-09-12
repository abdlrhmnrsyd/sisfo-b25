"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { supabase } from "@/lib/supabaseClient";
import Navbar from "./components/Navbar";
import CleanText from "./components/CleanText";
import ElegantStars from "./components/ElegantStars";

type Jadwal = {
  id: number;
  hari: string;
  matkul: string;
  dosen: string;
  lokasi: string;
  jam_mulai: string;
  jam_selesai: string;
};

type Tugas = {
  id: string;
  matakuliah: string;
  dosen: string;
  tugas: string;
  deadline: string;
  note: string | null;
};

export default function DashboardPage() {
  const [jadwal, setJadwal] = useState<Jadwal[]>([]);
  const [tugas, setTugas] = useState<Tugas[]>([]);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [mounted, setMounted] = useState(false);
  const [navbarHeight, setNavbarHeight] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchTugas = async () => {
    const { data, error } = await supabase.from("tugas").select("*");
    if (!error) {
      setTugas(data || []);
    }
  };

  useEffect(() => {
    const fetchJadwal = async () => {
      const { data, error } = await supabase.from("jadwal").select("*");
      if (!error) {
        setJadwal(data || []);
      }
    };

    fetchJadwal();
    fetchTugas();
  }, []);

  useEffect(() => {
    const deleteExpiredTasks = async () => {
      const now = new Date();
      const { data: tasks, error } = await supabase.from("tugas").select("id, deadline");
      if (error) return;

      if (tasks && tasks.length > 0) {
        const expiredTaskIds = tasks
          .filter(task => {
            const deadlineDate = new Date(task.deadline);
            const oneDayAfterDeadline = new Date(deadlineDate.getTime() + 24 * 60 * 60 * 1000); // 1 day after deadline
            return now.getTime() > oneDayAfterDeadline.getTime();
          })
          .map(task => task.id);

        if (expiredTaskIds.length > 0) {
          const { error: deleteError } = await supabase
            .from("tugas")
            .delete()
            .in("id", expiredTaskIds);

          if (!deleteError) {
            fetchTugas();
          }
        }
      }
    };

    deleteExpiredTasks();
  }, []); // Run once on mount

  const handleNavbarHeightChange = (height: number) => {
    setNavbarHeight(height);
  };

  useEffect(() => {
    if (!mounted) return;
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [mounted]);

  const getDayName = (date: Date) => {
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    return days[date.getDay()];
  };

  const currentDayName = mounted ? getDayName(currentTime) : "";
  const nowTimeInMinutes = mounted
    ? currentTime.getHours() * 60 + currentTime.getMinutes()
    : 0;

  const toMinutes = useCallback((t: string) => {
    const [h, m] = t.slice(0, 5).split(":").map(Number);
    return h * 60 + m;
  }, []);

  const isClassActive = useCallback((jadwalItem: Jadwal) => {
    if (!mounted || currentDayName.toLowerCase() !== jadwalItem.hari.toLowerCase()) return false;
    
    const classStart = toMinutes(jadwalItem.jam_mulai);
    const classEnd = toMinutes(jadwalItem.jam_selesai);
    
    return nowTimeInMinutes >= classStart && nowTimeInMinutes <= classEnd;
  }, [mounted, currentDayName, nowTimeInMinutes, toMinutes]);

  const { nextClass, timeUntilNextClass, currentClass } = useMemo(() => {
    if (!mounted) return { nextClass: null as Jadwal | null, timeUntilNextClass: "", currentClass: null as Jadwal | null };
    
    const todayList = [...jadwal]
      .filter((j) => j.hari?.toLowerCase() === currentDayName.toLowerCase())
      .sort((a, b) => toMinutes(a.jam_mulai) - toMinutes(b.jam_mulai));

    const current = todayList.find(j => isClassActive(j));

    for (const j of todayList) {
      const classStart = toMinutes(j.jam_mulai);
      if (classStart > nowTimeInMinutes) {
        const diff = classStart - nowTimeInMinutes;
        const h = Math.floor(diff / 60);
        const m = diff % 60;
        return {
          nextClass: j,
          timeUntilNextClass: `${h > 0 ? `${h}h ` : ""}${m}m`,
          currentClass: current || null
        };
      }
    }
    return { nextClass: null, timeUntilNextClass: "", currentClass: current || null };
  }, [mounted, jadwal, currentDayName, nowTimeInMinutes, isClassActive]);

  const todayFilteredJadwal = useMemo(() => {
    const base = jadwal.filter((j) => j.hari?.toLowerCase() === currentDayName.toLowerCase());
    return [...base].sort((a, b) => {
      return toMinutes(a.jam_mulai) - toMinutes(b.jam_mulai);
    });
  }, [jadwal, currentDayName]);

  const sortedTugas = useMemo(() => {
    return [...tugas].sort((a, b) => {
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });
  }, [tugas]);


  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950">
      <ElegantStars />
      <Navbar onHeightChange={handleNavbarHeightChange} />
      
      {/* Main Content */}
      <main
        className="relative z-10 p-6 md:p-8 mt-20"
        style={{ paddingTop: navbarHeight || 128 }}
      >
        {/* Enhanced Header */}
        <motion.div
          className="text-center mb-16 relative"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Background decoration */}
          <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
            <div className="w-96 h-96 bg-gradient-to-r from-purple-900/5 via-violet-800/10 to-purple-900/5 rounded-full blur-3xl"></div>
          </div>
          
          <div className="relative z-10">
            {/* Main title with gradient */}
            <motion.h1 
              className="text-5xl md:text-7xl mb-2 font-light bg-gradient-to-r from-white via-purple-100 to-white bg-clip-text text-transparent"
              style={{
                fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif',
                letterSpacing: '-0.02em'
              }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
            >
              Dashboard TRPL 1B
            </motion.h1>
            
            {/* Subtitle */}
            <motion.div 
              className="text-xl md:text-2xl text-purple-300 mb-6 font-light"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              Today&apos;s Overview
            </motion.div>
            
            {/* Decorative elements */}
            <div className="flex justify-center items-center gap-4 mb-4">
              <motion.div
                className="h-px w-16 bg-gradient-to-r from-transparent to-purple-400"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.8, delay: 0.7 }}
              />
              <motion.div
                className="w-2 h-2 bg-purple-400 rounded-full"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 1 }}
              />
              <motion.div
                className="h-px w-16 bg-gradient-to-l from-transparent to-purple-400"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.8, delay: 0.7 }}
              />
            </div>
            
            {/* Academic year or semester info */}
            <motion.div 
              className="text-sm text-slate-400 uppercase tracking-widest"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.2 }}
            >
              Academic Year 2025/2026
            </motion.div>
          </div>
        </motion.div>

        {/* Time & Status Display */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="max-w-2xl mx-auto">
            <div 
              className="p-8 rounded-2xl backdrop-blur-xl border border-slate-700/50"
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.4)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
              }}
            >
              {/* Current Time */}
              <motion.div
                className="text-4xl md:text-5xl mb-6 font-light text-white"
                style={{
                  fontFamily: '"SF Mono", "Monaco", "Cascadia Code", monospace',
                }}
              >
                {mounted
                  ? currentTime.toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })
                  : "••:••:••"}
              </motion.div>

              {/* Current Day */}
              <div className="text-slate-400 mb-6 text-lg">
                {mounted && currentDayName}
              </div>

              {/* Status Display */}
              {mounted && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                >
                  {currentClass ? (
                    <div className="p-6 rounded-xl bg-gradient-to-r from-purple-900/20 to-violet-900/20 border border-purple-700/30">
                      <div className="flex items-center justify-center mb-3">
                        <div className="w-2 h-2 bg-purple-400 rounded-full mr-2 animate-pulse"></div>
                        <CleanText size="text-lg" className="text-purple-300">
                          Current Class
                        </CleanText>
                      </div>
                      <CleanText size="text-xl" className="mb-3">
                        {currentClass.matkul}
                      </CleanText>
                      <div className="text-slate-400 text-sm">
                        {currentClass.lokasi} • Berakhir pada {currentClass.jam_selesai.slice(0, 5)}
                      </div>
                      {nextClass && (
                        <div className="mt-4 pt-4 border-t border-slate-700">
                          <div className="text-slate-300 text-sm">
                            Berikutnya: {nextClass.matkul} dalam {timeUntilNextClass}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : nextClass ? (
                    <div className="text-center">
                      <CleanText size="text-lg" className="text-slate-300 mb-2">
                        Kelas Berikutnya
                      </CleanText>
                      <CleanText size="text-xl" className="mb-3">
                        {nextClass.matkul}
                      </CleanText>
                      <div className="text-slate-400 text-sm">
                        Dimulai dalam {timeUntilNextClass} pada {nextClass.jam_mulai.slice(0, 5)}
                      </div>
                    </div>
                  ) : (
                    <CleanText size="text-lg" className="text-slate-400">
                      Tidak ada kelas yang akan datang
                    </CleanText>
                  )}
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Today's Schedule */}
        <motion.div
          className="max-w-7xl mx-auto mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
        >
          <CleanText size="text-3xl" className="text-center mb-8">
            Jadwal Hari Ini
          </CleanText>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="wait">
              {todayFilteredJadwal.length > 0 ? (
                todayFilteredJadwal.map((j, index) => {
                const cardVariants = [
                  {
                    borderLeft: '4px solid',
                    borderLeftColor: isClassActive(j) ? '#a855f7' : '#6366f1',
                    background: isClassActive(j) 
                      ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)'
                      : 'linear-gradient(135deg, rgba(15, 23, 42, 0.6) 0%, rgba(30, 41, 59, 0.4) 100%)',
                  },
                  {
                    background: isClassActive(j)
                      ? 'radial-gradient(circle at top left, rgba(168, 85, 247, 0.15) 0%, rgba(15, 23, 42, 0.4) 50%)'
                      : 'radial-gradient(circle at top right, rgba(99, 102, 241, 0.08) 0%, rgba(15, 23, 42, 0.4) 50%)',
                    boxShadow: isClassActive(j)
                      ? '0 0 30px rgba(168, 85, 247, 0.2)'
                      : '0 8px 32px rgba(0, 0, 0, 0.1)',
                  },
                  {
                    background: isClassActive(j)
                      ? 'rgba(76, 29, 149, 0.2)'
                      : 'rgba(15, 23, 42, 0.3)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid',
                    borderColor: isClassActive(j) ? 'rgba(168, 85, 247, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                  },
                  ];

                  const selectedVariant = cardVariants[index % 3];
                
                return (
                  <motion.div
                    key={j.id}
                    className="group"
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -30, scale: 0.95 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    whileHover={{ scale: 1.02, y: -5 }}
                  >
                    <div 
                        className={`p-6 h-full rounded-2xl transition-all duration-300 relative overflow-hidden ${''
                      }`}
                      style={{
                        ...selectedVariant,
                          border: (selectedVariant.border || `1px solid ${isClassActive(j) ? 'rgba(168, 85, 247, 0.3)' : 'rgba(71, 85, 105, 0.3)'}`),
                        boxShadow: selectedVariant.boxShadow || (isClassActive(j) 
                          ? '0 8px 32px rgba(168, 85, 247, 0.15)' 
                          : '0 8px 32px rgba(0, 0, 0, 0.1)')
                      }}
                    >
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <div className={`px-3 py-1 rounded-lg flex items-center gap-2 ${
                            index % 2 === 0 
                              ? 'bg-purple-900/30 border border-purple-700/30'
                              : 'bg-gradient-to-r from-purple-900/20 to-violet-900/20'
                          }`}>
                            <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                            <span className="text-xs font-medium text-purple-300 uppercase tracking-wide">
                              {j.hari}
                            </span>
                          </div>
                          
                          <div className={`text-xs flex items-center gap-2 ${
                            index % 3 === 0 
                              ? 'px-2 py-1 bg-slate-800/50 rounded-md'
                              : ''
                          }`}>
                            <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                            <span className="text-slate-400">
                              {j.jam_mulai.slice(0, 5)} - {j.jam_selesai.slice(0, 5)}
                            </span>
                          </div>
                        </div>

                        {isClassActive(j) && (
                          <div className="absolute top-4 right-4 flex items-center gap-2">
                            <motion.div 
                              className="w-3 h-3 bg-purple-400 rounded-full"
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            />
                            <span className="text-xs text-purple-300 font-medium">LIVE</span>
                          </div>
                        )}

                        <h2 
                          className={`text-lg font-medium mb-4 leading-tight transition-colors duration-300 ${
                            isClassActive(j) ? 'text-purple-100' : 'text-white'
                            } ${index % 3 === 1 ? 'text-xl' : ''}`}
                          style={{
                            fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif',
                            textShadow: isClassActive(j) ? '0 0 10px rgba(168, 85, 247, 0.3)' : 'none'
                          }}
                        >
                          {j.matkul}
                        </h2>

                        <div className="space-y-3">
                          <div className={`text-sm flex items-center gap-3 ${
                              index % 3 === 2 ? 'p-2 bg-slate-900/30 rounded-lg' : ''
                          }`}>
                            <div className="w-1 h-4 bg-gradient-to-b from-purple-400 to-violet-500 rounded-full"></div>
                            <div>
                                <span className="text-slate-300 font-medium">Dosen</span>
                              <div className="text-slate-400">{j.dosen}</div>
                            </div>
                          </div>
                          
                          <div className={`text-sm flex items-center gap-3 ${
                              index % 3 === 2 ? 'p-2 bg-slate-900/30 rounded-lg' : ''
                          }`}>
                            <div className="w-1 h-4 bg-gradient-to-b from-blue-400 to-indigo-500 rounded-full"></div>
                            <div>
                                <span className="text-slate-300 font-medium">Lokasi</span>
                              <div className="text-slate-400">{j.lokasi}</div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex justify-between items-center">
                          <div className="text-xs text-slate-500">
                            {(() => {
                              const start = toMinutes(j.jam_mulai);
                              const end = toMinutes(j.jam_selesai);
                              const duration = end - start;
                              const hours = Math.floor(duration / 60);
                              const minutes = duration % 60;
                              return `${hours}h ${minutes}m`;
                            })()}
                          </div>
                        </div>
                      </div>

                      <div className={`absolute inset-0 transition-opacity duration-300 rounded-2xl pointer-events-none ${
                          index % 3 === 0 ? 'bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100' :
                          index % 3 === 1 ? 'bg-gradient-to-tl from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100' :
                          index % 3 === 2 ? 'bg-gradient-to-tr from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100' :
                          ''
                      }`} />
                      
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                        {[...Array(3)].map((_, i) => (
                          <motion.div
                            key={i}
                            className="absolute w-1 h-1 bg-purple-400 rounded-full"
                            style={{
                              left: `${20 + i * 30}%`,
                              top: `${30 + i * 20}%`,
                            }}
                            animate={{
                              y: [-5, 5, -5],
                              opacity: [0.3, 0.8, 0.3],
                            }}
                            transition={{
                              duration: 2 + i * 0.5,
                              repeat: Infinity,
                              delay: i * 0.3,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <motion.div
                className="col-span-full text-center py-20"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <CleanText size="text-2xl" className="text-slate-400 mb-4">
                    Tidak ada kelas hari ini
                  </CleanText>
                  <div className="text-sm text-slate-500">
                    Nikmati waktu luang Anda!
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Task List */}
        <motion.div
          className="max-w-7xl mx-auto mt-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
        >
          <CleanText size="text-3xl" className="text-center mb-8">
            Daftar Tugas
          </CleanText>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="wait">
              {sortedTugas.length > 0 ? (
                sortedTugas.map((t, index) => {
                  const deadlineDate = new Date(t.deadline);
                  const now = new Date();
                  const diffTime = deadlineDate.getTime() - now.getTime();
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                  let borderColor = 'border-slate-700/50';
                  let bgColor = 'bg-slate-800/60';
                  let textColor = 'text-white';
                  let deadlineColor = 'text-slate-400';
                  let badgeColor = 'bg-purple-900/30 border-purple-700/30 text-purple-300';

                  if (diffDays <= 1 && diffTime > 0) { // Less than 24 hours
                    borderColor = 'border-red-600/50';
                    bgColor = 'bg-red-900/40';
                    textColor = 'text-red-100';
                    deadlineColor = 'text-red-300';
                    badgeColor = 'bg-red-900/50 border-red-700/50 text-red-300';
                  } else if (diffDays <= 3 && diffTime > 0) { // Less than 3 days
                    borderColor = 'border-yellow-600/50';
                    bgColor = 'bg-yellow-900/40';
                    textColor = 'text-yellow-100';
                    deadlineColor = 'text-yellow-300';
                    badgeColor = 'bg-yellow-900/50 border-yellow-700/50 text-yellow-300';
                  }

                  return (
                    <motion.div
                      key={t.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      whileHover={{ scale: 1.02, boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }}
                      className={`p-6 rounded-2xl border ${borderColor} ${bgColor} backdrop-blur-md relative overflow-hidden`}
                      style={{
                        boxShadow: '0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)'
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-3">
                          <span className={`text-xs font-medium uppercase tracking-wide px-3 py-1 rounded-lg ${badgeColor}`}>
                            {index + 1}. {t.matakuliah}
                          </span>
                          <span className={`text-xs ${deadlineColor}`}>
                            Deadline: {new Date(t.deadline).toLocaleDateString("id-ID", {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                            {diffTime > 0 && (
                              <span className="ml-2 font-semibold">
                                {diffDays === 0 ? "(Deadline Hari Ini!)" : `(${diffDays} hari lagi)`}
                              </span>
                            )}
                            {diffTime <= 0 && (
                                <span className="ml-2 font-semibold text-red-500">
                                    (Tenggat Terlewati)
                                </span>
                            )}
                          </span>
                        </div>
                        <h3 className={`text-xl font-medium mb-2 leading-tight ${textColor}`}>
                          Tugas:
                        </h3>
                        <ol className="list-decimal list-inside text-white ml-4 mb-3">
                          {t.tugas.split('\n').map((item, i) => (
                            <li key={i} className="font-light mb-1">{item.trim()}</li>
                          ))}
                        </ol>
                        <p className={`text-sm ${deadlineColor} mb-3`}>Dosen: {t.dosen}</p>
                        {t.note && (
                          <div className="mt-4 pt-4 border-t border-slate-700">
                            <p className={`text-sm italic ${deadlineColor}`}>Catatan: {t.note}</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )
                })
              ) : (
                <motion.div
                  className="col-span-full text-center py-10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <CleanText size="text-2xl" className="text-slate-400 mb-4">
                    Tidak ada tugas yang akan datang
                </CleanText>
                <div className="text-sm text-slate-500">
                    Waktu untuk bersantai atau mengejar ketertinggalan!
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          </div>
        </motion.div>


        {/* Footer */}
        <motion.div
          className="mt-20 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.5 }}
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

      {/* Subtle ambient glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-900/10 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-900/10 rounded-full blur-3xl opacity-50" />
      </div>
    </div>
  );
}
