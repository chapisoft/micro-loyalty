import { AppButton, AppLabel, AppLoading } from 'components';
import React, { useRef, useState } from 'react';

interface FileObject {
  name?: string;
  fileName?: string;
  // Add other properties as needed
}

interface SimpleFileUploadProps {
  inputId?: string;
  label?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  caption?: string;
  showCaption?: boolean;
  size?: number;
  accept?: string;
  multiple?: boolean;
  files?: (File)[];
  file?: File | null;
  onChange?: (data: File | (File)[] | null) => void;
  onViewAttachment?: (file: File) => void;
}

const SimpleFileUpload: React.FC<SimpleFileUploadProps> = ({
  inputId = '',
  label = '',
  required = false,
  error = '',
  disabled = false,
  caption = '',
  showCaption = false,
  size = 10, // Default max size: 10MB
  accept = '',
  multiple = false,
  files = [],
  file = null,
  onChange = () => {},
  onViewAttachment = () => {},
}) => {
  const buttonFileInput = useRef<HTMLButtonElement | null>(null);
  const fileInput = useRef<HTMLInputElement | null>(null);
  const [internalError, setInternalError] = useState('');

  const validateFile = (file: File): string => {
    const { name, size: fileSize } = file;
    const fileExtension = name.substring(name.lastIndexOf('.')).toLowerCase();
    if (accept && !accept.toLowerCase().includes(fileExtension)) {
      return `File không đúng định dạng. Chỉ chấp nhận: ${accept}`;
    }
    if (fileSize > size * 1024 * 1024) {
      return `File không được phép vượt quá ${size}MB`;
    }
    return '';
  };

  const handleDragOver = (event: React.DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (buttonFileInput.current && !disabled) {
      buttonFileInput.current.style.borderColor = 'var(--primary-color)';
    }
  };

  const handleDragLeave = (event: React.DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (buttonFileInput.current) {
      buttonFileInput.current.style.borderColor = '';
    }
  };

  const handleDeleteFile = (fileToDelete?: File) => {
    setInternalError('');
    if (!multiple) {
      onChange(null);
    } else {
      const updatedFiles = files.filter((f) => f !== fileToDelete);
      onChange(updatedFiles.length > 0 ? updatedFiles : []);
    }
    if (fileInput.current) {
      fileInput.current.value = '';
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLButtonElement>, type: 'INPUT' | 'DROP' = 'INPUT') => {
    event.preventDefault();
    const filesTemp = type === 'INPUT' ? (event as React.ChangeEvent<HTMLInputElement>).target.files : (event as React.DragEvent<HTMLButtonElement>).dataTransfer.files;
    if (!filesTemp || filesTemp.length === 0) return;

    setInternalError('');
    if (!multiple) {
      const selectedFile = filesTemp[0];
      const error = validateFile(selectedFile);
      setInternalError(error);
      if (!error) {
        console.log('Selected file:', selectedFile); // Debug log
        onChange(selectedFile);
      } else {
        onChange(null);
      }
    } else {
      const newFiles = Array.from(filesTemp);
      const totalSize = newFiles.reduce((sum, f) => sum + f.size, 0);
      const existingFiles = files.filter((f) => !(f instanceof File)) as File[];
      let error = '';

      for (const f of newFiles) {
        error = validateFile(f);
        if (error) break;
      }

      if (!error && totalSize > size * 1024 * 1024) {
        error = `Tổng kích thước các file không được phép vượt quá ${size}MB`;
        setInternalError(error);
      }

      if (!error) {
        console.log('Selected files:', newFiles); // Debug log
        onChange([...existingFiles, ...newFiles]);
      } else {
        onChange(files);
      }
    }

    if (fileInput.current) {
      fileInput.current.value = '';
    }
  };

  return (
    <AppLabel
      inputId={inputId}
      label={label}
      required={required}
      error={internalError || error}
      disabled={disabled}
      caption={caption}
      showCaption={showCaption}
    >
      <button
        type="button"
        ref={buttonFileInput}
        className={`p-inputtext cursor-pointer border-dashed pt-3 pb-3 ${internalError || error ? 'ng-invalid ng-dirty' : ''}`}
        onClick={() => !disabled && fileInput.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={(event) => handleChange(event, 'DROP')}
        disabled={disabled}
      >
        <div className="relative">
          <div className="text-lg text-center">
            Kéo thả file hoặc <b className="text-primary-500">Chọn tệp</b> để tải lên
          </div>
          {accept ? (
            <div className="text-center mt-2">
                (Cho phép dung lượng tối đa {size}MB và chỉ chấp nhận định dạng {accept})
            </div>
          ) : (
            <div className="text-center mt-2">
                (Cho phép dung lượng tối đa {size}MB)
            </div>
          )}
          <AppLoading loading={false} />
        </div>
      </button>
      <input
        ref={fileInput}
        type="file"
        id={inputId}
        accept={accept}
        onChange={(event) => handleChange(event, 'INPUT')}
        hidden
        multiple={multiple}
        required={required}
        disabled={disabled}
      />

      {(!multiple && file && file.name && (
        <div className="flex justify-content-between align-items-center pt-2 pb-2 custom-file">
          <div className="custom-file-name cursor-pointer" onClick={() => onViewAttachment(file)}>
            {(file as File).name ?? (file as FileObject).fileName}
          </div>
          <AppButton variant="idelete" onClick={() => handleDeleteFile()} />
        </div>
      ))}

      {multiple && files.length > 0 && (
        <div className="max-h-20rem overflow-y-scroll">
          {files.map((file, index) => (
            <div key={index} className="flex justify-content-between align-items-center pt-1 pb-1 custom-file">
              <div className="custom-file-name cursor-pointer" onClick={() => onViewAttachment(file)}>
                {(file as File).name ?? (file as FileObject).fileName}
              </div>
              <AppButton variant="idelete" onClick={() => handleDeleteFile(file)} />
            </div>
          ))}
        </div>
      )}
    </AppLabel>
  );
};

export default SimpleFileUpload;