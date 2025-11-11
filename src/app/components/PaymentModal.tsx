"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import CleanText from "./CleanText";
import { safeApiCall } from "@/lib/apiUtils";

interface PaymentCreateResponse {
  token: string;
  redirect_url: string;
  transaction_id: string;
  payment_id: string;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: () => void;
  mingguNumber: number;
  amount: number;
  studentName: string;
  mahasiswaId: string;
  mingguId: string;
}

export default function PaymentModal({
  isOpen,
  onClose,
  onPaymentSuccess,
  mingguNumber,
  amount,
  studentName,
  mahasiswaId,
  mingguId,
}: PaymentModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await safeApiCall<PaymentCreateResponse>('/api/payment/create', {
        method: 'POST',
        body: JSON.stringify({
          mahasiswa_id: mahasiswaId,
          minggu_id: mingguId,
          amount: amount,
          minggu_number: mingguNumber,
          student_name: studentName,
        }),
      });

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to create payment');
      }

      // Redirect to Midtrans payment page
      window.location.href = result.data.redirect_url;
    } catch (err) {
      console.error('Payment error:', err);
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: "spring", duration: 0.4 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Glow effect */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/50 via-fuchsia-500/50 to-purple-500/50 rounded-3xl blur-xl opacity-50" />
        
        <div className="relative p-6 rounded-3xl bg-slate-900/95 backdrop-blur-xl border border-slate-700/60 shadow-2xl text-left">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-fuchsia-600 flex items-center justify-center">
                <span className="text-white text-lg">💳</span>
              </div>
              <div>
                <CleanText size="text-2xl" className="text-white font-bold">
                  Pembayaran Kas
                </CleanText>
                <div className="text-xs text-slate-400">
                  Minggu {mingguNumber}
                </div>
              </div>
            </div>
            <div className="text-sm text-slate-300 mt-2">
              {studentName}
            </div>
          </div>

          {/* Amount Card */}
          <div className="mb-6 p-5 rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/60 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl -mr-16 -mt-16" />
            <div className="relative">
              <div className="text-xs text-slate-400 mb-2">Nominal Pembayaran</div>
              <div className="text-3xl font-bold text-white mb-1">
                {new Intl.NumberFormat("id-ID", { 
                  style: "currency", 
                  currency: "IDR", 
                  maximumFractionDigits: 0 
                }).format(amount)}
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-1 mt-2">
                <span>🔒</span>
                <span>Pembayaran aman melalui Midtrans</span>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-4 rounded-xl bg-red-900/20 border border-red-500/30 text-red-300 text-sm"
            >
              <div className="flex items-center gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            </motion.div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3">
            <motion.button
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl bg-slate-700/80 text-white font-semibold hover:bg-slate-600/80 transition-all border border-slate-600/50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isLoading}
            >
              Batal
            </motion.button>
            <motion.button
              onClick={handlePayment}
              className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-600 text-white font-semibold hover:from-purple-700 hover:via-fuchsia-700 hover:to-purple-700 transition-all shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 disabled:opacity-60 flex items-center justify-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="inline-block h-4 w-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <span>💳</span>
                  <span>Bayar Sekarang</span>
                </>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

