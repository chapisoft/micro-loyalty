import React, { createContext, useContext, useState, useCallback } from 'react';

interface LoadingContextType {
  loading: boolean;
  setLoading: (loading: boolean) => void;
  showLoading: (message?: string) => void;
  hideLoading: () => void;
  message: string;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoadingState] = useState(false);
  const [message, setMessage] = useState('');
  const timeoutRef = React.useRef<any>(null);

  const hideLoading = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setLoadingState(false);
    setMessage('');
  }, []);

  const showLoading = useCallback((msg?: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setMessage(msg || '');
    setLoadingState(true);
    timeoutRef.current = setTimeout(() => hideLoading(), 60000);
  }, [hideLoading]);

  return (
    <LoadingContext.Provider value={{ loading, setLoading: setLoadingState, showLoading, hideLoading, message }}>
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};
