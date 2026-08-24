import React from 'react';

import { Image, ImageProps } from 'primereact/image';

type AppImageProps = ImageProps;

const AppImage: React.FC<AppImageProps> = ({ ...props }: AppImageProps) => {
  return <Image {...props}></Image>;
};

export { AppImage };
