import { Toast, ToastMessage, ToastProps } from 'primereact/toast';
import { createContext, forwardRef, RefObject, useContext, useImperativeHandle, useRef } from 'react';

const AppToast = forwardRef((props: ToastProps, ref) => {
  const toastRef = useRef<Toast>(null);

  useImperativeHandle(ref, () => ({
    show: (message: ToastMessage) => {
      toastRef.current?.show(message);
    },
    clear: () => {
      toastRef.current?.clear();
    },
  }));

  return <Toast ref={toastRef} {...props} />;
});

const ToastContext = createContext<RefObject<Toast> | null>(null);

const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const toastRef = useRef<Toast>(null);

  return (
    <ToastContext.Provider value={toastRef}>
      <AppToast ref={toastRef} />
      {children}
    </ToastContext.Provider>
  );
};

const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export { AppToast, ToastProvider, useToast };
