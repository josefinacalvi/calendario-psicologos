'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
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
  const [leads, setLeads] = useState<Lead[]>([]);
  const [psychologists, setPsychologists] = useState<Psychologist[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [whatsappStatus, setWhatsappStatus] = useState<'checking' | 'open' | 'close' | 'connecting' | 'error'>('checking');

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

  // Métricas
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

  if (loading) return <div className="min-h-screen bg-[#F8F3ED] flex items-center justify-center text-[#5B8AD1] font-bold animate-pulse">Cargando Dashboard...</div>;

  return (
    <div className="min-h-screen bg-[#F8F3ED] text-gray-800 font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-20 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#115e59]">Dashboard Admin</h1>
            <p className="text-sm text-gray-500">The Safe Spot</p>
          </div>
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2 ${whatsappStatus === 'open' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              <div className={`w-2 h-2 rounded-full ${whatsappStatus === 'open' ? 'bg-green-500' : 'bg-red-500'}`}></div>
              WA: {whatsappStatus === 'open' ? 'Online' : 'Offline'}
            </div>
            <a href="/admin/cargar" className="bg-[#5B8AD1] hover:bg-[#4a7ac0] text-white px-4 py-2 rounded-lg shadow transition text-sm font-medium">
              + Cargar Psicólogo
            </a>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 overflow-x-auto">
          <nav className="flex space-x-6">
            {[
              { id: 'overview', icon: '📊', label: 'Resumen' },
              { id: 'psychologists', icon: '🧑‍⚕️', label: 'Psicólogos' },
              { id: 'leads', icon: '💬', label: 'Leads WA' },
              { id: 'patients', icon: '📝', label: 'Leads Tally' },
              { id: 'payments', icon: '💰', label: 'Ventas' },
              { id: 'emails', icon: '📧', label: 'Emails' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition flex items-center gap-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-[#5B8AD1] text-[#5B8AD1]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span>{tab.icon}</span> {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Contenido */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* Tarjetas Principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <p className="text-gray-500 text-sm font-medium">Total Leads</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{totalLeads}</p>
                <div className="mt-2 text-xs text-green-600 font-medium bg-green-50 inline-block px-2 py-1 rounded">
                  {leads.filter(l => l.source === 'whatsapp').length} WA • {patients.length} Tally
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <p className="text-gray-500 text-sm font-medium">Psicólogos Activos</p>
                <p className="text-3xl font-bold text-[#115e59] mt-2">{activePsychologists}</p>
                <p className="text-xs text-gray-400 mt-1">de {psychologists.length} registrados</p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <p className="text-gray-500 text-sm font-medium">Ingresos Totales</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{formatCurrency(totalRevenue)}</p>
                <p className="text-xs text-gray-400 mt-1">{approvedPayments.length} transacciones</p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="absolute right-0 top-0 p-4 opacity-10 text-6xl">⚠️</div>
                <p className="text-gray-500 text-sm font-medium">Por Vencer (7 días)</p>
                <p className={`text-3xl font-bold mt-2 ${expiringPsychologists.length > 0 ? 'text-orange-500' : 'text-gray-900'}`}>
                  {expiringPsychologists.length}
                </p>
                <p className="text-xs text-gray-400 mt-1">Atención requerida</p>
              </div>
            </div>

            {/* Listado Rápido Vencimientos */}
            {expiringPsychologists.length > 0 && (
              <div className="bg-orange-50 border border-orange-100 rounded-xl p-6">
                <h3 className="text-orange-800 font-semibold mb-4">⚠️ Próximos Vencimientos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {expiringPsychologists.map(p => (
                    <div key={p.id} className="bg-white p-4 rounded-lg shadow-sm flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900">{p.nombre_completo}</p>
                        <p className="text-xs text-gray-500">Vence: {formatDate(p.fecha_vencimiento)}</p>
                      </div>
                      <span className="text-orange-600 font-bold text-sm">{getDays(p.fecha_vencimiento)} días</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TABLA GENÉRICA (Se adapta según el tab) */}
        {activeTab !== 'overview' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in duration-300">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
                  <tr>
                    {activeTab === 'psychologists' && <><th className="p-4 font-medium">Nombre</th><th className="p-4 font-medium">Email</th><th className="p-4 font-medium">Estado</th><th className="p-4 font-medium">Vencimiento</th></>}
                    {activeTab === 'leads' && <><th className="p-4 font-medium">Nombre</th><th className="p-4 font-medium">Teléfono</th><th className="p-4 font-medium">Fecha</th><th className="p-4 font-medium">Acción</th></>}
                    {activeTab === 'patients' && <><th className="p-4 font-medium">Nombre</th><th className="p-4 font-medium">Email</th><th className="p-4 font-medium">Fecha</th><th className="p-4 font-medium">Acción</th></>}
                    {activeTab === 'payments' && <><th className="p-4 font-medium">Monto</th><th className="p-4 font-medium">Estado</th><th className="p-4 font-medium">Fecha</th></>}
                    {activeTab === 'emails' && <><th className="p-4 font-medium">Destinatario</th><th className="p-4 font-medium">Asunto</th><th className="p-4 font-medium">Estado</th></>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {activeTab === 'psychologists' && psychologists.map(p => {
                    const days = getDays(p.fecha_vencimiento);
                    return (
                      <tr key={p.id} className="hover:bg-gray-50 transition">
                        <td className="p-4 font-medium text-gray-900">{p.nombre_completo}</td>
                        <td className="p-4 text-gray-500">{p.email}</td>
                        <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-semibold ${p.estado === 'ACTIVO' ? 'bg-green-100 text-green-700' : p.estado === 'ENTREVISTADO' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{p.estado}</span></td>
                        <td className="p-4"><span className={`${days !== null && days <= 7 ? 'text-orange-600 font-bold' : 'text-gray-500'}`}>{days !== null ? `${days} días` : '-'}</span></td>
                      </tr>
                    );
                  })}
                  
                  {activeTab === 'leads' && leads.map(l => (
                    <tr key={l.id} className="hover:bg-gray-50 transition">
                      <td className="p-4 font-medium">{l.name || 'Desconocido'}</td>
                      <td className="p-4 text-gray-500">{l.phone}</td>
                      <td className="p-4 text-gray-400">{formatDate(l.created_at)}</td>
                      <td className="p-4">
                        {l.phone && <a href={`https://wa.me/${l.phone.replace(/[^0-9]/g, '')}`} target="_blank" className="text-green-600 hover:underline font-medium">💬 WhatsApp</a>}
                      </td>
                    </tr>
                  ))}

                  {activeTab === 'patients' && patients.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50 transition">
                      <td className="p-4 font-medium">{p.name}</td>
                      <td className="p-4 text-gray-500">{p.email}</td>
                      <td className="p-4 text-gray-400">{formatDate(p.created_at)}</td>
                      <td className="p-4"><a href={`mailto:${p.email}`} className="text-[#5B8AD1] hover:underline">✉️ Email</a></td>
                    </tr>
                  ))}

                  {activeTab === 'payments' && payments.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50 transition">
                      <td className="p-4 font-bold text-gray-900">{formatCurrency(p.amount)}</td>
                      <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-semibold ${p.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{p.status}</span></td>
                      <td className="p-4 text-gray-400">{formatDate(p.created_at)}</td>
                    </tr>
                  ))}

                  {activeTab === 'emails' && emailLogs.map(e => (
                    <tr key={e.id} className="hover:bg-gray-50 transition">
                      <td className="p-4 text-gray-600">{e.patient_email}</td>
                      <td className="p-4 font-medium text-gray-900">{e.email_subject}</td>
                      <td className="p-4"><span className={`px-2 py-1 rounded text-xs ${e.status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{e.status}</span></td>
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