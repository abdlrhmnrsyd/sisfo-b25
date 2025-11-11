-- Script untuk membuat tabel payment_transactions di Supabase
-- Jalankan script ini di SQL Editor di dashboard Supabase

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

-- Buat view untuk melihat status pembayaran dengan detail
CREATE OR REPLACE VIEW payment_status_view AS
SELECT 
    pt.id,
    pt.transaction_id,
    pt.amount,
    pt.status,
    pt.payment_method,
    pt.created_at,
    pt.updated_at,
    m.nama as student_name,
    m.nim,
    mk.minggu,
    mk.jumlah as minggu_amount
FROM payment_transactions pt
JOIN mahasiswa m ON pt.mahasiswa_id = m.id
JOIN minggu_kas mk ON pt.minggu_id = mk.id
ORDER BY pt.created_at DESC;

-- Grant permissions untuk view
GRANT SELECT ON payment_status_view TO authenticated;

