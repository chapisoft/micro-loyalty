import React from 'react';

interface AppLoadingProps {
  loading: boolean;
  width?: string;
  height?: string;
  zIndex?: number;
}

const AppLoading: React.FC<AppLoadingProps> = ({ loading, width = '100%', height = '100%', zIndex = 995 }) => {
  if (!loading) {
    return null;
  }

  return (
    <div className="absolute top-0 bg-black-alpha-40" style={{ width, height, zIndex }}>
      <div className="flex justify-content-center align-items-center h-full w-full">
        <i className="ti ti-loader-2 pi-spin" style={{ fontSize: '2rem' }}></i>
      </div>
    </div>
  );
};

export { AppLoading };
