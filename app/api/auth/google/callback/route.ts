import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (!code || !state) {
    return NextResponse.redirect('/onboarding?error=missing_code');
  }

  try {
    const { psychologistId, redirect } = JSON.parse(state);
    
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user info
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();

    // Get calendar ID (usually the same as email)
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const { data: calendarList } = await calendar.calendarList.list();
    const primaryCalendar = calendarList.items?.find(cal => cal.primary);

    // Update psychologist with Google Calendar info
    const { error } = await supabase
      .from('psychologists')
      .update({
        google_email: userInfo.email,
        google_calendar_id: primaryCalendar?.id || userInfo.email,
        updated_at: new Date().toISOString()
      })
      .eq('id', psychologistId);

    if (error) {
      console.error('Error updating psychologist:', error);
      return NextResponse.redirect('/onboarding?error=update_failed');
    }

    // Store tokens securely
    await supabase
      .from('google_tokens')
      .upsert({
        psychologist_id: psychologistId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date,
        updated_at: new Date().toISOString()
      });

    return NextResponse.redirect(redirect || '/onboarding/success');
  } catch (error) {
    console.error('Google OAuth error:', error);
    return NextResponse.redirect('/onboarding?error=oauth_failed');
  }
}