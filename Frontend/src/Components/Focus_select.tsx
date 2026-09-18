import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from './Page-head';
import { useToast } from './ToastContext';
import { 
  CheckCircleIcon,
  AcademicCapIcon, 
  SunIcon, 
  BoltIcon, 
  BanknotesIcon, 
  HeartIcon, 
  ArrowsRightLeftIcon, 
  ScaleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckSolid } from '@heroicons/react/24/solid';

interface Enfoque {
  Id_enfoque: number;
  nombre_enf: string;
  descrip_enf: string;
}

// Diccionario visual estático para los enfoques
const recursosEnfoque: Record<number, { icono: React.ElementType, color: string }> = {
  1: { icono: AcademicCapIcon, color: '#3b82f6' }, // Académico - Azul
  2: { icono: SunIcon, color: '#eab308' },         // Tiempo libre - Amarillo
  3: { icono: BoltIcon, color: '#ef4444' },        // Atlético - Rojo
  4: { icono: BanknotesIcon, color: '#10b981' },   // Económico - Verde
  5: { icono: HeartIcon, color: '#d946ef' },       // Salud mental - Fucsia
  6: { icono: ArrowsRightLeftIcon, color: '#06b6d4' }, // Flexibilidad - Cian
  7: { icono: ScaleIcon, color: '#8b5cf6' },       // Equilibrado - Morado
};

const fallbackRecurso = { icono: SparklesIcon, color: '#f5e6c8' };

export default function SeleccionarEnfoque() {
  const navigate = useNavigate();
  const { mostrarToast } = useToast();
  
  const [enfoques, setEnfoques] = useState<Enfoque[]>([]);
  const [enfoqueActualId, setEnfoqueActualId] = useState<number | null>(null);
  const [seleccionadoId, setSeleccionadoId] = useState<number | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [resEnfoques, resPerfil] = await Promise.all([
          fetch('http://localhost:3000/api/perfil/enfoques'),
          fetch('http://localhost:3000/api/perfil')
        ]);

        if (resEnfoques.ok && resPerfil.ok) {
          const dataEnfoques = await resEnfoques.json();
          const dataPerfil = await resPerfil.json();
          
          setEnfoques(dataEnfoques);
          setEnfoqueActualId(dataPerfil.id_focus);
          setSeleccionadoId(dataPerfil.id_focus);
        }
      } catch (error) {
        mostrarToast('error', 'Error de conexión', 'No pudimos cargar los enfoques.');
      } finally {
        setCargando(false);
      }
    };
    cargarDatos();
  }, [mostrarToast]);

  const manejarGuardar = async () => {
    if (!seleccionadoId || seleccionadoId === enfoqueActualId) return;

    setGuardando(true);
    try {
      const res = await fetch('http://localhost:3000/api/perfil/enfoque', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_focus: seleccionadoId })
      });

      if (res.ok) {
        mostrarToast('exito', 'Nuevo rumbo fijado', 'Tu enfoque ha sido actualizado.');
        navigate('/enfoque-detalle'); 
      } else {
        throw new Error('Error al guardar');
      }
    } catch (error) {
      mostrarToast('error', 'Error', 'No se pudo guardar el cambio.');
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return <div className="min-h-screen flex items-center justify-center text-white">Cargando...</div>;
  }

  const enfoqueSeleccionadoObj = enfoques.find(e => e.Id_enfoque === seleccionadoId);
  const recursosSeleccionados = seleccionadoId ? (recursosEnfoque[seleccionadoId] || fallbackRecurso) : fallbackRecurso;
  const IconoConfirmacion = recursosSeleccionados.icono;
  const huboCambio = seleccionadoId !== enfoqueActualId;

  return (
    <div className="relative min-h-screen flex flex-col pb-12">
      <PageHeader 
        titulo="Elige tu camino" 
        rutaVolver="/enfoque-detalle" 
        textoVolver="Cancelar" 
      />

      <div className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-4 flex flex-col xl:flex-row gap-8">
        
        {/* Columna Izquierda: Cuadrícula de Selección */}
        <div className="flex-1">
          <p className="text-zinc-400 mb-6 text-sm">
            Selecciona el enfoque que mejor se adapte a tus metas actuales. Esto ajustará los consejos y métricas de tus reportes semanales.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {enfoques.map((enfoque) => {
              const esSeleccionado = seleccionadoId === enfoque.Id_enfoque;
              const esActual = enfoqueActualId === enfoque.Id_enfoque;
              const recursos = recursosEnfoque[enfoque.Id_enfoque] || fallbackRecurso;
              const Icono = recursos.icono;

              return (
                <button
                  key={enfoque.Id_enfoque}
                  onClick={() => setSeleccionadoId(enfoque.Id_enfoque)}
                  className={`relative p-5 rounded-2xl text-left transition-all duration-300 border-2 ${
                    esSeleccionado 
                      ? 'scale-[1.02] shadow-xl' 
                      : 'bg-[#2a2a2a] border-transparent hover:bg-zinc-800 hover:border-zinc-600'
                  }`}
                  style={esSeleccionado ? { backgroundColor: `${recursos.color}15`, borderColor: recursos.color } : {}}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl" style={{ backgroundColor: `${recursos.color}20` }}>
                        <Icono className="w-6 h-6" style={{ color: recursos.color }} />
                      </div>
                      <h3 className={`font-bold text-lg ${esSeleccionado ? 'text-white' : 'text-zinc-200'}`}>
                        {enfoque.nombre_enf}
                      </h3>
                    </div>
                    
                    {esSeleccionado ? (
                      <CheckSolid className="w-6 h-6 shrink-0" style={{ color: recursos.color }} />
                    ) : esActual ? (
                      <span className="text-[10px] uppercase tracking-wider bg-zinc-700 text-zinc-300 px-2 py-1 rounded-full shrink-0">Actual</span>
                    ) : (
                      <CheckCircleIcon className="w-6 h-6 text-zinc-600 shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-zinc-400 line-clamp-2 leading-relaxed ml-11">
                    {enfoque.descrip_enf}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Columna Derecha: Panel de Confirmación Flotante */}
        <div className="w-full xl:w-96 shrink-0">
          <div className="sticky top-8 bg-[#1a1a1a] border border-zinc-800 rounded-3xl p-6 shadow-2xl flex flex-col min-h-[320px]">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center transition-colors duration-300" 
                   style={{ backgroundColor: `${recursosSeleccionados.color}20` }}>
                <IconoConfirmacion className="w-7 h-7 transition-colors duration-300" style={{ color: recursosSeleccionados.color }} />
              </div>
              <h2 className="text-white text-xl font-bold">
                {enfoqueSeleccionadoObj?.nombre_enf}
              </h2>
            </div>
            
            <p className="text-zinc-400 text-sm leading-relaxed mb-8 flex-1">
              {enfoqueSeleccionadoObj?.descrip_enf}
            </p>

            <button
              onClick={manejarGuardar}
              disabled={!huboCambio || guardando}
              className={`w-full py-4 rounded-full font-bold text-lg transition-all duration-300 ${
                huboCambio && !guardando
                  ? 'text-[#1a1a1a] hover:scale-105 hover:shadow-lg' 
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              }`}
              style={huboCambio && !guardando ? { backgroundColor: recursosSeleccionados.color } : {}}
            >
              {guardando ? 'Guardando...' : huboCambio ? 'Confirmar cambio' : 'Enfoque actual'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}