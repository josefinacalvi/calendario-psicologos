'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Users, CheckCircle, XCircle, RefreshCw, Link, Clock, Activity } from 'lucide-react';

const DashboardControl = () => {
  const [psychologists, setPsychologists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPsychologist, setSelectedPsychologist] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    connected: 0,
    appointments_today: 0,
    appointments_week: 0
  });

  useEffect(() => {
    // Datos de ejemplo - después los reemplazas con llamadas a Supabase
    const mockData = [
      { id: 1, name: 'Dra. María García', email: 'maria@ejemplo.com', connected: true, last_sync: '2024-01-15 10:30', appointments_today: 4 },
      { id: 2, name: 'Dr. Juan Pérez', email: 'juan@ejemplo.com', connected: false, last_sync: null, appointments_today: 0 },
      { id: 3, name: 'Lic. Ana López', email: 'ana@ejemplo.com', connected: true, last_sync: '2024-01-15 09:45', appointments_today: 6 },
      { id: 4, name: 'Dr. Carlos Ruiz', email: 'carlos@ejemplo.com', connected: true, last_sync: '2024-01-15 11:00', appointments_today: 3 },
      { id: 5, name: 'Dra. Laura Martín', email: 'laura@ejemplo.com', connected: false, last_sync: null, appointments_today: 0 },
    ];
    
    setTimeout(() => {
      setPsychologists(mockData);
      setStats({
        total: mockData.length,
        connected: mockData.filter(p => p.connected).length,
        appointments_today: mockData.reduce((sum, p) => sum + p.appointments_today, 0),
        appointments_week: 47
      });
      setLoading(false);
    }, 1000);
  }, []);

  const handleConnectCalendar = (psychologistId) => {
    window.location.href = `/api/auth/google?psychologist_id=${psychologistId}`;
  };

const handleConnectCalendar = (psychologistId) => {
    // Redirigir a la URL de OAuth
    window.location.href = `/api/auth/google?psychologist_id=${psychologistId}`;
  };

  const handleSyncCalendar = async (psychologistId) => {
    // Aquí llamarías a tu endpoint de sincronización
    alert(`Sincronizando calendario del psicólogo ${psychologistId}`);
  };

  const handleDisconnectCalendar = async (psychologistId) => {
    if (confirm('¿Seguro que deseas desconectar este calendario?')) {
      // Aquí llamarías a tu endpoint para desconectar
      alert(`Calendario desconectado para psicólogo ${psychologistId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard de Control</h1>
          <p className="text-gray-600">Gestión de calendarios y sincronización con Google Calendar</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Psicólogos</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Users className="w-10 h-10 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Calendarios Conectados</p>
                <p className="text-2xl font-bold text-green-600">{stats.connected}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Citas Hoy</p>
                <p className="text-2xl font-bold text-purple-600">{stats.appointments_today}</p>
              </div>
              <Clock className="w-10 h-10 text-purple-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Citas Esta Semana</p>
                <p className="text-2xl font-bold text-indigo-600">{stats.appointments_week}</p>
              </div>
              <Activity className="w-10 h-10 text-indigo-500" />
            </div>
          </div>
        </div>

        {/* Psychologists Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Lista de Psicólogos</h2>
          </div>
          
          {loading ? (
            <div className="p-12 text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Cargando psicólogos...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Psicólogo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Última Sincronización
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Citas Hoy
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {psychologists.map((psychologist) => (
                    <tr key={psychologist.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{psychologist.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{psychologist.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {psychologist.connected ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Conectado
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <XCircle className="w-3 h-3 mr-1" />
                            Desconectado
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {psychologist.last_sync || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">{psychologist.appointments_today}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {psychologist.connected ? (
                            <>
                              <button
                                onClick={() => handleSyncCalendar(psychologist.id)}
                                className="text-blue-600 hover:text-blue-900 flex items-center"
                                title="Sincronizar ahora"
                              >
                                <RefreshCw className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDisconnectCalendar(psychologist.id)}
                                className="text-red-600 hover:text-red-900 flex items-center"
                                title="Desconectar calendario"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleConnectCalendar(psychologist.id)}
                              className="text-green-600 hover:text-green-900 flex items-center"
                              title="Conectar calendario"
                            >
                              <Link className="w-4 h-4 mr-1" />
                              Conectar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">¿Cómo funciona?</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start">
              <span className="font-semibold mr-2">1.</span>
              <span>Cada psicólogo conecta su Google Calendar haciendo click en "Conectar"</span>
            </li>
            <li className="flex items-start">
              <span className="font-semibold mr-2">2.</span>
              <span>El sistema sincroniza automáticamente los eventos cada 15 minutos</span>
            </li>
            <li className="flex items-start">
              <span className="font-semibold mr-2">3.</span>
              <span>Los pacientes solo ven los horarios realmente disponibles</span>
            </li>
            <li className="flex items-start">
              <span className="font-semibold mr-2">4.</span>
              <span>Las citas se crean automáticamente en el Google Calendar del psicólogo</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DashboardControl;