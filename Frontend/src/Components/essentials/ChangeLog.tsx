import { useEffect, useState } from 'react'
import { ClockIcon, SparklesIcon } from '@heroicons/react/24/outline'
import PageHeader from './Page-head'

interface RegistroCambio {
  id: string
  fecha: string
  version: string
  titulo: string
  resumen: string
  cambios: string[]
}

const registroActual: RegistroCambio = {
  id: 'V2-beta01',
  fecha: '2026-10-05',
  version: 'V2-beta01',
  titulo: 'Actividades más rápidas y una mejor planificación',
  resumen: 'Esta actualización incorpora herramientas para registrar actividades con menos pasos, organizar un día ideal y proteger el acceso al perfil.',
  cambios: [
    'Registra varias actividades seguidas sin salir del formulario y guarda una actividad como plantilla para reutilizarla.',
    'Usa plantillas para rellenar rápidamente el tipo, la descripción y la duración de una actividad; también puedes consultarlas y eliminarlas.',
    'Organiza bloques de actividades en una vista de 24 horas para diseñar la estructura de tu día ideal.',
    'Añade una pista al configurar el PIN. Si fallas tres veces al entrar, la pantalla la muestra para ayudarte a recordarlo.'
  ]
}

const esRegistroCambio = (valor: unknown): valor is RegistroCambio => {
  if (typeof valor !== 'object' || valor === null) return false
  const registro = valor as Partial<RegistroCambio>
  return typeof registro.id === 'string'
    && typeof registro.fecha === 'string'
    && typeof registro.version === 'string'
    && typeof registro.titulo === 'string'
    && typeof registro.resumen === 'string'
    && Array.isArray(registro.cambios)
    && registro.cambios.every((cambio) => typeof cambio === 'string')
}

const formatearFecha = (fecha: string): string => {
  const valorFecha = new Date(`${fecha}T00:00:00`)
  if (Number.isNaN(valorFecha.getTime())) return fecha
  return new Intl.DateTimeFormat('es', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(valorFecha)
}

export default function ChangeLog() {
  const [registros, setRegistros] = useState<RegistroCambio[]>([registroActual])
  const [errorCarga, setErrorCarga] = useState<string | null>(null)

  useEffect(() => {
    let activo = true

    const cargarRegistros = async () => {
      try {
        const respuesta = await fetch('/novedades.json', { cache: 'no-store' })
        if (respuesta.status === 404) return
        if (!respuesta.ok) {
          throw new Error(`No se pudo cargar el registro de cambios (${respuesta.status}).`)
        }

        const datos: unknown = await respuesta.json()
        if (!Array.isArray(datos) || !datos.every(esRegistroCambio)) {
          throw new Error('El archivo de novedades tiene un formato no válido.')
        }

        if (activo) {
          const registrosPorId = new Map<string, RegistroCambio>([
            [registroActual.id, registroActual],
            ...datos.map((registro) => [registro.id, registro] as const)
          ])
          setRegistros([...registrosPorId.values()].sort((a, b) => b.fecha.localeCompare(a.fecha)))
        }
      } catch (error) {
        console.error('No se pudo cargar el registro de cambios:', error)
        if (activo) {
          setErrorCarga('No se pudieron cargar algunas novedades. Se muestra el registro incluido en esta versión.')
        }
      }
    }

    void cargarRegistros()
    return () => {
      activo = false
    }
  }, [])

  return (
    <main className="relative z-10 w-full min-h-screen px-4 pb-12">
      <PageHeader titulo="Registro de cambios" />

      <section className="mx-auto mt-2 max-w-4xl">
        <div className="mb-8 rounded-3xl border border-white/10 bg-black/35 p-6 text-center shadow-xl backdrop-blur-sm sm:p-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#5ecfb8]/15 text-[#5ecfb8]">
            <SparklesIcon className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-white sm:text-2xl">Lo nuevo en Focus</h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-zinc-300 sm:text-base">
            Aquí encontrarás las mejoras y novedades de la aplicación, explicadas de forma sencilla.
          </p>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#5ecfb8]">
            {registros.length} {registros.length === 1 ? 'actualización registrada' : 'actualizaciones registradas'}
          </p>
        </div>

        {errorCarga && (
          <p role="status" className="mb-5 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
            {errorCarga}
          </p>
        )}

        <div className="space-y-5">
          {registros.map((registro) => (
            <article
              key={registro.id}
              className="overflow-hidden rounded-3xl border border-white/10 bg-[#1a1a1a]/90 shadow-xl"
            >
              <div className="border-b border-white/10 bg-white/[0.03] p-5 sm:p-7">
                <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-zinc-400">
                  <span className="inline-flex items-center gap-2">
                    <ClockIcon className="h-4 w-4 text-[#5ecfb8]" />
                    <time dateTime={registro.fecha}>{formatearFecha(registro.fecha)}</time>
                  </span>
                  <span className="rounded-full border border-[#5ecfb8]/30 bg-[#5ecfb8]/10 px-3 py-1 text-xs font-semibold text-[#8de3d4]">
                    Versión {registro.version}
                  </span>
                </div>
                <h3 className="text-xl font-bold leading-snug text-white sm:text-2xl">{registro.titulo}</h3>
                <p className="mt-3 leading-7 text-zinc-300">{registro.resumen}</p>
              </div>

              <ul className="space-y-3 p-5 sm:p-7">
                {registro.cambios.map((cambio) => (
                  <li key={cambio} className="flex gap-3 leading-6 text-zinc-200">
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#5ecfb8]" />
                    <span>{cambio}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-zinc-400">
          Los registros se mantienen en el frontend; esta pantalla no necesita conexión con el backend.
        </p>
      </section>
    </main>
  )
}
