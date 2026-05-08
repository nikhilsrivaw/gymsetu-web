// Client-side PayU helper.
// Calls the payu-initiate edge function for a signed hash, then auto-submits
// a hidden form to PayU's hosted checkout. Returning to the SPA happens via
// payu-callback (server) → 302 → /payment/success or /payment/failure.

import { supabase } from './supabase';

export interface InitiatePayUInput {
  /** Pass exactly one of these — identifies the row PayU is paying for */
  subscription_id?: string;
  purchase_id?: string;

  amount: number;       // INR rupees
  productinfo: string;  // shown to user on PayU page
  firstname: string;
  email: string;
  phone: string;
  udf1?: string;        // optional pass-through (we use it for plan id, etc.)
}

/**
 * Initiates a PayU payment.
 * 1) Calls payu-initiate edge function → returns { payu_url, fields }
 * 2) Builds a hidden form, appends to <body>, submits.
 * The browser then navigates to PayU. After payment, payu-callback
 * (server) redirects back to /payment/success or /payment/failure.
 */
export async function initiatePayU(input: InitiatePayUInput): Promise<void> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error('You must be signed in to make a payment.');

  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/payu-initiate`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${token}`,
      'apikey':        import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || `PayU initiation failed (${res.status})`);
  }

  const { payu_url, fields } = await res.json() as {
    payu_url: string;
    fields:   Record<string, string>;
  };

  submitFormToPayU(payu_url, fields);
}

function submitFormToPayU(action: string, fields: Record<string, string>): void {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = action;
  form.style.display = 'none';

  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement('input');
    input.type  = 'hidden';
    input.name  = name;
    input.value = value ?? '';
    form.appendChild(input);
  }

  document.body.appendChild(form);
  form.submit();
}
