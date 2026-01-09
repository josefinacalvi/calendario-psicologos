'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// --- CONFIGURACIÓN SUPABASE ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// --- TIPOS (Para evitar errores de build) ---
type TabType = 'overview' | 'leads' | 'psychologists' | 'patients' | 'emails';

interface Lead {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  source: string;
  created_at: string;
}

interface Psychologist {
  id: string;
  nombre: string;
  email: string;
  estado: string;
  modalidad: string;
  created_at: string;
}

interface Patient {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  created_at: string;
}

interface EmailLog {
  id: number;
  patient_email: string;
  email_subject: string;
  email_tema: string;
  sent_at: string;
  status: string;
}

export default function DashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [psychologists, setPsychologists] = useState<Psychologist[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const { data: leadsData } = await supabase.from('patient_leads').select('*').order('created_at', { ascending: false });
        const { data: psychologistsData } = await supabase.from('perfiles_psicologos').select('id, nombre, email, estado, modalidad, created_at').order('created_at', { ascending: false });
        const { data: patientsData } = await supabase.from('patients').select('*').order('created_at', { ascending: false });
        const { data: emailLogsData } = await supabase.from('email_marketing_log').select('*').order('sent_at', { ascending: false }).limit(20);

        setLeads(leadsData || []);
        setPsychologists(psychologistsData || []);
        setPatients(patientsData || []);
        setEmailLogs(emailLogsData || []);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Métricas
  const totalLeads = leads.length + patients.length;
  const activePsychologists = psychologists.filter(p => p.estado === 'ACTIVO').length;
  const whatsappLeads = leads.filter(l => l.source === 'whatsapp').length;
  const tallyLeads = patients.length;

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Estilos comunes
  const cardStyle = {
    backgroundColor: 'white',
    borderRadius: '16px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    padding: '1.5rem',
    border: '1px solid #f3f4f6'
  };

  const titleStyle = { fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' };
  const numberStyle = { fontSize: '2.25rem', fontWeight: 700, color: '#115e59', margin: 0 };

  if (loading) {
    return <div style={{ minHeight: '100vh', backgroundColor: '#F8F3ED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Cargando...</div>;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8F3ED', padding: '2rem' }}>
      
      {/* HEADER */}
      <header style={{ maxWidth: '1200px', margin: '0 auto', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#115e59', margin: 0 }}>Dashboard</h1>
          <p style={{ color: '#6b7280', margin: 0 }}>The Safe Spot - Administración</p>
        </div>
        <a 
          href="/admin/cargar" 
          style={{ 
            backgroundColor: '#5B8AD1', color: 'white', padding: '0.75rem 1.5rem', 
            borderRadius: '9999px', textDecoration: 'none', fontWeight: 600, 
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)' 
          }}
        >
          + Cargar Psicólogo
        </a>
      </header>

      {/* TABS DE NAVEGACIÓN */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', marginBottom: '2rem', display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        {[
          { id: 'overview', label: '📊 Resumen' },
          { id: 'leads', label: '👥 Leads WA' },
          { id: 'patients', label: '📝 Leads Tally' },
          { id: 'psychologists', label: '🧑‍⚕️ Psicólogos' },
          { id: 'emails', label: '📧 Emails' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              backgroundColor: activeTab === tab.id ? '#115e59' : 'white',
              color: activeTab === tab.id ? 'white' : '#4b5563',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <main style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* VISTA: RESUMEN */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
            <div style={cardStyle}>
              <p style={titleStyle}>Total Leads</p>
              <p style={numberStyle}>{totalLeads}</p>
            </div>
            <div style={cardStyle}>
              <p style={titleStyle}>Psicólogos Activos</p>
              <p style={numberStyle}>{activePsychologists}</p>
            </div>
            <div style={cardStyle}>
              <p style={titleStyle}>Desde WhatsApp</p>
              <p style={numberStyle}>{whatsappLeads}</p>
            </div>
            <div style={cardStyle}>
              <p style={titleStyle}>Desde Tally</p>
              <p style={numberStyle}>{tallyLeads}</p>
            </div>
          </div>
        )}

        {/* VISTA: TABLAS (Reutilizable para Leads, Psicólogos, etc) */}
        {activeTab !== 'overview' && (
          <div style={cardStyle}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f3f4f6', textAlign: 'left' }}>
                    {activeTab === 'leads' && <><th style={{padding:'1rem'}}>Nombre</th><th style={{padding:'1rem'}}>Teléfono</th><th style={{padding:'1rem'}}>Fecha</th></>}
                    {activeTab === 'patients' && <><th style={{padding:'1rem'}}>Nombre</th><th style={{padding:'1rem'}}>Email</th><th style={{padding:'1rem'}}>Fecha</th></>}
                    {activeTab === 'psychologists' && <><th style={{padding:'1rem'}}>Nombre</th><th style={{padding:'1rem'}}>Email</th><th style={{padding:'1rem'}}>Estado</th></>}
                    {activeTab === 'emails' && <><th style={{padding:'1rem'}}>Email</th><th style={{padding:'1rem'}}>Asunto</th><th style={{padding:'1rem'}}>Estado</th></>}
                  </tr>
                </thead>
                <tbody>
                  {activeTab === 'leads' && leads.map(l => (
                    <tr key={l.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{padding:'1rem'}}>{l.name || '-'}</td>
                      <td style={{padding:'1rem'}}>{l.phone}</td>
                      <td style={{padding:'1rem', color:'#6b7280'}}>{formatDate(l.created_at)}</td>
                    </tr>
                  ))}
                  
                  {activeTab === 'patients' && patients.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{padding:'1rem'}}>{p.name}</td>
                      <td style={{padding:'1rem'}}>{p.email}</td>
                      <td style={{padding:'1rem', color:'#6b7280'}}>{formatDate(p.created_at)}</td>
                    </tr>
                  ))}

                  {activeTab === 'psychologists' && psychologists.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{padding:'1rem', fontWeight: 500}}>{p.nombre}</td>
                      <td style={{padding:'1rem'}}>{p.email}</td>
                      <td style={{padding:'1rem'}}>
                        <span style={{ 
                          padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600,
                          backgroundColor: p.estado === 'ACTIVO' ? '#dcfce7' : '#fef3c7',
                          color: p.estado === 'ACTIVO' ? '#166534' : '#92400e'
                        }}>
                          {p.estado}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {activeTab === 'emails' && emailLogs.map(e => (
                    <tr key={e.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{padding:'1rem'}}>{e.patient_email}</td>
                      <td style={{padding:'1rem'}}>{e.email_subject}</td>
                      <td style={{padding:'1rem'}}>{e.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}