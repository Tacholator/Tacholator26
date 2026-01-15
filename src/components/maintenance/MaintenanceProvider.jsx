import React, { createContext, useContext, useState, useCallback } from 'react';
import MaintenanceBanner from '@/components/ui/MaintenanceBanner';

const MaintenanceContext = createContext(null);

export function MaintenanceProvider({ children }) {
  const [isMaintenanceActive, setIsMaintenanceActive] = useState(false);
  const [lastAction, setLastAction] = useState(null);

  const isMaintenanceError = useCallback((error) => {
    const errorMsg = error?.message || error?.response?.data?.message || error?.toString() || '';
    return (
      errorMsg.includes('Service temporarily unavailable for writes') ||
      errorMsg.includes('Database maintenance in progress') ||
      errorMsg.includes('temporarily unavailable for writes') ||
      errorMsg.includes('read-only') ||
      errorMsg.includes('maintenance in progress')
    );
  }, []);

  const handleMaintenanceError = useCallback((actionName, actionFn, actionPayload) => {
    setIsMaintenanceActive(true);
    setLastAction({ name: actionName, fn: actionFn, payload: actionPayload });
  }, []);

  const retry = useCallback(async () => {
    if (lastAction?.fn) {
      try {
        await lastAction.fn(lastAction.payload);
        setIsMaintenanceActive(false);
        setLastAction(null);
      } catch (error) {
        if (!isMaintenanceError(error)) {
          setIsMaintenanceActive(false);
          setLastAction(null);
          throw error;
        }
      }
    }
  }, [lastAction, isMaintenanceError]);

  const dismiss = useCallback(() => {
    setIsMaintenanceActive(false);
  }, []);

  return (
    <MaintenanceContext.Provider 
      value={{ 
        isMaintenanceActive, 
        isMaintenanceError,
        handleMaintenanceError,
        retry,
        dismiss
      }}
    >
      {isMaintenanceActive && (
        <MaintenanceBanner onRetry={retry} onDismiss={dismiss} />
      )}
      {children}
    </MaintenanceContext.Provider>
  );
}

export function useMaintenance() {
  const context = useContext(MaintenanceContext);
  if (!context) {
    throw new Error('useMaintenance must be used within MaintenanceProvider');
  }
  return context;
}