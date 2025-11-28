import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // <--- NUEVO NOMBRE
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('psychologists')
      .select('id')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
      throw error;
    }

    return NextResponse.json({ exists: !!data });
  } catch (error) {
    console.error('Error checking email:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}