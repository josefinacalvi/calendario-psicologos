import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // <--- NUEVO NOMBRE
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validar campos requeridos
    if (!body.name || !body.email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Verificar si el email ya existe
    const { data: existing } = await supabase
      .from('psychologists')
      .select('id')
      .eq('email', body.email)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 409 }
      );
    }

    // Insertar nuevo psicólogo
    const { data, error } = await supabase
      .from('psychologists')
      .insert([{
        name: body.name,
        email: body.email,
        phone: body.phone || null,
        specialties: body.specialties || [],
        years_experience: body.years_experience || 0,
        modality: body.modality || 'hybrid',
        bio: body.bio || null,
        formacion: body.formacion || null,
        session_duration: body.session_duration || 30,
        buffer_time: body.buffer_time || 15,
        hourly_rate: body.hourly_rate || 100,
        currency: body.currency || 'USD',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating psychologist:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}