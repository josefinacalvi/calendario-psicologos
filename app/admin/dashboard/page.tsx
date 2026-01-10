'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// --- CONFIGURACIÓN SUPABASE ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// --- TIPOS ---
type TabType = 'overview' | 'psychologists' | 'leads' | 'patients' | 'payments' | 'emails';

interface Lead { id: number; name: string; email: string | null; phone: string | null; source: string; created_at: string; }
interface Psychologist { id: string; nombre_completo: string; email: string; estado: string; modalidad: string; fecha_pago: string | null; fecha_vencimiento: string | null; created_at: string; }
interface Patient { id: number; name: string; email: string; phone: string | null; created_at: string; }
interface Payment { id: number; amount: number; status: string; created_at: string; psicologo_id: string; payment_provider: string; }
interface EmailLog { id: number; patient_email: string; email_subject: string; email_tema: string; sent_at: string; status: string; }

export default function DashboardPage() {
  // Estados
  const [leads, setLeads] = useState<Lead[]>([]);
  const [psychologists, setPsychologists] = useState<Psychologist[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [whatsappStatus, setWhatsappStatus] = useState<'checking' | 'open' | 'close' | 'connecting' | 'error'>('checking');

  // Carga de datos
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const waRes = await fetch('/api/whatsapp-status').catch(() => null);
        if (waRes?.ok) { const waData = await waRes.json(); setWhatsappStatus(waData.state || 'error'); } else { setWhatsappStatus('error'); }
      } catch { setWhatsappStatus('error'); }

      const { data: leadsData } = await supabase.from('patient_leads').select('*').order('created_at', { ascending: false });
      const { data: psychologistsData } = await supabase.from('perfiles_psicologos').select('*').order('created_at', { ascending: false });
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

  // Lógica métricas
  const activePsychologists = psychologists.filter(p => p.estado === 'ACTIVO').length;
  const interviewedPsychologists = psychologists.filter(p => p.estado === 'ENTREVISTADO').length;
  const expiringPsychologists = psychologists.filter(p => {
    if (!p.fecha_vencimiento || p.estado !== 'ACTIVO') return false;
    const v = new Date(p.fecha_vencimiento);
    const h = new Date();
    const d7 = new Date(); d7.setDate(d7.getDate() + 7);
    return v > h && v <= d7;
  });

  const getDays = (date: string | null) => {
    if (!date) return null;
    return Math.ceil((new Date(date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  };

  const totalLeads = leads.length + patients.length;
  const approvedPayments = payments.filter(p => p.status === 'approved' || p.status === 'completed');
  const totalRevenue = approvedPayments.reduce((sum, p) => sum + Number(p.amount), 0);
  const formatCurrency = (amount: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(amount);
  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-';

  // --- ESTILOS EN LÍNEA (Igual que el formulario "Foto 2") ---
  const pageStyle = { minHeight: '100vh', backgroundColor: '#F8F3ED', padding: '2rem', fontFamily: 'sans-serif' };
  const cardContainerStyle = { backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', padding: '2rem', maxWidth: '1200px', margin: '0 auto' };
  const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid #f3f4f6', paddingBottom: '1rem' };
  const titleStyle = { fontSize: '2rem', fontWeight: 800, color: '#115e59', margin: 0 };
  const subTitleStyle = { color: '#6b7280', margin: 0 };
  
  const buttonStyle = {
    backgroundColor: '#5B8AD1', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '9999px',
    textDecoration: 'none', fontWeight: 600, border: 'none', cursor: 'pointer', fontSize: '0.9rem'
  };

  const tabContainerStyle = { display: 'flex', gap: '1rem', overflowX: 'auto' as const, marginBottom: '2rem', paddingBottom: '0.5rem' };
  const tabStyle = (isActive: boolean) => ({
    padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600,
    backgroundColor: isActive ? '#115e59' : '#f3f4f6', color: isActive ? 'white' : '#4b5563', transition: 'all 0.2s'
  });

  const metricsGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' };
  const metricCardStyle = { padding: '1.5rem', borderRadius: '12px', border: '1px solid #e5e7eb', backgroundColor: '#fff', textAlign: 'center' as const };
  const metricNumberStyle = { fontSize: '2.5rem', fontWeight: 700, color: '#111827', margin: '0.5rem 0' };

  const tableStyle = { width: '100%', borderCollapse: 'collapse' as const, fontSize: '0.9rem' };
  const thStyle = { textAlign: 'left' as const, padding: '1rem', borderBottom: '2px solid #e5e7eb', color: '#6b7280' };
  const tdStyle = { padding: '1rem', borderBottom: '1px solid #f3f4f6', color: '#374151' };

  if (loading) return <div style={{...pageStyle, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>Cargando...</div>;

  return (
    <div style={pageStyle}>
      <div style={cardContainerStyle}>
        
        {/* Header */}
        <header style={headerStyle}>
          <div>
            <h1 style={titleStyle}>Dashboard Admin</h1>
            <p style={subTitleStyle}>The Safe Spot - Panel de Control</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: whatsappStatus === 'open' ? '#166534' : '#991b1b', backgroundColor: whatsappStatus === 'open' ? '#dcfce7' : '#fee2e2', padding: '0.25rem 0.75rem', borderRadius: '99px' }}>
              WA: {whatsappStatus === 'open' ? 'Online' : 'Offline'}
            </span>
            <a href="/admin/cargar" style={buttonStyle}>+ Cargar Psicólogo</a>
          </div>
        </header>

        {/* Tabs */}
        <div style={tabContainerStyle}>
          {[
            { id: 'overview', label: '📊 Resumen' },
            { id: 'psychologists', label: '🧑‍⚕️ Psicólogos' },
            { id: 'leads', label: '💬 Leads WA' },
            { id: 'patients', label: '📝 Leads Tally' },
            { id: 'payments', label: '💰 Ventas' },
            { id: 'emails', label: '📧 Emails' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} style={tabStyle(activeTab === tab.id)}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Contenido Dinámico */}
        <main>
          {activeTab === 'overview' && (
            <div style={{ animation: 'fadeIn 0.5s' }}>
              <div style={metricsGridStyle}>
                <div style={metricCardStyle}>
                  <span style={{ color: '#6b7280' }}>Total Leads</span>
                  <p style={metricNumberStyle}>{totalLeads}</p>
                  <span style={{ color: '#059669', fontSize: '0.85rem' }}>{leads.length} WA • {patients.length} Tally</span>
                </div>
                <div style={metricCardStyle}>
                  <span style={{ color: '#6b7280' }}>Psicólogos Activos</span>
                  <p style={{...metricNumberStyle, color: '#115e59'}}>{activePsychologists}</p>
                  <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>de {psychologists.length} totales</span>
                </div>
                <div style={metricCardStyle}>
                  <span style={{ color: '#6b7280' }}>Ingresos Totales</span>
                  <p style={metricNumberStyle}>{formatCurrency(totalRevenue)}</p>
                </div>
                <div style={metricCardStyle}>
                  <span style={{ color: '#6b7280' }}>Por Vencer (7 días)</span>
                  <p style={{...metricNumberStyle, color: expiringPsychologists.length > 0 ? '#ea580c' : '#111827'}}>
                    {expiringPsychologists.length}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab !== 'overview' && (
            <div style={{ overflowX: 'auto' }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    {activeTab === 'psychologists' && <><th style={thStyle}>Nombre</th><th style={thStyle}>Email</th><th style={thStyle}>Estado</th><th style={thStyle}>Vencimiento</th></>}
                    {activeTab === 'leads' && <><th style={thStyle}>Nombre</th><th style={thStyle}>Teléfono</th><th style={thStyle}>Fecha</th><th style={thStyle}>Acción</th></>}
                    {activeTab === 'patients' && <><th style={thStyle}>Nombre</th><th style={thStyle}>Email</th><th style={thStyle}>Fecha</th><th style={thStyle}>Acción</th></>}
                    {activeTab === 'payments' && <><th style={thStyle}>Monto</th><th style={thStyle}>Estado</th><th style={thStyle}>Fecha</th></>}
                    {activeTab === 'emails' && <><th style={thStyle}>Destinatario</th><th style={thStyle}>Asunto</th><th style={thStyle}>Estado</th></>}
                  </tr>
                </thead>
                <tbody>
                  {activeTab === 'psychologists' && psychologists.map(p => (
                    <tr key={p.id}>
                      <td style={{...tdStyle, fontWeight: 'bold'}}>{p.nombre_completo}</td>
                      <td style={tdStyle}>{p.email}</td>
                      <td style={tdStyle}>
                        <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', backgroundColor: p.estado === 'ACTIVO' ? '#dcfce7' : '#fee2e2', color: p.estado === 'ACTIVO' ? '#166534' : '#991b1b' }}>{p.estado}</span>
                      </td>
                      <td style={tdStyle}>
                        {getDays(p.fecha_vencimiento) !== null ? (
                          <span style={{ color: (getDays(p.fecha_vencimiento) || 99) <= 7 ? '#ea580c' : 'inherit', fontWeight: (getDays(p.fecha_vencimiento) || 99) <= 7 ? 'bold' : 'normal' }}>
                            {getDays(p.fecha_vencimiento)} días
                          </span>
                        ) : '-'}
                      </td>
                    </tr>
                  ))}
                  
                  {activeTab === 'leads' && leads.map(l => (
                    <tr key={l.id}>
                      <td style={{...tdStyle, fontWeight: 'bold'}}>{l.name || 'Desconocido'}</td>
                      <td style={tdStyle}>{l.phone}</td>
                      <td style={tdStyle}>{formatDate(l.created_at)}</td>
                      <td style={tdStyle}>
                         {l.phone && <a href={`https://wa.me/${l.phone.replace(/[^0-9]/g, '')}`} target="_blank" style={{color: '#25D366', textDecoration: 'none', fontWeight: 'bold'}}>💬 WA</a>}
                      </td>
                    </tr>
                  ))}

                  {activeTab === 'patients' && patients.map(p => (
                    <tr key={p.id}>
                      <td style={{...tdStyle, fontWeight: 'bold'}}>{p.name}</td>
                      <td style={tdStyle}>{p.email}</td>
                      <td style={tdStyle}>{formatDate(p.created_at)}</td>
                      <td style={tdStyle}><a href={`mailto:${p.email}`} style={{color: '#5B8AD1'}}>✉️ Email</a></td>
                    </tr>
                  ))}

                   {activeTab === 'payments' && payments.map(p => (
                    <tr key={p.id}>
                      <td style={{...tdStyle, fontWeight: 'bold'}}>{formatCurrency(p.amount)}</td>
                      <td style={tdStyle}>{p.status}</td>
                      <td style={tdStyle}>{formatDate(p.created_at)}</td>
                    </tr>
                  ))}

                   {activeTab === 'emails' && emailLogs.map(e => (
                    <tr key={e.id}>
                      <td style={tdStyle}>{e.patient_email}</td>
                      <td style={{...tdStyle, fontWeight: 'bold'}}>{e.email_subject}</td>
                      <td style={tdStyle}>{e.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}