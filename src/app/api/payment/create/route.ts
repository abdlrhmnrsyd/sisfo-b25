import { NextRequest, NextResponse } from 'next/server';
import { getMidtransCore } from '@/lib/midtransClient';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const body = await request.json();
    const { mahasiswa_id, minggu_id, amount, minggu_number, student_name, payment_method } = body;

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

    // Build charge params based on payment method
    const chosenMethod: string = payment_method || 'qris';
    type ChargeParameter = {
      payment_type: string;
      transaction_details: { order_id: string; gross_amount: number };
      customer_details?: Record<string, unknown>;
      item_details?: Array<Record<string, unknown>>;
      bank_transfer?: { bank: string };
      gopay?: Record<string, unknown>;
      shopeepay?: Record<string, unknown>;
      dana?: Record<string, unknown>;
      callbacks?: { finish?: string; pending?: string; error?: string };
    };
    let chargeParams: ChargeParameter;
    if (chosenMethod === 'qris') {
      chargeParams = {
        payment_type: 'qris',
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
    } else if (chosenMethod === 'va_bca' || chosenMethod === 'va_permata' || chosenMethod === 'va_bni' || chosenMethod === 'va_bri') {
      const bank = chosenMethod === 'va_bca' ? 'bca' : chosenMethod === 'va_permata' ? 'permata' : chosenMethod === 'va_bni' ? 'bni' : 'bri';
      chargeParams = {
        payment_type: 'bank_transfer',
        transaction_details: {
          order_id: orderId,
          gross_amount: amount,
        },
        bank_transfer: {
          bank,
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
    } else if (chosenMethod === 'gopay') {
      chargeParams = {
        payment_type: 'gopay',
        transaction_details: {
          order_id: orderId,
          gross_amount: amount,
        },
        gopay: {
          enable_callback: true,
          callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success`,
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
    } else if (chosenMethod === 'shopeepay') {
      chargeParams = {
        payment_type: 'shopeepay',
        transaction_details: {
          order_id: orderId,
          gross_amount: amount,
        },
        shopeepay: {
          callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success`,
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
    } else if (chosenMethod === 'dana') {
      chargeParams = {
        payment_type: 'dana',
        transaction_details: {
          order_id: orderId,
          gross_amount: amount,
        },
        dana: {
          callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success`,
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
    } else {
      return NextResponse.json(
        { error: 'Unsupported payment method' },
        { status: 400 }
      );
    }

    interface ChargeAction { name?: string; url?: string }
    interface ChargeLike {
      actions?: ChargeAction[];
      qr_code_url?: string;
      deeplink_url?: string;
      va_numbers?: { bank?: string; va_number: string }[];
      permata_va_number?: string;
    }
    const core = getMidtransCore() as unknown as { charge: (params: unknown) => Promise<unknown> };
    const charge = await core.charge(chargeParams as unknown) as ChargeLike;

    // Collect presentation data per method
    let qrUrl: string | undefined;
    let va: { bank: string; number: string } | undefined;
    let deeplinkUrl: string | undefined;

    if (chosenMethod === 'qris') {
      if (Array.isArray(charge?.actions)) {
        const qrAction = charge.actions.find((a: ChargeAction) => a?.name === 'generate-qr-code' || a?.name === 'qr-code');
        qrUrl = qrAction?.url;
      }
      if (!qrUrl && typeof charge?.qr_code_url === 'string') {
        qrUrl = charge.qr_code_url;
      }
      if (!qrUrl) {
        return NextResponse.json(
          { error: 'Failed to create QR payment', details: 'QR URL not found from Midtrans response' },
          { status: 500 }
        );
      }
    } else if (chosenMethod === 'va_bca' || chosenMethod === 'va_permata' || chosenMethod === 'va_bni' || chosenMethod === 'va_bri') {
      const bank = chosenMethod === 'va_bca' ? 'bca' : chosenMethod === 'va_permata' ? 'permata' : chosenMethod === 'va_bni' ? 'bni' : 'bri';
      // permata sometimes returns permata_va_number, others return va_numbers array
      if (typeof charge?.permata_va_number === 'string') {
        va = { bank: 'permata', number: charge.permata_va_number };
      } else if (Array.isArray(charge?.va_numbers) && charge.va_numbers.length > 0) {
        const found = charge.va_numbers[0];
        va = { bank: (found.bank || bank).toLowerCase(), number: found.va_number };
      }
      if (!va) {
        return NextResponse.json(
          { error: 'Failed to create VA payment', details: 'VA number not found from Midtrans response' },
          { status: 500 }
        );
      }
    } else if (chosenMethod === 'gopay' || chosenMethod === 'shopeepay' || chosenMethod === 'dana') {
      if (Array.isArray(charge?.actions)) {
        const deeplink = charge.actions.find((a: ChargeAction) => a?.name === 'deeplink-redirect');
        deeplinkUrl = deeplink?.url;
      }
      if (!deeplinkUrl && typeof charge?.deeplink_url === 'string') {
        deeplinkUrl = charge.deeplink_url;
      }
      if (!deeplinkUrl) {
        return NextResponse.json(
          { error: 'Failed to create e-wallet payment', details: 'Deeplink URL not found from Midtrans response' },
          { status: 500 }
        );
      }
    }

    // Save transaction to database
    const { data: paymentData, error: paymentError } = await supabaseAdmin
      .from('payment_transactions')
      .insert({
        mahasiswa_id,
        minggu_id,
        amount,
        payment_method: chosenMethod,
        status: 'pending',
        transaction_id: orderId,
        payment_url: qrUrl || deeplinkUrl || (va ? `${va.bank}:${va.number}` : ''),
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
      method: chosenMethod,
      qr_url: qrUrl,
      va,
      deeplink_url: deeplinkUrl,
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
