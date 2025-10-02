"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import CleanText from "./CleanText";
import { safeApiCall } from "@/lib/apiUtils";
import Image from "next/image";

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
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [method, setMethod] = useState<string>("qris");
  const [vaInfo, setVaInfo] = useState<{ bank: string; number: string } | null>(null);
  const [deeplinkUrl, setDeeplinkUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const handlePayment = async () => {
    setIsLoading(true);
    setError(null);
    setStatusMessage(null);

    try {
      const result = await safeApiCall('/api/payment/create', {
        method: 'POST',
        body: JSON.stringify({
          mahasiswa_id: mahasiswaId,
          minggu_id: mingguId,
          amount: amount,
          minggu_number: mingguNumber,
          student_name: studentName,
          payment_method: method,
        }),
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to create payment');
      }

      type CreateResult = {
        transaction_id: string;
        qr_url?: string | null;
        va?: { bank: string; number: string } | null;
        deeplink_url?: string | null;
      };
      const data = result.data as CreateResult;
      setTransactionId(data.transaction_id);
      setQrUrl(data.qr_url ?? null);
      setVaInfo(data.va ?? null);
      setDeeplinkUrl(data.deeplink_url ?? null);
    } catch (err) {
      console.error('Payment error:', err);
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    if (!transactionId) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await safeApiCall('/api/payment/status', {
        method: 'POST',
        body: JSON.stringify({ transaction_id: transactionId }),
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to check status');
      }

      const data = result.data as { status: string };
      const status = data.status;
      setStatusMessage(`Status: ${status}`);

      if (status === 'settlement') {
        onPaymentSuccess();
        onClose();
      }
    } catch (err) {
      console.error('Status check error:', err);
      setError(err instanceof Error ? err.message : 'Failed to check status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadQR = () => {
    if (!qrUrl) return;
    const link = document.createElement("a");
    link.href = qrUrl;
    link.download = `QRIS-Minggu-${mingguNumber}.png`;
    link.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Background overlay */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-[92%] sm:w-full max-w-md max-h-[90vh] overflow-y-auto p-6 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl text-left"
      >
        {/* Header */}
        <div className="mb-4">
          <CleanText size="text-xl" className="text-white mb-2 font-bold">
            Pembayaran Kas Minggu {mingguNumber}
          </CleanText>
          <div className="text-sm text-slate-400">{studentName}</div>
        </div>

        {/* Metode Pembayaran */}
        <div className="mb-4">
          <div className="text-sm text-slate-300 mb-2 font-medium">Metode Pembayaran</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {([
              { key: 'qris', label: 'QRIS', icon: '/qris.jpg' },
              { key: 'va_bca', label: 'VA BCA', icon: '/file.svg' },
              { key: 'va_permata', label: 'VA Permata', icon: '/file.svg' },
              { key: 'va_bni', label: 'VA BNI', icon: '/file.svg' },
              { key: 'va_bri', label: 'VA BRI', icon: '/file.svg' },
              { key: 'gopay', label: 'GoPay', icon: '/file.svg' },
              { key: 'shopeepay', label: 'ShopeePay', icon: '/file.svg' },
              { key: 'dana', label: 'DANA', icon: '/file.svg' },
            ] as const).map((opt) => (
              <button
                key={opt.key}
                onClick={() => {
                  setMethod(opt.key as string);
                  setQrUrl(null);
                  setVaInfo(null);
                  setDeeplinkUrl(null);
                  setStatusMessage(null);
                  setError(null);
                  setCopied(false);
                }}
                className={`flex flex-col sm:flex-row items-center sm:items-center justify-center gap-2 px-3 py-2 rounded-lg border text-xs sm:text-sm transition-all ${
                  method === opt.key
                    ? "bg-purple-600/30 border-purple-500 text-white shadow-md"
                    : "bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-700/70"
                }`}
              >
                <Image src={opt.icon} alt={opt.label} width={24} height={24} className="opacity-90" />
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Detail Pembayaran */}
        <div className="mb-6 p-4 rounded-lg bg-slate-800/70 border border-slate-700 shadow-inner">
          <div className="flex justify-between items-center mb-3">
            <span className="text-slate-300">Nominal:</span>
            <span className="text-white font-semibold text-lg">
              {new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
                maximumFractionDigits: 0,
              }).format(amount)}
            </span>
          </div>

          {/* QRIS */}
          {method === "qris" && (
            <>
              {qrUrl ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="p-3 rounded-xl bg-white">
                    <img
                      src={qrUrl}
                      alt="QRIS"
                      width={192}
                      height={192}
                      className="h-48 w-48 object-contain"
                    />
                  </div>
                  <button
                    onClick={handleDownloadQR}
                    className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors text-sm"
                  >
                    Download QR
                  </button>
                  <div className="text-xs text-slate-400 text-center">
                    QR berlaku sementara. Selesaikan pembayaran segera.
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-400">
                  Klik <b>"Buat"</b> untuk generate QR pembayaran.
                </div>
              )}
            </>
          )}

          {/* VA */}
          {["va_bca", "va_permata", "va_bni", "va_bri"].includes(method) && (
            <>
              {vaInfo ? (
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-slate-900/70 border border-slate-700">
                    <div>
                      <div className="text-slate-400 text-xs">Bank</div>
                      <div className="text-white font-semibold uppercase">{vaInfo.bank}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="text-slate-400 text-xs">Nomor VA</div>
                        <div className="text-white font-semibold">{vaInfo.number}</div>
                      </div>
                      <button
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(vaInfo.number);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 1500);
                          } catch {}
                        }}
                        className="px-2 py-1 rounded-md bg-slate-700 text-white text-xs hover:bg-slate-600"
                      >
                        {copied ? "Tersalin" : "Salin"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-400">
                  Klik <b>"Buat"</b> untuk generate nomor VA.
                </div>
              )}
            </>
          )}

          {/* E-wallet */}
          {(method === "gopay" || method === "shopeepay" || method === "dana") && (
            <>
              {deeplinkUrl ? (
                <a
                  href={deeplinkUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors text-center"
                >
                  Buka Aplikasi
                </a>
              ) : (
                <div className="text-xs text-slate-400">
                  Klik <b>"Buat"</b> untuk generate tautan pembayaran.
                </div>
              )}
            </>
          )}
        </div>

        {/* Status/Error */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-900/20 border border-red-500/40 text-red-300 text-sm">
            {error}
          </div>
        )}
        {statusMessage && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-900/20 border border-emerald-500/40 text-emerald-300 text-sm">
            {statusMessage}
          </div>
        )}

        {/* Action Button */}
        <div className="flex items-center justify-end gap-3 sticky bottom-0 bg-slate-900 pt-3">
          <motion.button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-600 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={isLoading}
          >
            Batal
          </motion.button>
          {qrUrl || vaInfo || deeplinkUrl ? (
            <motion.button
              onClick={handleCheckStatus}
              className="px-6 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-60 flex items-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isLoading}
            >
              {isLoading && (
                <span className="inline-block h-4 w-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
              )}
              {isLoading ? "Mengecek..." : "Cek Status"}
            </motion.button>
          ) : (
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
              {isLoading ? "Memproses..." : "Buat"}
            </motion.button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
