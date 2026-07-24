import { createContext, useState, useContext, type ReactNode } from 'react';
import ToastNotification from './ToastNotification';

type ToastType = 'exito' | 'error' | 'advertencia' | 'logro' | 'reporte';

interface ToastState {
  visible: boolean;
  tipo: ToastType;
  titulo: string;
  mensaje: string;
  urlIcono?: string;
  datosLogro?: any; // <-- Listo para recibir el objeto de la base de datos
}

interface ToastContextType {
  // Añadimos datosLogro como un quinto parámetro opcional
  mostrarToast: (tipo: ToastType, titulo: string, mensaje: string, urlIcono?: string, datosLogro?: any) => void;
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
    urlIcono: '',
    datosLogro: undefined
  });

  // Habilitamos la recepción del nuevo parámetro
  const mostrarToast = (tipo: ToastType, titulo: string, mensaje: string, urlIcono = '', datosLogro?: any) => {
    setToast({ visible: true, tipo, titulo, mensaje, urlIcono, datosLogro });
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
        datosLogro={toast.datosLogro} // <-- Lo inyectamos al componente visual
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