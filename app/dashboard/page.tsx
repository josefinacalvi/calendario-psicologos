'use client';

import { useState } from 'react';

export default function Dashboard() {
  const [psychologists] = useState([
    { id: 1, name: 'Dra. María García', email: 'maria@ejemplo.com', connected: true, last_sync: '2024-01-15 10:30', appointments_today: 4 },
    { id: 2, name: 'Dr. Juan Pérez', email: 'juan@ejemplo.com', connected: false, last_sync: null, appointments_today: 0 },
    { id: 3, name: 'Lic. Ana López', email: 'ana@ejemplo.com', connected: true, last_sync: '2024-01-15 09:45', appointments_today: 6 },
    { id: 4, name: 'Dr. Carlos Ruiz', email: 'carlos@ejemplo.com', connected: true, last_sync: '2024-01-15 11:00', appointments_today: 3 },
    { id: 5, name: 'Dra. Laura Martín', email: 'laura@ejemplo.com', connected: false, last_sync: null, appointments_today: 0 },
  ]);

  const stats = {
    total: 30,
    connected: 3,
    appointments_today: 13,
    appointments_week: 47
  };

  const handleConnectCalendar = (id: number) => {
    window.location.href = `/api/auth/google?psychologist_id=${id}`;
  };

  const cardStyle = {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    marginBottom: '16px'
  };

  const statCardStyle = {
    ...cardStyle,
    textAlign: 'center' as const
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>
          Dashboard de Control
        </h1>
        <p style={{ color: '#6b7280', marginBottom: '32px' }}>
          Gestión de calendarios y sincronización con Google Calendar
        </p>

        {/* Estadísticas */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '32px' }}>
          <div style={statCardStyle}>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Total Psicólogos</p>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#111827' }}>{stats.total}</p>
          </div>
          <div style={statCardStyle}>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Calendarios Conectados</p>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#059669' }}>{stats.connected}</p>
          </div>
          <div style={statCardStyle}>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Citas Hoy</p>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#7c3aed' }}>{stats.appointments_today}</p>
          </div>
          <div style={statCardStyle}>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Citas Esta Semana</p>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#4f46e5' }}>{stats.appointments_week}</p>
          </div>
        </div>

        {/* Tabla */}
        <div style={cardStyle}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #e5e7eb' }}>
            Lista de Psicólogos
          </h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase' }}>Psicólogo</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase' }}>Email</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase' }}>Estado</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase' }}>Última Sincronización</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase' }}>Citas Hoy</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {psychologists.map((psy, index) => (
                  <tr key={psy.id} style={{ borderBottom: index < psychologists.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                    <td style={{ padding: '16px 12px', fontSize: '14px', fontWeight: '500', color: '#111827' }}>{psy.name}</td>
                    <td style={{ padding: '16px 12px', fontSize: '14px', color: '#6b7280' }}>{psy.email}</td>
                    <td style={{ padding: '16px 12px' }}>
                      {psy.connected ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: '500', backgroundColor: '#d1fae5', color: '#065f46' }}>
                          ✓ Conectado
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: '500', backgroundColor: '#fee2e2', color: '#991b1b' }}>
                          ✗ Desconectado
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '16px 12px', fontSize: '14px', color: '#6b7280' }}>{psy.last_sync || '-'}</td>
                    <td style={{ padding: '16px 12px', fontSize: '14px', fontWeight: '500', color: '#111827' }}>{psy.appointments_today}</td>
                    <td style={{ padding: '16px 12px' }}>
                      {!psy.connected && (
                        <button 
                          onClick={() => handleConnectCalendar(psy.id)}
                          style={{ color: '#2563eb', cursor: 'pointer', fontSize: '14px', fontWeight: '500', background: 'none', border: 'none', textDecoration: 'none' }}
                          onMouseOver={(e) => e.currentTarget.style.color = '#1d4ed8'}
                          onMouseOut={(e) => e.currentTarget.style.color = '#2563eb'}
                        >
                          🔗 Conectar Calendar
                        </button>
                      )}
                      {psy.connected && (
                        <span style={{ color: '#6b7280', fontSize: '14px' }}>✓ Conectado</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sección informativa */}
        <div style={{ marginTop: '32px', padding: '24px', backgroundColor: '#dbeafe', border: '1px solid #93c5fd', borderRadius: '8px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1e3a8a', marginBottom: '12px' }}>
            ¿Cómo funciona?
          </h3>
          <ol style={{ paddingLeft: '20px', color: '#1e40af', lineHeight: '1.8' }}>
            <li>Cada psicólogo conecta su Google Calendar haciendo click en Conectar Calendar</li>
            <li>El sistema sincroniza automáticamente los eventos cada 15 minutos</li>
            <li>Los pacientes solo ven los horarios realmente disponibles</li>
            <li>Las citas se crean automáticamente en el Google Calendar del psicólogo</li>
          </ol>
        </div>
      </div>
    </div>
  );
}