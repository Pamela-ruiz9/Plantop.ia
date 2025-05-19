import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (    <div className="min-h-screen flex flex-col items-center justify-between p-8 bg-gradient-to-b from-green-50 to-white">      <header className="w-full flex justify-center mb-6">
        <div style={{ position: 'relative', width: '220px', height: '50px' }}>          <Image 
            src="/logo.svg" 
            alt="Plantop.ia logo" 
            fill
            style={{ objectFit: 'contain' }}
            priority 
          />
        </div>
      </header>
      <main className="flex flex-col items-center gap-8 w-full max-w-2xl">
        <h1 className="text-4xl font-bold text-green-700 text-center">Bienvenido a Plantop.ia</h1>
        <p className="text-lg text-gray-700 text-center max-w-xl">
          Plantop.ia es tu asistente inteligente para el cuidado y gestión de tus plantas. Organiza, aprende y lleva el control de tu jardín de manera sencilla y personalizada.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full mt-4">
          <Link href="/dashboard" className="rounded-xl shadow-md bg-white hover:bg-green-50 p-6 flex flex-col items-center transition border border-green-100">
            <svg className="w-10 h-10 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
            <span className="mt-2 font-semibold text-green-700">Dashboard</span>
            <span className="text-xs text-gray-500 text-center mt-1">Tu resumen y métricas de plantas</span>
          </Link>
          <Link href="/onboarding" className="rounded-xl shadow-md bg-white hover:bg-green-50 p-6 flex flex-col items-center transition border border-green-100">
            <svg className="w-10 h-10 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            <span className="mt-2 font-semibold text-green-700">Personalización</span>
            <span className="text-xs text-gray-500 text-center mt-1">Configura tu perfil y preferencias</span>
          </Link>
          <Link href="/dashboard" className="rounded-xl shadow-md bg-white hover:bg-green-50 p-6 flex flex-col items-center transition border border-green-100">
            <svg className="w-10 h-10 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span className="mt-2 font-semibold text-green-700">Añadir Planta</span>
            <span className="text-xs text-gray-500 text-center mt-1">Registra una nueva planta en tu colección</span>
          </Link>
          <Link href="/dashboard" className="rounded-xl shadow-md bg-white hover:bg-green-50 p-6 flex flex-col items-center transition border border-green-100">
            <svg className="w-10 h-10 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            <span className="mt-2 font-semibold text-green-700">Ver Plantas</span>
            <span className="text-xs text-gray-500 text-center mt-1">Explora y gestiona tus plantas</span>
          </Link>
        </div>
      </main>
      <footer className="mt-10 flex gap-6 flex-wrap items-center justify-center text-sm text-gray-500">
        <a href="mailto:contact@plantopia.com" className="hover:underline">Contacto</a>
        <a href="https://github.com/pame/Plantop.ia" target="_blank" rel="noopener noreferrer" className="hover:underline">GitHub</a>
        <a href="/login" className="hover:underline">Iniciar sesión</a>
      </footer>
    </div>
  );
}
