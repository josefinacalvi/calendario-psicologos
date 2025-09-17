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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) handleFileSelect(files[0]);
  };

  const handleUploadCV = async () => {
    if (!selectedFile) return;
    
    setIsLoading(true);
    const formData = new FormData();
    formData.append('cv', selectedFile);
    formData.append('filename', selectedFile.name);
    
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
    
    // Check if email already exists
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
    
    // Save to Supabase
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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Bienvenido al Sistema de Psicólogos</h1>
          <p className="text-gray-600 mt-2">Complete su registro en 3 simples pasos</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center flex-1">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
              currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              {currentStep > 1 ? '✓' : '1'}
            </div>
            <div className="flex-1 h-1 bg-gray-300 mx-2"></div>
          </div>
          <div className="flex items-center flex-1">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
              currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              {currentStep > 2 ? '✓' : '2'}
            </div>
            <div className="flex-1 h-1 bg-gray-300 mx-2"></div>
          </div>
          <div className="flex items-center flex-1">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
              currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              {currentStep > 3 ? '✓' : '3'}
            </div>
          </div>
        </div>

        {/* Step Labels */}
        <div className="flex justify-between mb-8 text-sm">
          <span className={currentStep === 1 ? 'text-blue-600 font-semibold' : 'text-gray-400'}>
            Subir CV
          </span>
          <span className={currentStep === 2 ? 'text-blue-600 font-semibold' : 'text-gray-400'}>
            Revisar Información
          </span>
          <span className={currentStep === 3 ? 'text-blue-600 font-semibold' : 'text-gray-400'}>
            Conectar Calendario
          </span>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Step 1: Upload CV */}
          {currentStep === 1 && (
            <Step1Upload
              selectedFile={selectedFile}
              fileInputRef={fileInputRef}
              isLoading={isLoading}
              onFileSelect={handleFileSelect}
              onDrop={handleDrop}
              onUpload={handleUploadCV}
              onRemoveFile={() => setSelectedFile(null)}
            />
          )}

          {/* Step 2: Review Information */}
          {currentStep === 2 && (
            <Step2Review
              extractedData={extractedData}
              emailError={emailError}
              onBack={() => setCurrentStep(1)}
              onSubmit={handleSaveData}
            />
          )}

          {/* Step 3: Connect Calendar */}
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

// Step 1 Component
interface Step1UploadProps {
  selectedFile: File | null;
  fileInputRef: React.RefObject<HTMLInputElement>;
  isLoading: boolean;
  onFileSelect: (file: File) => void;
  onDrop: (e: React.DragEvent) => void;
  onUpload: () => void;
  onRemoveFile: () => void;
}

function Step1Upload({ selectedFile, fileInputRef, isLoading, onFileSelect, onDrop, onUpload, onRemoveFile }: Step1UploadProps) {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Paso 1: Suba su CV</h2>
      <p className="text-gray-600 mb-6">
        Suba su CV en formato PDF para extraer automáticamente su información profesional.
      </p>
      
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-blue-400 transition-colors"
      >
        <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p className="text-lg mb-2">Arrastra tu CV aquí o haz click para seleccionar</p>
        <p className="text-sm text-gray-500">Solo archivos PDF (máximo 10MB)</p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && onFileSelect(e.target.files[0])}
        />
      </div>

      {selectedFile && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-800">{selectedFile.name}</span>
            <button
              onClick={onRemoveFile}
              className="text-red-600 hover:text-red-800"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <button
        onClick={onUpload}
        disabled={!selectedFile || isLoading}
        className="mt-6 w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <div className="flex justify-center">
            <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
          </div>
        ) : (
          'Continuar'
        )}
      </button>
    </div>
  );
}

// Step 2 Component
interface Step2ReviewProps {
  extractedData: ExtractedData | null;
  emailError: string;
  onBack: () => void;
  onSubmit: (data: ExtractedData) => void;
}

function Step2Review({ extractedData, emailError, onBack, onSubmit }: Step2ReviewProps) {
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
      <h2 className="text-2xl font-semibold mb-4">Paso 2: Revise su Información</h2>
      <p className="text-gray-600 mb-6">
        Hemos extraído la siguiente información de su CV. Por favor, revise y confirme que es correcta.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo *</label>
            <input
              type="text"
              value={formData.nombre_completo}
              onChange={(e) => setFormData({...formData, nombre_completo: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <input
              type="tel"
              value={formData.telefono}
              onChange={(e) => setFormData({...formData, telefono: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Años de Experiencia</label>
            <input
              type="number"
              value={formData.años_experiencia}
              onChange={(e) => setFormData({...formData, años_experiencia: parseInt(e.target.value) || 0})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min="0"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Especialidades</label>
          <input
            type="text"
            value={Array.isArray(formData.especialidades) ? formData.especialidades.join(', ') : ''}
            onChange={(e) => setFormData({...formData, especialidades: e.target.value.split(',').map(s => s.trim()).filter(s => s)})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Ej: Psicología Clínica, Terapia Cognitiva, etc."
          />
          <p className="text-xs text-gray-500 mt-1">Separe múltiples especialidades con comas</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Modalidad de Atención</label>
          <select
            value={formData.modalidad}
            onChange={(e) => setFormData({...formData, modalidad: e.target.value as 'online' | 'presencial' | 'hybrid'})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="online">Online</option>
            <option value="presencial">Presencial</option>
            <option value="hybrid">Ambas (Híbrido)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Biografía Profesional</label>
          <textarea
            value={formData.sobre_mi}
            onChange={(e) => setFormData({...formData, sobre_mi: e.target.value})}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Formación Académica</label>
          <textarea
            value={Array.isArray(formData.formacion) ? formData.formacion.join(', ') : ''}
            onChange={(e) => setFormData({...formData, formacion: e.target.value.split(',').map(s => s.trim()).filter(s => s)})}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Información automática */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-2">Configuración Estándar:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Duración de sesión: <strong>30 minutos</strong></li>
            <li>• Tiempo entre sesiones: <strong>15 minutos</strong></li>
            <li>• Tarifa por hora: <strong>$100 USD</strong></li>
          </ul>
        </div>

        {emailError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {emailError}
          </div>
        )}

        <div className="flex gap-4">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            Volver
          </button>
          <button
            type="submit"
            className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Continuar
          </button>
        </div>
      </form>
    </div>
  );
}

// Step 3 Component
interface Step3CalendarProps {
  isLoading: boolean;
  onConnectCalendar: () => void;
  onSkipCalendar: () => void;
}

function Step3Calendar({ isLoading, onConnectCalendar, onSkipCalendar }: Step3CalendarProps) {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Paso 3: Conecte su Google Calendar</h2>
      <p className="text-gray-600 mb-6">
        Conecte su Google Calendar para sincronizar automáticamente sus citas y disponibilidad.
      </p>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
        <h3 className="font-semibold text-blue-900 mb-2">¿Por qué conectar su calendario?</h3>
        <ul className="text-sm text-blue-800 space-y-2">
          <li>✓ Los pacientes verán su disponibilidad real en tiempo real</li>
          <li>✓ Las citas se crearán automáticamente en su calendario</li>
          <li>✓ Evitará dobles reservas y conflictos de horarios</li>
          <li>✓ Recibirá notificaciones automáticas de nuevas citas</li>
        </ul>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin h-8 w-8 border-3 border-gray-300 border-t-blue-600 rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Guardando su información...</p>
        </div>
      ) : (
        <div className="space-y-4">
          <button
            onClick={onConnectCalendar}
            className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-3"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
            </svg>
            Conectar con Google Calendar
          </button>
          
          <button
            onClick={onSkipCalendar}
            className="w-full bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            Omitir por ahora
          </button>
        </div>
      )}

      <p className="text-xs text-gray-500 text-center mt-4">
        Podrá conectar su calendario más tarde desde el panel de control
      </p>
    </div>
  );
}