
cat > app/page.tsx << 'EOF'
export default function Home() {
  return (
    <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'system-ui' }}>
      <h1>Sistema de Psicólogos</h1>
      <p style={{ marginTop: '20px', color: '#666' }}>Selecciona una opción:</p>
      <div style={{ marginTop: '30px', display: 'flex', gap: '20px', justifyContent: 'center' }}>
        <a href="/onboarding" style={{ 
          padding: '12px 24px', 
          background: '#0070f3', 
          color: 'white', 
          textDecoration: 'none',
          borderRadius: '6px',
          fontSize: '16px'
        }}>
          Registro de Psicólogos
        </a>
        <a href="/dashboard" style={{ 
          padding: '12px 24px', 
          background: '#666', 
          color: 'white', 
          textDecoration: 'none',
          borderRadius: '6px',
          fontSize: '16px'
        }}>
          Dashboard
        </a>
      </div>
    </div>
  );
}
