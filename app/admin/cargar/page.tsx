'use client'

import React, { useState } from 'react'
import { createPerfil } from '../actions'

export default function CargarPerfilPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' })

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setStatusMessage({ type: null, message: '' })
    
    const formData = new FormData(e.currentTarget)
    const result = await createPerfil(formData)
    
    setIsSubmitting(false)
    setStatusMessage({ type: result.success ? 'success' : 'error', message: result.message })
    if (result.success) {
      (document.getElementById('perfilForm') as HTMLFormElement)?.reset()
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8F3ED', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: '800px', backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', padding: '2.5rem' }}>
        
        <header style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#115e59' }}>
            Carga de Perfil de Profesional
          </h1>
          <p style={{ marginTop: '0.5rem', fontSize: '1.125rem', color: '#6b7280' }}>
            Completa manualmente los datos del psicólogo.
          </p>
        </header>

        {statusMessage.message && (
          <div style={{
            padding: '1rem',
            marginBottom: '1.5rem',
            borderRadius: '8px',
            fontWeight: 500,
            backgroundColor: statusMessage.type === 'success' ? '#dcfce7' : '#fee2e2',
            color: statusMessage.type === 'success' ? '#166534' : '#991b1b',
            borderLeft: `4px solid ${statusMessage.type === 'success' ? '#22c55e' : '#ef4444'}`
          }}>
            {statusMessage.message}
          </div>
        )}

        <form id="perfilForm" onSubmit={handleSubmit}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid #f3f4f6', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}>Nombre y Apellido *</label>
              <input type="text" name="nombre_completo" required style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '0.75rem', fontSize: '1rem' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}>Orientación / estilo clínico *</label>
              <input type="text" name="orientacion_clinica" required style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '0.75rem', fontSize: '1rem' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid #f3f4f6', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}>Especialidades (separadas por coma)</label>
              <input type="text" name="especialidades" placeholder="Ej: Ansiedad, Depresión" style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '0.75rem', fontSize: '1rem' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}>Modalidad *</label>
              <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem' }}>
                {['virtual', 'presencial', 'ambas'].map((mod) => (
                  <label key={mod} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="radio" name="modalidad" value={mod} required />
                    <span style={{ textTransform: 'capitalize' }}>{mod}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid #f3f4f6', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}>Zona (si atiende presencial)</label>
              <input type="text" name="zona" placeholder="Ej: Palermo, CABA" style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '0.75rem', fontSize: '1rem' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}>Disponibilidad general *</label>
              <textarea name="disponibilidad_general" rows={2} required placeholder="Ej: Lunes y Miércoles de 16:00 a 20:00" style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '0.75rem', fontSize: '1rem' }}></textarea>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}>Frase breve: ¿Por qué él/ella? *</label>
              <input type="text" name="frase_clave" required maxLength={100} style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '0.75rem', fontSize: '1rem' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}>Mini bio (2-3 líneas) *</label>
              <textarea name="mini_bio" rows={3} required maxLength={250} placeholder="Ej: Psicólogo con enfoque humanista..." style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '0.75rem', fontSize: '1rem' }}></textarea>
            </div>
          </div>

          <div style={{ paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
              <input type="checkbox" name="estado_membresia" defaultChecked style={{ width: '1.25rem', height: '1.25rem' }} />
              <span style={{ fontWeight: 600 }}>Estado de membresía: <span style={{ color: '#0d9488' }}>Activo</span></span>
            </label>
            <button type="submit" disabled={isSubmitting} style={{ padding: '0.75rem 2rem', borderRadius: '9999px', border: 'none', backgroundColor: isSubmitting ? '#93c5fd' : '#5B8AD1', color: 'white', fontWeight: 600, fontSize: '1rem', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
              {isSubmitting ? 'Cargando...' : 'Cargar Perfil en Supabase'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
