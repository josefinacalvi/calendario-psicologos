'use client';

import { useState } from 'react';

export default function TestPage() {
  const [fileName, setFileName] = useState('');
  const [status, setStatus] = useState('Esperando acción...');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('Archivo seleccionado:', file.name);
      setFileName(file.name);
      setStatus(`¡Archivo seleccionado! Nombre: ${file.name}`);
      alert(`¡Archivo seleccionado! Nombre: ${file.name}`);
    } else {
      console.log('No se seleccionó ningún archivo.');
      setStatus('No se seleccionó ningún archivo.');
    }
  };

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif', backgroundColor: 'white', color: 'black' }}>
      <h1>Página de Prueba de Subida de Archivo</h1>
      <p>Este es un test para aislar el problema del botón.</p>
      <p><strong>Estado:</strong> {status}</p>
      <hr style={{ margin: '20px 0' }} />

      {/* Versión 1: Botón Estilizado (el que debería funcionar) */}
      <div style={{ marginBottom: '40px' }}>
        <h2>Prueba 1: Botón con Label Estilizado</h2>
        <p>Por favor, haz clic en este botón azul:</p>
        <label 
          htmlFor="file-upload-styled" 
          style={{
            backgroundColor: '#2563eb', // Color azul
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'inline-block',
            marginTop: '10px'
          }}
        >
          Seleccionar Archivo (Prueba 1)
        </label>
        <input 
          id="file-upload-styled" 
          type="file" 
          style={{ display: 'none' }} // Otra forma de ocultar
          onChange={handleFileChange} 
        />
      </div>

      {/* Versión 2: Input Nativo (a prueba de todo) */}
      <div>
        <h2>Prueba 2: Botón Nativo del Navegador</h2>
        <p>Si el botón de arriba no funciona, ¿funciona este de aquí abajo?</p>
        <input 
          type="file" 
          onChange={handleFileChange} 
          style={{ marginTop: '10px' }}
        />
      </div>
    </div>
  );
}