import { useCallback, useEffect, useRef, useState } from 'react';
import { MEDIA_NEWS_DOMAIN_HOST } from '@/assets/config';
import { AppFile } from 'components';
import { Button } from 'primereact/button';
import { Image } from 'primereact/image';

import Show from '../Show/Show';

export interface ProductImage {
  id?: number;
  fileId?: number;
  path: string;
  isDelete: boolean;
  url: string;
}

export interface FileUploaderProps {
  onChange?: (files: File[]) => void;
  disabled?: boolean;
  files?: ProductImage[];
  onDeletedFiles?: (id: number) => void;
  multiple?: boolean;
  maxLength?: number;
}

export const FileUploader = ({
  onChange,
  disabled,
  files,
  onDeletedFiles,
  multiple = true,
  maxLength = 10,
  ...props
}: FileUploaderProps) => {
  const [fileData, setFileData] = useState<{ fileId?: number; url: string; file: File }[]>([]);

  const triggerOnChange = useCallback(
    (updatedFiles: { fileId?: number; file: File }[]) => {
      onChange?.(updatedFiles.filter((file) => !file.fileId).map((item) => item.file));
    },
    [onChange]
  );

  const handleFileChange = (data: File[]) => {
    const newFiles = data.map((file) => {
      return {
        url: URL.createObjectURL(file),
        file,
      };
    });
    setFileData((prev) => {
      const updatedFiles = [...prev, ...newFiles];
      triggerOnChange(updatedFiles);
      return updatedFiles;
    });
  };

  const handleDelete = (index: number) => {
    const deletedFile = fileData[index];
    if (deletedFile.fileId !== undefined) {
      onDeletedFiles?.(deletedFile.fileId);
    }
    setFileData((prev) => {
      const updatedFiles = prev.filter((_, i) => i !== index);
      triggerOnChange(updatedFiles);
      return updatedFiles;
    });
  };

  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current || !files) return;

    initializedRef.current = true; // mark as initialized
    console.log('Initializing file data from props.files:', files);

    const initialFiles = files?.map((image, index) => ({
      fileId: image.fileId ?? index,
      url: `${MEDIA_NEWS_DOMAIN_HOST}/${image.url}`,
      file: new File([new Blob()], image.path),
    }));

    setFileData(initialFiles);
    setTimeout(() => {
      triggerOnChange(initialFiles);
    }, 0);
  }, [files, triggerOnChange]);

  return (
    <div>
      <Show when={!disabled && fileData.length < maxLength}>
        <AppFile accept=".png, .jpg, .jpeg" multiple={multiple} onChange={handleFileChange} size={5} {...props} />
      </Show>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '20px' }}>
        {fileData?.map((fileObj, index) => (
          <div key={fileObj.fileId ?? `file-uploader-${index}`} style={{ position: 'relative' }}>
            <Image src={fileObj.url} alt={`Preview ${index}`} preview width="200" height="200" />
            <Show when={!disabled}>
              <Button
                icon="pi pi-times"
                className="p-button-rounded p-button-danger p-button-sm"
                style={{
                  position: 'absolute',
                  top: '5px',
                  right: '5px',
                  zIndex: 10,
                }}
                onClick={() => handleDelete(index)}
              />
            </Show>
          </div>
        ))}
      </div>
    </div>
  );
};
