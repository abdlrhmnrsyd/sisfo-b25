# Setup Payment Gateway Midtrans

Dokumentasi untuk mengintegrasikan payment gateway Midtrans ke sistem kas kelas TRPL 1B.

## 🚀 Fitur yang Ditambahkan

- **Pembayaran Online**: Mahasiswa bisa membayar kas langsung melalui Midtrans
- **Multiple Payment Methods**: QRIS, Virtual Account, E-Wallet, Credit Card
- **Real-time Status Update**: Status pembayaran terupdate otomatis
- **Payment History**: Riwayat transaksi pembayaran
- **Webhook Integration**: Notifikasi pembayaran real-time

## 📋 Prerequisites

1. Akun Midtrans yang sudah aktif di production
2. Server Key dan Client Key dari Midtrans
3. Database Supabase yang sudah terkonfigurasi

## 🔧 Setup Environment Variables

Tambahkan environment variables berikut ke file `.env.local`:

```env
# Midtrans Configuration
MIDTRANS_SERVER_KEY=your_midtrans_server_key_here
MIDTRANS_CLIENT_KEY=your_midtrans_client_key_here
MIDTRANS_IS_PRODUCTION=true

# Payment Configuration
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION=true
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=your_midtrans_client_key_here
```

## 🗄️ Database Setup

Jalankan script SQL berikut di Supabase SQL Editor:

```sql
-- Buat tabel payment_transactions
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mahasiswa_id UUID NOT NULL REFERENCES mahasiswa(id) ON DELETE CASCADE,
  minggu_id UUID NOT NULL REFERENCES minggu_kas(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  payment_method VARCHAR(50) DEFAULT 'midtrans',
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'settlement', 'capture', 'deny', 'cancel', 'expire', 'failure')),
  transaction_id VARCHAR(255) UNIQUE NOT NULL,
  payment_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Buat index untuk performa query
CREATE INDEX IF NOT EXISTS idx_payment_transactions_mahasiswa_id ON payment_transactions(mahasiswa_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_minggu_id ON payment_transactions(minggu_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_transaction_id ON payment_transactions(transaction_id);

-- Buat trigger untuk update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_payment_transactions_updated_at 
    BEFORE UPDATE ON payment_transactions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Buat RLS (Row Level Security) policies
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Policy untuk mahasiswa bisa melihat transaksi mereka sendiri
CREATE POLICY "Mahasiswa can view their own payment transactions" ON payment_transactions
    FOR SELECT USING (
        mahasiswa_id IN (
            SELECT id FROM mahasiswa WHERE nim = auth.jwt() ->> 'nim'
        )
    );

-- Policy untuk insert payment transactions (dari API)
CREATE POLICY "Allow insert payment transactions" ON payment_transactions
    FOR INSERT WITH CHECK (true);

-- Policy untuk update payment transactions (dari webhook)
CREATE POLICY "Allow update payment transactions" ON payment_transactions
    FOR UPDATE USING (true);
```

## 🔗 Webhook Configuration

1. Login ke Midtrans Dashboard
2. Masuk ke menu **Settings > Configuration**
3. Set **Payment Notification URL** ke: `https://yourdomain.com/api/payment/webhook`
4. Set **Finish URL** ke: `https://yourdomain.com/payment/success`
5. Set **Unfinish URL** ke: `https://yourdomain.com/payment/pending`
6. Set **Error URL** ke: `https://yourdomain.com/payment/error`

## 📁 File Structure

```
src/
├── app/
│   ├── api/
│   │   └── payment/
│   │       ├── create/route.ts      # API untuk membuat payment
│   │       ├── status/route.ts      # API untuk cek status payment
│   │       └── webhook/route.ts     # Webhook dari Midtrans
│   ├── payment/
│   │   ├── success/page.tsx         # Halaman sukses pembayaran
│   │   ├── pending/page.tsx         # Halaman pending pembayaran
│   │   └── error/page.tsx           # Halaman error pembayaran
│   └── components/
│       └── PaymentModal.tsx         # Modal untuk pembayaran
├── lib/
│   └── midtransClient.ts            # Konfigurasi Midtrans client
└── database_schema.sql              # Script database
```

## 🎯 Cara Penggunaan

1. **Mahasiswa Login**: Masuk dengan NIM di halaman cash
2. **Pilih Minggu**: Pilih minggu yang belum dibayar
3. **Klik "Bayar Sekarang"**: Modal payment akan muncul
4. **Pilih Metode Pembayaran**: QRIS, VA, E-Wallet, dll
5. **Selesaikan Pembayaran**: Di halaman Midtrans
6. **Status Terupdate**: Otomatis terupdate setelah pembayaran

## 🔄 Flow Pembayaran

1. Mahasiswa klik "Bayar Sekarang"
2. System create payment request ke Midtrans
3. Redirect ke halaman pembayaran Midtrans
4. Mahasiswa selesaikan pembayaran
5. Midtrans kirim webhook ke system
6. System update status pembayaran
7. Mahasiswa redirect ke halaman sukses

## 🛠️ Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## 🚨 Troubleshooting

### Error: "Invalid signature"
- Pastikan SERVER_KEY dan CLIENT_KEY sudah benar
- Cek environment variables sudah terload

### Error: "Payment failed"
- Cek koneksi internet
- Pastikan Midtrans account aktif
- Cek webhook URL sudah benar

### Status tidak terupdate
- Cek webhook sudah dikonfigurasi
- Pastikan webhook URL accessible dari internet
- Cek logs di Supabase untuk error

## 📞 Support

Jika ada masalah dengan implementasi, silakan cek:
1. Logs di browser console
2. Logs di Supabase dashboard
3. Logs di Midtrans dashboard
4. Network tab untuk API calls

## 🔒 Security Notes

- Jangan commit SERVER_KEY ke repository
- Gunakan HTTPS untuk production
- Validasi signature di webhook
- Implementasi rate limiting jika diperlukan



