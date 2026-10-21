import { createContext, useState, useContext, useCallback, useEffect, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { usePreferences } from '../../utils/preferencesContext';

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
  toastsXP: ToastData[];
  toastsNotificaciones: ToastData[];
  toastPin: ToastData | null;
  notificacionesHabilitadas: boolean;
  mostrarToast: (
    tipo: ToastType,
    titulo: string,
    mensaje: string,
    urlIcono?: string,
    datosLogro?: LogroNotificacion,
    posicion?: ToastPosition
  ) => void;
  mostrarToastPin: (titulo: string, mensaje: string) => void;
  notificarGamificacion: (logros: LogroNotificacion[], resultadoXP?: ResultadoXPNotificacion | null) => void;
  siguienteToastXP: () => void;
  siguienteToastNotificacion: () => void;
  cerrarToastPin: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toastsXP, setToastsXP] = useState<ToastData[]>([]);
  const [toastsNotificaciones, setToastsNotificaciones] = useState<ToastData[]>([]);
  const [toastPin, setToastPin] = useState<ToastData | null>(null);
  const location = useLocation();
  const [dashboardVisitado, setDashboardVisitado] = useState(
    location.pathname === '/dashboard'
  );
  const { valores: preferencias } = usePreferences();

  useEffect(() => {
    if (location.pathname !== '/dashboard' || dashboardVisitado) return;
    const timer = window.setTimeout(() => setDashboardVisitado(true), 0);
    return () => window.clearTimeout(timer);
  }, [dashboardVisitado, location.pathname]);
  const notificacionesHabilitadas =
    location.pathname !== '/' && (location.pathname === '/dashboard' || dashboardVisitado);

  const seMuestraEnModoSimple = useCallback((clave: string) =>
    localStorage.getItem('focus_modo_simple') !== 'true' || preferencias[clave] !== false,
  [preferencias]);

  const mostrarToast = useCallback((
    tipo: ToastType,
    titulo: string,
    mensaje: string,
    urlIcono = '',
    datosLogro?: LogroNotificacion,
    posicion: ToastPosition = 'top-center'
  ) => {
    const preferencia = tipo === 'reporte'
      ? 'toast_sys_resumen'
      : tipo === 'xp'
        ? 'toast_xp'
        : tipo === 'logro'
          ? (datosLogro?.coleccion === 'HITO' ? 'toast_hito' : 'toast_logro')
          : 'toast_sys_general';
    if (!seMuestraEnModoSimple(preferencia)) return;

    const posicionToast = tipo === 'xp' ? 'bottom-left' : posicion;
    const toast: ToastData = {
      id: Date.now() + Math.random(),
      tipo,
      titulo,
      mensaje,
      urlIcono,
      datosLogro,
      posicion: posicionToast
    };
    if (posicionToast === 'bottom-left') {
      setToastsXP((actuales) => [...actuales, toast]);
    } else {
      setToastsNotificaciones((actuales) => [...actuales, toast]);
    }
  }, [seMuestraEnModoSimple]);

  const mostrarToastPin = useCallback((titulo: string, mensaje: string) => {
    if (!seMuestraEnModoSimple('toast_sys_general')) return;
    setToastPin({
      id: Date.now() + Math.random(),
      tipo: 'advertencia',
      titulo,
      mensaje,
      posicion: 'top-center'
    });
  }, [seMuestraEnModoSimple]);

  const notificarGamificacion = useCallback((
    logros: LogroNotificacion[],
    resultadoXP?: ResultadoXPNotificacion | null
  ) => {
    const toastsXPNuevos: Omit<ToastData, 'id'>[] = [];
    const notificacionesNuevas: Omit<ToastData, 'id'>[] = [];

    if (resultadoXP && resultadoXP.xpOtorgada > 0 && seMuestraEnModoSimple('toast_xp')) {
      toastsXPNuevos.push({
        tipo: 'xp',
        titulo: `+${resultadoXP.xpOtorgada} XP`,
        mensaje: 'Experiencia acumulada.',
        posicion: 'bottom-left'
      });

      if (resultadoXP.subioNivel && seMuestraEnModoSimple('toast_subida_nivel')) {
        notificacionesNuevas.push({
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
      const preferencia = logro.coleccion === 'HITO' ? 'toast_hito' : 'toast_logro';
      if (!seMuestraEnModoSimple(preferencia)) continue;
      notificacionesNuevas.push({
        tipo: 'logro',
        titulo: logro.nombre_recompensa ?? '¡Logro desbloqueado!',
        mensaje: logro.descripcion ?? '',
        datosLogro: logro,
        posicion: 'top-center'
      });
    }

    if (toastsXPNuevos.length > 0) {
      setToastsXP((actuales) => [
        ...actuales,
        ...toastsXPNuevos.map((notificacion) => ({
          ...notificacion,
          id: Date.now() + Math.random()
        }))
      ]);
    }
    if (notificacionesNuevas.length > 0) {
      setToastsNotificaciones((actuales) => [
        ...actuales,
        ...notificacionesNuevas.map((notificacion) => ({
          ...notificacion,
          id: Date.now() + Math.random()
        }))
      ]);
    }

    if (resultadoXP && resultadoXP.xpOtorgada > 0) {
      window.dispatchEvent(new Event('focus-xp-updated'));
    }
  }, [seMuestraEnModoSimple]);

  const siguienteToastXP = useCallback(() => {
    setToastsXP((actuales) => actuales.slice(1));
  }, []);
  const siguienteToastNotificacion = useCallback(() => {
    setToastsNotificaciones((actuales) => actuales.slice(1));
  }, []);
  const cerrarToastPin = useCallback(() => setToastPin(null), []);

  return (
    <ToastContext.Provider value={{
      toastsXP,
      toastsNotificaciones,
      toastPin,
      notificacionesHabilitadas,
      mostrarToast,
      mostrarToastPin,
      notificarGamificacion,
      siguienteToastXP,
      siguienteToastNotificacion,
      cerrarToastPin
    }}>
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
