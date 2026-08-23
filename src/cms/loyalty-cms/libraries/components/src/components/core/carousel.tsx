import { Carousel, CarouselProps } from 'primereact/carousel';
import React from 'react';

type AppCarouselProps = CarouselProps;

const AppCarousel: React.FC<AppCarouselProps> = ({ ...props }: AppCarouselProps) => {
  return <Carousel {...props}></Carousel>;
};

export { AppCarousel };
