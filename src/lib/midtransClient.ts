// @ts-ignore
import { CoreApi, Snap } from 'midtrans-client';

// Core API for status/capture/refund checks (server-side)
export const midtransCore = new CoreApi({
  serverKey: process.env.MIDTRANS_SERVER_KEY!,
  clientKey: process.env.MIDTRANS_CLIENT_KEY!,
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
});

// Snap (server-side) to create transaction token/redirect URL
const snapConfig: any = {
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  serverKey: process.env.MIDTRANS_SERVER_KEY!,
};
export const midtransSnapServer: any = new (Snap as any)(snapConfig);

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

