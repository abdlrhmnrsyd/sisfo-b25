"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import CleanText from "../../components/CleanText";
import ElegantStars from "../../components/ElegantStars";

export default function PaymentPendingPage() {
  const router = useRouter();

  useEffect(() => {
    // Auto redirect after 5 seconds
    const timer = setTimeout(() => {
      router.push('/cash');
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  const handleBackToCash = () => {
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
              <div className="w-16 h-16 mx-auto rounded-full bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center">
                <span className="text-2xl">⏳</span>
              </div>
              
              <div>
                <CleanText size="text-xl" className="text-white mb-2">
                  Pembayaran Sedang Diproses
                </CleanText>
                <div className="text-sm text-slate-400">
                  Status pembayaran Anda akan terupdate dalam beberapa menit
                </div>
              </div>

              <motion.button
                onClick={handleBackToCash}
                className="w-full px-6 py-3 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Kembali ke Halaman Kas
              </motion.button>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}



