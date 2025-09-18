import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Sistema de Psicólogos',
  description: 'Sistema de gestión y onboarding para psicólogos',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}