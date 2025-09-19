'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Interfaces (no cambian)
interface ExtractedData { nombre_completo: string; email: string; telefono: string; años_experiencia: number; especialidades: string[]; modalidad: 'online' | 'presencial' | 'hybrid'; sobre_mi: string; formacion: string[]; }
interface StepProps { isDisabled: boolean; }
interface Step1UploadProps extends StepProps { selectedFile: File | null; isLoading: boolean; onFileSelect: (file: File) => void; }
interface Step2ReviewProps extends StepProps { extractedData: ExtractedData | null; emailError: string; onSubmit: (formData: ExtractedData) => void; onBack: () => void; }
interface Step3CalendarProps extends StepProps { onConnectCalendar: () => void; onSkipCalendar: () => void; }

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [psychologistId, setPsychologistId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');

  // Lógica de las funciones (sin cambios)
  const handleFileSelect = (file: File) => {
    if (file.type !== 'application/pdf') { alert('Por favor, seleccione un archivo PDF'); return; }
    if (file.size > 10 * 1024 * 1024) { alert('El archivo no debe superar los 10MB'); return; }
    setSelectedFile(file);
    handleUploadCV(file);
  };
  const handleUploadCV = async (file: File) => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append('cv', file);
    try {
      const response = await fetch('/api/upload-cv', { method: 'POST', body: formData });
      if (!response.ok) throw new Error('Error del servidor al subir CV');
      const data = await response.json();
      setExtractedData(data);
      setCurrentStep(2);
    } catch (error) {
      console.error("Error en handleUploadCV:", error);
      alert('Error al procesar el CV. Por favor, intente de nuevo.');
      setSelectedFile(null);
    } finally { setIsLoading(false); }
  };
  const handleSaveData = async (formData: ExtractedData) => {
    setIsLoading(true);
    setEmailError('');
    try {
        const checkResponse = await fetch(`/api/check-email?email=${encodeURIComponent(formData.email)}`);
        const { exists } = await checkResponse.json();
        if (exists) {
            setEmailError('Este email ya está registrado.');
            setIsLoading(false);
            return;
        }
        const response = await fetch('/api/psychologists', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: formData.nombre_completo, email: formData.email })
        });
        if (!response.ok) throw new Error('Error al guardar psicólogo');
        const result = await response.json();
        setPsychologistId(result.id);
        setCurrentStep(3);
    } catch (error) {
        console.error("Error en handleSaveData:", error);
        alert('Error al guardar tus datos.');
    } finally { setIsLoading(false); }
  };
  const handleConnectCalendar = () => {
    if (psychologistId) {
      window.location.href = `/api/auth/google?psychologist_id=${psychologistId}&redirect=/onboarding/success`;
    }
  };

  return (
    <main className="min-h-screen bg-brand-light font-sans">
      <div className="container mx-auto px-4 py-16 max-w-2xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Completa tu registro
          </h1>
          <p className="text-gray-500 text-lg">
            Sigue estos 3 simples pasos para formar parte de nuestra red.
          </p>
        </div>
        <div className="space-y-6">
          <Step1UploadCV
            isDisabled={false}
            selectedFile={selectedFile}
            isLoading={isLoading && currentStep === 1}
            onFileSelect={handleFileSelect}
          />
          <Step2Review
            isDisabled={currentStep < 2}
            extractedData={extractedData}
            emailError={emailError}
            onSubmit={handleSaveData}
            onBack={() => { setCurrentStep(1); setSelectedFile(null); setExtractedData(null); }}
          />
          <Step3Calendar
            isDisabled={currentStep < 3}
            onConnectCalendar={handleConnectCalendar}
            onSkipCalendar={() => router.push('/onboarding/success')}
          />
        </div>
      </div>
    </main>
  );
}

// --- COMPONENTES DE CADA PASO ---

function StepWrapper({ title, subtitle, isDisabled, children }: { title: string; subtitle: string; isDisabled: boolean; children: React.ReactNode }) {
    return (
        <fieldset disabled={isDisabled} className={`bg-white rounded-lg shadow-sm border border-gray-200 p-8 transition-all duration-300 ${isDisabled ? 'opacity-50' : 'opacity-100'}`}>
            <h2 className="text-2xl font-semibold text-gray-900 mb-1">{title}</h2>
            <p className="text-gray-500 mb-6">{subtitle}</p>
            {children}
        </fieldset>
    );
}

function Step1UploadCV({ selectedFile, isLoading, onFileSelect }: Step1UploadProps) {
  return (
    <StepWrapper title="1. Sube tu CV" subtitle="Extraeremos tu información automáticamente." isDisabled={false}>
        <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
            <input
                id="cv-upload" type="file" accept=".pdf" className="hidden"
                onChange={(e) => { if (e.target.files?.[0]) onFileSelect(e.target.files[0]); }}
            />
            {isLoading ? (
                <p className="font-medium text-gray-700">Procesando...</p>
            ) : selectedFile ? (
                <div>
                    <p className="font-semibold text-success">✓ {selectedFile.name}</p>
                    <label htmlFor="cv-upload" className="mt-1 text-sm text-brand hover:underline font-medium cursor-pointer">Cambiar archivo</label>
                </div>
            ) : (
                <label htmlFor="cv-upload" className="bg-brand text-white font-semibold py-3 px-8 rounded-lg hover:bg-brand-dark transition-colors cursor-pointer">
                    Seleccionar CV en formato PDF
                </label>
            )}
        </div>
    </StepWrapper>
  );
}

function Step2Review({ extractedData, emailError, isDisabled, onSubmit, onBack }: Step2ReviewProps) {
    const [formData, setFormData] = useState<ExtractedData | null>(null);
    useEffect(() => { if (extractedData) setFormData(extractedData); }, [extractedData]);

    if (!extractedData) {
        return <StepWrapper title="2. Revisa tu Información" subtitle="Completa el paso anterior para continuar." isDisabled={true}><div/></StepWrapper>;
    }
    if (!formData) return null;

    return (
        <StepWrapper title="2. Revisa tu Información" subtitle="Asegúrate de que todo esté correcto." isDisabled={isDisabled}>
            <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo *</label>
                        <input type="text" value={formData.nombre_completo} onChange={(e) => setFormData({...formData, nombre_completo: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                        <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
                    </div>
                </div>
                {emailError && <p className="text-red-500 text-sm">{emailError}</p>}
                <div className="flex gap-4 pt-2">
                    <button type="button" onClick={onBack} className="w-full bg-gray-200 text-gray-900 py-3 rounded-lg font-semibold hover:bg-gray-300">Subir otro</button>
                    <button type="submit" className="w-full bg-brand text-white py-3 rounded-lg font-semibold hover:bg-brand-dark">Guardar y Continuar</button>
                </div>
            </form>
        </StepWrapper>
    );
}

function Step3Calendar({ isDisabled, onConnectCalendar, onSkipCalendar }: Step3CalendarProps) {
    return (
        <StepWrapper title="3. Conecta tu Calendario" subtitle="Sincroniza tu Google Calendar." isDisabled={isDisabled}>
            <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={onConnectCalendar} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700">Conectar Google Calendar</button>
                <button onClick={onSkipCalendar} className="w-full bg-gray-200 text-gray-900 py-3 rounded-lg font-semibold hover:bg-gray-300">Omitir por ahora</button>
            </div>
        </StepWrapper>
    );
}