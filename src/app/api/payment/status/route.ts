import { NextRequest, NextResponse } from 'next/server';
import { midtransCore } from '@/lib/midtransClient';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transaction_id } = body;

    if (!transaction_id) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    // Check transaction status from Midtrans
    const status = await midtransCore.transaction.status(transaction_id);

    // Update payment status in database
    const { error: updateError } = await supabaseAdmin
      .from('payment_transactions')
      .update({
        status: status.transaction_status,
        updated_at: new Date().toISOString(),
      })
      .eq('transaction_id', transaction_id);

    if (updateError) {
      console.error('Error updating payment status:', updateError);
    }

    // If payment is successful, update kas_status
    if (status.transaction_status === 'settlement') {
      const { data: paymentData } = await supabaseAdmin
        .from('payment_transactions')
        .select('mahasiswa_id, minggu_id')
        .eq('transaction_id', transaction_id)
        .single();

      if (paymentData) {
        // Update kas_status to paid
        await supabaseAdmin
          .from('kas_status')
          .update({ status: true })
          .eq('mahasiswa_id', paymentData.mahasiswa_id)
          .eq('minggu_id', paymentData.minggu_id);
      }
    }

    return NextResponse.json({
      status: status.transaction_status,
      fraud_status: status.fraud_status,
      gross_amount: status.gross_amount,
    });
  } catch (error) {
    console.error('Payment status check error:', error);
    
    // Ensure we always return JSON response
    return NextResponse.json(
      { 
        error: 'Failed to check payment status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  }
}

