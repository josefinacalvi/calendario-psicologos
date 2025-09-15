'use client';

import { useState } from 'react';

export default function AdminUpload() {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage('Procesando CV...');

    const formData = new FormData();
    formData.append('cv', file);
    formData.append('filename', file.name);

    try {
      const response = await fetch('/api/upload-cv', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        setMessage('✅ CV procesado correctamente');
      } else {
        setMessage('❌ Error al procesar el CV');
      }
    } catch (error) {
      setMessage('❌ Error de conexión con n8n');
      console.error('Error:', error);
    }

    setUploading(false);
    e.target.value = '';
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f9fafb', 
      padding: '40px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>
          Cargar CV de Psicólogo
        </h1>
        
        <div style={{ 
          backgroundColor: 'white', 
          padding: '30px', 
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <p style={{ marginBottom: '20px', color: '#6b7280' }}>
            Sube el CV en formato PDF. El sistema extraerá automáticamente la información.
          </p>

          <input
            type="file"
            accept=".pdf"
            onChange={handleUpload}
            disabled={uploading}
            style={{
              display: 'block',
              width: '100%',
              padding: '10px',
              border: '2px dashed #cbd5e1',
              borderRadius: '6px',
              cursor: uploading ? 'not-allowed' : 'pointer',
              backgroundColor: uploading ? '#f3f4f6' : 'white'
            }}
          />

          {message && (
            <p style={{ 
              marginTop: '20px', 
              padding: '10px',
              backgroundColor: message.includes('✅') ? '#d1fae5' : '#fee2e2',
              color: message.includes('✅') ? '#065f46' : '#991b1b',
              borderRadius: '6px'
            }}>
              {message}
            </p>
          )}
        </div>

        <div style={{ marginTop: '20px' }}>
          <a href="/dashboard" style={{ color: '#2563eb', textDecoration: 'none' }}>
            ← Volver al Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}