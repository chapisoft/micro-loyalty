import React from 'react';
import { AppCarousel, AppImage } from 'components';

type MediaFile = {
  path: string;
  fileName: string;
};

type ImageCarouselProps = {
  mediaFiles?: MediaFile[];
  mediaHost?: string;
  height?: string;
  numVisible?: number;
  numScroll?: number;
};

const ImageCarousel: React.FC<ImageCarouselProps> = ({
  mediaFiles,
  mediaHost,
  height = '200',
  numVisible = 3,
  numScroll = 1,
}) => {
  const isImage = (path: string) => {
    return /\.(png|gif|jpg|jpeg)$/i.test(path);
  };

  const isVideoDownload = (path: string) => {
    return /\.(avi|flv|wmv)$/i.test(path);
  };

  const isVideoView = (path: string) => {
    return /\.(3gp|mov|mp4|mkv)$/i.test(path);
  };

  if (!mediaFiles || mediaFiles.length === 0) {
    return <b>-</b>;
  }

  const carouselItems = mediaFiles.map((file) => ({
    fileName: file.fileName,
    path: mediaHost + file.path,
    isImage: isImage(file.path),
    isVideoView: isVideoView(file.path),
    isVideoDownload: isVideoDownload(file.path),
  }));

  const showButtons = mediaFiles.length > numVisible;

  return (
    <div>
      <AppCarousel
        value={carouselItems}
        numVisible={numVisible}
        numScroll={numScroll}
        showIndicators={showButtons}
        showNavigators={showButtons}
        itemTemplate={(item) => (
          <div className={'m-2 flex justify-content-center h-full'}>
            {item.isImage && <AppImage preview src={item.path} alt="Media" width="100%" height={height} />}
            {item.isVideoView && (
              <video width="100%" height={height} controls>
                <source src={item.path} type="video/mp4" />
                Trình duyệt của bạn không hỗ trợ thẻ video.
              </video>
            )}
            {item.isVideoDownload && (
              <div
                className={
                  'flex flex-column justify-content-center align-items-center h-full bg-gray-500 p-3 border-round cursor-pointer hover:text-primary'
                }
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = item.path;
                  link.download = item.fileName;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
              >
                <i className="pi pi-download text-xl"></i>
                <span className="mt-2">{item.fileName}</span>
              </div>
            )}
          </div>
        )}
      />
    </div>
  );
};

export default ImageCarousel;
