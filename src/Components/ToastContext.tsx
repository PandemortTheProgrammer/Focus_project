import { createContext, useState, useContext, type ReactNode } from 'react';
import ToastNotification from './ToastNotification';

type ToastType = 'exito' | 'error' | 'advertencia' | 'logro' | 'reporte';

interface ToastState {
  visible: boolean;
  tipo: ToastType;
  titulo: string;
  mensaje: string;
  urlIcono?: string;
}

interface ToastContextType {
  mostrarToast: (tipo: ToastType, titulo: string, mensaje: string, urlIcono?: string) => void;
}

// Creamos el contexto
const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Creamos el Provider que envolverá nuestra aplicación
export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    tipo: 'exito',
    titulo: '',
    mensaje: '',
    urlIcono: ''
  });

  const mostrarToast = (tipo: ToastType, titulo: string, mensaje: string, urlIcono = '') => {
    setToast({ visible: true, tipo, titulo, mensaje, urlIcono });
  };

  const cerrarToast = () => {
    setToast((prev) => ({ ...prev, visible: false }));
  };

  return (
    <ToastContext.Provider value={{ mostrarToast }}>
      {children}
      {/* El Toast vive aquí, a nivel global, por encima de todas las rutas */}
      <ToastNotification 
        visible={toast.visible} 
        tipo={toast.tipo} 
        titulo={toast.titulo} 
        mensaje={toast.mensaje} 
        urlIcono={toast.urlIcono}
        onClose={cerrarToast} 
      />
    </ToastContext.Provider>
  );
};

// Hook personalizado para usar el toast fácilmente en cualquier pantalla
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast debe ser usado dentro de un ToastProvider');
  }
  return context;
};