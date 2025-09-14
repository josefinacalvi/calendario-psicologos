import { NextRequest, NextResponse } from 'next/server';
import { getOAuth2Client, getTokens } from '@/lib/google-calendar';
import { createClient } from '@supabase/supabase-js';
import { google } from 'googleapis';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  
  if (error) {
    return NextResponse.redirect('/dashboard/settings?error=auth_denied');
  }
  
  if (!code || !state) {
    return NextResponse.redirect('/dashboard/settings?error=missing_params');
  }
  
  try {
    const tokens = await getTokens(code);
    
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials(tokens);
    
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();
    
    const { error: dbError } = await supabase
      .from('google_calendar_config')
      .upsert({
        psychologist_id: parseInt(state),
        google_email: userInfo.email,
        google_calendar_id: userInfo.email,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expiry: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
        sync_enabled: true,
        last_sync_at: new Date().toISOString()
      }, {
        onConflict: 'psychologist_id'
      });
      
    if (dbError) {
      console.error('Error saving tokens:', dbError);
      return NextResponse.redirect('/dashboard/settings?error=save_failed');
    }
    
    return NextResponse.redirect('/dashboard/settings?success=calendar_connected');
    
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect('/dashboard/settings?error=auth_failed');
  }
}