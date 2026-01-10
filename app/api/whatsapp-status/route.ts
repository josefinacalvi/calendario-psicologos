import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch(
      'https://evolution-api-production-4bab.up.railway.app/instance/connectionState/The safe spot',
      {
        headers: {
          'apikey': '8F69B53CE95C-445F-B43A-67C403281790',
        },
        cache: 'no-store'
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { state: 'error', message: 'No se pudo conectar a Evolution API' }, 
        { status: 500 }
      );
    }

    const data = await response.json();
    
    // Evolution API devuelve { instance: "...", state: "open" | "close" | "connecting" }
    return NextResponse.json({
      instance: data.instance,
      state: data.state || 'unknown'
    });
    
  } catch (error) {
    console.error('Error checking WhatsApp status:', error);
    return NextResponse.json(
      { state: 'error', message: 'Error de conexión' }, 
      { status: 500 }
    );
  }
}