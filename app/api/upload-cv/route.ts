import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Enviar a n8n webhook
    const response = await fetch('https://primary-production-439de.up.railway.app/webhook/upload-cv', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('n8n error:', errorText);
      throw new Error('Error from n8n webhook');
    }

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Upload error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Error processing CV', details: errorMessage },
      { status: 500 }
    );
  }
}