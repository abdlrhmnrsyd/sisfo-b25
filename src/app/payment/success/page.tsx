"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import CleanText from "../../components/CleanText";
import ElegantStars from "../../components/ElegantStars";
import { safeApiCall } from "@/lib/apiUtils";

interface PaymentStatusResponse {
  status: string;
  fraud_status?: string;
  gross_amount?: number;
}

export default function PaymentSuccessPage() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);

  useEffect(() => {
    const checkPaymentStatus = async () => {
      try {
        // Get transaction ID from URL params
        const urlParams = new URLSearchParams(window.location.search);
        const orderId = urlParams.get('order_id');
        
        if (orderId) {
          const result = await safeApiCall<PaymentStatusResponse>('/api/payment/status', {
            method: 'POST',
            body: JSON.stringify({ transaction_id: orderId }),
          });

          if (!result.success || !result.data) {
            console.error('Payment status check failed:', result.error);
            setPaymentStatus('error');
            return;
          }

          setPaymentStatus(result.data.status);
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
      } finally {
        setIsChecking(false);
      }
    };

    checkPaymentStatus();
  }, []);

  const handleBackToCash = () => {
    router.push('/cash');
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950">
      <ElegantStars />
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
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
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/50 via-purple-500/50 to-emerald-500/50 rounded-3xl blur-xl opacity-50 animate-pulse" />
            
            <div className="relative p-8 rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-slate-700/60 shadow-2xl">
              {isChecking ? (
                <div className="space-y-6 text-center">
                  <div className="relative mx-auto w-20 h-20">
                    <div className="absolute inset-0 border-4 border-purple-500/30 rounded-full" />
                    <div className="absolute inset-0 border-4 border-transparent border-t-purple-500 rounded-full animate-spin" />
                    <div className="absolute inset-2 border-4 border-emerald-500/30 rounded-full" />
                    <div className="absolute inset-2 border-4 border-transparent border-t-emerald-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
                  </div>
                  <div>
                    <CleanText size="text-xl" className="text-white mb-2">
                      Memeriksa Status Pembayaran...
                    </CleanText>
                    <div className="text-sm text-slate-400">
                      Mohon tunggu sebentar
                    </div>
                  </div>
                </div>
              ) : paymentStatus === 'error' ? (
                <div className="space-y-6 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", duration: 0.5 }}
                    className="relative mx-auto w-20 h-20"
                  >
                    <div className="absolute inset-0 rounded-full bg-red-500/20 border-2 border-red-500/30" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-4xl">❌</span>
                    </div>
                    <div className="absolute -inset-2 rounded-full bg-red-500/10 animate-ping" />
                  </motion.div>
                  
                  <div>
                    <CleanText size="text-2xl" className="text-white mb-2 font-bold">
                      Error Memeriksa Status
                    </CleanText>
                    <div className="text-sm text-slate-400">
                      Terjadi kesalahan saat memeriksa status pembayaran
                    </div>
                  </div>

                  <motion.button
                    onClick={handleBackToCash}
                    className="w-full px-6 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-semibold hover:from-purple-700 hover:to-fuchsia-700 transition-all shadow-lg shadow-purple-500/20"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Kembali ke Halaman Kas
                  </motion.button>
                </div>
              ) : (
                <div className="space-y-6 text-center">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", duration: 0.8 }}
                    className="relative mx-auto w-24 h-24"
                  >
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-500/30 to-green-500/30 border-2 border-emerald-500/50" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3, type: "spring" }}
                        className="text-5xl"
                      >
                        ✓
                      </motion.span>
                    </div>
                    <motion.div
                      className="absolute -inset-2 rounded-full bg-emerald-500/20"
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
                      <CleanText size="text-3xl" className="text-white mb-3 font-bold bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">
                        Pembayaran Berhasil!
                      </CleanText>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="text-sm text-slate-400"
                    >
                      Status pembayaran Anda telah terupdate secara otomatis
                    </motion.div>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <motion.button
                      onClick={handleBackToCash}
                      className="w-full px-6 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-600 text-white font-semibold hover:from-purple-700 hover:via-fuchsia-700 hover:to-purple-700 transition-all shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Kembali ke Halaman Kas
                    </motion.button>
                  </motion.div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

