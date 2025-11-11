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
            {isChecking ? (
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                <CleanText size="text-lg" className="text-white">
                  Memeriksa Status Pembayaran...
                </CleanText>
                <div className="text-sm text-slate-400">
                  Mohon tunggu sebentar
                </div>
              </div>
            ) : paymentStatus === 'error' ? (
              <div className="space-y-6">
                <div className="w-16 h-16 mx-auto rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                  <span className="text-2xl">❌</span>
                </div>
                
                <div>
                  <CleanText size="text-xl" className="text-white mb-2">
                    Error Memeriksa Status
                  </CleanText>
                  <div className="text-sm text-slate-400">
                    Terjadi kesalahan saat memeriksa status pembayaran
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
            ) : (
              <div className="space-y-6">
                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                  <span className="text-2xl">✅</span>
                </div>
                
                <div>
                  <CleanText size="text-xl" className="text-white mb-2">
                    Pembayaran Berhasil!
                  </CleanText>
                  <div className="text-sm text-slate-400">
                    Status pembayaran Anda telah terupdate
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
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
}

