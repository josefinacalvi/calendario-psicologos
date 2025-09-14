import { NextRequest, NextResponse } from 'next/server';
import { getAuthUrl } from '@/lib/google-calendar';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const psychologistId = searchParams.get('psychologist_id');
  
  if (!psychologistId) {
    return NextResponse.json({ error: 'Missing psychologist_id' }, { status: 400 });
  }
  
  const { data: psychologist, error } = await supabase
    .from('psychologists')
    .select('id, name')
    .eq('id', psychologistId)
    .single();
    
  if (error || !psychologist) {
    return NextResponse.json({ error: 'Psychologist not found' }, { status: 404 });
  }
  
  const authUrl = getAuthUrl(psychologistId);
  
  return NextResponse.redirect(authUrl);
}