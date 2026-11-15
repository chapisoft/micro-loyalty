import React, { Suspense } from 'react';
import { AnimationOutlet } from 'components';
import { ProgressSpinner } from 'primereact/progressspinner';
import Header from './components/Header';

const PageLoadingFallback: React.FC = () => (
  <div
    className="flex flex-column align-items-center justify-content-center w-full"
    style={{ minHeight: '50vh', gap: '1rem' }}
  >
    <ProgressSpinner
      style={{ width: '48px', height: '48px' }}
      strokeWidth="4"
      animationDuration=".8s"
    />
    <span className="text-600 font-medium text-sm">Loading Loyalty CMS...</span>
  </div>
);

const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-column surface-ground">
      <Header />
      <main className="flex-1 px-3 py-2 md:px-4 md:py-3 overflow-auto w-full" style={{ width: '100%', maxWidth: '100%' }}>
        <Suspense fallback={<PageLoadingFallback />}>
          <AnimationOutlet />
        </Suspense>
      </main>
    </div>
  );
};

export default MainLayout;
