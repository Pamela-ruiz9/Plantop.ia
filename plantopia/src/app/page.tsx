import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-between p-8 bg-gradient-to-b from-green-50 to-white">
      <header className="w-full flex justify-center mb-6">
        <Image src="/logo.svg" alt="Plantop.ia logo" width={220} height={50} priority />
      </header>
      <main className="flex flex-col items-center gap-8 w-full max-w-2xl">
        <h1 className="text-4xl font-bold text-green-700 text-center">Bienvenido a Plantop.ia</h1>
        <p className="text-lg text-gray-700 text-center max-w-xl">
          Plantop.ia es tu asistente inteligente para el cuidado y gestión de tus plantas. Organiza, aprende y lleva el control de tu jardín de manera sencilla y personalizada.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full mt-4">
          <Link href="/dashboard" className="rounded-xl shadow-md bg-white hover:bg-green-50 p-6 flex flex-col items-center transition border border-green-100">
            <Image src="/logo-square.svg" alt="Dashboard" width={40} height={40} />
            <span className="mt-2 font-semibold text-green-700">Dashboard</span>
            <span className="text-xs text-gray-500 text-center mt-1">Tu resumen y métricas de plantas</span>
          </Link>
          <Link href="/onboarding" className="rounded-xl shadow-md bg-white hover:bg-green-50 p-6 flex flex-col items-center transition border border-green-100">
            <Image src="/globe.svg" alt="Onboarding" width={40} height={40} />
            <span className="mt-2 font-semibold text-green-700">Personalización</span>
            <span className="text-xs text-gray-500 text-center mt-1">Configura tu perfil y preferencias</span>
          </Link>
          <Link href="/dashboard" className="rounded-xl shadow-md bg-white hover:bg-green-50 p-6 flex flex-col items-center transition border border-green-100">
            <Image src="/file.svg" alt="Añadir Planta" width={40} height={40} />
            <span className="mt-2 font-semibold text-green-700">Añadir Planta</span>
            <span className="text-xs text-gray-500 text-center mt-1">Registra una nueva planta en tu colección</span>
          </Link>
          <Link href="/dashboard" className="rounded-xl shadow-md bg-white hover:bg-green-50 p-6 flex flex-col items-center transition border border-green-100">
            <Image src="/window.svg" alt="Ver Plantas" width={40} height={40} />
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
