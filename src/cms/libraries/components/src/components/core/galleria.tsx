import { Galleria, GalleriaProps } from 'primereact/galleria';
import React from 'react';

type AppGalleriaProps = GalleriaProps;

const AppGalleria: React.FC<AppGalleriaProps> = ({ ...props }: AppGalleriaProps) => {
  return <Galleria {...props}></Galleria>;
};

export { AppGalleria };
