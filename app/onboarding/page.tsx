'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Interfaces (tipos)
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

  const handleUploadCV = async (file: File) => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append('cv', file);
    formData.append('filename', file.name);

    try {
      const response = await fetch('/api/upload-cv', { // Usar ruta relativa
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
      setSelectedFile(null);
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
    } catch { console.error('Error checking email'); }
    try {
      const dataToSave = {
        name: formData.nombre_completo, email: formData.email, phone: formData.telefono,
        specialties: formData.especialidades, years_experience: formData.años_experiencia,
        modality: formData.modalidad, bio: formData.sobre_mi, formacion: formData.formacion,
        session_duration: 30, buffer_time: 15, hourly_rate: 100, currency: 'USD', is_active: true
      };
      const response = await fetch('/api/psychologists', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dataToSave)
      });
      const result = await response.json();
      if (response.ok && result.id) {
        setPsychologistId(result.id);
        setCurrentStep(3);
      } else { throw new Error('Error al guardar los datos'); }
    } catch { alert('Error al guardar los datos. Por favor, intente nuevamente.');
    } finally { setIsLoading(false); }
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
    <div className="min-h-screen bg-slate-50 font-sans">
      <div className="container mx-auto px-4 py-16 max-w-2xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-800 mb-3">
            Completa tu registro
          </h1>
          <p className="text-slate-600 text-lg">
            Sigue estos 3 simples pasos para formar parte de nuestra red.
          </p>
        </div>
        <div className="space-y-8">
          <Step1UploadCV 
            selectedFile={selectedFile}
            isLoading={isLoading && currentStep === 1}
            onFileSelect={handleFileSelect}
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

function Step1UploadCV({ selectedFile, isLoading, onFileSelect }: Step1UploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
      <h2 className="text-2xl font-semibold text-slate-800 mb-1">1. Sube tu CV</h2>
      <p className="text-slate-500 mb-6">Extraeremos tu información automáticamente.</p>
      
      <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center flex items-center justify-center">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              onFileSelect(e.target.files[0]);
            }
          }}
        />
        
        {isLoading ? (
          <div className="flex items-center justify-center h-[52px]">
            <div className="animate-spin h-6 w-6 border-4 border-slate-500 border-t-transparent rounded-full"></div>
            <p className="ml-4 text-slate-600 font-medium">Procesando...</p>
          </div>
        ) : selectedFile ? (
          <div className="text-center h-[52px] flex flex-col justify-center">
            <p className="font-semibold text-green-700">✓ {selectedFile.name}</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-1 text-sm text-slate-600 hover:underline font-medium"
            >
              Cambiar archivo
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-slate-800 text-white font-semibold py-3 px-8 rounded-lg hover:bg-slate-700 transition-colors"
          >
            Seleccionar CV en formato PDF
          </button>
        )}
      </div>
    </div>
  );
}

function Step2Review({ extractedData, emailError, isDisabled, onSubmit, onBack }: Step2ReviewProps) {
    const [formData, setFormData] = useState<ExtractedData | null>(null);

    useEffect(() => {
        if (extractedData) setFormData(extractedData);
    }, [extractedData]);

    const componentClasses = `bg-white rounded-xl shadow-sm border border-slate-200 p-8 transition-opacity ${
        isDisabled ? 'opacity-50 pointer-events-none' : 'opacity-100'
    }`;

    if (!extractedData) {
        return (
            <div className={componentClasses}>
                <h2 className="text-2xl font-semibold text-slate-400 mb-1">2. Revisa tu Información</h2>
                <p className="text-slate-400">Completa el paso anterior para continuar.</p>
            </div>
        );
    }

    if (!formData) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };
  
    return (
        <div className={componentClasses}>
            <h2 className="text-2xl font-semibold text-slate-800 mb-1">2. Revisa tu Información</h2>
            <p className="text-slate-500 mb-6">Asegúrate de que todo esté correcto antes de continuar.</p>
            
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Nombre Completo *</label>
                        <input type="text" value={formData.nombre_completo} onChange={(e) => setFormData({...formData, nombre_completo: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Email *</label>
                        <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg" required />
                    </div>
                </div>

                {emailError && <p className="text-red-500 text-sm mt-2">{emailError}</p>}
                
                <div className="flex gap-4 pt-4">
                    <button type="button" onClick={onBack} className="w-full bg-slate-200 text-slate-800 py-3 rounded-lg font-semibold hover:bg-slate-300">
                        Subir otro CV
                    </button>
                    <button type="submit" className="w-full bg-slate-800 text-white py-3 rounded-lg font-semibold hover:bg-slate-700">
                        Guardar y Continuar
                    </button>
                </div>
            </form>
        </div>
    );
}

function Step3Calendar({ isDisabled, onConnectCalendar, onSkipCalendar }: Step3CalendarProps) {
    const componentClasses = `bg-white rounded-xl shadow-sm border border-slate-200 p-8 transition-opacity ${
        isDisabled ? 'opacity-50 pointer-events-none' : 'opacity-100'
    }`;
    
    return (
        <div className={componentClasses}>
            <h2 className="text-2xl font-semibold text-slate-800 mb-1">3. Conecta tu Calendario</h2>
            <p className="text-slate-500 mb-6">Sincroniza tu Google Calendar para gestionar tu disponibilidad.</p>
            
            <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={onConnectCalendar} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700">
                    Conectar Google Calendar
                </button>
                <button onClick={onSkipCalendar} className="w-full bg-slate-200 text-slate-800 py-3 rounded-lg font-semibold hover:bg-slate-300">
                    Omitir por ahora
                </button>
            </div>
        </div>
    );
}