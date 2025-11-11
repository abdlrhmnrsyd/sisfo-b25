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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-[90%] max-w-md p-6 rounded-2xl bg-slate-900 border border-slate-700 text-left"
      >
        <div className="mb-4">
          <CleanText size="text-xl" className="text-white mb-2">
            Pembayaran Kas Minggu {mingguNumber}
          </CleanText>
          <div className="text-sm text-slate-400">
            {studentName}
          </div>
        </div>

        <div className="mb-6 p-4 rounded-lg bg-slate-800/60 border border-slate-700/60">
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-300">Nominal:</span>
            <span className="text-white font-semibold">
              {new Intl.NumberFormat("id-ID", { 
                style: "currency", 
                currency: "IDR", 
                maximumFractionDigits: 0 
              }).format(amount)}
            </span>
          </div>
          <div className="text-xs text-slate-400">
            Pembayaran akan diproses melalui Midtrans
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-900/20 border border-red-500/30 text-red-300 text-sm">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-3">
          <motion.button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-600 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={isLoading}
          >
            Batal
          </motion.button>
          <motion.button
            onClick={handlePayment}
            className="px-6 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors disabled:opacity-60 flex items-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={isLoading}
          >
            {isLoading && (
              <span className="inline-block h-4 w-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
            )}
            {isLoading ? "Memproses..." : "Bayar Sekarang"}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

