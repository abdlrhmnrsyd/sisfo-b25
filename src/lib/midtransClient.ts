import { CoreApi, Snap } from 'midtrans-client';

export function getMidtransCore() {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  const clientKey = process.env.MIDTRANS_CLIENT_KEY;
  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';

  if (!serverKey) {
    throw new Error('Environment variable MIDTRANS_SERVER_KEY is required.');
  }
  if (!clientKey) {
    throw new Error('Environment variable MIDTRANS_CLIENT_KEY is required.');
  }

  return new CoreApi({ serverKey, clientKey, isProduction });
}

export function getMidtransSnapServer(): unknown {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';

  if (!serverKey) {
    throw new Error('Environment variable MIDTRANS_SERVER_KEY is required.');
  }

  // @ts-expect-error constructor typing mismatch
  return new (Snap as unknown as { new (opts: { isProduction: boolean; serverKey: string }): unknown })({ isProduction, serverKey });
}

// Types for payment
export interface PaymentRequest {
  mahasiswa_id: string;
  minggu_id: string;
  amount: number;
  minggu_number: number;
  student_name: string;
}

export interface PaymentResponse {
  token: string;
  redirect_url: string;
  transaction_id: string;
}

