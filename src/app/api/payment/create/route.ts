import { NextRequest, NextResponse } from 'next/server';
import { midtransSnapServer } from '@/lib/midtransClient';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mahasiswa_id, minggu_id, amount, minggu_number, student_name } = body;

    // Validasi input
    if (!mahasiswa_id || !minggu_id || !amount || !student_name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate unique order ID
    const orderId = `KAS-${minggu_number}-${mahasiswa_id}-${Date.now()}`;

    // Prepare Midtrans payment parameters
    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: amount,
      },
      customer_details: {
        first_name: student_name,
        last_name: '',
        email: `${student_name.toLowerCase().replace(/\s+/g, '')}@trpl1b.com`,
        phone: '08123456789',
      },
      item_details: [
        {
          id: `kas-minggu-${minggu_number}`,
          price: amount,
          quantity: 1,
          name: `Pembayaran Kas Minggu ${minggu_number}`,
          category: 'Pembayaran Kas',
        },
      ],
      callbacks: {
        finish: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success`,
        pending: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/pending`,
        error: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/error`,
      },
    };

    // Create transaction (Snap) in Midtrans
    const transaction = await midtransSnapServer.createTransaction(parameter as any);
    const transactionToken = transaction.token;

    // Save transaction to database
    const { data: paymentData, error: paymentError } = await supabase
      .from('payment_transactions')
      .insert({
        mahasiswa_id,
        minggu_id,
        amount,
        payment_method: 'midtrans',
        status: 'pending',
        transaction_id: orderId,
        payment_url: transaction.redirect_url,
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Error saving payment transaction:', paymentError);
      return NextResponse.json(
        { error: 'Failed to save payment transaction' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      token: transactionToken,
      redirect_url: transaction.redirect_url,
      transaction_id: orderId,
      payment_id: paymentData.id,
    });
  } catch (error) {
    console.error('Payment creation error:', error);
    
    // Ensure we always return JSON response
    return NextResponse.json(
      { 
        error: 'Failed to create payment',
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
