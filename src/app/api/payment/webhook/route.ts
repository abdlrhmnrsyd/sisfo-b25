import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { order_id, status_code, gross_amount, signature_key } = body;

    // Verify signature manually: sha512(order_id+status_code+gross_amount+serverKey)
    const serverKey = process.env.MIDTRANS_SERVER_KEY!;
    const raw = `${order_id}${status_code}${gross_amount}${serverKey}`;
    const expectedSignature = crypto.createHash('sha512').update(raw).digest('hex');

    if (signature_key !== expectedSignature) {
      console.error('Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Update payment status in database
    const { error: updateError } = await supabaseAdmin
      .from('payment_transactions')
      .update({
        status: status_code === '200' ? 'settlement' : 'failed',
        updated_at: new Date().toISOString(),
      })
      .eq('transaction_id', order_id);

    if (updateError) {
      console.error('Error updating payment status:', updateError);
      return NextResponse.json(
        { error: 'Failed to update payment status' },
        { status: 500 }
      );
    }

    // If payment is successful, update kas_status
    if (status_code === '200') {
      const { data: paymentData } = await supabaseAdmin
        .from('payment_transactions')
        .select('mahasiswa_id, minggu_id')
        .eq('transaction_id', order_id)
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

    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('Webhook error:', error);
    
    // Ensure we always return JSON response
    return NextResponse.json(
      { 
        error: 'Webhook processing failed',
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

