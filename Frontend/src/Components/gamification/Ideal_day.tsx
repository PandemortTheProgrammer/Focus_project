// frontend/src/components/DiaIdeal.tsx
import PageHeader from '../essentials/Page-head';

export default function DiaIdeal() {
  return (
    <div className="relative min-h-screen flex flex-col pb-12">
      <PageHeader 
        titulo="Mi Día Ideal" 
        rutaVolver="/dashboard" 
        textoVolver="Volver al dashboard" 
      />

      <div className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-4">
        
        <p className="text-zinc-400 text-center max-w-2xl mx-auto mb-8">
          Diseña la estructura perfecta de tus 24 horas. Este lienzo servirá como tu línea base para evaluar tus métricas y la compatibilidad con tu enfoque elegido.
        </p>

        {/* CONTENEDOR PLACEHOLDER PARA EL FUTURO LIENZO DE 24 HORAS */}
        <div className="w-full h-[600px] rounded-3xl border-2 border-dashed border-zinc-700/50 bg-[#1a1a1a]/50 flex items-center justify-center">
          <p className="text-zinc-600 font-semibold tracking-widest uppercase">
            [ Espacio reservado para la cuadrícula de 24 horas ]
          </p>
        </div>

      </div>
    </div>
  );
}