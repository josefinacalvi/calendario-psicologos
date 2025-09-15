import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Reenviar a n8n
    const response = await fetch('https://primary-production-ceb9.up.railway.app/webhook/upload-cv', {
      method: 'POST',
      body: formData,
      headers: {
        // No incluyas Content-Type, deja que se auto-configure para multipart/form-data
      }
    });

    if (!response.ok) {
      throw new Error('Error from n8n');
    }

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Error processing CV' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}