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
    <div className="min-h-screen relative overflow-hidden bg-slate-950">
      <ElegantStars />
      
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-md w-full text-center"
        >
          <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-700/60">
            <div className="space-y-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                <span className="text-2xl">❌</span>
              </div>
              
              <div>
                <CleanText size="text-xl" className="text-white mb-2">
                  Pembayaran Gagal
                </CleanText>
                <div className="text-sm text-slate-400">
                  Terjadi kesalahan saat memproses pembayaran. Silakan coba lagi.
                </div>
              </div>

              <div className="flex gap-3">
                <motion.button
                  onClick={handleBackToCash}
                  className="flex-1 px-4 py-3 rounded-lg bg-slate-700 text-white hover:bg-slate-600 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Kembali
                </motion.button>
                <motion.button
                  onClick={handleRetryPayment}
                  className="flex-1 px-4 py-3 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Coba Lagi
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}



