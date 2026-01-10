'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// --- TIPOS ---
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
  nombre_completo: string;
  email: string;
  estado: string;
  modalidad: string;
  fecha_pago: string | null;
  fecha_vencimiento: string | null;
  created_at: string;
}

interface Patient {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  created_at: string;
}

interface Payment {
  id: number;
  amount: number;
  status: string;
  created_at: string;
  psicologo_id: string;
  payment_provider: string;
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
  // --- ESTADOS ---
  const [leads, setLeads] = useState<Lead[]>([]);
  const [psychologists, setPsychologists] = useState<Psychologist[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'psychologists' | 'leads' | 'patients' | 'payments' | 'emails'>('overview');
  const [whatsappStatus, setWhatsappStatus] = useState<'checking' | 'open' | 'close' | 'connecting' | 'error'>('checking');

  // --- CARGA DE DATOS ---
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      
      // WhatsApp Status (simulado o real según tu API)
      try {
        const whatsappRes = await fetch('/api/whatsapp-status');
        if (whatsappRes.ok) {
            const whatsappData = await whatsappRes.json();
            setWhatsappStatus(whatsappData.state || 'error');
        } else {
            setWhatsappStatus('error');
        }
      } catch {
        setWhatsappStatus('error');
      }
      
      // Consultas Supabase
      const { data: leadsData } = await supabase.from('patient_leads').select('*').order('created_at', { ascending: false });
      const { data: psychologistsData } = await supabase.from('perfiles_psicologos').select('id, nombre_completo, email, estado, modalidad, fecha_pago, fecha_vencimiento, created_at').order('created_at', { ascending: false });
      const { data: patientsData } = await supabase.from('patients').select('*').order('created_at', { ascending: false });
      const { data: paymentsData } = await supabase.from('payment_transactions').select('*').order('created_at', { ascending: false });
      const { data: emailLogsData } = await supabase.from('email_marketing_log').select('*').order('sent_at', { ascending: false }).limit(50);

      setLeads(leadsData || []);
      setPsychologists(psychologistsData || []);
      setPatients(patientsData || []);
      setPayments(paymentsData || []);
      setEmailLogs(emailLogsData || []);
      setLoading(false);
    }

    fetchData();
  }, []);

  // --- LÓGICA DE MÉTRICAS ---
  const activePsychologists = psychologists.filter(p => p.estado === 'ACTIVO').length;
  const interviewedPsychologists = psychologists.filter(p => p.estado === 'ENTREVISTADO').length;
  const expiredPsychologists = psychologists.filter(p => {
    if (!p.fecha_vencimiento) return false;
    return new Date(p.fecha_vencimiento) < new Date();
  }).length;
  
  const expiringPsychologists = psychologists.filter(p => {
    if (!p.fecha_vencimiento || p.estado !== 'ACTIVO') return false;
    const vencimiento = new Date(p.fecha_vencimiento);
    const hoy = new Date();
    const en7Dias = new Date();
    en7Dias.setDate(en7Dias.getDate() + 7);
    return vencimiento > hoy && vencimiento <= en7Dias;
  });

  const getDaysRemaining = (fechaVencimiento: string | null): number | null => {
    if (!fechaVencimiento) return null;
    const vencimiento = new Date(fechaVencimiento);
    const hoy = new Date();
    const diffTime = vencimiento.getTime() - hoy.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const totalLeads = leads.length + patients.length;
  const leadsThisWeek = [...leads, ...patients].filter(l => {
    const createdAt = new Date(l.created_at);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return createdAt > weekAgo;
  }).length;
  
  const approvedPayments = payments.filter(p => p.status === 'approved' || p.status === 'completed');
  const totalRevenue = approvedPayments.reduce((sum, p) => sum + Number(p.amount), 0);

  // Ventas por mes logic
  const salesByMonth = approvedPayments.reduce((acc, payment) => {
    const date = new Date(payment.created_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthName = date.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
    if (!acc[monthKey]) acc[monthKey] = { month: monthName, total: 0, count: 0 };
    acc[monthKey].total += Number(payment.amount);
    acc[monthKey].count += 1;
    return acc;
  }, {} as Record<string, { month: string; total: number; count: number }>);

  const salesByMonthArray = Object.entries(salesByMonth)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 6)
    .map(([_, data]) => data);

  // Formatters
  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-';
  const formatDateTime = (d: string | null) => d ? new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';
  const formatCurrency = (amount: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(amount);

  // --- ESTILOS INLINE (Para asegurar el diseño) ---
  const containerStyle = { minHeight: '100vh', backgroundColor: '#F8F3ED', paddingBottom: '2rem' };
  const cardStyle = { backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', padding: '1.5rem', border: '1px solid #e5e7eb' };
  const headerStyle = { backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', marginBottom: '1rem' };
  const titleStyle = { fontSize: '1.5rem', fontWeight: 700, color: '#115e59', margin: 0 };
  const subTitleStyle = { fontSize: '1.125rem', fontWeight: 600, color: '#374151', marginBottom: '1rem' };
  const metricLabelStyle = { fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' };
  const metricValueStyle = { fontSize: '1.875rem', fontWeight: 700, color: '#111827', margin: 0 };
  const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '2rem' };
  const tableHeaderStyle = { padding: '0.75rem', textAlign: 'left' as const, fontSize: '0.875rem', fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #e5e7eb' };
  const tableCellStyle = { padding: '0.75rem', fontSize: '0.875rem', color: '#1f2937', borderBottom: '1px solid #f3f4f6' };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#F8F3ED' }}>Cargando...</div>;

  return (
    <div style={containerStyle}>
      {/* HEADER */}
      <div style={headerStyle}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={titleStyle}>Dashboard</h1>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>Panel de administración - The Safe Spot</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
             {/* Estado WhatsApp */}
            <div style={{ padding: '0.5rem 1rem', borderRadius: '9999px', backgroundColor: whatsappStatus === 'open' ? '#dcfce7' : '#f3f4f6', color: whatsappStatus === 'open' ? '#166534' : '#374151', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ height: '8px', width: '8px', borderRadius: '50%', backgroundColor: whatsappStatus === 'open' ? '#22c55e' : '#9ca3af' }}></span>
                WhatsApp: {whatsappStatus === 'open' ? 'Conectado' : whatsappStatus}
            </div>
            <a href="/admin/cargar" style={{ backgroundColor: '#5B8AD1', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', textDecoration: 'none', fontWeight: 500, fontSize: '0.875rem' }}>
              + Cargar Psicólogo
            </a>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', marginBottom: '2rem' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1rem', display: 'flex', overflowX: 'auto', gap: '2rem' }}>
          {[
            { id: 'overview', label: '📊 Resumen' },
            { id: 'psychologists', label: '🧑‍⚕️ Psicólogos' },
            { id: 'leads', label: '💬 Leads WA' },
            { id: 'patients', label: '📝 Leads Tally' },
            { id: 'payments', label: '💰 Ventas' },
            { id: 'emails', label: '📧 Emails' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '1rem 0',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontWeight: activeTab === tab.id ? 600 : 400,
                color: activeTab === tab.id ? '#4A6FA5' : '#6b7280',
                borderBottom: activeTab === tab.id ? '2px solid #4A6FA5' : '2px solid transparent'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENIDO */}
      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1rem' }}>
        
        {/* === OVERVIEW === */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Sección Psicólogos */}
            <section>
              <h3 style={subTitleStyle}>🧑‍⚕️ Métricas Psicólogos</h3>
              <div style={gridStyle}>
                <div style={cardStyle}>
                  <p style={metricLabelStyle}>Activos</p>
                  <p style={{ ...metricValueStyle, color: '#16a34a' }}>{activePsychologists}</p>
                </div>
                <div style={cardStyle}>
                  <p style={metricLabelStyle}>Entrevistados</p>
                  <p style={{ ...metricValueStyle, color: '#ca8a04' }}>{interviewedPsychologists}</p>
                </div>
                <div style={cardStyle}>
                   <p style={metricLabelStyle}>Por Vencer (7 días)</p>
                   <p style={{ ...metricValueStyle, color: '#ea580c' }}>{expiringPsychologists.length}</p>
                </div>
              </div>
            </section>

             {/* Sección Leads */}
             <section>
              <h3 style={subTitleStyle}>👥 Pacientes Potenciales</h3>
              <div style={gridStyle}>
                <div style={cardStyle}>
                  <p style={metricLabelStyle}>Total Leads</p>
                  <p style={metricValueStyle}>{totalLeads}</p>
                  <p style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '0.25rem' }}>+{leadsThisWeek} esta semana</p>
                </div>
                <div style={cardStyle}>
                  <p style={metricLabelStyle}>WhatsApp</p>
                  <p style={{ ...metricValueStyle, color: '#25D366' }}>{leads.filter(l => l.source === 'whatsapp').length}</p>
                </div>
                <div style={cardStyle}>
                  <p style={metricLabelStyle}>Tally Form</p>
                  <p style={{ ...metricValueStyle, color: '#9333ea' }}>{patients.length}</p>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* === TABLAS GENÉRICAS === */}
        {activeTab !== 'overview' && (
          <div style={cardStyle}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                <thead>
                  <tr>
                    {/* Headers dinámicos según el tab */}
                    {activeTab === 'psychologists' && <><th style={tableHeaderStyle}>Nombre</th><th style={tableHeaderStyle}>Email</th><th style={tableHeaderStyle}>Estado</th><th style={tableHeaderStyle}>Vencimiento</th></>}
                    {activeTab === 'leads' && <><th style={tableHeaderStyle}>Nombre</th><th style={tableHeaderStyle}>Teléfono</th><th style={tableHeaderStyle}>Fecha</th><th style={tableHeaderStyle}>Acción</th></>}
                    {activeTab === 'patients' && <><th style={tableHeaderStyle}>Nombre</th><th style={tableHeaderStyle}>Email</th><th style={tableHeaderStyle}>Fecha</th><th style={tableHeaderStyle}>Acción</th></>}
                    {activeTab === 'payments' && <><th style={tableHeaderStyle}>Monto</th><th style={tableHeaderStyle}>Estado</th><th style={tableHeaderStyle}>Fecha</th></>}
                    {activeTab === 'emails' && <><th style={tableHeaderStyle}>Destinatario</th><th style={tableHeaderStyle}>Asunto</th><th style={tableHeaderStyle}>Estado</th></>}
                  </tr>
                </thead>
                <tbody>
                  
                  {activeTab === 'psychologists' && psychologists.map(p => {
                      const days = getDaysRemaining(p.fecha_vencimiento);
                      return (
                        <tr key={p.id}>
                            <td style={{...tableCellStyle, fontWeight: 500}}>{p.nombre_completo}</td>
                            <td style={tableCellStyle}>{p.email}</td>
                            <td style={tableCellStyle}>
                                <span style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: p.estado === 'ACTIVO' ? '#dcfce7' : '#fef3c7', color: p.estado === 'ACTIVO' ? '#166534' : '#854d0e' }}>
                                    {p.estado}
                                </span>
                            </td>
                            <td style={tableCellStyle}>
                                {days !== null ? (
                                    <span style={{ color: days <= 7 ? '#ea580c' : '#374151', fontWeight: days <= 7 ? 600 : 400 }}>
                                        {days} días ({formatDate(p.fecha_vencimiento)})
                                    </span>
                                ) : '-'}
                            </td>
                        </tr>
                      );
                  })}

                  {activeTab === 'leads' && leads.map(l => (
                    <tr key={l.id}>
                      <td style={{...tableCellStyle, fontWeight: 500}}>{l.name || 'Sin nombre'}</td>
                      <td style={tableCellStyle}>{l.phone}</td>
                      <td style={tableCellStyle}>{formatDateTime(l.created_at)}</td>
                      <td style={tableCellStyle}>
                         {l.phone && <a href={`https://wa.me/${l.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" style={{color:'#25D366', textDecoration:'none', fontWeight:600}}>💬 Abrir WA</a>}
                      </td>
                    </tr>
                  ))}

                  {activeTab === 'patients' && patients.map(p => (
                    <tr key={p.id}>
                      <td style={{...tableCellStyle, fontWeight: 500}}>{p.name}</td>
                      <td style={tableCellStyle}>{p.email}</td>
                      <td style={tableCellStyle}>{formatDateTime(p.created_at)}</td>
                      <td style={tableCellStyle}>
                        <a href={`mailto:${p.email}`} style={{color:'#4A6FA5', textDecoration:'none', fontWeight:600}}>✉️ Email</a>
                      </td>
                    </tr>
                  ))}

                   {activeTab === 'payments' && payments.map(p => (
                    <tr key={p.id}>
                      <td style={{...tableCellStyle, fontWeight: 600}}>{formatCurrency(p.amount)}</td>
                      <td style={tableCellStyle}>
                         <span style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: p.status === 'approved' ? '#dcfce7' : '#fee2e2', color: p.status === 'approved' ? '#166534' : '#991b1b' }}>
                            {p.status}
                         </span>
                      </td>
                      <td style={tableCellStyle}>{formatDateTime(p.created_at)}</td>
                    </tr>
                  ))}

                   {activeTab === 'emails' && emailLogs.map(e => (
                    <tr key={e.id}>
                      <td style={tableCellStyle}>{e.patient_email}</td>
                      <td style={tableCellStyle}>{e.email_subject}</td>
                      <td style={tableCellStyle}>
                         <span style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: e.status === 'sent' ? '#dcfce7' : '#fee2e2', color: e.status === 'sent' ? '#166534' : '#991b1b' }}>
                            {e.status}
                         </span>
                      </td>
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