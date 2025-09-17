import { google } from 'googleapis';
import { NextResponse } from 'next/server';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const psychologistId = searchParams.get('psychologist_id');
  const redirect = searchParams.get('redirect') || '/dashboard';

  if (!psychologistId) {
    return NextResponse.json({ error: 'Psychologist ID is required' }, { status: 400 });
  }

  const scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/userinfo.email'
  ];

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    state: JSON.stringify({ psychologistId, redirect }),
    prompt: 'consent'
  });

  return NextResponse.redirect(authUrl);
}