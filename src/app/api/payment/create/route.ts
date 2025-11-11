import { NextRequest, NextResponse } from 'next/server';
import { midtransSnapServer } from '@/lib/midtransClient';

// Helper to safely get supabaseAdmin
function getSupabaseAdmin() {
  try {
    // Check environment variables first
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set in environment variables');
    }
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set in environment variables');
    }
    
    // Dynamic import to catch errors
    const { supabaseAdmin } = require('@/lib/supabaseAdmin');
    return supabaseAdmin;
  } catch (error) {
    console.error('Supabase Admin initialization error:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    
    // Check if supabaseAdmin is initialized
    if (!supabaseAdmin) {
      return NextResponse.json(
        { 
          error: 'Server configuration error',
          details: 'SUPABASE_SERVICE_ROLE_KEY is missing. Please add it to your .env.local file and restart the server.'
        },
        { status: 500 }
      );
    }
    const body = await request.json();
    const { mahasiswa_id, minggu_id, amount, minggu_number, student_name } = body;

    // Validasi input
    if (!mahasiswa_id || !minggu_id || !amount || !student_name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate unique but short order ID (Midtrans max 50 chars)
    const shortMahasiswa = String(mahasiswa_id).replace(/-/g, '').slice(0, 8);
    const ts = Date.now().toString(36);
    const orderId = `KAS-${minggu_number}-${shortMahasiswa}-${ts}`; // e.g., KAS-3-ab12cd34-lmno123

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
    const transaction = await midtransSnapServer.createTransaction(parameter);
    const transactionToken = transaction.token;

    // Save transaction to database
    const { data: paymentData, error: paymentError } = await supabaseAdmin
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
        { error: 'Failed to save payment transaction', details: paymentError.message },
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
