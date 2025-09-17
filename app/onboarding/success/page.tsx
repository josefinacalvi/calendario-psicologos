'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function OnboardingSuccess() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/dashboard');
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        {/* Success Icon */}
        <div className="mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        {/* Success Message */}
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          ¡Registro Completado!
        </h1>
        <p className="text-gray-600 mb-8">
          Su perfil ha sido creado exitosamente. Ya forma parte de nuestra red de profesionales.
        </p>

        {/* What's Next */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left">
          <h3 className="font-semibold text-blue-900 mb-2">Próximos pasos:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✓ Su perfil está activo y visible para pacientes</li>
            <li>✓ Recibirá notificaciones de nuevas citas por email</li>
            <li>✓ Puede gestionar su disponibilidad desde el panel</li>
            {countdown > 0 && (
              <li>✓ Redirigiendo al panel en {countdown} segundos...</li>
            )}
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Ir al Panel de Control
          </button>
          
          <button
            onClick={() => window.open('https://calendar.google.com', '_blank')}
            className="w-full bg-white border-2 border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            Ver mi Google Calendar
          </button>
        </div>

        {/* Footer */}
        <p className="text-xs text-gray-500 mt-6">
          Si tiene alguna pregunta, contáctenos en soporte@ejemplo.com
        </p>
      </div>
    </div>
  );
}