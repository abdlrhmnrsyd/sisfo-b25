"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { supabase } from "@/lib/supabaseClient";
import Navbar from "../components/Navbar";

type Tugas = {
  id: string;
  matakuliah: string;
  dosen: string;
  tugas: string;
  deadline: string;
  note: string | null;
};

const CleanText = ({ children, className = "", size = "text-4xl" }: { children: React.ReactNode; className?: string; size?: string }) => {
  return (
    <motion.div
      className={`relative ${size} text-white ${className}`}
      style={{
        fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif',
        fontWeight: '500',
        letterSpacing: '-0.025em',
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {children}
    </motion.div>
  );
};

const ElegantStars = () => {
  const [stars, setStars] = useState<{
    id: number;
    x: number;
    y: number;
    size: number;
    opacity: number;
    twinkle: boolean;
  }[]>([]);

  useEffect(() => {
    const newStars = [];
    for (let i = 0; i < 200; i++) {
      newStars.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() > 0.7 ? 2 : 1,
        opacity: 0.2 + Math.random() * 0.6,
        twinkle: Math.random() > 0.7
      });
    }
    setStars(newStars);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute bg-white rounded-full"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            opacity: star.opacity,
          }}
          animate={star.twinkle ? {
            opacity: [star.opacity, star.opacity * 0.3, star.opacity],
          } : {}}
          transition={star.twinkle ? {
            duration: 2 + Math.random() * 3,
            repeat: Infinity,
            ease: "easeInOut"
          } : {}}
        />
      ))}
    </div>
  );
};

export default function TaskPage() {
  const [tugas, setTugas] = useState<Tugas[]>([]);
  const [navbarHeight, setNavbarHeight] = useState(0);

  useEffect(() => {
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

  const fetchTugas = async () => {
    const { data, error } = await supabase.from("tugas").select("*");
    if (!error && data) setTugas(data);
  };

  const handleNavbarHeightChange = (height: number) => {
    setNavbarHeight(height);
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950 text-white">
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
              Daftar Tugas
            </motion.h1>
            
            {/* Subtitle */}
            <motion.div 
              className="text-xl md:text-2xl text-purple-300 mb-6 font-light"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              Semua Tugas yang Perlu Diselesaikan
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
              {tugas.length > 0 ? (
                tugas.map((t, index) => {
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
