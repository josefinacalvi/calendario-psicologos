'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Tipos
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
  // Estados
  const [leads, setLeads] = useState<Lead[]>([]);
  const [psychologists, setPsychologists] = useState<Psychologist[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'psychologists' | 'leads' | 'patients' | 'payments' | 'emails'>('overview');
  
  // Estado de WhatsApp
  const [whatsappStatus, setWhatsappStatus] = useState<'checking' | 'open' | 'close' | 'connecting' | 'error'>('checking');

  // Cargar datos
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      
      // Verificar estado de WhatsApp
      try {
        const whatsappRes = await fetch('/api/whatsapp-status');
        const whatsappData = await whatsappRes.json();
        setWhatsappStatus(whatsappData.state || 'error');
      } catch {
        setWhatsappStatus('error');
      }
      
      // Leads WhatsApp
      const { data: leadsData } = await supabase
        .from('patient_leads')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Psicólogos (tabla principal)
      const { data: psychologistsData } = await supabase
        .from('perfiles_psicologos')
        .select('id, nombre_completo, email, estado, modalidad, fecha_pago, fecha_vencimiento, created_at')
        .order('created_at', { ascending: false });
      
      // Pacientes (Tally)
      const { data: patientsData } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Pagos/Transacciones
      const { data: paymentsData } = await supabase
        .from('payment_transactions')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Email logs marketing
      const { data: emailLogsData } = await supabase
        .from('email_marketing_log')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(50);

      setLeads(leadsData || []);
      setPsychologists(psychologistsData || []);
      setPatients(patientsData || []);
      setPayments(paymentsData || []);
      setEmailLogs(emailLogsData || []);
      setLoading(false);
    }

    fetchData();
  }, []);

  // === MÉTRICAS PSICÓLOGOS ===
  const activePsychologists = psychologists.filter(p => p.estado === 'ACTIVO').length;
  const interviewedPsychologists = psychologists.filter(p => p.estado === 'ENTREVISTADO').length;
  const expiredPsychologists = psychologists.filter(p => {
    if (!p.fecha_vencimiento) return false;
    return new Date(p.fecha_vencimiento) < new Date();
  }).length;
  const totalPsychologists = psychologists.length;

  // Psicólogos por vencer (próximos 7 días)
  const expiringPsychologists = psychologists.filter(p => {
    if (!p.fecha_vencimiento || p.estado !== 'ACTIVO') return false;
    const vencimiento = new Date(p.fecha_vencimiento);
    const hoy = new Date();
    const en7Dias = new Date();
    en7Dias.setDate(en7Dias.getDate() + 7);
    return vencimiento > hoy && vencimiento <= en7Dias;
  });

  // Calcular días restantes
  const getDaysRemaining = (fechaVencimiento: string | null): number | null => {
    if (!fechaVencimiento) return null;
    const vencimiento = new Date(fechaVencimiento);
    const hoy = new Date();
    const diffTime = vencimiento.getTime() - hoy.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // === MÉTRICAS LEADS ===
  const totalLeads = leads.length + patients.length;
  const leadsThisWeek = [...leads, ...patients].filter(l => {
    const createdAt = new Date(l.created_at);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return createdAt > weekAgo;
  }).length;
  const whatsappLeads = leads.filter(l => l.source === 'whatsapp').length;
  const tallyLeads = patients.length;

  // === MÉTRICAS VENTAS ===
  const approvedPayments = payments.filter(p => p.status === 'approved' || p.status === 'completed');
  const totalRevenue = approvedPayments.reduce((sum, p) => sum + Number(p.amount), 0);
  
  // Ventas por mes
  const salesByMonth = approvedPayments.reduce((acc, payment) => {
    const date = new Date(payment.created_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthName = date.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
    
    if (!acc[monthKey]) {
      acc[monthKey] = { month: monthName, total: 0, count: 0 };
    }
    acc[monthKey].total += Number(payment.amount);
    acc[monthKey].count += 1;
    return acc;
  }, {} as Record<string, { month: string; total: number; count: number }>);

  const salesByMonthArray = Object.entries(salesByMonth)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 6)
    .map(([_, data]) => data);

  // Formato de fecha
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF6F1] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A6FA5] mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6F1]">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img 
                src="https://iomrlbzfablvjvcrrbfw.supabase.co/storage/v1/object/public/assets/tss-01%20(1).png" 
                alt="The Safe Spot" 
                className="h-10"
              />
              <div>
                <h1 className="text-2xl font-bold text-[#4A6FA5]">Dashboard</h1>
                <p className="text-sm text-gray-500">Panel de administración</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Indicador WhatsApp */}
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                whatsappStatus === 'open' ? 'bg-green-100' :
                whatsappStatus === 'connecting' ? 'bg-yellow-100' :
                whatsappStatus === 'checking' ? 'bg-gray-100' :
                'bg-red-100'
              }`}>
                <div className={`w-3 h-3 rounded-full ${
                  whatsappStatus === 'open' ? 'bg-green-500 animate-pulse' :
                  whatsappStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                  whatsappStatus === 'checking' ? 'bg-gray-400 animate-pulse' :
                  'bg-red-500'
                }`}></div>
                <span className={`text-sm font-medium ${
                  whatsappStatus === 'open' ? 'text-green-700' :
                  whatsappStatus === 'connecting' ? 'text-yellow-700' :
                  whatsappStatus === 'checking' ? 'text-gray-600' :
                  'text-red-700'
                }`}>
                  WhatsApp: {
                    whatsappStatus === 'open' ? '✅ Conectado' :
                    whatsappStatus === 'connecting' ? '🔄 Conectando...' :
                    whatsappStatus === 'checking' ? '⏳ Verificando...' :
                    '❌ Desconectado'
                  }
                </span>
              </div>
              <a 
                href="/admin/cargar" 
                className="bg-[#4A6FA5] text-white px-4 py-2 rounded-lg hover:bg-[#3d5d8a] transition"
              >
                + Cargar Psicólogo
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex space-x-8 overflow-x-auto">
            {[
              { id: 'overview', label: '📊 Resumen' },
              { id: 'psychologists', label: '🧑‍⚕️ Psicólogos' },
              { id: 'leads', label: '💬 Leads WhatsApp' },
              { id: 'patients', label: '📝 Leads Tally' },
              { id: 'payments', label: '💰 Ventas' },
              { id: 'emails', label: '📧 Emails' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-[#4A6FA5] text-[#4A6FA5]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {/* ============ OVERVIEW TAB ============ */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            
            {/* Métricas Psicólogos */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">🧑‍⚕️ Psicólogos</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                  <p className="text-sm text-gray-500">Activos</p>
                  <p className="text-3xl font-bold text-green-600">{activePsychologists}</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                  <p className="text-sm text-gray-500">Entrevistados</p>
                  <p className="text-3xl font-bold text-yellow-600">{interviewedPsychologists}</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                  <p className="text-sm text-gray-500">Vencidos</p>
                  <p className="text-3xl font-bold text-red-600">{expiredPsychologists}</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                  <p className="text-sm text-gray-500">Por vencer (7 días)</p>
                  <p className="text-3xl font-bold text-orange-500">{expiringPsychologists.length}</p>
                </div>
              </div>
            </div>

            {/* Métricas Leads */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">👥 Leads / Pacientes Potenciales</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                  <p className="text-sm text-gray-500">Total Leads</p>
                  <p className="text-3xl font-bold text-gray-900">{totalLeads}</p>
                  <p className="text-xs text-green-600 mt-1">+{leadsThisWeek} esta semana</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                  <p className="text-sm text-gray-500">WhatsApp</p>
                  <p className="text-3xl font-bold text-green-600">{whatsappLeads}</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                  <p className="text-sm text-gray-500">Formulario Tally</p>
                  <p className="text-3xl font-bold text-purple-600">{tallyLeads}</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                  <p className="text-sm text-gray-500">Emails Enviados</p>
                  <p className="text-3xl font-bold text-blue-600">{emailLogs.length}</p>
                </div>
              </div>
            </div>

            {/* Métricas Ventas */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">💰 Ventas</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                  <p className="text-sm text-gray-500">Ingresos Totales</p>
                  <p className="text-3xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                  <p className="text-sm text-gray-500">Pagos Aprobados</p>
                  <p className="text-3xl font-bold text-gray-900">{approvedPayments.length}</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                  <p className="text-sm text-gray-500">Ticket Promedio</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {approvedPayments.length > 0 ? formatCurrency(totalRevenue / approvedPayments.length) : '$0'}
                  </p>
                </div>
              </div>
            </div>

            {/* Ventas por Mes */}
            {salesByMonthArray.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">📈 Ventas por Mes</h3>
                <div className="space-y-3">
                  {salesByMonthArray.map((sale, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
                      <span className="text-gray-700 capitalize">{sale.month}</span>
                      <div className="text-right">
                        <span className="font-bold text-gray-900">{formatCurrency(sale.total)}</span>
                        <span className="text-sm text-gray-500 ml-2">({sale.count} pagos)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Por Vencer */}
            {expiringPsychologists.length > 0 && (
              <div className="bg-orange-50 rounded-xl shadow-sm p-6 border border-orange-200">
                <h3 className="text-lg font-semibold text-orange-800 mb-4">⚠️ Psicólogos por Vencer (próximos 7 días)</h3>
                <div className="space-y-2">
                  {expiringPsychologists.map((psych) => (
                    <div key={psych.id} className="flex items-center justify-between bg-white p-3 rounded-lg">
                      <div>
                        <p className="font-medium">{psych.nombre_completo}</p>
                        <p className="text-sm text-gray-500">{psych.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-orange-600 font-bold">
                          {getDaysRemaining(psych.fecha_vencimiento)} días
                        </p>
                        <p className="text-xs text-gray-500">Vence: {formatDate(psych.fecha_vencimiento)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

        {/* ============ PSYCHOLOGISTS TAB ============ */}
        {activeTab === 'psychologists' && (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Psicólogos</h3>
              <div className="flex gap-2">
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
                  {activePsychologists} activos
                </span>
                <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm">
                  {interviewedPsychologists} entrevistados
                </span>
                <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm">
                  {expiredPsychologists} vencidos
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 border-b">
                    <th className="pb-3">Nombre</th>
                    <th className="pb-3">Email</th>
                    <th className="pb-3">Estado</th>
                    <th className="pb-3">Fecha Pago</th>
                    <th className="pb-3">Vencimiento</th>
                    <th className="pb-3">Días Restantes</th>
                  </tr>
                </thead>
                <tbody>
                  {psychologists.map((psych) => {
                    const diasRestantes = getDaysRemaining(psych.fecha_vencimiento);
                    return (
                      <tr key={psych.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="py-3 font-medium">{psych.nombre_completo}</td>
                        <td className="py-3">
                          <a href={`mailto:${psych.email}`} className="text-[#4A6FA5] hover:underline">
                            {psych.email}
                          </a>
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            psych.estado === 'ACTIVO' 
                              ? 'bg-green-100 text-green-700' 
                              : psych.estado === 'ENTREVISTADO'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {psych.estado || 'SIN ESTADO'}
                          </span>
                        </td>
                        <td className="py-3 text-gray-500 text-sm">{formatDate(psych.fecha_pago)}</td>
                        <td className="py-3 text-gray-500 text-sm">{formatDate(psych.fecha_vencimiento)}</td>
                        <td className="py-3">
                          {diasRestantes !== null ? (
                            <span className={`font-bold ${
                              diasRestantes < 0 ? 'text-red-600' :
                              diasRestantes <= 7 ? 'text-orange-500' :
                              'text-green-600'
                            }`}>
                              {diasRestantes < 0 ? `Vencido hace ${Math.abs(diasRestantes)} días` : `${diasRestantes} días`}
                            </span>
                          ) : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============ LEADS WHATSAPP TAB ============ */}
        {activeTab === 'leads' && (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Leads de WhatsApp</h3>
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
                {leads.length} contactos
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 border-b">
                    <th className="pb-3">Nombre</th>
                    <th className="pb-3">Teléfono</th>
                    <th className="pb-3">Fuente</th>
                    <th className="pb-3">Fecha</th>
                    <th className="pb-3">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-500">
                        No hay leads de WhatsApp aún
                      </td>
                    </tr>
                  ) : (
                    leads.map((lead) => (
                      <tr key={lead.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="py-3 font-medium">{lead.name || 'Sin nombre'}</td>
                        <td className="py-3">{lead.phone || '-'}</td>
                        <td className="py-3">
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">
                            {lead.source}
                          </span>
                        </td>
                        <td className="py-3 text-gray-500 text-sm">{formatDateTime(lead.created_at)}</td>
                        <td className="py-3">
                          {lead.phone && (
                            <a 
                              href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                            >
                              💬 WhatsApp
                            </a>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============ PATIENTS/TALLY TAB ============ */}
        {activeTab === 'patients' && (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Leads de Formulario Tally</h3>
              <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm">
                {patients.length} contactos
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 border-b">
                    <th className="pb-3">Nombre</th>
                    <th className="pb-3">Email</th>
                    <th className="pb-3">Teléfono</th>
                    <th className="pb-3">Fecha</th>
                    <th className="pb-3">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-500">
                        No hay leads de Tally aún
                      </td>
                    </tr>
                  ) : (
                    patients.map((patient) => (
                      <tr key={patient.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="py-3 font-medium">{patient.name}</td>
                        <td className="py-3">
                          <a href={`mailto:${patient.email}`} className="text-[#4A6FA5] hover:underline">
                            {patient.email}
                          </a>
                        </td>
                        <td className="py-3">{patient.phone || '-'}</td>
                        <td className="py-3 text-gray-500 text-sm">{formatDateTime(patient.created_at)}</td>
                        <td className="py-3 flex gap-2">
                          {patient.phone && (
                            <a 
                              href={`https://wa.me/${patient.phone.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                            >
                              💬
                            </a>
                          )}
                          <a 
                            href={`mailto:${patient.email}`}
                            className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                          >
                            ✉️
                          </a>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============ PAYMENTS TAB ============ */}
        {activeTab === 'payments' && (
          <div className="space-y-6">
            {/* Resumen Ventas por Mes */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Balance por Mes</h3>
              {salesByMonthArray.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No hay ventas registradas</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {salesByMonthArray.map((sale, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-500 capitalize">{sale.month}</p>
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(sale.total)}</p>
                      <p className="text-sm text-gray-500">{sale.count} pagos</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Lista de Pagos */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Historial de Pagos</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-gray-500 border-b">
                      <th className="pb-3">ID</th>
                      <th className="pb-3">Monto</th>
                      <th className="pb-3">Estado</th>
                      <th className="pb-3">Proveedor</th>
                      <th className="pb-3">Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-gray-500">
                          No hay pagos registrados
                        </td>
                      </tr>
                    ) : (
                      payments.slice(0, 20).map((payment) => (
                        <tr key={payment.id} className="border-b last:border-0 hover:bg-gray-50">
                          <td className="py-3 font-mono text-sm">{payment.id}</td>
                          <td className="py-3 font-bold">{formatCurrency(Number(payment.amount))}</td>
                          <td className="py-3">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              payment.status === 'approved' || payment.status === 'completed'
                                ? 'bg-green-100 text-green-700'
                                : payment.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {payment.status}
                            </span>
                          </td>
                          <td className="py-3 text-gray-600">{payment.payment_provider || 'MercadoPago'}</td>
                          <td className="py-3 text-gray-500 text-sm">{formatDateTime(payment.created_at)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============ EMAILS TAB ============ */}
        {activeTab === 'emails' && (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Emails Marketing Enviados</h3>
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                {emailLogs.length} emails
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 border-b">
                    <th className="pb-3">Destinatario</th>
                    <th className="pb-3">Asunto</th>
                    <th className="pb-3">Tema</th>
                    <th className="pb-3">Estado</th>
                    <th className="pb-3">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {emailLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-500">
                        No hay emails enviados aún
                      </td>
                    </tr>
                  ) : (
                    emailLogs.map((log) => (
                      <tr key={log.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="py-3">{log.patient_email}</td>
                        <td className="py-3 font-medium">{log.email_subject}</td>
                        <td className="py-3 text-gray-600">{log.email_tema}</td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            log.status === 'sent' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {log.status === 'sent' ? 'Enviado' : log.status}
                          </span>
                        </td>
                        <td className="py-3 text-gray-500 text-sm">{formatDateTime(log.sent_at)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-auto py-4">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
          The Safe Spot © 2025 - Dashboard de Administración
        </div>
      </footer>
    </div>
  );
}