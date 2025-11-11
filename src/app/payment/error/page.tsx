"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import CleanText from "../../components/CleanText";
import ElegantStars from "../../components/ElegantStars";

export default function PaymentErrorPage() {
  const router = useRouter();

  const handleBackToCash = () => {
    router.push('/cash');
  };

  const handleRetryPayment = () => {
    router.push('/cash');
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-950 via-red-950/20 to-slate-950">
      <ElegantStars />
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>
      
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-md w-full"
        >
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500/50 via-rose-500/50 to-red-500/50 rounded-3xl blur-xl opacity-50 animate-pulse" />
            
            <div className="relative p-8 rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-slate-700/60 shadow-2xl">
              <div className="space-y-6 text-center">
                <motion.div
                  initial={{ scale: 0, rotate: 180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", duration: 0.8 }}
                  className="relative mx-auto w-24 h-24"
                >
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-red-500/30 to-rose-500/30 border-2 border-red-500/50" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3, type: "spring" }}
                      className="text-5xl"
                    >
                      ✕
                    </motion.span>
                  </div>
                  <motion.div
                    className="absolute -inset-2 rounded-full bg-red-500/20"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </motion.div>
                
                <div>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <CleanText size="text-3xl" className="text-white mb-3 font-bold bg-gradient-to-r from-red-400 to-rose-400 bg-clip-text text-transparent">
                      Pembayaran Gagal
                    </CleanText>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-sm text-slate-400"
                  >
                    Terjadi kesalahan saat memproses pembayaran. Silakan coba lagi.
                  </motion.div>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="flex gap-3"
                >
                  <motion.button
                    onClick={handleBackToCash}
                    className="flex-1 px-4 py-3 rounded-xl bg-slate-700/80 text-white font-semibold hover:bg-slate-600/80 transition-all border border-slate-600/50"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Kembali
                  </motion.button>
                  <motion.button
                    onClick={handleRetryPayment}
                    className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-semibold hover:from-purple-700 hover:to-fuchsia-700 transition-all shadow-lg shadow-purple-500/20"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Coba Lagi
                  </motion.button>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}



