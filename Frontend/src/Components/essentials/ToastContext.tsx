import { createContext, useState, useContext, useCallback, type ReactNode } from 'react';

export type ToastType = 'exito' | 'error' | 'advertencia' | 'logro' | 'reporte' | 'xp';
export type ToastPosition = 'top-center' | 'bottom-left';

export interface LogroNotificacion {
  Id_icono?: number;
  Id_desbloqueado?: number;
  Id_recompensa?: number;
  coleccion?: string;
  descripcion?: string;
  nombre_icono?: string;
  nombre_recompensa?: string;
  tipo_recompensa?: string;
  xp_otorgada?: number;
}

export interface ResultadoXPNotificacion {
  xpOtorgada: number;
  nivelActual: number;
  subioNivel: boolean;
  nivelesEscalados?: number;
  logrosDesbloqueados?: LogroNotificacion[];
}

export interface ToastData {
  id: number;
  tipo: ToastType;
  titulo: string;
  mensaje: string;
  urlIcono?: string;
  datosLogro?: LogroNotificacion;
  posicion: ToastPosition;
}

interface ToastContextType {
  toasts: ToastData[];
  mostrarToast: (
    tipo: ToastType,
    titulo: string,
    mensaje: string,
    urlIcono?: string,
    datosLogro?: LogroNotificacion,
    posicion?: ToastPosition
  ) => void;
  notificarGamificacion: (logros: LogroNotificacion[], resultadoXP?: ResultadoXPNotificacion | null) => void;
  siguienteToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const mostrarToast = useCallback((
    tipo: ToastType,
    titulo: string,
    mensaje: string,
    urlIcono = '',
    datosLogro?: LogroNotificacion,
    posicion: ToastPosition = 'top-center'
  ) => {
    setToasts((actuales) => [
      ...actuales,
      {
        id: Date.now() + Math.random(),
        tipo,
        titulo,
        mensaje,
        urlIcono,
        datosLogro,
        posicion
      }
    ]);
  }, []);

  const notificarGamificacion = useCallback((
    logros: LogroNotificacion[],
    resultadoXP?: ResultadoXPNotificacion | null
  ) => {
    const notificaciones: Omit<ToastData, 'id'>[] = [];

    if (resultadoXP && resultadoXP.xpOtorgada > 0) {
      notificaciones.push({
        tipo: 'xp',
        titulo: `+${resultadoXP.xpOtorgada} XP`,
        mensaje: 'Experiencia acumulada.',
        posicion: 'bottom-left'
      });

      if (resultadoXP.subioNivel) {
        notificaciones.push({
          tipo: 'exito',
          titulo: '¡Subiste de nivel!',
          mensaje: `Has alcanzado el nivel ${resultadoXP.nivelActual} 🎉`,
          posicion: 'top-center'
        });
      }
    }

    const logrosUnicos = new Map<number, LogroNotificacion>();
    for (const logro of [...logros, ...(resultadoXP?.logrosDesbloqueados ?? [])]) {
      const clave = logro.Id_recompensa ?? logrosUnicos.size;
      logrosUnicos.set(clave, logro);
    }

    for (const logro of logrosUnicos.values()) {
      notificaciones.push({
        tipo: 'logro',
        titulo: logro.nombre_recompensa ?? '¡Logro desbloqueado!',
        mensaje: logro.descripcion ?? '',
        datosLogro: logro,
        posicion: 'top-center'
      });
    }

    if (notificaciones.length > 0) {
      setToasts((actuales) => [
        ...actuales,
        ...notificaciones.map((notificacion) => ({
          ...notificacion,
          id: Date.now() + Math.random()
        }))
      ]);
    }

    if (resultadoXP && resultadoXP.xpOtorgada > 0) {
      window.dispatchEvent(new Event('focus-xp-updated'));
    }
  }, []);

  const siguienteToast = useCallback(() => {
    setToasts((actuales) => actuales.slice(1));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, mostrarToast, notificarGamificacion, siguienteToast }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast debe ser usado dentro de un ToastProvider');
  }
  return context;
};
