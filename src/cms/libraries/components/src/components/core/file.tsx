import React, { useRef, useState } from 'react';
import { FileObject } from '../../interface';
import { AppButton } from './button';
import { AppLabel, AppLabelProps } from './label';
import _ from 'lodash';
import { AppLoading } from './loading';
import './file.scss';
interface FileProps {
  size?: number;
  accept?: string;
  multiple?: boolean;
  files?: (File | FileObject)[];
  file?: any;
  getInternalError?: boolean;
  autoUpload?: boolean;
  service?: string;
  onChange?: any;
  uploadFileMutation?: any;

  uploadMultipleFiles?: any;
}
export type AppFileProps = FileProps & AppLabelProps;

const AppFile: React.FC<AppFileProps> = ({
  inputId = '',
  label = '',
  required = false,
  error = '',
  disabled = false,
  caption = '',
  showCaption = false,
  size = 10,
  accept = '',
  multiple = false,
  files = [],
  file = null,
  getInternalError = false,
  autoUpload = false,
  onChange = () => {},
  service = '',
  uploadFileMutation,
}: AppFileProps) => {
  const buttonFileInput = useRef<HTMLButtonElement | null>(null);
  const fileInput = useRef<HTMLInputElement | null>(null);
  const [internalError, setInternalError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDragOver = (event: React.DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (buttonFileInput && buttonFileInput.current) {
      buttonFileInput.current.style.borderColor = 'var(--primary-color)';
    }
  };

  const handleDragLeave = (event: React.DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (buttonFileInput && buttonFileInput.current) {
      buttonFileInput.current.style.borderColor = '';
    }
  };

  const handleDeleteFile = (file: any = null) => {
    setInternalError('');
    if (!multiple) {
      file = null;
      emitDataOnChange(file);
    } else {
      const tfiles = Array.from(files).filter((item: any) => !_.isEqual(item, file));
      emitDataOnChange(tfiles);
    }
  };

  const uploadFile = (file: File) => {
    if (file instanceof File) {
      setLoading(true);
      const formData = new FormData();
      formData.append('service', service);
      formData.append('file', file);

      uploadFileMutation.mutate(formData, {
        onSuccess: (res: any) => {
          file = res?.data;
          emitDataOnChange(file);
        },
        onError: (error: any) => {
          console.error('Error uploading file:', error);
        },
        onSettled: () => {
          setLoading(false);
        },
      });
    }
  };

  const uploadFiles = (files: (File | FileObject)[]) => {
    const uploadFiles = files.filter((item) => item instanceof File) as File[];
    const noUploadFiles = files.filter((item) => !(item instanceof File)) as FileObject[];
    if (uploadFiles.length > 0) {
      setLoading(true);
      const formData = new FormData();

      formData.append('service', service);

      for (let i = 0; i < uploadFiles.length; i++) {
        formData.append('files', uploadFiles[i]);
      }

      uploadFileMutation.mutate(formData, {
        onSuccess: (res: any) => {
          files = [...noUploadFiles, ...res?.data];
          emitDataOnChange(files);
        },
        onError: (error: any) => {
          console.error('Error uploading files:', error);
        },
        onSettled: () => {
          setLoading(false);
        },
      });
    }
  };

  const validateFile = (file: File) => {
    let error = '';
    const { name, size: fileSize } = file ?? {};
    const fileExtension = name?.substring(name.lastIndexOf('.'))?.toLowerCase();
    if (fileExtension && !accept.includes(fileExtension)) {
      error = 'File không đúng định dạng';
    } else if (fileSize > size * 1024 * 1024) {
      error = `File không được phép vượt quá ${size}MB`;
    }
    return error;
  };

  const emitDataOnChange = (data: (File | FileObject) | (File | FileObject)[]) => {
    if (getInternalError) {
      if (multiple) {
        onChange({ files: data, error: internalError });
      } else {
        onChange({ file: data, error: internalError });
      }
    } else {
      onChange(data);
    }
  };

  const handleChangeAutoUpload = (filesTemp: any) => {
    setInternalError('');
    if (!multiple) {
      const tfile = filesTemp[0];
      const error = validateFile(tfile);
      setInternalError(error);
      if (error.length > 0) {
        file = null;
        emitDataOnChange(file);
      } else {
        uploadFile(tfile);
      }
    } else {
      const tfiles = [...files, ...filesTemp];
      let sizeTotal = 0;
      for (let i = 0; i < tfiles.length; i++) {
        const error = validateFile(tfiles[i]);
        setInternalError(error);
        sizeTotal += +tfiles[i].size;
        if (error.length > 0) break;
      }

      let totalSizeError = '';

      if (sizeTotal > size * 1024 * 1024) {
        totalSizeError = `Tổng kích thước các file không được phép vượt quá ${size}MB`;
        setInternalError(totalSizeError);
      }
      if (error.length > 0 || totalSizeError.length > 0) {
        emitDataOnChange(files);
      } else {
        uploadFiles(tfiles);
      }
    }
    if (fileInput.current) {
      (fileInput.current as any).value = '';
    }
  };

  const handleChangeNoAutoUpload = (filesTemp: any) => {
    setInternalError('');
    if (!multiple) {
      const tfile = filesTemp[0];
      const error = validateFile(tfile);
      setInternalError(error);

      if (error.length > 0) {
        file = null;
        emitDataOnChange(file);
      } else {
        emitDataOnChange(tfile);
      }
    } else {
      const tfiles = [...files, ...filesTemp];
      let sizeTotal = 0;
      for (let i = 0; i < tfiles.length; i++) {
        const error = validateFile(tfiles[i]);
        setInternalError(error);
        sizeTotal += +tfiles[i].size;
        if (error.length > 0) break;
      }

      let totalSizeError = '';

      if (sizeTotal > size * 1024 * 1024) {
        totalSizeError = `Tổng kích thước các file không được phép vượt quá ${size}MB`;
        setInternalError(totalSizeError);
      }

      if (internalError.length > 0 || totalSizeError.length > 0) {
        emitDataOnChange(files);
      } else {
        emitDataOnChange(tfiles);
      }
    }
    if (fileInput.current) {
      (fileInput.current as any).value = '';
    }
  };

  const handleChange = (event: any, type: string = 'INPUT') => {
    event.preventDefault();
    const filesTemp = type === 'INPUT' ? event.target.files : event.dataTransfer.files;
    if (autoUpload) {
      handleChangeAutoUpload(filesTemp);
    } else {
      handleChangeNoAutoUpload(filesTemp);
    }
  };

  const viewAttachment = (file: File | FileObject) => {
    if (file instanceof File) {
      // Đối với File, cần chuyển đổi thành Object URL để xem
      const fileURL = URL.createObjectURL(file);
      window.open(fileURL, '_blank');
    } else if (file && file.path && file.mediaHost) {
      // Đối với Image hoặc Video đã được upload, sử dụng URL có sẵn
      window.open(file.mediaHost + file.path, '_blank');
    }
  };

  return (
    <AppLabel
      inputId={inputId}
      label={label}
      required={required}
      error={internalError.length > 0 ? internalError : error}
      disabled={disabled}
      caption={caption}
      showCaption={showCaption}
    >
      <button
        type="button"
        ref={buttonFileInput}
        className={`p-inputtext cursor-pointer border-dashed pt-3 pb-3 ${
          error || internalError ? 'ng-invalid ng-dirty' : ''
        }`}
        onClick={() => (fileInput?.current as any)?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={(event) => handleChange(event, 'DROP')}
      >
        <div className="relative">
          <div className="text-lg text-center">
            Kéo thả file hoặc <b className="text-primary-500">Chọn tệp</b> để tải lên
          </div>
          <div className="text-center mt-2">
            (Cho phép dung lượng tối đa {size}MB và chỉ chấp nhận định dạng {accept})
          </div>
          <AppLoading loading={loading}></AppLoading>
        </div>
      </button>
      <input
        ref={fileInput}
        type="file"
        id={inputId}
        accept={accept}
        onChange={handleChange}
        hidden
        multiple={multiple}
        required={required}
      />

      {((!multiple && file && file.name && file.name.length > 0) ||
        (!multiple && file && file.fileName && file.fileName.length > 0)) && (
        <div className="flex justify-content-between align-items-center pt-2 pb-2 custom-file">
          <div className="custom-file-name cursor-pointer" onClick={() => viewAttachment(file)}>
            {file.name ?? file.fileName}
          </div>
          <AppButton variant="idelete" onClick={() => handleDeleteFile()} />
        </div>
      )}

      {multiple && files.length > 0 && (
        <div className="max-h-20rem overflow-y-scroll">
          {files.map((file: any, index: number) => (
            <div key={index} className="flex justify-content-between align-items-center pt-1 pb-1 custom-file">
              <div className="custom-file-name cursor-pointer" onClick={() => viewAttachment(file)}>
                {file.name ?? file.fileName}
              </div>
              <AppButton variant="idelete" onClick={() => handleDeleteFile(file)} />
            </div>
          ))}
        </div>
      )}
    </AppLabel>
  );
};
export { AppFile };
