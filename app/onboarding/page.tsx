'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface ExtractedData {
  nombre_completo: string;
  email: string;
  telefono: string;
  años_experiencia: number;
  especialidades: string[];
  modalidad: 'online' | 'presencial' | 'hybrid';
  sobre_mi: string;
  formacion: string[];
}

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [psychologistId, setPsychologistId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileSelect = (file: File) => {
    if (file.type !== 'application/pdf') {
      alert('Por favor, seleccione un archivo PDF');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('El archivo no debe superar los 10MB');
      return;
    }
    setSelectedFile(file);
    // Automáticamente procesar el archivo cuando se selecciona
    handleUploadCV(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) handleFileSelect(files[0]);
  };

  const handleUploadCV = async (file?: File) => {
    const fileToUpload = file || selectedFile;
    if (!fileToUpload) return;
    
    setIsLoading(true);
    const formData = new FormData();
    formData.append('cv', fileToUpload);
    formData.append('filename', fileToUpload.name);
    
    try {
      const response = await fetch('https://primary-production-439de.up.railway.app/webhook/upload-cv', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setExtractedData(data);
        setCurrentStep(2);
      } else {
        throw new Error('Error al procesar el CV');
      }
    } catch {
      alert('Error al procesar el CV. Por favor, intente nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveData = async (formData: ExtractedData) => {
    setEmailError('');
    
    try {
      const checkResponse = await fetch(`/api/check-email?email=${encodeURIComponent(formData.email)}`);
      const checkData = await checkResponse.json();
      
      if (checkData.exists) {
        setEmailError('Este email ya está registrado en el sistema.');
        return false;
      }
    } catch {
      console.error('Error checking email');
    }
    
    setExtractedData(formData);
    setCurrentStep(3);
    
    setIsLoading(true);
    try {
      const dataToSave = {
        name: formData.nombre_completo,
        email: formData.email,
        phone: formData.telefono,
        specialties: formData.especialidades,
        years_experience: formData.años_experiencia,
        modality: formData.modalidad,
        bio: formData.sobre_mi,
        formacion: formData.formacion,
        session_duration: 30,
        buffer_time: 15,
        hourly_rate: 100,
        currency: 'USD',
        is_active: true
      };
      
      const response = await fetch('/api/psychologists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave)
      });
      
      const result = await response.json();
      
      if (response.ok && result.id) {
        setPsychologistId(result.id);
      } else {
        throw new Error('Error al guardar los datos');
      }
    } catch {
      alert('Error al guardar los datos. Por favor, intente nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectCalendar = () => {
    if (psychologistId) {
      window.location.href = `/api/auth/google?psychologist_id=${psychologistId}&redirect=/onboarding/success`;
    }
  };

  const handleSkipCalendar = () => {
    router.push('/onboarding/success');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        {/* Header simplificado */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
            Bienvenido al Sistema de Psicólogos
          </h1>
          <p className="text-gray-600 text-lg">
            {currentStep === 1 && "Suba su CV para comenzar el registro"}
            {currentStep === 2 && "Revise y confirme su información"}
            {currentStep === 3 && "Configure su calendario"}
          </p>
        </div>

        {/* Progress bar sutil */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${(currentStep / 3) * 100}%` }}
          />
        </div>

        {/* Contenido principal */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Step 1: Upload CV - Simplificado */}
          {currentStep === 1 && (
            <div className="text-center">
              <div className="mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-4">
                  <svg className="w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                  Suba su CV en formato PDF
                </h2>
                <p className="text-gray-600">
                  Extraeremos automáticamente su información profesional
                </p>
              </div>

              {/* Botón principal de upload */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="relative"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                />
                
                {!selectedFile && !isLoading && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full max-w-md mx-auto block bg-gradient-to-r from-blue-600 to-purple-600 text-white py-6 px-8 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
                  >
                    <div className="flex items-center justify-center gap-3">
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span>Seleccionar CV</span>
                    </div>
                  </button>
                )}

                {isLoading && (
                  <div className="flex flex-col items-center py-8">
                    <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mb-4"></div>
                    <p className="text-gray-600 font-medium">Procesando su CV...</p>
                  </div>
                )}

                {selectedFile && !isLoading && (
                  <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
                    <div className="flex items-center justify-center gap-3">
                      <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <div>
                        <p className="text-green-800 font-semibold">{selectedFile.name}</p>
                        <p className="text-green-600 text-sm">Procesando archivo...</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <p className="text-sm text-gray-500 mt-6">
                También puede arrastrar y soltar su archivo aquí
              </p>
            </div>
          )}

          {/* Step 2: Review Information - Más limpio */}
          {currentStep === 2 && (
            <Step2Review
              extractedData={extractedData}
              emailError={emailError}
              onBack={() => {
                setCurrentStep(1);
                setSelectedFile(null);
              }}
              onSubmit={handleSaveData}
            />
          )}

          {/* Step 3: Connect Calendar - Más visual */}
          {currentStep === 3 && (
            <Step3Calendar
              isLoading={isLoading}
              onConnectCalendar={handleConnectCalendar}
              onSkipCalendar={handleSkipCalendar}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Step 2 Component mejorado
function Step2Review({ extractedData, emailError, onBack, onSubmit }: any) {
  const [formData, setFormData] = useState<ExtractedData>({
    nombre_completo: extractedData?.nombre_completo || '',
    email: extractedData?.email || '',
    telefono: extractedData?.telefono || '',
    años_experiencia: extractedData?.años_experiencia || 0,
    especialidades: extractedData?.especialidades || [],
    modalidad: extractedData?.modalidad || 'hybrid',
    sobre_mi: extractedData?.sobre_mi || '',
    formacion: extractedData?.formacion || []
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div>
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-3">
          <svg className="w-8 h-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Confirme su Información</h2>
        <p className="text-gray-600">Revise y edite si es necesario</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nombre Completo *</label>
            <input
              type="text"
              value={formData.nombre_completo}
              onChange={(e) => setFormData({...formData, nombre_completo: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono</label>
            <input
              type="tel"
              value={formData.telefono}
              onChange={(e) => setFormData({...formData, telefono: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Años de Experiencia</label>
            <input
              type="number"
              value={formData.años_experiencia}
              onChange={(e) => setFormData({...formData, años_experiencia: parseInt(e.target.value) || 0})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              min="0"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Especialidades</label>
          <input
            type="text"
            value={Array.isArray(formData.especialidades) ? formData.especialidades.join(', ') : ''}
            onChange={(e) => setFormData({...formData, especialidades: e.target.value.split(',').map(s => s.trim()).filter(s => s)})}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            placeholder="Ej: Psicología Clínica, Terapia Cognitiva"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Modalidad de Atención</label>
          <select
            value={formData.modalidad}
            onChange={(e) => setFormData({...formData, modalidad: e.target.value as any})}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          >
            <option value="online">Online</option>
            <option value="presencial">Presencial</option>
            <option value="hybrid">Ambas (Híbrido)</option>
          </select>
        </div>

        {/* Configuración estándar - más visual */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-5 rounded-xl">
          <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            Configuración Estándar
          </h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <p className="text-gray-500">Duración sesión</p>
              <p className="font-bold text-gray-800">30 min</p>
            </div>
            <div className="text-center">
              <p className="text-gray-500">Tiempo entre sesiones</p>
              <p className="font-bold text-gray-800">15 min</p>
            </div>
            <div className="text-center">
              <p className="text-gray-500">Tarifa por hora</p>
              <p className="font-bold text-gray-800">$100 USD</p>
            </div>
          </div>
        </div>

        {emailError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {emailError}
          </div>
        )}

        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition-all"
          >
            Volver
          </button>
          <button
            type="submit"
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            Continuar
          </button>
        </div>
      </form>
    </div>
  );
}

// Step 3 Component mejorado
function Step3Calendar({ isLoading, onConnectCalendar, onSkipCalendar }: any) {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
        <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      
      <h2 className="text-2xl font-semibold text-gray-800 mb-2">Conecte su Google Calendar</h2>
      <p className="text-gray-600 mb-8">
        Sincronice automáticamente sus citas y disponibilidad
      </p>
      
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 mb-8">
        <h3 className="font-semibold text-gray-700 mb-4">Beneficios de conectar su calendario:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Disponibilidad en tiempo real</span>
          </div>
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Citas automáticas en calendario</span>
          </div>
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Sin dobles reservas</span>
          </div>
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Notificaciones automáticas</span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center py-8">
          <div className="animate-spin h-12 w-12 border-4 border-purple-600 border-t-transparent rounded-full mb-4"></div>
          <p className="text-gray-600 font-medium">Guardando su información...</p>
        </div>
      ) : (
        <div className="space-y-4">
          <button
            onClick={onConnectCalendar}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-8 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-3"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
            </svg>
            Conectar con Google Calendar
          </button>
          
          <button
            onClick={onSkipCalendar}
            className="w-full text-gray-600 py-3 px-6 font-medium hover:text-gray-800 transition-all"
          >
            Omitir por ahora
          </button>
        </div>
      )}
    </div>
  );
}