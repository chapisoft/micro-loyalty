import React from 'react';
import { useLoading } from '@/context/LoadingContext';
import { ProgressSpinner } from 'primereact/progressspinner';

const GlobalLoading: React.FC = () => {
  const { loading, message } = useLoading();

  if (!loading) return null;

  return (
    <div className="global-loading-mask">
      <div className="loading-content">
        <ProgressSpinner 
          style={{ width: '80px', height: '80px' }} 
          strokeWidth="3" 
          fill="var(--surface-ground)" 
          animationDuration=".5s" 
        />
        {message && <div className="loading-message">{message}</div>}
      </div>
      <style>{`
        .global-loading-mask {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 999999;
          transition: all 0.3s ease;
        }
        .loading-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
          padding: 3rem;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 24px;
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
          animation: scaleIn 0.3s ease-out;
        }
        .loading-message {
          color: white;
          font-size: 1.2rem;
          font-weight: 500;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          letter-spacing: 0.5px;
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default GlobalLoading;
