'use client';

// 1. Asegúrate de que useEffect esté importado aquí
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Interfaces (tipos) que necesita el componente
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

interface Step1UploadProps {
  selectedFile: File | null;
  isLoading: boolean;
  onFileSelect: (file: File) => void;
  onDrop: (e: React.DragEvent) => void;
}

interface Step2ReviewProps {
  extractedData: ExtractedData | null;
  emailError: string;
  isDisabled: boolean;
  onSubmit: (formData: ExtractedData) => void;
  onBack: () => void;
}

interface Step3CalendarProps {
  isLoading: boolean;
  isDisabled: boolean;
  onConnectCalendar: () => void;
  onSkipCalendar: () => void;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [psychologistId, setPsychologistId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  
  // 2. Eliminamos el useRef de aquí porque ya no es necesario en el componente padre
  // const fileInputRef = useRef<HTMLInputElement | null>(null);

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
    handleUploadCV(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) handleFileSelect(files[0]);
  };

  const handleUploadCV = async (file: File) => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append('cv', file);
    formData.append('filename', file.name);

    try {
      const response = await fetch('https://primary-production-439de.up.railway.app/webhook/upload-cv', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setExtractedData(data);
        setCurrentStep(2); // <-- Habilita el siguiente paso
      } else {
        throw new Error('Error al procesar el CV');
      }
    } catch {
      alert('Error al procesar el CV. Por favor, intente nuevamente.');
      setSelectedFile(null); // Limpiar archivo en caso de error
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveData = async (formData: ExtractedData) => {
    setEmailError('');
    setIsLoading(true);

    try {
      const checkResponse = await fetch(`/api/check-email?email=${encodeURIComponent(formData.email)}`);
      const checkData = await checkResponse.json();

      if (checkData.exists) {
        setEmailError('Este email ya está registrado en el sistema.');
        setIsLoading(false);
        return;
      }
    } catch {
      console.error('Error checking email');
    }

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
        session_duration: 30, buffer_time: 15, hourly_rate: 100, currency: 'USD', is_active: true
      };
      
      const response = await fetch('/api/psychologists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave)
      });
      
      const result = await response.json();
      
      if (response.ok && result.id) {
        setPsychologistId(result.id);
        setCurrentStep(3); // <-- Habilita el último paso
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
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-3">
            Completa tu registro
          </h1>
          <p className="text-gray-600 text-lg">
            Sigue estos 3 simples pasos para formar parte de nuestra red.
          </p>
        </div>

        {/* Contenedor de los 3 pasos */}
        <div className="space-y-8">
          <Step1UploadCV 
            selectedFile={selectedFile}
            isLoading={isLoading && currentStep === 1}
            onFileSelect={handleFileSelect}
            onDrop={handleDrop}
          />
          <Step2Review 
            extractedData={extractedData}
            emailError={emailError}
            isDisabled={currentStep < 2}
            onSubmit={handleSaveData}
            onBack={() => {
                setCurrentStep(1);
                setSelectedFile(null);
                setExtractedData(null);
            }}
          />
          <Step3Calendar 
            isLoading={isLoading && currentStep === 3}
            isDisabled={currentStep < 3}
            onConnectCalendar={handleConnectCalendar}
            onSkipCalendar={handleSkipCalendar}
          />
        </div>
      </div>
    </div>
  );
}


// --- COMPONENTES DE CADA PASO ---

// PASO 1: Subir CV (Rediseñado)
function Step1UploadCV({ selectedFile, isLoading, onFileSelect, onDrop }: Step1UploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="bg-white rounded-xl shadow-md p-8">
      <h2 className="text-2xl font-semibold text-gray-800 mb-1">1. Sube tu CV</h2>
      <p className="text-gray-500 mb-6">Extraeremos tu información automáticamente.</p>
      
      <div 
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && onFileSelect(e.target.files[0])}
        />
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[80px]">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            <p className="mt-4 text-gray-600 font-medium">Procesando...</p>
          </div>
        ) : selectedFile ? (
          <div className="flex flex-col items-center justify-center min-h-[80px]">
            <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p className="mt-2 font-semibold text-gray-700">{selectedFile.name}</p>
            <p className="text-sm text-gray-500">Archivo cargado. Procesando...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[80px]">
             <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
            <p className="mt-2 font-semibold text-gray-700">
              <span className="text-blue-600">Haz clic para buscar</span> o arrastra el archivo aquí
            </p>
            <p className="text-sm text-gray-500">PDF (máx 10MB)</p>
          </div>
        )}
      </div>
    </div>
  );
}

// PASO 2: Revisar Información (con estado deshabilitado)
function Step2Review({ extractedData, emailError, isDisabled, onSubmit, onBack }: Step2ReviewProps) {
  const [formData, setFormData] = useState<ExtractedData | null>(null);

  // 3. ¡CORRECCIÓN! Cambiamos useState por useEffect
  useEffect(() => {
    if (extractedData) {
      setFormData(extractedData);
    }
  }, [extractedData]);

  if (!formData) {
    return (
        <div className={`bg-white rounded-xl shadow-md p-8 transition-opacity ${isDisabled ? 'opacity-50' : 'opacity-100'}`}>
            <h2 className="text-2xl font-semibold text-gray-400 mb-1">2. Revisa tu Información</h2>
            <p className="text-gray-400">Completa el paso anterior para continuar.</p>
        </div>
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData) {
      onSubmit(formData);
    }
  };
  
  return (
    <div className={`bg-white rounded-xl shadow-md p-8 transition-opacity ${isDisabled ? 'opacity-50' : 'opacity-100'}`}>
      <fieldset disabled={isDisabled} className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-1">2. Revisa tu Información</h2>
        <p className="text-gray-500 mb-6">Asegúrate de que todo esté correcto antes de continuar.</p>
        
        <form onSubmit={handleSubmit}>
           <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nombre Completo *</label>
                  <input type="text" value={formData.nombre_completo} onChange={(e) => setFormData({...formData, nombre_completo: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg" required />
                </div>
              </div>
              {/* Aquí irían los otros campos del formulario si los añades de nuevo */}
            </div>

          {emailError && <p className="text-red-500 text-sm mt-2">{emailError}</p>}
          
          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onBack} className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300">
              Subir otro CV
            </button>
            <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700">
              Guardar y Continuar
            </button>
          </div>
        </form>
      </fieldset>
    </div>
  );
}

// PASO 3: Conectar Calendario (con estado deshabilitado)
function Step3Calendar({ isLoading, isDisabled, onConnectCalendar, onSkipCalendar }: Step3CalendarProps) {
  return (
    <div className={`bg-white rounded-xl shadow-md p-8 transition-opacity ${isDisabled ? 'opacity-50' : 'opacity-100'}`}>
      <fieldset disabled={isDisabled}>
        <h2 className="text-2xl font-semibold text-gray-800 mb-1">3. Conecta tu Calendario</h2>
        <p className="text-gray-500 mb-6">Sincroniza tu Google Calendar para gestionar tu disponibilidad.</p>
        
        {isLoading ? (
            <div className="text-center py-4">
              <p className="text-gray-600">Guardando...</p>
            </div>
        ) : (
            <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={onConnectCalendar} className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700">
                    Conectar Google Calendar
                </button>
                <button onClick={onSkipCalendar} className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300">
                    Omitir por ahora
                </button>
            </div>
        )}
      </fieldset>
    </div>
  );
}