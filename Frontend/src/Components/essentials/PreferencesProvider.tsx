import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react';
import { PreferencesContext } from '../../utils/preferencesContext';

const API_URL = 'http://localhost:3000/api/preferencias';

interface PreferenciaApi {
  Id_preferencia: number;
  nombre: string;
  mostrar_simplificado: boolean;
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [valores, setValores] = useState<Record<string, boolean>>({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    fetch(API_URL)
      .then(async (response) => {
        const body: unknown = await response.json();
        if (!response.ok) {
          const mensaje = typeof body === 'object' && body !== null && 'error' in body
            ? String(body.error)
            : 'No se pudieron cargar las preferencias.';
          throw new Error(mensaje);
        }
        if (!Array.isArray(body)) {
          throw new Error('El servidor devolvió un catálogo de preferencias inválido.');
        }
        return body as PreferenciaApi[];
      })
      .then((preferencias) => {
        if (cancelado) return;
        setValores(Object.fromEntries(
          preferencias.map((preferencia) => [
            preferencia.nombre,
            Boolean(preferencia.mostrar_simplificado)
          ])
        ));
      })
      .catch((error: unknown) => {
        if (cancelado) return;
        setError(error instanceof Error ? error.message : 'Error desconocido al cargar preferencias.');
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, []);

  const actualizar = useCallback(async (nombre: string, mostrarSimplificado: boolean) => {
    const response = await fetch(`${API_URL}/${encodeURIComponent(nombre)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mostrar_simplificado: mostrarSimplificado })
    });
    const body: unknown = await response.json();
    if (!response.ok) {
      const mensaje = typeof body === 'object' && body !== null && 'error' in body
        ? String(body.error)
        : 'No se pudo actualizar la preferencia.';
      throw new Error(mensaje);
    }

    const preferencia = body as PreferenciaApi;
    setValores((actuales) => ({
      ...actuales,
      [preferencia.nombre]: Boolean(preferencia.mostrar_simplificado)
    }));
  }, []);

  const value = useMemo(() => ({ valores, cargando, error, actualizar }), [
    valores,
    cargando,
    error,
    actualizar
  ]);

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}
