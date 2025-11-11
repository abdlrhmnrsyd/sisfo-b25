"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Import supabase client (keeping original data connection)
import { supabase } from "@/lib/supabaseClient";
import Navbar from "../components/Navbar";
import ClientOnly from "../components/ClientOnly";
import CleanText from "../components/CleanText";
import ElegantStars from "../components/ElegantStars";

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

// Clean Text Component // Removed
// const CleanText = ({ children, className = "", size = "text-4xl" }: { children: React.ReactNode; className?: string; size?: string }) => {
//   return (
//     <motion.div
//       className={`relative ${size} text-white ${className}`}
//       style={{
//         fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif',
//         fontWeight: '500',
//         letterSpacing: '-0.025em',
//       }}
//       initial={{ opacity: 0, y: 20 }}
//       animate={{ opacity: 1, y: 0 }}
//       transition={{ duration: 0.6 }}
//     >
//       {children}
//     </motion.div>
//   );
// };

// Clean Button Component
const CleanButton = ({ children, active, onClick, className = "" }: { children: React.ReactNode; active: boolean; onClick: () => void; className?: string }) => {
  return (
    <motion.button
      className={`relative px-6 py-3 text-sm font-medium transition-all duration-300 ${className}`}
      style={{
        fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif',
        backgroundColor: active ? '#4c1d95' : 'rgba(15, 23, 42, 0.6)',
        color: active ? '#ffffff' : '#cbd5e1',
        border: `1px solid ${active ? '#6d28d9' : 'rgba(71, 85, 105, 0.3)'}`,
        borderRadius: '8px',
        backdropFilter: 'blur(12px)',
        boxShadow: active 
          ? '0 4px 20px rgba(76, 29, 149, 0.4), 0 1px 0 rgba(255, 255, 255, 0.1) inset' 
          : '0 2px 8px rgba(0, 0, 0, 0.1)',
        cursor: 'pointer'
      }}
      onClick={onClick}
      whileHover={{ 
        scale: 1.02,
        backgroundColor: active ? '#5b21b6' : 'rgba(30, 41, 59, 0.8)',
        boxShadow: active 
          ? '0 6px 25px rgba(76, 29, 149, 0.5), 0 1px 0 rgba(255, 255, 255, 0.1) inset' 
          : '0 4px 12px rgba(0, 0, 0, 0.2)'
      }}
      whileTap={{ scale: 0.98 }}
    >
      {children}
    </motion.button>
  );
};

// Elegant Stars Background // Removed
// const ElegantStars = () => {
//   const [stars, setStars] = useState<{
//     id: number;
//     x: number;
//     y: number;
//     size: number;
//     opacity: number;
//     twinkle: boolean;
//   }[]>([]);

//   useEffect(() => {
//     const newStars = [];
//     for (let i = 0; i < 200; i++) {
//       newStars.push({
//         id: i,
//         x: Math.random() * 100,
//         y: Math.random() * 100,
//         size: Math.random() > 0.7 ? 2 : 1,
//         opacity: 0.2 + Math.random() * 0.6,
//         twinkle: Math.random() > 0.7
//       });
//     }
//     setStars(newStars);
//   }, []);

//   return (
//     <div className="fixed inset-0 pointer-events-none z-0">
//       {stars.map((star) => (
//         <motion.div
//           key={star.id}
//           className="absolute bg-white rounded-full"
//           style={{
//             left: `${star.x}%`,
//             top: `${star.y}%`,
//             width: `${star.size}px`,
//             height: `${star.size}px`,
//             opacity: star.opacity,
//           }}
//           animate={star.twinkle ? {
//             opacity: [star.opacity, star.opacity * 0.3, star.opacity],
//           } : {}}
//           transition={star.twinkle ? {
//             duration: 2 + Math.random() * 3,
//             repeat: Infinity,
//             ease: "easeInOut"
//           } : {}}
//         />
//       ))}
//     </div>
//   );
// };

export default function Home() {
  const [jadwal, setJadwal] = useState<Jadwal[]>([]);
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  // const [mounted, setMounted] = useState(false); // Removed
  const [navbarHeight, setNavbarHeight] = useState(0);
  const [tugas, setTugas] = useState<Tugas[]>([]);

  const dayOrder: Record<string, number> = useMemo(
    () => ({ senin: 1, selasa: 2, rabu: 3, kamis: 4, jumat: 5 }),
    []
  );

  // useEffect(() => { // Removed
  //   setMounted(true);
  // }, []);

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase.from("jadwal").select("*");
      if (error) {
        console.error("Error fetching data:", error);
      } else {
        console.log("Data dari database:", data);
        setJadwal(data || []);
      }

      const { data: tugasData, error: tugasError } = await supabase.from("tugas").select("*");
      if (tugasError) {
        console.error("Error fetching tugas data:", tugasError);
      } else {
        setTugas(tugasData || []);
      }
    };
    fetchData();
  }, []);

  const handleNavbarHeightChange = (height: number) => {
    setNavbarHeight(height);
  };

  useEffect(() => {
    // if (!mounted) return; // Removed
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []); // Dependency array changed to empty

  // Request notification permission on mount
  useEffect(() => {
    if ("Notification" in window) {
      try {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            console.log("Notification permission granted.");
          } else {
            console.warn("Notification permission denied or dismissed.");
          }
        });
      } catch (error) {
        console.error("Error requesting notification permission:", error);
      }
    }
  }, []);

  // Task deadline notifications
  useEffect(() => {
    tugas.forEach(task => {
      const deadlineDate = new Date(task.deadline);
      const now = new Date();
      const diffTime = deadlineDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const notificationId = `task-${task.id}-deadline`;
      const hasNotified = localStorage.getItem(notificationId);

      if (diffDays === 3 && diffTime > 0 && !hasNotified) {
        if (Notification.permission === "granted") {
          try {
            new Notification("Pengingat Tugas!", {
              body: `Tugas '${task.tugas}' untuk mata kuliah '${task.matakuliah}' akan jatuh tempo dalam 3 hari!`, 
              icon: "/logo.png" 
            });
            localStorage.setItem(notificationId, "true");
          } catch (error) {
            console.error("Error creating task notification:", error);
          }
        }
      }
    });
  }, [tugas]);

  const daysOfWeek = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];

  const getDayName = (date: Date) => {
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    return days[date.getDay()];
  };

  const currentDayName = getDayName(currentTime); // Simplified, no longer needs mounted check
  const nowTimeInMinutes =
    currentTime.getHours() * 60 + currentTime.getMinutes(); // Simplified

  const toMinutes = (t: string) => {
    const [h, m] = t.slice(0, 5).split(":").map(Number);
    return h * 60 + m;
  };

  const isClassActive = useCallback((jadwalItem: Jadwal) => {
    // if (!mounted || currentDayName.toLowerCase() !== jadwal.hari.toLowerCase()) return false; // Simplified
    if (currentDayName.toLowerCase() !== jadwalItem.hari.toLowerCase()) return false;
    
    const classStart = toMinutes(jadwalItem.jam_mulai);
    const classEnd = toMinutes(jadwalItem.jam_selesai);
    
    return nowTimeInMinutes >= classStart && nowTimeInMinutes <= classEnd;
  }, [currentDayName, nowTimeInMinutes, toMinutes]);

  const { nextClass, timeUntilNextClass, currentClass } = useMemo(() => {
    // if (!mounted) return { nextClass: null as Jadwal | null, timeUntilNextClass: "", currentClass: null as Jadwal | null }; // Simplified
    
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
  }, [jadwal, currentDayName, nowTimeInMinutes, isClassActive]);

  // Next class notifications
  useEffect(() => {
    // if (!mounted || !nextClass) return; // Simplified
    if (!nextClass) return;

    const now = new Date();
    const [nextClassHour, nextClassMinute] = nextClass.jam_mulai.slice(0, 5).split(":").map(Number);
    const nextClassTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), nextClassHour, nextClassMinute, 0);

    const timeToNextClass = nextClassTime.getTime() - now.getTime(); // in milliseconds
    const fifteenMinutes = 15 * 60 * 1000; // 15 minutes in milliseconds

    const notificationId = `class-${nextClass.id}-${nextClass.jam_mulai}-upcoming`;
    const hasNotified = localStorage.getItem(notificationId);

    if (timeToNextClass > 0 && timeToNextClass <= fifteenMinutes && !hasNotified) {
      if (Notification.permission === "granted") {
        try {
          new Notification("Pengingat Kelas!", {
            body: `Kelas '${nextClass.matkul}' akan dimulai dalam 15 menit di ${nextClass.lokasi}!`, 
            icon: "/logo.png" 
          });
          localStorage.setItem(notificationId, "true");
        } catch (error) {
          console.error("Error creating next class notification:", error);
        }
      }
    }
  }, [nextClass]);

  const filteredJadwal = useMemo(() => {
    const base = selectedDay
      ? jadwal.filter((j) => j.hari?.toLowerCase() === selectedDay.toLowerCase())
      : jadwal;

    return [...base].sort((a, b) => {
      const dayA = dayOrder[a.hari?.toLowerCase() || ""] ?? 99;
      const dayB = dayOrder[b.hari?.toLowerCase() || ""] ?? 99;
      if (dayA !== dayB) return dayA - dayB;
      return toMinutes(a.jam_mulai) - toMinutes(b.jam_mulai);
    });
  }, [jadwal, selectedDay, dayOrder]);

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950">
      <ClientOnly>
        <ElegantStars />
      </ClientOnly>
      <Navbar onHeightChange={handleNavbarHeightChange} />
      
      <ClientOnly>
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
                TRPL 1B
              </motion.h1>
              
              {/* Subtitle */}
              <motion.div 
                className="text-xl md:text-2xl text-purple-300 mb-6 font-light"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.5 }}
              >
                Class Schedule
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
                  {currentTime.toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                </motion.div>

                {/* Current Day */}
                <div className="text-slate-400 mb-6 text-lg">
                  {currentDayName}
                </div>

                {/* Status Display */}
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
                          {currentClass.lokasi} • Ends at {currentClass.jam_selesai.slice(0, 5)}
                        </div>
                        {nextClass && (
                          <div className="mt-4 pt-4 border-t border-slate-700">
                            <div className="text-slate-300 text-sm">
                              Next: {nextClass.matkul} in {timeUntilNextClass}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : nextClass ? (
                      <div className="text-center">
                        <CleanText size="text-lg" className="text-slate-300 mb-2">
                          Next Class
                        </CleanText>
                        <CleanText size="text-xl" className="mb-3">
                          {nextClass.matkul}
                        </CleanText>
                        <div className="text-slate-400 text-sm">
                          Starts in {timeUntilNextClass} at {nextClass.jam_mulai.slice(0, 5)}
                        </div>
                      </div>
                    ) : (
                      <CleanText size="text-lg" className="text-slate-400">
                        No upcoming classes
                      </CleanText>
                    )}
                  </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Day Filter */}
          <motion.div
            className="flex justify-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <div className="flex flex-wrap gap-3 md:gap-4">
              <CleanButton
                active={selectedDay === ""}
                onClick={() => setSelectedDay("")}
              >
                All Days
              </CleanButton>
              {daysOfWeek.map((day) => (
                <CleanButton
                  key={day}
                  active={selectedDay === day}
                  onClick={() => setSelectedDay(day)}
                >
                  {day}
                </CleanButton>
              ))}
            </div>
          </motion.div>

          {/* Enhanced Schedule Grid */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.9 }}
          >
            <AnimatePresence>
              {filteredJadwal.length > 0 ? (
                filteredJadwal.map((j, index) => {
                  const cardVariants = [
                    // Variant 1: Classic with left border
                    {
                      borderLeft: '4px solid',
                      borderLeftColor: isClassActive(j) ? '#a855f7' : '#6366f1',
                      background: isClassActive(j) 
                        ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)'
                        : 'linear-gradient(135deg, rgba(15, 23, 42, 0.6) 0%, rgba(30, 41, 59, 0.4) 100%)',
                    },
                    // Variant 2: Glow effect
                    {
                      background: isClassActive(j)
                        ? 'radial-gradient(circle at top left, rgba(168, 85, 247, 0.15) 0%, rgba(15, 23, 42, 0.4) 50%)'
                        : 'radial-gradient(circle at top right, rgba(99, 102, 241, 0.08) 0%, rgba(15, 23, 42, 0.4) 50%)',
                      boxShadow: isClassActive(j)
                        ? '0 0 30px rgba(168, 85, 247, 0.2)'
                        : '0 8px 32px rgba(0, 0, 0, 0.1)',
                    },
                    // Variant 3: Frosted glass
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
                        {/* Gradient border for variant 4 */}
                        

                        <div className="relative z-10">
                          {/* Enhanced header with icons */}
                          <div className="flex items-center justify-between mb-4">
                            <div className={`px-3 py-1 rounded-lg flex items-center gap-2 ${''}
                              index % 2 === 0 
                                ? 'bg-purple-900/30 border border-purple-700/30'
                                : 'bg-gradient-to-r from-purple-900/20 to-violet-900/20'
                            }`}>
                              {/* Day icon */}
                              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                              <span className="text-xs font-medium text-purple-300 uppercase tracking-wide">
                                {j.hari}
                              </span>
                            </div>
                            
                            <div className={`text-xs flex items-center gap-2 ${''}
                              index % 3 === 0 
                                ? 'px-2 py-1 bg-slate-800/50 rounded-md'
                                : ''
                            }`}>
                              {/* Clock icon */}
                              <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                              <span className="text-slate-400">
                                {j.jam_mulai.slice(0, 5)} - {j.jam_selesai.slice(0, 5)}
                              </span>
                            </div>
                          </div>

                          {/* Active/Next class badge */}
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

                          {/* Course Title with dynamic styling */}
                          <h2 
                            className={`text-lg font-medium mb-4 leading-tight transition-colors duration-300 ${''}
                              isClassActive(j) ? 'text-purple-100' : 'text-white'
                            } ${index % 3 === 1 ? 'text-xl' : ''}`}
                            style={{
                              fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif',
                              textShadow: isClassActive(j) ? '0 0 10px rgba(168, 85, 247, 0.3)' : 'none'
                            }}
                          >
                            {j.matkul}
                          </h2>

                          {/* Enhanced Details Section */}
                          <div className="space-y-3">
                            <div className={`text-sm flex items-center gap-3 ${''}
                              index % 3 === 2 ? 'p-2 bg-slate-900/30 rounded-lg' : ''
                            }`}>
                              <div className="w-1 h-4 bg-gradient-to-b from-purple-400 to-violet-500 rounded-full"></div>
                              <div>
                                <span className="text-slate-300 font-medium">Instructor</span>
                                <div className="text-slate-400">{j.dosen}</div>
                              </div>
                            </div>
                            
                            <div className={`text-sm flex items-center gap-3 ${''}
                              index % 3 === 2 ? 'p-2 bg-slate-900/30 rounded-lg' : ''
                            }`}>
                              <div className="w-1 h-4 bg-gradient-to-b from-blue-400 to-indigo-500 rounded-full"></div>
                              <div>
                                <span className="text-slate-300 font-medium">Location</span>
                                <div className="text-slate-400">{j.lokasi}</div>
                              </div>
                            </div>
                          </div>

                          {/* Duration badge */}
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
                            
                            {/* Subject category indicator */}
                            
                          </div>
                        </div>

                        {/* Enhanced hover effects */}
                        <div className={`absolute inset-0 transition-opacity duration-300 rounded-2xl pointer-events-none ${''}
                          index % 3 === 0 ? 'bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100' :
                          index % 3 === 1 ? 'bg-gradient-to-tl from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100' :
                          index % 3 === 2 ? 'bg-gradient-to-tr from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100' :
                          'bg-gradient-to-bl from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100'
                        }`} />
                        
                        {/* Floating particles on hover */}
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
                    No classes found
                  </CleanText>
                  <div className="text-sm text-slate-500">
                    Try adjusting your filters or check back later
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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
      </ClientOnly>

      {/* Subtle ambient glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-900/10 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-900/10 rounded-full blur-3xl opacity-50" />
      </div>
    </div>
  );
}