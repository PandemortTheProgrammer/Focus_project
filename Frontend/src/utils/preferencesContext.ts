import { createContext, useContext } from 'react';

export interface PreferencesContextValue {
  valores: Record<string, boolean>;
  cargando: boolean;
  error: string | null;
  actualizar: (nombre: string, mostrarSimplificado: boolean) => Promise<void>;
}

export const PreferencesContext = createContext<PreferencesContextValue | undefined>(undefined);

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) throw new Error('usePreferences debe usarse dentro de PreferencesProvider');
  return context;
}
